/**
 * @license
 * All Rights Reserved.
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
    section: shop.section,
    description: shop.description,
    employeeCapacity: shop.employeeCapacity || 0,
    count: 0,
    baseIncome: shop.baseIncome,
    cost: shop.cost,
    monthlyCost: shop.monthlyCost,
  }),
);

export const COUNTRIES: Country[] = [
  {
    id: "usa",
    name: "USA",
    multiplier: 1.08,
    cost: 50000,
    description:
      "The land of the XL shake. Everything is 8% bigger and more profitable.",
  },
  {
    id: "chile",
    name: "Chile",
    multiplier: 1.1,
    cost: 80000,
    description: "Spicy empanada culture inspires bold, daring new flavors.",
  },
  {
    id: "canada",
    name: "Canada",
    multiplier: 1.12,
    cost: 150000,
    description: "Maple syrup boosts your shake sales by a tasty margin.",
  },
  {
    id: "netherlands",
    name: "Netherlands",
    multiplier: 1.15,
    cost: 200000,
    description:
      "The Dutch love a sweet treat. Stroopwafel shakes fly off shelves.",
  },
  {
    id: "mexico",
    name: "Mexico",
    multiplier: 1.18,
    cost: 500000,
    description: "Spicy and sweet flavors bring a festive vibe to every shake.",
  },
  {
    id: "argentina",
    name: "Argentina",
    multiplier: 1.22,
    cost: 600000,
    description: "South American passion meets milkshake innovation.",
  },
  {
    id: "japan",
    name: "Japan",
    multiplier: 1.35,
    cost: 2000000,
    description: "Precision blending techniques yield 35% more per shake.",
  },
  {
    id: "taiwan",
    name: "Taiwan",
    multiplier: 1.45,
    cost: 7000000,
    description: "Bubble tea culture means locals know their premium drinks.",
  },
  {
    id: "southkorea",
    name: "South Korea",
    multiplier: 1.55,
    cost: 10000000,
    description: "Trendy K-style shakes go viral instantly.",
  },
  {
    id: "thailand",
    name: "Thailand",
    multiplier: 1.65,
    cost: 15000000,
    description:
      "Thai sweet milk tea meets milkshake innovation. Tourists go wild.",
  },
  {
    id: "france",
    name: "France",
    multiplier: 1.8,
    cost: 50000000,
    description: "Gourmet artisanal shakes sell for a solid premium.",
  },
  {
    id: "portugal",
    name: "Portugal",
    multiplier: 1.9,
    cost: 70000000,
    description: "Pastel de nata-inspired shakes are an instant sensation.",
  },
  {
    id: "germany",
    name: "Germany",
    multiplier: 2.0,
    cost: 120000000,
    description: "Efficient operations and high standards boost margins.",
  },
  {
    id: "spain",
    name: "Spain",
    multiplier: 2.15,
    cost: 180000000,
    description: "Warm weather and beach crowds love cold drinks.",
  },
  {
    id: "italy",
    name: "Italy",
    multiplier: 2.3,
    cost: 250000000,
    description: "The birthplace of Gelato. Your shakes are now liquid art.",
  },
  {
    id: "sweden",
    name: "Sweden",
    multiplier: 2.6,
    cost: 600000000,
    description: "Premium ingredients and minimalist branding sell well.",
  },
  {
    id: "norway",
    name: "Norway",
    multiplier: 2.8,
    cost: 800000000,
    description: "Fjord-fresh ingredients command seriously premium prices.",
  },
  {
    id: "brazil",
    name: "Brazil",
    multiplier: 3.0,
    cost: 1000000000,
    description: "Carnival vibes! Everyone wants a tropical shake.",
  },
  {
    id: "uae",
    name: "United Arab Emirates",
    multiplier: 3.5,
    cost: 4000000000,
    description: "High-end locations mean high-end prices.",
  },
  {
    id: "turkey",
    name: "Turkey",
    multiplier: 4.0,
    cost: 6000000000,
    description:
      "Bazaar culture and sweet dessert traditions make shakes iconic.",
  },
  {
    id: "egypt",
    name: "Egypt",
    multiplier: 4.5,
    cost: 10000000000,
    description: "Ancient blending secrets rediscovered in the pyramids.",
  },
  {
    id: "singapore",
    name: "Singapore",
    multiplier: 5.0,
    cost: 30000000000,
    description: "Dense foot traffic and fast service keep sales booming.",
  },
  {
    id: "russia",
    name: "Russia",
    multiplier: 5.5,
    cost: 40000000000,
    description:
      "A vast market and cold climate create huge demand for warm shakes.",
  },
  {
    id: "southafrica",
    name: "South Africa",
    multiplier: 6.0,
    cost: 100000000000,
    description: "Exotic flavors inspired by the savannah.",
  },
  {
    id: "nigeria",
    name: "Nigeria",
    multiplier: 7.0,
    cost: 400000000000,
    description:
      "Afrobeat energy and bold West African flavors make shakes iconic.",
  },
  {
    id: "uk",
    name: "United Kingdom",
    multiplier: 8.5,
    cost: 1000000000000,
    description: "The Royal Family requested a custom blend. Direct patronage!",
  },
  {
    id: "switzerland",
    name: "Switzerland",
    multiplier: 10.0,
    cost: 5000000000000,
    description:
      "Swiss chocolate precision takes your shakes to a new level of luxury.",
  },
  {
    id: "australia",
    name: "Australia",
    multiplier: 12.0,
    cost: 10000000000000,
    description: "Down Under shakes are big, bold, and outdoorsy.",
  },
  {
    id: "newzealand",
    name: "New Zealand",
    multiplier: 15.0,
    cost: 50000000000000,
    description: "Tourist hotspots turn every shop into a destination.",
  },
  {
    id: "ireland",
    name: "Ireland",
    multiplier: 18.0,
    cost: 75000000000000,
    description:
      "The Emerald Isle has developed a taste for the extraordinary.",
  },
  {
    id: "india",
    name: "India",
    multiplier: 22.0,
    cost: 100000000000000,
    description:
      "Spices and sweets create a vibrant, high-demand shake market.",
  },
  {
    id: "indonesia",
    name: "Indonesia",
    multiplier: 28.0,
    cost: 500000000000000,
    description: "Thousands of islands, millions of thirsty customers.",
  },
  {
    id: "china",
    name: "China",
    multiplier: 38.0,
    cost: 1000000000000000,
    description: "Massive population, massive shake potential.",
  },
  {
    id: "moon",
    name: "The Moon",
    multiplier: 80.0,
    cost: 10000000000000000,
    description: "Low gravity makes shakes fluffier (and pricier).",
  },
  {
    id: "mars",
    name: "Mars",
    multiplier: 120.0,
    cost: 5e16,
    description: "Red planet, red-hot sales. Low gravity, high profit margins.",
  },
];

// Special outcome chances (as percentages when multiplied by 100)
// Crusty: 10%, Baked: 5%, Golden: 0.1%, Swirled: 1%, Fan Favorite: 25%, Decorated: 0.5%, Creamy: 15%
// These can stack independently
export const CHANCES = {
  fanFavoriteBase: 0.25, // 25%
  creamyBase: 0.15, // 15%
  crustyBase: 0.1, // 10%
  bakedBase: 0.05, // 5%
  swirledBase: 0.01, // 1%
  decoratedBase: 0.005, // 0.5%
  goldenBase: 0.001, // 0.1%
};

// Multipliers for special outcome types (stacking)
export const MULTIPLIERS = {
  fanFavorite: 1.5,
  creamy: 2,
  crusty: 3,
  baked: 5,
  swirled: 10,
  decorated: 15,
  golden: 20,
};

// Default blend time in seconds
export const INITIAL_BLEND_TIME = 7.5;

// Default manual milkshake sale value
export const BASE_SHAKE_SALE = 5;

// Monthly income tax rate (applied every 30 game days on passive income)
export const TAX_RATE = 0.35;

// Global profit divisor. Applied to ALL income (manual blends and passive)
// to keep the economy grounded — milkshakes shouldn't print fortunes.
export const PROFIT_DIVISOR = 3;

export type FlavorCombo = {
  id: string;
  name: string;
  flavors: FlavorType[];
  multiplier: number;
  label: string;
  color: string;
};

export const FLAVOR_COMBOS: FlavorCombo[] = [
  {
    id: "classic_blend",
    name: "Classic Blend",
    flavors: [FlavorType.CHOCOLATE, FlavorType.VANILLA],
    multiplier: 1.10,
    label: "+10% income",
    color: "text-amber-300",
  },
  {
    id: "neapolitan",
    name: "Neapolitan Supreme",
    flavors: [FlavorType.CHOCOLATE, FlavorType.VANILLA, FlavorType.STRAWBERRY],
    multiplier: 1.20,
    label: "+20% income",
    color: "text-rose-300",
  },
  {
    id: "zen_garden",
    name: "Zen Garden",
    flavors: [FlavorType.MATCHA, FlavorType.MINT],
    multiplier: 1.14,
    label: "+14% income",
    color: "text-emerald-300",
  },
  {
    id: "caramel_macchiato",
    name: "Caramel Macchiato",
    flavors: [FlavorType.CARAMEL, FlavorType.COFFEE],
    multiplier: 1.25,
    label: "+25% income",
    color: "text-yellow-600",
  },
  {
    id: "turtle_swirl",
    name: "Turtle Swirl",
    flavors: [FlavorType.CHOCOLATE, FlavorType.CARAMEL],
    multiplier: 1.18,
    label: "+18% income",
    color: "text-amber-500",
  },
  {
    id: "tropical_zen",
    name: "Tropical Zen",
    flavors: [FlavorType.PINEAPPLE, FlavorType.MATCHA],
    multiplier: 1.14,
    label: "+14% income",
    color: "text-lime-300",
  },
  {
    id: "dragon_inferno",
    name: "Dragon Inferno",
    flavors: [FlavorType.LAVA, FlavorType.DRAGON],
    multiplier: 1.38,
    label: "+38% income",
    color: "text-red-400",
  },
  {
    id: "shadow_blend",
    name: "Shadow Blend",
    flavors: [FlavorType.VOID, FlavorType.PHANTOM],
    multiplier: 1.32,
    label: "+32% income",
    color: "text-purple-400",
  },
  {
    id: "cosmic_frost",
    name: "Cosmic Frost",
    flavors: [FlavorType.STARDUST, FlavorType.GALAXY, FlavorType.PHANTOM],
    multiplier: 1.48,
    label: "+48% income",
    color: "text-blue-300",
  },
  {
    id: "nebula_dream",
    name: "Nebula Dream",
    flavors: [FlavorType.RAINBOW, FlavorType.STARDUST, FlavorType.GALAXY],
    multiplier: 1.55,
    label: "+55% income",
    color: "text-violet-300",
  },
  {
    id: "void_static",
    name: "Void Static",
    flavors: [FlavorType.VOID, FlavorType.NEON, FlavorType.PHANTOM],
    multiplier: 1.62,
    label: "+62% income",
    color: "text-green-400",
  },
  {
    id: "divine_blend",
    name: "Divine Blend",
    flavors: [FlavorType.ULTIMATE, FlavorType.CELESTIAL],
    multiplier: 1.78,
    label: "+78% income",
    color: "text-yellow-300",
  },
  {
    id: "phoenix_cosmos",
    name: "Phoenix Cosmos",
    flavors: [FlavorType.PHOENIX, FlavorType.COSMIC],
    multiplier: 2.00,
    label: "+100% income",
    color: "text-orange-400",
  },
  {
    id: "spicy_caramel",
    name: "Spicy Caramel",
    flavors: [FlavorType.LAVA, FlavorType.CARAMEL],
    multiplier: 1.20,
    label: "+20% income",
    color: "text-orange-300",
  },
  {
    id: "cookies_and_coffee",
    name: "Cookies & Coffee",
    flavors: [FlavorType.COOKIES, FlavorType.COFFEE],
    multiplier: 1.25,
    label: "+25% income",
    color: "text-neutral-300",
  },
];

export const BACKGROUNDS = [
  {
    name: "Cozy Cafe",
    url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=2400",
    filter: null,
  },
  {
    name: "Abstract",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=2400",
    filter: null,
  },
  {
    name: "Sandwhich",
    url: "https://images.unsplash.com/photo-1550507992-eb63ffee0847?auto=format&fit=crop&q=80&w=2400",
    filter: null,
  },
  {
    name: "RGB Glow",
    url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=2400",
    filter: null,
  },
  {
    name: "Blue Abstract",
    url: "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=2400",
    filter: "saturate(2)",
  },
  {
    name: "Sunset City",
    url: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&q=80&w=2400",
  },
  {
    name: "Winter Landscape",
    url: "https://images.unsplash.com/photo-1773398348702-500c3d26a6c1?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    name: "Fall Forest",
    url: "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    name: "Beach",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=2400",
  },
  {
    name: "Sunset Beach",
    url: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    name: "Sapphire Waves",
    url: "../assets/wallpaper1.jpg",
    // filter: "saturate(2) brightness(1.2)",
  },
  {
    name: "Flowing Waves",
    url: "../assets/wallpaper2.jpg",
    filter: "saturate(0.8) brightness(1.2)",
  },
  {
    name: "Lounge",
    url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=2400",
    filter: null,
  },
  {
    name: "Rainforest Cafe",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2400",
    filter: null,
  },
];
