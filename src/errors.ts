import type { PrevalidErrorBody } from "./types.js";

export class PrevalidError extends Error {
  readonly status: number;
  readonly body: PrevalidErrorBody | null;

  constructor(message: string, status: number, body: PrevalidErrorBody | null = null) {
    super(message);
    this.name = "PrevalidError";
    this.status = status;
    this.body = body;
  }
}
