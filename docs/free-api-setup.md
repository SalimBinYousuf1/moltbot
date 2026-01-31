# Free API Manager - Setup & Integration Guide

## For Users: Quick Start

### 1. Start Moltbot Gateway

```bash
moltbot gateway --port 18789
```

### 2. Open the Manager Dashboard

Visit: http://localhost:18789/free-api-manager.html

### 3. Add API Keys

- **Choose a Provider** from the dropdown
- **Paste Your API Key** (securely stored locally)
- **Click "Add API Key"**

### 4. Verify it Works

```bash
# Send a test message to verify the free API is being used
moltbot agent --message "Hello, what's your name?" --thinking high
```

You should see it using the free API models in the logs.

## For Developers: Integration

### Minimal Integration

Add to your gateway startup code:

```typescript
import express from "express";
import { setupFreeApiSystemInGateway } from "./src/free-api/gateway-integration.js";

const app = express();
app.use(express.json());

// Initialize free API system
const freeApiSystem = await setupFreeApiSystemInGateway(app, moltbotConfig);

// Your existing gateway code...

app.listen(18789, () => {
  console.log("Gateway with Free API system running on port 18789");
  console.log("Dashboard: http://localhost:18789/free-api-manager.html");
});
```

### Step-by-Step Integration

#### 1. Install Dependencies

```bash
npm install express
```

#### 2. Import the System

```typescript
import {
  createFreeApiSystem,
  registerFreeApiRoutes,
  httpHandlers,
} from "./src/free-api/index.js";
```

#### 3. Initialize the System

```typescript
// Create the unified system
const system = createFreeApiSystem();

// Or restore from persisted state
const system = restoreFreeApiSystem(savedState);
```

#### 4. Register HTTP Routes

```typescript
import { registerFreeApiRoutesOnGateway } from "./src/free-api/gateway-integration.js";

registerFreeApiRoutesOnGateway(app, system);
```

#### 5. Merge Provider Configs

```typescript
import { mergeFreeApiProvidersIntoConfig } from "./src/free-api/gateway-integration.js";

const updatedConfig = mergeFreeApiProvidersIntoConfig(mainConfig, system);
agentConfig = updatedConfig;
```

#### 6. Handle Shutdown

```typescript
process.on("SIGTERM", async () => {
  await system.close();
  process.exit(0);
});
```

### Advanced: Custom Provider

Add a new provider by extending the registry:

