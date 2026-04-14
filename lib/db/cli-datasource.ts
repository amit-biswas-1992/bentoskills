import "reflect-metadata";
import { config } from "dotenv";
config({ path: ".env.local" });

import { DataSource } from "typeorm";
import path from "node:path";
import { User, Account, Session, Skill, Favorite, InstallLog } from "./entities";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

export default new DataSource({
  type: "postgres",
  url,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  entities: [User, Account, Session, Skill, Favorite, InstallLog],
  migrations: [path.join(process.cwd(), "lib/db/migrations/*.ts")],
  synchronize: false,
  logging: ["error", "warn"],
});
