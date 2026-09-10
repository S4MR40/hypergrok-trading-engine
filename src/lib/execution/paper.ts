import type { ExchangeAdapter } from "./adapter";
import { assertCanSubmit } from "./gate";
import { ExecutionError, type AccountSnapshot, type BalanceSnapshot, type NewOrderRequest, type OpenOrderSnapshot, type OrderBookSnapshot, type OrderReceipt, type PositionSnapshot, type ProtectiveOrderRequest, type SymbolInfo, type TickerSnapshot, type TradingMode } from "./types";

interface PaperFill {
  clientOrderId: string;
  venueOrderId: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  px: number;
  fees: number;
  ts: number;
  status: OrderReceipt["status"];
  reduceOnly: boolean;
  kind: "entry" | "sl" | "tp" | "close" | "cancel";
}

export interface PaperBook {
  equity: number;
  available: number;
  positions: PositionSnapshot[];
  orders: PaperFill[];
  marks: Record<string, number>;
}

function receipt(fill: PaperFill, extra?: Partial<OrderReceipt>): OrderReceipt {
  return {
    clientOrderId: fill.clientOrderId,
    venueOrderId: fill.venueOrderId,
    status: fill.status,
    requestedQty: fill.qty,
    filledQty: fill.status === "filled" ? fill.qty : 0,
    avgFillPx: fill.status === "filled" ? fill.px : null,
    fees: fill.fees,
    ts: fill.ts,
    note: extra?.note,
  };
}

export class PaperAdapter implements ExchangeAdapter {
  readonly venue = "paper" as const;
  readonly mode: TradingMode;
  private seq = 1;
  private readonly seen = new Map<string, PaperFill>();
  book: PaperBook;

  constructor(mode: TradingMode, startingEquity: number) {
    this.mode = mode;
    this.book = {
      equity: startingEquity,
      available: startingEquity,
      positions: [],
      orders: [],
      marks: {},
    };
  }

  setMark(symbol: string, px: number) {
    this.book.marks[symbol] = px;
  }

  private lookup(id: { venueOrderId?: string; clientOrderId?: string }): PaperFill | undefined {
    if (id.clientOrderId) {
      const hit = this.seen.get(id.clientOrderId);
      if (hit) return hit;
    }
    if (id.venueOrderId) return this.book.orders.find((o) => o.venueOrderId === id.venueOrderId);
    return undefined;
  }

  async getBalance(): Promise<BalanceSnapshot> {
    return {
      venue: "paper",
      asset: "USDT",
      equity: this.book.equity,
      available: this.book.available,
      marginUsed: Math.max(0, this.book.equity - this.book.available),
      unrealisedPnl: 0,
      ts: Date.now(),
    };
  }

  async getPositions(): Promise<PositionSnapshot[]> {
    return this.book.positions.map((p) => ({ ...p }));
  }

  async getOpenOrders(): Promise<OpenOrderSnapshot[]> {
    return this.book.orders
      .filter((o) => o.status === "accepted")
      .map((o) => ({
        venue: "paper" as const,
        id: o.venueOrderId,
        clientOrderId: o.clientOrderId,
        symbol: o.symbol,
        side: o.side,
        type: "market" as const,
        qty: o.qty,
        price: o.px,
        status: o.status,
        reduceOnly: o.reduceOnly,
      }));
  }

  async getTicker(symbol: string): Promise<TickerSnapshot> {
    const last = this.book.marks[symbol];
    if (!Number.isFinite(last)) throw new ExecutionError("NO_TICKER", `No paper mark for ${symbol}`);
    return { symbol, last, bid: last * 0.9999, ask: last * 1.0001, ts: Date.now() };
  }

  async getOrderBook(symbol: string): Promise<OrderBookSnapshot> {
    const t = await this.getTicker(symbol);
    return {
      symbol,
      bids: [[t.bid ?? t.last, 1]],
      asks: [[t.ask ?? t.last, 1]],
      ts: t.ts,
    };
  }

  async getSymbolInfo(symbol: string): Promise<SymbolInfo> {
    return {
      symbol,
      base: symbol.replace("USDT", ""),
      quote: "USDT",
      tickSize: 0.1,
      stepSize: 0.0001,
      minQty: 0.0001,
      minNotional: 10,
      maxLeverage: 3,
      tradable: true,
    };
  }

