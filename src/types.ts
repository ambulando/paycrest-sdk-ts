/**
 * Core types for the Paycrest API.
 *
 * Note: the Paycrest API transmits most numeric values (amounts, rates, fees)
 * as decimal *strings*, not native numbers. We preserve that here.
 */

/** Standard API envelope. Every endpoint wraps its payload in this. */
export interface ApiResponse<T> {
  status: "success" | "error";
  message: string;
  data: T;
}

/** Error envelope returned on 4xx/5xx. */
export interface ApiErrorResponse {
  status: "error";
  message: string;
  data?: Array<{ field: string; message: string }>;
}

export interface Pagination {
  /** 1-based page number. Default: 1. */
  page?: number;
  /** Items per page. Default: 20, max: 100. */
  pageSize?: number;
}

export type OrderType = "crypto" | "fiat";

export type AmountIn = "crypto" | "fiat";

/** Direction of an order. */
export type OrderDirection = "offramp" | "onramp";

/** Order flow type. */
export type PaymentOrderType = "regular" | "otc";

/** Canonical payment-order lifecycle status. */
export type OrderStatus =
  | "initiated"
  | "deposited"
  | "pending"
  | "fulfilling"
  | "fulfilled"
  | "validated"
  | "settling"
  | "settled"
  | "cancelled"
  | "refunding"
  | "refunded"
  | "expired";

/** Bank/mobile-money account details (recipient or refund account). */
export interface Recipient {
  institution: string;
  institutionName?: string;
  accountIdentifier: string;
  accountName: string;
  memo?: string;
  metadata?: Record<string, unknown>;
}

/** Crypto recipient (onramp destination). */
export interface CryptoRecipient {
  address: string;
  network: string;
}

/** Crypto leg of an order (`type: "crypto"`). */
export interface CryptoEndpoint {
  type: "crypto";
  /** Stablecoin symbol, e.g. "USDT", "USDC", "cNGN". */
  currency: string;
  /** Blockchain network, e.g. "base", "polygon" (source / offramp leg). */
  network?: string;
  /** Pin to a specific provider (destination leg). */
  providerId?: string;
  /** Recipient address and network (onramp destination leg). */
  recipient?: CryptoRecipient;
  /** Refund address (offramp source leg). */
  refundAddress?: string;
}

/** Fiat leg of an order (`type: "fiat"`). */
export interface FiatEndpoint {
  type: "fiat";
  /** 3-letter ISO currency code, e.g. "NGN", "KES", "BRL". */
  currency: string;
  /** ISO 3166-1 alpha-2 country code. */
  country?: string;
  /** Pin to a specific provider (destination leg). */
  providerId?: string;
  /** Recipient KYC data (offramp destination leg). */
  kyc?: Record<string, unknown>;
  /** Bank/mobile-money recipient (offramp destination leg). */
  recipient?: Recipient;
  /** Refund account (onramp source leg). */
  refundAccount?: Recipient;
}

/** Source/destination leg of an order, discriminated by `type`. */
export type OrderEndpoint = CryptoEndpoint | FiatEndpoint;

export interface CreateOrderParams {
  /** Payment quantity, as a decimal string. */
  amount: string;
  /** Whether `amount` is denominated in crypto (default) or fiat. */
  amountIn?: AmountIn;
  source: OrderEndpoint;
  destination: OrderEndpoint;
  /** Exchange rate (fiat per crypto token), as a decimal string. */
  rate?: string;
  /** Fixed sender fee in crypto units, as a decimal string. */
  senderFee?: string;
  /** Percentage-based sender fee alternative, as a decimal string. */
  senderFeePercent?: string;
  /** Your internal order identifier. */
  reference?: string;
}

export interface ProviderAccount {
  /** Crypto provider account (offramp). */
  network?: string;
  receiveAddress?: string;
  /** Fiat provider account (onramp). */
  institution?: string;
  accountIdentifier?: string;
  accountName?: string;
  amountToTransfer?: string;
  currency?: string;
  /** Timestamp after which the account is no longer valid. */
  validUntil?: Date;
}

/** Response from creating an order. Note: uses `timestamp`, not created/updated. */
export interface CreateOrderResponse {
  id: string;
  status: OrderStatus;
  orderType: PaymentOrderType;
  timestamp: Date;
  amount: string;
  rate: string;
  senderFee: string;
  senderFeePercent: string;
  transactionFee: string;
  reference?: string;
  providerAccount: ProviderAccount;
  source: OrderEndpoint;
  destination: OrderEndpoint;
}

