import { createHmac, timingSafeEqual } from "node:crypto";
import { PaycrestSignatureError } from "./errors.js";
import type { PaymentOrder } from "./types.js";

/** Header carrying the HMAC-SHA256 signature on incoming webhooks. */
export const SIGNATURE_HEADER = "x-paycrest-signature";

/** Webhook event names emitted by Paycrest. */
export type WebhookEventName =
  | "payment_order.deposited"
  | "payment_order.pending"
  | "payment_order.validated"
  | "payment_order.settling"
  | "payment_order.settled"
  | "payment_order.refunding"
  | "payment_order.refunded"
  | "payment_order.expired";

export interface WebhookEvent {
  /** e.g. "payment_order.settled". */
  event: WebhookEventName;
  data: PaymentOrder;
}

/**
 * Verify a webhook signature using HMAC-SHA256 over the raw request body.
 *
 * Pass the *raw* body string exactly as received — re-serializing parsed JSON
 * may change byte order and break verification.
 *
 * @param rawBody   Raw request body string.
 * @param signature Value of the `X-Paycrest-Signature` header.
 * @param secret    Your API secret.
 */
export function verifySignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Verify and parse a webhook payload. Throws {@link PaycrestSignatureError}
 * when the signature is invalid.
 */
export function constructEvent(
  rawBody: string,
  signature: string,
  secret: string,
): WebhookEvent {
  if (!verifySignature(rawBody, signature, secret)) {
    throw new PaycrestSignatureError();
  }
  return JSON.parse(rawBody) as WebhookEvent;
}
