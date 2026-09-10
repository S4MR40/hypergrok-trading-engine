import type { ExchangeAdapter } from "./adapter";
import { PaperAdapter } from "./paper";
import { BinanceAdapter, BybitAdapter, HyperliquidAdapter, KrakenAdapter } from "./venues";
import { assertNotLive, sanitizeMode } from "./gate";
import { ExecutionError, type TradingMode, type VenueId } from "./types";
import { hasUnresolvedRisk } from "./reconcile";

export function createAdapter(venue: VenueId, mode: TradingMode, paperEquity: number): ExchangeAdapter {
  const safe = sanitizeMode(mode);
  assertNotLive(safe);
  if (safe === "LIVE") throw new ExecutionError("LIVE_LOCKED", "LIVE trading is hard-disabled.");
  if (venue === "paper" || safe === "PAPER") return new PaperAdapter(safe, paperEquity);
  if (safe === "DRY_RUN") {
    return new PaperAdapter("DRY_RUN", paperEquity);
  }
  throw new ExecutionError("VENUE_LOCKED", `${venue} execution is locked while LIVE is disabled.`);
}

export function venueAdapterStub(venue: VenueId, mode: TradingMode): ExchangeAdapter {
  assertNotLive(mode);
  switch (venue) {
    case "binance":
      return new BinanceAdapter(mode);
    case "bybit":
      return new BybitAdapter(mode);
    case "kraken":
      return new KrakenAdapter(mode);
    case "hyperliquid":
      return new HyperliquidAdapter(mode);
    default:
      return new PaperAdapter(mode, 0);
  }
}

export async function assertCanSwitchVenue(from: ExchangeAdapter): Promise<void> {
  const snap = await from.reconcileAccount();
  const risk = hasUnresolvedRisk(snap);
  if (!risk.ok) {
    throw new ExecutionError(
      "SWITCH_BLOCKED",
      `Cannot switch venue: ${risk.reason}. Flatten and cancel, persist state, then reconnect.`,
    );
  }
}
