import { NextResponse } from "next/server";
import { syncRegistry } from "@/lib/registry/sync";
import { createGithubClient } from "@/lib/registry/github";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const repoName = process.env.GITHUB_REGISTRY_REPO;
  if (!repoName) {
    return NextResponse.json({ error: "GITHUB_REGISTRY_REPO not set" }, { status: 500 });
  }

  const github = createGithubClient(repoName, process.env.GITHUB_TOKEN);
  const repo = new SkillRepository();
  const result = await syncRegistry({
    github,
    repo,
    repoUrlFor: (slug) => `https://github.com/${repoName}/tree/main/skills/${slug}`,
    logger,
  });

  return NextResponse.json(result);
}

export async function GET(req: Request) {
  return POST(req);
}
