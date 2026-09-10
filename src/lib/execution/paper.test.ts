import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PaperAdapter } from "./paper";
import { clientOrderId, ticketId } from "./ids";
import { evaluateCircuit } from "./circuit";
import { reconcile } from "./reconcile";
import { createAdapter } from "./router";
import { BinanceAdapter } from "./venues";
import { marketSafety } from "./market-safety";

describe("paper adapter", () => {
  it("fills once and replays idempotently", async () => {
    const paper = new PaperAdapter("PAPER", 10_000);
    paper.setMark("BTCUSDT", 100_000);
    const cid = clientOrderId(ticketId(1), "entry");
    const a = await paper.placeOrder({
      clientOrderId: cid,
      symbol: "BTCUSDT",
      side: "buy",
      type: "market",
      qty: 0.01,
    });
    const b = await paper.placeOrder({
      clientOrderId: cid,
      symbol: "BTCUSDT",
      side: "buy",
      type: "market",
      qty: 0.01,
    });
    assert.equal(a.status, "filled");
    assert.equal(a.filledQty, 0.01);
    assert.equal(a.avgFillPx, 100_000);
    assert.equal(b.venueOrderId, a.venueOrderId);
    assert.match(b.note ?? "", /idempotent/);
  });

  it("dry-run never fills", async () => {
    const paper = new PaperAdapter("DRY_RUN", 10_000);
    paper.setMark("ETHUSDT", 4000);
    const r = await paper.placeOrder({
      clientOrderId: "TICKET-20260910-000001-entry",
      symbol: "ETHUSDT",
      side: "sell",
      type: "market",
      qty: 1,
    });
    assert.equal(r.status, "dry_run");
    assert.equal(r.filledQty, 0);
  });

  it("queries unknown orders instead of resending", async () => {
    const paper = new PaperAdapter("PAPER", 10_000);
    const st = await paper.getOrderStatus({ clientOrderId: "missing" });
    assert.equal(st.status, "unknown");
  });
});

describe("circuit breaker", () => {
  it("trips on 10% drawdown independently of LLM", () => {
    const s = evaluateCircuit({
      equity: 8900,
      sessionHigh: 10_000,
      startingEquity: 10_000,
      realizedPnl: -1100,
      openPositions: 0,
      tradesToday: 0,
      consecutiveLosses: 0,
      killSwitch: false,
      safeMode: false,
      haltPct: 0.1,
      maxOpen: 3,
      maxTradesPerDay: 8,
      maxConsecutiveLosses: 4,
      maxLeverage: 3,
      requestedLeverage: 2,
      staleData: false,
      apiHealthy: true,
      reconOk: true,
      protectiveMissing: false,
    });
    assert.equal(s.tripped, true);
    assert.ok(s.reasons.some((r) => r.includes("Drawdown")));
  });
});

describe("router", () => {
  it("never returns a live-capable adapter", () => {
    const a = createAdapter("binance", "LIVE", 10_000);
    assert.equal(a.venue, "paper");
    assert.equal(a.mode, "PAPER");
  });

  it("binance stub refuses placeOrder", async () => {
    const b = new BinanceAdapter("PAPER");
    await assert.rejects(() =>
      b.placeOrder({
        clientOrderId: "x",
        symbol: "BTCUSDT",
        side: "buy",
        type: "market",
        qty: 1,
      }),
    );
  });
});

describe("reconcile", () => {
  it("flags quantity mismatch and does not overwrite", () => {
    const report = reconcile(
      { equity: 10_000, positions: [{ symbol: "BTCUSDT", side: "LONG", qty: 1, entry: 100 }], pendingClientOrderIds: [] },
      {
        venue: "paper",
        mode: "PAPER",
        balance: { venue: "paper", asset: "USDT", equity: 10_000, available: 10_000, marginUsed: 0, unrealisedPnl: 0, ts: 1 },
        positions: [{ venue: "paper", symbol: "BTCUSDT", side: "LONG", qty: 2, entry: 100, mark: 100, leverage: 1, unrealisedPnl: 0, stopId: null, takeId: null }],
        openOrders: [],
        ts: 1,
      },
    );
    assert.equal(report.ok, false);
    assert.ok(report.diffs.some((d) => d.field.includes("qty")));
  });
});

describe("market safety", () => {
  it("rejects stale ticks", () => {
    const r = marketSafety({
      ts: Date.now() - 60_000,
      maxAgeMs: 15_000,
      last: 100,
      connected: true,
      maxSpreadBps: 12,
    });
    assert.equal(r.ok, false);
  });
});
