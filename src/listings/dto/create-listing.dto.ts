import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
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
  VehicleCategory,
  UsageType,
} from '@prisma/client';

export class CreateListingDto {
  @ApiProperty({ enum: ListingKind, example: 'USED' })
  @IsEnum(ListingKind)
  kind!: ListingKind;

  @ApiProperty({ enum: SellerType, example: 'PRIVATE' })
  @IsEnum(SellerType)
  sellerType!: SellerType;

  @ApiProperty({ example: '2019 Toyota Camry LE' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'One owner, full service history.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price as decimal string', example: '18999.00' })
  @IsString()
  priceAmount!: string;

  @ApiPropertyOptional({ example: 'USD', maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ enum: ListingStatus, example: 'PUBLISHED' })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional({
    enum: VehicleCategory,
    description:
      'When no vehicleVariantId is set (typical USED free-form), classifies the listing. Ignored when variant is set (category comes from directory).',
    example: 'CAR',
  })
  @IsOptional()
  @IsEnum(VehicleCategory)
  vehicleCategory?: VehicleCategory;

  @IsOptional()
  @IsUUID()
  vehicleVariantId?: string;

  @IsOptional()
  @IsUUID()
  vehicleSpecVersionId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsString()
  conditionNote?: string;

  @IsOptional()
  @IsEnum(FuelType)
  fuel?: FuelType;

  @IsOptional()
  @IsEnum(TransmissionType)
  transmission?: TransmissionType;

  @IsOptional()
  @IsEnum(BodyType)
  bodyType?: BodyType;

  @IsOptional()
  @IsEnum(DrivetrainType)
  drivetrain?: DrivetrainType;

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

  @ApiPropertyOptional({ example: '18500.00' })
  @IsOptional()
  @IsString()
  marketAveragePrice?: string;

  @IsOptional()
  @IsString()
  exteriorColor?: string;

  @IsOptional()
  @IsString()
  interiorColor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seats?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featureTags?: string[];

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];
}
