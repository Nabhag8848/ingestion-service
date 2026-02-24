import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSitemapSchema1771933785601 implements MigrationInterface {
    name = 'UpdateSitemapSchema1771933785601'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "core"."site_map_entity" ADD "urlHash" character(32) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_feb883cfe1500873a5f17572e1" ON "core"."site_map_entity" ("urlHash") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "core"."IDX_feb883cfe1500873a5f17572e1"`);
        await queryRunner.query(`ALTER TABLE "core"."site_map_entity" DROP COLUMN "urlHash"`);
    }

}
