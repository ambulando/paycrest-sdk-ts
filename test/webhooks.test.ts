import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { constructEvent, verifySignature } from "../src";
import { PaycrestSignatureError } from "../src";

const secret = "test-secret";

function sign(body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifySignature", () => {
  it("accepts a valid signature", () => {
    const body = JSON.stringify({ event: "payment_order.settled" });
    expect(verifySignature(body, sign(body), secret)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const body = JSON.stringify({ event: "payment_order.settled" });
    const sig = sign(body);
    expect(verifySignature(body + "x", sig, secret)).toBe(false);
  });
});

describe("constructEvent", () => {
  it("parses a verified event", () => {
    const body = JSON.stringify({
      event: "payment_order.settled",
      data: { id: "abc", status: "settled" },
    });
    const event = constructEvent(body, sign(body), secret);
    expect(event.event).toBe("payment_order.settled");
    expect(event.data.id).toBe("abc");
  });

  it("throws on an invalid signature", () => {
    const body = JSON.stringify({ event: "payment_order.settled" });
    expect(() => constructEvent(body, "deadbeef", secret)).toThrow(
      PaycrestSignatureError,
    );
  });
});
