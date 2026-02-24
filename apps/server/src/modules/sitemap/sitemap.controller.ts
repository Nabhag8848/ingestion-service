import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Serialize } from '@/app/decorators/serialize.decorator';
import { SitemapPageDto, SitemapQueryDto } from './sitemap.dto';
import { SitemapService } from './sitemap.service';

@ApiTags('sitemap')
@Controller('sitemap')
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  @Get()
  @Serialize(SitemapPageDto)
  @ApiOperation({ summary: 'List sitemaps with optional time filters and pagination' })
  findAll(@Query() query: SitemapQueryDto) {
    return this.sitemapService.findAll(query);
  }
 
  @Get('ingest')
  @ApiOperation({ summary: 'ingest and store latest sitemap entries from NDTV' })
  fetch() {
    return this.sitemapService.fetchAndStore();
  }
}
