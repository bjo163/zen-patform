import db from "@/lib/db";
import { cloudOrganizationMembers, cloudOrganizations } from "@/lib/cloud/schema";
import { eq } from "drizzle-orm";

export async function requireOrganizationMember(userId: string, organizationId: string) {
  const membership = await db.query.cloudOrganizationMembers.findFirst({
    where: (members, { and, eq: equal }) =>
      and(equal(members.organizationId, organizationId), equal(members.userId, userId)),
  });

  if (!membership) throw new Error("Organization access denied");
  return membership;
}

export async function getOrCreatePersonalOrganization(userId: string, name?: string) {
  const existing = await db.query.cloudOrganizationMembers.findFirst({
    where: (members, { eq: equal }) => equal(members.userId, userId),
    with: { organization: true },
  });

  if (existing?.organization) return existing.organization;

  const slug = `org-${userId.slice(0, 12)}`;
  const [organization] = await db
    .insert(cloudOrganizations)
    .values({ name: name ?? "Personal Workspace", slug })
    .returning();

  await db.insert(cloudOrganizationMembers).values({
    organizationId: organization.id,
    userId,
    role: "owner",
  });

  return organization;
}
