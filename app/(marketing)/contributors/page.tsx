/**
 * Contributor leaderboard. Aggregates contributors across both bentoskills repos
 * (app + registry) via the GitHub REST API, merges by login, and ranks by total
 * commits. Cached for 6 hours to stay well within the unauthenticated rate limit
 * and use the GITHUB_TOKEN envar when present.
 */

import Image from "next/image";

const REPOS = [
  "amit-biswas-1992/bentoskills",
  "amit-biswas-1992/bentoskills-registry",
] as const;

type GhContributor = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
};

type Merged = {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  total: number;
  repos: string[];
};

export const revalidate = 21600; // 6 hours
export const metadata = {
  title: "Contributors — bentoskills.sh",
  description: "People who ship skills and code to bentoskills.",
};

async function fetchContributors(repo: string): Promise<GhContributor[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "bentoskills-app",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(
    `https://api.github.com/repos/${repo}/contributors?per_page=100&anon=0`,
    { headers, next: { revalidate: 21600 } }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as GhContributor[];
  return Array.isArray(data) ? data.filter((c) => c.type === "User") : [];
}

function badgeFor(total: number): { label: string; cls: string } | null {
  if (total >= 50) return { label: "Core", cls: "bg-[--color-accent] text-black" };
  if (total >= 10) return { label: "Regular", cls: "border border-[--color-accent] text-[--color-accent]" };
  if (total >= 3) return { label: "Contributor", cls: "border border-[--border] text-[--muted-foreground]" };
  return null;
}

export default async function ContributorsPage() {
  const results = await Promise.all(REPOS.map(fetchContributors));

  const byLogin = new Map<string, Merged>();
  for (const [i, list] of results.entries()) {
    // REPOS is a fixed-length const tuple, so i is always in range.
    const repo = REPOS[i] as string;
    for (const c of list) {
      const existing = byLogin.get(c.login);
      if (existing) {
        existing.total += c.contributions;
        existing.repos.push(repo);
      } else {
        byLogin.set(c.login, {
          login: c.login,
          avatarUrl: c.avatar_url,
          htmlUrl: c.html_url,
          total: c.contributions,
          repos: [repo],
        });
      }
    }
  }

  const ranked = [...byLogin.values()].sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Contributors</h1>
        <p className="max-w-2xl text-[--muted-foreground]">
          The people who make bentoskills better. Ranked by total commits across{" "}
          <a
            href="https://github.com/amit-biswas-1992/bentoskills"
            className="underline hover:text-[--color-accent]"
          >
            bentoskills
          </a>{" "}
          and{" "}
          <a
            href="https://github.com/amit-biswas-1992/bentoskills-registry"
            className="underline hover:text-[--color-accent]"
          >
            bentoskills-registry
          </a>
          . Want to join the list? Open a PR.
        </p>
      </header>

      {ranked.length === 0 ? (
        <div className="rounded-lg border border-[--border] p-8 text-center text-[--muted-foreground]">
          Couldn&apos;t load contributors right now. Try again in a bit.
        </div>
      ) : (
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map((c, idx) => {
            const badge = badgeFor(c.total);
            return (
              <li key={c.login}>
                <a
                  href={c.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-lg border border-[--border] p-4 transition-colors hover:border-[--color-accent] hover:bg-[--muted]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[--muted] font-mono text-sm tabular-nums text-[--muted-foreground]">
                    {idx + 1}
                  </span>
                  <Image
                    src={c.avatarUrl}
                    alt={`${c.login} avatar`}
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-full"
                    unoptimized
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold group-hover:text-[--color-accent]">
                        {c.login}
                      </span>
                      {badge && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-sm text-[--muted-foreground]">
                      {c.total} {c.total === 1 ? "commit" : "commits"} ·{" "}
                      {c.repos.length === 2 ? "both repos" : (c.repos[0]?.split("/")[1] ?? "")}
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
