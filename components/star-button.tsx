/**
 * Server component that fetches the live star count from the GitHub REST API
 * and renders a "Star on GitHub" button in the site header. Falls back to
 * showing just the label if the request fails.
 *
 * Cache: 30 minutes (1800 s) via next.fetch cache, revalidated in background.
 */

const REPO = "amit-biswas-1992/bentoskills";
const API = `https://api.github.com/repos/${REPO}`;

async function getStarCount(): Promise<number | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "bentoskills-app",
    };
    // Use token if available to lift rate limits. No secrets reach the client;
    // this is a server component.
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await fetch(API, {
      headers,
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export async function StarButton() {
  const count = await getStarCount();
  return (
    <a
      href={`https://github.com/${REPO}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[--border] px-2.5 text-sm text-[--foreground] transition-colors hover:border-[--color-accent] hover:bg-[--muted] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent]"
      aria-label={`Star bentoskills on GitHub${count !== null ? ` (${count} stars)` : ""}`}
    >
      <StarIcon />
      <span className="font-medium">Star</span>
      {count !== null && (
        <span className="text-[--muted-foreground] tabular-nums">
          {formatCount(count)}
        </span>
      )}
    </a>
  );
}

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4 text-[--color-accent]"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
