import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { getOrCreatePersonalOrganization } from "@/lib/cloud/tenancy";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const organization = await getOrCreatePersonalOrganization(session.user.id);
    const projects = await db.query.cloudProjects.findMany({
      where: (project, { eq }) => eq(project.organizationId, organization.id),
      with: { environments: true, deployments: true, domains: true },
      orderBy: (project, { desc }) => desc(project.createdAt),
    });

    return NextResponse.json({ organization, projects });
  } catch (error) {
    console.error("cloud projects error", error);
    return NextResponse.json({ error: "Unable to load projects" }, { status: 500 });
  }
}
