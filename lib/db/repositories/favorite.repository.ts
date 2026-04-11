import { ensureInitialized } from "../data-source";
import { Favorite, Skill } from "../entities";

export class FavoriteRepository {
  async favorite(userId: string, skillId: string): Promise<{ count: number }> {
    const ds = await ensureInitialized();
    return ds.transaction(async (m) => {
      const existing = await m.getRepository(Favorite).findOne({ where: { userId, skillId } });
      if (existing) {
        const skill = await m.getRepository(Skill).findOneByOrFail({ id: skillId });
        return { count: skill.favoriteCount };
      }
      await m.getRepository(Favorite).insert({ userId, skillId });
      await m.getRepository(Skill).increment({ id: skillId }, "favoriteCount", 1);
      const skill = await m.getRepository(Skill).findOneByOrFail({ id: skillId });
      return { count: skill.favoriteCount };
    });
  }

  async unfavorite(userId: string, skillId: string): Promise<{ count: number }> {
    const ds = await ensureInitialized();
    return ds.transaction(async (m) => {
      const res = await m.getRepository(Favorite).delete({ userId, skillId });
      if (res.affected && res.affected > 0) {
        await m.getRepository(Skill).decrement({ id: skillId }, "favoriteCount", 1);
      }
      const skill = await m.getRepository(Skill).findOneByOrFail({ id: skillId });
      return { count: skill.favoriteCount };
    });
  }

  async isFavorited(userId: string, skillId: string): Promise<boolean> {
    const ds = await ensureInitialized();
    const row = await ds.getRepository(Favorite).findOne({ where: { userId, skillId } });
    return !!row;
  }

  async listForUser(userId: string): Promise<Skill[]> {
    const ds = await ensureInitialized();
    return ds
      .getRepository(Skill)
      .createQueryBuilder("s")
      .innerJoin(Favorite, "f", 'f."skillId" = s.id AND f."userId" = :userId', { userId })
      .where('s."deletedAt" IS NULL')
      .orderBy('f."createdAt"', "DESC")
      .getMany();
  }
}
