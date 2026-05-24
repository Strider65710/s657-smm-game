/**
 * @license
 * All Rights Reserved.
 */

import { GameState, FlavorType, Shop } from "./types";
import { BACKGROUNDS, INITIAL_SHOPS } from "./constants";

const DEFAULT_BG_INDEX = Math.max(
  0,
  BACKGROUNDS.findIndex(
    (bg) => String(bg.name).toLowerCase() === "rainforest cafe",
  ),
);
const LIGHT_MODE_DEFAULT_BG_INDEX = Math.max(
  0,
  BACKGROUNDS.findIndex((bg) => String(bg.name).toLowerCase() === "lounge"),
);

const safeNumber = (value: unknown, fallback: number): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export function createDefaultState(now: number = Date.now()): GameState {
  return {
    money: 0,
    totalStats: {
      totalMilkshakes: 0,
      totalFanFavorite: 0,
      totalCreamy: 0,
      totalCrusty: 0,
      totalBaked: 0,
      totalGolden: 0,
      totalSwirled: 0,
      totalDecorated: 0,
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
      bgIndex: DEFAULT_BG_INDEX,
      colorMode: "dark",
      guiScale: 1,
      textScale: 1,
      dateFormat: "mdy",
      seenTutorial: false,
      wageLevel: "normal" as const,
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
      wifiOptimization: 0,
      customerAnalyticsAI: 0,
      cloudKitchenIntegration: 0,
      viralMarketingAI: 0,
      automationOverclock: 0,
      quantumLogistics: 0,
      flavorSlots: 0,
    },
    gameDays: 1,
    lastUpdate: now,
    earnedAchievements: [],
    activeBuffs: [],
    eventStats: {
      totalChoiceEvents: 0,
      totalAutoEvents: 0,
      finesPaid: 0,
      inspectionsGambled: 0,
      viralInvestments: 0,
      blendersRepaired: 0,
    },
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

  // Back-compat: saves that predate flavorSlots get all 3 slots so they aren't penalised
  const hasExistingProgress =
    safeNumber(parsed.gameDays, 1) > 1 ||
    safeNumber(parsed.money, 0) > 0 ||
    (Array.isArray(parsed.earnedAchievements) &&
      parsed.earnedAchievements.length > 0);
  const legacyFlavorSlots =
    parsed.upgrades &&
    !("flavorSlots" in parsed.upgrades) &&
    hasExistingProgress
      ? 2
      : undefined;

  const upgrades = {
    ...defaults.upgrades,
    ...Object.fromEntries(
      Object.entries(parsed.upgrades || {}).map(([k, v]) => [
        k,
        safeNumber(v, 0),
      ]),
    ),
    ...(legacyFlavorSlots !== undefined
      ? { flavorSlots: legacyFlavorSlots }
      : {}),
  } as GameState["upgrades"];

  return {
    ...defaults,
    ...parsed,
    money: safeNumber(parsed.money, defaults.money),
    totalStats: {
      ...defaults.totalStats,
      ...(parsed.totalStats || {}),
      totalMilkshakes: safeNumber(
        parsed.totalStats?.totalMilkshakes,
        defaults.totalStats.totalMilkshakes,
      ),
      totalFanFavorite: safeNumber(
        parsed.totalStats?.totalFanFavorite,
        defaults.totalStats.totalFanFavorite,
      ),
      totalCreamy: safeNumber(
        parsed.totalStats?.totalCreamy,
        defaults.totalStats.totalCreamy,
      ),
      totalCrusty: safeNumber(
        parsed.totalStats?.totalCrusty,
        defaults.totalStats.totalCrusty,
      ),
      totalBaked: safeNumber(
        parsed.totalStats?.totalBaked,
        defaults.totalStats.totalBaked,
      ),
      totalGolden: safeNumber(
        parsed.totalStats?.totalGolden,
        defaults.totalStats.totalGolden,
      ),
      totalSwirled: safeNumber(
        parsed.totalStats?.totalSwirled,
        defaults.totalStats.totalSwirled,
      ),
      totalDecorated: safeNumber(
        parsed.totalStats?.totalDecorated,
        defaults.totalStats.totalDecorated,
      ),
    },
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
    options: {
      ...defaults.options,
      ...(parsed.options || {}),
      // Back-compat: existing saves should not show the tutorial again
      seenTutorial:
        parsed.options?.seenTutorial !== undefined
          ? Boolean(parsed.options.seenTutorial)
          : hasExistingProgress,
      bgIndex: (() => {
        const idx = safeNumber(
          parsed.options?.bgIndex,
          defaults.options.bgIndex,
        );
        return idx >= 0 && idx < BACKGROUNDS.length
          ? idx
          : defaults.options.bgIndex;
      })(),
      colorMode: parsed.options?.colorMode === "light" ? "light" : "dark",
      dateFormat:
        parsed.options?.dateFormat === "dmy"
          ? "dmy"
          : defaults.options.dateFormat,
      wageLevel:
        parsed.options?.wageLevel === "low"
          ? "low"
          : parsed.options?.wageLevel === "high"
            ? "high"
            : "normal",
    },
    gameDays: safeNumber(parsed.gameDays, defaults.gameDays),
    lastUpdate: safeNumber(parsed.lastUpdate, Date.now()),
    eventStats: {
      totalChoiceEvents: safeNumber(parsed.eventStats?.totalChoiceEvents, 0),
      totalAutoEvents: safeNumber(parsed.eventStats?.totalAutoEvents, 0),
      finesPaid: safeNumber(parsed.eventStats?.finesPaid, 0),
      inspectionsGambled: safeNumber(parsed.eventStats?.inspectionsGambled, 0),
      viralInvestments: safeNumber(parsed.eventStats?.viralInvestments, 0),
      blendersRepaired: safeNumber(parsed.eventStats?.blendersRepaired, 0),
    },
    earnedAchievements: Array.isArray(parsed.earnedAchievements)
      ? parsed.earnedAchievements.filter((v: unknown) => typeof v === "string")
      : [],
    activeBuffs: Array.isArray(parsed.activeBuffs)
      ? parsed.activeBuffs.filter(
          (b: unknown) =>
            b &&
            typeof b === "object" &&
            typeof (b as any).id === "string" &&
            typeof (b as any).multiplier === "number" &&
            typeof (b as any).expiresAt === "number" &&
            (b as any).expiresAt > Date.now(),
        )
      : [],
  };
}
