import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { SiteMapEntity } from '../../database/entities';
import { SitemapService } from './sitemap.service';
import { SitemapQueryDto } from './sitemap.dto';

const makeEntry = (overrides: Partial<SiteMapEntity> = {}): SiteMapEntity =>
  ({
    id: 'uuid-1',
    urlHash: 'abc123',
    url: 'https://example.com/article-1',
    title: 'Test Article',
    publicationDate: '2024-06-15T10:00:00Z',
    keywords: ['news', 'test'],
    createdAt: new Date('2024-06-15T10:00:00Z'),
    updatedAt: new Date('2024-06-15T10:00:00Z'),
    ...overrides,
  }) as SiteMapEntity;

describe('SitemapService', () => {
  let service: SitemapService;

  // Query builder mock handles – recreated per test in beforeEach
  let getManyAndCount: jest.Mock;
  let andWhere: jest.Mock;
  let orderBy: jest.Mock;
  let skip: jest.Mock;
  let take: jest.Mock;

  // Repository mock – exposed so fetchAndStore tests can configure it
  let mockRepo: {
    createQueryBuilder: jest.Mock;
    upsert: jest.Mock;
    findBy: jest.Mock;
  };

  beforeEach(async () => {
    getManyAndCount = jest.fn();
    andWhere = jest.fn().mockReturnThis();
    orderBy = jest.fn().mockReturnThis();
    skip = jest.fn().mockReturnThis();
    take = jest.fn().mockReturnThis();

    const mockQueryBuilder = { andWhere, orderBy, skip, take, getManyAndCount };

    mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      upsert: jest.fn().mockResolvedValue(undefined),
      findBy: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SitemapService,
        { provide: getRepositoryToken(SiteMapEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<SitemapService>(SitemapService);
  });

  // ─── findAll: pagination ────────────────────────────────────────────────────

  describe('findAll – pagination', () => {
    it('uses page=1 and limit=10 when none supplied (DTO defaults)', async () => {
      getManyAndCount.mockResolvedValue([[], 0]);
      const query = new SitemapQueryDto();

      await service.findAll(query);

      expect(skip).toHaveBeenCalledWith(0); // (1-1)*10 = 0
      expect(take).toHaveBeenCalledWith(10);
    });

    it('skip is 0 on the first page regardless of limit', async () => {
      getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 5 });

      expect(skip).toHaveBeenCalledWith(0);
    });

    it('skips (page-1)*limit records for subsequent pages', async () => {
      getManyAndCount.mockResolvedValue([[], 50]);

      await service.findAll({ page: 3, limit: 10 });

      expect(skip).toHaveBeenCalledWith(20); // (3-1)*10 = 20
      expect(take).toHaveBeenCalledWith(10);
    });

    it('take equals the requested limit', async () => {
      getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 7 });

      expect(take).toHaveBeenCalledWith(7);
    });

    it('reflects page and limit in the response', async () => {
      getManyAndCount.mockResolvedValue([[], 100]);

      const result = await service.findAll({ page: 4, limit: 15 });

      expect(result.page).toBe(4);
      expect(result.limit).toBe(15);
    });
  });

  // ─── findAll: totalPages ────────────────────────────────────────────────────

  describe('findAll – totalPages', () => {
    it('rounds up with Math.ceil when total is not divisible by limit', async () => {
      getManyAndCount.mockResolvedValue([[], 21]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.totalPages).toBe(3); // Math.ceil(21/10) = 3
    });

    it('is exactly 1 when total equals limit', async () => {
      getManyAndCount.mockResolvedValue([[], 10]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.totalPages).toBe(1);
    });

    it('is 0 when there are no records', async () => {
      getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.totalPages).toBe(0);
    });

    it('reflects the real total count in the response', async () => {
      getManyAndCount.mockResolvedValue([[], 42]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.total).toBe(42);
    });
  });

  // ─── findAll: date filters ──────────────────────────────────────────────────

  describe('findAll – date filters', () => {
    it('casts publicationDate to timestamptz when applying the after filter', async () => {
      getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ after: '2024-01-01T00:00:00Z' });

      expect(andWhere).toHaveBeenCalledWith(
        's.publicationDate::timestamptz > :after',
        { after: '2024-01-01T00:00:00Z' },
      );
    });

    it('casts publicationDate to timestamptz when applying the before filter', async () => {
      getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ before: '2024-12-31T23:59:59Z' });

      expect(andWhere).toHaveBeenCalledWith(
        's.publicationDate::timestamptz < :before',
        { before: '2024-12-31T23:59:59Z' },
      );
    });

    it('applies both after and before filters when both are provided', async () => {
      getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        after: '2024-01-01T00:00:00Z',
        before: '2024-12-31T23:59:59Z',
      });

      expect(andWhere).toHaveBeenCalledTimes(2);
      expect(andWhere).toHaveBeenCalledWith(
        's.publicationDate::timestamptz > :after',
        { after: '2024-01-01T00:00:00Z' },
      );
      expect(andWhere).toHaveBeenCalledWith(
        's.publicationDate::timestamptz < :before',
        { before: '2024-12-31T23:59:59Z' },
      );
    });

    it('does not call andWhere when no date filters are provided', async () => {
      getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(andWhere).not.toHaveBeenCalled();
    });
  });

  // ─── findAll: result shape ──────────────────────────────────────────────────

  describe('findAll – result shape', () => {
    it('orders results by publicationDate DESC', async () => {
      getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(orderBy).toHaveBeenCalledWith('s.publicationDate', 'DESC');
    });

    it('returns data from the repository in the response', async () => {
      const entries = [makeEntry(), makeEntry({ id: 'uuid-2' })];
      getManyAndCount.mockResolvedValue([entries, 2]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(entries);
    });

    it('returns an empty data array when no records match', async () => {
      getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.data).toEqual([]);
    });
  });

  // ─── fetchAndStore ──────────────────────────────────────────────────────────

  describe('fetchAndStore', () => {
    it('returns an empty array immediately when fetchSitemap yields nothing', async () => {
      jest.spyOn(service, 'fetchSitemap').mockResolvedValue([]);

      const result = await service.fetchAndStore();

      expect(mockRepo.upsert).not.toHaveBeenCalled();
      expect(mockRepo.findBy).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('queries only the ingested url hashes, not the entire table', async () => {
      const parsed = [
        { urlHash: 'hash1', url: 'https://a.com', title: 'A', keywords: [] },
        { urlHash: 'hash2', url: 'https://b.com', title: 'B', keywords: [] },
      ];
      jest.spyOn(service, 'fetchSitemap').mockResolvedValue(parsed);

      const stored = [makeEntry({ urlHash: 'hash1' }), makeEntry({ id: 'uuid-2', urlHash: 'hash2' })];
      mockRepo.findBy.mockResolvedValue(stored);

      await service.fetchAndStore();

      expect(mockRepo.findBy).toHaveBeenCalledWith({ urlHash: In(['hash1', 'hash2']) });
      expect(mockRepo.findBy).toHaveBeenCalledTimes(1);
    });

    it('returns only the entries that were just ingested', async () => {
      const parsed = [
        { urlHash: 'hash1', url: 'https://a.com', title: 'A', keywords: [] },
      ];
      jest.spyOn(service, 'fetchSitemap').mockResolvedValue(parsed);

      const stored = [makeEntry({ urlHash: 'hash1' })];
      mockRepo.findBy.mockResolvedValue(stored);

      const result = await service.fetchAndStore();

      expect(result).toBe(stored);
    });

    it('upserts before querying the stored entries', async () => {
      const parsed = [
        { urlHash: 'hash1', url: 'https://a.com', title: 'A', keywords: [] },
      ];
      jest.spyOn(service, 'fetchSitemap').mockResolvedValue(parsed);

      const callOrder: string[] = [];
      mockRepo.upsert.mockImplementation(async () => { callOrder.push('upsert'); });
      mockRepo.findBy.mockImplementation(async () => { callOrder.push('findBy'); return []; });

      await service.fetchAndStore();

      expect(callOrder).toEqual(['upsert', 'findBy']);
    });
  });
});
