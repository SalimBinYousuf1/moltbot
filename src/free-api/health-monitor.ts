import type { ApiHealthStatus, FreeApiProviderType } from "./types.js";
import { getProviderConfig } from "./providers.js";
import type { ApiKeyManager } from "./key-manager.js";

/**
 * API Health Monitoring System
 * Tracks provider availability and performance metrics
 */

export class HealthMonitor {
  private health: Map<FreeApiProviderType, ApiHealthStatus> = new Map();
  private checkIntervals: Map<FreeApiProviderType, NodeJS.Timeout> = new Map();
  private readonly defaultCheckInterval = 300000; // 5 minutes

  constructor(private keyManager: ApiKeyManager) {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const providers = Object.keys(getProviderConfig("zai")!);
    for (const provider of ["zai", "groq", "gemini", "together", "claude-free"] as FreeApiProviderType[]) {
      this.health.set(provider, {
        provider,
        healthy: false,
        lastCheck: 0,
        errorRate: 0,
      });
    }
  }

  /**
   * Check if a provider is healthy by attempting a lightweight API call
   */
  async checkProvider(provider: FreeApiProviderType): Promise<boolean> {
    const config = getProviderConfig(provider);
    if (!config) return false;

    const startTime = Date.now();
    const activeKey = this.keyManager.getActiveKeyForProvider(provider);
    if (!activeKey) {
      this.updateHealth(provider, false, "No active API key", startTime);
      return false;
    }

    try {
      // Perform a minimal health check based on provider
      const healthy = await this.performHealthCheck(provider, activeKey.apiKey, config.baseUrl);

      this.updateHealth(provider, healthy, healthy ? "OK" : "Failed health check", startTime);
      return healthy;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.updateHealth(provider, false, message, startTime);
      return false;
    }
  }

  /**
   * Perform provider-specific health checks
   */
  private async performHealthCheck(
    provider: FreeApiProviderType,
    apiKey: string,
    baseUrl: string,
  ): Promise<boolean> {
    // Use AbortSignal with 10 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      let url = "";
      let options: RequestInit = {
        signal: controller.signal,
        headers: { "User-Agent": "Moltbot-HealthCheck/1.0" },
      };

      switch (provider) {
        case "zai":
        case "together":
          url = `${baseUrl}/models`;
          options.headers = { ...options.headers, Authorization: `Bearer ${apiKey}` };
          break;

        case "groq":
          url = `${baseUrl}/models`;
          options.headers = { ...options.headers, Authorization: `Bearer ${apiKey}` };
          break;

        case "gemini":
          url = `${baseUrl}models?key=${apiKey}`;
          break;

        case "claude-free":
          url = "https://api.anthropic.com/v1/models";
          options.headers = { ...options.headers, "x-api-key": apiKey };
          break;

        default:
          return false;
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      return response.status >= 200 && response.status < 300;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Health check timeout");
      }
      throw error;
    }
  }

  /**
   * Update health status for a provider
   */
  private updateHealth(provider: FreeApiProviderType, healthy: boolean, message: string, startTime: number): void {
    const responseTime = Date.now() - startTime;
    const current = this.health.get(provider);

    if (!current) return;

    current.healthy = healthy;
    current.lastCheck = Date.now();
    current.responseTime = responseTime;
    current.message = message;

    // Calculate error rate (simple exponential smoothing)
    const isError = !healthy ? 1 : 0;
    current.errorRate = current.errorRate * 0.7 + isError * 0.3;
  }

  /**
   * Get health status for a provider
   */
  getStatus(provider: FreeApiProviderType): ApiHealthStatus | null {
    return this.health.get(provider) ?? null;
  }

  /**
   * Get all provider health statuses
   */
  getAllStatus(): ApiHealthStatus[] {
    return Array.from(this.health.values());
  }

  /**
   * Start continuous health checks
   */
  startMonitoring(interval: number = this.defaultCheckInterval): void {
    for (const provider of this.health.keys()) {
      if (!this.checkIntervals.has(provider)) {
        // Start initial check immediately
        this.checkProvider(provider).catch((error) => {
          console.error(`[v0] Health check failed for ${provider}:`, error);
        });

        // Schedule periodic checks
        const intervalId = setInterval(() => {
          this.checkProvider(provider).catch((error) => {
            console.error(`[v0] Health check failed for ${provider}:`, error);
          });
        }, interval);

        this.checkIntervals.set(provider, intervalId);
      }
    }
  }

  /**
   * Stop continuous health checks
   */
  stopMonitoring(): void {
    for (const [provider, intervalId] of this.checkIntervals.entries()) {
      clearInterval(intervalId);
      this.checkIntervals.delete(provider);
    }
  }

  /**
   * Get the best available provider based on health
   */
  getBestProvider(preferredProviders: FreeApiProviderType[]): FreeApiProviderType | null {
    for (const provider of preferredProviders) {
      const status = this.getStatus(provider);
      if (status?.healthy) {
        return provider;
      }
    }

    // Fallback: any healthy provider
    for (const status of this.getAllStatus()) {
      if (status.healthy) {
        return status.provider;
      }
    }

    return null;
  }
}

export function createHealthMonitor(keyManager: ApiKeyManager): HealthMonitor {
  return new HealthMonitor(keyManager);
}
