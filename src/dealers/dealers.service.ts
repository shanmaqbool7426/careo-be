import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealerDto, UpdateDealerDto } from './dto/create-dealer.dto';
import { ListDealersQueryDto, DealerSort } from './dto/list-dealers.query.dto';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class DealersService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Public: list dealers ──────────────────────────────────────────────────

  async findAll(query: ListDealersQueryDto) {
    const { q, specialty, city, region, sort, limit = 20, offset = 0 } = query;

    const dealers = await this.prisma.dealer.findMany({
      where: {
        deletedAt: null,
        ...(city ? { city } : {}),
        ...(region ? { region } : {}),
        ...(specialty
          ? { specialties: { has: specialty } }
          : {}),
        ...(q
          ? {
              OR: [
                { businessName: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
                { region: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        reviews: { select: { rating: true } },
        listings: { where: { status: 'PUBLISHED' }, select: { id: true } },
      },
      take: limit,
      skip: offset,
    });

    const enriched = dealers.map((d) => {
      const { reviews, listings, ...rest } = d;
      const rating =
        reviews.length > 0
          ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
          : null;
      return {
        ...rest,
        rating,
        reviewCount: reviews.length,
        listingCount: listings.length,
      };
    });

    if (sort === DealerSort.LISTINGS) enriched.sort((a, b) => b.listingCount - a.listingCount);
    else if (sort === DealerSort.NAME)
      enriched.sort((a, b) => a.businessName.localeCompare(b.businessName));
    else enriched.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    return enriched;
  }

  // ── Public: dealer by id ──────────────────────────────────────────────────

  async findById(id: string) {
    const dealer = await this.prisma.dealer.findFirst({
      where: { id, deletedAt: null },
      include: {
        reviews: {
          include: { author: { select: { displayName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        listings: {
          where: { status: 'PUBLISHED' },
          take: 12,
          include: { media: { take: 1, orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    if (!dealer) throw new NotFoundException('Dealer not found');
    const rating =
      dealer.reviews.length > 0
        ? Math.round(
            (dealer.reviews.reduce((s, r) => s + r.rating, 0) / dealer.reviews.length) * 10,
          ) / 10
        : null;
    return { ...dealer, rating };
  }

  // ── Auth: my dealer profile ───────────────────────────────────────────────

  async findMe(user: AuthUser) {
    const dealer = await this.prisma.dealer.findFirst({
      where: { ownerUserId: user.id, deletedAt: null },
      include: {
        reviews: { select: { rating: true } },
        listings: { where: { status: 'PUBLISHED' }, select: { id: true } },
      },
    });
    if (!dealer) throw new NotFoundException('No dealer profile found. Create one first.');
    const { reviews, listings, ...rest } = dealer;
    return {
      ...rest,
      rating:
        reviews.length > 0
          ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
          : null,
      reviewCount: reviews.length,
      listingCount: listings.length,
    };
  }

  // ── Auth: create dealer profile ────────────────────────────────────────────

  async create(dto: CreateDealerDto, user: AuthUser) {
    const existing = await this.prisma.dealer.findFirst({
      where: { ownerUserId: user.id, deletedAt: null },
    });
    if (existing) throw new ConflictException('You already have a dealer profile');

    const tenant = await this.prisma.tenant.findFirst({ where: { isDefault: true } });
    if (!tenant) throw new NotFoundException('Tenant not configured');

    const slug = dto.businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    return this.prisma.dealer.create({
      data: {
        tenantId: tenant.id,
        ownerUserId: user.id,
        businessName: dto.businessName,
        slug,
        description: dto.description,
        phone: dto.phone,
        email: dto.email,
        websiteUrl: dto.websiteUrl,
        specialties: dto.specialties ?? [],
        openHours: dto.openHours,
        responseTimeNote: dto.responseTimeNote,
        logoUrl: dto.logoUrl,
        coverImageUrl: dto.coverImageUrl,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        region: dto.region,
        postalCode: dto.postalCode,
        countryCode: dto.countryCode,
        latitude: dto.latitude !== undefined ? dto.latitude : null,
        longitude: dto.longitude !== undefined ? dto.longitude : null,
      },
    });
  }

  // ── Auth: update my dealer profile ────────────────────────────────────────

  async updateMe(dto: UpdateDealerDto, user: AuthUser) {
    const dealer = await this.prisma.dealer.findFirst({
      where: { ownerUserId: user.id, deletedAt: null },
    });
    if (!dealer) throw new NotFoundException('No dealer profile found');

    return this.prisma.dealer.update({
      where: { id: dealer.id },
      data: {
        businessName: dto.businessName,
        description: dto.description,
        phone: dto.phone,
        email: dto.email,
        websiteUrl: dto.websiteUrl,
        specialties: dto.specialties,
        openHours: dto.openHours,
        responseTimeNote: dto.responseTimeNote,
        logoUrl: dto.logoUrl,
        coverImageUrl: dto.coverImageUrl,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        region: dto.region,
        postalCode: dto.postalCode,
        countryCode: dto.countryCode,
        latitude: dto.latitude !== undefined ? dto.latitude : undefined,
        longitude: dto.longitude !== undefined ? dto.longitude : undefined,
      },
    });
  }

  // ── Dealer Hub: inventory ─────────────────────────────────────────────────

  async getMyInventory(user: AuthUser, search?: string) {
    const dealer = await this.prisma.dealer.findFirst({ where: { ownerUserId: user.id } });
    if (!dealer) throw new NotFoundException('No dealer profile found');

    return this.prisma.listing.findMany({
      where: {
        dealerId: dealer.id,
        deletedAt: null,
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      },
      select: {
        id: true,
        title: true,
        priceAmount: true,
        currency: true,
        status: true,
        createdAt: true,
        stats: { select: { viewCount: true, leadCount: true } },
        media: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Dealer Hub: leads ─────────────────────────────────────────────────────

  async getMyLeads(user: AuthUser) {
    const dealer = await this.prisma.dealer.findFirst({ where: { ownerUserId: user.id } });
    if (!dealer) throw new NotFoundException('No dealer profile found');

    // Leads come from Offers + Messages on the dealer's listings
    const offers = await this.prisma.offer.findMany({
      where: { listing: { dealerId: dealer.id } },
      include: {
        buyer: { select: { id: true, displayName: true, email: true, phone: true, avatarUrl: true } },
        listing: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return offers.map((o) => ({
      id: o.id,
      buyer: o.buyer,
      listing: o.listing,
      amount: o.amount,
      status: o.status,
      message: o.messageText,
      createdAt: o.createdAt,
    }));
  }

  // ── Dealer Hub: analytics ──────────────────────────────────────────────────

  async getMyAnalytics(user: AuthUser) {
    const dealer = await this.prisma.dealer.findFirst({ where: { ownerUserId: user.id } });
    if (!dealer) throw new NotFoundException('No dealer profile found');

    const [totalViews, totalLeads, activeListings, reviewStats] = await Promise.all([
      this.prisma.listingStats.aggregate({
        where: { listing: { dealerId: dealer.id } },
        _sum: { viewCount: true, leadCount: true },
      }),
      this.prisma.offer.count({ where: { listing: { dealerId: dealer.id } } }),
      this.prisma.listing.count({
        where: { dealerId: dealer.id, status: 'PUBLISHED', deletedAt: null },
      }),
      this.prisma.dealerReview.aggregate({
        where: { dealerId: dealer.id },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      kpis: {
        totalViews: totalViews._sum.viewCount ?? 0,
        totalLeads: totalLeads,
        activeListings,
        avgRating: reviewStats._avg.rating ?? null,
        reviewCount: reviewStats._count.rating,
      },
    };
  }
}
