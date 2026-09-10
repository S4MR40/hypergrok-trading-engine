export type Interval = "15m" | "1h" | "4h" | "1d";

export type Side = "LONG" | "SHORT";
export type Verdict = "LONG" | "SHORT" | "WAIT";
export type Regime = "TRENDING_BULLISH" | "TRENDING_BEARISH" | "RANGING" | "SQUEEZE";
export type StructureEvent =
  | "BOS_BULLISH"
  | "BOS_BEARISH"
  | "CHOCH_BULLISH"
  | "CHOCH_BEARISH"
  | "NONE";
export type Playbook = "TTFM_CONTINUATION" | "MMXM_REVERSAL" | "NONE";
export type TicketStatus =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "STALE"
  | "OPEN"
  | "CLOSED"
  | "CANCELLED";
export type CloseReason = "TP1" | "TP2" | "SL" | "MANUAL" | "CIRCUIT";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Swing {
  index: number;
  time: number;
  price: number;
  type: "H" | "L";
}

export interface Gap {
  type: "BULLISH" | "BEARISH";
  index: number;
  time: number;
  top: number;
  bottom: number;
  mid: number;
  mitigated: boolean;
}

export interface OrderBlock {
  type: "BULLISH" | "BEARISH";
  index: number;
  time: number;
  top: number;
  bottom: number;
}

export interface Sweep {
  type: "SSL" | "BSL";
  index: number;
  price: number;
  recovered: boolean;
}

export interface IndicatorSnapshot {
  ema9: number;
  ema21: number;
  ema50: number;
  ema200: number;
  rsi: number;
  atr: number;
  adx: number;
  plusDI: number;
  minusDI: number;
  macd: number;
  macdSignal: number;
  macdHist: number;
  bbUpper: number;
  bbMid: number;
  bbLower: number;
  bbWidthPct: number;
  vwap: number;
  volumeSma: number;
  volumeRatio: number;
}

export interface StructureSnapshot {
  event: StructureEvent;
  playbook: Playbook;
  swings: Swing[];
  lastSwingHigh: number | null;
  lastSwingLow: number | null;
  fvgs: Gap[];
  activeFvg: Gap | null;
  orderBlocks: OrderBlock[];
  activeOb: OrderBlock | null;
  sweep: Sweep | null;
  supportZone: [number, number] | null;
  resistanceZone: [number, number] | null;
}

export interface TimeframeSlice {
  interval: Interval;
  candles: Candle[];
  last: Candle;
  indicators: IndicatorSnapshot;
  structure: StructureSnapshot;
  bias: "BULLISH" | "BEARISH" | "NEUTRAL";
  regime: Regime;
}

export interface DerivativesContext {
  markPx: number;
  funding: number;
  openInterest: number;
  premium: number;
  dayNtlVlm: number;
  squeezeRisk: "LOW" | "MEDIUM" | "HIGH";
  fundingBias: "SUPPORTS_LONG" | "SUPPORTS_SHORT" | "NEUTRAL";
}

export interface TickerRow {
  symbol: string;
  coin: string;
  last: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  funding: number | null;
  openInterest: number | null;
}

export interface Expectancy {
  samples: number;
  wins: number;
  winRate: number;
  avgR: number;
  expectancyR: number;
}

export interface RiskPlan {
  entry: number;
  stop: number;
  tp1: number;
  tp2: number;
  riskPts: number;
  stressedRiskPts: number;
  rewardPts: number;
  rr: number;
  qty: number;
  notional: number;
  margin: number;
  leverage: number;
  riskUsd: number;
  liquidationPx: number;
  liqDistancePct: number;
  maxLeverage: number;
  pass: boolean;
  rejectReason: string | null;
}

export interface Setup {
  symbol: string;
  coin: string;
  verdict: Verdict;
  playbook: Playbook;
  regime: Regime;
  score: number;
  side: Side | null;
  mtf: {
    "1d": "BULLISH" | "BEARISH" | "NEUTRAL";
    "4h": "BULLISH" | "BEARISH" | "NEUTRAL";
    "1h": "BULLISH" | "BEARISH" | "NEUTRAL";
    "15m": "BULLISH" | "BEARISH" | "NEUTRAL";
  };
  structureEvent: StructureEvent;
  reasons: string[];
  risks: string[];
  risk: RiskPlan | null;
  expectancy: Expectancy;
  derivatives: DerivativesContext | null;
  slices: Record<Interval, TimeframeSlice>;
}

