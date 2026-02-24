import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { XMLParser } from 'fast-xml-parser';
import { SiteMapEntity } from '@/database/entities';
import { SitemapNewsEntryDto, SitemapPageDto, SitemapQueryDto } from './sitemap.dto';

const NDTV_SITEMAP_URL = 'https://www.ndtv.com/sitemap/google-news-sitemap';

function hashUrl(url: string): string {
  return createHash('md5').update(url).digest('hex');
}

type NdTvNews = {
  'news:title'?: string;
  'news:publication_date'?: string;
  'news:keywords'?: string | string[];
};

interface NdTvNewsUrl {
  loc: string;
  'news:news'?: NdTvNews;
}

@Injectable()
export class SitemapService {
  private readonly logger = new Logger(SitemapService.name);
  private readonly parser = new XMLParser({ ignoreAttributes: false });

  constructor(
    @InjectRepository(SiteMapEntity)
    private readonly sitemapRepository: Repository<SiteMapEntity>,
  ) {}

  async findAll(query: SitemapQueryDto): Promise<SitemapPageDto> {
    const { after, before, page = 1, limit = 10 } = query;

    const qb = this.sitemapRepository.createQueryBuilder('s');

    if (after) qb.andWhere('s.publicationDate::timestamptz > :after', { after });
    if (before) qb.andWhere('s.publicationDate::timestamptz < :before', { before });

    const [data, total] = await qb
      .orderBy('s.publicationDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async fetchAndStore(): Promise<SiteMapEntity[]> {
    const entries = await this.fetchSitemap();
    if (entries.length === 0) return [];
    await this.sitemapRepository.upsert(entries, { conflictPaths: ['urlHash'], skipUpdateIfNoValuesChanged: true });
    const hashes = entries.map((e) => e.urlHash);
    return this.sitemapRepository.findBy({ urlHash: In(hashes) });
  }

  async fetchSitemap(): Promise<SitemapNewsEntryDto[]> {
    this.logger.log(`Fetching sitemap from ${NDTV_SITEMAP_URL}`);

    const response = await fetch(NDTV_SITEMAP_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    const parsed = this.parser.parse(xml);

    const rawUrls = parsed?.urlset?.url as NdTvNewsUrl[] | NdTvNewsUrl | undefined;
    const urls: NdTvNewsUrl[] = Array.isArray(rawUrls) ? rawUrls : rawUrls ? [rawUrls] : [];

    return urls.map((item) => {
      const url = item.loc;
      const news = item['news:news'] ?? {};
      const rawKeywords = news['news:keywords'];

      const keywords =
        typeof rawKeywords === 'string'
          ? rawKeywords
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean)
          : Array.isArray(rawKeywords)
          ? rawKeywords
              .flatMap((k) => String(k).split(','))
              .map((k) => k.trim())
              .filter(Boolean)
          : [];

      return {
        urlHash: hashUrl(url),
        url,
        title: news['news:title'] ?? '',
        publicationDate: news['news:publication_date'],
        keywords,
      };
    });
  }
}
