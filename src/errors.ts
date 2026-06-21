import type { ApiErrorResponse } from "./types.js";

/** Base error for all SDK-originated failures. */
export class PaycrestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaycrestError";
  }
}

/** Thrown when the API returns a non-2xx response. */
export class PaycrestApiError extends PaycrestError {
  readonly status: number;
  readonly fieldErrors: Array<{ field: string; message: string }>;

  constructor(status: number, body: ApiErrorResponse | string) {
    const message =
      typeof body === "string" ? body : body.message || "Paycrest API error";
    super(message);
    this.name = "PaycrestApiError";
    this.status = status;
    this.fieldErrors =
      typeof body === "string" ? [] : (body.data ?? []);
  }
}

/** Thrown when the request is rate-limited (HTTP 429). Retry with backoff. */
export class PaycrestRateLimitError extends PaycrestApiError {
  constructor(body: ApiErrorResponse | string) {
    super(429, body);
    this.name = "PaycrestRateLimitError";
  }
}

/** Thrown when a webhook signature fails verification. */
export class PaycrestSignatureError extends PaycrestError {
  constructor(message = "Invalid webhook signature") {
    super(message);
    this.name = "PaycrestSignatureError";
  }
}
