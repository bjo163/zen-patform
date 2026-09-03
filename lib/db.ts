import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as legacySchema from "./schema";
import * as cloudSchema from "./cloud/schema";

const schema = { ...legacySchema, ...cloudSchema };
const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
const runtimeConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// Keep the Drizzle client shape identical in build and runtime so TypeScript
// preserves db.query.* for every schema table. The build-time placeholder is
// only used to construct the lazy postgres client; no database query should
// run during static generation.
const connectionString =
  runtimeConnectionString || (isProductionBuild ? "postgresql://build:build@localhost:5432/build" : undefined);

if (!connectionString) {
  throw new Error("DATABASE_URL or POSTGRES_URL is required");
}

const client = postgres(connectionString, {
  ssl: process.env.NODE_ENV === "production" ? "require" : undefined,
  max: 5,
  prepare: false,
});

export const db = drizzle(client, { schema, logger: true });

export type DrizzleClient = typeof db;
export default db;
