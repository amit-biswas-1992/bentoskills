import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "node:path";

const globalForDb = globalThis as unknown as { _dataSource?: DataSource };

export function getDataSource(): DataSource {
  if (globalForDb._dataSource) return globalForDb._dataSource;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const ds = new DataSource({
    type: "postgres",
    url,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
    entities: [path.join(process.cwd(), "lib/db/entities/*.ts")],
    migrations: [path.join(process.cwd(), "lib/db/migrations/*.ts")],
    synchronize: false,
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  globalForDb._dataSource = ds;
  return ds;
}

export async function ensureInitialized(): Promise<DataSource> {
  const ds = getDataSource();
  if (!ds.isInitialized) await ds.initialize();
  return ds;
}
