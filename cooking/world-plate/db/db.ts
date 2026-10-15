import "server-only";
import { createDatabase, type Database } from "./client";

// One connection per server process; reused across hot reloads in dev.
const globalForDb = globalThis as unknown as { worldPlateDb?: Database };

export const db: Database = globalForDb.worldPlateDb ?? createDatabase().db;

if (process.env.NODE_ENV !== "production") globalForDb.worldPlateDb = db;
