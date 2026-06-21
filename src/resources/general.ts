import type { HttpClient } from "../http.js";
import type {
  Currency,
  Institution,
  ListTokensParams,
  MarketsResponse,
  RateParams,
  RatesResponse,
  ReindexResponse,
  Token,
  VerifyAccountParams,
} from "../types.js";

/** General/public endpoints: rates, markets, currencies, institutions, tokens. */
export class GeneralResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Public exchange-rate quote. No API key required.
   * `GET /rates/{network}/{from}/{amount}/{to}`
   */
  getRates(params: RateParams): Promise<RatesResponse> {
    const { network, from, amount, to, side, fromSource, toSource, providerId } =
      params;
    return this.http.request<RatesResponse>(
      `/rates/${network}/${from}/${amount}/${to}`,
      {
        auth: false,
        query: {
          side,
          from_source: fromSource,
          to_source: toSource,
          provider_id: providerId,
        },
      },
    );
  }

  /**
   * Live protocol orderbook plus network-wide aggregate stats.
   * No API key required. `GET /markets`
   */
  getMarkets(): Promise<MarketsResponse> {
    return this.http.request<MarketsResponse>("/markets", { auth: false });
  }

  /**
   * Resolve and verify recipient account details. `POST /verify-account`
   *
   * No API key required. Returns the resolved account holder name, or the
   * literal string `"OK"` when the account is valid but no name is available
   * for that corridor.
   *
   * For mobile-money institutions the API normalizes the identifier (strips
   * `+`, drops a leading `0`, prepends the country dial code). For KES
   * Till/Paybill identifiers, pass `metadata` (e.g. `{ channel: "Till" }`) to
   * bypass phone normalization.
   *
   * @param params.institution       Institution code (SWIFT, or a Paycrest code ending in `PC`).
   * @param params.accountIdentifier Bank account number, mobile MSISDN, Till/Paybill ID, etc.
   * @param params.metadata          Optional; required for KES Till/Paybill.
   */
  verifyAccount(params: VerifyAccountParams): Promise<string> {
    return this.http.request<string>("/verify-account", {
      method: "POST",
      auth: false,
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

  /**
   * List supported tokens and their contract addresses. `GET /tokens`
   * Optionally filter by `network`.
   */
  listTokens(params: ListTokensParams = {}): Promise<Token[]> {
    return this.http.request<Token[]>("/tokens", {
      auth: false,
      query: { network: params.network },
    });
  }

  /** Aggregator public key. `GET /pubkey` */
  getPublicKey(): Promise<string> {
    return this.http.request<string>("/pubkey", { auth: false });
  }

  /**
   * Reindex a transaction by hash or address on a given network.
   * `GET /reindex/{network}/{tx_hash_or_address}`
   */
  reindexTransaction(
    network: string,
    txHashOrAddress: string,
  ): Promise<ReindexResponse> {
    return this.http.request<ReindexResponse>(
      `/reindex/${network}/${txHashOrAddress}`,
      { auth: false },
    );
  }
}
