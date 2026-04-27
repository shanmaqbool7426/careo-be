import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDealerReviewDto,
  CreateVehicleReviewDto,
  CreateListingReviewDto,
  ListReviewsQueryDto,
} from './dto/create-review.dto';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── List all vehicle reviews (public) ─────────────────────────────────────

  async listVehicleReviews(query: ListReviewsQueryDto) {
    const { category, q, sort, limit = 20, offset = 0 } = query;

    const reviews = await this.prisma.vehicleReview.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { comment: { contains: q, mode: 'insensitive' } },
                { title: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        author: { select: { id: true, displayName: true, avatarUrl: true } },
        vehicleVariant: {
          select: {
            name: true,
            generation: {
              select: {
                name: true,
                model: { select: { name: true, bodyType: true, make: { select: { name: true } } } },
              },
            },
          },
        },
      },
      orderBy:
        sort === 'Highest Rated'
          ? { rating: 'desc' }
          : { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return reviews.map((r) => ({
      ...r,
      car: `${r.vehicleVariant?.generation?.model?.make?.name ?? ''} ${r.vehicleVariant?.generation?.model?.name ?? ''} ${r.vehicleVariant?.name ?? ''}`.trim(),
      category: r.vehicleVariant?.generation?.model?.bodyType ?? null,
    }));
  }

  // ── Dealer review ─────────────────────────────────────────────────────────

  async createDealerReview(dto: CreateDealerReviewDto, user: AuthUser) {
    const dealer = await this.prisma.dealer.findUnique({ where: { id: dto.dealerId } });
    if (!dealer) throw new NotFoundException('Dealer not found');

    return this.prisma.dealerReview.create({
      data: {
        tenantId: user.tenantId,
        dealerId: dto.dealerId,
        authorId: user.id,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }

  async getDealerReviews(dealerId: string) {
    return this.prisma.dealerReview.findMany({
      where: { dealerId },
      include: { author: { select: { displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Vehicle review ────────────────────────────────────────────────────────

  async createVehicleReview(dto: CreateVehicleReviewDto, user: AuthUser) {
    const variant = await this.prisma.vehicleVariant.findUnique({
      where: { id: dto.vehicleVariantId },
    });
    if (!variant) throw new NotFoundException('Vehicle variant not found');

    return this.prisma.vehicleReview.create({
      data: {
        tenantId: user.tenantId,
        vehicleVariantId: dto.vehicleVariantId,
        authorId: user.id,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
      },
    });
  }

  async getVehicleReviews(variantId: string) {
    return this.prisma.vehicleReview.findMany({
      where: { vehicleVariantId: variantId },
      include: { author: { select: { displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Listing review ────────────────────────────────────────────────────────

  async createListingReview(dto: CreateListingReviewDto, user: AuthUser) {
    const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
    if (!listing) throw new NotFoundException('Listing not found');

    return this.prisma.listingReview.create({
      data: {
        tenantId: user.tenantId,
        listingId: dto.listingId,
        authorId: user.id,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }

  async getListingReviews(listingId: string) {
    return this.prisma.listingReview.findMany({
      where: { listingId },
      include: { author: { select: { displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
