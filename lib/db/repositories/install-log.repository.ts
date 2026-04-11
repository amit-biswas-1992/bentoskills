import { ensureInitialized } from "../data-source";
import { InstallLog, type InstallSource, Skill } from "../entities";

export class InstallLogRepository {
  async log(userId: string | null, skillId: string, source: InstallSource): Promise<void> {
    const ds = await ensureInitialized();
    await ds.transaction(async (m) => {
      await m.getRepository(InstallLog).insert({ userId, skillId, source });
      await m.getRepository(Skill).increment({ id: skillId }, "installCount", 1);
    });
  }

  async listForUser(userId: string, limit = 50): Promise<InstallLog[]> {
    const ds = await ensureInitialized();
    return ds.getRepository(InstallLog).find({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }
}
