import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SitemapQueryDto {
  @ApiPropertyOptional({
    description: 'Return entries published after this timestamp (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  @IsISO8601()
  after?: string;

  @ApiPropertyOptional({
    description: 'Return entries published before this timestamp (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsString()
  @IsISO8601()
  before?: string;

  @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class SitemapNewsEntryDto {
  @Expose()
  urlHash: string;

  @Expose()
  url: string;

  @Expose()
  title: string;

  @Expose()
  publicationDate?: string;

  @Expose()
  keywords: string[];
}

export class SitemapResponseDto extends SitemapNewsEntryDto {
  @Expose()
  id: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

export class SitemapPageDto {
  @Expose()
  @Type(() => SitemapResponseDto)
  data: SitemapResponseDto[];

  @Expose()
  @IsNumber()
  total: number;

  @Expose()
  @IsNumber()
  page: number;

  @Expose()
  @IsNumber()
  limit: number;

  @Expose()
  @IsNumber()
  totalPages: number;
}
