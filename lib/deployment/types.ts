export type DeploymentProviderType = "coolify" | "temps";

export type DeploymentStatus =
  | "queued"
  | "building"
  | "deploying"
  | "running"
  | "failed"
  | "cancelled";

export interface DeploymentProjectInput {
  name: string;
  repositoryUrl: string;
  branch: string;
  buildCommand?: string;
  startCommand?: string;
  installCommand?: string;
  port?: number;
  environment?: Record<string, string>;
}

export interface DeploymentProject {
  providerProjectId: string;
  providerEnvironmentId?: string;
  url?: string;
}

export interface DeploymentResult {
  deploymentId: string;
  status: DeploymentStatus;
  url?: string;
}

export interface DeploymentProvider {
  readonly type: DeploymentProviderType;
  createProject(input: DeploymentProjectInput): Promise<DeploymentProject>;
  deploy(providerProjectId: string): Promise<DeploymentResult>;
  getDeploymentStatus(deploymentId: string): Promise<DeploymentResult>;
  getLogs(deploymentId: string): Promise<string>;
  createDomain(providerProjectId: string, domain: string): Promise<void>;
  restart(providerProjectId: string): Promise<void>;
  rollback(providerProjectId: string, deploymentId: string): Promise<void>;
  deleteProject(providerProjectId: string): Promise<void>;
}
