import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/handler";
import { Unauthorized, NotFound } from "@/lib/api/errors";
import { auth } from "@/lib/auth/server";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";
import { FavoriteRepository } from "@/lib/db/repositories/favorite.repository";

export const DELETE = withErrorHandler(
  async (_req: Request, ctx: { params: Promise<{ slug: string }> }) => {
    const session = await auth();
    if (!session?.user) throw Unauthorized();
    const { slug } = await ctx.params;
    const skill = await new SkillRepository().findBySlug(slug);
    if (!skill) throw NotFound("skill not found");
    const res = await new FavoriteRepository().unfavorite(
      (session.user as { id: string }).id,
      skill.id,
    );
    return NextResponse.json({ favorited: false, count: res.count });
  },
);
