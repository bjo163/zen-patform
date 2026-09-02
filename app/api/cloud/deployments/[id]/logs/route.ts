import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { getDeploymentProvider } from "@/lib/deployment";
import { requireOrganizationMember } from "@/lib/cloud/tenancy";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const deployment = await db.query.cloudDeployments.findFirst({
      where: (table, { eq }) => eq(table.id, params.id),
    });
    if (!deployment) return NextResponse.json({ error: "Deployment not found" }, { status: 404 });

    const project = await db.query.cloudProjects.findFirst({
      where: (table, { eq }) => eq(table.id, deployment.projectId),
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    await requireOrganizationMember(session.user.id, project.organizationId);
    if (!deployment.providerDeploymentId) return NextResponse.json({ logs: "No provider deployment logs are available yet." });

    const provider = getDeploymentProvider();
    const logs = await provider.getLogs(deployment.providerDeploymentId);
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("cloud deployment logs error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load deployment logs" }, { status: 500 });
  }
}
