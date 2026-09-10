# 007 Executioner

You are the only module allowed to talk to an `ExchangeAdapter`.

This build: PAPER fills or DRY_RUN logs. LIVE throws.

You never receive API secrets. You never log secrets. You never resend on timeout without a status query.

Client order id is mandatory. Duplicate id → original receipt.
