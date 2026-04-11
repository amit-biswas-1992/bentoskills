import { auth } from "@/lib/auth/server";
import { FavoriteRepository } from "@/lib/db/repositories/favorite.repository";
import { InstallLogRepository } from "@/lib/db/repositories/install-log.repository";
import { SkillCard } from "@/components/skill-card";

export default async function MePage() {
  const session = await auth();
  const userId = (session!.user as { id: string }).id;
  const [favs, installs] = await Promise.all([
    new FavoriteRepository().listForUser(userId),
    new InstallLogRepository().listForUser(userId, 20),
  ]);

  return (
    <div className="space-y-12">
      <section>
        <h2 className="mb-4 text-xl font-semibold">Favorites</h2>
        {favs.length === 0 ? (
          <p className="text-[--muted-foreground]">No favorites yet. Browse and heart a skill.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favs.map((s) => (
              <SkillCard key={s.id} skill={s} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Recent installs</h2>
        {installs.length === 0 ? (
          <p className="text-[--muted-foreground]">No installs yet.</p>
        ) : (
          <ul className="divide-y divide-[--border] overflow-hidden rounded-2xl border border-[--border]">
            {installs.map((i) => (
              <li key={i.id} className="flex justify-between p-4 text-sm">
                <span className="font-mono text-xs">{i.skillId}</span>
                <span className="text-[--muted-foreground]">
                  {new Date(i.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
