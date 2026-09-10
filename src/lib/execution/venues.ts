import type { ExchangeAdapter } from "./adapter";
import { ExecutionError, type AccountSnapshot, type BalanceSnapshot, type NewOrderRequest, type OpenOrderSnapshot, type OrderBookSnapshot, type OrderReceipt, type PositionSnapshot, type ProtectiveOrderRequest, type SymbolInfo, type TickerSnapshot, type TradingMode, type VenueId } from "./types";
import { assertCanSubmit, LIVE_TRADING_HARD_DISABLED } from "./gate";

/**
 * Live venue adapters.
 * Private endpoints are stubs: they never sign, never send, never log secrets.
 */
class LockedVenueAdapter implements ExchangeAdapter {
  readonly venue: VenueId;
  readonly mode: TradingMode;
  constructor(venue: VenueId, mode: TradingMode) {
    this.venue = venue;
    this.mode = mode;
  }

  private refuse(op: string): never {
    assertCanSubmit(this.mode);
    throw new ExecutionError(
      "VENUE_LOCKED",
      `${this.venue} ${op} is not available. LIVE is hard-disabled (${LIVE_TRADING_HARD_DISABLED}). This adapter never loads API secrets.`,
    );
  }

  async getBalance(): Promise<BalanceSnapshot> {
    this.refuse("getBalance");
  }
  async getPositions(): Promise<PositionSnapshot[]> {
    this.refuse("getPositions");
  }
  async getOpenOrders(): Promise<OpenOrderSnapshot[]> {
    this.refuse("getOpenOrders");
  }
  async getTicker(symbol: string): Promise<TickerSnapshot> {
    throw new ExecutionError("PUBLIC_ONLY", `Use the market data layer for ${this.venue} ${symbol} public ticks.`);
  }
  async getOrderBook(symbol: string): Promise<OrderBookSnapshot> {
    throw new ExecutionError("PUBLIC_ONLY", `Use the market data layer for ${this.venue} ${symbol} books.`);
  }
  async getSymbolInfo(symbol: string): Promise<SymbolInfo> {
    return {
      symbol,
      base: symbol.replace(/USDT|USD|PERP/g, ""),
      quote: "USDT",
      tickSize: 0.1,
      stepSize: 0.001,
      minQty: 0.001,
      minNotional: 5,
      maxLeverage: 3,
      tradable: false,
    };
  }
  async placeOrder(_req: NewOrderRequest): Promise<OrderReceipt> {
    this.refuse("placeOrder");
  }
  async cancelOrder(): Promise<OrderReceipt> {
    this.refuse("cancelOrder");
  }
  async getOrderStatus(): Promise<OrderReceipt> {
    this.refuse("getOrderStatus");
  }
  async setLeverage(): Promise<void> {
    this.refuse("setLeverage");
  }
  async placeStopLoss(): Promise<OrderReceipt> {
    this.refuse("placeStopLoss");
  }
  async placeTakeProfit(): Promise<OrderReceipt> {
    this.refuse("placeTakeProfit");
  }
  async closePosition(): Promise<OrderReceipt> {
    this.refuse("closePosition");
  }
  async reconcileAccount(): Promise<AccountSnapshot> {
    this.refuse("reconcileAccount");
  }
  async disconnect(): Promise<void> {
    /* no sockets held */
  }
}

export class BinanceAdapter extends LockedVenueAdapter {
  constructor(mode: TradingMode) {
    super("binance", mode);
  }
}
export class BybitAdapter extends LockedVenueAdapter {
  constructor(mode: TradingMode) {
    super("bybit", mode);
  }
}
export class KrakenAdapter extends LockedVenueAdapter {
  constructor(mode: TradingMode) {
    super("kraken", mode);
  }
}
export class HyperliquidAdapter extends LockedVenueAdapter {
  constructor(mode: TradingMode) {
    super("hyperliquid", mode);
  }
}

export const LIVE_VENUES: VenueId[] = ["binance", "bybit", "kraken", "hyperliquid"];
