import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealerReviewDto, CreateVehicleReviewDto } from './dto/create-review.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createDealerReview(dto: CreateDealerReviewDto, user: AuthUser) {
    const tenantId = user.tenantId;

    // Verify dealer exists
    const dealer = await this.prisma.dealer.findUnique({
      where: { id: dto.dealerId },
    });
    if (!dealer) throw new NotFoundException('Dealer not found');

    return this.prisma.dealerReview.create({
      data: {
        tenantId,
        dealerId: dto.dealerId,
        authorId: user.id,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }

  async createVehicleReview(dto: CreateVehicleReviewDto, user: AuthUser) {
    const tenantId = user.tenantId;

    // Verify variant exists
    const variant = await this.prisma.vehicleVariant.findUnique({
      where: { id: dto.vehicleVariantId },
    });
    if (!variant) throw new NotFoundException('Vehicle variant not found');

    return this.prisma.vehicleReview.create({
      data: {
        tenantId,
        vehicleVariantId: dto.vehicleVariantId,
        authorId: user.id,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
      },
    });
  }

  async getDealerReviews(dealerId: string) {
    return this.prisma.dealerReview.findMany({
      where: { dealerId },
      include: {
        author: {
          select: { displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVehicleReviews(variantId: string) {
    return this.prisma.vehicleReview.findMany({
      where: { vehicleVariantId: variantId },
      include: {
        author: {
          select: { displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
