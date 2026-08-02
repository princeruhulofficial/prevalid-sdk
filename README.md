# prevalid-sdk

[![npm version](https://img.shields.io/npm/v/prevalid-sdk.svg)](https://www.npmjs.com/package/prevalid-sdk)
[![license](https://img.shields.io/npm/l/prevalid-sdk.svg)](https://www.npmjs.com/package/prevalid-sdk)
[![node](https://img.shields.io/node/v/prevalid-sdk.svg)](https://www.npmjs.com/package/prevalid-sdk)

Official **JavaScript / TypeScript SDK** for [Prevalid](https://www.prevalid.net/).

**Prevalid is the decision system for AI.**  
It determines what an agent may do **before** the agent acts.

Before your application runs a tool, Prevalid evaluates the request and returns a decision:

- **allow** — proceed
- **deny** — block
- **pause** — wait for human approval
- **expire** — grant or session no longer valid

This package is the **developer interface** to a deployed Prevalid decision engine over HTTPS. It is not the server, and it does not execute tools for you.

```text
AI Agent Application
        │
   prevalid-sdk  (this package)
        │
      HTTPS
        │
Prevalid Decision Engine
        │
  allow | deny | pause | expire
        │
Agent executes tool only on allow
```

## When to use this SDK

Use **prevalid-sdk** when building AI agents that need:

- controlled tool / action access
- human approval workflows (`pause`)
- execution audit trails on the server
- a decision on every consequential action — not only at login

## Requirements

- **Node.js** ≥ 18
- A running **Prevalid** API (your deployment URL)
- A **Prevalid API key** (`prev_...`)

## Install

```bash
npm install prevalid-sdk
```

## Configure

Set your key (shell example):

```bash
export PREVALID_API_KEY="prev_your_key_here"
export PREVALID_BASE_URL="https://your-prevalid-host.example"   # optional; defaults to https://api.prevalid.ai
```

```ts
import { Prevalid } from "prevalid-sdk";

const prevalid = new Prevalid({
  apiKey: process.env.PREVALID_API_KEY!,
  baseUrl: process.env.PREVALID_BASE_URL, // your Railway / production URL
});
```

Authentication: every call sends `Authorization: Bearer <apiKey>`. The key is issued by your Prevalid deployment — keep it out of source control.

## Docs flow

```text
Install → Configure → Create Session → Create Grant → Authorize → Done
```

### Create session

```ts
const session = await prevalid.createSession({
  agentId: "my-agent",
});
// → POST /api/v1/sessions
```

### Create grant

A grant is scoped, time-bound permission for a task — not unlimited authority.

```ts
const grant = await prevalid.createGrant({
  sessionId: session.sessionId,
  userIntent: "read workspace files",
  scope: {
    tools: ["fs"],
    actions: ["read", "list"],
    resources: ["/workspace/*"],
  },
});
// → POST /api/v1/sessions/{id}/grants
```

### Authorize

Call **before** the agent runs the tool.

```ts
try {
  const result = await prevalid.authorize({
    sessionId: session.sessionId,
    grantToken: grant.grantToken,
    toolName: "fs",
    action: "read",
    resource: "/workspace/readme.md",
  });
  // → POST /api/v1/sessions/{id}/authorize

  if (result.outcome === "deny" || result.outcome === "expire") {
    throw new Error(result.message ?? result.reasoning ?? "Action not allowed");
  }

  if (result.outcome === "pause") {
    // Human approval required — do not execute the tool yet
    console.log("Paused:", result.message ?? result.reasoning);
    return;
  }

  // outcome === "allow" → safe to run your tool
  console.log("Allowed", result.decisionId);
} catch (err) {
  console.error(err);
}
```

## Session flow vs one-shot `decide()`

| API | Use when |
|-----|----------|
| `createSession` → `createGrant` → `authorize` | Multiple tool calls under one session / grant |
| `decide()` | Single decision; no need to keep a long-lived session in your code |

```ts
const { result } = await prevalid.decide({
  userIntent: "list files",
  scope: {
    tools: ["fs"],
    actions: ["list"],
    resources: ["/workspace/*"],
  },
  toolName: "fs",
  action: "list",
  resource: "/workspace",
});
```

## What this package is not

- Not the Prevalid server
- Not an AI model
- Not a replacement for your agent framework (LangGraph, CrewAI, etc.)
- Not responsible for tool execution — **you** run the tool only after `allow`
- Not middleware you host

It only calls **your** Prevalid deployment over HTTPS.

## Production notes

- Store `PREVALID_API_KEY` in a secret manager / env — never in the repo
- Point `baseUrl` at your production Prevalid host
- Treat non-`allow` outcomes as hard stops unless you implement HITL for `pause`
- Network / HTTP failures throw `PrevalidError` (status + body)

## Development

```bash
npm install
npm run build
node examples/basic.mjs
```

## Publish (maintainers)

```bash
npm version patch   # if needed
npm run build
npm publish
```

Live package: **[prevalid-sdk](https://www.npmjs.com/package/prevalid-sdk)** on npm.

## Links

| | |
|--|--|
npm | https://www.npmjs.com/package/prevalid-sdk |
SDK repo | https://github.com/princeruhulofficial/prevalid-sdk |
Server repo | https://github.com/princeruhulofficial/prevalid-mcp-server |
Website | https://www.prevalid.net/ |

## License

MIT
