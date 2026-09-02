# Zen DB Core

## Standard

Zen Platform uses **Supabase PostgreSQL** as the managed database and **Drizzle ORM** as the application ORM.

- PostgreSQL provider: Supabase
- ORM: Drizzle ORM
- Node driver: `pg`
- Schema source: `lib/all-schema.ts`
- Shared client: `lib/db.ts`
- Barrel: `lib/db/index.ts`
- Migration tooling: Drizzle Kit for application schema, Supabase migrations for Supabase-specific SQL

## Authentication bridge

Supabase Auth is the canonical identity provider for the new auth flow. The existing `public.users.id` remains a text application identifier for backward compatibility.

`public.users.authUserId` stores the Supabase Auth UUID. A database trigger synchronizes Supabase `auth.users` inserts, updates, and deletes into `public.users`.

The shared application session API in `lib/auth.ts` supports both the existing NextAuth session and Supabase Auth claims during migration.

## Tenancy

Developer Cloud ownership is modeled as:

`users -> cloud_organization_members -> cloud_organizations -> cloud_projects -> cloud_environments -> cloud_deployments/cloud_domains`

The server-side application continues to enforce organization membership before privileged Developer Cloud operations.

## RLS

RLS is enabled on all 15 public tables. Public API privileges are intentionally restricted, while authenticated access is limited by RLS policies.

Organization membership helpers live in the private schema and are used by Developer Cloud policies.

Applied hosted migrations:

- `20260902155852_initial_zen_platform_schema`
- `20260902190700_zen_auth_rls_bridge_v2`

## Query convention

Application code should access PostgreSQL through Drizzle rather than calling Supabase REST for normal server-side CRUD.

Use Supabase clients for Supabase-specific capabilities such as Auth, Storage, and Realtime.

Keep authorization in the application/service layer and reinforce it with database RLS for any exposed Data API paths.
