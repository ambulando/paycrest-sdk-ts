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

/**
 * Order lifecycle status. Webhook events are emitted as
 * `payment_order.<status>`.
 */
export type OrderStatus =
  | "initiated"
  | "deposited"
  | "pending"
  | "validated"
  | "settling"
  | "settled"
  | "refunding"
  | "refunded"
  | "expired";

/** Source/destination leg of an order. */
export interface OrderEndpoint {
  type: OrderType;
  /** 3-letter ISO currency code (fiat) or token symbol (crypto). */
  currency: string;
  /** Blockchain network, e.g. "base", "polygon" (crypto legs). */
  network?: string;
  /** Recipient address (crypto destination). */
  address?: string;
  /** Recipient details (fiat destination). */
  recipient?: Recipient;
  /** Refund address (crypto source). */
  refundAddress?: string;
  /** Refund account (fiat source). */
  refundAccount?: string;
}

export interface Recipient {
  institution: string;
  accountIdentifier: string;
  accountName: string;
  memo?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateOrderParams {
  /** Payment quantity, as a decimal string. */
  amount: string;
  /** Whether `amount` is denominated in crypto (default) or fiat. */
  amountIn?: AmountIn;
  source: OrderEndpoint;
  destination: OrderEndpoint;
  /** Exchange rate (fiat per crypto token), as a decimal string. */
  rate?: string;
  /** Sender fee percent, as a decimal string. */
  senderFeePercent?: string;
  /** Your internal order identifier. */
  reference?: string;
}

export interface ProviderAccount {
  receiveAddress?: string;
  accountIdentifier?: string;
  accountName?: string;
  /** ISO-8601 timestamp after which the account is no longer valid. */
  validUntil?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  amount: string;
  rate?: string;
  senderFee?: string;
  transactionFee?: string;
  reference?: string;
  source: OrderEndpoint;
  destination: OrderEndpoint;
  providerAccount?: ProviderAccount;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListOrdersParams extends Pagination {
  status?: OrderStatus;
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
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
  /** ISO-8601 generation timestamp. */
  asOf: string;
  aggregates: MarketAggregates;
  book: MarketBookEntry[];
}

export interface ReindexResponse {
  events: Record<string, unknown>;
}

// --- Provider API ---

export type OrderDirection = "offramp" | "onramp";

export type ProviderOrderType = "regular" | "otc";

/** Provider-side order lifecycle status (wider than the sender's). */
export type ProviderOrderStatus =
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

/** A provider order as returned by the provider endpoints. */
export interface ProviderOrder {
  id: string;
  status: ProviderOrderStatus;
  orderType: ProviderOrderType;
  direction: OrderDirection;
  createdAt: string;
  updatedAt: string;
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
  status?: ProviderOrderStatus;
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

export interface PaginatedProviderOrders {
  total: number;
  page: number;
  pageSize: number;
  orders: ProviderOrder[];
}
