import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type Database = LibSQLDatabase<typeof schema>;

export const DEFAULT_DATABASE_URL = "file:db/world-plate.db";

export function createDatabase(url = process.env.DATABASE_URL || DEFAULT_DATABASE_URL): {
  db: Database;
  client: Client;
} {
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  // A local file can be briefly locked by something else (OneDrive syncing it right after the seed, a parallel build
  // worker): wait up to 10 s for the lock instead of failing the query with SQLITE_BUSY. The local client runs
  // statements in order, so this applies before any query.
  if (url.startsWith("file:")) void client.execute("PRAGMA busy_timeout = 10000").catch(() => {});
  return { db: drizzle(client, { schema }), client };
}
