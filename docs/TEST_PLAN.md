# Test plan

Covered by `npm test` (no network, no keys):

1. Paper fill
2. Dry-run does not fill
3. Idempotent client order id
4. Unknown order queried, not resent
5. LIVE submit throws
6. LIVE flags cannot sneak through PAPER
7. `sanitizeMode("LIVE") === "PAPER"`
8. Risk R:R veto
9. Risk stop-side veto
10. Size from equity × risk% ÷ stressed stop
11. 10% drawdown circuit
12. Reconcile qty mismatch → error, no overwrite
13. Stale market data reject
14. Binance stub refuses `placeOrder`

Not executed here (would need sandbox keys, still no prod):

- API auth, balance/position/order retrieval against testnet
- partial/full/rejected live orders
- WS disconnect / REST failure
- exchange switch with open risk
- native SL/TP confirmation
- database corruption

Never run the missing rows against production. Never point this default build at a funded account.
