/**
 * @license
 * All Rights Reserved.
 */

import { GameState, GoalEntry } from "../types";
import { formatLargeNumber } from "../utils/format";

export type GoalType =
  | "manualBlend"
  | "earnIncome"
  | "hireEmployee"
  | "triggerEvent"
  | "buyUpgrade"
  | "triggerGolden"
  | "triggerFanFavorite"
  | "spendMoney"
  | "activatePowerUp";

export type GoalReward =
  | { kind: "xp"; xp: number }
  | { kind: "money"; factor: number }
  | { kind: "buff"; multiplier: number; durationSec: number; label: string };

export type GoalDef = {
  id: string;
  category: "daily" | "hourly";
  type: GoalType;
  labelFn: (target: number) => string;
  targetFn: (gameDays: number) => number;
  reward: GoalReward;
};

const DAILY_POOL: GoalDef[] = [
  {
    id: "d_blend_sm",
    category: "daily",
    type: "manualBlend",
    labelFn: (n) => `Blend ${n} shakes manually`,
    targetFn: () => 15,
    reward: { kind: "xp", xp: 50 },
  },
  {
    id: "d_blend_md",
    category: "daily",
    type: "manualBlend",
    labelFn: (n) => `Blend ${n} shakes manually`,
    targetFn: () => 40,
    reward: { kind: "xp", xp: 100 },
  },
  {
    id: "d_blend_lg",
    category: "daily",
    type: "manualBlend",
    labelFn: (n) => `Blend ${n} shakes manually`,
    targetFn: () => 80,
    reward: { kind: "xp", xp: 200 },
  },
  {
    id: "d_income_sm",
    category: "daily",
    type: "earnIncome",
    labelFn: (n) => `Earn $${formatLargeNumber(n)} passively`,
    targetFn: (d) =>
      Math.max(100, Math.floor(300 * Math.pow(Math.max(1, d / 5), 1.4))),
    reward: { kind: "money", factor: 0.2 },
  },
  {
    id: "d_income_md",
    category: "daily",
    type: "earnIncome",
    labelFn: (n) => `Earn $${formatLargeNumber(n)} passively`,
    targetFn: (d) =>
      Math.max(500, Math.floor(1500 * Math.pow(Math.max(1, d / 5), 1.4))),
    reward: { kind: "money", factor: 0.25 },
  },
  {
    id: "d_hire_sm",
    category: "daily",
    type: "hireEmployee",
    labelFn: (n) => `Hire ${n} ${n === 1 ? "employee" : "employees"}`,
    targetFn: () => 2,
    reward: { kind: "xp", xp: 60 },
  },
  {
    id: "d_hire_md",
    category: "daily",
    type: "hireEmployee",
    labelFn: (n) => `Hire ${n} employees`,
    targetFn: () => 4,
    reward: { kind: "xp", xp: 120 },
  },
  {
    id: "d_event",
    category: "daily",
    type: "triggerEvent",
    labelFn: () => "Resolve 1 game event",
    targetFn: () => 1,
    reward: { kind: "buff", multiplier: 2, durationSec: 300, label: "Daily Goal" },
  },
  {
    id: "d_upgrade_sm",
    category: "daily",
    type: "buyUpgrade",
    labelFn: (n) => `Purchase ${n} upgrades`,
    targetFn: () => 2,
    reward: { kind: "xp", xp: 80 },
  },
  {
    id: "d_upgrade_md",
    category: "daily",
    type: "buyUpgrade",
    labelFn: (n) => `Purchase ${n} upgrades`,
    targetFn: () => 4,
    reward: { kind: "xp", xp: 150 },
  },
  {
    id: "d_fan_sm",
    category: "daily",
    type: "triggerFanFavorite",
    labelFn: (n) => `Craft ${n} Fan Favorite blends`,
    targetFn: () => 5,
    reward: { kind: "xp", xp: 60 },
  },
  {
    id: "d_fan_lg",
    category: "daily",
    type: "triggerFanFavorite",
    labelFn: (n) => `Craft ${n} Fan Favorite blends`,
    targetFn: () => 20,
    reward: { kind: "xp", xp: 130 },
  },
  {
    id: "d_golden",
    category: "daily",
    type: "triggerGolden",
    labelFn: () => "Craft a Golden Milkshake",
    targetFn: () => 1,
    reward: {
      kind: "buff",
      multiplier: 1.5,
      durationSec: 600,
      label: "Golden Rush",
    },
  },
  {
    id: "d_spend_sm",
    category: "daily",
    type: "spendMoney",
    labelFn: (n) => `Spend $${formatLargeNumber(n)} on purchases`,
    targetFn: (d) =>
      Math.max(200, Math.floor(500 * Math.pow(Math.max(1, d / 5), 1.3))),
    reward: { kind: "xp", xp: 70 },
  },
  {
    id: "d_spend_md",
    category: "daily",
    type: "spendMoney",
    labelFn: (n) => `Spend $${formatLargeNumber(n)} on purchases`,
    targetFn: (d) =>
      Math.max(1000, Math.floor(2500 * Math.pow(Math.max(1, d / 5), 1.3))),
    reward: { kind: "xp", xp: 140 },
  },
  {
    id: "d_powerup",
    category: "daily",
    type: "activatePowerUp",
    labelFn: () => "Activate a Power-Up",
    targetFn: () => 1,
    reward: { kind: "xp", xp: 50 },
  },
];

