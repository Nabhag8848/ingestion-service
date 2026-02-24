import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XMLParser } from 'fast-xml-parser';
import { SiteMapEntity } from '@/database/entities';

const NDTV_SITEMAP_URL = 'https://www.ndtv.com/sitemap/google-news-sitemap';

interface NewsEntry {
  url: string;
  title: string;
  publicationDate?: string;
  keywords?: string[];
}

@Injectable()
export class SitemapService {
  private readonly logger = new Logger(SitemapService.name);
  private readonly parser = new XMLParser({ ignoreAttributes: false });

  constructor(
    @InjectRepository(SiteMapEntity)
    private readonly sitemapRepository: Repository<SiteMapEntity>,
  ) {}

  async fetchAndStore(): Promise<SiteMapEntity[]> {
    const entries = await this.fetchSitemap();
    const entities = this.sitemapRepository.create(entries);
    return this.sitemapRepository.save(entities);
  }

  async fetchSitemap(): Promise<NewsEntry[]> {
    this.logger.log(`Fetching sitemap from ${NDTV_SITEMAP_URL}`);

    const response = await fetch(NDTV_SITEMAP_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    const parsed = this.parser.parse(xml);

    const urls: unknown[] = parsed?.urlset?.url ?? [];

    return urls.map((item: any) => ({
      url: item.loc,
      title: item['news:news']?.['news:title'] ?? '',
      publicationDate: item['news:news']?.['news:publication_date'] ?? undefined,
      keywords: item['news:news']?.['news:keywords']
        ? String(item['news:news']['news:keywords']).split(',').map((k: string) => k.trim()).filter(Boolean)
        : [],
    }));
  }
}
