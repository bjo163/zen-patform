import { CoolifyProvider } from "./coolify";
import type { DeploymentProvider } from "./types";

export function getDeploymentProvider(): DeploymentProvider {
  const provider = (process.env.DEPLOYMENT_PROVIDER ?? "coolify").toLowerCase();

  switch (provider) {
    case "coolify": {
      const baseUrl = process.env.COOLIFY_BASE_URL;
      const apiToken = process.env.COOLIFY_API_TOKEN;
      const projectUuid = process.env.COOLIFY_PROJECT_UUID;
      const environmentUuid = process.env.COOLIFY_ENVIRONMENT_UUID;
      const serverUuid = process.env.COOLIFY_SERVER_UUID;

      if (!baseUrl || !apiToken || !projectUuid || !environmentUuid || !serverUuid) {
        throw new Error(
          "COOLIFY_BASE_URL, COOLIFY_API_TOKEN, COOLIFY_PROJECT_UUID, COOLIFY_ENVIRONMENT_UUID and COOLIFY_SERVER_UUID are required",
        );
      }

      return new CoolifyProvider({
        baseUrl,
        apiToken,
        projectUuid,
        environmentUuid,
        serverUuid,
        destinationUuid: process.env.COOLIFY_DESTINATION_UUID,
      });
    }
    case "temps":
      throw new Error("Temps provider is reserved for Phase 2");
    default:
      throw new Error(`Unsupported deployment provider: ${provider}`);
  }
}

export * from "./types";
export * from "./coolify";
