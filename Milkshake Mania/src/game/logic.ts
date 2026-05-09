import { Country, FlavorType, GameState } from "../types";

const safeNumber = (value: unknown, fallback: number): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export function calcGlobalMultiplier(
  state: Pick<
    GameState,
    "unlockedCountries" | "activeFlavors" | "upgrades"
  >,
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

  const researchBonus = 1 + safeNumber(state.upgrades.recipeDevelopment, 0) * 0.5;

  const ingredientBonus = 1 + safeNumber(state.upgrades.ingredientQuality, 0) * 0.02;
  const storefrontBonus = 1 + safeNumber(state.upgrades.storefrontAppeal, 0) * 0.03;

  return countryMult * mixMult * researchBonus * ingredientBonus * storefrontBonus;
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

  // Automation penalty: employees are weaker than manual play
  const automationPenalty = 0.75;

  return (
    base *
    marketingMult *
    trainingMult *
    customMult *
    distributionMult *
    portionMult *
    globalMultiplier *
    automationPenalty
  );
}

export type SpecialOutcomeId = "CRUSTY" | "BAKED" | "GOLDEN" | "SWIRLED";

export function rollSpecialOutcomes(
  upgrades: GameState["upgrades"],
  chances: {
    crustyBase: number;
    bakedBase: number;
    goldenBase: number;
    swirledBase: number;
  },
  multipliers: {
    crusty: number;
    baked: number;
    golden: number;
    swirled: number;
  },
): { multiplier: number; activeTypes: SpecialOutcomeId[] } {
  const crustChance =
    chances.crustyBase + upgrades.qualityControl * 0.005 + upgrades.equipmentUpgrade * 0.002;
  const bakedChance = chances.bakedBase + upgrades.heatControl * 0.001;
  const goldenChance = chances.goldenBase + upgrades.recipeDevelopment * 0.0001;
  const swirledChance = chances.swirledBase;

  const clampChance = (v: number) => Math.max(0, Math.min(0.95, v));
  const crust = clampChance(crustChance);
  const baked = clampChance(bakedChance);
  const golden = clampChance(goldenChance);
  const swirled = clampChance(swirledChance);

  const specialBoost = 1 + upgrades.specialMastery * 0.1;

  let multiplier = 1;
  const activeTypes: SpecialOutcomeId[] = [];

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

  return { multiplier, activeTypes };
}

export function calcManualBlendGain(
  state: Pick<GameState, "shops" | "upgrades">,
  globalMultiplier: number,
  specialMultiplier: number,
): number {
  const baseIncome =
    state.shops.reduce((acc, shop) => acc + (shop.count || 0) * (shop.baseIncome || 0), 0) ||
    1;

  const portionMult = 1 + state.upgrades.portionSize * 0.1;
  return Math.floor(baseIncome * specialMultiplier * portionMult * globalMultiplier);
}
