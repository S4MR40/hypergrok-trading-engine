import type { AccountSnapshot, PositionSnapshot, ReconcileDiff, ReconcileReport } from "./types";

export interface LocalBook {
  equity: number;
  positions: Array<Pick<PositionSnapshot, "symbol" | "side" | "qty" | "entry">>;
  pendingClientOrderIds: string[];
}

function close(a: number, b: number, tol = 1e-8): boolean {
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
}

export function reconcile(local: LocalBook, venue: AccountSnapshot): ReconcileReport {
  const diffs: ReconcileDiff[] = [];
  if (!close(local.equity, venue.balance.equity, 0.02)) {
    diffs.push({ field: "equity", local: local.equity, venue: venue.balance.equity });
  }
  const venueKeys = new Set(venue.positions.map((p) => `${p.symbol}:${p.side}`));
  const localKeys = new Set(local.positions.map((p) => `${p.symbol}:${p.side}`));
  for (const p of local.positions) {
    const key = `${p.symbol}:${p.side}`;
    const vp = venue.positions.find((x) => x.symbol === p.symbol && x.side === p.side);
    if (!vp) diffs.push({ field: `position.missing_on_venue:${key}`, local: p.qty, venue: 0 });
    else {
      if (!close(p.qty, vp.qty, 1e-6)) diffs.push({ field: `position.qty:${key}`, local: p.qty, venue: vp.qty });
      if (!close(p.entry, vp.entry, 1e-4)) diffs.push({ field: `position.entry:${key}`, local: p.entry, venue: vp.entry });
    }
  }
  for (const key of venueKeys) {
    if (!localKeys.has(key)) diffs.push({ field: `position.missing_local:${key}`, local: 0, venue: 1 });
  }
  return { ok: diffs.length === 0, diffs, ts: Date.now() };
}

export function hasUnresolvedRisk(venue: AccountSnapshot): { ok: boolean; reason: string | null } {
  if (venue.positions.length) return { ok: false, reason: `${venue.positions.length} open position(s)` };
  if (venue.openOrders.length) return { ok: false, reason: `${venue.openOrders.length} open order(s)` };
  return { ok: true, reason: null };
}
