/**
 * @license
 * All Rights Reserved.
 */

export enum FlavorType {
  CHOCOLATE = "Chocolate",
  VANILLA = "Vanilla",
  STRAWBERRY = "Strawberry",
  PINEAPPLE = "Pineapple",
  MATCHA = "Matcha",
  MINT = "Mint",
  CARAMEL = "Caramel",
  MELON = "Melon",
  COFFEE = "Coffee",
  COOKIES = "Cookies & Cream",
  LAVA = "Lava Chili",
  STARDUST = "Stardust",
  DRAGON = "Dragon Fruit",
  RAINBOW = "Rainbow Sparkle",
  VOID = "The Void",
  NEON = "Neon Sludge",
  ELIXIR = "Royal Elixir",
  ULTIMATE = "Ultimate Essence",
  CELESTIAL = "Celestial Delight",
  PHOENIX = "Phoenix Flame",
  COSMIC = "Cosmic Wonder",
  CITRUS = "Citrus Zest",
  MARSHMALLOW = "Marshmallow Cloud",
  GALAXY = "Galaxy Swirl",
  PHANTOM = "Phantom Frost",
}
export interface FlavorInfo {
  type: FlavorType;
  multiplier: number;
  unlockCost: number;
  color: string;
}

export interface Shop {
  id: string;
  name: string;
  section: "employees" | "shops";
  description: string;
  employeeCapacity?: number;
  count: number;
  baseIncome: number;
  cost: number;
  monthlyCost: number;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
}

export interface Country {
  id: string;
  name: string;
  multiplier: number;
  cost: number;
  description: string;
}

export interface GameState {
  money: number;
  totalStats: {
    totalMilkshakes: number;
    totalCrusty: number;
    totalBaked: number;
    totalGolden: number;
    totalSwirled: number;
  };
  unlockedFlavors: FlavorType[];
  activeFlavors: FlavorType[];
  unlockedCountries: string[];
  options: {
    highQuality: boolean;
    showAutoIncome: boolean;
    floatingShakes: boolean;
    screenShake: boolean;
    autoMix: boolean;
    numberAnimation: boolean;
    betterAnimations: boolean;
    bgIndex: number;
    guiScale: number;
    textScale: number;
  };
  shops: Shop[];
  upgrades: {
    mixSpeed: number;
    qualityControl: number;
    employeeTraining: number;
    marketingCampaign: number;
    bulkPurchasing: number;
    equipmentUpgrade: number;
    heatControl: number;
    recipeDevelopment: number;
    customBlending: number;
    distributionNetwork: number;
    portionSize: number;
    specialMastery: number;
    ingredientQuality: number;
    storefrontAppeal: number;
    expansionNegotiation: number;
    autoMixerTuning: number;
    talentRecruitment: number;
    supplyChainOptimization: number;
    brandLicensing: number;
    premiumPackaging: number;
    automationExpansion: number;
  };
  gameDays: number;
  lastUpdate: number;
}
