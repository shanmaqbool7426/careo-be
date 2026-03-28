import { ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleCategory } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class DirectoryMakesQueryDto {
  @ApiPropertyOptional({ example: 'default' })
  @IsOptional()
  @IsString()
  tenantSlug?: string;

  @ApiPropertyOptional({
    enum: VehicleCategory,
    description: 'Only makes that have at least one model in this category',
  })
  @IsOptional()
  @IsEnum(VehicleCategory)
  category?: VehicleCategory;
}

export class DirectoryModelsQueryDto extends DirectoryMakesQueryDto {}
