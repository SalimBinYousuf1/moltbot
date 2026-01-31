# Free API Manager - Public Documentation

## Overview

The **Free API Manager** is a professional, production-ready system for managing free-tier LLM API keys in Moltbot. It allows anyone to add API keys from multiple free providers and automatically manages model selection, failover, and health monitoring.

## Features

- **Multi-Provider Support**: GLM 4.5 Flash (via ZAI), Groq, Google Gemini, Together AI, Anthropic Claude
- **Smart Failover**: Automatically switches to backup providers if the primary fails
- **Health Monitoring**: Real-time health checks with response time tracking
- **Public API**: Simple REST API for key management and monitoring
- **Web Dashboard**: Beautiful, responsive HTML interface for configuration
- **Secure**: API keys are stored locally, never transmitted externally
- **Production Ready**: Proper error handling, rate limiting awareness, and logging

## Getting Started

### 1. Access the Dashboard

Navigate to: `http://localhost:18789/free-api-manager.html`

### 2. Add API Keys

- Select a provider from the dropdown
- Paste your API key
- Click "Add API Key"

That's it! Moltbot will automatically use these keys.

## Supported Providers

### Z.AI (Together AI) - GLM 4.5 Flash
- **URL**: https://together.ai
- **Free Quota**: 1,000,000 tokens/month
- **Models**: GLM, Llama, Mistral, and more
- **Setup**: Create account → Get API key
- **Key Format**: `together_ai_*`

### Groq
- **URL**: https://console.groq.com
- **Free Quota**: High limits on inference
- **Models**: Mixtral, Llama 3, Gemma
- **Setup**: Create account → Get API key
- **Key Format**: `gsk_*`
- **Note**: Ultra-fast inference times

### Google Gemini
- **URL**: https://aistudio.google.com
- **Free Quota**: 1,500 requests/month (with generous tokens)
- **Models**: Gemini 2.0 Flash, Gemini 1.5 Pro/Flash
- **Setup**: Sign in with Google → Get API key
- **Key Format**: Any format
- **Note**: 1M token context window

### Together AI
- **URL**: https://together.ai
- **Free Quota**: 1,000,000 tokens/month
- **Models**: Open source collection
- **Setup**: Create account → Get API key
- **Key Format**: `together_ai_*`

### Anthropic Claude (Free Tier)
- **URL**: https://console.anthropic.com
- **Free Quota**: 100 requests/day, $5/month credit
- **Models**: Claude 3.5 Sonnet
- **Setup**: Create account → Get API key
- **Key Format**: `sk-ant-*`
- **Note**: Best for quality over speed

## REST API

### Get Providers

```bash
GET /api/free-api/providers
```

Returns list of all available providers with their capabilities and current status.

**Response:**
```json
{
  "success": true,
  "providers": [
    {
      "id": "zai",
      "name": "Z.AI (Together AI)",
      "description": "Free tier for GLM 4.5 Flash...",
      "hasKey": true,
      "isHealthy": true,
      "models": [...],
      "rateLimit": {...},
      "supports": {...}
    }
  ]
}
```

### Get Configured Keys Summary

```bash
GET /api/free-api/keys
```

Returns summary of configured keys (does NOT return actual keys).

**Response:**
```json
{
  "success": true,
  "keys": [
    {
      "provider": "zai",
      "active": true,
      "keyCount": 1,
      "hasError": false
    }
  ],
  "hasAnyKeys": true
}
```

### Add an API Key

```bash
POST /api/free-api/keys
Content-Type: application/json

{
  "provider": "zai",
  "apiKey": "together_ai_...",
  "name": "My ZAI Key (Optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key added for zai",
  "provider": "zai"
}
```

### Check Provider Health

```bash
GET /api/free-api/health
```

Returns health status for all configured providers.

**Response:**
```json
{
  "success": true,
  "health": [
    {
      "provider": "zai",
      "healthy": true,
      "lastCheck": "2024-01-31T10:30:00Z",
      "responseTime": 245,
      "errorRate": 0,
      "message": "OK",
      "hasKey": true
    }
  ]
}
```

### Get Current Configuration

```bash
GET /api/free-api/config
```

Returns the active model configuration being used by the gateway.

**Response:**
```json
{
  "success": true,
  "config": {
    "primaryModel": {
      "provider": "zai",
      "modelId": "meta-llama/Llama-3.3-70B-Instruct-Turbo"
    },
    "fallbackModels": [
      {
        "provider": "groq",
        "modelId": "mixtral-8x7b-32768"
      }
    ],
    "health": {...}
  }
}
```

