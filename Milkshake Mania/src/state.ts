/**
 * @license
 * All Rights Reserved.
 */

import { GameState, FlavorType, Shop, EventLogEntry, GoalEntry } from "./types";
import {
  generateDailyGoals,
  generateHourlyGoals,
  ALL_GOAL_MAP,
} from "./game/goals";
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
      shakePrice: "normal" as const,
      autoSaveInterval: 60 as const,
      notifDuration: 8 as const,
      autoIdlePause: true,
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
      goldenTouch: 0,
      loyaltyProgram: 0,
      freezerTech: 0,
      socialMediaBuzz: 0,
      masterMixologist: 0,
      rushHourOptimization: 0,
      doubleShot: 0,
      speedBlending: 0,
      extraBlender: 0,
      shiftManager: 0,
    },
    gameDays: 1,
    lastUpdate: now,
    xp: 0,
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
    eventLog: [],
    consumables: {},
    goals: {
      daily: generateDailyGoals(now, 1),
      dailyResetAt: now + 24 * 60 * 60 * 1000,
      hourly: generateHourlyGoals(now, 1),
      hourlyResetAt: now + 60 * 60 * 1000,
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
      guiScale: Math.max(0.5, Math.min(
        1.5,
        safeNumber(parsed.options?.guiScale, defaults.options.guiScale),
      )),
      textScale: Math.max(0.7, Math.min(
        1.3,
        safeNumber(parsed.options?.textScale, defaults.options.textScale),
      )),
      dateFormat:
        parsed.options?.dateFormat === "dmy"
          ? "dmy"
          : defaults.options.dateFormat,
      autoIdlePause:
        typeof parsed.options?.autoIdlePause === "boolean"
          ? parsed.options.autoIdlePause
          : defaults.options.autoIdlePause,
      wageLevel:
        parsed.options?.wageLevel === "low"
          ? "low"
          : parsed.options?.wageLevel === "high"
            ? "high"
            : "normal",
      shakePrice:
        parsed.options?.shakePrice === "low"
          ? "low"
          : parsed.options?.shakePrice === "high"
            ? "high"
            : "normal",
    },
    gameDays: safeNumber(parsed.gameDays, defaults.gameDays),
    lastUpdate: safeNumber(parsed.lastUpdate, Date.now()),
    xp: Math.max(0, safeNumber(parsed.xp, defaults.xp)),
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
    eventLog: Array.isArray(parsed.eventLog)
      ? (parsed.eventLog as EventLogEntry[]).filter(
          (e) =>
            e &&
            typeof e.day === "number" &&
            typeof e.name === "string" &&
            typeof e.choice === "string" &&
            typeof e.outcome === "string",
        )
      : [],
    consumables:
      parsed.consumables && typeof parsed.consumables === "object"
        ? Object.fromEntries(
            Object.entries(parsed.consumables).filter(
              ([, v]) => typeof v === "number" && v >= 0,
            ),
          )
        : {},
    goals: (() => {
      const now = Date.now();
      const defaultGoals = {
        daily: generateDailyGoals(now, 1),
        dailyResetAt: now + 24 * 60 * 60 * 1000,
        hourly: generateHourlyGoals(now, 1),
        hourlyResetAt: now + 60 * 60 * 1000,
      };
      if (!parsed.goals || typeof parsed.goals !== "object") return defaultGoals;
      const validateGoals = (raw: unknown, count: number): GoalEntry[] => {
        if (!Array.isArray(raw)) return [];
        const valid = raw.filter(
          (g: unknown): g is GoalEntry =>
            !!g &&
            typeof g === "object" &&
            typeof (g as any).id === "string" &&
            typeof (g as any).target === "number" &&
            typeof (g as any).progress === "number" &&
            typeof (g as any).claimed === "boolean" &&
            ALL_GOAL_MAP.has((g as any).id),
        );
        return valid.length === count ? valid : [];
      };
      const daily = validateGoals(parsed.goals.daily, 5);
      const hourly = validateGoals(parsed.goals.hourly, 3);
      const dailyResetAt = safeNumber(parsed.goals.dailyResetAt, 0);
      const hourlyResetAt = safeNumber(parsed.goals.hourlyResetAt, 0);
      return {
        daily: daily.length === 5 ? daily : defaultGoals.daily,
        dailyResetAt: dailyResetAt > now ? dailyResetAt : defaultGoals.dailyResetAt,
        hourly: hourly.length === 3 ? hourly : defaultGoals.hourly,
        hourlyResetAt: hourlyResetAt > now ? hourlyResetAt : defaultGoals.hourlyResetAt,
      };
    })(),
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
