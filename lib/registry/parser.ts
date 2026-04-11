import { z } from "zod";
import { parse as parseYaml } from "yaml";

const SEMVER = /^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/;
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

export const ParsedSkillSchema = z.object({
  slug: z.string().regex(SLUG),
  name: z.string().min(1).max(80),
  tagline: z.string().min(1).max(140),
  version: z.string().regex(SEMVER),
  author: z.string().min(1).max(80),
  category: z.enum(["accessibility", "critique", "copy", "handoff", "research", "system"]),
  tags: z.array(z.string().min(1).max(30)).max(20).default([]),
  license: z.string().optional(),
  homepage: z.string().url().optional(),
  publishedAt: z.coerce.date().optional(),
});

export type ParsedSkill = z.infer<typeof ParsedSkillSchema>;

export type ParseResult =
  | { ok: true; data: ParsedSkill }
  | { ok: false; error: string };

export function parseSkillYaml(raw: string): ParseResult {
  let obj: unknown;
  try {
    obj = parseYaml(raw);
  } catch (e) {
    return { ok: false, error: `yaml parse error: ${(e as Error).message}` };
  }
  const res = ParsedSkillSchema.safeParse(obj);
  if (!res.success) return { ok: false, error: res.error.message };
  return { ok: true, data: res.data };
}
