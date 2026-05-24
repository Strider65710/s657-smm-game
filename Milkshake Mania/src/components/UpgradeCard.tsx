/**
 * @license
 * All Rights Reserved.
 */

import React from "react";
import { Coins } from "lucide-react";
import { formatLargeNumber } from "../utils/format";

type Props = {
  key?: any;
  icon: any;
  iconColor?: string;
  name: string;
  desc: string;
  effect?: string;
  level: number;
  maxLevel: number;
  cost: number;
  onBuy: () => void;
  canAfford: boolean;
};

export default function UpgradeCard({
  icon,
  iconColor = "text-neutral-400",
  name,
  desc,
  effect,
  level,
  maxLevel,
  cost,
  onBuy,
  canAfford,
}: Props) {
  const isMaxed = level >= maxLevel;
  return (
    <div
      className={`glass-panel p-4 space-y-2 transition-all border ${
        isMaxed
          ? "border-amber-500/20 bg-amber-500/5"
          : !canAfford
            ? "opacity-50 grayscale border-transparent"
            : "hover:bg-white/[0.07] border-white/5 hover:border-white/20 hover:shadow-xl hover:shadow-black/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-white/5 rounded-lg ${iconColor}`}>{icon}</div>
          <h4 className="font-bold text-sm tracking-tight">{name}</h4>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded font-mono border ${
            isMaxed
              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
              : "bg-white/10 text-neutral-300 border-white/5"
          }`}
        >
          {isMaxed ? `MAX ${maxLevel}` : `LVL ${level}/${maxLevel}`}
        </span>
      </div>
      <p className="text-sm text-neutral-400 leading-relaxed h-8 line-clamp-2">
        {desc}
      </p>
      {effect && (
        <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-teal-500/15 border border-teal-500/30 text-teal-300 uppercase tracking-wide">
          {effect}
        </div>
      )}
      <button
        onClick={isMaxed ? undefined : onBuy}
        disabled={isMaxed || !canAfford}
        className={`w-full py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
          isMaxed
            ? "bg-amber-500/10 text-amber-400 cursor-default border border-amber-500/20"
            : canAfford
              ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:scale-[1.02] active:scale-95 shadow-yellow-500/10"
              : "bg-white/5 text-neutral-500 cursor-not-allowed"
        }`}
      >
        {isMaxed ? (
          "Maxed Out"
        ) : (
          <>
            <Coins className="w-3 h-3" />
            {canAfford
              ? `Upgrade: $${formatLargeNumber(cost)}`
              : `Need $${formatLargeNumber(cost)}`}
          </>
        )}
      </button>
    </div>
  );
}
