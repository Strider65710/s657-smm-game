/**
 * @license
 * All Rights Reserved.
 */

import { GameState, FlavorType, Shop } from "./types";
import { INITIAL_SHOPS } from "./constants";

const safeNumber = (value: unknown, fallback: number): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export function createDefaultState(now: number = Date.now()): GameState {
  return {
    money: 0,
    totalStats: {
      totalMilkshakes: 0,
      totalCrusty: 0,
      totalBaked: 0,
      totalGolden: 0,
      totalSwirled: 0,
    },
    unlockedFlavors: [FlavorType.CHOCOLATE],
    activeFlavors: [FlavorType.CHOCOLATE],
    unlockedCountries: [],
    options: {
      highQuality: true,
      showAutoIncome: false,
      floatingShakes: true,
      screenShake: true,
      autoMix: false,
      numberAnimation: true,
      betterAnimations: true,
      bgIndex: 0,
      guiScale: 1,
      textScale: 1,
    },
    shops: INITIAL_SHOPS,
    upgrades: {
      mixSpeed: 0,
      qualityControl: 0,
      employeeTraining: 0,
      marketingCampaign: 0,
      bulkPurchasing: 0,
      equipmentUpgrade: 0,
      heatControl: 0,
      recipeDevelopment: 0,
      customBlending: 0,
      distributionNetwork: 0,
      portionSize: 0,
      specialMastery: 0,
      ingredientQuality: 0,
      storefrontAppeal: 0,
      expansionNegotiation: 0,
      autoMixerTuning: 0,
      talentRecruitment: 0,
      supplyChainOptimization: 0,
      brandLicensing: 0,
      premiumPackaging: 0,
      automationExpansion: 0,
    },
    gameDays: 1,
    lastUpdate: now,
  };
}

export function sanitizeLoadedState(raw: unknown): GameState {
  const defaults = createDefaultState();
  if (!raw || typeof raw !== "object") return defaults;
  const parsed: any = raw;

  const syncedShops = INITIAL_SHOPS.map((initialShop) => {
    const existing = parsed.shops?.find((s: Shop) => s.id === initialShop.id);
    return {
      ...initialShop,
      count: safeNumber(existing?.count, 0),
      cost: safeNumber(existing?.cost, initialShop.cost),
    };
  });

  const upgrades = {
    ...defaults.upgrades,
    ...Object.fromEntries(
      Object.entries(parsed.upgrades || {}).map(([k, v]) => [
        k,
        safeNumber(v, 0),
      ]),
    ),
  } as GameState["upgrades"];

  return {
    ...defaults,
    ...parsed,
    money: safeNumber(parsed.money, defaults.money),
    shops: syncedShops,
    upgrades,
    activeFlavors: Array.isArray(parsed.activeFlavors)
      ? parsed.activeFlavors
      : defaults.activeFlavors,
    unlockedFlavors: Array.isArray(parsed.unlockedFlavors)
      ? parsed.unlockedFlavors
      : defaults.unlockedFlavors,
    unlockedCountries: Array.isArray(parsed.unlockedCountries)
      ? parsed.unlockedCountries
      : defaults.unlockedCountries,
    options: { ...defaults.options, ...(parsed.options || {}) },
    gameDays: safeNumber(parsed.gameDays, defaults.gameDays),
    lastUpdate: safeNumber(parsed.lastUpdate, Date.now()),
  };
}
