import type {
  AccountSnapshot,
  BalanceSnapshot,
  NewOrderRequest,
  OpenOrderSnapshot,
  OrderBookSnapshot,
  OrderReceipt,
  PositionSnapshot,
  ProtectiveOrderRequest,
  SymbolInfo,
  TickerSnapshot,
  TradingMode,
  VenueId,
} from "./types";

/**
 * Unified exchange execution interface.
 * Strategy / LLM / agents must not call venue APIs.
 */
export interface ExchangeAdapter {
  readonly venue: VenueId;
  readonly mode: TradingMode;
  getBalance(): Promise<BalanceSnapshot>;
  getPositions(): Promise<PositionSnapshot[]>;
  getOpenOrders(): Promise<OpenOrderSnapshot[]>;
  getTicker(symbol: string): Promise<TickerSnapshot>;
  getOrderBook(symbol: string): Promise<OrderBookSnapshot>;
  getSymbolInfo(symbol: string): Promise<SymbolInfo>;
  placeOrder(req: NewOrderRequest): Promise<OrderReceipt>;
  cancelOrder(id: { venueOrderId?: string; clientOrderId?: string }): Promise<OrderReceipt>;
  getOrderStatus(id: { venueOrderId?: string; clientOrderId?: string }): Promise<OrderReceipt>;
  setLeverage(symbol: string, leverage: number): Promise<void>;
  placeStopLoss(req: ProtectiveOrderRequest): Promise<OrderReceipt>;
  placeTakeProfit(req: ProtectiveOrderRequest): Promise<OrderReceipt>;
  closePosition(symbol: string, clientOrderId: string): Promise<OrderReceipt>;
  reconcileAccount(): Promise<AccountSnapshot>;
  disconnect(): Promise<void>;
}
