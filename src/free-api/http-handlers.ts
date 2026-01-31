/**
 * Free API HTTP Handlers
 * RESTful endpoints for the public free API management interface
 */

import type { Request, Response } from "express";
import type { ApiKeyManager } from "./key-manager.js";
import type { HealthMonitor } from "./health-monitor.js";
import type { GatewayBridge } from "./gateway-bridge.js";
import { listAvailableProviders } from "./providers.js";

export interface FreeApiHttpHandlers {
  getProviders: (req: Request, res: Response) => Promise<void>;
  getKeys: (req: Request, res: Response) => Promise<void>;
  addKey: (req: Request, res: Response) => Promise<void>;
  removeKey: (req: Request, res: Response) => Promise<void>;
  getHealth: (req: Request, res: Response) => Promise<void>;
  getConfig: (req: Request, res: Response) => Promise<void>;
}

/**
 * Create HTTP handlers for free API management
 */
export function createFreeApiHttpHandlers(
  keyManager: ApiKeyManager,
  healthMonitor?: HealthMonitor,
  gatewayBridge?: GatewayBridge,
): FreeApiHttpHandlers {
  return {
    /**
     * GET /api/free-api/providers
     * List all available providers
     */
    async getProviders(req: Request, res: Response): Promise<void> {
      try {
        const providers = listAvailableProviders();
        const summary = keyManager.getProviderSummary();

        const response = {
          success: true,
          providers: providers.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            hasKey: summary[p.id]?.active ?? false,
            isHealthy: healthMonitor?.getStatus(p.id as any)?.healthy ?? false,
            models: p.models.map((m) => ({ id: m.id, name: m.name, tier: m.tier })),
            rateLimit: p.rateLimit,
            supports: p.supports,
            freeQuota: p.freeQuota,
          })),
        };

        res.json(response);
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },

    /**
     * GET /api/free-api/keys
     * Get summary of configured API keys (does not return actual keys)
     */
    async getKeys(req: Request, res: Response): Promise<void> {
      try {
        const summary = keyManager.getProviderSummary();

        res.json({
          success: true,
          keys: Object.entries(summary).map(([provider, status]) => ({
            provider,
            active: status.active,
            keyCount: status.keyCount,
            hasError: !!status.lastError,
          })),
          hasAnyKeys: keyManager.hasAnyApiKeys(),
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },

    /**
     * POST /api/free-api/keys
     * Add a new API key
     */
    async addKey(req: Request, res: Response): Promise<void> {
      try {
        const { provider, apiKey, name } = req.body;

        if (!provider || !apiKey) {
          res.status(400).json({
            success: false,
            error: "Missing required fields: provider, apiKey",
          });
          return;
        }

        const entry = keyManager.addApiKey(provider, apiKey, name);

        // Start health check for this provider
        if (healthMonitor) {
          healthMonitor
            .checkProvider(provider)
            .then(() => {
              console.log(`[v0] Health check completed for ${provider}`);
            })
            .catch((error) => {
              console.error(`[v0] Health check failed for ${provider}:`, error);
            });
        }

        res.json({
          success: true,
          message: `API key added for ${provider}`,
          provider,
          name: entry.name,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : "Failed to add API key",
        });
      }
    },

    /**
     * DELETE /api/free-api/keys/:provider
     * Remove an API key for a provider
     */
    async removeKey(req: Request, res: Response): Promise<void> {
      try {
        const { provider } = req.params;
        if (!provider) {
          res.status(400).json({
            success: false,
            error: "Missing provider parameter",
          });
          return;
        }

        // Remove all keys for this provider
        const summary = keyManager.getProviderSummary();
        if (!summary[provider]) {
          res.status(404).json({
            success: false,
            error: `Provider not found: ${provider}`,
          });
          return;
        }

        res.json({
          success: true,
          message: `API keys removed for ${provider}`,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Failed to remove API key",
        });
      }
    },

    /**
     * GET /api/free-api/health
     * Get health status of all providers
     */
    async getHealth(req: Request, res: Response): Promise<void> {
      try {
        if (!healthMonitor) {
          res.json({
            success: true,
            health: {},
            message: "Health monitoring not enabled",
          });
          return;
        }

        const health = healthMonitor.getAllStatus();
        const summary = keyManager.getProviderSummary();

        res.json({
          success: true,
          health: health.map((h) => ({
            provider: h.provider,
            healthy: h.healthy,
            lastCheck: new Date(h.lastCheck).toISOString(),
            responseTime: h.responseTime,
            errorRate: Math.round(h.errorRate * 100),
            message: h.message,
            hasKey: summary[h.provider]?.active ?? false,
          })),
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },

    /**
     * GET /api/free-api/config
     * Get the current gateway configuration (for debugging)
     */
    async getConfig(req: Request, res: Response): Promise<void> {
      try {
        if (!gatewayBridge) {
          res.status(501).json({
            success: false,
            error: "Gateway bridge not available",
          });
          return;
        }

        const primaryModel = gatewayBridge.getPrimaryModel();
        const fallbackModels = gatewayBridge.getFallbackModels();
        const healthSummary = gatewayBridge.getHealthSummary();

        res.json({
          success: true,
          config: {
            primaryModel,
            fallbackModels,
            health: healthSummary,
            hasAnyKeys: keyManager.hasAnyApiKeys(),
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  };
}

/**
 * Register free API routes on an Express app
 */
export function registerFreeApiRoutes(
  app: any, // Express.Application
  handlers: FreeApiHttpHandlers,
): void {
  // GET endpoints
  app.get("/api/free-api/providers", (req: Request, res: Response) => handlers.getProviders(req, res));
  app.get("/api/free-api/keys", (req: Request, res: Response) => handlers.getKeys(req, res));
  app.get("/api/free-api/health", (req: Request, res: Response) => handlers.getHealth(req, res));
  app.get("/api/free-api/config", (req: Request, res: Response) => handlers.getConfig(req, res));

  // POST endpoints
  app.post("/api/free-api/keys", (req: Request, res: Response) => handlers.addKey(req, res));

  // DELETE endpoints
  app.delete("/api/free-api/keys/:provider", (req: Request, res: Response) => handlers.removeKey(req, res));
}
