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
    tint: "from-teal-400 via-cyan-500 to-sky-500",
    border: "hover:border-teal-300 focus-within:border-teal-300",
    badge: "border-white/30 bg-white/20 text-white backdrop-blur",
  },
  critique: {
    stripe: "from-rose-400 via-pink-400 to-fuchsia-400",
    tint: "from-rose-500 via-pink-500 to-fuchsia-500",
    border: "hover:border-rose-300 focus-within:border-rose-300",
    badge: "border-white/30 bg-white/20 text-white backdrop-blur",
  },
  copy: {
    stripe: "from-amber-400 via-orange-400 to-yellow-400",
    tint: "from-amber-500 via-orange-500 to-yellow-500",
    border: "hover:border-amber-200 focus-within:border-amber-200",
    badge: "border-white/30 bg-white/20 text-white backdrop-blur",
  },
  handoff: {
    stripe: "from-violet-400 via-purple-400 to-indigo-400",
    tint: "from-violet-500 via-purple-500 to-indigo-500",
    border: "hover:border-violet-300 focus-within:border-violet-300",
    badge: "border-white/30 bg-white/20 text-white backdrop-blur",
  },
  research: {
    stripe: "from-emerald-400 via-green-400 to-lime-400",
    tint: "from-emerald-500 via-green-500 to-lime-500",
    border: "hover:border-emerald-300 focus-within:border-emerald-300",
    badge: "border-white/30 bg-white/20 text-white backdrop-blur",
  },
  system: {
    stripe: "from-indigo-400 via-blue-400 to-cyan-400",
    tint: "from-indigo-500 via-blue-500 to-cyan-500",
    border: "hover:border-indigo-300 focus-within:border-indigo-300",
    badge: "border-white/30 bg-white/20 text-white backdrop-blur",
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
      className={`group relative overflow-hidden rounded-2xl border border-white/20 p-5 text-white shadow-lg transition bg-gradient-to-br ${theme.tint} ${theme.border} hover:shadow-xl hover:scale-[1.01]`}
    >
      {/* Soft white highlight in the top corner for depth */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />

      <div className="relative flex items-start justify-between gap-3">
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
      <p className="relative mt-2 line-clamp-2 text-sm text-white/85">{skill.tagline}</p>
      <div className="relative mt-4 flex flex-wrap gap-1.5">
        {skill.tags.slice(0, 4).map((t) => (
          <TagPill key={t} tag={t} className="border-white/30 bg-white/15 text-white" />
        ))}
      </div>
      <div className="relative mt-4 flex items-center gap-4 text-xs text-white/80">
        <span>{skill.installCount} installs</span>
        <span>{skill.favoriteCount} favorites</span>
      </div>
    </article>
  );
}
