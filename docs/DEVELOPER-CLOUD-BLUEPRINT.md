# Developer Cloud Business Platform Blueprint

Status: Planning / MVP
Owner: bjo163

## 1. Product

Build an Indonesia-first Developer Cloud: a managed application platform where developers connect GitHub, deploy applications, configure domains, databases, logs, monitoring, backups, and billing without managing raw servers.

Core promise:

> Deploy and run your application without managing servers.

The product is not a VPS reseller. VPS/bare metal infrastructure is the underlying compute layer; the customer buys the developer experience and managed platform.

## 2. Recommended Architecture

```text
Customer
  |
  v
Your Dashboard (Next.js)
  |
  +-- Auth / Organizations / Teams
  +-- Projects / Environments
  +-- Billing / Plans / Quotas
  +-- Domains / DNS
  +-- Deployments / Logs
  +-- Monitoring / Usage
  |
  v
Your Control API
  |
  +-- Tenant service
  +-- Provisioning service
  +-- Billing service
  +-- Usage/Quota service
  +-- Deployment adapter
  |
  v
Deployment Engine
  |
  +-- Coolify (MVP baseline)
  +-- Temps (experimental/secondary adapter)
  |
  v
VPS / Bare Metal Cluster
  |
  +-- Docker workloads
  +-- PostgreSQL / Redis
  +-- Object Storage
  +-- Monitoring
```

## 3. MVP Engine Decision

Use Coolify first as the deployment engine because the business product should not depend on implementing orchestration, SSL, deployments, container lifecycle, and server management from zero.

Keep the deployment layer behind an adapter interface so Temps can be tested later without rewriting the customer-facing product.

Example abstraction:

```text
DeploymentProvider
  createProject()
  deploy()
  getDeploymentStatus()
  getLogs()
  createDomain()
  createDatabase()
  restart()
  rollback()
  deleteProject()
```

## 4. MVP Customer Flow

```text
Sign up
  -> Create Organization
  -> Create Project
  -> Connect GitHub
  -> Select Repository + Branch
  -> Configure build/runtime
  -> Deploy
  -> Assign generated domain
  -> Add custom domain
  -> SSL active
  -> View logs + status
```

## 5. MVP Features

### Customer

- Authentication
- Organization/workspace
- Project management
- GitHub connection
- Environment variables
- Deployment history
- Build/runtime logs
- Generated deployment URL
- Custom domain
- SSL status
- Basic usage dashboard

### Platform

- Tenant isolation
- Project quotas
- CPU/RAM/storage limits
- Deployment status synchronization
- Server/node registry
- Resource usage collection
- Basic health checks
- Admin dashboard
- Audit trail for critical actions

### Billing

- Free tier
- Paid plans
- IDR pricing
- Subscription state
- Usage limits
- Invoice/transaction records
- Payment-provider abstraction

## 6. Recommended Initial Stack

### Application

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

### SaaS backend/data

- PostgreSQL
- Drizzle ORM
- Redis when queue/caching is required

### Authentication

- Auth.js or Supabase Auth

### Infrastructure

- Coolify
- Docker
- Cloudflare DNS
- Let's Encrypt / platform-managed TLS

### Observability

- Sentry for application errors
- Uptime Kuma for basic uptime checks
- Prometheus/Grafana later when scale requires it

### Storage

- S3-compatible object storage

### Payments

- Payment provider abstraction; start with an Indonesia-capable provider such as Midtrans or Xendit.

## 7. Core Data Model

```text
User
Organization
OrganizationMember
Plan
Subscription
UsageRecord
Server
ServerAllocation
Project
Environment
Deployment
DeploymentLog
Domain
DatabaseResource
Secret
Invoice
Payment
AuditLog
```

Primary relationships:

```text
User -> Organization -> Project -> Environment -> Deployment
Organization -> Subscription -> Plan
Project -> Domain
Project -> DatabaseResource
Server -> ServerAllocation -> Project
Project -> UsageRecord
Organization -> Invoice -> Payment
```

## 8. Tenancy Rules

Every customer-owned record must be scoped to an organization/tenant.

Never use a global project identifier without tenant authorization checks.

The control plane must enforce:

```text
organization_id
project_id
environment_id
```

