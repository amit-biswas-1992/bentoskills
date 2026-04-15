import "reflect-metadata";
import { DataSource } from "typeorm";
import { User, Account, Session, Skill, Favorite, InstallLog } from "./entities";

/**
 * Runtime DataSource for the Next.js app server.
 *
 * Two problems this file is solving:
 *
 * 1. **Bundle isolation.** Next bundles pages and route handlers separately,
 *    so each bundle ends up with its own `Skill` class object. TypeORM looks
 *    up metadata by class identity, so a DataSource built with bundle A's
 *    `Skill` can't serve queries from bundle B. We key the cache on the
 *    current `Skill` reference.
 *
 * 2. **HMR churn.** Every save reloads modules, which changes the `Skill`
 *    identity again. Without cleanup we'd accumulate dead DataSources,
 *    each holding open pg connections, and eventually exhaust the pooler.
 *    On every cache miss we destroy previously cached DataSources before
 *    building the new one.
 *
 * Paired with the transaction pooler (port 6543) in .env.local, which lets
 * short-lived app queries coexist at high concurrency.
 */

type DbCache = {
  byClass: Map<unknown, DataSource>;
};

const globalForDb = globalThis as unknown as {
  _dbCache?: DbCache;
};

if (!globalForDb._dbCache) {
  globalForDb._dbCache = { byClass: new Map() };
}

const cache: DbCache = globalForDb._dbCache;

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
    // Cap per-DataSource connections so a single bundle can't starve the pooler.
    poolSize: 5,
  });
}

/** Fire-and-forget destroy — swallows errors so one bad pool can't cascade. */
function destroyQuietly(ds: DataSource): void {
  if (!ds.isInitialized) return;
  ds.destroy().catch(() => {
    // TypeORM/pg can throw "Called end on pool more than once" if cleanup
    // raced with another path. That's fine during teardown.
  });
}

export function getDataSource(): DataSource {
  const existing = cache.byClass.get(Skill);
  if (existing) return existing;

  // Cache miss: a new bundle identity showed up. Tear down every old
  // DataSource before creating the new one so we don't leak pools.
  for (const old of cache.byClass.values()) destroyQuietly(old);
  cache.byClass.clear();

  const ds = buildDataSource();
  cache.byClass.set(Skill, ds);
  return ds;
}

export async function ensureInitialized(): Promise<DataSource> {
  const ds = getDataSource();
  if (!ds.isInitialized) {
    try {
      await ds.initialize();
    } catch (err) {
      // Failed init leaves TypeORM in a half-built state. Drop this instance
      // from the cache so the next call builds a fresh one instead of
      // hitting "Called end on pool more than once".
      cache.byClass.delete(Skill);
      throw err;
    }
  }
  return ds;
}
