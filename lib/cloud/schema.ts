import { relations } from "drizzle-orm";
import { boolean, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "../schema";

export const cloudOrganizations = pgTable("cloud_organizations", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

export const cloudOrganizationMembers = pgTable(
  "cloud_organization_members",
  {
    organizationId: text("organizationId").notNull().references(() => cloudOrganizations.id, { onDelete: "cascade" }),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({ compositePk: primaryKey({ columns: [table.organizationId, table.userId] }) }),
);

export const cloudProjects = pgTable(
  "cloud_projects",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    organizationId: text("organizationId").notNull().references(() => cloudOrganizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    repositoryUrl: text("repositoryUrl"),
    defaultBranch: text("defaultBranch").notNull().default("main"),
    provider: text("provider").notNull().default("coolify"),
    providerProjectId: text("providerProjectId"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({ orgSlugKey: uniqueIndex().on(table.organizationId, table.slug), orgIdx: index().on(table.organizationId) }),
);

export const cloudEnvironments = pgTable(
  "cloud_environments",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    projectId: text("projectId").notNull().references(() => cloudProjects.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("production"),
    providerEnvironmentId: text("providerEnvironmentId"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({ projectNameKey: uniqueIndex().on(table.projectId, table.name) }),
);

export const cloudDeployments = pgTable(
  "cloud_deployments",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    projectId: text("projectId").notNull().references(() => cloudProjects.id, { onDelete: "cascade" }),
    environmentId: text("environmentId").notNull().references(() => cloudEnvironments.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("coolify"),
    providerDeploymentId: text("providerDeploymentId"),
    status: text("status").notNull().default("queued"),
    url: text("url"),
    commitSha: text("commitSha"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({ projectIdx: index().on(table.projectId), environmentIdx: index().on(table.environmentId) }),
);

export const cloudDomains = pgTable("cloud_domains", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  projectId: text("projectId").notNull().references(() => cloudProjects.id, { onDelete: "cascade" }),
  domain: text("domain").notNull().unique(),
  status: text("status").notNull().default("pending"),
  isPrimary: boolean("isPrimary").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const cloudPlans = pgTable("cloud_plans", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  priceIdr: integer("priceIdr").notNull().default(0),
  cpuMillicores: integer("cpuMillicores").notNull().default(500),
  memoryMb: integer("memoryMb").notNull().default(512),
  storageGb: integer("storageGb").notNull().default(5),
  projectLimit: integer("projectLimit").notNull().default(1),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const cloudSubscriptions = pgTable("cloud_subscriptions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organizationId").notNull().references(() => cloudOrganizations.id, { onDelete: "cascade" }),
  planId: text("planId").notNull().references(() => cloudPlans.id),
  status: text("status").notNull().default("trialing"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const cloudOrganizationRelations = relations(cloudOrganizations, ({ many }) => ({
  members: many(cloudOrganizationMembers),
  projects: many(cloudProjects),
  subscriptions: many(cloudSubscriptions),
}));

export const cloudProjectRelations = relations(cloudProjects, ({ one, many }) => ({
  organization: one(cloudOrganizations, { references: [cloudOrganizations.id], fields: [cloudProjects.organizationId] }),
  environments: many(cloudEnvironments),
  deployments: many(cloudDeployments),
  domains: many(cloudDomains),
}));

export const cloudEnvironmentRelations = relations(cloudEnvironments, ({ one, many }) => ({
  project: one(cloudProjects, { references: [cloudProjects.id], fields: [cloudEnvironments.projectId] }),
  deployments: many(cloudDeployments),
}));

export const cloudDeploymentRelations = relations(cloudDeployments, ({ one }) => ({
  project: one(cloudProjects, { references: [cloudProjects.id], fields: [cloudDeployments.projectId] }),
  environment: one(cloudEnvironments, { references: [cloudEnvironments.id], fields: [cloudDeployments.environmentId] }),
}));
