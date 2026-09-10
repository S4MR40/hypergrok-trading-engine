/**
 * Venue-agnostic execution types.
 * Strategy and agents must never import an exchange SDK.
 */

export type TradingMode = "PAPER" | "DRY_RUN" | "LIVE";
export type VenueId = "paper" | "hyperliquid" | "binance" | "bybit" | "kraken";
export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit";
export type OrderStatus =
  | "rejected"
  | "accepted"
  | "partially_filled"
  | "filled"
  | "cancelled"
  | "unknown"
  | "dry_run"
  | "not_sent";

export interface LiveFlags {
  TRADING_MODE: TradingMode;
  TRADING_ENABLED: boolean;
  LIVE_TRADING_CONFIRMATION: boolean;
  FIRST_LIVE_TRADE: boolean;
}

export interface SymbolInfo {
  symbol: string;
  base: string;
  quote: string;
  tickSize: number;
  stepSize: number;
  minQty: number;
  minNotional: number;
  maxLeverage: number;
  tradable: boolean;
}

export interface BalanceSnapshot {
  venue: VenueId;
  asset: string;
  equity: number;
  available: number;
  marginUsed: number;
  unrealisedPnl: number;
  ts: number;
}

export interface PositionSnapshot {
  venue: VenueId;
  symbol: string;
  side: "LONG" | "SHORT";
  qty: number;
  entry: number;
  mark: number;
  leverage: number;
  unrealisedPnl: number;
  stopId: string | null;
  takeId: string | null;
}

export interface OpenOrderSnapshot {
  venue: VenueId;
  id: string;
  clientOrderId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  price: number | null;
  status: OrderStatus;
  reduceOnly: boolean;
}

export interface TickerSnapshot {
  symbol: string;
  last: number;
  bid: number | null;
  ask: number | null;
  ts: number;
}

export interface OrderBookSnapshot {
  symbol: string;
  bids: [number, number][];
  asks: [number, number][];
  ts: number;
}

export interface NewOrderRequest {
  clientOrderId: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  price?: number;
  reduceOnly?: boolean;
  timeInForce?: "GTC" | "IOC" | "ALO";
}

export interface OrderReceipt {
  clientOrderId: string;
  venueOrderId: string | null;
  status: OrderStatus;
  requestedQty: number;
  filledQty: number;
  avgFillPx: number | null;
  fees: number;
  ts: number;
  raw?: unknown;
  note?: string;
}

export interface ProtectiveOrderRequest {
  clientOrderId: string;
  symbol: string;
  side: OrderSide;
  qty: number;
  stopPrice: number;
  kind: "stop_loss" | "take_profit";
}

export interface AccountSnapshot {
  venue: VenueId;
  mode: TradingMode;
  balance: BalanceSnapshot;
  positions: PositionSnapshot[];
  openOrders: OpenOrderSnapshot[];
  ts: number;
}

export interface ReconcileDiff {
  field: string;
  local: unknown;
  venue: unknown;
}

export interface ReconcileReport {
  ok: boolean;
  diffs: ReconcileDiff[];
  ts: number;
  error?: string;
}

export interface CircuitState {
  tripped: boolean;
  reasons: string[];
  dailyLossPct: number;
  drawdownPct: number;
  openPositions: number;
  tradesToday: number;
  consecutiveLosses: number;
}

export class ExecutionError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ExecutionError";
    this.code = code;
  }
}

export const DEFAULT_LIVE_FLAGS: LiveFlags = {
  TRADING_MODE: "PAPER",
  TRADING_ENABLED: false,
  LIVE_TRADING_CONFIRMATION: false,
  FIRST_LIVE_TRADE: true,
};
