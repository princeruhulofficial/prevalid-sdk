/** Shared types for the Prevalid SDK (HTTP API shapes). */

export type DecisionOutcome = "allow" | "deny" | "pause" | "expire";

export interface PrevalidConfig {
  /** API key (prev_...) */
  apiKey: string;
  /** Base URL of the Prevalid server, e.g. https://api.prevalid.ai */
  baseUrl?: string;
  /** Optional fetch implementation (defaults to global fetch) */
  fetch?: typeof fetch;
}

export interface CreateSessionOptions {
  workspaceId?: string;
  agentId?: string;
  agentType?: string;
  workflowId?: string;
  parentSessionId?: string;
}

export interface Session {
  sessionId: string;
  status: string;
  expiresAt?: string;
  workspaceId?: string | null;
  agentId?: string | null;
  workflowId?: string | null;
  parentSessionId?: string | null;
  agentType?: string | null;
  [key: string]: unknown;
}

export interface CreateGrantOptions {
  sessionId: string;
  userIntent: string;
  scope: {
    tools?: string[];
    actions?: string[];
    resources?: string[];
    [key: string]: unknown;
  };
  constraints?: Record<string, unknown>;
  expiryMinutes?: number;
  workspaceId?: string;
  agentId?: string;
}

export interface Grant {
  grantToken: string;
  grantId: string;
  status: string;
  expiresAt?: string;
  userIntent?: string;
  workspaceId?: string | null;
  agentId?: string | null;
  [key: string]: unknown;
}

export interface AuthorizeOptions {
  sessionId: string;
  grantToken: string;
  toolName: string;
  action: string;
  resource?: string;
  params?: Record<string, unknown>;
  resumeToken?: string;
  agentExplanation?: string;
}

export interface AuthorizeResult {
  outcome: DecisionOutcome;
  riskScore?: number;
  reasoning?: string;
  decisionId?: string;
  message?: string;
  grantStatus?: string;
  approvalId?: string;
  [key: string]: unknown;
}

export interface PrevalidErrorBody {
  error?: string;
  detail?: unknown;
  message?: string;
  outcome?: string;
  [key: string]: unknown;
}
