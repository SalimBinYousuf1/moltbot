/**
 * Free API System - Public Export
 * Main initialization and coordination for free LLM API management
 */

export { createApiKeyManager, ApiKeyManager } from "./key-manager.js";
export { createHealthMonitor, HealthMonitor } from "./health-monitor.js";
export { createGatewayBridge, GatewayBridge } from "./gateway-bridge.js";
export { createFreeApiHttpHandlers, registerFreeApiRoutes } from "./http-handlers.js";
export { FREE_API_PROVIDERS, getProviderConfig, listAvailableProviders, getProvidersByCapability } from "./providers.js";

export type {
  FreeApiProviderType,
  FreeApiModel,
  FreeApiProviderConfig,
  ApiKeyEntry,
  FreeApiRegistryState,
  ApiHealthStatus,
} from "./types.js";

import type { ApiKeyManager } from "./key-manager.js";
import type { HealthMonitor } from "./health-monitor.js";
import type { GatewayBridge } from "./gateway-bridge.js";
import { createApiKeyManager } from "./key-manager.js";
import { createHealthMonitor } from "./health-monitor.js";
import { createGatewayBridge } from "./gateway-bridge.js";
import { createFreeApiHttpHandlers } from "./http-handlers.js";

/**
 * Unified system for managing free APIs in Moltbot
 */
export interface FreeApiSystem {
  keyManager: ApiKeyManager;
  healthMonitor: HealthMonitor;
  gatewayBridge: GatewayBridge;
  close(): Promise<void>;
}

/**
 * Initialize the free API system
 */
export function createFreeApiSystem(): FreeApiSystem {
  const keyManager = createApiKeyManager();
  const healthMonitor = createHealthMonitor(keyManager);
  const gatewayBridge = createGatewayBridge(keyManager, healthMonitor);

  // Start health monitoring
  healthMonitor.startMonitoring();

  return {
    keyManager,
    healthMonitor,
    gatewayBridge,
    async close() {
      healthMonitor.stopMonitoring();
    },
  };
}

/**
 * Initialize from persisted state
 */
export function restoreFreeApiSystem(persistedState: any): FreeApiSystem {
  const keyManager = createApiKeyManager(persistedState?.registry);
  const healthMonitor = createHealthMonitor(keyManager);
  const gatewayBridge = createGatewayBridge(keyManager, healthMonitor);

  healthMonitor.startMonitoring();

  return {
    keyManager,
    healthMonitor,
    gatewayBridge,
    async close() {
      healthMonitor.stopMonitoring();
    },
  };
}

/**
 * Export the HTTP handlers factory
 */
export const httpHandlers = createFreeApiHttpHandlers;
