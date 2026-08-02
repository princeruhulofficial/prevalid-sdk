/**
 * One-shot decide helper (session + grant + authorize).
 */

import { Prevalid } from "../dist/index.js";

const prevalid = new Prevalid({
  apiKey: process.env.PREVALID_API_KEY ?? "prev_YOUR_KEY",
  baseUrl: process.env.PREVALID_BASE_URL ?? "https://api.prevalid.ai",
});

const { result } = await prevalid.decide({
  userIntent: "list files in workspace",
  scope: {
    tools: ["fs"],
    actions: ["list", "read"],
    resources: ["/workspace/*"],
  },
  toolName: "fs",
  action: "list",
  resource: "/workspace",
  session: { agentId: "demo-agent" },
});

console.log(result.outcome, result.message ?? result.reasoning);
