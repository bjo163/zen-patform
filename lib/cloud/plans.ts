import { asc, eq } from "drizzle-orm";
import db from "@/lib/db";
import { cloudPlans } from "@/lib/cloud/schema";

export async function getCloudPlans() {
  return db.select().from(cloudPlans).orderBy(asc(cloudPlans.priceIdr), asc(cloudPlans.name));
}

export async function getCloudPlanByCode(code: string) {
  const rows = await db.select().from(cloudPlans).where(eq(cloudPlans.code, code)).limit(1);
  return rows[0] ?? null;
}
