import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getDeploymentProvider } from "@/lib/deployment";
import { requireOrganizationMember } from "@/lib/cloud/tenancy";
import { cloudDomains } from "@/lib/cloud/schema";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const body = await request.json();
    const domain = String(body.domain ?? "").trim().toLowerCase();
    if (!domain || !/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain)) {
      return NextResponse.json({ error: "A valid domain is required" }, { status: 400 });
    }

    const project = await db.query.cloudProjects.findFirst({
      where: (table, { eq }) => eq(table.id, params.id),
    });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    await requireOrganizationMember(session.user.id, project.organizationId);
    if (!project.providerProjectId) return NextResponse.json({ error: "Project is not provisioned yet" }, { status: 409 });

    const existing = await db.query.cloudDomains.findFirst({
      where: (table, { eq }) => eq(table.domain, domain),
    });
    if (existing && existing.projectId !== project.id) return NextResponse.json({ error: "Domain is already connected to another project" }, { status: 409 });
    if (existing) return NextResponse.json({ domain: existing });

    const provider = getDeploymentProvider();
    await provider.createDomain(project.providerProjectId, domain);

    const [created] = await db.insert(cloudDomains).values({
      projectId: project.id,
      domain,
      status: "active",
      isPrimary: body.isPrimary === true,
    }).returning();

    return NextResponse.json({ domain: created }, { status: 201 });
  } catch (error) {
    console.error("cloud project domain error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to connect domain" }, { status: 500 });
  }
}
