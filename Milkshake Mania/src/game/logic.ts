/**
 * @license
 * All Rights Reserved.
 */

import { Country, FlavorType, GameState } from "../types";
import { BASE_SHAKE_SALE, PROFIT_DIVISOR } from "../constants";

const safeNumber = (value: unknown, fallback: number): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export function calcGlobalMultiplier(
  state: Pick<GameState, "unlockedCountries" | "activeFlavors" | "upgrades">,
  countries: Country[],
  flavors: Record<FlavorType, { multiplier: number }>,
): number {
  const countryMult = countries
    .filter((c) => state.unlockedCountries.includes(c.id))
    .reduce((acc, c) => acc * safeNumber(c.multiplier, 1), 1);

  // Mix Multiplier: sum of active flavor multipliers (starts at 1)
  const mixMult = state.activeFlavors.reduce(
    (acc, t) => acc + (flavors[t]?.multiplier || 0),
    1,
  );

  const researchBonus =
    1 + safeNumber(state.upgrades.recipeDevelopment, 0) * 0.5;

  const ingredientBonus =
    1 + safeNumber(state.upgrades.ingredientQuality, 0) * 0.02;
  const storefrontBonus =
    1 + safeNumber(state.upgrades.storefrontAppeal, 0) * 0.03;
  const socialMediaBonus =
    1 + safeNumber(state.upgrades.socialMediaBuzz, 0) * 0.03;
  const masterMixBonus =
    1 + safeNumber(state.upgrades.masterMixologist, 0) * 0.03;

  return (
    countryMult *
    mixMult *
    researchBonus *
    ingredientBonus *
    storefrontBonus *
    socialMediaBonus *
    masterMixBonus
  );
}

export function calcIncomePerSecond(
  state: Pick<GameState, "shops" | "upgrades">,
  globalMultiplier: number,
): number {
  const base = state.shops.reduce(
    (acc, shop) => acc + (shop.count || 0) * (shop.baseIncome || 0),
    0,
  );
  if (base === 0) return 0;

  const marketingMult = 1 + state.upgrades.marketingCampaign * 0.1;
  const trainingMult = 1 + state.upgrades.employeeTraining * 0.08;
  const customMult = 1 + state.upgrades.customBlending * 0.15;
  const distributionMult = 1 + state.upgrades.distributionNetwork * 0.08;
  const portionMult = 1 + state.upgrades.portionSize * 0.1;
  const loyaltyMult = 1 + (state.upgrades.loyaltyProgram || 0) * 0.08;
  const freezerMult = 1 + (state.upgrades.freezerTech || 0) * 0.06;
  const rushHourMult = 1 + (state.upgrades.rushHourOptimization || 0) * 0.07;

  // Automation penalty: employees are weaker than manual play
  const automationPenalty = 0.75;

  return (
    (base *
      marketingMult *
      trainingMult *
      customMult *
      distributionMult *
      portionMult *
      loyaltyMult *
      freezerMult *
      rushHourMult *
      globalMultiplier *
      automationPenalty) /
    PROFIT_DIVISOR
  );
}

export type SpecialOutcomeId =
  | "FAN_FAVORITE"
  | "CREAMY"
  | "CRUSTY"
  | "BAKED"
  | "GOLDEN"
  | "SWIRLED"
  | "DECORATED";

export function rollSpecialOutcomes(
  upgrades: GameState["upgrades"],
  chances: {
    crustyBase: number;
    bakedBase: number;
    goldenBase: number;
    swirledBase: number;
    fanFavoriteBase: number;
    decoratedBase: number;
    creamyBase: number;
  },
  multipliers: {
    crusty: number;
    baked: number;
    golden: number;
    swirled: number;
    fanFavorite: number;
    decorated: number;
    creamy: number;
  },
): { multiplier: number; activeTypes: SpecialOutcomeId[] } {
  const crustChance =
    chances.crustyBase +
    upgrades.qualityControl * 0.005 +
    upgrades.equipmentUpgrade * 0.002;
  const bakedChance = chances.bakedBase + upgrades.heatControl * 0.001;
  const goldenChance = chances.goldenBase + upgrades.recipeDevelopment * 0.0001;
  const swirledChance = chances.swirledBase;
  const fanFavoriteChance = chances.fanFavoriteBase;
  const decoratedChance = chances.decoratedBase;
  const creamyChance = chances.creamyBase;

  const clampChance = (v: number) => Math.max(0, Math.min(0.95, v));
  const crust = clampChance(crustChance);
  const baked = clampChance(bakedChance);
  const golden = clampChance(goldenChance);
  const swirled = clampChance(swirledChance);
  const fanFavorite = clampChance(fanFavoriteChance);
  const decorated = clampChance(decoratedChance);
  const creamy = clampChance(creamyChance);

  const specialBoost = 1 + upgrades.specialMastery * 0.1;

  let multiplier = 1;
  const activeTypes: SpecialOutcomeId[] = [];

  // Fan Favorite must be first if stacked
  if (Math.random() < fanFavorite) {
    multiplier *= multipliers.fanFavorite * specialBoost;
    activeTypes.push("FAN_FAVORITE");
  }
  if (Math.random() < creamy) {
    multiplier *= multipliers.creamy * specialBoost;
    activeTypes.push("CREAMY");
  }
  if (Math.random() < crust) {
    multiplier *= multipliers.crusty * specialBoost;
    activeTypes.push("CRUSTY");
  }
  if (Math.random() < baked) {
    multiplier *= multipliers.baked * specialBoost;
    activeTypes.push("BAKED");
  }
  if (Math.random() < golden) {
    multiplier *= multipliers.golden * specialBoost;
    activeTypes.push("GOLDEN");
  }
  if (Math.random() < swirled) {
    multiplier *= multipliers.swirled * specialBoost;
    activeTypes.push("SWIRLED");
  }
  if (Math.random() < decorated) {
    multiplier *= multipliers.decorated * specialBoost;
    activeTypes.push("DECORATED");
  }

  return { multiplier, activeTypes };
}

export function calcManualBlendGain(
  state: Pick<GameState, "shops" | "upgrades">,
  globalMultiplier: number,
  specialMultiplier: number,
): number {
  const baseShopIncome = state.shops.reduce(
    (acc, shop) => acc + (shop.count || 0) * (shop.baseIncome || 0),
    0,
  );
  const baseIncome = BASE_SHAKE_SALE + baseShopIncome;

  const portionMult = 1 + state.upgrades.portionSize * 0.1;
  return Math.floor(
    (baseIncome * specialMultiplier * portionMult * globalMultiplier) /
      PROFIT_DIVISOR,
  );
}
