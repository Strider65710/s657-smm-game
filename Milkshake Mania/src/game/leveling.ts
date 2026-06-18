/**
 * @license
 * All Rights Reserved.
 */

/**
 * Player leveling system.
 *
 * XP is earned from active play (blending, hiring, upgrading, expanding,
 * earning money, and unlocking achievements). The level derived from total XP
 * gates a handful of features so progression feels deliberate, and milestone
 * levels hand out small rewards.
 *
 * Level 0 is the starting level. Each level requires progressively more XP.
 */

/** Levels at which major features unlock. */
export const LEVEL_UNLOCKS = {
  flavors: 1,
  shops: 3,
  employees: 5,
  shakePrice: 7,
  specialUpgrades: 8,
  wages: 10,
  backgrounds: 0,
  countries: 15,
} as const;

/** Wages also require a real workforce before they can be tuned. */
export const WAGE_EMPLOYEE_REQUIREMENT = 10;

/**
 * XP granted per action. Kept modest so leveling tracks overall progress,
 * not grinding. Auto-blend earns very little so AFK play doesn't shortcut
 * the progression curve.
 */
export const XP_REWARDS = {
  manualBlend: 3,
  autoBlend: 1,
  hireEmployee: 5,
  buyShop: 8,
  buyUpgrade: 10,
  unlockFlavor: 18,
  unlockCountry: 30,
  achievement: 12,
  /** Awarded once per new order of magnitude of money held. */
  moneyMilestone: 35,
} as const;

const MAX_LEVEL = 2147483647;

/**
 * XP required to advance FROM `level` to `level + 1`.
 *
 * xpForLevelUp can be modified and the game will adapt your leveling.
 */
export function xpForLevelUp(level: number): number {
  const safe = Math.max(0, Math.floor(level));
  return Math.floor(50 * Math.pow(safe + 1, 1.25));
}

/** Cumulative XP required to REACH `level` (level 0 needs 0). */
export function totalXpForLevel(level: number): number {
  let sum = 0;
  for (let l = 0; l < level; l += 1) sum += xpForLevelUp(l);
  return sum;
}

/** Derive the player's current level from total accumulated XP. Starts at 0. */
export function levelFromXp(xp: number): number {
  let level = 0;
  let remaining = Math.max(0, Number.isFinite(xp) ? xp : 0);
  while (level < MAX_LEVEL && remaining >= xpForLevelUp(level)) {
    remaining -= xpForLevelUp(level);
    level += 1;
  }
  return level;
}

export type LevelProgress = {
  level: number;
  /** XP earned within the current level. */
  intoLevel: number;
  /** XP needed to clear the current level. */
  needed: number;
  /** 0..1 fraction toward the next level. */
  pct: number;
};

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const intoLevel = Math.max(
    0,
    (Number.isFinite(xp) ? xp : 0) - totalXpForLevel(level),
  );
  const needed = xpForLevelUp(level);
  return {
    level,
    intoLevel,
    needed,
    pct: needed > 0 ? Math.min(1, intoLevel / needed) : 1,
  };
}

/** Cash bonus handed out for reaching a new level. Scales gently with level. */
export function levelUpReward(level: number): number {
  return Math.floor(150 * Math.pow(level, 1.5));
}

/** Human-readable note about what (if anything) a level unlocks. */
export function levelUnlockNote(level: number): string | null {
  switch (level) {
    case LEVEL_UNLOCKS.flavors:
      return "Flavor unlocking unlocked!";
    case LEVEL_UNLOCKS.shops:
      return "Shop Extensions unlocked!";
    case LEVEL_UNLOCKS.employees:
      return "Employee hiring unlocked!";
    case LEVEL_UNLOCKS.shakePrice:
      return "Shake Price control unlocked!";
    case LEVEL_UNLOCKS.specialUpgrades:
      return "Special Upgrades unlocked!";
    case LEVEL_UNLOCKS.wages:
      return "Wage management unlocked!";
    case LEVEL_UNLOCKS.countries:
      return "Global Expansion unlocked!";
    default:
      return null;
  }
}
