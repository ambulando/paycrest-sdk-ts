import { describe, expect, it, vi } from "vitest";
import { PaycrestClient } from "../src";
import * as cryptoOrder from "./mock-data/create-order";
import * as fiatOrder from "./mock-data/create-order-fiat";

function mockFetch(status: number, body: unknown): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  ) as unknown as typeof fetch;
}

function callOf(fetchMock: typeof fetch): [string, RequestInit] {
  const call = (fetchMock as ReturnType<typeof vi.fn>).mock.calls[0]!;
  return [call[0] as string, call[1] as RequestInit];
}

describe("createOrder — crypto order request (offramp)", () => {
  it("POSTs the crypto source / fiat destination body", async () => {
    const fetch = mockFetch(201, cryptoOrder.http_response);
    const client = new PaycrestClient({ apiKey: "k", fetch });

    await client.sender.createOrder(cryptoOrder.request);

    const [url, init] = callOf(fetch);
    expect(url).toContain("/sender/orders");
    expect(init.method).toBe("POST");

    const body = JSON.parse(init.body as string);
    expect(body.amount).toBe("0.5");
    expect(body.source.type).toBe("crypto");
    expect(body.source.network).toBe("arbitrum-one");
    expect(body.source.refundAddress).toBe(
      "0xa706aD54852c9f5A172F25453aAC860d6368964d",
    );
    expect(body.destination.type).toBe("fiat");
    expect(body.destination.recipient.institution).toBe("OPAYNGPC");
  });

  it("parses the response, reviving the crypto provider account dates", async () => {
    const fetch = mockFetch(201, cryptoOrder.http_response);
    const client = new PaycrestClient({ apiKey: "k", fetch });

    const res = await client.sender.createOrder(cryptoOrder.request);

    expect(res.data.id).toBe("0ed20b4c-b8ea-4342-a411-9724880f197a");
    expect(res.data.timestamp).toBeInstanceOf(Date);
    expect(res.data.providerAccount.validUntil).toBeInstanceOf(Date);
    expect(res.data.providerAccount.receiveAddress).toBe(
      "0x527fd8489d3966C2cff9bA243Fd40EB97B4dE9B6",
    );
  });
});

describe("createOrder — fiat order request (onramp)", () => {
  it("POSTs the fiat source / crypto destination body", async () => {
    const fetch = mockFetch(201, fiatOrder.http_response);
    const client = new PaycrestClient({ apiKey: "k", fetch });

    await client.sender.createOrder(fiatOrder.request);

    const [url, init] = callOf(fetch);
    expect(url).toContain("/sender/orders");
    expect(init.method).toBe("POST");

    const body = JSON.parse(init.body as string);
    expect(body.amount).toBe("10000");
    expect(body.amountIn).toBe("fiat");
    expect(body.source.type).toBe("fiat");
    expect(body.source.refundAccount.institution).toBe("OPAYNGPC");
    expect(body.destination.type).toBe("crypto");
    expect(body.destination.recipient.address).toBe(
      "0xa706aD54852c9f5A172F25453aAC860d6368964d",
    );
    expect(body.destination.recipient.network).toBe("arbitrum-one");
  });

  it("parses the response, exposing the fiat provider account to pay into", async () => {
    const fetch = mockFetch(201, fiatOrder.http_response);
    const client = new PaycrestClient({ apiKey: "k", fetch });

    const res = await client.sender.createOrder(fiatOrder.request);

    expect(res.data.id).toBe("5c3b8d21-9a44-4f02-bf18-0c2d77e1a934");
    expect(res.data.providerAccount.amountToTransfer).toBe("10000");
    expect(res.data.providerAccount.currency).toBe("NGN");
    expect(res.data.providerAccount.accountIdentifier).toBe("9033919709");
    expect(res.data.providerAccount.validUntil).toBeInstanceOf(Date);
  });
});
