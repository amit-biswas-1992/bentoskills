import "reflect-metadata";
import { DataSource } from "typeorm";
import { User, Account, Session, Skill, Favorite, InstallLog } from "./entities";

// Next.js bundles pages and route handlers separately, giving each bundle its
// own copy of the entity classes. TypeORM's DataSource caches metadata by
// class identity, so a DataSource built in bundle A cannot serve queries from
// bundle B's class constructors. We cache one DataSource per unique Skill
// class constructor, keyed on globalThis so HMR reloads reuse the cache.
const globalForDb = globalThis as unknown as {
  _dataSourceByClass?: Map<unknown, DataSource>;
};
if (!globalForDb._dataSourceByClass) {
  globalForDb._dataSourceByClass = new Map();
}

function buildDataSource(): DataSource {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  return new DataSource({
    type: "postgres",
    url,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
    entities: [User, Account, Session, Skill, Favorite, InstallLog],
    synchronize: false,
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export function getDataSource(): DataSource {
  const cache = globalForDb._dataSourceByClass!;
  const existing = cache.get(Skill);
  if (existing) return existing;
  const ds = buildDataSource();
  cache.set(Skill, ds);
  return ds;
}

export async function ensureInitialized(): Promise<DataSource> {
  const ds = getDataSource();
  if (!ds.isInitialized) await ds.initialize();
  return ds;
}
