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

function urlOf(fetchMock: typeof fetch): string {
  return (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
}

describe("general endpoints", () => {
  it("getRates builds the path and forwards query params", async () => {
    const fetch = mockFetch(200, ok({ sell: { rate: "1500" } }));
    const client = new PaycrestClient({ fetch });
    const rates = await client.general.getRates({
      network: "base",
      from: "USDT",
      amount: "100",
      to: "NGN",
      side: "sell",
      fromSource: "crypto",
      providerId: "ABCDEFGH",
    });
    expect(rates.sell?.rate).toBe("1500");
    const url = urlOf(fetch);
    expect(url).toContain("/rates/base/USDT/100/NGN");
    expect(url).toContain("side=sell");
    expect(url).toContain("from_source=crypto");
    expect(url).toContain("provider_id=ABCDEFGH");
  });

  it("getMarkets returns the orderbook and aggregates", async () => {
    const fetch = mockFetch(
      200,
      ok({
        asOf: "2026-06-21T00:00:00Z",
        aggregates: { corridors: 12, tokens: 3, networks: 4 },
        book: [{ providerId: "p1", side: "sell", token: "USDT", fiat: "NGN" }],
      }),
    );
    const client = new PaycrestClient({ fetch });
    const markets = await client.general.getMarkets();
    expect(markets.book[0]!.providerId).toBe("p1");
    expect(markets.aggregates.corridors).toBe(12);
    expect(urlOf(fetch)).toContain("/markets");
  });

  it("listCurrencies returns currency objects", async () => {
    const fetch = mockFetch(200, ok([{ code: "NGN", name: "Naira" }]));
    const client = new PaycrestClient({ fetch });
    const currencies = await client.general.listCurrencies();
    expect(currencies[0]!.code).toBe("NGN");
  });

  it("listInstitutions interpolates the currency code", async () => {
    const fetch = mockFetch(200, ok([{ name: "GTBank", code: "GTBINGLA" }]));
    const client = new PaycrestClient({ fetch });
    await client.general.listInstitutions("NGN");
    expect(urlOf(fetch)).toContain("/institutions/NGN");
  });

  it("listTokens forwards the network filter", async () => {
    const fetch = mockFetch(200, ok([{ symbol: "USDT" }]));
    const client = new PaycrestClient({ fetch });
    await client.general.listTokens({ network: "base" });
    expect(urlOf(fetch)).toContain("/tokens");
    expect(urlOf(fetch)).toContain("network=base");
  });

  it("getPublicKey returns the key string", async () => {
    const fetch = mockFetch(200, ok("-----BEGIN PUBLIC KEY-----"));
    const client = new PaycrestClient({ fetch });
    expect(await client.general.getPublicKey()).toContain("PUBLIC KEY");
  });

  it("reindexTransaction interpolates network and identifier", async () => {
    const fetch = mockFetch(200, ok({ events: {} }));
    const client = new PaycrestClient({ fetch });
    await client.general.reindexTransaction("base", "0xabc");
    expect(urlOf(fetch)).toContain("/reindex/base/0xabc");
  });

  it("public endpoints send no API-Key header", async () => {
    const fetch = mockFetch(200, ok([]));
    const client = new PaycrestClient({ fetch });
    await client.general.listCurrencies();
    const init = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1] as RequestInit;
    expect((init.headers as Record<string, string>)["API-Key"]).toBeUndefined();
  });
});
