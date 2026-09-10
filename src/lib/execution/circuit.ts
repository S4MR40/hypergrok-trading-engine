import type { CircuitState } from "./types";

export interface CircuitInput {
  equity: number;
  sessionHigh: number;
  startingEquity: number;
  realizedPnl: number;
  openPositions: number;
  tradesToday: number;
  consecutiveLosses: number;
  killSwitch: boolean;
  safeMode: boolean;
  haltPct: number;
  maxOpen: number;
  maxTradesPerDay: number;
  maxConsecutiveLosses: number;
  maxLeverage: number;
  requestedLeverage: number;
  staleData: boolean;
  apiHealthy: boolean;
  reconOk: boolean;
  protectiveMissing: boolean;
}

export const DEFAULT_CIRCUIT = {
  haltPct: 0.1,
  maxOpen: 3,
  maxTradesPerDay: 8,
  maxConsecutiveLosses: 4,
  maxLeverage: 3,
};

export function evaluateCircuit(i: CircuitInput): CircuitState {
  const reasons: string[] = [];
  const drawdownPct = i.sessionHigh > 0 ? (i.sessionHigh - i.equity) / i.sessionHigh : 0;
  const dailyLossPct = i.startingEquity > 0 ? Math.max(0, -i.realizedPnl) / i.startingEquity : 0;

  if (i.killSwitch) reasons.push("Kill switch armed");
  if (i.safeMode) reasons.push("SAFE_MODE");
  if (drawdownPct >= i.haltPct) reasons.push(`Drawdown ${(drawdownPct * 100).toFixed(2)}% >= ${(i.haltPct * 100).toFixed(0)}%`);
  if (dailyLossPct >= i.haltPct) reasons.push(`Daily loss ${(dailyLossPct * 100).toFixed(2)}% >= halt`);
  if (i.openPositions >= i.maxOpen) reasons.push(`Open positions ${i.openPositions} >= ${i.maxOpen}`);
  if (i.tradesToday >= i.maxTradesPerDay) reasons.push(`Trades today ${i.tradesToday} >= ${i.maxTradesPerDay}`);
  if (i.consecutiveLosses >= i.maxConsecutiveLosses) reasons.push(`${i.consecutiveLosses} consecutive losses`);
  if (i.requestedLeverage > i.maxLeverage + 1e-9) reasons.push("Leverage cap");
  if (i.staleData) reasons.push("Stale market data");
  if (!i.apiHealthy) reasons.push("API unhealthy");
  if (!i.reconOk) reasons.push("RECONCILIATION_ERROR");
  if (i.protectiveMissing) reasons.push("Position without protective stop");

  return {
    tripped: reasons.length > 0,
    reasons,
    dailyLossPct,
    drawdownPct,
    openPositions: i.openPositions,
    tradesToday: i.tradesToday,
    consecutiveLosses: i.consecutiveLosses,
  };
}

export function canOpenRisk(state: CircuitState): { ok: boolean; reason: string | null } {
  if (!state.tripped) return { ok: true, reason: null };
  return { ok: false, reason: state.reasons[0] ?? "Circuit open" };
}
