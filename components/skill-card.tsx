import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TagPill } from "./tag-pill";
import type { Skill } from "@/lib/db/entities";

export function SkillCard({
  skill,
  variant = "compact",
}: {
  skill: Skill;
  variant?: "compact" | "feature";
}) {
  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="group block rounded-2xl border border-[--border] p-5 transition hover:border-[--color-accent]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className={variant === "feature" ? "text-2xl font-semibold" : "text-base font-semibold"}>
          {skill.name}
        </h3>
        <Badge>{skill.category}</Badge>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-[--muted-foreground]">{skill.tagline}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {skill.tags.slice(0, 4).map((t) => (
          <TagPill key={t} tag={t} />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-[--muted-foreground]">
        <span>{skill.installCount} installs</span>
        <span>{skill.favoriteCount} favorites</span>
      </div>
    </Link>
  );
}
