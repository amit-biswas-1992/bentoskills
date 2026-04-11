import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { NotFound } from "@/lib/api/errors";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";

export const GET = withErrorHandler(
  async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
    const { slug } = await ctx.params;
    const skill = await new SkillRepository().findBySlug(slug);
    if (!skill) throw NotFound("skill not found");
    return NextResponse.json(skill);
  },
);
