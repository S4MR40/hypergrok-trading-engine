/** Persistent client order / ticket identifiers. Never recycle. */

export function padSeq(n: number, width = 6): string {
  return String(Math.max(0, Math.floor(n))).padStart(width, "0");
}

export function utcStamp(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function ticketId(seq: number, d = new Date()): string {
  return `TICKET-${utcStamp(d)}-${padSeq(seq, 6)}`;
}

export function clientOrderId(ticketIdValue: string, intent: "entry" | "sl" | "tp" | "close" = "entry"): string {
  const base = ticketIdValue.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 28);
  return `${base}-${intent}`.slice(0, 36);
}

export function parseTicketId(id: string): { day: string; seq: number } | null {
  const m = /^TICKET-(\d{8})-(\d{6})$/.exec(id) ?? /^HG-(\d{8})-(\d{2,6})$/.exec(id);
  if (!m) return null;
  return { day: m[1]!, seq: Number(m[2]) };
}
