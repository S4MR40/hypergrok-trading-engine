# HyperGrok Trading Engine

Seven-agent crypto **paper** desk. Deterministic SMC/ICT structure, stressed-stop risk, human-in-the-loop tickets.

**LIVE trading is hard-disabled.** This repository will not send a real order.

Not financial advice. Capital at risk if you ever wire a different binary to an exchange — do not do that with this default build.

## What you get

- **001–007 orchestra** — Desk Lead, Market, Research, Strategist, Risk, Reviewer, Executioner
- **Confluence** — 1D/4H permission, 15m trigger, FVG/OB/sweep, analog win-rate, WAIT as the default
- **Risk** — 1% per trade, ≥2.5 R:R (conservative), 3x leverage cap, 10% drawdown circuit
- **Execution layer** — `ExchangeAdapter` + paper fills + dry-run receipts + locked Binance/Bybit/Kraken/Hyperliquid stubs
- **HITL** — tickets are `PENDING_APPROVAL` until you confirm the id
- **Idempotency** — `TICKET-YYYYMMDD-NNNNNN` client order ids, no blind resend

Inspired by the [galleonlabs/hypergrok-trading-desk](https://github.com/galleonlabs/hypergrok-trading-desk) operating model (MIT). Engine, scoring, and execution code here are original TypeScript.

## Quick start (tests, no keys)

```bash
npm install
npm test
```

Requires Node 22+.

## Modes

| Mode | Default | Orders |
|---|---|---|
| `PAPER` | yes | Simulated fills against live **public** marks |
| `DRY_RUN` | opt-in | Logs the intended order, `filledQty = 0` |
| `LIVE` | locked | Throws. Triple-flag + a dedicated binary would still be required |

## Safety constants

```ts
// src/lib/execution/gate.ts
export const LIVE_TRADING_HARD_DISABLED = true
```

`sanitizeMode("LIVE")` returns `"PAPER"`. Venue adapters never load API secrets.

## Layout

```
src/lib/engine/       indicators, structure, risk, pipeline
src/lib/execution/    adapter, paper, venues, gate, circuit, reconcile
agents/               001–007 role cards
docs/                 architecture, safety, live design, test plan
```

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Safety](docs/SAFETY.md)
- [Live trading (locked)](docs/LIVE_TRADING.md)
- [Test plan](docs/TEST_PLAN.md)

## License

MIT. See [LICENSE](LICENSE) and [SECURITY](SECURITY.md).
