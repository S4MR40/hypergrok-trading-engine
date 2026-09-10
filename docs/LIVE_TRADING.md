# Live trading (locked)

Status: **not enabled**. This document is the control-plane design so a future dedicated binary can be audited. It is not an activation guide.

## Modes

| Mode | Market data | Account reads | Orders |
|---|---|---|---|
| PAPER | public | simulated | simulated fills |
| DRY_RUN | public | refused without keys | logged, `status: dry_run` |
| LIVE | — | — | **hard-disabled** |

## Exchange interface

`ExchangeAdapter` exposes: `getBalance`, `getPositions`, `getOpenOrders`, `getTicker`, `getOrderBook`, `getSymbolInfo`, `placeOrder`, `cancelOrder`, `getOrderStatus`, `setLeverage`, `placeStopLoss`, `placeTakeProfit`, `closePosition`, `reconcileAccount`.

Venue adapters: `PaperAdapter`, `BinanceAdapter`, `BybitAdapter`, `KrakenAdapter`, `HyperliquidAdapter`.

Strategy remains venue-agnostic. `ACTIVE_EXCHANGE` would change only the adapter. Switching is blocked while any position or open order exists.

## Idempotency

Tickets use `TICKET-YYYYMMDD-NNNNNN`. Client order ids are `{ticket}-entry|sl|tp|close`. A second `placeOrder` with the same id returns the original receipt.

On timeout: query by client id. Only retry when the venue says **unknown** or **rejected**. Never on accepted / partial / filled.

## Protective orders

After a real fill (future binary): confirm qty + average price → place SL → confirm SL exists → place TP → confirm TP → mark ACTIVE. Missing stop → SAFE_MODE.

## Circuit breakers (LLM cannot override)

- 10% session drawdown (configurable)
- daily loss halt
- max open, max trades/day, consecutive losses
- leverage cap
- stale data, API health, reconciliation error, missing stop
- kill switch

## First live trade

If a future binary unlocks LIVE: restrict size and leverage, extra reconcile, record the full execution, do not scale automatically.