/** Canonical payment order, as returned by sender and provider list/get. */
export interface PaymentOrder {
  id: string;
  status: OrderStatus;
  orderType: PaymentOrderType;
  direction: OrderDirection;
  createdAt: Date;
  updatedAt: Date;
  amount: string;
  amountInUsd: string;
  amountPaid: string;
  amountReturned: string;
  percentSettled: string;
  rate: string;
  senderFee: string;
  senderFeePercent: string;
  transactionFee: string;
  reference?: string;
  txHash?: string;
  providerAccount?: ProviderAccount;
  source?: OrderEndpoint;
  destination?: OrderEndpoint;
}

export interface ListOrdersParams extends Pagination {
  status?: OrderStatus;
  direction?: OrderDirection;
}

export interface PaginatedOrders {
  total: number;
  page: number;
  pageSize: number;
  orders: PaymentOrder[];
}

export interface SenderStatsParams {
  direction?: OrderDirection;
}

export interface SenderStats {
  totalOrders: number;
  totalOrderVolume: string;
  totalFeeEarnings: string;
}

// --- Order status by Gateway ID (onchain) ---

export interface OrderSettlement {
  splitOrderId: string;
  amount: string;
  rate: string;
  orderPercent: string;
}

export interface OrderTxReceipt {
  status: string;
  txHash: string;
  timestamp: Date;
}

export interface LockOrderStatus {
  orderId: string;
  amount: string;
  amountInUsd: string;
  token: string;
  network: string;
  settlePercent: string;
  status: string;
  txHash: string;
  settlements: OrderSettlement[];
  txReceipts: OrderTxReceipt[];
  updatedAt: Date;
}

// --- Webhook deliveries ---

export type WebhookDeliveryStatus = "pending" | "success" | "failed" | "expired";

export type WebhookTrigger =
  | "automatic"
  | "cron_retry"
  | "manual_sync"
  | "manual_async";

