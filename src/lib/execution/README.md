# Execution layer

`ExchangeAdapter` is the only code path allowed to talk to a venue.

- `PaperAdapter` — simulated fills, idempotent client order ids
- `DRY_RUN` — same ledger, `status: dry_run`, `filledQty = 0`
- Binance / Bybit / Kraken / Hyperliquid stubs — refuse private methods, never load secrets
- `LIVE_TRADING_HARD_DISABLED = true`

Do not import these adapters from strategy or agent modules. Go through `createAdapter`.
