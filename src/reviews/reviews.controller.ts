import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateDealerReviewDto, CreateVehicleReviewDto } from './dto/create-review.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('dealer')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Rate a dealer (Authenticated)' })
  createDealer(@Body() dto: CreateDealerReviewDto, @CurrentUser() user: AuthUser) {
    return this.reviewsService.createDealerReview(dto, user);
  }

  @Post('vehicle')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Rate a vehicle variant (Authenticated)' })
  createVehicle(@Body() dto: CreateVehicleReviewDto, @CurrentUser() user: AuthUser) {
    return this.reviewsService.createVehicleReview(dto, user);
  }

  @Public()
  @Get('dealer/:dealerId')
  @ApiOperation({ summary: 'Get reviews for a dealer' })
  getDealerReviews(@Param('dealerId') dealerId: string) {
    return this.reviewsService.getDealerReviews(dealerId);
  }

  @Public()
  @Get('vehicle/:variantId')
  @ApiOperation({ summary: 'Get reviews for a vehicle variant' })
  getVehicleReviews(@Param('variantId') variantId: string) {
    return this.reviewsService.getVehicleReviews(variantId);
  }
}
