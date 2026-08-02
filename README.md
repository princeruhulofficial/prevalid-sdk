# @prevalid/core

**Prevalid is the decision system for AI.**  
Prevalid determines what AI should do before AI acts.

Official **JavaScript / TypeScript SDK** — HTTP client only. No server code.

```text
Developer
    │
npm install @prevalid/core
    │
Prevalid SDK
    │
HTTPS API
    │
────────────────────────
  Private Prevalid Server
  (Decision · Grant · Audit · …)
────────────────────────
```

## Install

```bash
npm install @prevalid/core
```

## Configure

```ts
import { Prevalid } from "@prevalid/core";

const prevalid = new Prevalid({
  apiKey: process.env.PREVALID_API_KEY!,
  // baseUrl: "https://api.prevalid.ai", // default
});
```

## Create session

```ts
const session = await prevalid.createSession({
  agentId: "my-agent",
});
// → POST /api/v1/sessions
```

## Create grant

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

## Authorize

```ts
const result = await prevalid.authorize({
  sessionId: session.sessionId,
  grantToken: grant.grantToken,
  toolName: "fs",
  action: "read",
  resource: "/workspace/readme.md",
});
// → POST /api/v1/sessions/{id}/authorize

console.log(result.outcome); // allow | deny | pause | expire
```

## One-shot helper

```ts
const { result } = await prevalid.decide({
  userIntent: "list files",
  scope: { tools: ["fs"], actions: ["list"], resources: ["/workspace/*"] },
  toolName: "fs",
  action: "list",
  resource: "/workspace",
});
```

## Docs flow

```text
Install → Configure → Create Session → Authorize → Done
```

Developer code never builds HTTP by hand — the SDK does.

## What this package is not

- Not the Prevalid server
- Not a policy engine binary
- Not middleware you host

It only calls your Prevalid deployment over HTTPS.

## Development

```bash
npm install
npm run build
node examples/basic.mjs
```

## Publish

```bash
npm run build
npm publish --access public
```

## License

MIT
