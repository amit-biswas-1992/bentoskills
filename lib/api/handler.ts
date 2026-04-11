import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./errors";
import { logger } from "@/lib/logger";

type Handler<Ctx> = (req: Request, ctx: Ctx) => Promise<Response>;

export function withErrorHandler<Ctx>(fn: Handler<Ctx>): Handler<Ctx> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) {
        return NextResponse.json(
          { error: { code: e.code, message: e.message, fields: e.fields } },
          { status: e.status },
        );
      }
      if (e instanceof ZodError) {
        const fields: Record<string, string[]> = {};
        for (const iss of e.issues) {
          const key = iss.path.join(".") || "_";
          (fields[key] ||= []).push(iss.message);
        }
        return NextResponse.json(
          { error: { code: "validation_error", message: "invalid input", fields } },
          { status: 400 },
        );
      }
      logger.error({ error: (e as Error).message }, "unhandled api error");
      return NextResponse.json(
        { error: { code: "internal_error", message: "something went wrong" } },
        { status: 500 },
      );
    }
  };
}
