/**
 * `bentoskills install <slug>` — resolves a skill from the registry and writes
 * its files into the user's skills directory.
 *
 * Safety:
 *  - Refuses to overwrite an existing directory unless --force is passed.
 *  - Only walks one level deep into the registry skill directory. If a skill
 *    ever ships subdirectories, they'd need explicit recursion (currently
 *    warned about, not silently skipped).
 */

import fs from "node:fs/promises";
import path from "node:path";
import {
  fetchRegistry,
  listSkillFiles,
  downloadFile,
  getRegistryInfo,
} from "../registry.js";
import { getSkillsDir, log, c } from "../utils.js";

type Flags = { force: boolean; dir?: string };

export async function install(slug: string | undefined, flags: Flags) {
  if (!slug) {
    log.error("Missing skill slug.");
    log.info(`Usage: ${c("bold", "bentoskills install <slug>")}`);
    process.exit(1);
  }

  const info = getRegistryInfo();
  log.step(`Resolving ${c("cyan", slug)} in ${c("gray", info.repo)}…`);
  const registry = await fetchRegistry();
  const entry = registry.find((e) => e.slug === slug);
  if (!entry) {
    log.error(`Skill "${slug}" not found in the registry.`);
    const suggestions = registry
      .map((e) => e.slug)
      .filter((s) => s.startsWith(slug.slice(0, 3)))
      .slice(0, 5);
    if (suggestions.length) {
      log.info(`  Did you mean: ${suggestions.map((s) => c("cyan", s)).join(", ")}?`);
    } else {
      log.info(`  Run ${c("bold", "bentoskills list")} to see all skills.`);
    }
    process.exit(1);
  }

  const targetRoot = flags.dir ?? getSkillsDir();
  const targetDir = path.join(targetRoot, slug);

  try {
    const stat = await fs.stat(targetDir);
    if (stat.isDirectory() && !flags.force) {
      log.error(`${targetDir} already exists.`);
      log.info(`  Use ${c("bold", "--force")} to overwrite.`);
      process.exit(1);
    }
  } catch {
    // Directory doesn't exist — good.
  }

  log.step(`Listing files for ${c("cyan", slug)}…`);
  const files = await listSkillFiles(entry.path);

  const toDownload = files.filter((f) => f.type === "file" && f.download_url);
  const skippedDirs = files.filter((f) => f.type !== "file");

  if (toDownload.length === 0) {
    log.error(`No files found in ${entry.path}. Aborting.`);
    process.exit(1);
  }

  await fs.mkdir(targetDir, { recursive: true });

  log.step(`Downloading ${toDownload.length} file${toDownload.length === 1 ? "" : "s"}…`);
  for (const f of toDownload) {
    const buf = await downloadFile(f.download_url!);
    const dest = path.join(targetDir, f.name);
    await fs.writeFile(dest, buf);
    log.info(`  ${c("green", "+")} ${c("gray", path.relative(targetRoot, dest))}`);
  }

  if (skippedDirs.length > 0) {
    log.warn(
      `Skipped ${skippedDirs.length} non-file entr${skippedDirs.length === 1 ? "y" : "ies"} (subdirs not yet supported).`
    );
  }

  log.success(`Installed ${c("bold", slug)} → ${c("gray", targetDir)}`);
  log.dim(`  Claude Code will pick this skill up on next launch.`);
}
