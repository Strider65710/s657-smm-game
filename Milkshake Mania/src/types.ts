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

export type EventLogEntry = {
  day: number;
  name: string;
  choice: string;
  outcome: string;
  timestamp?: number;
};

export type GoalEntry = {
  id: string;
  target: number;
  progress: number;
  claimed: boolean;
};

export interface GameState {
  money: number;
  totalStats: {
    totalMilkshakes: number;
    totalFanFavorite: number;
    totalCreamy: number;
    totalCrusty: number;
    totalBaked: number;
    totalGolden: number;
    totalSwirled: number;
    totalDecorated: number;
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
    colorMode: "dark" | "light";
    guiScale: number;
    textScale: number;
    dateFormat: "mdy" | "dmy";
    seenTutorial: boolean;
    wageLevel: "low" | "normal" | "high";
    shakePrice: "low" | "normal" | "high";
    /** Auto-save interval in seconds. */
    autoSaveInterval: 30 | 45 | 60 | 120 | 240 | typeof Infinity;
    /** Notification display duration in seconds. */
    notifDuration: 3 | 5 | 8 | 15 | 30;
    /** Auto-pause game after 1 minute of no user input. */
    autoIdlePause: boolean;
  };
  shops: Shop[];
  upgrades: {
    mixSpeed: number;
    marketingCampaign: number;
    employeeTraining: number;
    qualityControl: number;
    equipmentUpgrade: number;
    heatControl: number;
    recipeDevelopment: number;
    customBlending: number;
    bulkPurchasing: number;
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
    wifiOptimization: number;
    customerAnalyticsAI: number;
    cloudKitchenIntegration: number;
    viralMarketingAI: number;
    automationOverclock: number;
    quantumLogistics: number;
    flavorSlots: number;
    goldenTouch: number;
    loyaltyProgram: number;
    freezerTech: number;
    socialMediaBuzz: number;
    masterMixologist: number;
    rushHourOptimization: number;
    doubleShot: number;
    speedBlending: number;
    extraBlender: number;
    shiftManager: number;
  };
  gameDays: number;
  lastUpdate: number;
  /** Total accumulated experience. Level is derived from this. */
  xp: number;
  earnedAchievements: string[];
  activeBuffs: {
    id: string;
    multiplier: number;
    expiresAt: number;
    /** Short human-readable source, shown in the itemized buff list. */
    label?: string;
    /** Whether this buff helps (>1) or hurts (<1) income. */
    kind?: "bonus" | "penalty";
  }[];
  eventStats: {
    totalChoiceEvents: number;
    totalAutoEvents: number;
    finesPaid: number;
    inspectionsGambled: number;
    viralInvestments: number;
    blendersRepaired: number;
  };
  /** Chronicle of resolved events, newest first. Capped at 50. */
  eventLog: EventLogEntry[];
  /** Consumable power-up stock counts, keyed by consumable ID. */
  consumables: Record<string, number>;
  goals: {
    daily: GoalEntry[];
    dailyResetAt: number;
    hourly: GoalEntry[];
    hourlyResetAt: number;
  };
}
