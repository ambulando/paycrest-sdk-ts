import { describe, expect, it, vi } from "vitest";
import { PaycrestClient } from "../src";
import { PaycrestError } from "../src";

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

function urlOf(fetchMock: typeof fetch): string {
  return (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
}

const apiKey = "provider-key";

describe("provider endpoints", () => {
  it("listOrders forwards currency and filters", async () => {
    const fetch = mockFetch(
      200,
      ok({ total: 1, page: 1, pageSize: 10, orders: [{ id: "o1" }] }),
    );
    const client = new PaycrestClient({ apiKey, fetch });
    const res = await client.provider.listOrders({
      currency: "NGN",
      status: "settled",
      direction: "offramp",
      ordering: "asc",
    });
    expect(res.data.orders[0]!.id).toBe("o1");
    const url = urlOf(fetch);
    expect(url).toContain("/provider/orders");
    expect(url).toContain("currency=NGN");
    expect(url).toContain("status=settled");
    expect(url).toContain("direction=offramp");
    expect(url).toContain("ordering=asc");
  });

  it("getOrder interpolates the id", async () => {
    const fetch = mockFetch(200, ok({ id: "abc", status: "fulfilled" }));
    const client = new PaycrestClient({ apiKey, fetch });
    const order = await client.provider.getOrder("abc");
    expect(order.data.status).toBe("fulfilled");
    expect(urlOf(fetch)).toContain("/provider/orders/abc");
  });

  it("getMarketRate interpolates token and fiat", async () => {
    const fetch = mockFetch(200, ok({ sell: { marketRate: "1500" } }));
    const client = new PaycrestClient({ apiKey, fetch });
    const rate = await client.provider.getMarketRate("USDT", "NGN");
    expect(rate.data.sell?.marketRate).toBe("1500");
    expect(urlOf(fetch)).toContain("/provider/rates/USDT/NGN");
  });

  it("getStats forwards currency and direction", async () => {
    const fetch = mockFetch(
      200,
      ok({ totalOrders: 5, totalFiatVolume: "100", totalCryptoVolume: "10" }),
    );
    const client = new PaycrestClient({ apiKey, fetch });
    const stats = await client.provider.getStats({
      currency: "KES",
      direction: "onramp",
    });
    expect(stats.data.totalOrders).toBe(5);
    const url = urlOf(fetch);
    expect(url).toContain("/provider/stats");
    expect(url).toContain("currency=KES");
    expect(url).toContain("direction=onramp");
  });

  it("getNodeInfo hits the node-info path", async () => {
    const fetch = mockFetch(200, ok({ version: "1.0" }));
    const client = new PaycrestClient({ apiKey, fetch });
    const info = await client.provider.getNodeInfo();
    expect(info.data.version).toBe("1.0");
    expect(urlOf(fetch)).toContain("/provider/node-info");
  });

  it("sends the API-Key header (provider endpoints are authed)", async () => {
    const fetch = mockFetch(200, ok({ version: "1.0" }));
    const client = new PaycrestClient({ apiKey, fetch });
    await client.provider.getNodeInfo();
    const init = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1] as RequestInit;
    expect((init.headers as Record<string, string>)["API-Key"]).toBe(apiKey);
  });

  it("requires an API key", async () => {
    const client = new PaycrestClient({ fetch: mockFetch(200, ok({})) });
    await expect(client.provider.getNodeInfo()).rejects.toBeInstanceOf(
      PaycrestError,
    );
  });
});
