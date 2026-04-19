import Link from "next/link";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";
import { BentoGrid, BentoTile } from "@/components/bento-grid";
import { CommandBlock } from "@/components/command-block";
import { SkillCard } from "@/components/skill-card";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export default async function HomePage() {
  const repo = new SkillRepository();
  const [featured, trending, newest] = await Promise.all([
    repo.listFeatured(1),
    repo.listTrending(4),
    repo.listNewest(8),
  ]);

  const tileTints = [
    "bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/20 border-emerald-500/30",
    "bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-rose-500/20 border-amber-500/30",
    "bg-gradient-to-br from-sky-500/20 via-indigo-500/15 to-violet-500/20 border-sky-500/30",
  ];

  return (
    <div className="space-y-12">
      {/* Decorative glow blobs behind the hero */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute left-1/3 top-40 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
      </div>

      <BentoGrid>
        <BentoTile
          size="xl"
          className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 text-white border-transparent shadow-lg"
        >
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white backdrop-blur">
            Built by the community
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            UI/UX skills{" "}
            <span className="bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
              for Claude Code.
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-white/90">
            Agent skills that make your interfaces better — design critique, accessibility review,
            UX copy, handoff specs.
          </p>
          <div className="mt-6 max-w-md [&_*]:!text-white">
            <CommandBlock command="npx bentoskills install design-critique" />
          </div>
        </BentoTile>

        {featured[0] && (
          <BentoTile
            size="lg"
            className="bg-gradient-to-br from-pink-500/15 via-rose-500/10 to-amber-400/15 border-pink-500/30"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pink-600 dark:text-pink-300">
              ★ Featured
            </span>
            <div className="mt-2">
              <SkillCard skill={featured[0]} variant="feature" />
            </div>
          </BentoTile>
        )}

        {trending.slice(0, 3).map((s, i) => (
          <BentoTile key={s.id} size="md" className={tileTints[i % tileTints.length]}>
            <SkillCard skill={s} />
          </BentoTile>
        ))}
      </BentoGrid>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-500 bg-clip-text text-xl font-semibold text-transparent">
            New this week
          </h2>
          <Link href="/skills?sort=newest" className="text-sm text-[--muted-foreground] hover:underline">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {newest.map((s, i) => {
            const accents = [
              "hover:border-emerald-500/60 hover:shadow-[0_0_0_1px_rgb(16_185_129/0.3)]",
              "hover:border-sky-500/60 hover:shadow-[0_0_0_1px_rgb(14_165_233/0.3)]",
              "hover:border-fuchsia-500/60 hover:shadow-[0_0_0_1px_rgb(217_70_239/0.3)]",
              "hover:border-amber-500/60 hover:shadow-[0_0_0_1px_rgb(245_158_11/0.3)]",
            ];
            return (
              <div key={s.id} className={`rounded-2xl transition-all ${accents[i % accents.length]}`}>
                <SkillCard skill={s} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
