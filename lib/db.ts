import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as legacySchema from "./schema";
import * as cloudSchema from "./cloud/schema";

const schema = { ...legacySchema, ...cloudSchema };
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

if (!connectionString && !isProductionBuild) {
  throw new Error("DATABASE_URL or POSTGRES_URL is required");
}

// Next.js evaluates route modules during the production build. Keep database
// initialization out of that phase so a missing runtime secret cannot break
// page-data collection. The real connection is still required at runtime.
const client = connectionString
  ? postgres(connectionString, {
      ssl: process.env.NODE_ENV === "production" ? "require" : undefined,
      max: 5,
      prepare: false,
    })
  : null;

export const db = client
  ? drizzle(client, { schema, logger: true })
  : (new Proxy({}, {
      get() {
        throw new Error("DATABASE_URL or POSTGRES_URL is required at runtime");
      },
    }) as ReturnType<typeof drizzle>);

export type DrizzleClient = typeof db;
export default db;
