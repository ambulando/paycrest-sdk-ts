import { describe, expect, it, vi } from "vitest";
import { PaycrestClient } from "../src/index.js";
import { PaycrestApiError, PaycrestError } from "../src/errors.js";

function mockFetch(status: number, body: unknown): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  ) as unknown as typeof fetch;
}

describe("PaycrestClient", () => {
  it("unwraps the data envelope on success", async () => {
    const fetch = mockFetch(200, {
      status: "success",
      message: "ok",
      data: { id: "order-1", status: "initiated" },
    });
    const client = new PaycrestClient({ apiKey: "k", fetch });
    const order = await client.sender.getOrder("order-1");
    expect(order.id).toBe("order-1");
  });

  it("sends the API-Key header on authed requests", async () => {
    const fetch = mockFetch(200, { status: "success", message: "", data: {} });
    const client = new PaycrestClient({ apiKey: "secret-key", fetch });
    await client.sender.getStats();
    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const init = call![1] as RequestInit;
    expect((init.headers as Record<string, string>)["API-Key"]).toBe(
      "secret-key",
    );
  });

  it("throws PaycrestApiError on 4xx", async () => {
    const fetch = mockFetch(400, {
      status: "error",
      message: "bad request",
      data: [{ field: "amount", message: "required" }],
    });
    const client = new PaycrestClient({ apiKey: "k", fetch });
    await expect(client.sender.getOrder("x")).rejects.toBeInstanceOf(
      PaycrestApiError,
    );
  });

  it("requires an API key for authed endpoints", async () => {
    const client = new PaycrestClient({ fetch: mockFetch(200, {}) });
    await expect(client.sender.getStats()).rejects.toBeInstanceOf(
      PaycrestError,
    );
  });

  it("allows public rate calls without an API key", async () => {
    const fetch = mockFetch(200, {
      status: "success",
      message: "",
      data: { sell: { rate: "1500" } },
    });
    const client = new PaycrestClient({ fetch });
    const rates = await client.general.getRates({
      network: "base",
      from: "USDT",
      amount: "100",
      to: "NGN",
    });
    expect(rates.sell?.rate).toBe("1500");
  });
});
