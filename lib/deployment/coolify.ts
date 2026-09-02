import type {
  DeploymentProvider,
  DeploymentProject,
  DeploymentProjectInput,
  DeploymentResult,
} from "./types";

interface CoolifyConfig {
  baseUrl: string;
  apiToken: string;
  destinationId?: string;
  serverUuid?: string;
}

interface CoolifyResponse {
  uuid?: string;
  id?: string;
  status?: string;
  deployment_url?: string;
  fqdn?: string;
  message?: string;
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
    if (!this.config.destinationId && !this.config.serverUuid) {
      throw new Error("Coolify requires DESTINATION_ID or SERVER_UUID");
    }

    const payload = {
      project_name: input.name,
      repository: input.repositoryUrl,
      git_branch: input.branch,
      build_pack: "nixpacks",
      build_command: input.buildCommand,
      start_command: input.startCommand,
      install_command: input.installCommand,
      ports_exposes: input.port ? String(input.port) : undefined,
      destination_uuid: this.config.destinationId,
      server_uuid: this.config.serverUuid,
      environment_variables: input.environment
        ? Object.entries(input.environment).map(([key, value]) => ({
            key,
            value,
            is_preview: false,
            is_build_time: false,
          }))
        : undefined,
    };

    const result = await this.request<CoolifyResponse>(
      "/api/v1/applications/public",
      { method: "POST", body: JSON.stringify(payload) },
    );

    const providerProjectId = result.uuid ?? result.id;
    if (!providerProjectId) throw new Error("Coolify did not return an application id");

    return {
      providerProjectId,
      url: result.fqdn ?? result.deployment_url,
    };
  }

  async deploy(providerProjectId: string): Promise<DeploymentResult> {
    const result = await this.request<CoolifyResponse>(
      `/api/v1/deploy?uuid=${encodeURIComponent(providerProjectId)}`,
      { method: "POST", body: JSON.stringify({ force_rebuild: false }) },
    );

    return {
      deploymentId: result.uuid ?? result.id ?? providerProjectId,
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
      raw.includes("running") || raw.includes("finished")
        ? "running"
        : raw.includes("fail") || raw.includes("error")
          ? "failed"
          : raw.includes("building")
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
    const result = await this.request<unknown>(
      `/api/v1/deployments/${encodeURIComponent(deploymentId)}/logs`,
    );
    return typeof result === "string" ? result : JSON.stringify(result, null, 2);
  }

  async createDomain(providerProjectId: string, domain: string): Promise<void> {
    await this.request(`/api/v1/applications/${encodeURIComponent(providerProjectId)}/domains`, {
      method: "POST",
      body: JSON.stringify({ domain }),
    });
  }

  async restart(providerProjectId: string): Promise<void> {
    await this.request(`/api/v1/applications/${encodeURIComponent(providerProjectId)}/restart`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async rollback(providerProjectId: string, deploymentId: string): Promise<void> {
    await this.request(`/api/v1/applications/${encodeURIComponent(providerProjectId)}/rollback`, {
      method: "POST",
      body: JSON.stringify({ deployment_uuid: deploymentId }),
    });
  }

  async deleteProject(providerProjectId: string): Promise<void> {
    await this.request(`/api/v1/applications/${encodeURIComponent(providerProjectId)}`, {
      method: "DELETE",
    });
  }
}
