import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum DealerSort {
  RATING = 'rating',
  LISTINGS = 'listings',
  NAME = 'name',
}

export class ListDealersQueryDto {
  @ApiPropertyOptional({ example: 'BMW' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    example: 'Luxury',
    description: 'Specialty: Luxury | Sports | Electric | Trucks | Exotic | Family',
  })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ example: 'Los Angeles' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'CA' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ enum: DealerSort, default: DealerSort.RATING })
  @IsOptional()
  @IsEnum(DealerSort)
  sort?: DealerSort;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