export interface WebhookDeliverySummary {
  id: string;
  event: string;
  eventId: string;
  orderId: string;
  status: WebhookDeliveryStatus;
  trigger: WebhookTrigger;
  httpStatusCode: number;
  attemptNumber: number;
  destinationUrl: string;
  signature: string;
  errorMessage: string;
  durationMs: number;
  nextRetryTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** A single delivery record, including the frozen payload and response. */
export interface WebhookDelivery extends WebhookDeliverySummary {
  requestPayload: Record<string, unknown>;
  /** Captured response body, truncated to 4KB. */
  responseBody: string;
}

export interface ListWebhookDeliveriesParams extends Pagination {
  status?: WebhookDeliveryStatus;
  event?: string;
  eventId?: string;
  orderId?: string;
  /** ISO-8601; deliveries created at or after this timestamp. */
  from?: string;
  /** ISO-8601; deliveries created at or before this timestamp. */
  to?: string;
}

export interface PaginatedWebhookDeliveries {
  total: number;
  page: number;
  pageSize: number;
  deliveries: WebhookDeliverySummary[];
}

/** Inline result of a synchronous webhook replay. */
export interface WebhookRetryResult {
  id: string;
  status: "success" | "failed";
  httpStatusCode: number;
  durationMs: number;
  errorMessage: string;
}

/** Acknowledgement of an async (queued) webhook replay. */
export interface WebhookRetryQueued {
  id: string;
}

export interface VerifyAccountParams {
  institution: string;
  accountIdentifier: string;
  metadata?: Record<string, unknown>;
}

/** One side (buy or sell) of a rate quote. */
export interface Rate {
  /** Achievable rate (fiat per crypto), as a decimal string. */
  rate: string;
  /** Providers backing this quote. */
  providerIds: string[];
  /** Order flow type for this quote. */
  orderType: string;
  /** Refund window in minutes. */
  refundTimeoutMinutes: number;
}

export interface RatesResponse {
  buy?: Rate;
  sell?: Rate;
}

export interface RateParams {
  /** Blockchain network, e.g. "base", "ethereum", "polygon". */
  network: string;
  /** Fiat code or token symbol being converted from, e.g. "USDT". */
  from: string;
  /** Token notional, or amount in the `from` fiat, as a decimal string. */
  amount: string;
  /** Fiat code or token symbol being converted to, e.g. "NGN". */
  to: string;
  /** Limit to one side; both are returned when omitted. */
  side?: "buy" | "sell";
  /** Disambiguate `from` when it matches both a fiat and a token. */
  fromSource?: "fiat" | "crypto";
  /** Disambiguate `to` when it matches both a fiat and a token. */
  toSource?: "fiat" | "crypto";
  /** Pin the quote to a single provider (8 alphabetic chars). */
  providerId?: string;
}

export interface Currency {
  /** ISO 4217 code, e.g. "NGN". */
  code: string;
  name: string;
  shortName: string;
  decimals: number;
  symbol: string;
  /** Reference market buy rate, as a decimal string. */
  marketBuyRate: string;
  /** Reference market sell rate, as a decimal string. */
  marketSellRate: string;
}

export interface Institution {
  name: string;
  /** SWIFT code, or a Paycrest code ending in `PC`. */
  code: string;
  type: string;
}

export interface Token {
  symbol: string;
  contractAddress: string;
  decimals: number;
  baseCurrency: string;
  network: string;
}

export interface ListTokensParams {
  /** Filter by blockchain network, e.g. "base". */
  network?: string;
}

/** A statistic reported over rolling windows. */
export interface WindowedStat<T> {
  "24h": T;
  "7d": T;
  "30d": T;
  all: T;
}

export interface MarketAggregates {
  settledVolumeUsd: WindowedStat<string>;
  settledTxns: WindowedStat<number>;
  networkSuccessPercent: WindowedStat<number | null>;
  medianDeliverySecs: WindowedStat<number | null>;
  activeProviders: WindowedStat<number>;
  activeSenders: WindowedStat<number>;
  /** Total available liquidity, as a decimal string. */
  liveLiquidityUsd: string;
  /** Distinct token/fiat pairs. */
  corridors: number;
  tokens: number;
  networks: number;
}

/** One provider quote row in the orderbook. */
export interface MarketBookEntry {
  providerId: string;
  /** "sell" (offramp) or "buy" (onramp). */
  side: "sell" | "buy";
  token: string;
  fiat: string;
  network: string;
  /** Exchange rate, as a decimal string. */
  rate: string;
  rateType: "fixed" | "floating";
  /** Minimum order amount, as a decimal string. */
  min: string;
  /** Maximum order amount, as a decimal string. */
  max: string;
  /** Available liquidity, as a decimal string. */
  balance: string;
  /** Fiat code (sell) or token symbol (buy). */
  balanceCurrency: string;
  /** USD-normalized balance, as a decimal string. */
  balanceUsd: string;
  /** Total settled orders for the corridor. */
  settled: number;
  successPercent: string | null;
}

export interface MarketsResponse {
  /** Response generation timestamp. */
  asOf: Date;
  aggregates: MarketAggregates;
  book: MarketBookEntry[];
}

export interface ReindexResponse {
  events: Record<string, unknown>;
}

// --- Provider API ---

/** Where the provider's effective rate sits against the public benchmark. */
export interface ProviderRatePosition {
  bestPublicRate: string;
  yourEffectiveRate: string;
  deltaVsBest: string;
}

export interface ProviderRateSide {
  marketRate: string;
  minimumRate: string;
  maximumRate: string;
  /** Omitted when no public benchmark exists for the corridor. */
  position?: ProviderRatePosition;
}

export interface ProviderMarketRate {
  buy?: ProviderRateSide;
  sell?: ProviderRateSide;
}

export interface ProviderStatsParams {
  /** Fiat currency code, e.g. "NGN". Required. */
  currency: string;
  direction?: OrderDirection;
}

export interface ProviderStats {
  totalOrders: number;
  totalFiatVolume: string;
  totalCryptoVolume: string;
}

export interface ListProviderOrdersParams extends Pagination {
  /** Fiat currency code, e.g. "NGN". Required. */
  currency: string;
  status?: OrderStatus;
  /** Sort order. Defaults to "desc". */
  ordering?: "asc" | "desc";
  direction?: OrderDirection;
  /** Match by order ID, reference, or account identifier. */
  search?: string;
  /** Set to "csv" to export; requires `from` and `to`. */
  export?: "csv";
  /** YYYY-MM-DD; required with `export=csv`. */
  from?: string;
  /** YYYY-MM-DD; required with `export=csv`. */
  to?: string;
}
