import type { HttpClient } from "../http.js";
import type {
  Currency,
  Institution,
  RateParams,
  RatesResponse,
  Token,
  VerifyAccountParams,
} from "../types.js";

/** General/public endpoints: rates, currencies, institutions, tokens. */
export class GeneralResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Public exchange-rate quote. No API key required.
   * `GET /rates/{network}/{from}/{amount}/{to}`
   */
  getRates(params: RateParams): Promise<RatesResponse> {
    const { network, from, amount, to, side, providerId } = params;
    return this.http.request<RatesResponse>(
      `/rates/${network}/${from}/${amount}/${to}`,
      {
        auth: false,
        query: { side, provider_id: providerId },
      },
    );
  }

  /** Verify recipient account details. `POST /verify-account` */
  verifyAccount(params: VerifyAccountParams): Promise<string> {
    return this.http.request<string>("/verify-account", {
      method: "POST",
      body: params,
    });
  }

  /** List supported fiat currencies. `GET /currencies` */
  listCurrencies(): Promise<Currency[]> {
    return this.http.request<Currency[]>("/currencies", { auth: false });
  }

  /** List supported institutions for a currency. `GET /institutions/{currency_code}` */
  listInstitutions(currencyCode: string): Promise<Institution[]> {
    return this.http.request<Institution[]>(
      `/institutions/${currencyCode}`,
      { auth: false },
    );
  }

  /** List supported tokens and their contract addresses. `GET /tokens` */
  listTokens(): Promise<Token[]> {
    return this.http.request<Token[]>("/tokens", { auth: false });
  }

  /** Aggregator public key. `GET /pubkey` */
  getPublicKey(): Promise<string> {
    return this.http.request<string>("/pubkey", { auth: false });
  }
}
