import { PrevalidError } from "./errors.js";
import type {
  AuthorizeOptions,
  AuthorizeResult,
  CreateGrantOptions,
  CreateSessionOptions,
  Grant,
  PrevalidConfig,
  Session,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.prevalid.ai";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function mapSession(raw: Record<string, unknown>): Session {
  return {
    sessionId: String(raw.session_id ?? raw.id ?? ""),
    status: String(raw.status ?? "active"),
    expiresAt: raw.expires_at != null ? String(raw.expires_at) : undefined,
    workspaceId: (raw.workspace_id as string | null | undefined) ?? null,
    agentId: (raw.agent_id as string | null | undefined) ?? null,
    workflowId: (raw.workflow_id as string | null | undefined) ?? null,
    parentSessionId: (raw.parent_session_id as string | null | undefined) ?? null,
    agentType: (raw.agent_type as string | null | undefined) ?? null,
    ...raw,
  };
}

function mapGrant(raw: Record<string, unknown>): Grant {
  return {
    grantToken: String(raw.grant_token ?? ""),
    grantId: String(raw.grant_id ?? raw.id ?? ""),
    status: String(raw.status ?? "active"),
    expiresAt: raw.expires_at != null ? String(raw.expires_at) : undefined,
    userIntent: raw.user_intent != null ? String(raw.user_intent) : undefined,
    workspaceId: (raw.workspace_id as string | null | undefined) ?? null,
    agentId: (raw.agent_id as string | null | undefined) ?? null,
    ...raw,
  };
}

function mapAuthorize(raw: Record<string, unknown>): AuthorizeResult {
  return {
    outcome: (raw.outcome as AuthorizeResult["outcome"]) ?? "deny",
    riskScore:
      typeof raw.risk_score === "number"
        ? raw.risk_score
        : raw.risk_score != null
          ? Number(raw.risk_score)
          : undefined,
    reasoning: raw.reasoning != null ? String(raw.reasoning) : undefined,
    decisionId: raw.decision_id != null ? String(raw.decision_id) : undefined,
    message:
      raw.message != null
        ? String(raw.message)
        : raw.client_message != null
          ? String(raw.client_message)
          : undefined,
    grantStatus: raw.grant_status != null ? String(raw.grant_status) : undefined,
    approvalId: raw.approval_id != null ? String(raw.approval_id) : undefined,
    ...raw,
  };
}

/**
 * Prevalid SDK — thin HTTPS client for the decision system.
 * No server logic. Calls session / grant / authorize only.
 */
export class Prevalid {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: PrevalidConfig) {
    if (!config?.apiKey?.trim()) {
      throw new PrevalidError("apiKey is required", 0);
    }
    this.apiKey = config.apiKey.trim();
    this.baseUrl = normalizeBaseUrl(config.baseUrl ?? DEFAULT_BASE_URL);
    this.fetchImpl = config.fetch ?? globalThis.fetch.bind(globalThis);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await this.fetchImpl(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let data: unknown = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        data = { message: text };
      }
    }

    if (!res.ok) {
      const errBody =
        data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      const msg =
        (errBody?.error as string) ||
        (errBody?.message as string) ||
        (typeof errBody?.detail === "string" ? errBody.detail : null) ||
        `Prevalid API error (${res.status})`;
      throw new PrevalidError(msg, res.status, errBody);
    }

    return data as T;
  }

  /** POST /api/v1/sessions */
  async createSession(options: CreateSessionOptions = {}): Promise<Session> {
    const body: Record<string, unknown> = {};
    if (options.workspaceId) body.workspace_id = options.workspaceId;
    if (options.agentId) body.agent_id = options.agentId;
    if (options.agentType) body.agent_type = options.agentType;
    if (options.workflowId) body.workflow_id = options.workflowId;
    if (options.parentSessionId) body.parent_session_id = options.parentSessionId;

    const raw = await this.request<Record<string, unknown>>(
      "POST",
      "/api/v1/sessions",
      body,
    );
    return mapSession(raw);
  }

  /** POST /api/v1/sessions/{sessionId}/grants */
  async createGrant(options: CreateGrantOptions): Promise<Grant> {
    const body: Record<string, unknown> = {
      user_intent: options.userIntent,
      scope: options.scope,
    };
    if (options.constraints) body.constraints = options.constraints;
    if (options.expiryMinutes != null) body.expiry_minutes = options.expiryMinutes;
    if (options.workspaceId) body.workspace_id = options.workspaceId;
    if (options.agentId) body.agent_id = options.agentId;

    const raw = await this.request<Record<string, unknown>>(
      "POST",
      `/api/v1/sessions/${encodeURIComponent(options.sessionId)}/grants`,
      body,
    );
    return mapGrant(raw);
  }

  /**
   * Authorize a tool call (decision system).
   * POST /api/v1/sessions/{sessionId}/authorize
   */
  async authorize(options: AuthorizeOptions): Promise<AuthorizeResult> {
    const body: Record<string, unknown> = {
      grant_token: options.grantToken,
      tool_name: options.toolName,
      action: options.action,
    };
    if (options.resource !== undefined) body.resource = options.resource;
    if (options.params) body.params = options.params;
    if (options.resumeToken) body.resume_token = options.resumeToken;
    if (options.agentExplanation) {
      body.params = {
        ...(options.params ?? {}),
        agent_explanation: options.agentExplanation,
      };
    }

    const raw = await this.request<Record<string, unknown>>(
      "POST",
      `/api/v1/sessions/${encodeURIComponent(options.sessionId)}/authorize`,
      body,
    );
    return mapAuthorize(raw);
  }

  /** Convenience: session → grant → authorize in one flow helper. */
  async decide(input: {
    userIntent: string;
    scope: CreateGrantOptions["scope"];
    toolName: string;
    action: string;
    resource?: string;
    params?: Record<string, unknown>;
    session?: CreateSessionOptions;
    grant?: Partial<Pick<CreateGrantOptions, "constraints" | "expiryMinutes">>;
  }): Promise<{
    session: Session;
    grant: Grant;
    result: AuthorizeResult;
  }> {
    const session = await this.createSession(input.session ?? {});
    const grant = await this.createGrant({
      sessionId: session.sessionId,
      userIntent: input.userIntent,
      scope: input.scope,
      constraints: input.grant?.constraints,
      expiryMinutes: input.grant?.expiryMinutes,
      workspaceId: input.session?.workspaceId,
      agentId: input.session?.agentId,
    });
    const result = await this.authorize({
      sessionId: session.sessionId,
      grantToken: grant.grantToken,
      toolName: input.toolName,
      action: input.action,
      resource: input.resource,
      params: input.params,
    });
    return { session, grant, result };
  }
}
