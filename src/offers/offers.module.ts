import { Injectable, Module, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { CreateOfferDto, UpdateOfferStatusDto } from './dto/offer.dto';

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOfferDto, user: AuthUser) {
    const listing = await this.prisma.listing.findUnique({ where: { id: dto.listingId } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerUserId === user.id)
      throw new ForbiddenException('Cannot make an offer on your own listing');

    const tenant = await this.prisma.tenant.findFirst({ where: { isDefault: true } });

    return this.prisma.offer.create({
      data: {
        tenantId: tenant!.id,
        listingId: dto.listingId,
        buyerId: user.id,
        amount: dto.amount,
        messageText: dto.messageText,
        status: 'PENDING',
      },
      include: {
        listing: { select: { id: true, title: true, slug: true } },
      },
    });
  }

  async getListingOffers(listingId: string, user: AuthUser) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerUserId !== user.id)
      throw new ForbiddenException('Access denied');

    return this.prisma.offer.findMany({
      where: { listingId },
      include: {
        buyer: { select: { id: true, displayName: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyOffers(userId: string) {
    return this.prisma.offer.findMany({
      where: { buyerId: userId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            slug: true,
            priceAmount: true,
            media: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(offerId: string, dto: UpdateOfferStatusDto, user: AuthUser) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { listing: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');

    const isOwner = offer.listing.ownerUserId === user.id;
    const isBuyer = offer.buyerId === user.id;
    if (!isOwner && !isBuyer) throw new ForbiddenException('Access denied');

    // Only owner can accept/reject; buyer can withdraw
    if ((dto.status === 'ACCEPTED' || dto.status === 'REJECTED') && !isOwner)
      throw new ForbiddenException('Only the listing owner can accept or reject offers');
    if (dto.status === 'WITHDRAWN' && !isBuyer)
      throw new ForbiddenException('Only the buyer can withdraw an offer');

    return this.prisma.offer.update({
      where: { id: offerId },
      data: { status: dto.status },
    });
  }
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags('offers')
@Controller('offers')
@ApiBearerAuth('JWT-auth')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Make an offer on a listing' })
  create(@Body() dto: CreateOfferDto, @CurrentUser() user: AuthUser) {
    return this.offersService.create(dto, user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get all offers I have made' })
  getMyOffers(@CurrentUser() user: AuthUser) {
    return this.offersService.getMyOffers(user.id);
  }

  @Get('listing/:listingId')
  @ApiOperation({ summary: 'Get all offers on a listing (listing owner only)' })
  getListingOffers(
    @Param('listingId', ParseUUIDPipe) listingId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.offersService.getListingOffers(listingId, user);
  }

  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept / Reject / Counter / Withdraw an offer' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfferStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.offersService.updateStatus(id, dto, user);
  }
}

// ── Module ────────────────────────────────────────────────────────────────────

@Module({
  imports: [PrismaModule],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
