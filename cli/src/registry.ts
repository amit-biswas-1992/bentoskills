/**
 * Talks to the bentoskills-registry GitHub repo.
 *
 * We pull `registry.json` from the main branch via raw.githubusercontent.com,
 * then enumerate each skill's directory via the GitHub contents API so we can
 * download every file (skill.yaml, README.md, plus any extras a contributor
 * adds).
 *
 * Uses GITHUB_TOKEN if present to lift the rate limit from 60 → 5000/hr.
 */

const REGISTRY_REPO =
  process.env.BENTOSKILLS_REGISTRY_REPO ?? "amit-biswas-1992/bentoskills-registry";
const REGISTRY_BRANCH = process.env.BENTOSKILLS_REGISTRY_BRANCH ?? "main";

const RAW_BASE = `https://raw.githubusercontent.com/${REGISTRY_REPO}/${REGISTRY_BRANCH}`;
const API_BASE = `https://api.github.com/repos/${REGISTRY_REPO}`;

export type RegistryEntry = {
  slug: string;
  path: string;
  sha?: string;
};

export type RegistryFile = {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url: string | null;
};

function buildHeaders(accept = "application/vnd.github+json"): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: accept,
    "User-Agent": "bentoskills-cli",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

export async function fetchRegistry(): Promise<RegistryEntry[]> {
  const url = `${RAW_BASE}/registry.json`;
  const res = await fetch(url, { headers: buildHeaders("application/json") });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch registry (${res.status} ${res.statusText}) from ${url}`
    );
  }
  const data = (await res.json()) as { skills?: RegistryEntry[] } | RegistryEntry[];
  const list = Array.isArray(data) ? data : (data.skills ?? []);
  if (!Array.isArray(list)) {
    throw new Error("registry.json is malformed: expected an array of skills");
  }
  return list;
}

export async function listSkillFiles(skillPath: string): Promise<RegistryFile[]> {
  const url = `${API_BASE}/contents/${encodeURIComponent(skillPath).replace(/%2F/g, "/")}?ref=${REGISTRY_BRANCH}`;
  const res = await fetch(url, { headers: buildHeaders() });
  if (!res.ok) {
    if (res.status === 404) throw new Error(`Skill path not found: ${skillPath}`);
    if (res.status === 403) {
      throw new Error(
        "GitHub API rate limit hit. Set GITHUB_TOKEN to raise the limit."
      );
    }
    throw new Error(`Failed to list skill files (${res.status} ${res.statusText})`);
  }
  const data = (await res.json()) as RegistryFile[];
  return data;
}

export async function downloadFile(downloadUrl: string): Promise<Buffer> {
  const res = await fetch(downloadUrl, { headers: buildHeaders("application/octet-stream") });
  if (!res.ok) {
    throw new Error(`Failed to download file (${res.status} ${res.statusText})`);
  }
  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}

export function getRegistryInfo() {
  return { repo: REGISTRY_REPO, branch: REGISTRY_BRANCH };
}
