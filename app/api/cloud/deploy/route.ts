import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { getDeploymentProvider } from "@/lib/deployment";
import { getOrCreatePersonalOrganization, requireOrganizationMember } from "@/lib/cloud/tenancy";
import { cloudDeployments, cloudEnvironments, cloudProjects } from "@/lib/cloud/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let projectId: string | undefined;
  let environmentId: string | undefined;
  let providerProjectId: string | undefined;

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const repositoryUrl = String(body.repositoryUrl ?? "").trim();
    const branch = String(body.branch ?? "main").trim() || "main";
    const organizationId = body.organizationId ? String(body.organizationId) : undefined;

    if (!name || !repositoryUrl) {
      return NextResponse.json({ error: "name and repositoryUrl are required" }, { status: 400 });
    }

    const organization = organizationId
      ? await requireOrganizationMember(session.user.id, organizationId).then(async () => {
          const found = await db.query.cloudOrganizations.findFirst({
            where: (org, { eq: equal }) => equal(org.id, organizationId),
          });
          if (!found) throw new Error("Organization not found");
          return found;
        })
      : await getOrCreatePersonalOrganization(session.user.id);

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "project";
    const existing = await db.query.cloudProjects.findFirst({
      where: (projects, { and, eq: equal }) => and(equal(projects.organizationId, organization.id), equal(projects.slug, slug)),
    });
    if (existing) return NextResponse.json({ error: "Project already exists" }, { status: 409 });

    const [project] = await db.insert(cloudProjects).values({
      organizationId: organization.id,
      name,
      slug,
      repositoryUrl,
      defaultBranch: branch,
      provider: "coolify",
    }).returning();
    projectId = project.id;

    const [environment] = await db.insert(cloudEnvironments).values({
      projectId: project.id,
      name: "production",
    }).returning();
    environmentId = environment.id;

    const provider = getDeploymentProvider();
    const created = await provider.createProject({ name, repositoryUrl, branch });
    providerProjectId = created.providerProjectId;
    const deployment = await provider.deploy(created.providerProjectId);

    await db.update(cloudProjects)
      .set({ providerProjectId: created.providerProjectId, updatedAt: new Date() })
      .where(eq(cloudProjects.id, project.id));

    const [record] = await db.insert(cloudDeployments).values({
      projectId: project.id,
      environmentId: environment.id,
      provider: provider.type,
      providerDeploymentId: deployment.deploymentId,
      status: deployment.status,
      url: deployment.url,
    }).returning();

    return NextResponse.json({ project: { ...project, providerProjectId: created.providerProjectId }, environment, deployment: record }, { status: 201 });
  } catch (error) {
    console.error("cloud deploy error", error);

    try {
      if (providerProjectId) {
        await getDeploymentProvider().deleteProject(providerProjectId);
      }
    } catch (cleanupError) {
      console.error("cloud deploy provider cleanup error", cleanupError);
    }

    try {
      if (environmentId) await db.delete(cloudEnvironments).where(eq(cloudEnvironments.id, environmentId));
      if (projectId) await db.delete(cloudProjects).where(eq(cloudProjects.id, projectId));
    } catch (cleanupError) {
      console.error("cloud deploy database cleanup error", cleanupError);
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Deployment failed" }, { status: 500 });
  }
}