export interface AgentMessage {
  id: string;
  agentId: AgentId;
  ts: number;
  text: string;
  tone: "info" | "pass" | "fail" | "warn" | "exec";
}

export type AgentId =
  | "desk-lead"
  | "market"
  | "research"
  | "strategist"
  | "risk"
  | "reviewer"
  | "executioner";

export interface AgentDef {
  id: AgentId;
  callsign: string;
  name: string;
  role: string;
}

export const AGENTS: AgentDef[] = [
  { id: "desk-lead", callsign: "001", name: "Desk Lead", role: "Orchestrator" },
  { id: "market", callsign: "002", name: "Market Analyst", role: "SMC / ICT" },
  { id: "research", callsign: "003", name: "Research Analyst", role: "Context" },
  { id: "strategist", callsign: "004", name: "Strategist", role: "Architect" },
  { id: "risk", callsign: "005", name: "Risk Manager", role: "Capital" },
  { id: "reviewer", callsign: "006", name: "Trade Reviewer", role: "Guardrail" },
  { id: "executioner", callsign: "007", name: "Executioner", role: "Paper fill · no keys" },
];

export interface Ticket {
  id: string;
  createdAt: number;
  symbol: string;
  coin: string;
  side: Side;
  playbook: Playbook;
  score: number;
  entry: number;
  stop: number;
  tp1: number;
  tp2: number;
  qty: number;
  notional: number;
  margin: number;
  leverage: number;
  rr: number;
  riskUsd: number;
  liqDistancePct: number;
  reasons: string[];
  risks: string[];
  status: TicketStatus;
  venue: "paper" | "hyperliquid" | "binance" | "bybit" | "kraken";
  mode: "PAPER" | "DRY_RUN" | "LIVE";
  clientOrderId: string;
  mtf: Setup["mtf"];
  regime: Regime;
  explanation: string | null;
}

export interface Position {
  id: string;
  ticketId: string;
  symbol: string;
  coin: string;
  side: Side;
  qty: number;
  entry: number;
  stop: number;
  tp1: number;
  tp2: number;
  openedAt: number;
  feesPaid: number;
  margin: number;
  status: "OPEN" | "CLOSED";
  closedAt?: number;
  exitPx?: number;
  realizedPnl?: number;
  closeReason?: CloseReason;
}

export interface JournalEntry {
  id: string;
  ts: number;
  kind: "cycle" | "ticket" | "fill" | "close" | "halt" | "note";
  text: string;
}

export interface DeskSettings {
  startingEquity: number;
  maxRiskPct: number;
  maxLeverage: number;
  minRr: number;
  minScore: number;
  maxOpen: number;
  slippagePct: number;
  takerFee: number;
  dailyDrawdownHalt: number;
  strictness: "conservative" | "standard" | "aggressive";
  tradingMode: "PAPER" | "DRY_RUN";
  venue: "paper";
}

export const DEFAULT_SETTINGS: DeskSettings = {
  startingEquity: 10_000,
  maxRiskPct: 0.01,
  maxLeverage: 3,
  minRr: 2.5,
  minScore: 82,
  maxOpen: 3,
  slippagePct: 0.0008,
  takerFee: 0.0005,
  dailyDrawdownHalt: 0.1,
  strictness: "conservative",
  tradingMode: "PAPER",
  venue: "paper",
};

export const STRICTNESS: Record<
  DeskSettings["strictness"],
  { minScore: number; minRr: number; minWinRate: number }
> = {
  conservative: { minScore: 82, minRr: 2.5, minWinRate: 0.58 },
  standard: { minScore: 75, minRr: 2.0, minWinRate: 0.52 },
  aggressive: { minScore: 68, minRr: 1.6, minWinRate: 0.48 },
};
