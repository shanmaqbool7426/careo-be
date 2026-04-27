import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DealType } from '@prisma/client';

export class CreateDealDto {
  @ApiProperty({ example: 'some-listing-uuid' })
  @IsUUID()
  listingId!: string;

  @ApiProperty({ example: 'Spring Cashback Offer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ enum: DealType })
  @IsEnum(DealType)
  dealType!: DealType;

  @ApiPropertyOptional({ example: 'Hot Deal' })
  @IsOptional()
  @IsString()
  badgeText?: string;

  @ApiPropertyOptional({ example: '6500.00' })
  @IsOptional()
  @IsString()
  savingsAmount?: string;

  @ApiPropertyOptional({ example: '0.9', description: 'APR in percent' })
  @IsOptional()
  @IsString()
  apr?: string;

  @ApiPropertyOptional({ example: '812.00', description: 'Monthly lease payment' })
  @IsOptional()
  @IsString()
  monthlyPayment?: string;

  @ApiPropertyOptional({ example: 36, description: 'Loan/lease term in months' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  monthsTerm?: number;

  @ApiPropertyOptional({ example: 'Eligible for existing owners.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-04-30T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ListDealsQueryDto {
  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ enum: DealType })
  @IsOptional()
  @IsEnum(DealType)
  dealType?: DealType;

  @ApiPropertyOptional({ example: 'savings', description: 'savings | expiry' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
