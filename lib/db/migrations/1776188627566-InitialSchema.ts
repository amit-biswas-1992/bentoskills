import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1776188627566 implements MigrationInterface {
    name = 'InitialSchema1776188627566'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "githubId" bigint NOT NULL, "username" text NOT NULL, "name" text, "avatarUrl" text, "email" text, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0d84cc6a830f0e4ebbfcd6381d" ON "user" ("githubId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_78a916df40e02a9deb1c4b75ed" ON "user" ("username") `);
        await queryRunner.query(`CREATE TABLE "skill" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "slug" text NOT NULL, "name" text NOT NULL, "tagline" text NOT NULL, "description" text NOT NULL, "version" text NOT NULL, "author" text NOT NULL, "repoUrl" text NOT NULL, "homepageUrl" text, "licenseSpdx" text, "category" text NOT NULL, "tags" text array NOT NULL DEFAULT '{}', "installCount" integer NOT NULL DEFAULT '0', "favoriteCount" integer NOT NULL DEFAULT '0', "featured" boolean NOT NULL DEFAULT false, "publishedAt" TIMESTAMP WITH TIME ZONE, "lastSyncedAt" TIMESTAMP WITH TIME ZONE, "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_a0d33334424e64fb78dc3ce7196" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_604e22347c14fc37e29ea38660" ON "skill" ("slug") `);
        await queryRunner.query(`CREATE INDEX "IDX_e5a17be1e8e11183678396adb7" ON "skill" ("category") `);
        await queryRunner.query(`CREATE INDEX "idx_skill_deleted" ON "skill" ("deletedAt") WHERE "deletedAt" IS NULL`);
        await queryRunner.query(`CREATE INDEX "idx_skill_featured" ON "skill" ("featured") WHERE "featured" = true`);
        await queryRunner.query(`CREATE TABLE "session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sessionToken" text NOT NULL, "userId" uuid NOT NULL, "expires" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_31ee7107a0ed316df2086cbf5f" ON "session" ("sessionToken") `);
        await queryRunner.query(`CREATE INDEX "IDX_3d2f174ef04fb312fdebd0ddc5" ON "session" ("userId") `);
        await queryRunner.query(`CREATE TABLE "install_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "skillId" uuid NOT NULL, "source" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2bb1041068edd77a2035885a942" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_install_skill_created" ON "install_log" ("skillId", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "type" text NOT NULL, "provider" text NOT NULL, "providerAccountId" text NOT NULL, "refresh_token" text, "access_token" text, "expires_at" bigint, "token_type" text, "scope" text, "id_token" text, "session_state" text, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_60328bf27019ff5498c4b97742" ON "account" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_32054f2625f6b8e31319d0e020" ON "account" ("provider", "providerAccountId") `);
        await queryRunner.query(`CREATE TABLE "favorite" ("userId" uuid NOT NULL, "skillId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_511deecf1c991a0aaffa063da01" PRIMARY KEY ("userId", "skillId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_31266a690d39e423c772e1fee0" ON "favorite" ("skillId") `);
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION skill_search_vector(
                name text, tagline text, tags text[], description text
            ) RETURNS tsvector
            LANGUAGE sql
            IMMUTABLE
            PARALLEL SAFE
            AS $$
                SELECT
                    setweight(to_tsvector('english'::regconfig, coalesce(name, '')), 'A') ||
                    setweight(to_tsvector('english'::regconfig, coalesce(tagline, '')), 'B') ||
                    setweight(to_tsvector('english'::regconfig, coalesce(array_to_string(tags, ' '), '')), 'C') ||
                    setweight(to_tsvector('english'::regconfig, coalesce(description, '')), 'D')
            $$
        `);
        await queryRunner.query(`
            ALTER TABLE "skill" ADD COLUMN "searchVector" tsvector GENERATED ALWAYS AS (
                skill_search_vector("name", "tagline", "tags", "description")
            ) STORED
        `);
        await queryRunner.query(`CREATE INDEX "idx_skill_search_vector" ON "skill" USING GIN ("searchVector")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_skill_search_vector"`);
        await queryRunner.query(`ALTER TABLE "skill" DROP COLUMN "searchVector"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS skill_search_vector(text, text, text[], text)`);
        await queryRunner.query(`DROP INDEX "public"."IDX_31266a690d39e423c772e1fee0"`);
        await queryRunner.query(`DROP TABLE "favorite"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_32054f2625f6b8e31319d0e020"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_60328bf27019ff5498c4b97742"`);
        await queryRunner.query(`DROP TABLE "account"`);
        await queryRunner.query(`DROP INDEX "public"."idx_install_skill_created"`);
        await queryRunner.query(`DROP TABLE "install_log"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3d2f174ef04fb312fdebd0ddc5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_31ee7107a0ed316df2086cbf5f"`);
        await queryRunner.query(`DROP TABLE "session"`);
        await queryRunner.query(`DROP INDEX "public"."idx_skill_featured"`);
        await queryRunner.query(`DROP INDEX "public"."idx_skill_deleted"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e5a17be1e8e11183678396adb7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_604e22347c14fc37e29ea38660"`);
        await queryRunner.query(`DROP TABLE "skill"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_78a916df40e02a9deb1c4b75ed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0d84cc6a830f0e4ebbfcd6381d"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
