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

  return Math.floor(num).toLocaleString();
}
