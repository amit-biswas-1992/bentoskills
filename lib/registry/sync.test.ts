import { describe, it, expect, vi } from "vitest";
import { syncRegistry, type SyncDeps } from "./sync";

function makeDeps(overrides: Partial<SyncDeps> = {}): SyncDeps {
  return {
    github: {
      fetchRegistryIndex: vi.fn(async () => ({
        entries: [{ slug: "a", path: "skills/a", sha: "abc" }],
        repoSha: "repo-1",
      })),
      fetchSkillFile: vi.fn(async (_p, file) =>
        file === "skill.yaml"
          ? "slug: a\nname: A\ntagline: t\nversion: 1.0.0\nauthor: x\ncategory: critique\n"
          : "# readme",
      ),
    },
    repo: {
      upsertFromRegistry: vi.fn(async () => "added" as const),
      softDeleteMissing: vi.fn(async () => 0),
      findLatestSync: vi.fn(async () => null),
    },
    repoUrlFor: (slug) => `https://github.com/r/registry/tree/main/skills/${slug}`,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    ...overrides,
  };
}

describe("syncRegistry", () => {
  it("adds a new skill end-to-end", async () => {
    const deps = makeDeps();
    const res = await syncRegistry(deps);
    expect(res.added).toBe(1);
    expect(res.errors).toHaveLength(0);
    expect(deps.repo.upsertFromRegistry).toHaveBeenCalledOnce();
  });

  it("soft-deletes slugs no longer in the registry", async () => {
    const deps = makeDeps({
      repo: {
        upsertFromRegistry: vi.fn(async () => "updated" as const),
        softDeleteMissing: vi.fn(async () => 2),
        findLatestSync: vi.fn(async () => null),
      },
    });
    const res = await syncRegistry(deps);
    expect(res.removed).toBe(2);
    expect(deps.repo.softDeleteMissing).toHaveBeenCalledWith(["a"]);
  });

  it("collects per-skill errors without throwing", async () => {
    const deps = makeDeps({
      github: {
        fetchRegistryIndex: vi.fn(async () => ({
          entries: [
            { slug: "a", path: "skills/a", sha: "x" },
            { slug: "b", path: "skills/b", sha: "y" },
          ],
          repoSha: "s",
        })),
        fetchSkillFile: vi.fn(async (path, file) => {
          if (path === "skills/b" && file === "skill.yaml") return "not: valid\n";
          return file === "skill.yaml"
            ? "slug: a\nname: A\ntagline: t\nversion: 1.0.0\nauthor: x\ncategory: critique\n"
            : "# readme";
        }),
      },
    });
    const res = await syncRegistry(deps);
    expect(res.added + res.updated).toBe(1);
    expect(res.errors.length).toBe(1);
    expect(res.errors[0]?.slug).toBe("b");
  });

  it("is idempotent: second run with same input does not throw", async () => {
    const deps = makeDeps();
    await syncRegistry(deps);
    const res = await syncRegistry(deps);
    expect(res.errors).toHaveLength(0);
  });
});
