/**
 * @prevalid/core
 *
 * Prevalid is the decision system for AI.
 * This package is an HTTPS client only — no server code.
 */

export { Prevalid } from "./client.js";
export { PrevalidError } from "./errors.js";
export type {
  AuthorizeOptions,
  AuthorizeResult,
  CreateGrantOptions,
  CreateSessionOptions,
  DecisionOutcome,
  Grant,
  PrevalidConfig,
  Session,
} from "./types.js";
