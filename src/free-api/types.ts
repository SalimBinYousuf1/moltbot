/**
 * Free API Provider Registry System
 * Supports multiple free LLM APIs with flexible configuration
 */

export type FreeApiProviderType = "zai" | "together" | "groq" | "gemini" | "claude-free";

export interface FreeApiModel {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  tier: "fast" | "standard" | "reasoning";
  costUsd?: {
    input: number;
    output: number;
  };
}

export interface FreeApiProviderConfig {
  id: FreeApiProviderType;
  name: string;
  description: string;
  baseUrl: string;
  apiKeyFormat: string; // e.g., "sk-..." or "gr-..."
  apiKeyEnvVar: string;
  models: FreeApiModel[];
  rateLimit?: {
    requestsPerMinute?: number;
    requestsPerDay?: number;
    tokensPerMinute?: number;
  };
  supports: {
    vision: boolean;
    streaming: boolean;
    functionCalling: boolean;
  };
  authRequired: boolean;
  freeQuota?: {
    tokensPerMonth?: number;
    requestsPerMonth?: number;
  };
}

export interface ApiKeyEntry {
  provider: FreeApiProviderType;
  apiKey: string;
  name?: string;
  isActive: boolean;
  addedAt: number;
  lastUsed?: number;
  failureCount: number;
  lastError?: string;
}

export interface FreeApiRegistryState {
  apiKeys: Record<string, ApiKeyEntry>;
  primaryProvider: FreeApiProviderType;
  fallbackProviders: FreeApiProviderType[];
  lastSync: number;
  version: number;
}

export interface ApiHealthStatus {
  provider: FreeApiProviderType;
  healthy: boolean;
  lastCheck: number;
  responseTime?: number;
  errorRate: number;
  message?: string;
}
