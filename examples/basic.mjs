/**
 * Basic usage — replace apiKey and baseUrl with your deployment.
 *
 *   node examples/basic.mjs
 */

import { Prevalid } from "../dist/index.js";

const prevalid = new Prevalid({
  apiKey: process.env.PREVALID_API_KEY ?? "prev_YOUR_KEY",
  baseUrl: process.env.PREVALID_BASE_URL ?? "https://api.prevalid.ai",
});

const session = await prevalid.createSession({
  agentId: "demo-agent",
});

console.log("session", session.sessionId);

const grant = await prevalid.createGrant({
  sessionId: session.sessionId,
  userIntent: "read workspace files",
  scope: {
    tools: ["fs"],
    actions: ["read", "list"],
    resources: ["/workspace/*"],
  },
});

console.log("grant", grant.grantToken.slice(0, 16) + "…");

const result = await prevalid.authorize({
  sessionId: session.sessionId,
  grantToken: grant.grantToken,
  toolName: "fs",
  action: "read",
  resource: "/workspace/readme.md",
});

console.log("decision", result.outcome, result.reasoning ?? result.message);
