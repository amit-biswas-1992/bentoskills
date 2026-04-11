import { Octokit } from "octokit";

export interface RegistryEntry {
  slug: string;
  path: string;
  sha: string;
}

export interface GithubClient {
  fetchRegistryIndex(): Promise<{ entries: RegistryEntry[]; repoSha: string }>;
  fetchSkillFile(path: string, file: "skill.yaml" | "README.md"): Promise<string>;
}

export function createGithubClient(repo: string, token?: string): GithubClient {
  const [owner, name] = repo.split("/");
  if (!owner || !name) throw new Error(`invalid GITHUB_REGISTRY_REPO: ${repo}`);
  const octokit = new Octokit({ auth: token });

  return {
    async fetchRegistryIndex() {
      const repoInfo = await octokit.rest.repos.get({ owner, repo: name });
      const commit = await octokit.rest.repos.getCommit({ owner, repo: name, ref: repoInfo.data.default_branch });
      const indexRaw = await octokit.rest.repos.getContent({
        owner,
        repo: name,
        path: "registry.json",
        mediaType: { format: "raw" },
      });
      const entries = JSON.parse(indexRaw.data as unknown as string) as RegistryEntry[];
      return { entries, repoSha: commit.data.sha };
    },

    async fetchSkillFile(path, file) {
      const res = await octokit.rest.repos.getContent({
        owner,
        repo: name,
        path: `${path}/${file}`,
        mediaType: { format: "raw" },
      });
      return res.data as unknown as string;
    },
  };
}
