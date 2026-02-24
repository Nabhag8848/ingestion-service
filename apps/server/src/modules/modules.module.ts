import { Module } from '@nestjs/common';
import { QueueModule } from './queue/queue.module';
import { SitemapModule } from './sitemap/sitemap.module';

@Module({
  imports: [QueueModule, SitemapModule],
  exports: [QueueModule, SitemapModule],
})
export class ModulesModule {}
