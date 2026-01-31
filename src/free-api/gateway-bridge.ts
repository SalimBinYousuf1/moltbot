import type { ModelProviderConfig, ModelDefinitionConfig } from "../config/types.models.js";
import type { ApiKeyManager } from "./key-manager.js";
import type { HealthMonitor } from "./health-monitor.js";
import { getProviderConfig } from "./providers.js";

/**
 * Gateway Bridge
 * Converts free API manager state into Moltbot-compatible model provider configurations
 */

export class GatewayBridge {
  constructor(private keyManager: ApiKeyManager, private healthMonitor?: HealthMonitor) {}

  /**
   * Generate model provider configs from active API keys
   */
  generateProviderConfigs(): Record<string, ModelProviderConfig> {
    const configs: Record<string, ModelProviderConfig> = {};
    const summary = this.keyManager.getProviderSummary();

    for (const [providerId, status] of Object.entries(summary)) {
      if (!status.active) continue;

      const activeKey = this.keyManager.getActiveKeyForProvider(providerId as any);
      if (!activeKey) continue;

      const providerConfig = getProviderConfig(providerId);
      if (!providerConfig) continue;

      const models: ModelDefinitionConfig[] = providerConfig.models.map((m) => ({
        id: m.id,
        name: m.name,
        api: this.getApiType(providerId),
        reasoning: m.tier === "reasoning",
        input: providerConfig.supports.vision ? ["text", "image"] : ["text"],
        cost: {
          input: m.costUsd?.input ?? 0,
          output: m.costUsd?.output ?? 0,
          cacheRead: 0,
          cacheWrite: 0,
        },
        contextWindow: m.contextWindow,
        maxTokens: m.maxTokens,
        headers: this.getHeaders(providerId),
      }));

      configs[providerId] = {
        baseUrl: providerConfig.baseUrl,
        apiKey: activeKey.apiKey,
        auth: "api-key",
        api: this.getApiType(providerId),
        models,
      };
    }

    return configs;
  }

  /**
   * Get OpenAI-compatible API type for a provider
   */
  private getApiType(providerId: string): "openai-completions" | "openai-responses" | undefined {
    // Most free APIs support OpenAI-compatible API
    const openaiCompatible = ["zai", "together", "groq"];
    return openaiCompatible.includes(providerId) ? "openai-completions" : undefined;
  }

  /**
   * Get required headers for a provider
   */
  private getHeaders(providerId: string): Record<string, string> | undefined {
    const headers: Record<string, string> = {};

    switch (providerId) {
      case "together":
      case "zai":
        headers["User-Agent"] = "Moltbot/1.0";
        break;
      case "groq":
        headers["User-Agent"] = "Moltbot/1.0";
        break;
    }

    return Object.keys(headers).length > 0 ? headers : undefined;
  }

  /**
   * Get the recommended primary model to use
   */
  getPrimaryModel(): { provider: string; modelId: string } | null {
    try {
      const providers = this.keyManager.getProvidersInPriority();
      if (providers.length === 0) return null;

      const primaryProvider = providers[0];
      const config = getProviderConfig(primaryProvider);
      if (!config || config.models.length === 0) return null;

      // Prefer fast models, then standard
      let bestModel = config.models.find((m) => m.tier === "fast") || config.models[0];

      return {
        provider: primaryProvider,
        modelId: bestModel.id,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get fallback models in priority order
   */
  getFallbackModels(): Array<{ provider: string; modelId: string }> {
    const fallbacks: Array<{ provider: string; modelId: string }> = [];

    try {
      const providers = this.keyManager.getProvidersInPriority();

      for (const provider of providers.slice(1)) {
        const config = getProviderConfig(provider);
        if (!config || config.models.length === 0) continue;

        const model = config.models.find((m) => m.tier === "fast") || config.models[0];
        fallbacks.push({
          provider,
          modelId: model.id,
        });
      }
    } catch {
      // Silently fail - fallbacks not critical
    }

    return fallbacks;
  }

  /**
   * Get provider health summary for dashboard
   */
  getHealthSummary(): Record<
    string,
    { provider: string; healthy: boolean; responseTime?: number; errorRate: number; message?: string }
  > {
    const summary: Record<
      string,
      { provider: string; healthy: boolean; responseTime?: number; errorRate: number; message?: string }
    > = {};

    if (!this.healthMonitor) return summary;

    for (const status of this.healthMonitor.getAllStatus()) {
      const activeKey = this.keyManager.getActiveKeyForProvider(status.provider);
      if (!activeKey) continue;

      summary[status.provider] = {
        provider: status.provider,
        healthy: status.healthy,
        responseTime: status.responseTime,
        errorRate: Math.round(status.errorRate * 100),
        message: status.message,
      };
    }

    return summary;
  }
}

export function createGatewayBridge(keyManager: ApiKeyManager, healthMonitor?: HealthMonitor): GatewayBridge {
  return new GatewayBridge(keyManager, healthMonitor);
}
