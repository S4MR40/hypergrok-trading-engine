import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stressedStopPlan } from "./risk";
import { DEFAULT_SETTINGS } from "./types";

describe("stressed stop sizing", () => {
  it("sizes from equity × risk % ÷ stressed stop", () => {
    const plan = stressedStopPlan({
      side: "LONG",
      entry: 100,
      stop: 97,
      tp1: 108,
      tp2: 112,
      equity: 10_000,
      settings: DEFAULT_SETTINGS,
    });
    assert.equal(plan.pass, true);
    assert.ok(plan.rr >= 2.5);
    assert.ok(plan.riskUsd <= 10_000 * DEFAULT_SETTINGS.maxRiskPct + 1e-6);
    assert.ok(plan.leverage <= DEFAULT_SETTINGS.maxLeverage + 1e-6);
    assert.ok(plan.qty > 0);
  });

  it("vetoes R:R below the floor", () => {
    const plan = stressedStopPlan({
      side: "LONG",
      entry: 100,
      stop: 99,
      tp1: 100.5,
      tp2: 101,
      equity: 10_000,
      settings: DEFAULT_SETTINGS,
    });
    assert.equal(plan.pass, false);
    assert.match(plan.rejectReason ?? "", /R:R/);
  });

  it("vetoes a long stop above entry", () => {
    const plan = stressedStopPlan({
      side: "LONG",
      entry: 100,
      stop: 101,
      tp1: 110,
      tp2: 120,
      equity: 10_000,
      settings: DEFAULT_SETTINGS,
    });
    assert.equal(plan.pass, false);
  });
});
