import type { GithubClient } from "./github";
import { parseSkillYaml } from "./parser";
import type { SkillRepository } from "../db/repositories/skill.repository";

export interface SyncDeps {
  github: GithubClient;
  repo: Pick<SkillRepository, "upsertFromRegistry" | "softDeleteMissing" | "findLatestSync">;
  repoUrlFor: (slug: string) => string;
  logger: {
    info: (m: string, ctx?: unknown) => void;
    warn: (m: string, ctx?: unknown) => void;
    error: (m: string, ctx?: unknown) => void;
  };
}

export interface SyncResult {
  added: number;
  updated: number;
  removed: number;
  errors: { slug: string; error: string }[];
}

export async function syncRegistry(deps: SyncDeps): Promise<SyncResult> {
  const { github, repo, repoUrlFor, logger } = deps;
  const result: SyncResult = { added: 0, updated: 0, removed: 0, errors: [] };

  const { entries } = await github.fetchRegistryIndex();
  const presentSlugs: string[] = [];

  for (const entry of entries) {
    try {
      const [yamlRaw, readme] = await Promise.all([
        github.fetchSkillFile(entry.path, "skill.yaml"),
        github.fetchSkillFile(entry.path, "README.md"),
      ]);
      const parsed = parseSkillYaml(yamlRaw);
      if (!parsed.ok) {
        result.errors.push({ slug: entry.slug, error: parsed.error });
        logger.warn("skill parse failed", { slug: entry.slug, error: parsed.error });
        continue;
      }
      const data = parsed.data;
      const action = await repo.upsertFromRegistry({
        slug: data.slug,
        name: data.name,
        tagline: data.tagline,
        description: readme,
        version: data.version,
        author: data.author,
        repoUrl: repoUrlFor(data.slug),
        homepageUrl: data.homepage ?? null,
        licenseSpdx: data.license ?? null,
        category: data.category,
        tags: data.tags,
        publishedAt: data.publishedAt ?? null,
      });
      if (action === "added") result.added += 1;
      else result.updated += 1;
      presentSlugs.push(data.slug);
    } catch (e) {
      result.errors.push({ slug: entry.slug, error: (e as Error).message });
      logger.error("skill fetch failed", { slug: entry.slug, error: (e as Error).message });
    }
  }

  result.removed = await repo.softDeleteMissing(presentSlugs);
  logger.info("registry sync complete", result);
  return result;
}
