# HyperGrok Trading Engine — Architecture

Seven-agent institutional desk. Analysis is deterministic. Execution is paper by default. LIVE is hard-disabled.

```
MARKET DATA (Hyperliquid public)
        |
        v
 DESK LEAD 001  -- orchestrates a cycle
        |
 MARKET 002  -- SMC/ICT structure (BOS/CHoCH, FVG, OB, SSL/BSL)
 RESEARCH 003  -- funding, OI, squeeze, analog replay
 STRATEGIST 004  -- playbook + parameters
 RISK 005  -- stressed-stop size, veto
 REVIEWER 006  -- confluence + HITL ticket
        |
 HUMAN CONFIRM  (explicit, per ticket id)
        |
 EXECUTIONER 007  -- ExchangeAdapter only
        |
 PAPER adapter (fills)  |  DRY_RUN (logs, no send)  |  LIVE (locked)
        |
 LIFECYCLE -- mark-to-market, native-style SL/TP sim, reconcile
```

## What must stay true

- Strategy never imports Binance / Bybit / Kraken / Hyperliquid private SDKs.
- The LLM never sizes quantity and never selects the venue.
- Risk Manager has veto. Circuit breakers are independent of the model.
- One ticket → one client order id → at-most-one fill.
- Timeout ≠ resend. Query status first.
- LIVE requires three flags **and** `LIVE_TRADING_HARD_DISABLED = false` in a dedicated binary. This repository ships with the constant `true`.

## Modules

| Path | Role |
|---|---|
| `src/lib/engine/indicators.ts` | RSI, EMA, ATR, ADX, MACD, BB, VWAP |
| `src/lib/engine/structure.ts` | Swings, FVG, order blocks, sweeps, expectancy |
| `src/lib/engine/risk.ts` | Stressed-stop plan, 1% risk, 3x lev cap |
| `src/lib/engine/pipeline.ts` | MTF permission, score, WAIT default, tickets |
| `src/lib/execution/adapter.ts` | Unified venue interface |
| `src/lib/execution/paper.ts` | In-memory fills + idempotency |
| `src/lib/execution/venues.ts` | Binance/Bybit/Kraken/HL stubs that refuse private calls |
| `src/lib/execution/gate.ts` | LIVE lock |
| `src/lib/execution/circuit.ts` | Drawdown / daily loss / stale / recon breakers |
| `src/lib/execution/reconcile.ts` | Local vs venue diff, never overwrite venue |

## Scoring (conservative)

WAIT unless 1D/4H permission, 15m trigger, score ≥ 82, stressed R:R ≥ 2.5, analog win-rate floor when sample ≥ 8.

## Position sizing

```
qty = (equity × risk%) / (|entry−stop| + slippage + round-trip fees)
notional = min(qty × entry, equity × maxLeverage)
```

LIVE mode, if ever unlocked in a different binary, must size from **exchange equity**, not the $10,000 paper number.
