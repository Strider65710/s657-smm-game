/**
 * @license
 * All Rights Reserved.
 */

import type { LucideIcon } from "lucide-react";
import {
  Milk,
  Palette,
  Zap,
  Star,
  Sparkles,
  Rocket,
  Trophy,
  Crown,
  RefreshCw,
  Coins,
  TrendingUp,
  Building2,
  Gem,
  Globe,
  Users,
  User,
  Layers,
  MapPin,
  Music,
  Plane,
  Moon,
  Award,
  Settings,
  Wrench,
  Bot,
  Calendar,
  CalendarDays,
  Store,
  Key,
  ShoppingBag,
  Shield,
  Megaphone,
  Smile,
  AlertTriangle,
  TrendingDown,
  Flame,
  Coffee,
  Leaf,
  Ghost,
  Snowflake,
  Timer,
  Heart,
  Cpu,
} from "lucide-react";
import { GameState, FlavorType } from "./types";
import { levelFromXp } from "./game/leveling";

export type AchievementReward =
  | { type: "money"; amount: number; label: string }
  | { type: "buff"; multiplier: number; duration: number; label: string };

/**
 * Achievement rewards are authored on a generous "raw" tier scale, then
 * balanced at grant/display time by the helpers below. This keeps the economy
 * grounded without hand-editing every entry.
 */

/**
 * Compress a raw cash reward with a 1.4th root, then round to a clean step
 * (nearest 5 for small payouts, nearest 10 once it grows). Achievements should
 * be a nudge, not a jackpot.
 */
export function scaleAchievementMoney(rawAmount: number): number {
  const raw = Math.max(0, Number(rawAmount) || 0);
  if (raw <= 0) return 0;
  const compressed = Math.pow(raw, 1 / 1.4);
  const step = compressed < 100 ? 5 : 10;
  return Math.max(step, Math.round(compressed / step) * step);
}

/**
 * Map a raw buff tier (historically 2×–100×) into a tame 1.1×–2.0× window and
 * shorten its duration. Returns the balanced values plus a fresh label.
 */