## Integration with Moltbot

### Automatic Model Provider Generation

The system automatically converts free API keys into Moltbot-compatible model configurations:

```typescript
import { createFreeApiSystem } from "./src/free-api/index.js";

const system = createFreeApiSystem();

// System generates model provider configs
const configs = system.gatewayBridge.generateProviderConfigs();

// Apply to agents
agentConfig.models.providers = configs;
```

### Health Monitoring

Health checks run automatically every 5 minutes:

```typescript
// Start monitoring
system.healthMonitor.startMonitoring();

// Get status
const status = system.healthMonitor.getStatus("zai");
console.log(`${status.provider}: ${status.healthy ? "Healthy" : "Down"}`);

// Get best available
const best = system.healthMonitor.getBestProvider(
  system.keyManager.getProvidersInPriority()
);
```

### Key Management

```typescript
// Add an API key
const entry = system.keyManager.addApiKey("zai", "together_ai_...");

// Get active key for provider
const key = system.keyManager.getActiveKeyForProvider("zai");

// Record usage
system.keyManager.recordKeyUsage("zai");

// Handle failure
system.keyManager.recordKeyFailure("zai", "Rate limit exceeded");
```

## Configuration Examples

### Basic Config (ZAI + Groq Fallback)

```json
{
  "env": {
    "ZAI_API_KEY": "together_ai_...",
    "GROQ_API_KEY": "gsk_..."
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "zai/meta-llama/Llama-3.3-70B-Instruct-Turbo"
      }
    }
  }
}
```

### Multi-Provider Config (Advanced)

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "zai": {
        "baseUrl": "https://api.together.xyz/v1",
        "apiKey": "${ZAI_API_KEY}",
        "auth": "api-key",
        "models": [
          {
            "id": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
            "name": "Llama 3.3 (Fast)",
            "reasoning": false,
            "input": ["text"],
            "cost": { "input": 0.0009, "output": 0.0009, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 8192,
            "maxTokens": 4096
          }
        ]
      }
    }
  }
}
```

## Error Handling

### Common Issues

**"No active API key for provider"**
- Add an API key via the dashboard or API
- Verify the key format matches expectations

**"Health check timeout"**
- Provider API is slow or unreachable
- Check provider status page
- Try a different provider

**"Rate limit exceeded"**
- You've used up your free quota for this month
- Add a key from another provider
- Moltbot will automatically failover

### Debugging

Enable detailed logging:

```bash
MOLTBOT_DEBUG=free-api moltbot gateway --verbose
```

## Best Practices

### 1. Use Multiple Providers
Always add at least 2 providers for redundancy:
- Primary: Your fastest/preferred provider
- Fallback: Another provider for when primary is down

### 2. Monitor Health Status
Check `/api/free-api/health` periodically to ensure providers are available.

### 3. Rotate API Keys
If a key gets compromised:
1. Revoke it in the provider's console
2. Remove via API or dashboard
3. Add a new key

### 4. Respect Rate Limits
Each provider has limits. Moltbot tracks failures but doesn't prevent them. Be mindful of:
- Requests per minute
- Tokens per minute
- Monthly quotas

### 5. Test Configuration
After adding keys:
```bash
moltbot agent --message "Hello" --verbose
```

Verify it uses the free APIs by checking the logs.

## Troubleshooting

### Keys show as "inactive"
- They hit too many failures (auto-deactivated after 5 failures)
- Try removing and re-adding
- Check provider status page

### Models not showing
- No active API keys configured
- Add keys via dashboard
- Verify key format matches provider expectations

### Health checks always failing
- API key is invalid or revoked
- Provider API is down (check provider status)
- Network connectivity issues

### Performance slow
- Using a slow model tier
- Provider experiencing high load
- Add a faster provider as primary

## Performance Metrics

Typical response times (ms):
- **Groq**: 100-300ms (fastest)
- **Together AI**: 300-500ms
- **Google Gemini**: 400-800ms
- **Anthropic**: 500-1200ms (best quality)

## Security Notes

- API keys are never logged or transmitted
- Health checks use minimal payloads
- All communication uses HTTPS
- Keys stored in memory, not persisted without encryption
- Always use environment variables for sensitive keys

## Contributing

Found an issue? Want to add another provider?
- [GitHub Issues](https://github.com/moltbot/moltbot/issues)
- [Discord Community](https://discord.gg/clawd)

## License

Part of Moltbot. MIT License.
