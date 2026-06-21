import type { HttpClient } from "../http.js";
import type {
  CreateOrderParams,
  CreateOrderResponse,
  ListOrdersParams,
  ListWebhookDeliveriesParams,
  LockOrderStatus,
  PaginatedOrders,
  PaginatedWebhookDeliveries,
  PaymentOrder,
  SenderStats,
  SenderStatsParams,
  WebhookDelivery,
  WebhookRetryQueued,
  WebhookRetryResult,
} from "../types.js";

/** Sender API: create and track payment orders, and manage webhook deliveries. */
export class SenderResource {
  constructor(private readonly http: HttpClient) {}

  /** Create a payment order. `POST /sender/orders` */
  createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
    return this.http.request<CreateOrderResponse>("/sender/orders", {
      method: "POST",
      body: params,
    });
  }

  /** List orders with optional filtering and pagination. `GET /sender/orders` */
  listOrders(params: ListOrdersParams = {}): Promise<PaginatedOrders> {
    return this.http.request<PaginatedOrders>("/sender/orders", {
      query: {
        status: params.status,
        direction: params.direction,
        page: params.page,
        pageSize: params.pageSize,
      },
    });
  }

  /** Retrieve a single order by id. `GET /sender/orders/{id}` */
  getOrder(orderId: string): Promise<PaymentOrder> {
    return this.http.request<PaymentOrder>(`/sender/orders/${orderId}`);
  }

  /** Fetch sender statistics. `GET /sender/stats` */
  getStats(params: SenderStatsParams = {}): Promise<SenderStats> {
    return this.http.request<SenderStats>("/sender/stats", {
      query: { direction: params.direction },
    });
  }

  /**
   * Get an order's status by its onchain Gateway ID. No API key required.
   * Use this for smart-contract integrations. `GET /orders/{chain_id}/{id}`
   */
  getOrderStatusByGatewayId(
    chainId: string | number,
    orderId: string,
  ): Promise<LockOrderStatus> {
    return this.http.request<LockOrderStatus>(
      `/orders/${chainId}/${orderId}`,
      { auth: false },
    );
  }

  /** List webhook deliveries, newest first. `GET /sender/webhooks` */
  listWebhookDeliveries(
    params: ListWebhookDeliveriesParams = {},
  ): Promise<PaginatedWebhookDeliveries> {
    return this.http.request<PaginatedWebhookDeliveries>("/sender/webhooks", {
      query: {
        status: params.status,
        event: params.event,
        event_id: params.eventId,
        order_id: params.orderId,
        from: params.from,
        to: params.to,
        page: params.page,
        pageSize: params.pageSize,
      },
    });
  }

  /**
   * Get a single webhook delivery, including the frozen `requestPayload` and
   * captured `responseBody`. `GET /sender/webhooks/{id}`
   */
  getWebhookDelivery(deliveryId: string): Promise<WebhookDelivery> {
    return this.http.request<WebhookDelivery>(
      `/sender/webhooks/${deliveryId}`,
    );
  }

  /**
   * Replay a webhook delivery using its original frozen payload.
   * `POST /sender/webhooks/{id}/retry`
   *
   * With `sync: true` the replay runs immediately and the result is returned
   * inline ({@link WebhookRetryResult}); otherwise it is queued and an
   * acknowledgement ({@link WebhookRetryQueued}) is returned.
   */
  retryWebhookDelivery(
    deliveryId: string,
    options: { sync?: boolean } = {},
  ): Promise<WebhookRetryResult | WebhookRetryQueued> {
    return this.http.request<WebhookRetryResult | WebhookRetryQueued>(
      `/sender/webhooks/${deliveryId}/retry`,
      {
        method: "POST",
        query: { sync: options.sync ? "true" : undefined },
      },
    );
  }
}
