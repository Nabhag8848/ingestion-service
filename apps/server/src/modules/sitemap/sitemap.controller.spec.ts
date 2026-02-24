import { Test, TestingModule } from '@nestjs/testing';
import { SitemapController } from './sitemap.controller';
import { SitemapService } from './sitemap.service';
import { SitemapPageDto, SitemapQueryDto } from './sitemap.dto';
import { SiteMapEntity } from '../../database/entities';

const mockPage = (overrides: Partial<SitemapPageDto> = {}): SitemapPageDto =>
  ({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    ...overrides,
  }) as SitemapPageDto;

describe('SitemapController', () => {
  let controller: SitemapController;
  let service: jest.Mocked<SitemapService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SitemapController],
      providers: [
        {
          provide: SitemapService,
          useValue: {
            findAll: jest.fn(),
            fetchAndStore: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SitemapController>(SitemapController);
    service = module.get(SitemapService);
  });

  describe('findAll', () => {
    it('delegates to service.findAll with the provided query', async () => {
      const query: SitemapQueryDto = { page: 2, limit: 5 };
      const expected = mockPage({ page: 2, limit: 5, total: 10, totalPages: 2 });
      service.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toBe(expected);
    });

    it('passes an empty query to the service when no params are given', async () => {
      const query = new SitemapQueryDto();
      service.findAll.mockResolvedValue(mockPage());

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('passes date filter params through to the service', async () => {
      const query: SitemapQueryDto = {
        after: '2024-01-01T00:00:00Z',
        before: '2024-12-31T23:59:59Z',
      };
      service.findAll.mockResolvedValue(mockPage());

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('returns the service result directly', async () => {
      const expected = mockPage({ total: 99, totalPages: 10 });
      service.findAll.mockResolvedValue(expected);

      const result = await controller.findAll({});

      expect(result).toBe(expected);
    });
  });

  describe('fetch (ingest)', () => {
    it('delegates to service.fetchAndStore', async () => {
      service.fetchAndStore.mockResolvedValue([]);

      await controller.fetch();

      expect(service.fetchAndStore).toHaveBeenCalledTimes(1);
    });

    it('returns the stored entries from the service', async () => {
      const entries = [{ id: 'uuid-1' } as SiteMapEntity];
      service.fetchAndStore.mockResolvedValue(entries);

      const result = await controller.fetch();

      expect(result).toBe(entries);
    });
  });
});
