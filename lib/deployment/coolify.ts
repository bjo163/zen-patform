import type {
  DeploymentProvider,
  DeploymentProject,
  DeploymentProjectInput,
  DeploymentResult,
} from "./types";

interface CoolifyConfig {
  baseUrl: string;
  apiToken: string;
  projectUuid: string;
  environmentUuid: string;
  serverUuid: string;
  destinationUuid?: string;
}

interface CoolifyResponse {
  uuid?: string;
  deployment_uuid?: string;
  status?: string;
  deployment_url?: string;
  fqdn?: string;
  message?: string;
  logs?: string;
}

export class CoolifyProvider implements DeploymentProvider {
  readonly type = "coolify" as const;

  constructor(private readonly config: CoolifyConfig) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });

    const text = await response.text();
    let body: unknown = undefined;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!response.ok) {
      const detail =
        typeof body === "object" && body && "message" in body
          ? String((body as { message?: unknown }).message)
          : `HTTP ${response.status}`;
      throw new Error(`Coolify API error: ${detail}`);
    }

    return body as T;
  }

  async createProject(input: DeploymentProjectInput): Promise<DeploymentProject> {
    const payload = {
      project_uuid: this.config.projectUuid,
      server_uuid: this.config.serverUuid,
      environment_uuid: this.config.environmentUuid,
      git_repository: input.repositoryUrl,
      git_branch: input.branch,
      build_pack: "nixpacks",
      ports_exposes: input.port ? String(input.port) : "3000",
      destination_uuid: this.config.destinationUuid,
      name: input.name,
      install_command: input.installCommand,
      build_command: input.buildCommand,
      start_command: input.startCommand,
      is_auto_deploy_enabled: false,
      autogenerate_domain: true,
      instant_deploy: false,
    };

    const result = await this.request<CoolifyResponse>(
      "/api/v1/applications/public",
      { method: "POST", body: JSON.stringify(payload) },
    );

    const providerProjectId = result.uuid;
    if (!providerProjectId) {
      throw new Error("Coolify did not return an application UUID");
    }

    return {
      providerProjectId,
      url: result.fqdn ?? result.deployment_url,
    };
  }

  async deploy(providerProjectId: string): Promise<DeploymentResult> {
    const result = await this.request<CoolifyResponse>(
      `/api/v1/applications/${encodeURIComponent(providerProjectId)}/start`,
      { method: "GET" },
    );

    const deploymentId = result.deployment_uuid ?? providerProjectId;
    return {
      deploymentId,
      status: "queued",
      url: result.fqdn ?? result.deployment_url,
    };
  }

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentResult> {
    const result = await this.request<CoolifyResponse>(
      `/api/v1/deployments/${encodeURIComponent(deploymentId)}`,
    );

    const raw = String(result.status ?? "queued").toLowerCase();
    const status =
      raw.includes("finish") || raw.includes("success") || raw === "running"
        ? "running"
        : raw.includes("fail") || raw.includes("error")
          ? "failed"
          : raw.includes("build")
            ? "building"
            : raw.includes("deploy")
              ? "deploying"
              : "queued";

    return {
      deploymentId,
      status,
      url: result.fqdn ?? result.deployment_url,
    };
  }

  async getLogs(deploymentId: string): Promise<string> {
    const result = await this.request<CoolifyResponse>(
      `/api/v1/deployments/${encodeURIComponent(deploymentId)}`,
    );
    return result.logs ?? "";
  }

  async createDomain(providerProjectId: string, domain: string): Promise<void> {
    await this.request(
      `/api/v1/applications/${encodeURIComponent(providerProjectId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ domains: domain }),
      },
    );
  }

  async restart(providerProjectId: string): Promise<void> {
    await this.request(`/api/v1/applications/${encodeURIComponent(providerProjectId)}/restart`, {
      method: "GET",
    });
  }

  async rollback(_providerProjectId: string, _deploymentId: string): Promise<void> {
    throw new Error("Coolify rollback contract requires selecting a deployment through the deployments API; not wired in MVP");
  }

  async deleteProject(providerProjectId: string): Promise<void> {
    await this.request(`/api/v1/applications/${encodeURIComponent(providerProjectId)}`, {
      method: "DELETE",
    });
  }
}
