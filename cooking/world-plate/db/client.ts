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
  return { db: drizzle(client, { schema }), client };
}
