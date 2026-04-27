import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  BodyType,
  DrivetrainType,
  FuelType,
  ListingKind,
  ListingStatus,
  SellerType,
  TransmissionType,
  VehicleCategory,
} from '@prisma/client';

export enum ListingSort {
  RELEVANCE = 'relevance',
  PRICE_LOW = 'price-low',
  PRICE_HIGH = 'price-high',
  YEAR_NEW = 'year',
  MILEAGE_LOW = 'mileage-low',
  RATING = 'rating',
  NEWEST = 'newest',
}

export class ListListingsQueryDto {
  // ── Tenant ────────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'default' })
  @IsOptional()
  @IsString()
  tenantSlug?: string;

  // ── Status / Kind ─────────────────────────────────────────────────────────
  @ApiPropertyOptional({ enum: ListingStatus })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional({ enum: ListingKind, example: 'USED' })
  @IsOptional()
  @IsEnum(ListingKind)
  kind?: ListingKind;

  @ApiPropertyOptional({ enum: VehicleCategory, example: 'CAR' })
  @IsOptional()
  @IsEnum(VehicleCategory)
  vehicleCategory?: VehicleCategory;

  // ── Vehicle Identity ──────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ example: 'Camry' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'LE' })
  @IsOptional()
  @IsString()
  variant?: string;

  @ApiPropertyOptional({ example: 2022, description: 'Exact model year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ example: 2018, description: 'Min year (inclusive)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  yearMin?: number;

  @ApiPropertyOptional({ example: 2024, description: 'Max year (inclusive)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  yearMax?: number;

  // ── Vehicle Attributes ────────────────────────────────────────────────────
  @ApiPropertyOptional({ enum: BodyType })
  @IsOptional()
  @IsEnum(BodyType)
  bodyType?: BodyType;

  @ApiPropertyOptional({ enum: FuelType })
  @IsOptional()
  @IsEnum(FuelType)
  fuel?: FuelType;

  @ApiPropertyOptional({ enum: TransmissionType })
  @IsOptional()
  @IsEnum(TransmissionType)
  transmission?: TransmissionType;

  @ApiPropertyOptional({ enum: DrivetrainType })
  @IsOptional()
  @IsEnum(DrivetrainType)
  drivetrain?: DrivetrainType;

  @ApiPropertyOptional({ example: 'Alpine White' })
  @IsOptional()
  @IsString()
  exteriorColor?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seats?: number;

  // ── Condition (maps to conditionNote / kind) ──────────────────────────────
  @ApiPropertyOptional({
    example: 'Used',
    description: 'Human label: New | Used | Certified Pre-Owned',
  })
  @IsOptional()
  @IsString()
  condition?: string;

  // ── Seller ────────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ enum: SellerType })
  @IsOptional()
  @IsEnum(SellerType)
  sellerType?: SellerType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  verifiedOnly?: boolean;

  // ── Price ─────────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 80000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  // ── Mileage ───────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 60000, description: 'Max mileage (km)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileageMax?: number;

  // ── Horsepower ────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hpMin?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hpMax?: number;

  // ── Location ─────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'Los Angeles' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'CA' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Latitude for geo-radius search' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude for geo-radius search' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({ default: 50, description: 'Radius in km' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  radius?: number;

  // ── Search & Sort ─────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'bmw x5 sunroof' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: ListingSort, default: ListingSort.NEWEST })
  @IsOptional()
  @IsEnum(ListingSort)
  sort?: ListingSort;

  // ── Pagination (cursor-based) ─────────────────────────────────────────────
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Opaque cursor from previous response' })
  @IsOptional()
  @IsString()
  cursor?: string;
}
