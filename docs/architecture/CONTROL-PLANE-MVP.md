# Control Plane MVP

## Scope

Thin SaaS control plane over Coolify. The customer-facing product owns tenant, project, usage, billing, and UX; Coolify owns infrastructure orchestration.

## Runtime flow

```text
GitHub -> Control Plane -> DeploymentProvider -> Coolify -> VPS
                         -> deployment status/logs
```

## First domain model

```text
User
  -> Organization
    -> OrganizationMember
    -> Project
      -> Environment
        -> Deployment
        -> Domain
        -> DatabaseResource
    -> Subscription
    -> UsageRecord

Server -> ServerAllocation -> Project
AuditLog -> Organization
```

## Provider contract

The application must only depend on `DeploymentProvider` and never call Coolify directly from UI components. Provider credentials stay server-side.

Current provider:

- `coolify` — primary MVP provider

Planned:

- `temps` — secondary provider for evaluation

## MVP API surface

- `POST /api/projects`
- `POST /api/projects/:id/deploy`
- `GET /api/deployments/:id`
- `GET /api/deployments/:id/logs`
- `POST /api/projects/:id/domains`
- `POST /api/projects/:id/restart`
- `POST /api/projects/:id/rollback`

All routes require authenticated organization membership and server-side tenant authorization.

## Configuration

Required for Coolify:

```env
DEPLOYMENT_PROVIDER=coolify
COOLIFY_BASE_URL=https://coolify.example.com
COOLIFY_API_TOKEN=
COOLIFY_DESTINATION_ID=
# alternatively COOLIFY_SERVER_UUID=
```

Never expose `COOLIFY_API_TOKEN` to the browser.

## Delivery order

1. Replace site-centric dashboard terminology with Project/Environment terminology.
2. Add organization/project tables alongside existing starter schema.
3. Add API endpoints around the provider abstraction.
4. Add GitHub repository selector.
5. Execute a real Coolify deployment from the dashboard.
6. Persist deployment state and logs.
7. Add domain/SSL workflow.
8. Add quota/usage metering.

## Definition of done for Phase 1

A test account can create an organization and project, select a GitHub repository, deploy it through Coolify, receive the resulting URL, and view status/logs without seeing infrastructure credentials.