const HOURLY_POOL: GoalDef[] = [
  {
    id: "h_blend_sm",
    category: "hourly",
    type: "manualBlend",
    labelFn: (n) => `Blend ${n} shakes manually`,
    targetFn: () => 5,
    reward: { kind: "xp", xp: 20 },
  },
  {
    id: "h_blend_md",
    category: "hourly",
    type: "manualBlend",
    labelFn: (n) => `Blend ${n} shakes manually`,
    targetFn: () => 12,
    reward: { kind: "xp", xp: 40 },
  },
  {
    id: "h_income",
    category: "hourly",
    type: "earnIncome",
    labelFn: (n) => `Earn $${formatLargeNumber(n)} passively`,
    targetFn: (d) =>
      Math.max(30, Math.floor(80 * Math.pow(Math.max(1, d / 5), 1.4))),
    reward: { kind: "money", factor: 0.2 },
  },
  {
    id: "h_upgrade",
    category: "hourly",
    type: "buyUpgrade",
    labelFn: () => "Purchase 1 upgrade",
    targetFn: () => 1,
    reward: { kind: "xp", xp: 25 },
  },
  {
    id: "h_hire",
    category: "hourly",
    type: "hireEmployee",
    labelFn: () => "Hire 1 employee",
    targetFn: () => 1,
    reward: { kind: "xp", xp: 30 },
  },
  {
    id: "h_fan",
    category: "hourly",
    type: "triggerFanFavorite",
    labelFn: (n) => `Craft ${n} Fan Favorite blends`,
    targetFn: () => 3,
    reward: { kind: "xp", xp: 20 },
  },
  {
    id: "h_golden",
    category: "hourly",
    type: "triggerGolden",
    labelFn: () => "Craft a Golden Milkshake",
    targetFn: () => 1,
    reward: { kind: "xp", xp: 35 },
  },
  {
    id: "h_spend",
    category: "hourly",
    type: "spendMoney",
    labelFn: (n) => `Spend $${formatLargeNumber(n)} on purchases`,
    targetFn: (d) =>
      Math.max(50, Math.floor(150 * Math.pow(Math.max(1, d / 5), 1.3))),
    reward: { kind: "xp", xp: 20 },
  },
  {
    id: "h_powerup",
    category: "hourly",
    type: "activatePowerUp",
    labelFn: () => "Activate a Power-Up",
    targetFn: () => 1,
    reward: { kind: "xp", xp: 20 },
  },
];

export const ALL_GOAL_MAP: Map<string, GoalDef> = new Map([
  ...DAILY_POOL.map((d) => [d.id, d] as [string, GoalDef]),
  ...HOURLY_POOL.map((d) => [d.id, d] as [string, GoalDef]),
]);

