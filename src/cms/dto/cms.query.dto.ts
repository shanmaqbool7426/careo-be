import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export enum BlogCategory {
  BUYING_GUIDE = 'Buying Guide',
  INDUSTRY_NEWS = 'Industry News',
  TIPS_TRICKS = 'Tips & Tricks',
  ELECTRIC = 'Electric Vehicles',
  MAINTENANCE = 'Maintenance',
  COMPARISONS = 'Comparisons',
  LIFESTYLE = 'Lifestyle',
}

export class ListBlogsQueryDto {
  @ApiPropertyOptional({ example: 'used car tips' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: BlogCategory })
  @IsOptional()
  @IsEnum(BlogCategory)
  category?: BlogCategory;

  @ApiPropertyOptional({ example: true, description: 'Only return featured posts' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;

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

export enum VideoCategory {
  TEST_DRIVE = 'Test Drive',
  WALKAROUND = 'Walkaround',
  COMPARISON = 'Comparison',
  REVIEW = 'Review',
}

export class ListVideosQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: VideoCategory })
  @IsOptional()
  @IsEnum(VideoCategory)
  category?: VideoCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

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
