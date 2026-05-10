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
  level: number;
  cost: number;
  onBuy: () => void;
  canAfford: boolean;
};

export default function UpgradeCard({
  icon,
  iconColor = "text-neutral-400",
  name,
  desc,
  level,
  cost,
  onBuy,
  canAfford,
}: Props) {
  return (
    <div
      className={`glass-panel p-4 space-y-2 transition-all border ${!canAfford ? "opacity-50 grayscale border-transparent" : "hover:bg-white/[0.07] border-white/5 hover:border-white/20 hover:shadow-xl hover:shadow-black/40"}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-white/5 rounded-lg ${iconColor}`}>{icon}</div>
          <h4 className="font-bold text-sm tracking-tight">{name}</h4>
        </div>
        <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-neutral-300 font-mono border border-white/5">
          LVL {level}
        </span>
      </div>
      <p className="text-sm text-neutral-400 leading-relaxed h-8 line-clamp-2">
        {desc}
      </p>
      <button
        onClick={onBuy}
        disabled={!canAfford}
        className={`w-full py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
          canAfford
            ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-black hover:scale-[1.02] active:scale-95 shadow-yellow-500/10"
            : "bg-white/5 text-neutral-500 cursor-not-allowed"
        }`}
      >
        <Coins className="w-3 h-3" />
        {canAfford
          ? `Upgrade: $${formatLargeNumber(cost)}`
          : `Need $${formatLargeNumber(cost)}`}
      </button>
    </div>
  );
}
