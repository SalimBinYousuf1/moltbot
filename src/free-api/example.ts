/**
 * Free API Manager - Working Example
 * Shows real-world usage patterns for production implementation
 */

import { createFreeApiSystem, httpHandlers } from "./index.js";

/**
 * Example 1: Standalone initialization
 * Initialize the free API system independently
 */
async function exampleStandalone(): Promise<void> {
  console.log("[v0] === Example 1: Standalone Initialization ===");

  // Create the unified system
  const system = createFreeApiSystem();

  console.log("[v0] ✓ System initialized");
  console.log("[v0] Available providers:", system.keyManager.getProviderSummary());

  await system.close();
}

/**
 * Example 2: Add and manage API keys
 * Real production usage of the key manager
 */
async function exampleKeyManagement(): Promise<void> {
  console.log("\n[v0] === Example 2: API Key Management ===");

  const system = createFreeApiSystem();

  try {
    // Add API keys from different providers
    const zaiKey = system.keyManager.addApiKey("zai", "together_ai_sk_example_key_123456789", "ZAI Production Key");
    console.log("[v0] ✓ Added ZAI key:", zaiKey.name);

    const groqKey = system.keyManager.addApiKey("groq", "gsk_example_key_987654321", "Groq Backup");
    console.log("[v0] ✓ Added Groq key:", groqKey.name);

    // Get active keys
    const zaiActive = system.keyManager.getActiveKeyForProvider("zai");
    console.log("[v0] Active ZAI key:", zaiActive?.name);

    // Set primary provider
    system.keyManager.setPrimaryProvider("zai");
    console.log("[v0] ✓ Set ZAI as primary provider");

    // Get providers in priority order
    const priority = system.keyManager.getProvidersInPriority();
    console.log("[v0] Provider priority order:", priority);

    // Get summary
    const summary = system.keyManager.getProviderSummary();
    console.log("[v0] Provider summary:", summary);

    // Record usage
    system.keyManager.recordKeyUsage("zai");
    console.log("[v0] ✓ Recorded successful usage of ZAI");

    // Record failure
    system.keyManager.recordKeyFailure("groq", "Rate limit exceeded");
    console.log("[v0] ✓ Recorded failure for Groq");
  } finally {
    await system.close();
  }
}

/**
 * Example 3: Health monitoring
 * Real-time provider health checking
 */
async function exampleHealthMonitoring(): Promise<void> {
  console.log("\n[v0] === Example 3: Health Monitoring ===");

  const system = createFreeApiSystem();

  try {
    // Add some test keys (these won't actually work)
    system.keyManager.addApiKey("zai", "together_ai_test_key", "Test ZAI");
    system.keyManager.addApiKey("groq", "gsk_test_key", "Test Groq");

    // Check individual provider health
    console.log("[v0] Checking ZAI health...");
    const zaiHealthy = await system.healthMonitor.checkProvider("zai");
    console.log("[v0] ZAI Health:", zaiHealthy ? "✓ Healthy" : "✗ Unhealthy");

    // Get all health statuses
    const allHealth = system.healthMonitor.getAllStatus();
    console.log("[v0] All provider health statuses:");
    for (const status of allHealth) {
      const indicator = status.healthy ? "✓" : "✗";
      console.log(`  ${indicator} ${status.provider}: ${status.message}`);
    }

    // Get best available provider
    const best = system.healthMonitor.getBestProvider(["zai", "groq", "gemini"]);
    console.log("[v0] Best available provider:", best || "None");
  } finally {
    system.healthMonitor.stopMonitoring();
    await system.close();
  }
}

/**
 * Example 4: Gateway bridge integration
 * Converting free API state to Moltbot model configs
 */