export function scaleAchievementBuff(
  rawMultiplier: number,
  rawDuration: number,
): { multiplier: number; duration: number; label: string } {
  const rawM = Math.max(1.01, Number(rawMultiplier) || 1);
  const minM = 1.1;
  const maxM = 2.0;
  const lo = Math.log(2);
  const hi = Math.log(100);
  const t = Math.min(1, Math.max(0, (Math.log(rawM) - lo) / (hi - lo)));
  // Round to the nearest 0.05 for tidy labels.
  const multiplier = Math.min(
    maxM,
    Math.max(minM, Math.round((minM + (maxM - minM) * t) * 20) / 20),
  );
  const duration = Math.min(
    45,
    Math.max(15, Math.round((Number(rawDuration) || 30) * 0.4)),
  );
  const multLabel = Number.isInteger(multiplier)
    ? `${multiplier}×`
    : `${multiplier.toFixed(2).replace(/0$/, "")}×`;
  return { multiplier, duration, label: `${multLabel} income for ${duration}s` };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category:
    | "shakes"
    | "money"
    | "employees"
    | "shops"
    | "flavors"
    | "countries"
    | "specials"
    | "upgrades"
    | "time"
    | "misc"
    | "combos"
    | "events"
    | "legend"
    | "secrets"
    | "quirks"
    | "levels";
  reward?: AchievementReward;
  check: (
    state: GameState,
    derived: { employees: number; shopExtensions: number },
  ) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  // === MILKSHAKE MILESTONES ===
  {
    id: "first_shake",
    name: "Novice Blender",
    description: "Blend your very first milkshake manually.",
    icon: Milk,
    category: "shakes",
    check: (s) => s.totalStats.totalMilkshakes >= 1,
  },
  {
    id: "shakes_10",
    name: "Getting the Hang of It",
    description: "Blend 10 milkshakes.",
    icon: Milk,
    category: "shakes",
    reward: { type: "money", amount: 10, label: "+$10" },
    check: (s) => s.totalStats.totalMilkshakes >= 10,
  },
  {
    id: "shakes_50",
    name: "Shake Trainee",
    description: "Blend 50 milkshakes.",
    icon: Milk,
    category: "shakes",
    reward: { type: "money", amount: 50, label: "+$50" },
    check: (s) => s.totalStats.totalMilkshakes >= 50,
  },
  {
    id: "shakes_100",
    name: "Shake Artist",
    description: "Blend 100 milkshakes.",
    icon: Palette,
    category: "shakes",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 30,
      label: "2× income for 30s",
    },
    check: (s) => s.totalStats.totalMilkshakes >= 100,
  },
  {
    id: "shakes_500",
    name: "Dedicated Blender",
    description: "Blend 500 milkshakes.",
    icon: Zap,
    category: "shakes",
    reward: { type: "money", amount: 1_000, label: "+$1,000" },
    check: (s) => s.totalStats.totalMilkshakes >= 500,
  },
  {
    id: "shakes_1000",
    name: "Shake Veteran",
    description: "Blend 1,000 milkshakes.",
    icon: Star,
    category: "shakes",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 60,
      label: "2× income for 60s",
    },
    check: (s) => s.totalStats.totalMilkshakes >= 1_000,
  },
  {
    id: "shakes_5000",
    name: "Shake Master",
    description: "Blend 5,000 milkshakes.",
    icon: Sparkles,
    category: "shakes",
    reward: { type: "money", amount: 25_000, label: "+$25,000" },
    check: (s) => s.totalStats.totalMilkshakes >= 5_000,
  },
  {
    id: "shakes_10000",
    name: "Unstoppable",
    description: "Blend 10,000 milkshakes.",
    icon: Rocket,
    category: "shakes",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) => s.totalStats.totalMilkshakes >= 10_000,
  },
  {
    id: "shakes_20000",
    name: "Shake Legend",
    description: "Blend 20,000 milkshakes.",
    icon: Trophy,
    category: "shakes",
    reward: { type: "money", amount: 250_000, label: "+$250,000" },
    check: (s) => s.totalStats.totalMilkshakes >= 20_000,
  },
  {
    id: "shakes_50000",
    name: "Shake Titan",
    description: "Blend 50,000 milkshakes.",
    icon: Zap,
    category: "shakes",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 120,
      label: "5× income for 120s",
    },
    check: (s) => s.totalStats.totalMilkshakes >= 50_000,
  },
  {
    id: "shakes_100000",
    name: "Shake God",
    description: "Blend 100,000 milkshakes.",
    icon: Crown,
    category: "shakes",
    reward: { type: "money", amount: 2_500_000, label: "+$2,500,000" },
    check: (s) => s.totalStats.totalMilkshakes >= 100_000,
  },
  {
    id: "shakes_500000",
    name: "Transcendent",
    description: "Blend 500,000 milkshakes.",
    icon: Globe,
    category: "shakes",
    reward: {
      type: "buff",
      multiplier: 10,
      duration: 60,
      label: "10× income for 60s",
    },
    check: (s) => s.totalStats.totalMilkshakes >= 500_000,
  },
  {
    id: "shakes_1000000",
    name: "Infinite Blender",
    description:
      "Blend 1,000,000 milkshakes. You are beyond mortal comprehension.",
    icon: RefreshCw,
    category: "shakes",
    reward: {
      type: "buff",
      multiplier: 50,
      duration: 30,
      label: "50× income for 30s",
    },
    check: (s) => s.totalStats.totalMilkshakes >= 1_000_000,
  },
  {
    id: "shakes_250000",
    name: "Shakeaholic",
    description: "Blend 250,000 milkshakes. No cure in sight.",
    icon: Zap,
    category: "shakes",
    reward: {
      type: "buff",
      multiplier: 7,
      duration: 60,
      label: "7× income for 60s",
    },
    check: (s) => s.totalStats.totalMilkshakes >= 250_000,
  },
  {
    id: "shakes_2000000",
    name: "Industrial Blender",
    description: "Blend 2,000,000 milkshakes. You need a factory.",
    icon: Building2,
    category: "shakes",
    reward: {
      type: "buff",
      multiplier: 20,
      duration: 60,
      label: "20× income for 60s",
    },
    check: (s) => s.totalStats.totalMilkshakes >= 2_000_000,
  },
  {
    id: "shakes_5000000",
    name: "Shake Factory",
    description: "Blend 5,000,000 milkshakes. The planet drinks your shakes.",
    icon: Layers,
    category: "shakes",
    reward: {
      type: "buff",
      multiplier: 35,
      duration: 60,
      label: "35× income for 60s",
    },
    check: (s) => s.totalStats.totalMilkshakes >= 5_000_000,
  },
  {
    id: "shakes_10000000",
    name: "God of Shakes",
    description: "Blend 10,000,000 milkshakes. Reality bows to you.",
    icon: Sparkles,
    category: "shakes",
    reward: {
      type: "buff",
      multiplier: 50,
      duration: 60,
      label: "50× income for 60s",
    },
    check: (s) => s.totalStats.totalMilkshakes >= 10_000_000,
  },

  // === MONEY MILESTONES ===
  {
    id: "money_100",
    name: "First C-Note",
    description: "Have $100 in the bank.",
    icon: Coins,
    category: "money",
    reward: { type: "money", amount: 15, label: "+$15" },
    check: (s) => s.money >= 100,
  },
  {
    id: "money_500",
    name: "Coffee Can Savings",
    description: "Have $500 in the bank.",
    icon: Coins,
    category: "money",
    reward: { type: "money", amount: 50, label: "+$50" },
    check: (s) => s.money >= 500,
  },
  {
    id: "money_1000",
    name: "Pocket Money",
    description: "Have $1,000 in the bank.",
    icon: Coins,
    category: "money",
    reward: { type: "money", amount: 100, label: "+$100" },
    check: (s) => s.money >= 1_000,
  },
  {
    id: "money_5000",
    name: "Decent Stash",
    description: "Have $5,000 in the bank.",
    icon: Coins,
    category: "money",
    reward: { type: "money", amount: 500, label: "+$500" },
    check: (s) => s.money >= 5_000,
  },
  {
    id: "money_10000",
    name: "Small Business Owner",
    description: "Have $10,000 in the bank.",
    icon: Building2,
    category: "money",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 30,
      label: "2× income for 30s",
    },
    check: (s) => s.money >= 10_000,
  },
  {
    id: "money_50000",
    name: "Getting Rich",
    description: "Have $50,000 in the bank.",
    icon: TrendingUp,
    category: "money",
    reward: { type: "money", amount: 2_500, label: "+$2,500" },
    check: (s) => s.money >= 50_000,
  },
  {
    id: "money_100000",
    name: "Entrepreneur",
    description: "Have $100,000 in the bank.",
    icon: TrendingUp,
    category: "money",
    reward: { type: "money", amount: 5_000, label: "+$5,000" },
    check: (s) => s.money >= 100_000,
  },
  {
    id: "money_500k",
    name: "Half a Million",
    description: "Have $500,000 in the bank.",
    icon: Gem,
    category: "money",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 60,
      label: "2× income for 60s",
    },
    check: (s) => s.money >= 500_000,
  },
  {
    id: "money_1m",
    name: "Millionaire",
    description: "Have $1,000,000 in the bank.",
    icon: Gem,
    category: "money",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) => s.money >= 1_000_000,
  },
  {
    id: "money_10m",
    name: "Wall Street",
    description: "Have $10,000,000 in the bank.",
    icon: TrendingUp,
    category: "money",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 90,
      label: "3× income for 90s",
    },
    check: (s) => s.money >= 10_000_000,
  },
  {
    id: "money_100m",
    name: "Hedge Fund",
    description: "Have $100,000,000 in the bank.",
    icon: Gem,
    category: "money",
    reward: {
      type: "buff",
      multiplier: 4,
      duration: 120,
      label: "4× income for 120s",
    },
    check: (s) => s.money >= 100_000_000,
  },
  {
    id: "money_1b",
    name: "Billionaire",
    description: "Have $1,000,000,000 in the bank.",
    icon: Gem,
    category: "money",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 120,
      label: "3× income for 120s",
    },
    check: (s) => s.money >= 1_000_000_000,
  },
  {
    id: "money_10b",
    name: "Tech Mogul",
    description: "Have $10 billion in the bank.",
    icon: Cpu,
    category: "money",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 120,
      label: "5× income for 120s",
    },
    check: (s) => s.money >= 10_000_000_000,
  },
  {
    id: "money_1t",
    name: "Trillionaire",
    description: "Have $1 trillion in the bank.",
    icon: Star,
    category: "money",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 120,
      label: "5× income for 120s",
    },
    check: (s) => s.money >= 1_000_000_000_000,
  },
  {
    id: "money_1q",
    name: "Quadrillionaire",
    description: "Have $1 quadrillion in the bank.",
    icon: Globe,
    category: "money",
    reward: {
      type: "buff",
      multiplier: 10,
      duration: 120,
      label: "10× income for 120s",
    },
    check: (s) => s.money >= 1_000_000_000_000_000,
  },
  {
    id: "money_1qt",
    name: "Quintillionaire",
    description: "Have $1 quintillion in the bank. The economy is yours.",
    icon: Sparkles,
    category: "money",
    reward: {
      type: "buff",
      multiplier: 100,
      duration: 60,
      label: "100× income for 60s",
    },
    check: (s) => s.money >= 1_000_000_000_000_000_000,
  },

  // === EMPLOYEES ===
  {
    id: "first_employee",
    name: "First Hire",
    description: "Hire your first employee.",
    icon: User,
    category: "employees",
    reward: { type: "money", amount: 50, label: "+$50" },
    check: (_s, d) => d.employees >= 1,
  },
  {
    id: "employees_5",
    name: "Growing Team",
    description: "Have 5 employees on staff.",
    icon: Users,
    category: "employees",
    reward: { type: "money", amount: 500, label: "+$500" },
    check: (_s, d) => d.employees >= 5,
  },
  {
    id: "employees_10",
    name: "Staff Meeting",
    description: "Have 10 employees on staff.",
    icon: Users,
    category: "employees",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 30,
      label: "2× income for 30s",
    },
    check: (_s, d) => d.employees >= 10,
  },
  {
    id: "employees_25",
    name: "Middle Management",
    description: "Have 25 employees on staff.",
    icon: Building2,
    category: "employees",
    reward: { type: "money", amount: 25_000, label: "+$25,000" },
    check: (_s, d) => d.employees >= 25,
  },
  {
    id: "employees_50",
    name: "Corporate HQ",
    description: "Have 50 employees on staff.",
    icon: Building2,
    category: "employees",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (_s, d) => d.employees >= 50,
  },
  {
    id: "employees_100",
    name: "Factory Floor",
    description: "Have 100 employees on staff.",
    icon: Layers,
    category: "employees",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 60,
      label: "5× income for 60s",
    },
    check: (_s, d) => d.employees >= 100,
  },
  {
    id: "employees_200",
    name: "Workforce Army",
    description: "Have 200 employees on staff.",
    icon: Shield,
    category: "employees",
    reward: {
      type: "buff",
      multiplier: 10,
      duration: 120,
      label: "10× income for 120s",
    },
    check: (_s, d) => d.employees >= 200,
  },
  {
    id: "employees_500",
    name: "Mega Corporation",
    description: "Have 500 employees on staff.",
    icon: Building2,
    category: "employees",
    reward: {
      type: "buff",
      multiplier: 15,
      duration: 120,
      label: "15× income for 120s",
    },
    check: (_s, d) => d.employees >= 500,
  },
  {
    id: "employees_1000",
    name: "Milkshake Nation",
    description: "Have 1,000 employees on staff. You're basically a country.",
    icon: Globe,
    category: "employees",
    reward: {
      type: "buff",
      multiplier: 25,
      duration: 120,
      label: "25× income for 120s",
    },
    check: (_s, d) => d.employees >= 1_000,
  },
  {
    id: "employees_2000",
    name: "Workforce Leviathan",
    description: "Have 2,000 employees. The milkshake empire never sleeps.",
    icon: Crown,
    category: "employees",
    reward: {
      type: "buff",
      multiplier: 20,
      duration: 120,
      label: "20× income for 120s",
    },
    check: (_s, d) => d.employees >= 2_000,
  },

  // === SHOP EXTENSIONS ===
  {
    id: "first_shop",
    name: "Grand Opening",
    description: "Buy your first shop extension.",
    icon: Store,
    category: "shops",
    reward: { type: "money", amount: 100, label: "+$100" },
    check: (_s, d) => d.shopExtensions >= 1,
  },
  {
    id: "shops_5",
    name: "Expanding",
    description: "Have 5 shop extensions.",
    icon: Key,
    category: "shops",
    reward: { type: "money", amount: 2_000, label: "+$2,000" },
    check: (_s, d) => d.shopExtensions >= 5,
  },
  {
    id: "shops_10",
    name: "Chain Store",
    description: "Have 10 shop extensions.",
    icon: Layers,
    category: "shops",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 30,
      label: "3× income for 30s",
    },
    check: (_s, d) => d.shopExtensions >= 10,
  },
  {
    id: "shops_25",
    name: "Mall Empire",
    description: "Have 25 shop extensions.",
    icon: ShoppingBag,
    category: "shops",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 60,
      label: "5× income for 60s",
    },
    check: (_s, d) => d.shopExtensions >= 25,
  },
  {
    id: "shops_50",
    name: "Mega Chain",
    description: "Have 50 shop extensions.",
    icon: MapPin,
    category: "shops",
    reward: { type: "money", amount: 1_500_000, label: "+$1,500,000" },
    check: (_s, d) => d.shopExtensions >= 50,
  },
  {
    id: "shops_100",
    name: "Real Estate Mogul",
    description: "Have 100 shop extensions.",
    icon: Building2,
    category: "shops",
    reward: {
      type: "buff",
      multiplier: 10,
      duration: 120,
      label: "10× income for 120s",
    },
    check: (_s, d) => d.shopExtensions >= 100,
  },
  {
    id: "shops_200",
    name: "Property Baron",
    description: "Have 200 shop extensions. You own half the city.",
    icon: Layers,
    category: "shops",
    reward: {
      type: "buff",
      multiplier: 20,
      duration: 120,
      label: "20× income for 120s",
    },
    check: (_s, d) => d.shopExtensions >= 200,
  },
  {
    id: "shops_500",
    name: "Commercial Empire",
    description: "Have 500 shop extensions. No building is safe.",
    icon: Crown,
    category: "shops",
    reward: {
      type: "buff",
      multiplier: 20,
      duration: 120,
      label: "20× income for 120s",
    },
    check: (_s, d) => d.shopExtensions >= 500,
  },

  // === FLAVORS ===
  {
    id: "flavor_2",
    name: "Flavor Curious",
    description: "Unlock your second flavor.",
    icon: Milk,
    category: "flavors",
    reward: { type: "money", amount: 150, label: "+$150" },
    check: (s) => s.unlockedFlavors.length >= 2,
  },
  {
    id: "flavors_5",
    name: "Flavor Explorer",
    description: "Unlock 5 flavors.",
    icon: Palette,
    category: "flavors",
    reward: { type: "money", amount: 2_500, label: "+$2,500" },
    check: (s) => s.unlockedFlavors.length >= 5,
  },
  {
    id: "flavors_10",
    name: "Taste Connoisseur",
    description: "Unlock 10 flavors.",
    icon: Smile,
    category: "flavors",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) => s.unlockedFlavors.length >= 10,
  },
  {
    id: "flavors_15",
    name: "Flavor Maestro",
    description: "Unlock 15 flavors.",
    icon: Music,
    category: "flavors",
    reward: { type: "money", amount: 200_000, label: "+$200,000" },
    check: (s) => s.unlockedFlavors.length >= 15,
  },
  {
    id: "flavors_20",
    name: "Flavor Virtuoso",
    description: "Unlock 20 flavors.",
    icon: Sparkles,
    category: "flavors",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 120,
      label: "5× income for 120s",
    },
    check: (s) => s.unlockedFlavors.length >= 20,
  },
  {
    id: "all_flavors",
    name: "Flavor Legend",
    description:
      "Unlock all 25 flavors. You've tasted everything the universe has to offer.",
    icon: Crown,
    category: "flavors",
    reward: {
      type: "buff",
      multiplier: 10,
      duration: 120,
      label: "10× income for 120s",
    },
    check: (s) => s.unlockedFlavors.length >= 25,
  },

  // === COUNTRIES ===
  {
    id: "first_country",
    name: "Going Global",
    description: "Expand your empire to a new country.",
    icon: Plane,
    category: "countries",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 30,
      label: "2× income for 30s",
    },
    check: (s) => s.unlockedCountries.length >= 1,
  },
  {
    id: "countries_3",
    name: "World Tour",
    description: "Expand to 3 countries.",
    icon: MapPin,
    category: "countries",
    reward: { type: "money", amount: 20_000, label: "+$20,000" },
    check: (s) => s.unlockedCountries.length >= 3,
  },
  {
    id: "countries_5",
    name: "Continental",
    description: "Expand to 5 countries.",
    icon: Globe,
    category: "countries",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) => s.unlockedCountries.length >= 5,
  },
  {
    id: "countries_10",
    name: "Global Empire",
    description: "Expand to 10 countries.",
    icon: Globe,
    category: "countries",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 120,
      label: "5× income for 120s",
    },
    check: (s) => s.unlockedCountries.length >= 10,
  },
  {
    id: "countries_15",
    name: "World Conqueror",
    description: "Expand to 15 countries.",
    icon: Crown,
    category: "countries",
    reward: {
      type: "buff",
      multiplier: 10,
      duration: 120,
      label: "10× income for 120s",
    },
    check: (s) => s.unlockedCountries.length >= 15,
  },
  {
    id: "moon",
    name: "Moonshot",
    description:
      "Reach the Moon. One small shake for man, one giant empire for mankind.",
    icon: Moon,
    category: "countries",
    reward: { type: "money", amount: 5_000_000, label: "+$5,000,000" },
    check: (s) => s.unlockedCountries.includes("moon"),
  },
  {
    id: "all_countries",
    name: "World Domination",
    description: "Unlock every country. The whole planet sips your shakes.",
    icon: Globe,
    category: "countries",
    reward: {
      type: "buff",
      multiplier: 20,
      duration: 120,
      label: "20× income for 120s",
    },
    check: (s) => s.unlockedCountries.length >= 34,
  },

  // === SPECIAL OUTCOMES ===
  {
    id: "first_golden",
    name: "Golden Touch",
    description: "Get your first Golden milkshake.",
    icon: Sparkles,
    category: "specials",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 30,
      label: "2× income for 30s",
    },
    check: (s) => s.totalStats.totalGolden >= 1,
  },
  {
    id: "golden_10",
    name: "Midas Mode",
    description: "Get 10 Golden milkshakes.",
    icon: Trophy,
    category: "specials",
    reward: { type: "money", amount: 15_000, label: "+$15,000" },
    check: (s) => s.totalStats.totalGolden >= 10,
  },
  {
    id: "golden_100",
    name: "Gold Rush",
    description: "Get 100 Golden milkshakes.",
    icon: Award,
    category: "specials",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) => s.totalStats.totalGolden >= 100,
  },
  {
    id: "golden_500",
    name: "Fort Knox Blend",
    description: "Get 500 Golden milkshakes. You're basically printing gold.",
    icon: Star,
    category: "specials",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 90,
      label: "5× income for 90s",
    },
    check: (s) => s.totalStats.totalGolden >= 500,
  },
  {
    id: "golden_1000",
    name: "Gold Sovereign",
    description: "Get 1,000 Golden milkshakes.",
    icon: Crown,
    category: "specials",
    reward: {
      type: "buff",
      multiplier: 10,
      duration: 60,
      label: "10× income for 60s",
    },
    check: (s) => s.totalStats.totalGolden >= 1_000,
  },
  {
    id: "first_decorated",
    name: "Artisan",
    description: "Get your first Decorated milkshake.",
    icon: Palette,
    category: "specials",
    reward: { type: "money", amount: 500, label: "+$500" },
    check: (s) => s.totalStats.totalDecorated >= 1,
  },
  {
    id: "decorated_50",
    name: "Decorator",
    description: "Get 50 Decorated milkshakes.",
    icon: Layers,
    category: "specials",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 30,
      label: "3× income for 30s",
    },
    check: (s) => s.totalStats.totalDecorated >= 50,
  },
  {
    id: "decorated_200",
    name: "Master Decorator",
    description: "Get 200 Decorated milkshakes. Each one a masterpiece.",
    icon: Award,
    category: "specials",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 60,
      label: "5× income for 60s",
    },
    check: (s) => s.totalStats.totalDecorated >= 200,
  },
  {
    id: "first_swirled",
    name: "Spiral Expert",
    description: "Get your first Swirled milkshake.",
    icon: RefreshCw,
    category: "specials",
    reward: { type: "money", amount: 250, label: "+$250" },
    check: (s) => s.totalStats.totalSwirled >= 1,
  },
  {
    id: "swirled_25",
    name: "Swirl Champ",
    description: "Get 25 Swirled milkshakes.",
    icon: Zap,
    category: "specials",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 60,
      label: "2× income for 60s",
    },
    check: (s) => s.totalStats.totalSwirled >= 25,
  },
  {
    id: "swirled_100",
    name: "Swirl Addict",
    description: "Get 100 Swirled milkshakes. The spin never stops.",
    icon: RefreshCw,
    category: "specials",
    reward: {
      type: "buff",
      multiplier: 4,
      duration: 60,
      label: "4× income for 60s",
    },
    check: (s) => s.totalStats.totalSwirled >= 100,
  },
  {
    id: "swirled_250",
    name: "Swirl Dynasty",
    description: "Get 250 Swirled milkshakes.",
    icon: Sparkles,
    category: "specials",
    reward: {
      type: "buff",
      multiplier: 6,
      duration: 90,
      label: "6× income for 90s",
    },
    check: (s) => s.totalStats.totalSwirled >= 250,
  },
  {
    id: "fan_100",
    name: "Fan Club",
    description: "Get 100 Fan Favorite blends.",
    icon: Star,
    category: "specials",
    reward: { type: "money", amount: 2_000, label: "+$2,000" },
    check: (s) => s.totalStats.totalFanFavorite >= 100,
  },
  {
    id: "fan_1000",
    name: "Superfan",
    description: "Get 1,000 Fan Favorite blends.",
    icon: Megaphone,
    category: "specials",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) => s.totalStats.totalFanFavorite >= 1_000,
  },
  {
    id: "fan_5000",
    name: "Cult Following",
    description: "Get 5,000 Fan Favorite blends. You have loyal disciples.",
    icon: Users,
    category: "specials",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 90,
      label: "5× income for 90s",
    },
    check: (s) => s.totalStats.totalFanFavorite >= 5_000,
  },
  {
    id: "creamy_100",
    name: "Smooth Operator",
    description: "Get 100 Creamy blends.",
    icon: Milk,
    category: "specials",
    reward: { type: "money", amount: 1_000, label: "+$1,000" },
    check: (s) => s.totalStats.totalCreamy >= 100,
  },
  {
    id: "creamy_500",
    name: "Cream Dream",
    description: "Get 500 Creamy blends. Impossibly smooth.",
    icon: Sparkles,
    category: "specials",
    reward: {
      type: "buff",
      multiplier: 4,
      duration: 60,
      label: "4× income for 60s",
    },
    check: (s) => s.totalStats.totalCreamy >= 500,
  },
  {
    id: "baked_100",
    name: "Hot Oven",
    description: "Get 100 Baked milkshakes.",
    icon: Flame,
    category: "specials",
    reward: { type: "money", amount: 5_000, label: "+$5,000" },
    check: (s) => s.totalStats.totalBaked >= 100,
  },
  {
    id: "baked_250",
    name: "Perpetual Baker",
    description: "Get 250 Baked milkshakes.",
    icon: Flame,
    category: "specials",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 60,
      label: "5× income for 60s",
    },
    check: (s) => s.totalStats.totalBaked >= 250,
  },

  // === UPGRADES / PROGRESSION ===
  {
    id: "first_upgrade",
    name: "Innovator",
    description: "Purchase your first upgrade.",
    icon: Wrench,
    category: "upgrades",
    reward: { type: "money", amount: 100, label: "+$100" },
    check: (s) => Object.values(s.upgrades).some((v) => v > 0),
  },
  {
    id: "upgrades_10_total",
    name: "Tinkerer",
    description: "Accumulate 10 total upgrade levels.",
    icon: Settings,
    category: "upgrades",
    reward: { type: "money", amount: 750, label: "+$750" },
    check: (s) => Object.values(s.upgrades).reduce((a, b) => a + b, 0) >= 10,
  },
  {
    id: "upgrades_50_total",
    name: "Mad Scientist",
    description: "Accumulate 50 total upgrade levels.",
    icon: Zap,
    category: "upgrades",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) => Object.values(s.upgrades).reduce((a, b) => a + b, 0) >= 50,
  },
  {
    id: "upgrades_100_total",
    name: "Overclock",
    description: "Accumulate 100 total upgrade levels.",
    icon: Cpu,
    category: "upgrades",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 90,
      label: "5× income for 90s",
    },
    check: (s) => Object.values(s.upgrades).reduce((a, b) => a + b, 0) >= 100,
  },
  {
    id: "upgrades_200_total",
    name: "Singularity",
    description: "Accumulate 200 total upgrade levels. Near max.",
    icon: Sparkles,
    category: "upgrades",
    reward: {
      type: "buff",
      multiplier: 15,
      duration: 120,
      label: "15× income for 120s",
    },
    check: (s) => Object.values(s.upgrades).reduce((a, b) => a + b, 0) >= 200,
  },
  {
    id: "mix_speed_5",
    name: "Speed Blender",
    description: "Reach Mix Speed level 5.",
    icon: Zap,
    category: "upgrades",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 30,
      label: "2× income for 30s",
    },
    check: (s) => s.upgrades.mixSpeed >= 5,
  },
  {
    id: "marketing_5",
    name: "Brand Builder",
    description: "Reach Marketing Campaign level 5.",
    icon: TrendingUp,
    category: "upgrades",
    reward: { type: "money", amount: 8_000, label: "+$8,000" },
    check: (s) => s.upgrades.marketingCampaign >= 5,
  },
  {
    id: "automix",
    name: "Automation Nation",
    description: "Enable the Auto-Mixer.",
    icon: Bot,
    category: "upgrades",
    reward: { type: "money", amount: 200, label: "+$200" },
    check: (s) => s.options.autoMix,
  },
  {
    id: "all_upgrades_1",
    name: "Full Toolkit",
    description: "Purchase at least 1 level in every single upgrade.",
    icon: Wrench,
    category: "upgrades",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 120,
      label: "5× income for 120s",
    },
    check: (s) => Object.values(s.upgrades).every((v) => v >= 1),
  },
  {
    id: "all_upgrades_5",
    name: "Full Upgrade Tree",
    description:
      "Reach level 5 in every major upgrade (excludes limited-tier unlocks).",
    icon: Trophy,
    category: "upgrades",
    reward: {
      type: "buff",
      multiplier: 20,
      duration: 120,
      label: "20× income for 120s",
    },
    check: (s) => {
      const { flavorSlots: _fs, goldenTouch: _gt, doubleShot: _ds, speedBlending: _sb, ...rest } = s.upgrades;
      return Object.values(rest).every((v) => v >= 5);
    },
  },

  // === GAME DAYS / TIME (1 real second ≈ 1 game day) ===
  {
    id: "days_180",
    name: "Half a Year",
    description: "Keep the blenders running for six months (180 game days).",
    icon: CalendarDays,
    category: "time",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 30,
      label: "2× income for 30s",
    },
    check: (s) => s.gameDays >= 180,
  },
  {
    id: "days_365",
    name: "One Year Strong",
    description: "Celebrate your first full year (365 game days).",
    icon: CalendarDays,
    category: "time",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 60,
      label: "5× income for 60s",
    },
    check: (s) => s.gameDays >= 365,
  },
  {
    id: "days_730",
    name: "Two-Year Veteran",
    description: "Stay in business for two years (730 game days).",
    icon: Award,
    category: "time",
    reward: {
      type: "buff",
      multiplier: 8,
      duration: 60,
      label: "8× income for 60s",
    },
    check: (s) => s.gameDays >= 730,
  },
  {
    id: "days_1825",
    name: "Five-Year Plan",
    description: "Survive five years of milkshake mania (1,825 game days).",
    icon: Timer,
    category: "time",
    reward: {
      type: "buff",
      multiplier: 12,
      duration: 90,
      label: "12× income for 90s",
    },
    check: (s) => s.gameDays >= 1_825,
  },
  {
    id: "days_3650",
    name: "A Decade of Shakes",
    description: "Reach ten years in business (3,650 game days).",
    icon: Crown,
    category: "time",
    reward: {
      type: "buff",
      multiplier: 20,
      duration: 120,
      label: "20× income for 120s",
    },
    check: (s) => s.gameDays >= 3_650,
  },
  {
    id: "days_7300",
    name: "Twenty-Year Dynasty",
    description: "Two decades of blending (7,300 game days). A true legacy.",
    icon: Crown,
    category: "time",
    reward: {
      type: "buff",
      multiplier: 50,
      duration: 120,
      label: "50× income for 120s",
    },
    check: (s) => s.gameDays >= 7_300,
  },

  // === CRAZY SCENARIOS ===
  {
    id: "almost_bankrupt",
    name: "Almost Bankrupt",
    description: "Let your balance drop below $0. Taxes and payroll hit hard.",
    icon: AlertTriangle,
    category: "misc",
    reward: { type: "money", amount: 500, label: "+$500 sympathy bonus" },
    check: (s) => s.money < 0,
  },
  {
    id: "in_the_red",
    name: "In the Red",
    description:
      "Sink to -$1,000 or lower. Rock bottom tastes like a milkshake.",
    icon: TrendingDown,
    category: "misc",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 30,
      label: "2× income for 30s comeback boost",
    },
    check: (s) => s.money <= -1_000,
  },
  {
    id: "solo_act",
    name: "Solo Act",
    description:
      "Have 5+ shop extensions but zero employees. You do it all yourself.",
    icon: User,
    category: "misc",
    reward: { type: "money", amount: 1_000, label: "+$1,000" },
    check: (_s, d) => d.employees === 0 && d.shopExtensions >= 5,
  },
  {
    id: "special_collector",
    name: "Special Collector",
    description:
      "Get at least one of every special blend type: Golden, Decorated, Swirled, and Baked.",
    icon: Award,
    category: "misc",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) =>
      s.totalStats.totalGolden >= 1 &&
      s.totalStats.totalDecorated >= 1 &&
      s.totalStats.totalSwirled >= 1 &&
      s.totalStats.totalBaked >= 1,
  },
  {
    id: "flavor_maximalist",
    name: "True Connoisseur",
    description:
      "Unlock all 25 flavors and blend with 3 flavors active simultaneously.",
    icon: Sparkles,
    category: "misc",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 60,
      label: "5× income for 60s",
    },
    check: (s) => s.unlockedFlavors.length >= 25 && s.activeFlavors.length >= 3,
  },
  {
    id: "hot_streak",
    name: "Hot Streak",
    description: "Blend 500 Baked milkshakes. The oven never stops.",
    icon: Flame,
    category: "misc",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) => s.totalStats.totalBaked >= 500,
  },
  {
    id: "penny_saved",
    name: "Penny Pincher",
    description:
      "Blend 500 milkshakes while having less than $10 in the bank. Frugal excellence.",
    icon: Coins,
    category: "misc",
    reward: { type: "money", amount: 2_500, label: "+$2,500" },
    check: (s) => s.totalStats.totalMilkshakes >= 500 && s.money < 10,
  },
  {
    id: "flavor_trio",
    name: "Three's a Party",
    description: "Have 3 flavors active in the blender at the same time.",
    icon: Layers,
    category: "misc",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 30,
      label: "2× income for 30s",
    },
    check: (s) => s.activeFlavors.length >= 3,
  },
  {
    id: "buff_surfer",
    name: "Buff Surfer",
    description: "Have 2 active income buffs running simultaneously.",
    icon: Zap,
    category: "misc",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) => s.activeBuffs.length >= 2,
  },
  {
    id: "platinum_special",
    name: "Platinum Operator",
    description:
      "Accumulate 100+ of every special blend type: Golden, Decorated, Swirled, Fan Favorite, Creamy, and Baked.",
    icon: Trophy,
    category: "misc",
    reward: {
      type: "buff",
      multiplier: 8,
      duration: 120,
      label: "8× income for 120s",
    },
    check: (s) =>
      s.totalStats.totalGolden >= 100 &&
      s.totalStats.totalDecorated >= 100 &&
      s.totalStats.totalSwirled >= 100 &&
      s.totalStats.totalFanFavorite >= 100 &&
      s.totalStats.totalCreamy >= 100 &&
      s.totalStats.totalBaked >= 100,
  },
  {
    id: "cosmic_collector",
    name: "Cosmic Tier",
    description:
      "Unlock Phoenix Flame, Cosmic Wonder, Ultimate Essence, and Celestial Delight.",
    icon: Globe,
    category: "misc",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 90,
      label: "5× income for 90s",
    },
    check: (s) =>
      [
        FlavorType.PHOENIX,
        FlavorType.COSMIC,
        FlavorType.ULTIMATE,
        FlavorType.CELESTIAL,
      ].every((f) => s.unlockedFlavors.includes(f)),
  },
  {
    id: "neon_dreams",
    name: "Neon Dreams",
    description: "Unlock the Neon Sludge flavor. Questionable but profitable.",
    icon: Sparkles,
    category: "misc",
    reward: { type: "money", amount: 10_000, label: "+$10,000" },
    check: (s) => s.unlockedFlavors.includes(FlavorType.NEON),
  },
  {
    id: "void_walker",
    name: "Void Walker",
    description:
      "Add The Void to your active blender. Darkness tastes delicious.",
    icon: Zap,
    category: "misc",
    reward: { type: "money", amount: 15_000, label: "+$15,000" },
    check: (s) => s.activeFlavors.includes(FlavorType.VOID),
  },
  {
    id: "tax_champion",
    name: "Tax Champion",
    description:
      "Survive 10 full tax cycles (300 game days) without going under.",
    icon: Calendar,
    category: "misc",
    reward: {
      type: "buff",
      multiplier: 4,
      duration: 90,
      label: "4× income for 90s",
    },
    check: (s) => s.gameDays >= 300 && s.money >= 0,
  },
  {
    id: "heart_of_shakes",
    name: "Heart of Shakes",
    description:
      "Blend 1,000 milkshakes while having all 3 flavor slots active.",
    icon: Heart,
    category: "misc",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 60,
      label: "5× income for 60s",
    },
    check: (s) =>
      s.totalStats.totalMilkshakes >= 1_000 && s.activeFlavors.length >= 3,
  },

  // === RANDOM EVENTS ===
  {
    id: "event_first",
    name: "Out of the Blue",
    description: "Survive your first random event. Business is unpredictable.",
    icon: AlertTriangle,
    category: "events",
    reward: { type: "money", amount: 500, label: "+$500" },
    check: (s) =>
      s.eventStats.totalChoiceEvents + s.eventStats.totalAutoEvents >= 1,
  },
  {
    id: "event_5",
    name: "Expect the Unexpected",
    description: "Survive 5 random events. You've seen some things.",
    icon: Zap,
    category: "events",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 30,
      label: "2× income for 30s",
    },
    check: (s) =>
      s.eventStats.totalChoiceEvents + s.eventStats.totalAutoEvents >= 5,
  },
  {
    id: "event_15",
    name: "Nothing Surprises Me",
    description: "Survive 15 random events. At this point you just roll with it.",
    icon: Shield,
    category: "events",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) =>
      s.eventStats.totalChoiceEvents + s.eventStats.totalAutoEvents >= 15,
  },
  {
    id: "event_fine_paid",
    name: "Keep It Legal",
    description: "Pay a health inspector's fine without arguing. Better safe than sorry.",
    icon: Shield,
    category: "events",
    reward: { type: "money", amount: 1_000, label: "+$1,000" },
    check: (s) => s.eventStats.finesPaid >= 1,
  },
  {
    id: "event_fine_3",
    name: "Repeat Offender",
    description: "Pay the health inspector fine 3 separate times. Invest in cleanliness.",
    icon: AlertTriangle,
    category: "events",
    reward: { type: "money", amount: 5_000, label: "+$5,000" },
    check: (s) => s.eventStats.finesPaid >= 3,
  },
  {
    id: "event_gambled",
    name: "Rolling the Dice",
    description: "Gamble on a health inspection instead of paying. Bold strategy.",
    icon: Star,
    category: "events",
    reward: { type: "money", amount: 750, label: "+$750" },
    check: (s) => s.eventStats.inspectionsGambled >= 1,
  },
  {
    id: "event_viral",
    name: "Influencer Mode",
    description: "Invest in a TikTok viral campaign. The algorithm is your friend.",
    icon: TrendingUp,
    category: "events",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 30,
      label: "2× income for 30s",
    },
    check: (s) => s.eventStats.viralInvestments >= 1,
  },
  {
    id: "event_viral_3",
    name: "Serial Influencer",
    description: "Invest in 3 TikTok viral campaigns. You live on the timeline.",
    icon: Megaphone,
    category: "events",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) => s.eventStats.viralInvestments >= 3,
  },
  {
    id: "event_repaired",
    name: "Maintenance Crew",
    description: "Professionally repair the blender 3 times. You keep things running.",
    icon: Wrench,
    category: "events",
    reward: { type: "money", amount: 2_500, label: "+$2,500" },
    check: (s) => s.eventStats.blendersRepaired >= 3,
  },
  {
    id: "event_auto_5",
    name: "Eyes on the Market",
    description: "Experience 5 passive market events. The world watches your shakes.",
    icon: Globe,
    category: "events",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 45,
      label: "2× income for 45s",
    },
    check: (s) => s.eventStats.totalAutoEvents >= 5,
  },
  // === ACHIEVEMENT MILESTONES ===
  {
    id: "ach_5",
    name: "Getting Started",
    description: "Earn 5 achievements. You've got the hang of it.",
    icon: Trophy,
    category: "misc",
    reward: { type: "money", amount: 500, label: "+$500" },
    check: (s) => s.earnedAchievements.length >= 5,
  },
  {
    id: "ach_10",
    name: "Achievement Hunter",
    description: "Earn 10 achievements. The completionist in you is awakening.",
    icon: Trophy,
    category: "misc",
    reward: { type: "money", amount: 2_000, label: "+$2,000" },
    check: (s) => s.earnedAchievements.length >= 10,
  },
  {
    id: "ach_20",
    name: "Overachiever",
    description: "Earn 20 achievements. Clearly not doing this casually.",
    icon: Star,
    category: "misc",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 60,
      label: "2× income for 60s",
    },
    check: (s) => s.earnedAchievements.length >= 20,
  },
  {
    id: "ach_50",
    name: "Dedicated",
    description: "Earn 50 achievements. This is a serious commitment.",
    icon: Award,
    category: "misc",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 90,
      label: "3× income for 90s",
    },
    check: (s) => s.earnedAchievements.length >= 50,
  },
  {
    id: "ach_100",
    name: "Centurion",
    description: "Earn 100 achievements. One hundred. That's insane.",
    icon: Crown,
    category: "misc",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 120,
      label: "5× income for 120s",
    },
    check: (s) => s.earnedAchievements.length >= 100,
  },
  {
    id: "ach_all",
    name: "Completionist",
    description: "Earn every single achievement. You've done it all.",
    icon: Sparkles,
    category: "misc",
    reward: {
      type: "buff",
      multiplier: 25,
      duration: 120,
      label: "25× income for 120s",
    },
    check: (s) => s.earnedAchievements.length >= ACHIEVEMENTS.length - 1,
  },

  // === FLAVOR SLOTS ===
  {
    id: "flavor_slot_2",
    name: "Double Blend",
    description: "Unlock the 2nd flavor slot. Two tastes are better than one.",
    icon: Layers,
    category: "flavors",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 30,
      label: "2× income for 30s",
    },
    check: (s) => s.upgrades.flavorSlots >= 1,
  },
  {
    id: "flavor_slot_3",
    name: "Triple Threat",
    description: "Unlock the 3rd flavor slot. Maximum blend potential achieved.",
    icon: Sparkles,
    category: "flavors",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) => s.upgrades.flavorSlots >= 2,
  },

  // === FLAVOR COMBOS ===
  {
    id: "combo_classic_blend",
    name: "Classic Pairing",
    description: "Activate the Classic Blend combo: Chocolate + Vanilla.",
    icon: Star,
    category: "combos",
    reward: { type: "money", amount: 500, label: "+$500" },
    check: (s) =>
      [FlavorType.CHOCOLATE, FlavorType.VANILLA].every((f) =>
        s.activeFlavors.includes(f),
      ),
  },
  {
    id: "combo_neapolitan",
    name: "Neapolitan Master",
    description:
      "Activate the Neapolitan Supreme combo: Chocolate + Vanilla + Strawberry.",
    icon: Sparkles,
    category: "combos",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 60,
      label: "2× income for 60s",
    },
    check: (s) =>
      [FlavorType.CHOCOLATE, FlavorType.VANILLA, FlavorType.STRAWBERRY].every(
        (f) => s.activeFlavors.includes(f),
      ),
  },
  {
    id: "combo_zen_garden",
    name: "Garden Serenity",
    description: "Activate the Zen Garden combo: Matcha + Mint.",
    icon: Leaf,
    category: "combos",
    reward: { type: "money", amount: 1_000, label: "+$1,000" },
    check: (s) =>
      [FlavorType.MATCHA, FlavorType.MINT].every((f) =>
        s.activeFlavors.includes(f),
      ),
  },
  {
    id: "combo_caramel_macchiato",
    name: "Café Gold",
    description: "Activate the Caramel Macchiato combo: Caramel + Coffee.",
    icon: Coffee,
    category: "combos",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 45,
      label: "2× income for 45s",
    },
    check: (s) =>
      [FlavorType.CARAMEL, FlavorType.COFFEE].every((f) =>
        s.activeFlavors.includes(f),
      ),
  },
  {
    id: "combo_turtle_swirl",
    name: "Turtle Power",
    description: "Activate the Turtle Swirl combo: Chocolate + Caramel.",
    icon: RefreshCw,
    category: "combos",
    reward: { type: "money", amount: 750, label: "+$750" },
    check: (s) =>
      [FlavorType.CHOCOLATE, FlavorType.CARAMEL].every((f) =>
        s.activeFlavors.includes(f),
      ),
  },
  {
    id: "combo_tropical_zen",
    name: "Island Serenity",
    description: "Activate the Tropical Zen combo: Pineapple + Matcha.",
    icon: Leaf,
    category: "combos",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 45,
      label: "2× income for 45s",
    },
    check: (s) =>
      [FlavorType.PINEAPPLE, FlavorType.MATCHA].every((f) =>
        s.activeFlavors.includes(f),
      ),
  },
  {
    id: "combo_dragon_inferno",
    name: "Fire Drake",
    description:
      "Activate the Dragon Inferno combo: Lava Chili + Dragon Fruit.",
    icon: Flame,
    category: "combos",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 45,
      label: "3× income for 45s",
    },
    check: (s) =>
      [FlavorType.LAVA, FlavorType.DRAGON].every((f) =>
        s.activeFlavors.includes(f),
      ),
  },
  {
    id: "combo_shadow_blend",
    name: "Into the Abyss",
    description: "Activate the Shadow Blend combo: The Void + Phantom Frost.",
    icon: Ghost,
    category: "combos",
    reward: { type: "money", amount: 5_000, label: "+$5,000" },
    check: (s) =>
      [FlavorType.VOID, FlavorType.PHANTOM].every((f) =>
        s.activeFlavors.includes(f),
      ),
  },
  {
    id: "combo_cosmic_frost",
    name: "Frozen Cosmos",
    description:
      "Activate the Cosmic Frost combo: Stardust + Galaxy Swirl + Phantom Frost.",
    icon: Snowflake,
    category: "combos",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) =>
      [FlavorType.STARDUST, FlavorType.GALAXY, FlavorType.PHANTOM].every((f) =>
        s.activeFlavors.includes(f),
      ),
  },
  {
    id: "combo_nebula_dream",
    name: "Dreaming of Stars",
    description:
      "Activate the Nebula Dream combo: Rainbow Sparkle + Stardust + Galaxy Swirl.",
    icon: Sparkles,
    category: "combos",
    reward: {
      type: "buff",
      multiplier: 4,
      duration: 60,
      label: "4× income for 60s",
    },
    check: (s) =>
      [FlavorType.RAINBOW, FlavorType.STARDUST, FlavorType.GALAXY].every((f) =>
        s.activeFlavors.includes(f),
      ),
  },
  {
    id: "combo_void_static",
    name: "Digital Nightmare",
    description:
      "Activate the Void Static combo: The Void + Neon Sludge + Phantom Frost.",
    icon: Zap,
    category: "combos",
    reward: { type: "money", amount: 25_000, label: "+$25,000" },
    check: (s) =>
      [FlavorType.VOID, FlavorType.NEON, FlavorType.PHANTOM].every((f) =>
        s.activeFlavors.includes(f),
      ),
  },
  {
    id: "combo_divine_blend",
    name: "Divine Revelation",
    description:
      "Activate the Divine Blend combo: Ultimate Essence + Celestial Delight.",
    icon: Crown,
    category: "combos",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 60,
      label: "5× income for 60s",
    },
    check: (s) =>
      [FlavorType.ULTIMATE, FlavorType.CELESTIAL].every((f) =>
        s.activeFlavors.includes(f),
      ),
  },
  {
    id: "combo_phoenix_cosmos",
    name: "Universal Rebirth",
    description:
      "Activate the Phoenix Cosmos combo: Phoenix Flame + Cosmic Wonder.",
    icon: Rocket,
    category: "combos",
    reward: {
      type: "buff",
      multiplier: 10,
      duration: 60,
      label: "10× income for 60s",
    },
    check: (s) =>
      [FlavorType.PHOENIX, FlavorType.COSMIC].every((f) =>
        s.activeFlavors.includes(f),
      ),
  },
  {
    id: "combo_spicy_caramel",
    name: "Sweet Inferno",
    description: "Activate the Spicy Caramel combo: Lava Chili + Caramel.",
    icon: Flame,
    category: "combos",
    reward: { type: "money", amount: 2_500, label: "+$2,500" },
    check: (s) =>
      [FlavorType.LAVA, FlavorType.CARAMEL].every((f) =>
        s.activeFlavors.includes(f),
      ),
  },
  {
    id: "combo_cookies_coffee",
    name: "Late Night Snack",
    description:
      "Activate the Cookies & Coffee combo: Cookies & Cream + Coffee.",
    icon: Coffee,
    category: "combos",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 60,
      label: "2× income for 60s",
    },
    check: (s) =>
      [FlavorType.COOKIES, FlavorType.COFFEE].every((f) =>
        s.activeFlavors.includes(f),
      ),
  },

  // === COUNTRIES EXTENDED ===
  {
    id: "countries_20",
    name: "Worldwide Expansion",
    description: "Expand to 20 countries. The map is almost yours.",
    icon: Globe,
    category: "countries",
    reward: {
      type: "buff",
      multiplier: 15,
      duration: 120,
      label: "15× income for 120s",
    },
    check: (s) => s.unlockedCountries.length >= 20,
  },
  {
    id: "countries_25",
    name: "Global Saturation",
    description: "Expand to 25 countries. Milkshakes on every continent.",
    icon: Crown,
    category: "countries",
    reward: {
      type: "buff",
      multiplier: 25,
      duration: 120,
      label: "25× income for 120s",
    },
    check: (s) => s.unlockedCountries.length >= 25,
  },
  {
    id: "countries_30",
    name: "Interplanetary",
    description: "Expand to 30 markets. Your empire has left Earth.",
    icon: Rocket,
    category: "countries",
    reward: {
      type: "buff",
      multiplier: 50,
      duration: 120,
      label: "50× income for 120s",
    },
    check: (s) => s.unlockedCountries.length >= 30,
  },
  {
    id: "mars_landing",
    name: "Red Planet Franchise",
    description: "Open a location on Mars. One giant shake for mankind.",
    icon: Rocket,
    category: "countries",
    reward: { type: "money", amount: 100_000_000, label: "+$100,000,000" },
    check: (s) => s.unlockedCountries.includes("mars"),
  },

  // === LEGEND ACHIEVEMENTS ===
  {
    id: "shakes_25m",
    name: "Blender of the Gods",
    description: "Blend 25,000,000 milkshakes. Reality itself is a smoothie.",
    icon: Crown,
    category: "legend",
    reward: {
      type: "buff",
      multiplier: 30,
      duration: 120,
      label: "30× income for 120s",
    },
    check: (s) => s.totalStats.totalMilkshakes >= 25_000_000,
  },
  {
    id: "shakes_100m",
    name: "Infinite Loop",
    description: "Blend 100,000,000 milkshakes. The universe bows to your blender.",
    icon: Sparkles,
    category: "legend",
    reward: {
      type: "buff",
      multiplier: 100,
      duration: 120,
      label: "100× income for 120s",
    },
    check: (s) => s.totalStats.totalMilkshakes >= 100_000_000,
  },
  {
    id: "money_10t",
    name: "Ten Trillion Club",
    description: "Have $10 trillion in the bank. Central banks are calling.",
    icon: Gem,
    category: "legend",
    reward: {
      type: "buff",
      multiplier: 10,
      duration: 120,
      label: "10× income for 120s",
    },
    check: (s) => s.money >= 10_000_000_000_000,
  },
  {
    id: "money_100t",
    name: "Almost Quintillionaire",
    description: "Have $100 trillion in the bank. The economy fears you.",
    icon: Star,
    category: "legend",
    reward: {
      type: "buff",
      multiplier: 15,
      duration: 120,
      label: "15× income for 120s",
    },
    check: (s) => s.money >= 100_000_000_000_000,
  },
  {
    id: "shops_1000",
    name: "City of Shakes",
    description: "Own 1,000 shop extensions. You are the city.",
    icon: Building2,
    category: "legend",
    reward: {
      type: "buff",
      multiplier: 30,
      duration: 120,
      label: "30× income for 120s",
    },
    check: (_s, d) => d.shopExtensions >= 1_000,
  },
  {
    id: "employees_5000",
    name: "Corporate Colossus",
    description: "Have 5,000 employees. You have your own economy.",
    icon: Users,
    category: "legend",
    reward: {
      type: "buff",
      multiplier: 25,
      duration: 120,
      label: "25× income for 120s",
    },
    check: (_s, d) => d.employees >= 5_000,
  },
  {
    id: "days_10000",
    name: "Outlived Generations",
    description: "Survive 10,000 game days (~27 years). The shakes outlive civilizations.",
    icon: Timer,
    category: "legend",
    reward: {
      type: "buff",
      multiplier: 100,
      duration: 120,
      label: "100× income for 120s",
    },
    check: (s) => s.gameDays >= 10_000,
  },
  {
    id: "golden_5000",
    name: "All That Glitters",
    description: "Get 5,000 Golden milkshakes. You've struck the motherlode.",
    icon: Sparkles,
    category: "legend",
    reward: {
      type: "buff",
      multiplier: 15,
      duration: 120,
      label: "15× income for 120s",
    },
    check: (s) => s.totalStats.totalGolden >= 5_000,
  },
  {
    id: "fan_10000",
    name: "Legendary Fan Base",
    description: "Get 10,000 Fan Favorite blends. You have a cult following.",
    icon: Megaphone,
    category: "legend",
    reward: {
      type: "buff",
      multiplier: 10,
      duration: 120,
      label: "10× income for 120s",
    },
    check: (s) => s.totalStats.totalFanFavorite >= 10_000,
  },
  {
    id: "upgrades_300_total",
    name: "Total Mastery",
    description: "Accumulate 300 total upgrade levels. You've invested in everything.",
    icon: Trophy,
    category: "legend",
    reward: {
      type: "buff",
      multiplier: 20,
      duration: 120,
      label: "20× income for 120s",
    },
    check: (s) => Object.values(s.upgrades).reduce((a, b) => a + b, 0) >= 300,
  },

  // === SECRETS ACHIEVEMENTS ===
  {
    id: "no_upgrades_rich",
    name: "Primal Talent",
    description: "Have $5,000 in the bank without purchasing any upgrades. Raw skill.",
    icon: Star,
    category: "secrets",
    reward: { type: "money", amount: 5_000, label: "+$5,000" },
    check: (s) =>
      s.money >= 5_000 && Object.values(s.upgrades).every((v) => v === 0),
  },
  {
    id: "no_country_million",
    name: "Local Legend",
    description: "Reach $1,000,000 without expanding to any country. Homegrown pride.",
    icon: MapPin,
    category: "secrets",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) => s.money >= 1_000_000 && s.unlockedCountries.length === 0,
  },
  {
    id: "golden_touch_earned",
    name: "Midas Hands",
    description: "Purchase the Golden Touch special upgrade. Gold flows from your fingertips.",
    icon: Sparkles,
    category: "secrets",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 60,
      label: "5× income for 60s",
    },
    check: (s) => s.upgrades.goldenTouch >= 1,
  },
  {
    id: "double_shot_earned",
    name: "Two For One",
    description: "Unlock Double Shot. Every blend counts twice as much now.",
    icon: Zap,
    category: "secrets",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 60,
      label: "3× income for 60s",
    },
    check: (s) => s.upgrades.doubleShot >= 1,
  },
  {
    id: "wage_high_ach",
    name: "Top Dollar",
    description: "Set employee wages to High. Your staff loves you. For now.",
    icon: Smile,
    category: "secrets",
    reward: { type: "money", amount: 1_000, label: "+$1,000" },
    check: (s) => s.options.wageLevel === "high",
  },
  {
    id: "wage_low_ach",
    name: "Penny Pincher Boss",
    description: "Set employee wages to Low. Bold move. They're not happy.",
    icon: TrendingDown,
    category: "secrets",
    reward: { type: "money", amount: 500, label: "+$500" },
    check: (s) => s.options.wageLevel === "low",
  },
  {
    id: "empty_blender_ach",
    name: "What Are We Making?",
    description: "Have an empty blender with no active flavors. A blank canvas.",
    icon: Ghost,
    category: "secrets",
    reward: { type: "money", amount: 100, label: "+$100" },
    check: (s) => s.activeFlavors.length === 0,
  },
  {
    id: "chocolate_only",
    name: "Pure Chocolate",
    description: "Blend 100 milkshakes with only Chocolate ever unlocked. Old school.",
    icon: Milk,
    category: "secrets",
    reward: { type: "money", amount: 500, label: "+$500" },
    check: (s) =>
      s.unlockedFlavors.length === 1 &&
      s.unlockedFlavors[0] === FlavorType.CHOCOLATE &&
      s.totalStats.totalMilkshakes >= 100,
  },
  {
    id: "void_golden",
    name: "The Paradox",
    description:
      "Have The Void active in the blender while owning 100+ Golden milkshakes. Darkness meets gold.",
    icon: Zap,
    category: "secrets",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 60,
      label: "5× income for 60s",
    },
    check: (s) =>
      s.activeFlavors.includes(FlavorType.VOID) &&
      s.totalStats.totalGolden >= 100,
  },
  {
    id: "low_wage_army",
    name: "Risky Business",
    description:
      "Have Low wages AND 100+ employees. Something is about to go very wrong.",
    icon: AlertTriangle,
    category: "secrets",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 45,
      label: "2× income for 45s",
    },
    check: (s, d) => s.options.wageLevel === "low" && d.employees >= 100,
  },
  {
    id: "speed_special_combo",
    name: "Turbo God",
    description: "Max out Mix Speed AND unlock Speed Blending. Impossibly fast.",
    icon: Zap,
    category: "secrets",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 90,
      label: "5× income for 90s",
    },
    check: (s) => s.upgrades.mixSpeed >= 5 && s.upgrades.speedBlending >= 1,
  },

  // === QUIRKS ACHIEVEMENTS ===
  {
    id: "lava_ice",
    name: "Hot n Cold",
    description: "Have Lava Chili AND Phantom Frost active simultaneously. Contradictory, but delicious.",
    icon: Flame,
    category: "quirks",
    reward: { type: "money", amount: 3_000, label: "+$3,000" },
    check: (s) =>
      s.activeFlavors.includes(FlavorType.LAVA) &&
      s.activeFlavors.includes(FlavorType.PHANTOM),
  },
  {
    id: "marshmallow_void",
    name: "Sweet Nothingness",
    description: "Have Marshmallow Cloud AND The Void active. Soft and terrifying.",
    icon: Ghost,
    category: "quirks",
    reward: { type: "money", amount: 5_000, label: "+$5,000" },
    check: (s) =>
      s.activeFlavors.includes(FlavorType.MARSHMALLOW) &&
      s.activeFlavors.includes(FlavorType.VOID),
  },
  {
    id: "fruit_trio",
    name: "Fruit Punch",
    description: "Unlock Strawberry, Pineapple, and Melon. The tropical trifecta.",
    icon: Palette,
    category: "quirks",
    reward: { type: "money", amount: 2_000, label: "+$2,000" },
    check: (s) =>
      [FlavorType.STRAWBERRY, FlavorType.PINEAPPLE, FlavorType.MELON].every(
        (f) => s.unlockedFlavors.includes(f),
      ),
  },
  {
    id: "royal_active",
    name: "Royal Treatment",
    description: "Have Royal Elixir active in the blender. You deserve only the finest.",
    icon: Crown,
    category: "quirks",
    reward: { type: "money", amount: 8_000, label: "+$8,000" },
    check: (s) => s.activeFlavors.includes(FlavorType.ELIXIR),
  },
  {
    id: "triple_buff_ach",
    name: "The Buff Train",
    description: "Have 3 or more active income buffs running simultaneously. The stacking never stops.",
    icon: Zap,
    category: "quirks",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 60,
      label: "5× income for 60s",
    },
    check: (s) => s.activeBuffs.length >= 3,
  },
  {
    id: "phantom_stardust",
    name: "Cosmic Ice",
    description: "Have Phantom Frost AND Stardust active. Frozen stardust in a cup.",
    icon: Snowflake,
    category: "quirks",
    reward: { type: "money", amount: 4_000, label: "+$4,000" },
    check: (s) =>
      s.activeFlavors.includes(FlavorType.PHANTOM) &&
      s.activeFlavors.includes(FlavorType.STARDUST),
  },
  {
    id: "melon_mint",
    name: "Cool Refresher",
    description: "Have Melon AND Mint active. The most refreshing combo on the menu.",
    icon: Leaf,
    category: "quirks",
    reward: { type: "money", amount: 1_500, label: "+$1,500" },
    check: (s) =>
      s.activeFlavors.includes(FlavorType.MELON) &&
      s.activeFlavors.includes(FlavorType.MINT),
  },
  {
    id: "marshmallow_active",
    name: "Cloud Nine",
    description: "Have Marshmallow Cloud active. Floating on a fluffy sugar high.",
    icon: Sparkles,
    category: "quirks",
    reward: { type: "money", amount: 1_000, label: "+$1,000" },
    check: (s) => s.activeFlavors.includes(FlavorType.MARSHMALLOW),
  },
  {
    id: "cosmic_active",
    name: "Cosmic Mind",
    description: "Have Cosmic Wonder active. The flavor of the entire universe.",
    icon: Globe,
    category: "quirks",
    reward: { type: "money", amount: 12_000, label: "+$12,000" },
    check: (s) => s.activeFlavors.includes(FlavorType.COSMIC),
  },
  {
    id: "all_exotic_unlocked",
    name: "Astronomical Collection",
    description:
      "Unlock Stardust, Cosmic Wonder, Galaxy Swirl, and Phantom Frost. Space-tier flavors.",
    icon: Moon,
    category: "quirks",
    reward: {
      type: "buff",
      multiplier: 4,
      duration: 90,
      label: "4× income for 90s",
    },
    check: (s) =>
      [
        FlavorType.STARDUST,
        FlavorType.COSMIC,
        FlavorType.GALAXY,
        FlavorType.PHANTOM,
      ].every((f) => s.unlockedFlavors.includes(f)),
  },
  {
    id: "rainbow_active",
    name: "Taste the Rainbow",
    description: "Have Rainbow Sparkle active. Technicolor taste.",
    icon: Palette,
    category: "quirks",
    reward: { type: "money", amount: 6_000, label: "+$6,000" },
    check: (s) => s.activeFlavors.includes(FlavorType.RAINBOW),
  },
  {
    id: "deep_in_debt",
    name: "Rock Bottom",
    description: "Sink to -$5,000 or lower. The IRS is impressed, in a bad way.",
    icon: TrendingDown,
    category: "quirks",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 30,
      label: "3× income for 30s comeback boost",
    },
    check: (s) => s.money <= -5_000,
  },

  // === PLAYER LEVELS ===
  {
    id: "level_3",
    name: "Finding Your Feet",
    description: "Reach player level 3. Your milkshake instincts are sharpening.",
    icon: TrendingUp,
    category: "levels",
    reward: { type: "money", amount: 500, label: "+$500" },
    check: (s) => levelFromXp(s.xp) >= 3,
  },
  {
    id: "level_5",
    name: "Rising Star",
    description: "Reach player level 5. Staff and storefronts await.",
    icon: Star,
    category: "levels",
    reward: {
      type: "buff",
      multiplier: 2,
      duration: 30,
      label: "2× income for 30s",
    },
    check: (s) => levelFromXp(s.xp) >= 5,
  },
  {
    id: "level_10",
    name: "Seasoned Operator",
    description: "Reach player level 10. You've earned the keys to the business.",
    icon: Award,
    category: "levels",
    reward: {
      type: "buff",
      multiplier: 3,
      duration: 45,
      label: "3× income for 45s",
    },
    check: (s) => levelFromXp(s.xp) >= 10,
  },
  {
    id: "level_20",
    name: "Milkshake Professional",
    description: "Reach player level 20. A true expert of the craft.",
    icon: Trophy,
    category: "levels",
    reward: {
      type: "buff",
      multiplier: 5,
      duration: 60,
      label: "5× income for 60s",
    },
    check: (s) => levelFromXp(s.xp) >= 20,
  },
  {
    id: "level_35",
    name: "Blending Virtuoso",
    description: "Reach player level 35. Few ever climb this high.",
    icon: Sparkles,
    category: "levels",
    reward: {
      type: "buff",
      multiplier: 10,
      duration: 90,
      label: "10× income for 90s",
    },
    check: (s) => levelFromXp(s.xp) >= 35,
  },
  {
    id: "level_50",
    name: "Milkshake Grandmaster",
    description: "Reach player level 50. The pinnacle of milkshake mastery.",
    icon: Crown,
    category: "levels",
    reward: {
      type: "buff",
      multiplier: 25,
      duration: 120,
      label: "25× income for 120s",
    },
    check: (s) => levelFromXp(s.xp) >= 50,
  },
];

export const ACHIEVEMENT_CATEGORY_LABELS: Record<
  Achievement["category"],
  string
> = {
  shakes: "Shake Milestones",
  money: "Money Milestones",
  employees: "Employees",
  shops: "Shop Extensions",
  flavors: "Flavors",
  countries: "Countries",
  specials: "Special Outcomes",
  upgrades: "Upgrades & Tech",
  time: "Time Played",
  misc: "Crazy Scenarios",
  combos: "Flavor Combos",
  events: "Random Events",
  legend: "Legendary Milestones",
  secrets: "Hidden Secrets",
  quirks: "Curious Quirks",
  levels: "Player Levels",
};

