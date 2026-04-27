import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ListingKind,
  ListingStatus,
  Prisma,
  SellerType,
  VehicleCategory,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { OutboxService } from '../outbox/outbox.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import type { CreateListingDto } from './dto/create-listing.dto';
import type { ListListingsQueryDto } from './dto/list-listings.query.dto';
import type { UpdateListingDto } from './dto/update-listing.dto';
import { decodeListingCursor, encodeListingCursor } from './utils/cursor';
import { makeListingSlug } from './utils/slug';

const listingInclude = {
  media: { orderBy: { sortOrder: 'asc' as const } },
  stats: true,
  vehicleVariant: {
    include: {
      generation: {
        include: {
          model: { include: { make: true } },
        },
      },
    },
  },
} satisfies Prisma.ListingInclude;

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
    private readonly outbox: OutboxService,
    private readonly audit: AuditService,
  ) {}

  private canManage(user: AuthUser, ownerUserId: string): boolean {
    if (user.permissionSlugs.includes('admin:moderate')) return true;
    return user.id === ownerUserId;
  }

  private listingJson(listing: Record<string, unknown>): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(listing)) as Prisma.InputJsonValue;
  }

  private async resolveListingVehicleCategory(
    client: Prisma.TransactionClient | PrismaService,
    variantId: string | null | undefined,
    dtoCategory: VehicleCategory | undefined,
    fallback: VehicleCategory,
  ): Promise<VehicleCategory> {
    if (variantId) {
      const v = await client.vehicleVariant.findUnique({
        where: { id: variantId },
        include: { generation: { include: { model: true } } },
      });
      if (!v) throw new BadRequestException('Invalid vehicleVariantId');
      return v.generation.model.category;
    }
    return dtoCategory ?? fallback;
  }

  async list(query: ListListingsQueryDto) {
    const tenantId = await this.tenants.resolveTenantId(query.tenantSlug);
    const limit = Math.min(query.limit ?? 20, 100);
    const cursorRow = query.cursor ? decodeListingCursor(query.cursor) : null;
    if (query.cursor && !cursorRow) {
      throw new BadRequestException('Invalid cursor');
    }

    const where: Prisma.ListingWhereInput = {
      tenantId,
      deletedAt: null,
      status: ListingStatus.PUBLISHED,
    };

    // --- Status / Kind / Category ---
    if (query.kind) where.kind = query.kind;
    if (query.vehicleCategory) where.vehicleCategory = query.vehicleCategory;
    if (query.sellerType) where.sellerType = query.sellerType;

    // --- Dealer Verification ---
    if (query.verifiedOnly) {
      where.dealer = { verified: true };
    }

    // --- Search Term (Title/Description) ---
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    // --- Vehicle Identity ---
    if (query.make || query.model || query.variant) {
      where.vehicleVariant = {
        ...(query.variant && { name: { contains: query.variant, mode: 'insensitive' } }),
        generation: {
          model: {
            ...(query.model && { slug: query.model }),
            ...(query.make && {
              make: {
                OR: [
                  { slug: query.make },
                  { name: { contains: query.make, mode: 'insensitive' } },
                ],
              },
            }),
          },
        },
      };
    }

    // --- Year Range ---
    if (query.year != null || query.yearMin != null || query.yearMax != null) {
      where.year = {};
      if (query.year != null) where.year.equals = query.year;
      else {
        if (query.yearMin != null) where.year.gte = query.yearMin;
        if (query.yearMax != null) where.year.lte = query.yearMax;
      }
    }

    // --- Price Range ---
    if (query.minPrice != null || query.maxPrice != null) {
      where.priceAmount = {};
      if (query.minPrice != null) where.priceAmount.gte = new Prisma.Decimal(query.minPrice);
      if (query.maxPrice != null) where.priceAmount.lte = new Prisma.Decimal(query.maxPrice);
    }

    // --- Mileage ---
    if (query.mileageMax != null) {
      where.mileage = { lte: query.mileageMax };
    }

    // --- Horsepower ---
    if (query.hpMin != null || query.hpMax != null) {
      where.horsepower = {};
      if (query.hpMin != null) where.horsepower.gte = query.hpMin;
      if (query.hpMax != null) where.horsepower.lte = query.hpMax;
    }

    // --- Other Specs ---
    if (query.fuel) where.fuel = query.fuel;
    if (query.transmission) where.transmission = query.transmission;
    if (query.bodyType) where.bodyType = query.bodyType;
    if (query.drivetrain) where.drivetrain = query.drivetrain;
    if (query.exteriorColor) where.exteriorColor = { contains: query.exteriorColor, mode: 'insensitive' };
    if (query.seats) where.seats = { gte: query.seats };
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.region) where.region = { contains: query.region, mode: 'insensitive' };

    // --- Cursor Pagination ---
    if (cursorRow) {
      where.AND = [
        {
          OR: [
            { publishedAt: { lt: cursorRow.publishedAt } },
            {
              AND: [
                { publishedAt: cursorRow.publishedAt },
                { id: { lt: cursorRow.id } },
              ],
            },
          ],
        },
      ];
    }

    // --- Radius Search ---
    if (query.lat != null && query.lng != null) {
      const radius = query.radius ?? 50;
      const degLat = radius / 111.32;
      const degLng = radius / (111.32 * Math.cos(query.lat * (Math.PI / 180)));

      where.latitude = {
        gte: new Prisma.Decimal(query.lat - degLat),
        lte: new Prisma.Decimal(query.lat + degLat),
      };
      where.longitude = {
        gte: new Prisma.Decimal(query.lng - degLng),
        lte: new Prisma.Decimal(query.lng + degLng),
      };
    }

    // --- Sorting ---
    const orderBy: Prisma.ListingOrderByWithRelationInput[] = [];
    switch (query.sort) {
      case 'price-low': orderBy.push({ priceAmount: 'asc' }); break;
      case 'price-high': orderBy.push({ priceAmount: 'desc' }); break;
      case 'year': orderBy.push({ year: 'desc' }); break;
      case 'mileage-low': orderBy.push({ mileage: 'asc' }); break;
      case 'rating': orderBy.push({ dealer: { reviews: { _count: 'desc' } } }); break; // Simplistic
      case 'newest':
      default:
        orderBy.push({ publishedAt: 'desc' });
        orderBy.push({ id: 'desc' });
    }

    const rows = await this.prisma.listing.findMany({
      where,
      take: limit + 1,
      orderBy,
      include: {
        media: { orderBy: { sortOrder: 'asc' }, take: 5 },
        stats: true,
        dealer: { select: { verified: true, businessName: true } },
      },
    });

    let nextCursor: string | undefined;
    let items = rows;
    if (rows.length > limit) {
      items = rows.slice(0, limit);
      const last = items[items.length - 1];
      if (last.publishedAt) {
        nextCursor = encodeListingCursor(last.publishedAt, last.id);
      }
    }

    return {
      items: items.map((l) => this.serialize(l)),
      nextCursor,
    };
  }

  async findPublicById(id: string, tenantSlug?: string) {
    const tenantId = await this.tenants.resolveTenantId(tenantSlug);
    const listing = await this.prisma.listing.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
        status: ListingStatus.PUBLISHED,
      },
      include: {
        ...listingInclude,
        dealer: { include: { reviews: { take: 5, orderBy: { createdAt: 'desc' } } } },
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return this.serialize(listing);
  }

  async findPublicBySlug(slug: string, tenantSlug?: string) {
    const tenantId = await this.tenants.resolveTenantId(tenantSlug);
    const listing = await this.prisma.listing.findFirst({
      where: {
        slug,
        tenantId,
        deletedAt: null,
        status: ListingStatus.PUBLISHED,
      },
      include: {
        ...listingInclude,
        dealer: { include: { reviews: { take: 5, orderBy: { createdAt: 'desc' } } } },
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return this.serialize(listing);
  }

  private async loadListing(id: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...listingInclude,
        dealer: true,
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return this.serialize(listing);
  }

  async create(dto: CreateListingDto, user: AuthUser) {
    if (dto.kind === ListingKind.NEW && !dto.vehicleVariantId) {
      throw new BadRequestException('vehicleVariantId is required for NEW listings');
    }

    let dealerId: string | null = null;
    if (dto.sellerType === SellerType.DEALER) {
      if (!user.dealer) {
        throw new BadRequestException('Dealer profile required for dealer listings');
      }
      dealerId = user.dealer.id;
    }

    const tenantId = await this.tenants.getDefaultTenantId();
    if (user.tenantId && user.tenantId !== tenantId) {
      throw new ForbiddenException('Tenant mismatch');
    }

    const status = dto.status ?? ListingStatus.DRAFT;
    const publishedAt = status === ListingStatus.PUBLISHED ? new Date() : null;
    const slug = makeListingSlug(dto.title);

    const vehicleCategory = await this.resolveListingVehicleCategory(
      this.prisma,
      dto.vehicleVariantId ?? null,
      dto.vehicleCategory,
      VehicleCategory.CAR,
    );

    const created = await this.prisma.$transaction(async (tx) => {
      const listing = await tx.listing.create({
        data: {
          tenantId,
          kind: dto.kind,
          status,
          sellerType: dto.sellerType,
          dealerId,
          ownerUserId: user.id,
          createdById: user.id,
          title: dto.title,
          slug,
          description: dto.description,
          vehicleCategory,
          priceAmount: new Prisma.Decimal(dto.priceAmount),
          originalPrice: dto.originalPrice ? new Prisma.Decimal(dto.originalPrice) : null,
          currency: dto.currency ?? 'USD',
          vehicleVariantId: dto.vehicleVariantId ?? null,
          vehicleSpecVersionId: dto.vehicleSpecVersionId ?? null,
          make: dto.make,
          model: dto.model,
          variant: dto.variant,
          year: dto.year ?? null,
          mileage: dto.mileage ?? null,
          engine: dto.engine,
          horsepower: dto.horsepower,
          conditionNote: dto.conditionNote ?? null,
          fuel: dto.fuel ?? null,
          transmission: dto.transmission ?? null,
          bodyType: dto.bodyType ?? null,
          drivetrain: dto.drivetrain ?? null,
          exteriorColor: dto.exteriorColor ?? null,
          interiorColor: dto.interiorColor ?? null,
          seats: dto.seats ?? null,
          accidentsReported: dto.accidentsReported ?? 0,
          ownerCount: dto.ownerCount ?? 1,
          hasServiceHistory: dto.hasServiceHistory ?? false,
          usageType: dto.usageType ?? 'PERSONAL',
          marketAveragePrice: dto.marketAveragePrice
            ? new Prisma.Decimal(dto.marketAveragePrice)
            : null,
          featureTags: dto.featureTags ?? [],
          city: dto.city ?? null,
          region: dto.region ?? null,
          countryCode: dto.countryCode ?? null,
          postalCode: dto.postalCode ?? null,
          latitude: dto.latitude != null ? new Prisma.Decimal(dto.latitude) : null,
          longitude: dto.longitude != null ? new Prisma.Decimal(dto.longitude) : null,
          contactName: dto.contactName,
          contactPhone: dto.contactPhone,
          contactEmail: dto.contactEmail,
          publishedAt,
          stats: { create: {} },
          media: {
            create: dto.mediaUrls?.map((url, i) => ({
              url,
              sortOrder: i,
            })),
          },
        },
      });

      await this.outbox.emit(
        tx,
        'Listing',
        listing.id,
        'listing.created',
        this.listingJson(this.serialize(listing) as Record<string, unknown>),
      );

      return listing;
    });

    if (status === ListingStatus.PUBLISHED) {
      await this.audit.log({
        actorId: user.id,
        action: 'listing.publish',
        resource: 'Listing',
        resourceId: created.id,
      });
    }

    return this.loadListing(created.id);
  }

  async update(id: string, dto: UpdateListingDto, user: AuthUser) {
    const existing = await this.prisma.listing.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Listing not found');
    if (!this.canManage(user, existing.ownerUserId)) {
      throw new ForbiddenException();
    }

    const nextKind = dto.kind ?? existing.kind;
    const nextVariantId =
      dto.vehicleVariantId !== undefined
        ? dto.vehicleVariantId
        : existing.vehicleVariantId;
    if (nextKind === ListingKind.NEW && !nextVariantId) {
      throw new BadRequestException('vehicleVariantId is required for NEW listings');
    }

    let sellerType = existing.sellerType;
    let dealerId = existing.dealerId;
    if (dto.sellerType !== undefined) {
      sellerType = dto.sellerType;
      if (sellerType === SellerType.DEALER) {
        if (!user.dealer) {
          throw new BadRequestException('Dealer profile required for dealer listings');
        }
        dealerId = user.dealer.id;
      } else {
        dealerId = null;
      }
    }

    const nextStatus = dto.status ?? existing.status;
    const publishedAt =
      nextStatus === ListingStatus.PUBLISHED && !existing.publishedAt
        ? new Date()
        : existing.publishedAt;

    const vehicleCategory = await this.resolveListingVehicleCategory(
      this.prisma,
      nextVariantId,
      dto.vehicleCategory,
      existing.vehicleCategory,
    );

    const data: Prisma.ListingUpdateInput = {
      ...(dto.title != null && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.priceAmount != null && {
        priceAmount: new Prisma.Decimal(dto.priceAmount),
      }),
      ...(dto.originalPrice !== undefined && {
        originalPrice: dto.originalPrice ? new Prisma.Decimal(dto.originalPrice) : null,
      }),
      ...(dto.currency != null && { currency: dto.currency }),
      ...(dto.kind != null && { kind: dto.kind }),
      ...(dto.status != null && { status: dto.status }),
      ...(dto.vehicleVariantId !== undefined && {
        vehicleVariantId: dto.vehicleVariantId,
      }),
      ...(dto.vehicleSpecVersionId !== undefined && {
        vehicleSpecVersionId: dto.vehicleSpecVersionId,
      }),
      vehicleCategory,
      ...(dto.make !== undefined && { make: dto.make }),
      ...(dto.model !== undefined && { model: dto.model }),
      ...(dto.variant !== undefined && { variant: dto.variant }),
      ...(dto.year !== undefined && { year: dto.year }),
      ...(dto.mileage !== undefined && { mileage: dto.mileage }),
      ...(dto.engine !== undefined && { engine: dto.engine }),
      ...(dto.horsepower !== undefined && { horsepower: dto.horsepower }),
      ...(dto.conditionNote !== undefined && { conditionNote: dto.conditionNote }),
      ...(dto.fuel !== undefined && { fuel: dto.fuel }),
      ...(dto.transmission !== undefined && { transmission: dto.transmission }),
      ...(dto.bodyType !== undefined && { bodyType: dto.bodyType }),
      ...(dto.drivetrain !== undefined && { drivetrain: dto.drivetrain }),
      ...(dto.exteriorColor !== undefined && { exteriorColor: dto.exteriorColor }),
      ...(dto.interiorColor !== undefined && { interiorColor: dto.interiorColor }),
      ...(dto.seats !== undefined && { seats: dto.seats }),
      ...(dto.accidentsReported !== undefined && {
        accidentsReported: dto.accidentsReported,
      }),
      ...(dto.ownerCount !== undefined && { ownerCount: dto.ownerCount }),
      ...(dto.hasServiceHistory !== undefined && {
        hasServiceHistory: dto.hasServiceHistory,
      }),
      ...(dto.usageType !== undefined && { usageType: dto.usageType }),
      ...(dto.marketAveragePrice !== undefined && {
        marketAveragePrice:
          dto.marketAveragePrice != null
            ? new Prisma.Decimal(dto.marketAveragePrice)
            : null,
      }),
      ...(dto.featureTags != null && { featureTags: dto.featureTags }),
      ...(dto.city !== undefined && { city: dto.city }),
      ...(dto.region !== undefined && { region: dto.region }),
      ...(dto.countryCode !== undefined && { countryCode: dto.countryCode }),
      ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
      ...(dto.latitude !== undefined && {
        latitude:
          dto.latitude != null ? new Prisma.Decimal(dto.latitude) : null,
      }),
      ...(dto.longitude !== undefined && {
        longitude:
          dto.longitude != null ? new Prisma.Decimal(dto.longitude) : null,
      }),
      ...(dto.contactName !== undefined && { contactName: dto.contactName }),
      ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone }),
      ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
      sellerType,
      dealer: dealerId
        ? { connect: { id: dealerId } }
        : { disconnect: true },
      publishedAt,
      updatedBy: { connect: { id: user.id } },
    };

    await this.prisma.$transaction(async (tx) => {
      const listing = await tx.listing.update({
        where: { id },
        data,
      });
      await this.outbox.emit(
        tx,
        'Listing',
        listing.id,
        'listing.updated',
        this.listingJson(this.serialize(listing) as Record<string, unknown>),
      );
    });

    if (
      nextStatus === ListingStatus.PUBLISHED &&
      existing.status !== ListingStatus.PUBLISHED
    ) {
      await this.audit.log({
        actorId: user.id,
        action: 'listing.publish',
        resource: 'Listing',
        resourceId: id,
      });
    }

    return this.loadListing(id);
  }

  async remove(id: string, user: AuthUser) {
    const existing = await this.prisma.listing.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Listing not found');
    if (!this.canManage(user, existing.ownerUserId)) {
      throw new ForbiddenException();
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedBy: { connect: { id: user.id } },
        },
      });
      await this.outbox.emit(tx, 'Listing', id, 'listing.deleted', {
        listingId: id,
        tenantId: existing.tenantId,
        deletedAt: new Date().toISOString(),
      });
    });

    await this.audit.log({
      actorId: user.id,
      action: 'listing.delete',
      resource: 'Listing',
      resourceId: id,
    });

    return { ok: true };
  }

  private serialize(listing: any) {
    return {
      id: listing.id,
      tenantId: listing.tenantId,

      kind: listing.kind,
      status: listing.status,
      moderationStatus: listing.moderationStatus,

      title: listing.title,
      slug: listing.slug,
      description: listing.description,

      seller: {
        type: listing.sellerType,
        userId: listing.ownerUserId,
        dealerId: listing.dealerId,
        dealerName: listing.dealer?.businessName,
        isVerifiedDealer: listing.dealer?.verified || false,
      },

      pricing: {
        amount: Number(listing.priceAmount),
        currency: listing.currency,
        originalPrice: listing.originalPrice ? Number(listing.originalPrice) : null,
        marketAveragePrice: listing.marketAveragePrice ? Number(listing.marketAveragePrice) : null,
      },

      vehicle: {
        category: listing.vehicleCategory,
        year: listing.year,
        make: listing.make,
        model: listing.model,
        variant: listing.variant,

        variantId: listing.vehicleVariantId,
        specVersionId: listing.vehicleSpecVersionId,

        specs: {
          fuel: listing.fuel,
          transmission: listing.transmission,
          bodyType: listing.bodyType,
          drivetrain: listing.drivetrain,
          engine: listing.engine,
          horsepower: listing.horsepower,
          seats: listing.seats,
        },

        colors: {
          exterior: listing.exteriorColor,
          interior: listing.interiorColor,
        },
      },

      condition: {
        mileage: listing.mileage,
        ownerCount: listing.ownerCount,
        accidentsReported: listing.accidentsReported,
        hasServiceHistory: listing.hasServiceHistory,
        usageType: listing.usageType,
        note: listing.conditionNote,
      },

      features: listing.featureTags || [],

      location: {
        city: listing.city,
        region: listing.region,
        countryCode: listing.countryCode,
        postalCode: listing.postalCode,
        coordinates: {
          latitude: listing.latitude ? Number(listing.latitude) : null,
          longitude: listing.longitude ? Number(listing.longitude) : null,
        },
      },

      contact: {
        name: listing.contactName,
        phone: listing.contactPhone,
        email: listing.contactEmail,
      },

      media: listing.media || [],

      stats: listing.stats || {
        viewCount: 0,
        clickCount: 0,
        leadCount: 0,
        favoriteCount: 0,
      },

      timestamps: {
        publishedAt: listing.publishedAt,
        expiresAt: listing.expiresAt,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
        deletedAt: listing.deletedAt,
      },

      audit: {
        createdById: listing.createdById,
        updatedById: listing.updatedById,
      },
    };
  }
}
