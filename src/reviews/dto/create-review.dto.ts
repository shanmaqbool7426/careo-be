import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDealerReviewDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  dealerId!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;

  @IsOptional()
  @IsString()
  tenantSlug?: string;
}

export class CreateVehicleReviewDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  vehicleVariantId!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ example: 'Incredible highway cruiser' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;

  @IsOptional()
  @IsString()
  tenantSlug?: string;
}

export class CreateListingReviewDto {
  @ApiProperty({ description: 'Listing (used car ad) to review' })
  @IsUUID()
  @IsNotEmpty()
  listingId!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;
}

export enum ReviewSort {
  RECENT = 'Most Recent',
  HIGHEST = 'Highest Rated',
  HELPFUL = 'Most Helpful',
}

export class ListReviewsQueryDto {
  @ApiPropertyOptional({
    example: 'SUV',
    description: 'Body type category: Sedan | SUV | Coupe | Truck | Convertible',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ReviewSort, default: ReviewSort.RECENT })
  @IsOptional()
  @IsEnum(ReviewSort)
  sort?: ReviewSort;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
