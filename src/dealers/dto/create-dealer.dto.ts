import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDealerDto {
  @ApiProperty({ example: 'Drive Style Showroom' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  businessName!: string;

  @ApiPropertyOptional({ example: 'Premium cars at best prices.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '+1 310 555 1234' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@drivestyle.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'https://drivestyle.com' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Luxury', 'Sports', 'Electric'],
    description: 'Specialty tags: Luxury, Sports, Electric, Trucks, Exotic, Family',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({ example: 'Mon-Sat 9AM-7PM' })
  @IsOptional()
  @IsString()
  openHours?: string;

  @ApiPropertyOptional({ example: '< 1 hour' })
  @IsOptional()
  @IsString()
  responseTimeNote?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ example: '123 Auto Drive' })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({ example: 'Suite 200' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({ example: 'Los Angeles' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'CA' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: '90001' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'US', maxLength: 2 })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  countryCode?: string;

  @ApiPropertyOptional({ example: 34.0522 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  latitude?: number;

  @ApiPropertyOptional({ example: -118.2437 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  longitude?: number;
}

export class UpdateDealerDto extends CreateDealerDto {}
