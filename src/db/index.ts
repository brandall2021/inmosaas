import "server-only";

import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * The application talks to a single Postgres dialect in every environment.
 *
 * - Local development without `DATABASE_URL` uses embedded PGlite backed by
 *   `./.pgdata`, so no database server is required.
 * - Staging/production sets `DATABASE_URL` and uses a real Postgres server.
 *
 * Both drivers share `schema`, so queries and migrations are identical.
 */
export type Database = PgliteDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { db?: Database };

function createDatabase(): Database {
  const url = process.env.DATABASE_URL;

  if (url) {
    const client = postgres(url, { prepare: false });
    return drizzlePostgres(client, { schema }) as unknown as Database;
  }

  const client = new PGlite("./.pgdata");
  return drizzlePglite(client, { schema });
}

/**
 * Lazily creates (and memoizes) the connection. Deferring this to first use
 * keeps the embedded PGlite instance — and its WASM payload — out of the build
 * and out of any code path that never touches the database.
 */
export function getDb(): Database {
  if (!globalForDb.db) {
    globalForDb.db = createDatabase();
  }
  return globalForDb.db;
}

/**
 * Ergonomic handle used across the app. It is a thin proxy that forwards every
 * access to the lazily created connection, binding methods to the real
 * instance so `db.select(...)`, `db.insert(...)`, etc. behave normally.
 */
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const real = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(real, property, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
