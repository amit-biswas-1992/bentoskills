import "reflect-metadata";
import { config } from "dotenv";
config({ path: ".env.local" });

import { DataSource } from "typeorm";
import path from "node:path";
import { User, Account, Session, Skill, Favorite, InstallLog } from "./entities";

// Migrations must run against the session pooler (or a direct connection).
// The transaction pooler used by the app server doesn't support the
// session-scoped features TypeORM migrations rely on.
const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("MIGRATION_DATABASE_URL / DATABASE_URL is not set");

export default new DataSource({
  type: "postgres",
  url,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  entities: [User, Account, Session, Skill, Favorite, InstallLog],
  migrations: [path.join(process.cwd(), "lib/db/migrations/*.ts")],
  synchronize: false,
  logging: ["error", "warn"],
});
