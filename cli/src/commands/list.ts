/**
 * `bentoskills list` — prints every skill slug from the registry.
 */

import { fetchRegistry, getRegistryInfo } from "../registry.js";
import { c, log } from "../utils.js";

export async function list() {
  const info = getRegistryInfo();
  const registry = await fetchRegistry();
  if (registry.length === 0) {
    log.warn("Registry is empty.");
    return;
  }
  log.info(
    `${c("bold", `${registry.length} skill${registry.length === 1 ? "" : "s"}`)} in ${c("gray", info.repo)}:\n`
  );
  for (const entry of registry) {
    console.log(`  ${c("cyan", entry.slug)}  ${c("gray", entry.path)}`);
  }
  console.log("");
  log.dim(`Install one with: bentoskills install <slug>`);
}
