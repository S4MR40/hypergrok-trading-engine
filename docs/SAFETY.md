# Safety

This engine is a **paper trading desk**. It is not a broker, not financial advice, and not a live execution bot.

## Hard rules

1. `LIVE_TRADING_HARD_DISABLED = true` in `src/lib/execution/gate.ts`.
2. `sanitizeMode("LIVE")` returns `"PAPER"`.
3. `assertCanSubmit("LIVE")` throws.
4. Binance / Bybit / Kraken / Hyperliquid adapters never load API secrets and never sign requests.
5. Confirming a ticket in the UI is a paper fill (or a dry-run log). It is not an exchange order.
6. Kill switch, 10% rolling drawdown, max 3 positions, max 3x leverage, 1% risk.

## What LIVE would still need (not in this build)

- `TRADING_MODE=LIVE` **and** `TRADING_ENABLED=true` **and** `LIVE_TRADING_CONFIRMATION=true`
- `FIRST_LIVE_TRADE` tiny size, no auto-scale
- Keys only in the executioner process, withdrawals disabled, never logged
- Native protective SL confirmed **before** a position is marked ACTIVE
- Continuous reconcile; mismatch → SAFE_MODE, do not blindly overwrite the exchange

Do not paste API keys into this app, this repo, or the dashboard.
