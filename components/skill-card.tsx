import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TagPill } from "./tag-pill";
import type { Skill } from "@/lib/db/entities";

/**
 * Card for a single skill. Uses the `::after` overlay pattern so the whole
 * card is clickable while still allowing nested links (tag pills) underneath —
 * without nesting `<a>` tags, which is invalid HTML and breaks hydration.
 *
 * How it works:
 *   - The outer element is a semantic `<article>` (not a link).
 *   - The title `<Link>` has `after:absolute after:inset-0`, which creates a
 *     full-card pseudo-element that captures clicks anywhere on the card.
 *   - Tag pills are wrapped in a `relative` container so they establish their
 *     own stacking context and sit above the `::after` overlay, letting users
 *     click them directly.
 *   - `focus-within` on the article lights up the border when the title link
 *     is keyboard-focused, so there's still a visible focus indicator.
 */
export function SkillCard({
  skill,
  variant = "compact",
}: {
  skill: Skill;
  variant?: "compact" | "feature";
}) {
  return (
    <article className="group relative rounded-2xl border border-[--border] p-5 transition hover:border-[--color-accent] focus-within:border-[--color-accent]">
      <div className="flex items-start justify-between gap-3">
        <h3 className={variant === "feature" ? "text-2xl font-semibold" : "text-base font-semibold"}>
          <Link
            href={`/skills/${skill.slug}`}
            className="after:absolute after:inset-0 after:rounded-2xl focus:outline-none"
          >
            {skill.name}
          </Link>
        </h3>
        <Badge>{skill.category}</Badge>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-[--muted-foreground]">{skill.tagline}</p>
      <div className="relative mt-4 flex flex-wrap gap-1.5">
        {skill.tags.slice(0, 4).map((t) => (
          <TagPill key={t} tag={t} />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-[--muted-foreground]">
        <span>{skill.installCount} installs</span>
        <span>{skill.favoriteCount} favorites</span>
      </div>
    </article>
  );
}
