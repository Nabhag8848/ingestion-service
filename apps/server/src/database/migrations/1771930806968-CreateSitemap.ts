import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSitemap1771930806968 implements MigrationInterface {
    name = 'CreateSitemap1771930806968'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "core"."site_map_entity" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "url" character varying(2048) NOT NULL, "title" character varying(500) NOT NULL, "publicationDate" character varying, "keywords" text array, CONSTRAINT "PK_855614bb1f93c44ff0053cf1819" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "core"."site_map_entity"`);
    }

}
