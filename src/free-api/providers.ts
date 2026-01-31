import type { FreeApiProviderConfig } from "./types.js";

/**
 * Free AI API Providers Registry
 * Production-ready configurations for free-tier LLM APIs
 */

export const FREE_API_PROVIDERS: Record<string, FreeApiProviderConfig> = {
  zai: {
    id: "zai",
    name: "Z.AI (Together AI)",
    description: "Free tier for GLM 4.5 Flash and other open models via Together AI",
    baseUrl: "https://api.together.xyz/v1",
    apiKeyFormat: "together_ai_*",
    apiKeyEnvVar: "ZAI_API_KEY",
    models: [
      {
        id: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        name: "Llama 3.3 70B (Fast)",
        contextWindow: 8192,
        maxTokens: 4096,
        tier: "fast",
        costUsd: { input: 0.0009, output: 0.0009 },
      },
      {
        id: "mistralai/Mistral-7B-Instruct-v0.3",
        name: "Mistral 7B",
        contextWindow: 32000,
        maxTokens: 8192,
        tier: "standard",
        costUsd: { input: 0.0001, output: 0.0001 },
      },
      {
        id: "meta-llama/Meta-Llama-3-70B-Instruct",
        name: "Llama 3 70B",
        contextWindow: 8192,
        maxTokens: 4096,
        tier: "standard",
        costUsd: { input: 0.0009, output: 0.0009 },
      },
      {
        id: "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO",
        name: "Nous Hermes 2 Mixtral",
        contextWindow: 32000,
        maxTokens: 8192,
        tier: "standard",
        costUsd: { input: 0.0006, output: 0.0006 },
      },
    ],
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerDay: 10000,
      tokensPerMinute: 200000,
    },
    supports: {
      vision: true,
      streaming: true,
      functionCalling: true,
    },
    authRequired: true,
    freeQuota: {
      tokensPerMonth: 1000000,
    },
  },

  groq: {
    id: "groq",
    name: "Groq",
    description: "Ultra-fast LLM inference with free tier",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKeyFormat: "gsk_*",
    apiKeyEnvVar: "GROQ_API_KEY",
    models: [
      {
        id: "mixtral-8x7b-32768",
        name: "Mixtral 8x7B",
        contextWindow: 32768,
        maxTokens: 8192,
        tier: "fast",
      },
      {
        id: "llama-3-70b-8192",
        name: "Llama 3 70B",
        contextWindow: 8192,
        maxTokens: 4096,
        tier: "standard",
      },
      {
        id: "llama-3-8b-8192",
        name: "Llama 3 8B",
        contextWindow: 8192,
        maxTokens: 4096,
        tier: "fast",
      },
    ],
    rateLimit: {
      requestsPerMinute: 30,
      tokensPerMinute: 6000,
    },
    supports: {
      vision: false,
      streaming: true,
      functionCalling: true,
    },
    authRequired: true,
  },

  gemini: {
    id: "gemini",
    name: "Google Gemini",
    description: "Google's free-tier Gemini models with generous limits",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKeyFormat: "*",
    apiKeyEnvVar: "GOOGLE_API_KEY",
    models: [
      {
        id: "gemini-2.0-flash-exp",
        name: "Gemini 2.0 Flash",
        contextWindow: 1000000,
        maxTokens: 8192,
        tier: "fast",
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        contextWindow: 1000000,
        maxTokens: 8192,
        tier: "standard",
      },
      {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        contextWindow: 1000000,
        maxTokens: 8192,
        tier: "fast",
      },
    ],
    rateLimit: {
      requestsPerMinute: 15,
      requestsPerDay: 1500,
    },
    supports: {
      vision: true,
      streaming: true,
      functionCalling: true,
    },
    authRequired: true,
    freeQuota: {
      requestsPerMonth: 1500,
    },
  },

  together: {
    id: "together",
    name: "Together AI API",
    description: "Open source models and fine-tuned variants",
    baseUrl: "https://api.together.xyz/v1",
    apiKeyFormat: "together_ai_*",
    apiKeyEnvVar: "TOGETHER_API_KEY",
    models: [
      {
        id: "meta-llama/Llama-Vision-Free",
        name: "Llama Vision",
        contextWindow: 128000,
        maxTokens: 8192,
        tier: "standard",
      },
      {
        id: "mistralai/Mistral-Large",
        name: "Mistral Large",
        contextWindow: 32000,
        maxTokens: 8192,
        tier: "standard",
      },
    ],
    rateLimit: {
      requestsPerMinute: 60,
    },
    supports: {
      vision: true,
      streaming: true,
      functionCalling: false,
    },
    authRequired: true,
  },

  "claude-free": {
    id: "claude-free",
    name: "Anthropic Claude (Free Tier)",
    description: "Limited free tier for Anthropic Claude",
    baseUrl: "https://api.anthropic.com/v1",
    apiKeyFormat: "sk-ant-*",
    apiKeyEnvVar: "ANTHROPIC_API_KEY",
    models: [
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        contextWindow: 200000,
        maxTokens: 4096,
        tier: "standard",
      },
    ],
    rateLimit: {
      requestsPerMinute: 5,
      requestsPerDay: 100,
    },
    supports: {
      vision: true,
      streaming: true,
      functionCalling: true,
    },
    authRequired: true,
    freeQuota: {
      requestsPerDay: 100,
    },
  },
};

export function getProviderConfig(providerId: string): FreeApiProviderConfig | null {
  return FREE_API_PROVIDERS[providerId] ?? null;
}

export function listAvailableProviders(): FreeApiProviderConfig[] {
  return Object.values(FREE_API_PROVIDERS);
}

export function getProvidersByCapability(capability: keyof typeof FREE_API_PROVIDERS[string]["supports"]): FreeApiProviderConfig[] {
  return Object.values(FREE_API_PROVIDERS).filter((p) => p.supports[capability]);
}
