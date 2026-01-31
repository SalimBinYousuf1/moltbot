import type { ApiKeyEntry, FreeApiProviderType, FreeApiRegistryState } from "./types.js";
import { getProviderConfig, listAvailableProviders } from "./providers.js";

/**
 * API Key Management Service
 * Handles secure storage, validation, and lifecycle of API keys
 */

export class ApiKeyManager {
  private state: FreeApiRegistryState;
  private lastStateWrite: number = 0;
  private readonly stateUpdateDelay = 500; // Debounce writes

  constructor(initialState?: Partial<FreeApiRegistryState>) {
    this.state = {
      apiKeys: {},
      primaryProvider: "zai",
      fallbackProviders: ["together", "groq", "gemini"],
      lastSync: Date.now(),
      version: 1,
      ...initialState,
    };
  }

  /**
   * Add a new API key for a provider
   */
  addApiKey(provider: FreeApiProviderType, apiKey: string, name?: string): ApiKeyEntry {
    if (!apiKey?.trim()) {
      throw new Error("API key cannot be empty");
    }

    const providerConfig = getProviderConfig(provider);
    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    // Validate API key format (basic check)
    if (apiKey.length < 10) {
      throw new Error("API key appears too short. Please verify.");
    }

    const id = `${provider}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const entry: ApiKeyEntry = {
      provider,
      apiKey: apiKey.trim(),
      name: name || `${providerConfig.name} Key`,
      isActive: true,
      addedAt: Date.now(),
      failureCount: 0,
    };

    this.state.apiKeys[id] = entry;
    this.markStateChanged();
    return entry;
  }

  /**
   * Get all API keys for a provider
   */
  getKeysForProvider(provider: FreeApiProviderType): ApiKeyEntry[] {
    return Object.values(this.state.apiKeys).filter((k) => k.provider === provider && k.isActive);
  }

  /**
   * Get the primary active API key for a provider
   */
  getActiveKeyForProvider(provider: FreeApiProviderType): ApiKeyEntry | null {
    const keys = this.getKeysForProvider(provider);
    if (keys.length === 0) return null;

    // Prefer key with lowest failure count and most recent usage
    return keys.sort((a, b) => {
      if (a.failureCount !== b.failureCount) {
        return a.failureCount - b.failureCount;
      }
      const aLastUsed = a.lastUsed ?? 0;
      const bLastUsed = b.lastUsed ?? 0;
      return bLastUsed - aLastUsed;
    })[0];
  }

  /**
   * Mark an API key as used
   */
  recordKeyUsage(providerId: string): void {
    const entry = Object.values(this.state.apiKeys).find((k) => k.provider === (providerId as FreeApiProviderType));
    if (entry) {
      entry.lastUsed = Date.now();
      entry.failureCount = Math.max(0, entry.failureCount - 1); // Decrease on successful use
    }
  }

  /**
   * Record a failure for an API key
   */
  recordKeyFailure(providerId: string, error: string): void {
    const entries = Object.values(this.state.apiKeys).filter((k) => k.provider === (providerId as FreeApiProviderType));
    for (const entry of entries) {
      entry.failureCount++;
      entry.lastError = error;

      // Deactivate if too many failures
      if (entry.failureCount > 5) {
        entry.isActive = false;
      }
    }
  }

  /**
   * Remove an API key
   */
  removeApiKey(id: string): boolean {
    if (id in this.state.apiKeys) {
      delete this.state.apiKeys[id];
      this.markStateChanged();
      return true;
    }
    return false;
  }

  /**
   * Get the current state
   */
  getState(): FreeApiRegistryState {
    return { ...this.state };
  }

  /**
   * Update the primary provider
   */
  setPrimaryProvider(provider: FreeApiProviderType): void {
    const config = getProviderConfig(provider);
    if (!config) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    const activeKey = this.getActiveKeyForProvider(provider);
    if (!activeKey) {
      throw new Error(`No active API key for provider: ${provider}`);
    }
    this.state.primaryProvider = provider;
    this.markStateChanged();
  }

  /**
   * Set fallback providers
   */
  setFallbackProviders(providers: FreeApiProviderType[]): void {
    // Validate all providers
    for (const p of providers) {
      if (!getProviderConfig(p)) {
        throw new Error(`Unknown provider: ${p}`);
      }
    }
    this.state.fallbackProviders = providers;
    this.markStateChanged();
  }

  /**
   * Get providers in priority order (primary + fallbacks)
   */
  getProvidersInPriority(): FreeApiProviderType[] {
    const hasActiveKey = (p: FreeApiProviderType) => this.getActiveKeyForProvider(p) !== null;

    if (!hasActiveKey(this.state.primaryProvider)) {
      // If primary has no key, use first available fallback
      const availableFallbacks = this.state.fallbackProviders.filter(hasActiveKey);
      if (availableFallbacks.length === 0) {
        throw new Error("No active API keys configured for any provider");
      }
      return availableFallbacks;
    }

    return [this.state.primaryProvider, ...this.state.fallbackProviders.filter(hasActiveKey)];
  }

  /**
   * Get provider availability summary
   */
  getProviderSummary(): Record<string, { active: boolean; keyCount: number; lastError?: string }> {
    const summary: Record<string, { active: boolean; keyCount: number; lastError?: string }> = {};

    for (const provider of listAvailableProviders()) {
      const keys = this.getKeysForProvider(provider.id);
      const activeKey = this.getActiveKeyForProvider(provider.id);
      summary[provider.id] = {
        active: activeKey !== null,
        keyCount: keys.length,
        lastError: activeKey?.lastError,
      };
    }

    return summary;
  }

  /**
   * Check if any API keys are configured
   */
  hasAnyApiKeys(): boolean {
    return Object.values(this.state.apiKeys).some((k) => k.isActive);
  }

  /**
   * Mark state as changed (for persistence)
   */
  private markStateChanged(): void {
    this.state.lastSync = Date.now();
    this.state.version++;
    this.lastStateWrite = Date.now();
  }
}

export function createApiKeyManager(initialState?: Partial<FreeApiRegistryState>): ApiKeyManager {
  return new ApiKeyManager(initialState);
}
