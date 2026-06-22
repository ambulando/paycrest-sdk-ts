import { describe, expect, it, vi } from "vitest";
import { PaycrestClient } from "../src";
import type {
  CryptoDestination,
  CryptoSource,
  FiatDestination,
  FiatSource,
  OrderDestination,
  OrderSource,
} from "../src";

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

/** Pull the JSON body sent to fetch on the first call. */
function sentBody(fetchMock: typeof fetch): Record<string, unknown> {
  const init = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0]![1] as RequestInit;
  return JSON.parse(init.body as string);
}

describe("source legs", () => {
  it("CryptoSource carries network and refundAddress", () => {
    const source: CryptoSource = {
      type: "crypto",
      currency: "USDT",
      network: "base",
      refundAddress: "0xa706aD54852c9f5A172F25453aAC860d6368964d",
    };
    expect(source.type).toBe("crypto");
    expect(source.network).toBe("base");
    expect(source.refundAddress).toContain("0x");
  });

  it("FiatSource carries a refundAccount", () => {
    const source: FiatSource = {
      type: "fiat",
      currency: "NGN",
      country: "NG",
      refundAccount: {
        institution: "GTBINGLA",
        accountIdentifier: "0123456789",
        accountName: "John Doe",
      },
    };
    expect(source.type).toBe("fiat");
    expect(source.refundAccount?.institution).toBe("GTBINGLA");
  });
});

describe("destination legs", () => {
  it("CryptoDestination requires a crypto recipient", () => {
    const destination: CryptoDestination = {
      type: "crypto",
      currency: "USDC",
      providerId: "ABCDEFGH",
      recipient: { address: "0x527fd8489d3966C2cff9bA243Fd40EB97B4dE9B6", network: "base" },
    };
    expect(destination.recipient.address).toContain("0x");
    expect(destination.recipient.network).toBe("base");
  });

  it("FiatDestination requires a bank recipient and allows kyc", () => {
    const destination: FiatDestination = {
      type: "fiat",
      currency: "NGN",
      country: "NG",
      providerId: "ABCDEFGH",
      kyc: { bvn: "12345678901" },
      recipient: {
        institution: "GTBINGLA",
        accountIdentifier: "0123456789",
        accountName: "John Doe",
        memo: "rent",
      },
    };
    expect(destination.recipient.institution).toBe("GTBINGLA");
    expect(destination.kyc).toEqual({ bvn: "12345678901" });
  });
});

describe("OrderSource narrowing", () => {
  function describeSource(source: OrderSource): string {
    switch (source.type) {
      case "crypto":
        return `crypto:${source.currency}@${source.network}`;
      case "fiat":
        return `fiat:${source.currency}/${source.country ?? "?"}`;
    }
  }

  it("narrows a crypto source", () => {
    expect(
      describeSource({ type: "crypto", currency: "USDT", network: "base" }),
    ).toBe("crypto:USDT@base");
  });

  it("narrows a fiat source", () => {
    expect(
      describeSource({ type: "fiat", currency: "NGN", country: "NG" }),
    ).toBe("fiat:NGN/NG");
  });
});

describe("OrderDestination narrowing", () => {
  function describeDestination(dest: OrderDestination): string {
    switch (dest.type) {
      case "crypto":
        return `crypto:${dest.currency}->${dest.recipient.address}`;
      case "fiat":
        return `fiat:${dest.currency}->${dest.recipient.institution}`;
    }
  }

  it("narrows a crypto destination", () => {
    expect(
      describeDestination({
        type: "crypto",
        currency: "USDC",
        recipient: { address: "0xdef", network: "base" },
      }),
    ).toBe("crypto:USDC->0xdef");
  });

  it("narrows a fiat destination", () => {
    expect(
      describeDestination({
        type: "fiat",
        currency: "NGN",
        recipient: {
          institution: "GTBINGLA",
          accountIdentifier: "0123456789",
          accountName: "John Doe",
        },
      }),
    ).toBe("fiat:NGN->GTBINGLA");
  });
});

describe("createOrder serializes source/destination legs", () => {
  it("offramp: crypto source + fiat destination", async () => {
    const fetch = mockFetch(201, ok({ id: "o1", status: "initiated" }));
    const client = new PaycrestClient({ apiKey: "k", fetch });
    await client.sender.createOrder({
      amount: "100",
      source: { type: "crypto", currency: "USDT", network: "base", refundAddress: "0xabc" },
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
    const body = sentBody(fetch);
    const source = body.source as Record<string, unknown>;
    const destination = body.destination as Record<string, unknown>;
    expect(source.type).toBe("crypto");
    expect(source.network).toBe("base");
    expect(source.refundAddress).toBe("0xabc");
    expect(destination.type).toBe("fiat");
    expect((destination.recipient as Record<string, unknown>).institution).toBe(
      "GTBINGLA",
    );
  });

  it("onramp: fiat source + crypto destination", async () => {
    const fetch = mockFetch(201, ok({ id: "o2", status: "initiated" }));
    const client = new PaycrestClient({ apiKey: "k", fetch });
    await client.sender.createOrder({
      amount: "100",
      amountIn: "fiat",
      source: {
        type: "fiat",
        currency: "NGN",
        refundAccount: {
          institution: "GTBINGLA",
          accountIdentifier: "0123456789",
          accountName: "John Doe",
        },
      },
      destination: {
        type: "crypto",
        currency: "USDC",
        recipient: { address: "0xdef", network: "base" },
      },
    });
    const body = sentBody(fetch);
    const source = body.source as Record<string, unknown>;
    const destination = body.destination as Record<string, unknown>;
    expect(source.type).toBe("fiat");
    expect((source.refundAccount as Record<string, unknown>).institution).toBe(
      "GTBINGLA",
    );
    expect(destination.type).toBe("crypto");
    expect((destination.recipient as Record<string, unknown>).address).toBe(
      "0xdef",
    );
  });
});
