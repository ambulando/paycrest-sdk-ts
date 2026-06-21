# @ambulando/paycrest-sdk

TypeScript SDK for the [Paycrest API](https://docs.paycrest.io). Covers the
Sender integration: creating and tracking payment orders (on/off-ramp),
fetching public rates, verifying recipient accounts, and verifying webhooks.

> **Status:** early-stage stub. The surface mirrors the documented API but has
> not been validated end-to-end against a live account.

## Install

```bash
npm install @ambulando/paycrest-sdk
```

Requires Node.js 18+ (uses the global `fetch` and `node:crypto`).

## Usage

```ts
import { PaycrestClient } from "@ambulando/paycrest-sdk";

const client = new PaycrestClient({
  apiKey: process.env.PAYCREST_API_KEY,
  apiSecret: process.env.PAYCREST_API_SECRET, // for webhook verification
});

// Create an off-ramp order (crypto -> fiat)
const order = await client.sender.createOrder({
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
  reference: "my-internal-id-123",
});

// Track status
const latest = await client.sender.getOrder(order.id);
```

### Public rates (no API key required)

```ts
const rates = await client.general.getRates({
  network: "base",
  from: "USDT",
  amount: "100",
  to: "NGN",
});
```

### Webhooks

Verify the `X-Paycrest-Signature` header against the **raw** request body:

```ts
import { constructEvent } from "@ambulando/paycrest-sdk";

const event = constructEvent(rawBody, signature, process.env.PAYCREST_API_SECRET!);
if (event.event === "payment_order.settled") {
  // handle settlement
}
```

## Notes

- Amounts, rates, and fees are decimal **strings**, not numbers.
- The default base URL is `https://api.paycrest.io/v2`; override with `baseUrl`.
