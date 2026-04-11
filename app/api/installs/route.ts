import { NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api/handler";
import { NotFound } from "@/lib/api/errors";
import { auth } from "@/lib/auth/server";
import { SkillRepository } from "@/lib/db/repositories/skill.repository";
import { InstallLogRepository } from "@/lib/db/repositories/install-log.repository";

const Body = z.object({ slug: z.string().min(1) });

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  const { slug } = Body.parse(await req.json());
  const skill = await new SkillRepository().findBySlug(slug);
  if (!skill) throw NotFound("skill not found");
  const userId = session?.user ? (session.user as { id: string }).id : null;
  await new InstallLogRepository().log(userId, skill.id, "web");
  return NextResponse.json({ ok: true });
});
