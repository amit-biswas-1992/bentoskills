/**
 * bentoskills CLI entry point.
 *
 * Uses node:util.parseArgs for flags so there are zero runtime deps —
 * the whole package is stdlib + TypeScript. Commands are dispatched by
 * positional.
 */

import { parseArgs } from "node:util";
import { install } from "./commands/install.js";
import { list } from "./commands/list.js";
import { search } from "./commands/search.js";
import { c, log, getSkillsDir } from "./utils.js";

const VERSION = "0.1.0";

const HELP = `
${c("bold", "bentoskills")} — install UI/UX agent skills for Claude Code

${c("bold", "USAGE")}
  bentoskills <command> [options]

${c("bold", "COMMANDS")}
  ${c("cyan", "install")} <slug>     Download a skill into your Claude skills directory
  ${c("cyan", "list")}               List every skill in the registry
  ${c("cyan", "search")} <query>     Search for skills by slug or path
  ${c("cyan", "help")}               Show this message
  ${c("cyan", "version")}            Print the CLI version

${c("bold", "OPTIONS")}
  --force              Overwrite existing skill directory on install
  --dir <path>         Install to a custom directory (default: ${c("gray", getSkillsDir())})
  -h, --help           Show help
  -v, --version        Show version

${c("bold", "EXAMPLES")}
  bentoskills install design-critique
  bentoskills install accessibility-review --force
  bentoskills search copy
  bentoskills list

${c("bold", "ENVIRONMENT")}
  GITHUB_TOKEN                    Lift GitHub API rate limit (60 → 5000/hr)
  CLAUDE_SKILLS_DIR               Override default install directory
  BENTOSKILLS_REGISTRY_REPO       Use a different registry repo (owner/name)
  BENTOSKILLS_REGISTRY_BRANCH     Use a different registry branch

Learn more: ${c("cyan", "https://bentoskills.sh")}
`;

async function main() {
  const argv = process.argv.slice(2);

  // Fast paths for help / version regardless of position.
  if (argv.length === 0 || argv.includes("-h") || argv.includes("--help") || argv[0] === "help") {
    console.log(HELP);
    return;
  }
  if (argv.includes("-v") || argv.includes("--version") || argv[0] === "version") {
    console.log(VERSION);
    return;
  }

  const [command, ...rest] = argv;

  // Parse flags from the remaining args so commands see clean positionals.
  const { values, positionals } = parseArgs({
    args: rest,
    options: {
      force: { type: "boolean", default: false },
      dir: { type: "string" },
    },
    allowPositionals: true,
    strict: true,
  });

  switch (command) {
    case "install":
      await install(positionals[0], { force: values.force as boolean, dir: values.dir as string | undefined });
      break;
    case "list":
    case "ls":
      await list();
      break;
    case "search":
    case "find":
      await search(positionals[0]);
      break;
    default:
      log.error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  log.error(msg);
  if (process.env.DEBUG && err instanceof Error && err.stack) {
    console.error(c("gray", err.stack));
  }
  process.exit(1);
});
