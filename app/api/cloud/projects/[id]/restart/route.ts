import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { getDeploymentProvider } from "@/lib/deployment";
import { requireOrganizationMember } from "@/lib/cloud/tenancy";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const project = await db.query.cloudProjects.findFirst({
      where: (table, { eq }) => eq(table.id, params.id),
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    await requireOrganizationMember(session.user.id, project.organizationId);
    if (!project.providerProjectId) return NextResponse.json({ error: "Project is not provisioned yet" }, { status: 409 });

    const provider = getDeploymentProvider();
    await provider.restart(project.providerProjectId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("cloud project restart error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to restart project" }, { status: 500 });
  }
}