  async placeOrder(req: NewOrderRequest): Promise<OrderReceipt> {
    assertCanSubmit(this.mode);
    const existing = this.seen.get(req.clientOrderId);
    if (existing) return receipt(existing, { note: "idempotent replay — original fill returned" });

    if (this.mode === "DRY_RUN") {
      const fill: PaperFill = {
        clientOrderId: req.clientOrderId,
        venueOrderId: `DRY-${this.seq++}`,
        symbol: req.symbol,
        side: req.side,
        qty: req.qty,
        px: req.price ?? this.book.marks[req.symbol] ?? 0,
        fees: 0,
        ts: Date.now(),
        status: "dry_run",
        reduceOnly: !!req.reduceOnly,
        kind: "entry",
      };
      this.seen.set(req.clientOrderId, fill);
      this.book.orders.push(fill);
      return receipt(fill, { note: "DRY_RUN — order was not sent" });
    }

    const px = req.price ?? this.book.marks[req.symbol];
    if (!Number.isFinite(px) || (px ?? 0) <= 0) {
      throw new ExecutionError("NO_PRICE", `Cannot paper-fill ${req.symbol} without a mark`);
    }
    const fee = Math.abs((px as number) * req.qty) * 0.0005;
    const fill: PaperFill = {
      clientOrderId: req.clientOrderId,
      venueOrderId: `PAPER-${this.seq++}`,
      symbol: req.symbol,
      side: req.side,
      qty: req.qty,
      px: px as number,
      fees: fee,
      ts: Date.now(),
      status: "filled",
      reduceOnly: !!req.reduceOnly,
      kind: req.reduceOnly ? "close" : "entry",
    };
    this.seen.set(req.clientOrderId, fill);
    this.book.orders.push(fill);
    return receipt(fill);
  }

  async cancelOrder(id: { venueOrderId?: string; clientOrderId?: string }): Promise<OrderReceipt> {
    const hit = this.lookup(id);
    if (!hit) throw new ExecutionError("NOT_FOUND", "Order not found — refusing blind resend");
    if (hit.status === "filled") return receipt(hit, { note: "already filled; cancel is a no-op" });
    hit.status = "cancelled";
    return receipt(hit);
  }

  async getOrderStatus(id: { venueOrderId?: string; clientOrderId?: string }): Promise<OrderReceipt> {
    const hit = this.lookup(id);
    if (!hit) {
      return {
        clientOrderId: id.clientOrderId ?? "",
        venueOrderId: id.venueOrderId ?? null,
        status: "unknown",
        requestedQty: 0,
        filledQty: 0,
        avgFillPx: null,
        fees: 0,
        ts: Date.now(),
        note: "Query before retry. Do not resend.",
      };
    }
    return receipt(hit);
  }

  async setLeverage(_symbol: string, leverage: number): Promise<void> {
    if (leverage > 3) throw new ExecutionError("LEV_CAP", "Paper leverage cap is 3x");
  }

  async placeStopLoss(req: ProtectiveOrderRequest): Promise<OrderReceipt> {
    return this.placeOrder({
      clientOrderId: req.clientOrderId,
      symbol: req.symbol,
      side: req.side,
      type: "limit",
      qty: req.qty,
      price: req.stopPrice,
      reduceOnly: true,
    });
  }

  async placeTakeProfit(req: ProtectiveOrderRequest): Promise<OrderReceipt> {
    return this.placeStopLoss(req);
  }

  async closePosition(symbol: string, clientOrderId: string): Promise<OrderReceipt> {
    const pos = this.book.positions.find((p) => p.symbol === symbol);
    if (!pos) throw new ExecutionError("NO_POS", `No paper position in ${symbol}`);
    return this.placeOrder({
      clientOrderId,
      symbol,
      side: pos.side === "LONG" ? "sell" : "buy",
      type: "market",
      qty: pos.qty,
      reduceOnly: true,
    });
  }

  async reconcileAccount(): Promise<AccountSnapshot> {
    return {
      venue: "paper",
      mode: this.mode,
      balance: await this.getBalance(),
      positions: await this.getPositions(),
      openOrders: await this.getOpenOrders(),
      ts: Date.now(),
    };
  }

  async disconnect(): Promise<void> {
    /* in-memory */
  }
}
