import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { getDeploymentProvider } from "@/lib/deployment";
import { requireOrganizationMember } from "@/lib/cloud/tenancy";
import { cloudDeployments, cloudProjects } from "@/lib/cloud/schema";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const deployment = await db.query.cloudDeployments.findFirst({
    where: (table, { eq: equal }) => equal(table.id, params.id),
  });
  if (!deployment) return NextResponse.json({ error: "Deployment not found" }, { status: 404 });

  const project = await db.query.cloudProjects.findFirst({
    where: (table, { eq: equal }) => equal(table.id, deployment.projectId),
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  try {
    await requireOrganizationMember(session.user.id, project.organizationId);
    if (!deployment.providerDeploymentId) return NextResponse.json({ deployment });

    const provider = getDeploymentProvider();
    const current = await provider.getDeploymentStatus(deployment.providerDeploymentId);

    const [updated] = await db.update(cloudDeployments)
      .set({ status: current.status, url: current.url ?? deployment.url })
      .where(eq(cloudDeployments.id, deployment.id))
      .returning();

    return NextResponse.json({ deployment: updated });
  } catch (error) {
    console.error("cloud deployment status error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to refresh deployment" }, { status: 500 });
  }
}
