/**
 * Free API Management UI Component
 * Lit web component for public API key and provider management
 * 
 * Usage: Drop into web gateway or use as standalone
 */

import { html, LitElement, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { FreeApiProviderType } from "./types.js";
import { listAvailableProviders } from "./providers.js";

export interface ApiManagementState {
  providers: Array<{
    id: FreeApiProviderType;
    name: string;
    description: string;
    hasKey: boolean;
    isHealthy: boolean;
    responseTime?: number;
  }>;
  selectedProvider: FreeApiProviderType | null;
  apiKeyInput: string;
  loading: boolean;
  message: { type: "success" | "error" | "info"; text: string } | null;
}

@customElement("free-api-manager")
export class FreeApiManager extends LitElement {
  @state() state: ApiManagementState = {
    providers: [],
    selectedProvider: null,
    apiKeyInput: "",
    loading: false,
    message: null,
  };

  private gatewayUrl = "/api";

  static styles = css`
    :host {
      --primary: #3b82f6;
      --primary-dark: #1e40af;
      --success: #10b981;
      --error: #ef4444;
      --warning: #f59e0b;
      --bg-primary: #ffffff;
      --bg-secondary: #f9fafb;
      --bg-tertiary: #f3f4f6;
      --text-primary: #111827;
      --text-secondary: #6b7280;
      --border: #e5e7eb;
      --radius: 8px;
      --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    * {
      box-sizing: border-box;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: var(--bg-primary);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text-primary);
    }

    .header {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.5rem;
    }

    .header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 700;
    }

    .header p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 1rem;
    }

    .providers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .provider-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      color: inherit;
      display: block;
    }

    .provider-card:hover {
      border-color: var(--primary);
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }

    .provider-card.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    .provider-card h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .provider-card p {
      margin: 0 0 1rem 0;
      font-size: 0.875rem;
      opacity: 0.8;
      line-height: 1.5;
    }

    .provider-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-badge.active {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
    }

    .status-badge.inactive {
      background: rgba(107, 114, 128, 0.1);
      color: var(--text-secondary);
    }

    .form-section {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      font-size: 0.95rem;
    }

    input,
    select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 1rem;
      font-family: inherit;
      transition: border-color 0.2s ease;
    }

    input:focus,
    select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    input::placeholder {
      color: var(--text-secondary);
    }

    .button-group {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: var(--radius);
      font-weight: 500;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    button.primary {
      background: var(--primary);
      color: white;
    }

    button.primary:hover:not(:disabled) {
      background: var(--primary-dark);
      transform: translateY(-1px);
      box-shadow: var(--shadow);
    }

    button.secondary {
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border);
    }

    button.secondary:hover:not(:disabled) {
      background: var(--border);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .alert {
      padding: 1rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .alert.success {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--success);
    }

    .alert.error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: var(--error);
    }

    .alert.info {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: var(--primary);
    }

    .alert-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .keys-list {
      margin-top: 1.5rem;
    }

    .key-item {
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .key-info h4 {
      margin: 0 0 0.25rem 0;
      font-size: 0.95rem;
      font-weight: 500;
    }

    .key-info p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.85rem;
    }

    .key-actions {
      display: flex;
      gap: 0.5rem;
    }

    .key-actions button {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--text-secondary);
    }

    .empty-state svg {
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }

      .providers-grid {
        grid-template-columns: 1fr;
      }

      .header h1 {
        font-size: 1.5rem;
      }

      .button-group {
        flex-direction: column;
      }

      button {
        width: 100%;
      }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadProviders();
  }

  private async loadProviders(): Promise<void> {
    this.state.loading = true;

    try {
      const response = await fetch(`${this.gatewayUrl}/free-api/providers`);
      if (!response.ok) throw new Error("Failed to load providers");

      const data = await response.json();
      this.state = {
        ...this.state,
        providers: data.providers,
        loading: false,
      };
    } catch (error) {
      this.state = {
        ...this.state,
        message: {
          type: "error",
          text: `Failed to load providers: ${error instanceof Error ? error.message : String(error)}`,
        },
        loading: false,
      };
    }
  }

  private async addApiKey(): Promise<void> {
    if (!this.state.selectedProvider || !this.state.apiKeyInput.trim()) {
      this.setState({
        message: { type: "error", text: "Please select a provider and enter an API key" },
      });
      return;
    }

    this.state.loading = true;

    try {
      const response = await fetch(`${this.gatewayUrl}/free-api/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: this.state.selectedProvider,
          apiKey: this.state.apiKeyInput,
        }),
      });

      if (!response.ok) throw new Error("Failed to add API key");

      this.setState({
        message: { type: "success", text: "API key added successfully!" },
        apiKeyInput: "",
      });

      // Reload providers to update status
      this.loadProviders();
    } catch (error) {
      this.setState({
        message: {
          type: "error",
          text: `Failed to add API key: ${error instanceof Error ? error.message : String(error)}`,
        },
      });
    } finally {
      this.state.loading = false;
    }
  }

  private setState(partial: Partial<ApiManagementState>): void {
    this.state = { ...this.state, ...partial };
  }

  render() {
    return html`
      <div class="container">
        <div class="header">
          <h1>Free AI API Manager</h1>
          <p>Add API keys from free LLM providers to use with Moltbot</p>
        </div>

        ${this.state.message ? this.renderMessage() : ""}

        <div class="form-section">
          <div class="form-group">
            <label>Select Provider:</label>
            <select
              @change="${(e: Event) => {
                const target = e.target as HTMLSelectElement;
                this.setState({ selectedProvider: target.value as FreeApiProviderType });
              }}"
              value=${this.state.selectedProvider || ""}
            >
              <option value="">-- Choose a provider --</option>
              ${this.state.providers.map(
                (p) => html`<option value=${p.id}>${p.name}</option>`,
              )}
            </select>
          </div>

          ${this.state.selectedProvider
            ? html`
                <div class="form-group">
                  <label>API Key:</label>
                  <input
                    type="password"
                    placeholder="Paste your API key here"
                    @input="${(e: Event) => {
                      const target = e.target as HTMLInputElement;
                      this.setState({ apiKeyInput: target.value });
                    }}"
                    value=${this.state.apiKeyInput}
                  />
                  <small style="color: var(--text-secondary); margin-top: 0.25rem; display: block;">
                    Your API key is sent securely and stored locally.
                  </small>
                </div>
              `
            : ""}

          <div class="button-group">
            <button class="secondary" @click="${() => this.setState({ apiKeyInput: "" })}">
              Clear
            </button>
            <button
              class="primary"
              @click="${() => this.addApiKey()}"
              ?disabled=${!this.state.selectedProvider || !this.state.apiKeyInput || this.state.loading}
            >
              ${this.state.loading ? "Adding..." : "Add API Key"}
            </button>
          </div>
        </div>

        <div class="providers-grid">
          ${this.state.providers.map((provider) => this.renderProviderCard(provider))}
        </div>
      </div>
    `;
  }

  private renderMessage() {
    const msg = this.state.message;
    if (!msg) return "";

    const icons: Record<string, string> = {
      success: "✓",
      error: "✕",
      info: "i",
    };

    return html`
      <div class="alert ${msg.type}">
        <div class="alert-icon">${icons[msg.type]}</div>
        <div>${msg.text}</div>
      </div>
    `;
  }

  private renderProviderCard(provider: (typeof this.state.providers)[0]) {
    return html`
      <div
        class="provider-card ${provider.id === this.state.selectedProvider ? "active" : ""}"
        @click="${() => this.setState({ selectedProvider: provider.id })}"
      >
        <h3>${provider.name}</h3>
        <p>${provider.description}</p>
        <div class="provider-status">
          <span class="status-badge ${provider.hasKey ? "active" : "inactive"}">
            ${provider.hasKey ? "Active" : "Not Added"}
          </span>
          ${provider.isHealthy ? html`<span style="color: var(--success);">Healthy</span>` : ""}
          ${provider.responseTime ? html`<span style="font-size: 0.75rem; opacity: 0.7;">${provider.responseTime}ms</span>` : ""}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "free-api-manager": FreeApiManager;
  }
}
