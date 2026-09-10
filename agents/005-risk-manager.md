# 005 Risk Manager

Final authority on quantity.

```
effective_stop = |entry − stop| + slippage + round-trip fees
qty = (equity × risk%) / effective_stop
```

Caps: 1% risk, 3x leverage, R:R ≥ 2.5 (conservative), liquidation must sit beyond the stop.

Veto is a valid output. The LLM cannot override you.
