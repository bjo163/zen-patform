import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as legacySchema from "./schema";
import * as cloudSchema from "./cloud/schema";

const schema = { ...legacySchema, ...cloudSchema };
const runtimeConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// Vercel can build the app without the runtime database configured yet. Keep
// the Drizzle client constructible so public pages can render and handle their
// database calls explicitly instead of crashing during module initialization.
// Production database access still requires DATABASE_URL or POSTGRES_URL.
const connectionString =
  runtimeConnectionString || "postgresql://build:build@127.0.0.1:5432/build";

const client = postgres(connectionString, {
  ssl: process.env.NODE_ENV === "production" && runtimeConnectionString ? "require" : undefined,
  max: 5,
  prepare: false,
  connect_timeout: 5,
});

export const db = drizzle(client, { schema, logger: true });

export type DrizzleClient = typeof db;
export default db;
