import { NextResponse } from "next/server";
import { getCloudPlans } from "@/lib/cloud/plans";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plans = await getCloudPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    console.error("cloud plans error", error);
    return NextResponse.json({ error: "Unable to load plans" }, { status: 500 });
  }
}
