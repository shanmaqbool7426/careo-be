import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDealerReviewDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  dealerId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ required: false })
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
  vehicleVariantId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  comment?: string;

  @IsOptional()
  @IsString()
  tenantSlug?: string;
}
