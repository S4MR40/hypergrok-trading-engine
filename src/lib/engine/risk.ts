import type { DeskSettings, RiskPlan, Side } from "./types";

export interface SizeInput {
  side: Side;
  entry: number;
  stop: number;
  tp1: number;
  tp2: number;
  equity: number;
  settings: DeskSettings;
}

export function stressedStopPlan(input: SizeInput): RiskPlan {
  const { side, entry, stop, tp1, tp2, equity, settings } = input;
  const rawPts = Math.abs(entry - stop);
  const slip = stop * settings.slippagePct;
  const fees = entry * settings.takerFee + stop * settings.takerFee;
  const stressedRiskPts = rawPts + slip + fees;
  const rewardPts = Math.abs(tp1 - entry);
  const rr = stressedRiskPts > 0 ? rewardPts / stressedRiskPts : 0;
  const riskUsd = equity * settings.maxRiskPct;
  const rawQty = stressedRiskPts > 0 ? riskUsd / stressedRiskPts : 0;
  const rawNotional = rawQty * entry;
  const maxNotional = equity * settings.maxLeverage;
  const cappedNotional = Math.min(rawNotional, maxNotional);
  const cappedQty = entry > 0 ? cappedNotional / entry : 0;
  const margin = Math.min(cappedNotional / Math.max(settings.maxLeverage, 1), equity * 0.2);
  const leverage = margin > 0 ? cappedNotional / margin : 0;

  const mmr = 0.04;
  const liq =
    side === "LONG"
      ? entry * (1 - (1 / Math.max(leverage, 1) - mmr))
      : entry * (1 + (1 / Math.max(leverage, 1) - mmr));
  const liqDistancePct = entry > 0 ? Math.abs(entry - liq) / entry : 0;

  let pass = true;
  let rejectReason: string | null = null;
  if (stressedRiskPts <= 0) {
    pass = false;
    rejectReason = "Zero risk distance";
  } else if (rr < settings.minRr) {
    pass = false;
    rejectReason = `R:R ${rr.toFixed(2)} below ${settings.minRr.toFixed(2)}`;
  } else if (rawPts / entry < 0.0012) {
    pass = false;
    rejectReason = "Stop too tight versus noise";
  } else if (rawPts / entry > 0.035) {
    pass = false;
    rejectReason = "Stop wider than 3.5% — size would be dust";
  } else if (cappedQty <= 0) {
    pass = false;
    rejectReason = "Qty rounded to zero";
  } else if (leverage > settings.maxLeverage + 1e-6) {
    pass = false;
    rejectReason = "Leverage cap breached";
  } else if (liqDistancePct < (rawPts / entry) * 1.4) {
    pass = false;
    rejectReason = "Liquidation sits inside the stop";
  } else if (side === "LONG" && stop >= entry) {
    pass = false;
    rejectReason = "Long stop must sit below entry";
  } else if (side === "SHORT" && stop <= entry) {
    pass = false;
    rejectReason = "Short stop must sit above entry";
  }

  return {
    entry,
    stop,
    tp1,
    tp2,
    riskPts: rawPts,
    stressedRiskPts,
    rewardPts,
    rr,
    qty: cappedQty,
    notional: cappedNotional,
    margin,
    leverage,
    riskUsd,
    liquidationPx: liq,
    liqDistancePct,
    maxLeverage: settings.maxLeverage,
    pass,
    rejectReason,
  };
}

export function circuitTripped(equity: number, sessionHigh: number, haltPct: number): boolean {
  if (sessionHigh <= 0) return false;
  return (sessionHigh - equity) / sessionHigh >= haltPct;
}
