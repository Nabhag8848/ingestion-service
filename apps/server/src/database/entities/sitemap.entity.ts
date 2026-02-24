import { Column, Entity, Index } from 'typeorm';
import { AbstractBaseEntity } from './base.entity';

@Entity({ schema: 'core' })
export class SiteMapEntity extends AbstractBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'char', length: 32 })
  urlHash: string;

  @Column({ type: 'varchar', length: 2048 })
  url: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  publicationDate?: string;

  @Column({ type: 'text', array: true, nullable: true })
  keywords: string[];
}
