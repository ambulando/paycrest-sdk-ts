import type { HttpClient } from "../http.js";
import type {
  ListProviderOrdersParams,
  PaginatedOrders,
  PaymentOrder,
  ProviderMarketRate,
  ProviderStats,
  ProviderStatsParams,
} from "../types.js";

/**
 * Provider API: manage orders assigned to the authenticated provider.
 * All endpoints require an API key.
 */
export class ProviderResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List orders assigned to the provider. `GET /provider/orders`
   * `currency` is required; supports filtering, pagination, and CSV export.
   */
  listOrders(params: ListProviderOrdersParams): Promise<PaginatedOrders> {
    return this.http.request<PaginatedOrders>("/provider/orders", {
      query: {
        currency: params.currency,
        page: params.page,
        pageSize: params.pageSize,
        status: params.status,
        ordering: params.ordering,
        direction: params.direction,
        search: params.search,
        export: params.export,
        from: params.from,
        to: params.to,
      },
    });
  }

  /** Retrieve a single assigned order by id. `GET /provider/orders/{id}` */
  getOrder(orderId: string): Promise<PaymentOrder> {
    return this.http.request<PaymentOrder>(`/provider/orders/${orderId}`);
  }

  /**
   * Market rate bands for a token/fiat corridor, including the provider's
   * position vs. the public benchmark. `GET /provider/rates/{token}/{fiat}`
   */
  getMarketRate(token: string, fiat: string): Promise<ProviderMarketRate> {
    return this.http.request<ProviderMarketRate>(
      `/provider/rates/${token}/${fiat}`,
    );
  }

  /**
   * Provider statistics for a currency. `GET /provider/stats`
   * `currency` is required.
   */
  getStats(params: ProviderStatsParams): Promise<ProviderStats> {
    return this.http.request<ProviderStats>("/provider/stats", {
      query: { currency: params.currency, direction: params.direction },
    });
  }

  /** Node information for the authenticated provider. `GET /provider/node-info` */
  getNodeInfo(): Promise<Record<string, unknown>> {
    return this.http.request<Record<string, unknown>>("/provider/node-info");
  }
}
