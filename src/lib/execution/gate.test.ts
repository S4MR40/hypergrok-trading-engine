import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_LIVE_FLAGS } from "./types";
import {
  LIVE_TRADING_HARD_DISABLED,
  assertCanSubmit,
  assertNotLive,
  isLiveUnlocked,
  liveWouldRequire,
  sanitizeMode,
} from "./gate";

describe("live gate", () => {
  it("hard-disables LIVE", () => {
    assert.equal(LIVE_TRADING_HARD_DISABLED, true);
    assert.equal(isLiveUnlocked(), false);
    assert.equal(sanitizeMode("LIVE"), "PAPER");
    assert.equal(sanitizeMode("DRY_RUN"), "DRY_RUN");
  });

  it("throws on LIVE submit", () => {
    assert.throws(() => assertNotLive("LIVE"), /hard-disabled/);
    assert.throws(() => assertCanSubmit("LIVE"), /hard-disabled/);
  });

  it("refuses submit if any live flag is set even in PAPER", () => {
    assert.throws(
      () =>
        assertCanSubmit("PAPER", {
          ...DEFAULT_LIVE_FLAGS,
          TRADING_ENABLED: true,
        }),
      /LIVE flag/,
    );
  });

  it("allows paper submit with default flags", () => {
    assert.doesNotThrow(() => assertCanSubmit("PAPER"));
    assert.doesNotThrow(() => assertCanSubmit("DRY_RUN"));
  });

  it("lists every missing live requirement", () => {
    const missing = liveWouldRequire(DEFAULT_LIVE_FLAGS);
    assert.ok(missing.some((m) => m.includes("HARD_DISABLED")));
    assert.ok(missing.includes("TRADING_MODE=LIVE"));
    assert.ok(missing.includes("TRADING_ENABLED=true"));
    assert.ok(missing.includes("LIVE_TRADING_CONFIRMATION=true"));
  });
});
