/**
 * Tiny helpers — logging with ANSI color, path resolution, basic IO.
 * Kept dependency-free so the CLI bundle stays small.
 */

import { styleText } from "node:util";
import os from "node:os";
import path from "node:path";

type Color = "green" | "red" | "yellow" | "cyan" | "gray" | "magenta" | "bold";

const supportsColor =
  process.stdout.isTTY &&
  process.env.NO_COLOR === undefined &&
  process.env.TERM !== "dumb";

export function c(color: Color | Color[], text: string): string {
  if (!supportsColor) return text;
  const colors = Array.isArray(color) ? color : [color];
  try {
    return styleText(colors, text);
  } catch {
    return text;
  }
}

export const log = {
  info: (msg: string) => console.log(msg),
  success: (msg: string) => console.log(`${c("green", "✓")} ${msg}`),
  warn: (msg: string) => console.error(`${c("yellow", "⚠")} ${msg}`),
  error: (msg: string) => console.error(`${c("red", "✗")} ${msg}`),
  step: (msg: string) => console.log(`${c("cyan", "→")} ${msg}`),
  dim: (msg: string) => console.log(c("gray", msg)),
};

/** Where we install skills: $CLAUDE_SKILLS_DIR or ~/.claude/skills */
export function getSkillsDir(): string {
  if (process.env.CLAUDE_SKILLS_DIR) return process.env.CLAUDE_SKILLS_DIR;
  return path.join(os.homedir(), ".claude", "skills");
}
