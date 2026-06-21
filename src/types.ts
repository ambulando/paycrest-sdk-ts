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

export interface Rate {
  rate: string;
}

export interface RatesResponse {
  buy?: Rate;
  sell?: Rate;
}

export interface RateParams {
  network: string;
  /** Token symbol being sold, e.g. "USDT". */
  from: string;
  /** Amount, as a decimal string. */
  amount: string;
  /** Fiat currency code, e.g. "NGN". */
  to: string;
  side?: "buy" | "sell";
  providerId?: string;
}

export interface Currency {
  code: string;
  name: string;
  shortName?: string;
  symbol?: string;
}

export interface Institution {
  name: string;
  code: string;
  type?: string;
}

export interface Token {
  symbol: string;
  contractAddress: string;
  network: string;
  decimals: number;
}
