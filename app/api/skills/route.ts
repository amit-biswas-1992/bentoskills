import { NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api/handler";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";

const QuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  sort: z.enum(["popular", "newest", "name"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(24),
});

export const GET = withErrorHandler(async (req: Request) => {
  const url = new URL(req.url);
  const args = QuerySchema.parse(Object.fromEntries(url.searchParams));
  const repo = new SkillRepository();
  const result = await repo.search(args);
  return NextResponse.json(result);
});