function seededRand(seed: number): () => number {
  let s = (seed ^ 0x5f3759df) >>> 0;
  if (s === 0) s = 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 0x100000000;
  };
}

function seededPick<T>(arr: T[], seed: number, count: number): T[] {
  const rand = seededRand(seed);
  const pool = [...arr];
  const result: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(rand() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}

export function generateDailyGoals(
  resetTimestamp: number,
  gameDays: number,
): GoalEntry[] {
  const seed =
    ((Math.floor(resetTimestamp / 60000) * 7919) ^ (gameDays * 31337)) >>> 0;
  const picked = seededPick(DAILY_POOL, seed, 5);
  return picked.map((def) => ({
    id: def.id,
    target: def.targetFn(gameDays),
    progress: 0,
    claimed: false,
  }));
}

export function generateHourlyGoals(
  resetTimestamp: number,
  gameDays: number,
): GoalEntry[] {
  const seed =
    ((Math.floor(resetTimestamp / 60000) * 3571) ^ (gameDays * 13337)) >>> 0;
  const picked = seededPick(HOURLY_POOL, seed, 3);
  return picked.map((def) => ({
    id: def.id,
    target: def.targetFn(gameDays),
    progress: 0,
    claimed: false,
  }));
}

export function getGoalLabel(entry: GoalEntry): string {
  const def = ALL_GOAL_MAP.get(entry.id);
  return def ? def.labelFn(entry.target) : entry.id;
}

export function getRewardLabel(reward: GoalReward, target: number): string {
  if (reward.kind === "xp") return `+${reward.xp} XP`;
  if (reward.kind === "money")
    return `+$${formatLargeNumber(Math.floor(target * reward.factor))} cash`;
  if (reward.kind === "buff")
    return `${reward.multiplier}× income, ${Math.floor(reward.durationSec / 60)} min`;
  return "";
}

/** Pure helper — call inside setState callbacks to advance matching goals. */
export function applyGoalProgress(
  prev: GameState,
  type: GoalType,
  amount: number,
): GameState {
  if (!prev.goals?.daily) return prev;
  // Short-circuit if no active goal matches this type — avoids allocations each tick.
  const hasActive = (goals: GoalEntry[]) =>
    goals.some((g) => {
      const def = ALL_GOAL_MAP.get(g.id);
      return def && def.type === type && !g.claimed && g.progress < g.target;
    });
  if (!hasActive(prev.goals.daily) && !hasActive(prev.goals.hourly)) return prev;

  const updateGoals = (goals: GoalEntry[]) =>
    goals.map((g) => {
      const def = ALL_GOAL_MAP.get(g.id);
      if (!def || def.type !== type || g.claimed || g.progress >= g.target)
        return g;
      return { ...g, progress: Math.min(g.target, g.progress + amount) };
    });
  return {
    ...prev,
    goals: {
      ...prev.goals,
      daily: updateGoals(prev.goals.daily),
      hourly: updateGoals(prev.goals.hourly),
    },
  };
}

/** Pure helper — call inside setState callbacks to reset expired goal periods. */
export function checkGoalResets(prev: GameState, now: number): GameState {
  if (!prev.goals?.daily) return prev;
  let result = prev;

  if (result.goals.dailyResetAt > 0 && now >= result.goals.dailyResetAt) {
    const newReset = result.goals.dailyResetAt + 24 * 60 * 60 * 1000;
    result = {
      ...result,
      goals: {
        ...result.goals,
        daily: generateDailyGoals(result.goals.dailyResetAt, result.gameDays),
        dailyResetAt: newReset,
      },
    };
  }

  if (result.goals.hourlyResetAt > 0 && now >= result.goals.hourlyResetAt) {
    const newReset = result.goals.hourlyResetAt + 60 * 60 * 1000;
    result = {
      ...result,
      goals: {
        ...result.goals,
        hourly: generateHourlyGoals(result.goals.hourlyResetAt, result.gameDays),
        hourlyResetAt: newReset,
      },
    };
  }

  return result;
}
