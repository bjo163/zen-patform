import { asc, eq } from "drizzle-orm";
import db from "@/lib/db";
import { cloudPlans } from "@/lib/cloud/schema";

const fallbackPlans = [
  {
    id: "plan_starter",
    code: "starter",
    name: "Starter",
    priceIdr: 49000,
    cpuMillicores: 500,
    memoryMb: 512,
    storageGb: 5,
    projectLimit: 1,
    createdAt: new Date("2026-09-02T19:44:21.764Z"),
  },
];

export async function getCloudPlans() {
  try {
    const plans = await db
      .select()
      .from(cloudPlans)
      .orderBy(asc(cloudPlans.priceIdr), asc(cloudPlans.name));
    return plans.length > 0 ? plans : fallbackPlans;
  } catch {
    return fallbackPlans;
  }
}

export async function getCloudPlanByCode(code: string) {
  try {
    const rows = await db
      .select()
      .from(cloudPlans)
      .where(eq(cloudPlans.code, code))
      .limit(1);
    return rows[0] ?? fallbackPlans.find((plan) => plan.code === code) ?? null;
  } catch {
    return fallbackPlans.find((plan) => plan.code === code) ?? null;
  }
}
