import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TagPill } from "./tag-pill";
import type { Skill } from "@/lib/db/entities";

/**
 * Per-category color themes. Category is stable for a skill, so the mapping is
 * consistent across renders — users learn "accessibility = teal, copy = amber".
 * Each entry supplies:
 *   - stripe: a narrow gradient bar at the top of the card
 *   - tint:   a soft gradient wash for the card background
 *   - border: the hover/focus border color
 *   - badge:  bg + text classes for the category pill
 */
const CATEGORY_THEME: Record<string, { stripe: string; tint: string; border: string; badge: string }> = {
  accessibility: {
    stripe: "from-teal-400 via-cyan-400 to-sky-400",
    tint: "from-teal-500/5 via-cyan-500/5 to-sky-500/5",
    border: "hover:border-teal-400 focus-within:border-teal-400",
    badge: "border-teal-400/40 bg-teal-500/15 text-teal-700 dark:text-teal-300",
  },
  critique: {
    stripe: "from-rose-400 via-pink-400 to-fuchsia-400",
    tint: "from-rose-500/5 via-pink-500/5 to-fuchsia-500/5",
    border: "hover:border-rose-400 focus-within:border-rose-400",
    badge: "border-rose-400/40 bg-rose-500/15 text-rose-700 dark:text-rose-300",
  },
  copy: {
    stripe: "from-amber-400 via-orange-400 to-yellow-400",
    tint: "from-amber-500/5 via-orange-500/5 to-yellow-500/5",
    border: "hover:border-amber-400 focus-within:border-amber-400",
    badge: "border-amber-400/40 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  handoff: {
    stripe: "from-violet-400 via-purple-400 to-indigo-400",
    tint: "from-violet-500/5 via-purple-500/5 to-indigo-500/5",
    border: "hover:border-violet-400 focus-within:border-violet-400",
    badge: "border-violet-400/40 bg-violet-500/15 text-violet-700 dark:text-violet-300",
  },
  research: {
    stripe: "from-emerald-400 via-green-400 to-lime-400",
    tint: "from-emerald-500/5 via-green-500/5 to-lime-500/5",
    border: "hover:border-emerald-400 focus-within:border-emerald-400",
    badge: "border-emerald-400/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  system: {
    stripe: "from-indigo-400 via-blue-400 to-cyan-400",
    tint: "from-indigo-500/5 via-blue-500/5 to-cyan-500/5",
    border: "hover:border-indigo-400 focus-within:border-indigo-400",
    badge: "border-indigo-400/40 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  },
};

const FALLBACK_THEME = CATEGORY_THEME.system!;

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
  const theme = CATEGORY_THEME[skill.category] ?? FALLBACK_THEME;

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-[--border] p-5 transition bg-gradient-to-br ${theme.tint} ${theme.border}`}
    >
      {/* Colored top stripe — category at a glance */}
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.stripe}`} />

      <div className="flex items-start justify-between gap-3">
        <h3 className={variant === "feature" ? "text-2xl font-semibold" : "text-base font-semibold"}>
          <Link
            href={`/skills/${skill.slug}`}
            className="after:absolute after:inset-0 after:rounded-2xl focus:outline-none"
          >
            {skill.name}
          </Link>
        </h3>
        <Badge className={theme.badge}>{skill.category}</Badge>
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
