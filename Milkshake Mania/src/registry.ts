import { FlavorType, FlavorInfo, Shop, GameState } from "./types";

export const shopCost = (base: number, tier: number): number => {
  return Math.floor(base * Math.pow(4.3, tier - 1) * Math.pow(tier, 1.2));
};

export const shopIncome = (base: number, tier: number): number => {
  return Math.floor(base * Math.pow(3.0, tier - 1) * (1 + tier * 0.1));
};

export const SHOP_REGISTRY = {
  INTERNS: {
    id: "interns",
    name: "Student Interns",
    baseIncome: 3,
    cost: 100,
    tier: 1,
    description: "Enthusiastic beginners gaining experience.",
  },
  BARISTAS: {
    id: "baristas",
    name: "Skilled Baristas",
    baseIncome: 10,
    cost: 500,
    tier: 2,
    description: "Trained drink specialists.",
  },
  CHEFS: {
    id: "chefs",
    name: "Trained Chefs",
    baseIncome: 40,
    cost: 3000,
    tier: 3,
    description: "Professional kitchen staff.",
  },
  SUPERVISORS: {
    id: "supervisors",
    name: "Shift Supervisors",
    baseIncome: 160,
    cost: 18000,
    tier: 4,
    description: "Operational oversight.",
  },
  MANAGERS: {
    id: "managers",
    name: "Location Managers",
    baseIncome: 700,
    cost: 100000,
    tier: 5,
    description: "Store-level leadership.",
  },
  REGIONAL_LEADS: {
    id: "regional_leads",
    name: "Regional Directors",
    baseIncome: 3000,
    cost: 600000,
    tier: 6,
    description: "Regional coordination.",
  },
  NATIONAL_OPS: {
    id: "national_ops",
    name: "National Operations",
    baseIncome: 13000,
    cost: 3500000,
    tier: 7,
    description: "Country-wide logistics.",
  },
  DISTRIBUTION: {
    id: "distribution",
    name: "Distribution Centers",
    baseIncome: 60000,
    cost: 22000000,
    tier: 8,
    description: "Large-scale supply chain.",
  },
  GLOBAL_SUPPLY: {
    id: "global_supply",
    name: "Global Supply Chain",
    baseIncome: 250000,
    cost: 150000000,
    tier: 9,
    description: "International production.",
  },
  CORPORATE: {
    id: "corporate",
    name: "Corporate Headquarters",
    baseIncome: 1100000,
    cost: 1000000000,
    tier: 10,
    description: "Global corporate control.",
  },
} as const;

export type UpgradeKey = keyof GameState["upgrades"];

export type UpgradeCategory =
  | "production"
  | "quality"
  | "management"
  | "sales"
  | "operations"
  | "research";

export type UpgradeDefinition = {
  name: string;
  description: string;
  category: UpgradeCategory;
  baseCost: number;
  costMultiplier: number;
  effect: string;
};

export const UPGRADE_REGISTRY: Record<UpgradeKey, UpgradeDefinition> = {
  mixSpeed: {
    name: "Faster Blending",
    description: "Reduces blend time.",
    category: "production",
    baseCost: 250,
    costMultiplier: 2.1,
    effect: "-0.4s blend time",
  },
  marketingCampaign: {
    name: "Local Marketing",
    description: "Boosts income through awareness.",
    category: "sales",
    baseCost: 500,
    costMultiplier: 2.2,
    effect: "+8% income",
  },
  employeeTraining: {
    name: "Employee Training",
    description: "Improves output efficiency.",
    category: "management",
    baseCost: 1000,
    costMultiplier: 2.4,
    effect: "+6% output",
  },
  qualityControl: {
    name: "Quality Control",
    description: "Improves consistency.",
    category: "quality",
    baseCost: 5000,
    costMultiplier: 2.8,
    effect: "+quality bonus",
  },
  equipmentUpgrade: {
    name: "Equipment Upgrade",
    description: "Better production tools.",
    category: "production",
    baseCost: 20000,
    costMultiplier: 3.0,
    effect: "+efficiency",
  },
  heatControl: {
    name: "Heat Control",
    description: "More stable production.",
    category: "production",
    baseCost: 35000,
    costMultiplier: 3.2,
    effect: "+stability",
  },
  recipeDevelopment: {
    name: "Recipe Development",
    description: "Better formulas.",
    category: "research",
    baseCost: 80000,
    costMultiplier: 3.5,
    effect: "+quality scaling",
  },
  customBlending: {
    name: "Custom Blending",
    description: "Improves combo output.",
    category: "production",
    baseCost: 50000,
    costMultiplier: 3.0,
    effect: "+combo bonus",
  },
  bulkPurchasing: {
    name: "Bulk Purchasing",
    description: "Reduces costs.",
    category: "operations",
    baseCost: 25000,
    costMultiplier: 3.3,
    effect: "-cost reduction",
  },
  distributionNetwork: {
    name: "Distribution Network",
    description: "Improves scaling.",
    category: "management",
    baseCost: 75000,
    costMultiplier: 3.8,
    effect: "+efficiency",
  },
  portionSize: {
    name: "Bigger Cups",
    description: "Higher value output.",
    category: "production",
    baseCost: 12000,
    costMultiplier: 2.9,
    effect: "+value",
  },
  specialMastery: {
    name: "Specialty Mastery",
    description: "Enhances specials.",
    category: "quality",
    baseCost: 75000,
    costMultiplier: 3.6,
    effect: "+special boost",
  },
  ingredientQuality: {
    name: "Better Ingredients",
    description: "Improves base value.",
    category: "quality",
    baseCost: 65000,
    costMultiplier: 3.1,
    effect: "+base multiplier",
  },
  storefrontAppeal: {
    name: "Storefront Appeal",
    description: "Improves sales.",
    category: "sales",
    baseCost: 45000,
    costMultiplier: 2.7,
    effect: "+sales boost",
  },
  expansionNegotiation: {
    name: "Expansion Negotiation",
    description: "Reduces expansion cost.",
    category: "operations",
    baseCost: 45000,
    costMultiplier: 3.0,
    effect: "-expansion cost",
  },
  autoMixerTuning: {
    name: "Auto-Mixer Tuning",
    description: "Faster automation.",
    category: "production",
    baseCost: 30000,
    costMultiplier: 2.9,
    effect: "-cycle time",
  },
};

