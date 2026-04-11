import { NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api/handler";
import { Unauthorized, NotFound } from "@/lib/api/errors";
import { auth } from "@/lib/auth/server";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";
import { FavoriteRepository } from "@/lib/db/repositories/favorite.repository";

const Body = z.object({ slug: z.string().min(1) });

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session?.user) throw Unauthorized();
  const { slug } = Body.parse(await req.json());
  const skill = await new SkillRepository().findBySlug(slug);
  if (!skill) throw NotFound("skill not found");
  const res = await new FavoriteRepository().favorite(
    (session.user as { id: string }).id,
    skill.id,
  );
  return NextResponse.json({ favorited: true, count: res.count });
});
