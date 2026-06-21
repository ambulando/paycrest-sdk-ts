import {
  PaycrestApiError,
  PaycrestError,
  PaycrestRateLimitError,
} from "./errors.js";
import type { ApiErrorResponse, ApiResponse } from "./types.js";

export interface HttpClientOptions {
  /** Sender API key. Sent as the `API-Key` header. */
  apiKey?: string;
  /** Base URL. Defaults to `https://api.paycrest.io/v2`. */
  baseUrl?: string;
  /** Custom fetch implementation (defaults to global `fetch`). */
  fetch?: typeof fetch;
  /** Per-request timeout in ms. Defaults to 30000. */
  timeoutMs?: number;
}

export interface RequestOptions {
  method?: string;
  /** Query params; `undefined` values are dropped. */
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  /** Set false for public endpoints that need no API key (e.g. rates). */
  auth?: boolean;
}

const DEFAULT_BASE_URL = "https://api.paycrest.io/v2";

export class HttpClient {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: HttpClientOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 30_000;

    if (!this.fetchImpl) {
      throw new PaycrestError(
        "No fetch implementation available. Pass `fetch` in the client options.",
      );
    }
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", query, body, auth = true } = options;

    if (auth && !this.apiKey) {
      throw new PaycrestError(
        "This endpoint requires an API key. Set `apiKey` when constructing the client.",
      );
    }

    const url = new URL(this.baseUrl + path);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (auth && this.apiKey) headers["API-Key"] = this.apiKey;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await this.fetchImpl(url.toString(), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new PaycrestError(`Request to ${path} timed out`);
      }
      throw new PaycrestError(
        `Network error calling ${path}: ${(err as Error).message}`,
      );
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    const parsed = text ? safeJsonParse(text) : undefined;

    if (!response.ok) {
      const errorBody = (parsed as ApiErrorResponse | undefined) ?? text;
      if (response.status === 429) throw new PaycrestRateLimitError(errorBody);
      throw new PaycrestApiError(response.status, errorBody);
    }

    // Successful responses are wrapped in { status, message, data }.
    if (parsed && typeof parsed === "object" && "data" in parsed) {
      return (parsed as ApiResponse<T>).data;
    }
    return parsed as T;
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
