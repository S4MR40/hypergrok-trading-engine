export interface MarketSafetyInput {
  ts: number;
  now?: number;
  maxAgeMs: number;
  last: number;
  bid?: number | null;
  ask?: number | null;
  maxSpreadBps: number;
  connected: boolean;
}

export function marketSafety(i: MarketSafetyInput): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const now = i.now ?? Date.now();
  if (!i.connected) reasons.push("Exchange disconnected");
  if (!Number.isFinite(i.last) || i.last <= 0) reasons.push("Invalid last price");
  if (now - i.ts > i.maxAgeMs) reasons.push("Stale timestamp");
  if (i.bid && i.ask && i.last) {
    const mid = (i.bid + i.ask) / 2;
    const spreadBps = ((i.ask - i.bid) / mid) * 10_000;
    if (spreadBps > i.maxSpreadBps) reasons.push(`Spread ${spreadBps.toFixed(1)} bps`);
  }
  return { ok: reasons.length === 0, reasons };
}