export const FLAVOR_REGISTRY = {
  [FlavorType.CHOCOLATE]: {
    type: FlavorType.CHOCOLATE,
    multiplier: 1,
    unlockCost: 0,
    color: "#3d2b1f",
    description: "The classic",
  },
  [FlavorType.VANILLA]: {
    type: FlavorType.VANILLA,
    multiplier: 1.5,
    unlockCost: 250,
    color: "#f3e5ab",
    description: "Simple and effective",
  },
  [FlavorType.STRAWBERRY]: {
    type: FlavorType.STRAWBERRY,
    multiplier: 2.2,
    unlockCost: 2000,
    color: "#ff4d6d",
    description: "Fruity",
  },
  [FlavorType.PINEAPPLE]: {
    type: FlavorType.PINEAPPLE,
    multiplier: 3.5,
    unlockCost: 15000,
    color: "#fbdf3c",
    description: "Tropical",
  },
  [FlavorType.MATCHA]: {
    type: FlavorType.MATCHA,
    multiplier: 6,
    unlockCost: 75000,
    color: "#95d5b2",
    description: "Zen",
  },
  [FlavorType.MINT]: {
    type: FlavorType.MINT,
    multiplier: 10,
    unlockCost: 350000,
    color: "#a7ffeb",
    description: "Cool",
  },
  [FlavorType.CARAMEL]: {
    type: FlavorType.CARAMEL,
    multiplier: 16,
    unlockCost: 1500000,
    color: "#bc6c25",
    description: "Sweet",
  },
  [FlavorType.MELON]: {
    type: FlavorType.MELON,
    multiplier: 25,
    unlockCost: 10000000,
    color: "#a7c957",
    description: "Fresh",
  },
  [FlavorType.COFFEE]: {
    type: FlavorType.COFFEE,
    multiplier: 40,
    unlockCost: 75000000,
    color: "#6f4e37",
    description: "Strong",
  },
  [FlavorType.COOKIES]: {
    type: FlavorType.COOKIES,
    multiplier: 70,
    unlockCost: 500000000,
    color: "#f8f9fa",
    description: "Rich",
  },
  [FlavorType.LAVA]: {
    type: FlavorType.LAVA,
    multiplier: 120,
    unlockCost: 2500000000,
    color: "#d00000",
    description: "Hot",
  },
  [FlavorType.STARDUST]: {
    type: FlavorType.STARDUST,
    multiplier: 250,
    unlockCost: 15000000000,
    color: "#48cae4",
    description: "Magical",
  },
  [FlavorType.DRAGON]: {
    type: FlavorType.DRAGON,
    multiplier: 600,
    unlockCost: 100000000000,
    color: "#ef233c",
    description: "Legendary",
  },
  [FlavorType.RAINBOW]: {
    type: FlavorType.RAINBOW,
    multiplier: 1500,
    unlockCost: 750000000000,
    color: "#ff006e",
    description: "All colors",
  },
  [FlavorType.VOID]: {
    type: FlavorType.VOID,
    multiplier: 4000,
    unlockCost: 5000000000000,
    color: "#10002b",
    description: "Empty",
  },
  [FlavorType.NEON]: {
    type: FlavorType.NEON,
    multiplier: 9000,
    unlockCost: 35000000000000,
    color: "#39ff14",
    description: "Glow",
  },
  [FlavorType.ELIXIR]: {
    type: FlavorType.ELIXIR,
    multiplier: 20000,
    unlockCost: 200000000000000,
    color: "#ffd700",
    description: "Gold",
  },
  [FlavorType.ULTIMATE]: {
    type: FlavorType.ULTIMATE,
    multiplier: 50000,
    unlockCost: 1000000000000000,
    color: "#ffffff",
    description: "Peak",
  },
  [FlavorType.CELESTIAL]: {
    type: FlavorType.CELESTIAL,
    multiplier: 120000,
    unlockCost: 10000000000000000,
    color: "#a29bfe",
    description: "Heavenly",
  },
  [FlavorType.PHOENIX]: {
    type: FlavorType.PHOENIX,
    multiplier: 300000,
    unlockCost: 100000000000000000,
    color: "#ff4500",
    description: "Rebirth",
  },
  [FlavorType.COSMIC]: {
    type: FlavorType.COSMIC,
    multiplier: 800000,
    unlockCost: 1000000000000000000,
    color: "#4b0082",
    description: "Universal",
  },
} as const;

export function getShopList(): Shop[] {
  return Object.values(SHOP_REGISTRY).map((shop) => ({
    id: shop.id,
    name: shop.name,
    count: 0,
    baseIncome: shop.baseIncome,
    cost: shop.cost,
  }));
}

export function getFlavorList(): Record<FlavorType, FlavorInfo> {
  return FLAVOR_REGISTRY as Record<FlavorType, FlavorInfo>;
}
