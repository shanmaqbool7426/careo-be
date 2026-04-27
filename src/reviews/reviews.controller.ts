import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import {
  CreateDealerReviewDto,
  CreateVehicleReviewDto,
  CreateListingReviewDto,
  ListReviewsQueryDto,
} from './dto/create-review.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ── Public: list all vehicle reviews ──────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List vehicle reviews (filter by category, search, sort)',
    description: 'Categories: Sedan | SUV | Coupe | Truck | Convertible. Sort: Most Recent | Highest Rated',
  })
  listReviews(@Query() query: ListReviewsQueryDto) {
    return this.reviewsService.listVehicleReviews(query);
  }

  // ── Public: dealer reviews ────────────────────────────────────────────────

  @Public()
  @Get('dealer/:dealerId')
  @ApiOperation({ summary: 'Get reviews for a dealer' })
  getDealerReviews(@Param('dealerId', ParseUUIDPipe) dealerId: string) {
    return this.reviewsService.getDealerReviews(dealerId);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('dealer')
  @ApiOperation({ summary: 'Rate a dealer (authenticated users only)' })
  createDealerReview(@Body() dto: CreateDealerReviewDto, @CurrentUser() user: AuthUser) {
    return this.reviewsService.createDealerReview(dto, user);
  }

  // ── Public: vehicle reviews ───────────────────────────────────────────────

  @Public()
  @Get('vehicle/:variantId')
  @ApiOperation({ summary: 'Get reviews for a vehicle variant' })
  getVehicleReviews(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.reviewsService.getVehicleReviews(variantId);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('vehicle')
  @ApiOperation({ summary: 'Post a vehicle review (authenticated)' })
  createVehicleReview(@Body() dto: CreateVehicleReviewDto, @CurrentUser() user: AuthUser) {
    return this.reviewsService.createVehicleReview(dto, user);
  }

  // ── Public: listing reviews ───────────────────────────────────────────────

  @Public()
  @Get('listing/:listingId')
  @ApiOperation({ summary: 'Get reviews for a specific listing (used car ad)' })
  getListingReviews(@Param('listingId', ParseUUIDPipe) listingId: string) {
    return this.reviewsService.getListingReviews(listingId);
  }

  @ApiBearerAuth('JWT-auth')
  @Post('listing')
  @ApiOperation({ summary: 'Post a review for a listing' })
  createListingReview(@Body() dto: CreateListingReviewDto, @CurrentUser() user: AuthUser) {
    return this.reviewsService.createListingReview(dto, user);
  }
}
