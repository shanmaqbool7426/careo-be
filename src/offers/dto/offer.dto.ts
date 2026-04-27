import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OfferStatus } from '@prisma/client';

export class CreateOfferDto {
  @ApiProperty({ description: 'Listing to make an offer on' })
  @IsUUID()
  listingId!: string;

  @ApiProperty({ example: '17500.00', description: 'Offer amount as decimal string' })
  @IsString()
  @IsNotEmpty()
  amount!: string;

  @ApiPropertyOptional({ example: 'I can pick up today. Is there any flexibility?' })
  @IsOptional()
  @IsString()
  messageText?: string;
}

export class UpdateOfferStatusDto {
  @ApiProperty({ enum: OfferStatus, example: 'ACCEPTED' })
  @IsEnum(OfferStatus)
  status!: OfferStatus;

  @ApiPropertyOptional({ example: '17000.00', description: 'Counter offer amount (when COUNTERED)' })
  @IsOptional()
  @IsString()
  counterAmount?: string;
}
