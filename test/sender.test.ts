import { describe, expect, it, vi } from "vitest";
import { PaycrestClient } from "../src";

function mockFetch(status: number, body: unknown): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  ) as unknown as typeof fetch;
}

function ok(data: unknown): { status: string; message: string; data: unknown } {
  return { status: "success", message: "ok", data };
}

function callOf(fetchMock: typeof fetch): [string, RequestInit] {
  const call = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0]!;
  return [call[0] as string, call[1] as RequestInit];
}

const apiKey = "sender-key";

describe("sender endpoints", () => {
  it("createOrder POSTs the body and returns the create response", async () => {
    const fetch = mockFetch(
      201,
      ok({ id: "ord-1", status: "initiated", orderType: "regular" }),
    );
    const client = new PaycrestClient({ apiKey, fetch });
    const res = await client.sender.createOrder({
      amount: "100",
      source: { type: "crypto", currency: "USDT", network: "base" },
      destination: {
        type: "fiat",
        currency: "NGN",
        recipient: {
          institution: "GTBINGLA",
          accountIdentifier: "0123456789",
          accountName: "John Doe",
        },
      },
    });
    expect(res.id).toBe("ord-1");
    const [url, init] = callOf(fetch);
    expect(url).toContain("/sender/orders");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string).amount).toBe("100");
  });

  it("listOrders forwards status and direction", async () => {
    const fetch = mockFetch(
      200,
      ok({ total: 0, page: 1, pageSize: 10, orders: [] }),
    );
    const client = new PaycrestClient({ apiKey, fetch });
    await client.sender.listOrders({ status: "settled", direction: "offramp" });
    const [url] = callOf(fetch);
    expect(url).toContain("status=settled");
    expect(url).toContain("direction=offramp");
  });

  it("getStats returns structured sender stats", async () => {
    const fetch = mockFetch(
      200,
      ok({
        totalOrders: 3,
        totalOrderVolume: "300",
        totalFeeEarnings: "5",
      }),
    );
    const client = new PaycrestClient({ apiKey, fetch });
    const stats = await client.sender.getStats({ direction: "onramp" });
    expect(stats.totalOrders).toBe(3);
    expect(callOf(fetch)[0]).toContain("direction=onramp");
  });

  it("getOrderStatusByGatewayId hits the public /orders path without a key", async () => {
    const fetch = mockFetch(200, ok({ orderId: "0xabc", status: "settled" }));
    const client = new PaycrestClient({ fetch });
    const status = await client.sender.getOrderStatusByGatewayId(8453, "0xabc");
    expect(status.orderId).toBe("0xabc");
    const [url, init] = callOf(fetch);
    expect(url).toContain("/orders/8453/0xabc");
    expect((init.headers as Record<string, string>)["API-Key"]).toBeUndefined();
  });

  it("listWebhookDeliveries maps snake_case filters", async () => {
    const fetch = mockFetch(
      200,
      ok({ total: 0, page: 1, pageSize: 10, deliveries: [] }),
    );
    const client = new PaycrestClient({ apiKey, fetch });
    await client.sender.listWebhookDeliveries({
      status: "failed",
      eventId: "evt-1",
      orderId: "ord-9",
    });
    const [url] = callOf(fetch);
    expect(url).toContain("/sender/webhooks");
    expect(url).toContain("status=failed");
    expect(url).toContain("event_id=evt-1");
    expect(url).toContain("order_id=ord-9");
  });

  it("getWebhookDelivery interpolates the id", async () => {
    const fetch = mockFetch(
      200,
      ok({ id: "d1", requestPayload: {}, responseBody: "ok" }),
    );
    const client = new PaycrestClient({ apiKey, fetch });
    const delivery = await client.sender.getWebhookDelivery("d1");
    expect(delivery.responseBody).toBe("ok");
    expect(callOf(fetch)[0]).toContain("/sender/webhooks/d1");
  });

  it("retryWebhookDelivery sends sync=true and POSTs", async () => {
    const fetch = mockFetch(200, ok({ id: "d1", status: "success" }));
    const client = new PaycrestClient({ apiKey, fetch });
    await client.sender.retryWebhookDelivery("d1", { sync: true });
    const [url, init] = callOf(fetch);
    expect(url).toContain("/sender/webhooks/d1/retry");
    expect(url).toContain("sync=true");
    expect(init.method).toBe("POST");
  });

  it("retryWebhookDelivery omits sync when not requested", async () => {
    const fetch = mockFetch(202, ok({ id: "d1" }));
    const client = new PaycrestClient({ apiKey, fetch });
    await client.sender.retryWebhookDelivery("d1");
    expect(callOf(fetch)[0]).not.toContain("sync=");
  });
});
