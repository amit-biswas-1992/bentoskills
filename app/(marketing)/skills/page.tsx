import Link from "next/link";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";
import { SkillCard } from "@/components/skill-card";

const CATEGORIES = [
  "accessibility",
  "critique",
  "copy",
  "handoff",
  "research",
  "system",
] as const;

interface SearchParams {
  q?: string;
  category?: string;
  tag?: string;
  sort?: "popular" | "newest" | "name";
  page?: string;
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1"));
  const pageSize = 24;
  const repo = new SkillRepository();
  const { items, total } = await repo.search({
    q: sp.q,
    category: sp.category,
    tag: sp.tag,
    sort: sp.sort,
    page,
    pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
      <aside className="space-y-6">
        <div>
          <h3 className="mb-2 text-xs uppercase tracking-wide text-[--muted-foreground]">Category</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/skills" className={!sp.category ? "font-semibold" : ""}>
                All
              </Link>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link href={`/skills?category=${c}`} className={sp.category === c ? "font-semibold" : ""}>
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-xs uppercase tracking-wide text-[--muted-foreground]">Sort</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/skills?sort=popular">Popular</Link>
            </li>
            <li>
              <Link href="/skills?sort=newest">Newest</Link>
            </li>
            <li>
              <Link href="/skills?sort=name">A–Z</Link>
            </li>
          </ul>
        </div>
      </aside>

      <div>
        <div className="mb-4 text-sm text-[--muted-foreground]">{total} skills</div>
        {items.length === 0 ? (
          <p className="text-[--muted-foreground]">No skills match.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => (
              <SkillCard key={s.id} skill={s} />
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <div className="mt-6 flex gap-2 text-sm">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const params = new URLSearchParams();
              if (sp.q) params.set("q", sp.q);
              if (sp.category) params.set("category", sp.category);
              if (sp.tag) params.set("tag", sp.tag);
              if (sp.sort) params.set("sort", sp.sort);
              params.set("page", String(p));
              return (
                <Link
                  key={p}
                  href={`/skills?${params.toString()}`}
                  className={p === page ? "font-semibold underline" : ""}
                >
                  {p}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
