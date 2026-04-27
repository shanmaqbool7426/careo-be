import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
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
  UsageType,
  VehicleCategory,
} from '@prisma/client';

export class CreateListingDto {
  // ── Kind & Status ─────────────────────────────────────────────────────────
  @ApiProperty({ enum: ListingKind, example: 'USED' })
  @IsEnum(ListingKind)
  kind!: ListingKind;

  @ApiPropertyOptional({ enum: ListingStatus, example: 'PUBLISHED' })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiProperty({ enum: SellerType, example: 'PRIVATE' })
  @IsEnum(SellerType)
  sellerType!: SellerType;

  // ── Title & Description ───────────────────────────────────────────────────
  @ApiProperty({ example: '2019 Toyota Camry LE – One Owner' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Full service history, always garaged.' })
  @IsOptional()
  @IsString()
  description?: string;

  // ── Directory Link ────────────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Link to vehicle directory variant' })
  @IsOptional()
  @IsUUID()
  vehicleVariantId?: string;

  @ApiPropertyOptional({ description: 'Spec version snapshot at publish time' })
  @IsOptional()
  @IsUUID()
  vehicleSpecVersionId?: string;

  @ApiPropertyOptional({ enum: VehicleCategory, example: 'CAR' })
  @IsOptional()
  @IsEnum(VehicleCategory)
  vehicleCategory?: VehicleCategory;

  // ── Free-form vehicle identity (for USED without directory link) ───────────
  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  make?: string;

  @ApiPropertyOptional({ example: 'Camry' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;

  @ApiPropertyOptional({ example: 'LE' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  variant?: string;

  @ApiPropertyOptional({ example: 2019 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1886)
  @Max(new Date().getFullYear() + 2)
  year?: number;

  // ── Pricing ───────────────────────────────────────────────────────────────
  @ApiProperty({ description: 'Asking price as decimal string', example: '18999.00' })
  @IsString()
  priceAmount!: string;

  @ApiPropertyOptional({ example: '21500.00', description: 'Original / sticker price' })
  @IsOptional()
  @IsString()
  originalPrice?: string;

  @ApiPropertyOptional({ example: '18500.00', description: 'Market average for deal badge' })
  @IsOptional()
  @IsString()
  marketAveragePrice?: string;

  @ApiPropertyOptional({ example: 'USD', maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

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

  @ApiPropertyOptional({ example: 25000, description: 'Mileage in km' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional({ example: '2.5L 4-Cylinder' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  engine?: string;

  @ApiPropertyOptional({ example: 203, description: 'Horsepower' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  horsepower?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seats?: number;

  @ApiPropertyOptional({ example: 'Alpine White' })
  @IsOptional()
  @IsString()
  exteriorColor?: string;

  @ApiPropertyOptional({ example: 'Cognac Leather' })
  @IsOptional()
  @IsString()
  interiorColor?: string;

  @ApiPropertyOptional({ example: 'Single owner, no accidents.' })
  @IsOptional()
  @IsString()
  conditionNote?: string;

  // ── Car History ───────────────────────────────────────────────────────────
  @ApiPropertyOptional({ enum: UsageType, example: 'PERSONAL' })
  @IsOptional()
  @IsEnum(UsageType)
  usageType?: UsageType;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  accidentsReported?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  ownerCount?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  hasServiceHistory?: boolean;

  // ── Features ──────────────────────────────────────────────────────────────
  @ApiPropertyOptional({
    type: [String],
    example: ['Panoramic Sunroof', 'Heated Seats', 'Apple CarPlay'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featureTags?: string[];

  // ── Location ─────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'Los Angeles' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'CA' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: 'US', maxLength: 2 })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;

  @ApiPropertyOptional({ example: '90001' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  // ── Media ─────────────────────────────────────────────────────────────────
  @ApiPropertyOptional({
    type: [String],
    description: 'Array of uploaded photo URLs (first becomes PRIMARY)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  // ── Contact override (for private sellers) ────────────────────────────────
  @ApiPropertyOptional({ example: 'John Smith' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ example: '+1 310 555 0000' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  contactEmail?: string;
}