async function exampleGatewayBridge(): Promise<void> {
  console.log("\n[v0] === Example 4: Gateway Bridge Integration ===");

  const system = createFreeApiSystem();

  try {
    // Add API keys
    system.keyManager.addApiKey("zai", "together_ai_test", "ZAI");
    system.keyManager.addApiKey("groq", "gsk_test", "Groq");

    // Generate model provider configs
    const configs = system.gatewayBridge.generateProviderConfigs();
    console.log("[v0] Generated provider configs for:", Object.keys(configs));

    // Get primary model
    const primary = system.gatewayBridge.getPrimaryModel();
    if (primary) {
      console.log("[v0] Primary model:", `${primary.provider}/${primary.modelId}`);
    }

    // Get fallback models
    const fallbacks = system.gatewayBridge.getFallbackModels();
    console.log("[v0] Fallback models:", fallbacks.map((f) => `${f.provider}/${f.modelId}`));

    // Get health summary
    const health = system.gatewayBridge.getHealthSummary();
    console.log("[v0] Health summary:", Object.keys(health));
  } finally {
    await system.close();
  }
}

/**
 * Example 5: HTTP handler integration
 * Using the REST API handlers with Express
 */
async function exampleHttpHandlers(): Promise<void> {
  console.log("\n[v0] === Example 5: HTTP Handler Integration ===");

  const system = createFreeApiSystem();

  try {
    // Create HTTP handlers
    const handlers = httpHandlers(system.keyManager, system.healthMonitor, system.gatewayBridge);

    console.log("[v0] Available HTTP handlers:");
    console.log("  • GET /api/free-api/providers");
    console.log("  • GET /api/free-api/keys");
    console.log("  • POST /api/free-api/keys");
    console.log("  • DELETE /api/free-api/keys/:provider");
    console.log("  • GET /api/free-api/health");
    console.log("  • GET /api/free-api/config");

    console.log("\n[v0] To integrate with Express:");
    console.log(`
import express from 'express';
import { registerFreeApiRoutes } from './src/free-api/http-handlers.js';

const app = express();
app.use(express.json());

const handlers = httpHandlers(system.keyManager, system.healthMonitor, system.gatewayBridge);
registerFreeApiRoutes(app, handlers);

app.listen(18789, () => {
  console.log('Free API Manager listening on http://localhost:18789');
  console.log('Access dashboard at http://localhost:18789/free-api-manager.html');
});
`);
  } finally {
    await system.close();
  }
}

/**
 * Example 6: Full integration with Moltbot gateway
 * How to wire everything into the main gateway
 */
async function exampleFullIntegration(): Promise<void> {
  console.log("\n[v0] === Example 6: Full Gateway Integration ===");

  console.log(`
To integrate the Free API Manager with Moltbot Gateway:

1. Import the system:
   import { createFreeApiSystem, registerFreeApiRoutes, httpHandlers } from './src/free-api/index.js';

2. Initialize in gateway startup:
   const freeApiSystem = createFreeApiSystem();
   
3. Register HTTP routes:
   const handlers = httpHandlers(
     freeApiSystem.keyManager,
     freeApiSystem.healthMonitor,
     freeApiSystem.gatewayBridge
   );
   registerFreeApiRoutes(app, handlers);

4. Merge model configs into agent config:
   const providerConfigs = freeApiSystem.gatewayBridge.generateProviderConfigs();
   agentConfig.models.providers = {
     ...agentConfig.models.providers,
     ...providerConfigs
   };

5. Use primary model:
   const primary = freeApiSystem.gatewayBridge.getPrimaryModel();
   if (primary) {
     agentConfig.models.defaults.primary = \`\${primary.provider}/\${primary.modelId}\`;
   }

6. Handle shutdown:
   process.on('SIGTERM', async () => {
     await freeApiSystem.close();
   });
`);
}

/**
 * Main runner
 */
async function main(): Promise<void> {
  console.log("🦞 Moltbot Free API Manager - Examples\n");

  try {
    await exampleStandalone();
    await exampleKeyManagement();
    await exampleHealthMonitoring();
    await exampleGatewayBridge();
    await exampleHttpHandlers();
    await exampleFullIntegration();

    console.log("\n✓ All examples completed successfully");
    console.log("\nFor production usage, see /docs/free-api-manager.md");
  } catch (error) {
    console.error("[v0] Example error:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { exampleStandalone, exampleKeyManagement, exampleHealthMonitoring, exampleGatewayBridge, exampleHttpHandlers, exampleFullIntegration };
