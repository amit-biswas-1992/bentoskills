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
}
