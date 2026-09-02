import { CoolifyProvider } from "./coolify";
import type { DeploymentProvider } from "./types";

export function getDeploymentProvider(): DeploymentProvider {
  const provider = (process.env.DEPLOYMENT_PROVIDER ?? "coolify").toLowerCase();

  switch (provider) {
    case "coolify": {
      const baseUrl = process.env.COOLIFY_BASE_URL;
      const apiToken = process.env.COOLIFY_API_TOKEN;
      if (!baseUrl || !apiToken) {
        throw new Error("COOLIFY_BASE_URL and COOLIFY_API_TOKEN are required");
      }

      return new CoolifyProvider({
        baseUrl,
        apiToken,
        destinationId: process.env.COOLIFY_DESTINATION_ID,
        serverUuid: process.env.COOLIFY_SERVER_UUID,
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
