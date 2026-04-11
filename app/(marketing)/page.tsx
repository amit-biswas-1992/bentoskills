import Link from "next/link";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";
import { BentoGrid, BentoTile } from "@/components/bento-grid";
import { CommandBlock } from "@/components/command-block";
import { SkillCard } from "@/components/skill-card";

export const revalidate = 300;

export default async function HomePage() {
  const repo = new SkillRepository();
  const [featured, trending, newest] = await Promise.all([
    repo.listFeatured(1),
    repo.listTrending(4),
    repo.listNewest(8),
  ]);

  return (
    <div className="space-y-12">
      <BentoGrid>
        <BentoTile size="xl">
          <h1 className="text-4xl font-semibold tracking-tight">
            UI/UX skills for Claude Code.
          </h1>
          <p className="mt-3 max-w-xl text-[--muted-foreground]">
            Agent skills that make your interfaces better — design critique, accessibility review,
            UX copy, handoff specs.
          </p>
          <div className="mt-6 max-w-md">
            <CommandBlock command="npx bentoskills install design-critique" />
          </div>
        </BentoTile>
        {featured[0] && (
          <BentoTile size="lg">
            <span className="text-xs uppercase tracking-wide text-[--muted-foreground]">Featured</span>
            <div className="mt-2">
              <SkillCard skill={featured[0]} variant="feature" />
            </div>
          </BentoTile>
        )}
        {trending.slice(0, 3).map((s) => (
          <BentoTile key={s.id} size="md">
            <SkillCard skill={s} />
          </BentoTile>
        ))}
      </BentoGrid>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">New this week</h2>
          <Link href="/skills?sort=newest" className="text-sm text-[--muted-foreground] hover:underline">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {newest.map((s) => (
            <SkillCard key={s.id} skill={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
