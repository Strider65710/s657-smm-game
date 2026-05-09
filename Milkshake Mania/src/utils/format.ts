/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatLargeNumber(num: number, precision = 2): string {
  if (num === 0) return "0";
  const floorNum = Math.floor(num);
  if (num >= 1e24) return (num / 1e24).toFixed(precision) + "Y";
  if (num >= 1e21) return (num / 1e21).toFixed(precision) + "Z";
  if (num >= 1e18) return (num / 1e18).toFixed(precision) + "E";
  if (num >= 1e15) return (num / 1e15).toFixed(precision) + "P";
  if (num >= 1e12) return (num / 1e12).toFixed(precision) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(precision) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(precision) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return floorNum.toLocaleString();
}

