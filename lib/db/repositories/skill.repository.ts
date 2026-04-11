import { IsNull } from "typeorm";
import { ensureInitialized } from "../data-source";
import { Skill, type SkillCategory } from "../entities";

export interface SkillUpsertInput {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  version: string;
  author: string;
  repoUrl: string;
  homepageUrl: string | null;
  licenseSpdx: string | null;
  category: SkillCategory;
  tags: string[];
  publishedAt: Date | null;
}

export interface SearchArgs {
  q?: string;
  category?: string;
  tag?: string;
  sort?: "popular" | "newest" | "name";
  page: number;
  pageSize: number;
}

export interface SearchResult {
  items: Skill[];
  total: number;
}

export class SkillRepository {
  async upsertFromRegistry(input: SkillUpsertInput): Promise<"added" | "updated"> {
    const ds = await ensureInitialized();
    const repo = ds.getRepository(Skill);
    const existing = await repo.findOne({ where: { slug: input.slug } });
    if (existing) {
      Object.assign(existing, input, { deletedAt: null, lastSyncedAt: new Date() });
      await repo.save(existing);
      return "updated";
    }
    const created = repo.create({ ...input, lastSyncedAt: new Date() });
    await repo.save(created);
    return "added";
  }

  async softDeleteMissing(presentSlugs: string[]): Promise<number> {
    const ds = await ensureInitialized();
    const repo = ds.getRepository(Skill);
    const qb = repo
      .createQueryBuilder()
      .update(Skill)
      .set({ deletedAt: () => "now()" })
      .where('"deletedAt" IS NULL');
    if (presentSlugs.length > 0) {
      qb.andWhere('"slug" NOT IN (:...slugs)', { slugs: presentSlugs });
    }
    const res = await qb.execute();
    return res.affected ?? 0;
  }

  async findLatestSync(): Promise<Date | null> {
    const ds = await ensureInitialized();
    const repo = ds.getRepository(Skill);
    const row = await repo.findOne({ where: {}, order: { lastSyncedAt: "DESC" } });
    return row?.lastSyncedAt ?? null;
  }

  async search(args: SearchArgs): Promise<SearchResult> {
    const ds = await ensureInitialized();
    const qb = ds.getRepository(Skill).createQueryBuilder("s").where('s."deletedAt" IS NULL');

    if (args.q) {
      qb.andWhere('s."searchVector" @@ plainto_tsquery(\'english\', :q)', { q: args.q })
        .addSelect("ts_rank(s.\"searchVector\", plainto_tsquery('english', :q))", "rank")
        .orderBy("rank", "DESC");
    } else if (args.sort === "newest") {
      qb.orderBy('s."publishedAt"', "DESC", "NULLS LAST");
    } else if (args.sort === "name") {
      qb.orderBy('s."name"', "ASC");
    } else {
      qb.orderBy('s."installCount"', "DESC");
    }

    if (args.category) qb.andWhere('s."category" = :category', { category: args.category });
    if (args.tag) qb.andWhere(':tag = ANY(s."tags")', { tag: args.tag });

    const total = await qb.getCount();
    const items = await qb.skip((args.page - 1) * args.pageSize).take(args.pageSize).getMany();
    return { items, total };
  }

  async findBySlug(slug: string): Promise<Skill | null> {
    const ds = await ensureInitialized();
    return ds.getRepository(Skill).findOne({ where: { slug, deletedAt: IsNull() } });
  }

  async listFeatured(limit = 1): Promise<Skill[]> {
    const ds = await ensureInitialized();
    return ds.getRepository(Skill).find({
      where: { featured: true, deletedAt: IsNull() },
      take: limit,
    });
  }

  async listNewest(limit = 12): Promise<Skill[]> {
    const ds = await ensureInitialized();
    return ds.getRepository(Skill).find({
      where: { deletedAt: IsNull() },
      order: { publishedAt: "DESC" },
      take: limit,
    });
  }

  async listTrending(limit = 4): Promise<Skill[]> {
    const ds = await ensureInitialized();
    const rows = await ds.query(
      `SELECT s.* FROM skill s
       JOIN (
         SELECT "skillId", COUNT(*) AS hits FROM install_log
         WHERE "createdAt" > now() - interval '7 days'
         GROUP BY "skillId"
       ) i ON i."skillId" = s.id
       WHERE s."deletedAt" IS NULL
       ORDER BY i.hits DESC
       LIMIT $1`,
      [limit],
    );
    return rows as Skill[];
  }
}