```typescript
import { FREE_API_PROVIDERS } from "./src/free-api/providers.js";

FREE_API_PROVIDERS["custom-provider"] = {
  id: "custom-provider",
  name: "My Custom LLM API",
  description: "My custom API description",
  baseUrl: "https://api.example.com/v1",
  apiKeyFormat: "sk-*",
  apiKeyEnvVar: "CUSTOM_API_KEY",
  models: [
    {
      id: "model-name",
      name: "Model Display Name",
      contextWindow: 8192,
      maxTokens: 4096,
      tier: "standard",
    },
  ],
  supports: {
    vision: true,
    streaming: true,
    functionCalling: false,
  },
  authRequired: true,
};
```

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────┐
│        Moltbot Gateway                          │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │   Free API System                        │  │
│  ├──────────────────────────────────────────┤  │
│  │                                          │  │
│  │  ┌─────────────────────────────────┐    │  │
│  │  │ API Key Manager                 │    │  │
│  │  │ • Store & manage API keys       │    │  │
│  │  │ • Track usage & failures        │    │  │
│  │  │ • Rotate active keys            │    │  │
│  │  └─────────────────────────────────┘    │  │
│  │                                          │  │
│  │  ┌─────────────────────────────────┐    │  │
│  │  │ Health Monitor                  │    │  │
│  │  │ • Check provider availability   │    │  │
│  │  │ • Track response times          │    │  │
│  │  │ • Calculate error rates         │    │  │
│  │  └─────────────────────────────────┘    │  │
│  │                                          │  │
│  │  ┌─────────────────────────────────┐    │  │
│  │  │ Gateway Bridge                  │    │  │
│  │  │ • Convert to Moltbot format     │    │  │
│  │  │ • Manage model selection        │    │  │
│  │  │ • Handle failover logic         │    │  │
│  │  └─────────────────────────────────┘    │  │
│  │                                          │  │
│  │  ┌─────────────────────────────────┐    │  │
│  │  │ HTTP Handlers                   │    │  │
│  │  │ • REST API endpoints            │    │  │
│  │  │ • Health status endpoints       │    │  │
│  │  │ • Configuration endpoints       │    │  │
│  │  └─────────────────────────────────┘    │  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                 ↑                               │
│        ┌────────┴────────┐                     │
│        │                 │                     │
│    HTTP API         Dashboard                  │
│  /api/free-api/*   /free-api-manager.html     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Data Flow

```
User adds API key via Dashboard
         ↓
HTTP POST /api/free-api/keys
         ↓
API Key Manager stores key
         ↓
Health Monitor checks provider
         ↓
Gateway Bridge generates model config
         ↓
Agents get access to models
         ↓
Request routed to best available provider
         ↓
Automatic failover if provider fails
```

## Configuration Files

### Persisting State

The Free API system can be persisted:

```typescript
// Save state
const state = persistFreeApiState(system);
fs.writeFileSync("free-api-state.json", JSON.stringify(state));

// Restore state
const savedState = JSON.parse(fs.readFileSync("free-api-state.json"));
const system = restoreFreeApiSystem(savedState);
```

### Environment Variables

Control via environment:

```bash
# Override API key
export ZAI_API_KEY="together_ai_..."
export GROQ_API_KEY="gsk_..."

# Debug logging
export MOLTBOT_DEBUG="free-api"

# Health check interval (ms)
export FREE_API_HEALTH_CHECK_INTERVAL="300000"
```

## Monitoring & Debugging

### Health Check Endpoint

```bash
curl http://localhost:18789/health/free-api

# Response:
{
  "healthy": true,
  "providers": [
    {
      "provider": "zai",
      "healthy": true,
      "errorRate": 0
    }
  ]
}
```

### API Status Endpoint

```bash
curl http://localhost:18789/api/free-api/config

# Response includes:
{
  "primaryModel": {...},
  "fallbackModels": [...],
  "health": {...}
}
```

### Enable Debug Logging

```bash
MOLTBOT_DEBUG=free-api moltbot gateway --verbose

# Watch logs for:
# [v0] Free API system initialized
# [v0] Health check completed for zai
# [v0] Key added for groq
```

## Testing

### Unit Tests

```bash
npm test src/free-api
```

### Integration Tests

```bash
# Start gateway
moltbot gateway &

# Add test API key
curl -X POST http://localhost:18789/api/free-api/keys \
  -H "Content-Type: application/json" \
  -d '{"provider":"zai","apiKey":"test_key"}'

# Check health
curl http://localhost:18789/api/free-api/health

# Send test message
moltbot agent --message "test" --verbose
```

### E2E Test Script

```bash
#!/bin/bash

# Start gateway in background
moltbot gateway &
GATEWAY_PID=$!

sleep 2

# Add API key
echo "Adding API key..."
curl -X POST http://localhost:18789/api/free-api/keys \
  -H "Content-Type: application/json" \
  -d '{"provider":"groq","apiKey":"test_key"}' || exit 1

# Check status
echo "Checking status..."
curl http://localhost:18789/api/free-api/config || exit 1

# Test message
echo "Testing message..."
moltbot agent --message "Hello" || exit 1

# Cleanup
kill $GATEWAY_PID

echo "All tests passed!"
```

## Troubleshooting

### Dashboard Won't Load

- Check gateway is running: `curl http://localhost:18789/free-api-manager.html`
- Check port 18789 is accessible
- Check browser console for errors (F12)

### Keys Not Working

- Verify key format matches provider expectations
- Check API key isn't revoked in provider dashboard
- Run health check: `curl http://localhost:18789/api/free-api/health`
- Check gateway logs: `moltbot gateway --verbose`

### Models Not Appearing

- Make sure at least one API key is added
- Check `/api/free-api/config` endpoint
- Verify provider config was merged: `moltbot doctor`

### Health Checks Failing

- Provider API may be down (check provider status page)
- Network connectivity issue
- Invalid API key (revoked or expired)
- Rate limit reached (too many health checks)

## Performance Tuning

### Disable Health Checks

```typescript
// Don't start health monitoring
// system.healthMonitor.startMonitoring() is NOT called
```

### Customize Check Interval

```typescript
// Check every 10 minutes instead of 5
system.healthMonitor.startMonitoring(600000);
```

### Increase Failure Tolerance

```typescript
// Modify in key-manager.ts:
// Change: if (entry.failureCount > 5)
// To: if (entry.failureCount > 10)
```

## Production Checklist

- [ ] Multiple providers configured (fallback support)
- [ ] Health checks running and reporting
- [ ] Dashboard accessible to admins only
- [ ] API keys rotated regularly
- [ ] State persistence enabled
- [ ] Monitoring and alerting set up
- [ ] Rate limits understood for each provider
- [ ] Logging enabled for debugging
- [ ] Load testing completed
- [ ] Failover behavior tested

## Next Steps

1. **Add your first API key**: Visit the dashboard
2. **Test with agents**: `moltbot agent --message "test"`
3. **Monitor health**: Check `/api/free-api/health` regularly
4. **Scale up**: Add more providers for redundancy
5. **Optimize**: Track which providers are most reliable

## Getting Help

- **Documentation**: /docs/free-api-manager.md
- **Issues**: https://github.com/moltbot/moltbot/issues
- **Discord**: https://discord.gg/clawd
- **Examples**: /src/free-api/example.ts
