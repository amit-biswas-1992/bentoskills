import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import { TypeORMAdapter } from "@auth/typeorm-adapter";

// The ssl option belongs on the DataSourceOptions (first arg), not on TypeORMAdapterOptions.
const dataSourceUrl: string | import("typeorm").DataSourceOptions =
  process.env.DATABASE_SSL === "true"
    ? {
        type: "postgres",
        url: process.env.DATABASE_URL ?? "postgresql://invalid",
        ssl: { rejectUnauthorized: false },
      }
    : (process.env.DATABASE_URL ?? "postgresql://invalid");

export const authOptions: NextAuthConfig = {
  adapter: TypeORMAdapter(dataSourceUrl),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      if (session.user) (session.user as { id?: string }).id = user.id;
      return session;
    },
  },
};
