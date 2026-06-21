import type { HttpClient } from "../http.js";
import type {
  CreateOrderParams,
  ListOrdersParams,
  Order,
  PaginatedOrders,
} from "../types.js";

/** Sender API: create and track payment orders. */
export class SenderResource {
  constructor(private readonly http: HttpClient) {}

  /** Create a payment order. `POST /sender/orders` */
  createOrder(params: CreateOrderParams): Promise<Order> {
    return this.http.request<Order>("/sender/orders", {
      method: "POST",
      body: params,
    });
  }

  /** List orders with optional filtering and pagination. `GET /sender/orders` */
  listOrders(params: ListOrdersParams = {}): Promise<PaginatedOrders> {
    return this.http.request<PaginatedOrders>("/sender/orders", {
      query: {
        status: params.status,
        page: params.page,
        pageSize: params.pageSize,
      },
    });
  }

  /** Retrieve a single order by id. `GET /sender/orders/{id}` */
  getOrder(orderId: string): Promise<Order> {
    return this.http.request<Order>(`/sender/orders/${orderId}`);
  }

  /** Fetch sender statistics. `GET /sender/stats` */
  getStats(): Promise<Record<string, unknown>> {
    return this.http.request("/sender/stats");
  }
}
