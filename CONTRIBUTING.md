# Contributing

This is a paper-trading engine. PRs that send real orders, raise risk, or weaken the LIVE lock will be rejected.

## Rules

1. Keep strategy venue-agnostic.
2. Keep Risk Manager as the only sizer.
3. Do not log secrets.
4. Add a test when you touch execution, risk, or the live gate.
5. Do not “just enable LIVE to see if it works.”

```bash
npm test
```
