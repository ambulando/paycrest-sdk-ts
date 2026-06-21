import { HttpClient, type HttpClientOptions } from "./http.js";
import { GeneralResource } from "./resources/general.js";
import { ProviderResource } from "./resources/provider.js";
import { SenderResource } from "./resources/sender.js";

export interface PaycrestClientOptions extends HttpClientOptions {
  /**
   * API secret, used for webhook signature verification. Not sent with
   * requests. See {@link constructEvent}.
   */
  apiSecret?: string;
}

/**
 * Entry point for the Paycrest SDK.
 *
 * @example
 * const client = new PaycrestClient({ apiKey: process.env.PAYCREST_API_KEY });
 * const order = await client.sender.createOrder({ ... });
 */
export class PaycrestClient {
  readonly sender: SenderResource;
  readonly provider: ProviderResource;
  readonly general: GeneralResource;
  readonly apiSecret?: string;

  private readonly http: HttpClient;

  constructor(options: PaycrestClientOptions = {}) {
    this.http = new HttpClient(options);
    this.apiSecret = options.apiSecret;
    this.sender = new SenderResource(this.http);
    this.provider = new ProviderResource(this.http);
    this.general = new GeneralResource(this.http);
  }
}
