import { DEFAULT_LIVE_FLAGS, ExecutionError, type LiveFlags, type TradingMode, type VenueId } from "./types";

/**
 * LIVE trading is hard-disabled in this build.
 * Triple-flag confirmation is still documented for a future dedicated binary.
 * This hosted desk never sends a real order.
 */
export const LIVE_TRADING_HARD_DISABLED = true as const;

export const DEFAULT_VENUE: VenueId = "paper";

export function isLiveUnlocked(_flags: LiveFlags = DEFAULT_LIVE_FLAGS): false {
  return false;
}

export function assertNotLive(mode: TradingMode): void {
  if (mode === "LIVE") {
    throw new ExecutionError(
      "LIVE_LOCKED",
      "LIVE trading is hard-disabled. PAPER and DRY_RUN only. No real order will be sent.",
    );
  }
}

export function assertCanSubmit(mode: TradingMode, flags: LiveFlags = DEFAULT_LIVE_FLAGS): void {
  assertNotLive(mode);
  if (LIVE_TRADING_HARD_DISABLED && (flags.TRADING_MODE === "LIVE" || flags.TRADING_ENABLED || flags.LIVE_TRADING_CONFIRMATION)) {
    throw new ExecutionError(
      "LIVE_LOCKED",
      "A LIVE flag is set but LIVE is hard-disabled. Refusing submit.",
    );
  }
}

export function liveWouldRequire(flags: LiveFlags): string[] {
  const missing: string[] = [];
  if (LIVE_TRADING_HARD_DISABLED) {
    missing.push("LIVE_TRADING_HARD_DISABLED must be false in a dedicated production binary (not this default)");
  }
  if (flags.TRADING_MODE !== "LIVE") missing.push("TRADING_MODE=LIVE");
  if (!flags.TRADING_ENABLED) missing.push("TRADING_ENABLED=true");
  if (!flags.LIVE_TRADING_CONFIRMATION) missing.push("LIVE_TRADING_CONFIRMATION=true");
  return missing;
}

export function sanitizeMode(requested: TradingMode): TradingMode {
  if (requested === "LIVE") return "PAPER";
  return requested;
}

export function modeLabel(mode: TradingMode): string {
  if (mode === "DRY_RUN") return "DRY-RUN";
  if (mode === "LIVE") return "LIVE-LOCKED";
  return "PAPER";
}
