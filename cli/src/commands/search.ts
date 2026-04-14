/**
 * `bentoskills search <query>` — substring match on slug and path.
 * (Full-text search lives in the web app; the CLI stays simple and offline-ish.)
 */

import { fetchRegistry } from "../registry.js";
import { c, log } from "../utils.js";

export async function search(query: string | undefined) {
  if (!query) {
    log.error("Missing search query.");
    log.info(`Usage: ${c("bold", "bentoskills search <query>")}`);
    process.exit(1);
  }
  const q = query.toLowerCase();
  const registry = await fetchRegistry();
  const matches = registry.filter(
    (e) => e.slug.toLowerCase().includes(q) || e.path.toLowerCase().includes(q)
  );
  if (matches.length === 0) {
    log.warn(`No skills matched "${query}".`);
    return;
  }
  log.info(`${c("bold", `${matches.length} match${matches.length === 1 ? "" : "es"}`)}:\n`);
  for (const entry of matches) {
    console.log(`  ${c("cyan", entry.slug)}  ${c("gray", entry.path)}`);
  }
}
