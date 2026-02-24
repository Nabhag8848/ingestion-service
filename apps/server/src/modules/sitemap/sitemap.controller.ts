import { Controller, Get } from '@nestjs/common';
import { SitemapService } from './sitemap.service';

@Controller('sitemap')
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  @Get()
  async fetch() {
    return this.sitemapService.fetchAndStore();
  }
}
