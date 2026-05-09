/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FlavorType, Shop, Country } from "./types";
import { SHOP_REGISTRY, FLAVOR_REGISTRY } from "./registry";

// Re-export flavor registry for use throughout the app
export const FLAVORS = FLAVOR_REGISTRY;

// Generate initial shops from registry
export const INITIAL_SHOPS: Shop[] = Object.values(SHOP_REGISTRY).map(
  (shop) => ({
    id: shop.id,
    name: shop.name,
    count: 0,
    baseIncome: shop.baseIncome,
    cost: shop.cost,
  }),
);

export const COUNTRIES: Country[] = [
  {
    id: "usa",
    name: "USA",
    multiplier: 1.2,
    cost: 50000,
    description:
      "The land of the XL shake. Everything is 20% bigger and more profitable.",
  },
  {
    id: "canada",
    name: "Canada",
    multiplier: 1.4,
    cost: 150000,
    description: "Maple syrup boosts your shake sales by a tasty margin.",
  },
  {
    id: "mexico",
    name: "Mexico",
    multiplier: 1.6,
    cost: 500000,
    description: "Spicy and sweet flavors bring a festive vibe to every shake.",
  },
  {
    id: "japan",
    name: "Japan",
    multiplier: 2.0,
    cost: 2000000,
    description: "Precision blending techniques double your base yield.",
  },
  {
    id: "southkorea",
    name: "South Korea",
    multiplier: 2.5,
    cost: 10000000,
    description: "Trendy K-style shakes go viral instantly.",
  },
  {
    id: "france",
    name: "France",
    multiplier: 3.0,
    cost: 50000000,
    description: "Gourmet artisanal shakes sell for a massive premium.",
  },
  {
    id: "germany",
    name: "Germany",
    multiplier: 3.5,
    cost: 120000000,
    description: "Efficient operations and high standards boost margins.",
  },
  {
    id: "spain",
    name: "Spain",
    multiplier: 3.8,
    cost: 180000000,
    description: "Warm weather and beach crowds love cold drinks.",
  },
  {
    id: "italy",
    name: "Italy",
    multiplier: 4.0,
    cost: 250000000,
    description: "The birthplace of Gelato. Your shakes are now liquid art.",
  },
  {
    id: "sweden",
    name: "Sweden",
    multiplier: 5.0,
    cost: 600000000,
    description: "Premium ingredients and minimalist branding sell well.",
  },
  {
    id: "brazil",
    name: "Brazil",
    multiplier: 6.0,
    cost: 1000000000,
    description: "Carnival vibes! Everyone wants a tropical shake.",
  },
  {
    id: "uae",
    name: "United Arab Emirates",
    multiplier: 8.0,
    cost: 4000000000,
    description: "High-end locations mean high-end prices.",
  },
  {
    id: "egypt",
    name: "Egypt",
    multiplier: 10.0,
    cost: 10000000000,
    description: "Ancient blending secrets rediscovered in the pyramids.",
  },
  {
    id: "singapore",
    name: "Singapore",
    multiplier: 12.0,
    cost: 30000000000,
    description: "Dense foot traffic and fast service keep sales booming.",
  },
  {
    id: "southafrica",
    name: "South Africa",
    multiplier: 15.0,
    cost: 100000000000,
    description: "Exotic flavors inspired by the savannah.",
  },
  {
    id: "uk",
    name: "United Kingdom",
    multiplier: 25.0,
    cost: 1000000000000,
    description: "The Royal Family requested a custom blend. Direct patronage!",
  },
  {
    id: "australia",
    name: "Australia",
    multiplier: 40.0,
    cost: 10000000000000,
    description: "Down Under shakes are big, bold, and outdoorsy.",
  },
  {
    id: "newzealand",
    name: "New Zealand",
    multiplier: 55.0,
    cost: 50000000000000,
    description: "Tourist hotspots turn every shop into a destination.",
  },
  {
    id: "india",
    name: "India",
    multiplier: 75.0,
    cost: 100000000000000,
    description:
      "Spices and sweets create a vibrant, high-demand shake market.",
  },
  {
    id: "china",
    name: "China",
    multiplier: 150.0,
    cost: 1000000000000000,
    description: "Massive population, massive shake potential.",
  },
  {
    id: "moon",
    name: "The Moon",
    multiplier: 500.0,
    cost: 10000000000000000,
    description: "Low gravity makes shakes fluffier (and pricier).",
  },
];

// Special outcome chances (as percentages when multiplied by 100)
// Crusty: 10%, Baked: 5%, Golden: 0.1%, Swirled: 1%
// These can stack independently
export const CHANCES = {
  crustyBase: 0.1, // 10%
  bakedBase: 0.05, // 5%
  goldenBase: 0.001, // 0.1%
  swirledBase: 0.01, // 1%
};

// Multipliers for special outcome types (stacking)
export const MULTIPLIERS = {
  crusty: 5,
  baked: 25,
  golden: 75,
  swirled: 250,
};

// Default blend time in seconds
export const INITIAL_BLEND_TIME = 10;

// Background themes
export const BACKGROUNDS = [
  {
    name: "Cozy Cafe",
    url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=2400",
    filter: "brightness(0.5) saturate(1.2)",
  },
  {
    name: "Crystal Bloom",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2400",
    filter: "saturate(1.8) brightness(0.6) hue-rotate(210deg)",
  },
  {
    name: "Neon Hub",
    url: "https://images.unsplash.com/photo-1550507992-eb63ffee0847?auto=format&fit=crop&q=80&w=2400",
    filter: "brightness(0.4) saturate(1.5)",
  },
  {
    name: "Midnight Mist",
    url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=2400",
    filter: "brightness(0.3) saturate(0.8)",
  },
  {
    name: "Blue Abstract",
    url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=2400",
    filter: "hue-rotate(180deg) brightness(0.4)",
  },
];
