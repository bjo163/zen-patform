import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import * as legacySchema from "./schema";
import * as cloudSchema from "./cloud/schema";

const schema = { ...legacySchema, ...cloudSchema };
const db = drizzle(sql, { schema, logger: true });

export default db;

export type DrizzleClient = typeof db;
