import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as legacySchema from "./schema";
import * as cloudSchema from "./cloud/schema";

const schema = { ...legacySchema, ...cloudSchema };

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

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
