import { describe, expect, it, vi } from "vitest";
import { PaycrestClient } from "../src";
import { PaycrestApiError } from "../src";

function mockFetch(status: number, body: unknown): typeof fetch {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  ) as unknown as typeof fetch;
}

describe("verifyAccount", () => {
  it("returns the resolved account name", async () => {
    const fetch = mockFetch(200, {
      status: "success",
      message: "Account name was fetched successfully",
      data: "JOHN DOE",
    });
    const client = new PaycrestClient({ fetch });
    const name = await client.general.verifyAccount({
      institution: "GTBINGLA",
      accountIdentifier: "0123456789",
    });
    expect(name).toBe("JOHN DOE");
  });

  it('returns "OK" when no name is available for the corridor', async () => {
    const fetch = mockFetch(200, {
      status: "success",
      message: "ok",
      data: "OK",
    });
    const client = new PaycrestClient({ fetch });
    const name = await client.general.verifyAccount({
      institution: "SAFAKEPC",
      accountIdentifier: "254700000000",
      metadata: { channel: "Till" },
    });
    expect(name).toBe("OK");
  });

  it("works without an API key (endpoint is unauthenticated)", async () => {
    const fetch = mockFetch(200, { status: "success", message: "", data: "OK" });
    const client = new PaycrestClient({ fetch });
    await client.general.verifyAccount({
      institution: "GTBINGLA",
      accountIdentifier: "0123456789",
    });
    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const init = call![1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["API-Key"]).toBeUndefined();
    expect(init.method).toBe("POST");
  });

  it("propagates a 400 as PaycrestApiError", async () => {
    const fetch = mockFetch(400, {
      status: "error",
      message: "invalid account",
      data: [{ field: "accountIdentifier", message: "not found" }],
    });
    const client = new PaycrestClient({ fetch });
    await expect(
      client.general.verifyAccount({
        institution: "GTBINGLA",
        accountIdentifier: "bad",
      }),
    ).rejects.toBeInstanceOf(PaycrestApiError);
  });
});
