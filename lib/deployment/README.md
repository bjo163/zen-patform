# Deployment Provider Layer

This directory isolates infrastructure providers from the customer-facing control plane.

## Primary provider

`CoolifyProvider` is the MVP implementation.

Environment variables:

```env
DEPLOYMENT_PROVIDER=coolify
COOLIFY_BASE_URL=https://coolify.example.com
COOLIFY_API_TOKEN=...
COOLIFY_PROJECT_UUID=...
COOLIFY_ENVIRONMENT_UUID=...
COOLIFY_SERVER_UUID=...
COOLIFY_DESTINATION_UUID=...
```

The API token must remain server-side.

## Provider contract

The control plane calls only `DeploymentProvider`:

```text
createProject
  -> deploy
  -> getDeploymentStatus
  -> getLogs
  -> createDomain
  -> restart
  -> rollback
  -> deleteProject
```

## Coolify API mapping

The adapter currently maps the MVP flow to Coolify's application/deployment APIs:

```text
POST /api/v1/applications/public
GET  /api/v1/applications/{uuid}/start
GET  /api/v1/deployments/{uuid}
GET  /api/v1/applications/{uuid}
DELETE /api/v1/applications/{uuid}
```

Coolify's current API requires the target project UUID, server UUID, and either environment UUID or environment name when creating a public application. See the official API reference before changing the adapter contract.

## Next adapters

A `TempsProvider` can be added later without changing the customer dashboard or billing model.