on every relevant API operation.

## 9. Resource and Pricing Model

Do not sell only “VPS size”. Sell platform plans with clear included resources.

Example placeholders:

```text
FREE
- 1 project
- limited resources
- shared node

STARTER
- several projects
- fixed CPU/RAM allowance
- custom domain
- basic backups

PRO
- higher CPU/RAM allowance
- staging/preview
- better backup retention
- team members
- monitoring

BUSINESS
- dedicated resources
- priority support
- advanced governance
- SLA options
```

Actual prices must be decided after infrastructure cost testing.

## 10. Differentiation

Do not compete as “cheap VPS”.

Target positioning:

> Indonesia-first Developer Cloud for indie developers, agencies, and startups.

Potential differentiators:

- IDR billing
- local payment methods
- very simple GitHub-to-deploy UX
- predictable resource pricing
- local support
- integrated backup
- integrated observability
- staging/preview environments
- optional AI developer services later

## 11. MVP Dashboard Information Architecture

```text
Dashboard
├── Overview
├── Projects
│   └── Project
│       ├── Overview
│       ├── Deployments
│       ├── Logs
│       ├── Environment Variables
│       ├── Domains
│       ├── Database
│       ├── Monitoring
│       └── Settings
├── Usage
├── Billing
├── Team
└── Account
```

Admin side:

```text
Admin
├── Organizations
├── Servers
├── Allocations
├── Deployments
├── Incidents
├── Billing
├── Plans
├── Usage
└── Audit Logs
```

## 12. Repository Strategy

This repository remains the product/control-plane repository.

Recommended future split:

```text
zen-patform/
├── apps/
│   ├── web/          # customer dashboard
│   └── admin/        # internal admin panel
├── packages/
│   ├── ui/
│   ├── db/
│   └── deployment-adapters/
├── docs/
│   ├── DEVELOPER-CLOUD-BLUEPRINT.md
│   ├── architecture/
│   ├── product/
│   └── runbooks/
└── infra/
    ├── docker/
    ├── coolify/
    └── monitoring/
```

The deployment engine itself should not be copied into this repository. It remains an external infrastructure dependency behind the adapter layer.

## 13. Delivery Phases

### Phase 0 - Architecture

- Lock product terminology
- Finalize tenant model
- Define deployment adapter contract
- Define quotas and usage model
- Define security boundaries

### Phase 1 - Working MVP

- Auth
- Organization
- Project
- GitHub connection
- Deploy through Coolify
- Deployment status
- Logs
- Domain/SSL

### Phase 2 - Business MVP

- Plans
- Quotas
- Usage metering
- Billing
- Payment integration
- Backups
- Admin operations

### Phase 3 - Developer Cloud

- Preview environments
- Team roles
- Monitoring
- Alerts
- Better rollback
- Managed databases
- Object storage

### Phase 4 - Differentiation

- AI gateway/services
- Cost optimization
- Autoscaling
- Advanced observability
- Multi-region/server pools
- Marketplace/templates

## 14. Immediate Next Implementation

The first implementation target is not a full cloud. It is a thin control plane over Coolify.

Build these first:

```text
1. Organization
2. Project
3. GitHub repository connection
4. Deployment Provider interface
5. Coolify adapter
6. Deploy action
7. Deployment status polling/webhook flow
8. Logs
9. Domain
10. Basic usage/quota
```

Success criterion:

> A new customer can sign up, connect GitHub, select a repository, click Deploy, receive a live URL, and inspect deployment status/logs from our dashboard.

## 15. Security Baseline

- Never expose deployment-engine credentials to the browser.
- Encrypt secrets at rest where supported.
- Use short-lived service credentials where possible.
- Enforce tenant authorization server-side.
- Audit deployment, domain, billing, and permission changes.
- Keep customer workloads isolated by server/resource policy.
- Separate control-plane and customer workload credentials.
- Back up control-plane database independently of workload backups.

## 16. Business Principle

The infrastructure engine is replaceable.

The customer-facing control plane, billing model, tenant/resource system, UX, support, automation, and operational data are the product IP.

Therefore:

```text
Coolify != the business
Temps != the business
VPS != the business

YOUR DEVELOPER CLOUD = the business
```
