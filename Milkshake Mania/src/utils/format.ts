/**
 * @license
 * All Rights Reserved.
 */

type NumberFormatTier = {
  value: number;
  suffix: string;
};

const TIERS: NumberFormatTier[] = [
  { value: 1e90, suffix: "Nvg" },
  { value: 1e87, suffix: "Ovg" },
  { value: 1e84, suffix: "Svg" },
  { value: 1e81, suffix: "Hvg" },
  { value: 1e78, suffix: "Pvg" },
  { value: 1e75, suffix: "Qvg" },
  { value: 1e72, suffix: "Tvg" },
  { value: 1e69, suffix: "Dvg" },
  { value: 1e66, suffix: "Uvg" },
  { value: 1e63, suffix: "Vg" },
  { value: 1e60, suffix: "Nd" },
  { value: 1e57, suffix: "Od" },
  { value: 1e54, suffix: "Sd" },
  { value: 1e51, suffix: "Hd" },
  { value: 1e48, suffix: "Pd" },
  { value: 1e45, suffix: "Qd" },
  { value: 1e42, suffix: "Td" },
  { value: 1e39, suffix: "Dd" },
  { value: 1e36, suffix: "Ud" },
  { value: 1e33, suffix: "Dc" },
  { value: 1e30, suffix: "No" },
  { value: 1e27, suffix: "Oc" },
  { value: 1e24, suffix: "Sp" },
  { value: 1e21, suffix: "Sx" },
  { value: 1e18, suffix: "Qi" },
  { value: 1e15, suffix: "Qa" },
  { value: 1e12, suffix: "T" },
  { value: 1e9, suffix: "B" },
  { value: 1e6, suffix: "M" },
  { value: 1e3, suffix: "K" },
];

export function formatLargeNumber(num: number, precision: number = 2): string {
  if (num === 0) return "0";

  const abs = Math.abs(num);

  if (abs < 1) {
    return num.toFixed(2).replace(/\.0+$|0+$/, "");
  }

  for (const tier of TIERS) {
    if (abs >= tier.value) {
      return (num / tier.value).toFixed(precision) + tier.suffix;
    }
  }

  // Below 1000 — show cents but strip the redundant .00 for whole numbers.
  if (abs < 1000) {
    return num.toFixed(2).replace(/\.00$/, "");
  }

  // 1000–9999: no decimals needed.
  return Math.floor(num).toLocaleString();
}

/**
 * Formats a money value for the main HUD counter.
 * Always shows two decimal places for sub-$1 000 values (cents visible),
 * and uses the short-suffix tiers for large numbers.
 */
export function formatMoney(num: number): string {
  return formatLargeNumber(num);
}

/**
 * Returns a human-readable estimate of how long until the player can afford
 * `cost` given their current `money` and `incomePerSec`. Returns null when
 * the player already has enough money.
 */
export function timeToAfford(
  cost: number,
  money: number,
  incomePerSec: number,
): string | null {
  if (money >= cost) return null;
  if (incomePerSec <= 0) return null;
  const secs = Math.ceil((cost - money) / incomePerSec);
  if (secs < 60) return `~${secs}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  if (mins < 60) return remSecs > 0 ? `~${mins}m ${remSecs}s` : `~${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return remMins > 0 ? `~${hours}h ${remMins}m` : `~${hours}h`;
  const days = Math.floor(hours / 24);
  return `~${days}d`;
}
