/**
 * Gateway Integration Module
 * Wires the Free API System into Moltbot Gateway
 */

import type { Express } from "express";
import type { MoltbotConfig } from "../config/config.js";
import type { FreeApiSystem } from "./index.js";
import { createFreeApiSystem, restoreFreeApiSystem, httpHandlers, registerFreeApiRoutes } from "./index.js";
import type { ModelsConfig } from "../config/types.models.js";

/**
 * Initialize Free API System for Gateway
 */
export async function initFreeApiSystem(persistedState?: any): Promise<FreeApiSystem> {
  let system: FreeApiSystem;

  if (persistedState?.registry) {
    system = restoreFreeApiSystem(persistedState);
    console.log("[v0] Free API system restored from persisted state");
  } else {
    system = createFreeApiSystem();
    console.log("[v0] Free API system initialized");
  }

  return system;
}

/**
 * Register Free API HTTP routes on Express
 */
export function registerFreeApiRoutesOnGateway(app: Express, system: FreeApiSystem): void {
  const handlers = httpHandlers(system.keyManager, system.healthMonitor, system.gatewayBridge);

  registerFreeApiRoutes(app, handlers);

  console.log("[v0] Free API HTTP routes registered");
  console.log("[v0]   GET  /api/free-api/providers");
  console.log("[v0]   GET  /api/free-api/keys");
  console.log("[v0]   POST /api/free-api/keys");
  console.log("[v0]   DELETE /api/free-api/keys/:provider");
  console.log("[v0]   GET  /api/free-api/health");
  console.log("[v0]   GET  /api/free-api/config");

  // Serve the public dashboard
  app.get("/free-api-manager.html", (req, res) => {
    res.sendFile(new URL("../../public/free-api-manager.html", import.meta.url).pathname);
  });

  console.log("[v0] Free API Manager dashboard available at /free-api-manager.html");
}

/**
 * Merge Free API provider configs into main agent config
 * This makes free API keys available to agents
 */
export function mergeFreeApiProvidersIntoConfig(
  mainConfig: MoltbotConfig,
  system: FreeApiSystem,
): MoltbotConfig {
  const freeApiConfigs = system.gatewayBridge.generateProviderConfigs();

  if (Object.keys(freeApiConfigs).length === 0) {
    console.log("[v0] No free API keys configured, skipping provider merge");
    return mainConfig;
  }

  // Merge into existing models config
  const modelsConfig: ModelsConfig = mainConfig.models || {};

  modelsConfig.providers = {
    ...modelsConfig.providers,
    ...freeApiConfigs,
  };

  // Set primary model if available
  const primaryModel = system.gatewayBridge.getPrimaryModel();
  if (primaryModel) {
    if (!modelsConfig.defaults) {
      modelsConfig.defaults = {};
    }
    modelsConfig.defaults.primary = `${primaryModel.provider}/${primaryModel.modelId}`;

    // Set up fallback models
    const fallbacks = system.gatewayBridge.getFallbackModels();
    if (fallbacks.length > 0) {
      modelsConfig.defaults.fallbacks = fallbacks.map((f) => `${f.provider}/${f.modelId}`);
    }

    console.log("[v0] Free API models configured");
    console.log(`[v0]   Primary: ${primaryModel.provider}/${primaryModel.modelId}`);
    console.log(
      `[v0]   Fallbacks: ${fallbacks.map((f) => `${f.provider}/${f.modelId}`).join(", ") || "None"}`,
    );
  }

  return {
    ...mainConfig,
    models: modelsConfig,
  };
}

/**
 * Setup health check endpoints for monitoring
 */
export function setupHealthCheckMonitoring(app: Express, system: FreeApiSystem): void {
  // Health check for the free API system
  app.get("/health/free-api", async (req, res) => {
    try {
      const statuses = system.healthMonitor.getAllStatus();
      const healthy = statuses.some((s) => s.healthy);

      res.json({
        healthy,
        providers: statuses.map((s) => ({
          provider: s.provider,
          healthy: s.healthy,
          errorRate: Math.round(s.errorRate * 100),
        })),
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  console.log("[v0] Free API health check endpoint registered at /health/free-api");
}

/**
 * Persist Free API system state for recovery
 */
export function persistFreeApiState(system: FreeApiSystem): Record<string, any> {
  const state = system.keyManager.getState();
  const health = system.healthMonitor.getAllStatus();

  return {
    registry: state,
    health: health.map((h) => ({
      provider: h.provider,
      lastCheck: h.lastCheck,
      errorRate: h.errorRate,
    })),
    timestamp: Date.now(),
  };
}

/**
 * Cleanup on shutdown
 */
export async function shutdownFreeApiSystem(system: FreeApiSystem): Promise<void> {
  console.log("[v0] Shutting down Free API system");
  await system.close();
  console.log("[v0] Free API system shut down");
}

/**
 * Full integration helper
 * Use this in gateway startup
 */
export async function setupFreeApiSystemInGateway(
  app: Express,
  mainConfig: MoltbotConfig,
  persistedState?: any,
): Promise<FreeApiSystem> {
  // Initialize
  const system = await initFreeApiSystem(persistedState);

  // Register routes
  registerFreeApiRoutesOnGateway(app, system);

  // Setup health monitoring
  setupHealthCheckMonitoring(app, system);

  // Merge provider configs
  const updatedConfig = mergeFreeApiProvidersIntoConfig(mainConfig, system);

  // Store updated config (in real implementation, persist to disk)
  Object.assign(mainConfig, updatedConfig);

  console.log("[v0] Free API system fully integrated with gateway");

  return system;
}
