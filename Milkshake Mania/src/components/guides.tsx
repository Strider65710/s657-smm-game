/**
 * @license
 * All Rights Reserved.
 */

import {
  Milk,
  Zap,
  Award,
  Store,
  Users,
  Palette,
  Globe,
  Coins,
  Sparkles,
  Save,
  Wrench,
  Image,
  Star,
} from "lucide-react";

export type GuideStep = {
  title: string;
  icon: any;
  body: string;
};

/**
 * The first-time walkthrough. Kept short and punchy — just the essentials to
 * get a new player blending. Deeper feature explanations are handled by the
 * per-feature guides below, which appear when each feature unlocks.
 */
export const STARTER_GUIDE: GuideStep[] = [
  {
    title: "Welcome to Milkshake Mania!",
    icon: <Milk className="w-10 h-10 text-pink-400" />,
    body: "You run a milkshake empire — from a single blender to a global franchise. Here's the 30-second tour.",
  },
  {
    title: "Click the Blender",
    icon: <Zap className="w-10 h-10 text-yellow-400" />,
    body: "The big jar in the center is your blender — click it to mix a shake and earn cash. You need at least one active flavor, or there's nothing to sell. Some blends come out special for bonus money!",
  },
  {
    title: "Level Up to Unlock",
    icon: <Award className="w-10 h-10 text-amber-400" />,
    body: "The XP bar at the bottom of the sidebar fills as you blend, upgrade, and expand. Leveling up unlocks new tabs and features — and each unlock comes with its own quick guide.",
  },
  {
    title: "Save, Pause & Have Fun",
    icon: <Save className="w-10 h-10 text-sky-400" />,
    body: "Your game auto-saves on its own — press Ctrl+S to save instantly, or ESC / Space to pause. That's it. Now get blending and build the ultimate milkshake empire!",
  },
];

/**
 * Short guides shown the moment a feature unlocks via leveling up. Keyed by the
 * unlock level so the level-up handler can look one up directly. Each is also
 * replayable from the Help menu.
 */
export const FEATURE_GUIDES: Record<
  number,
  { label: string; steps: GuideStep[] }
> = {
  1: {
    label: "Flavors",
    steps: [
      {
        title: "Flavors Unlocked!",
        icon: <Palette className="w-10 h-10 text-purple-400" />,
        body: "Head to the Flavors tab to unlock new milkshake flavors — each adds an income multiplier. You start with one active slot; the Multi-Flavor Blending upgrade lets you mix up to three at once.",
      },
      {
        title: "Combos = Big Bonuses",
        icon: <Sparkles className="w-10 h-10 text-pink-400" />,
        body: "Certain flavor pairs form Combos — activate both and you'll see a glow on the blender and a bonus multiplier on all your income. Higher-tier combos like Phoenix Cosmos can double your earnings. Check the combo list in the Flavors tab to plan your next unlock!",
      },
    ],
  },
  3: {
    label: "Shop Extensions",
    steps: [
      {
        title: "Shop Extensions Unlocked!",
        icon: <Store className="w-10 h-10 text-emerald-400" />,
        body: "The Shops tab lets you buy extensions that expand seating, marketing reach, and your overall operation. Each shop provides a steady passive income stream on top of what your blender earns.",
      },
      {
        title: "Shops Unlock Staff Slots",
        icon: <Users className="w-10 h-10 text-blue-400" />,
        body: "Shop extensions directly set your employee capacity — you can't hire more staff than your total shop count allows. Buy shops first, then fill them with staff when Employees unlock at Level 5. More shops = more workers = more automatic blending.",
      },
    ],
  },
  5: {
    label: "Employees",
    steps: [
      {
        title: "Employee Hiring Unlocked!",
        icon: <Users className="w-10 h-10 text-blue-400" />,
        body: "In the Employees tab you can now hire staff who blend milkshakes automatically — passive income, even while you're away. Each hire needs shop capacity (from shop extensions) and costs a monthly wage.",
      },
      {
        title: "Passive Income Strategy",
        icon: <Coins className="w-10 h-10 text-yellow-400" />,
        body: "Employees are your income backbone. Fill every shop slot you have, then buy more shops to expand again. You can also set the Auto-Blend option in Settings so the game blends automatically between your clicks — turning it into a true idle experience.",
      },
    ],
  },
  7: {
    label: "Shake Pricing",
    steps: [
      {
        title: "Shake Pricing Unlocked!",
        icon: <Coins className="w-10 h-10 text-yellow-400" />,
        body: "You can now set your Shake Price. Premium pricing boosts manual payout per click but slows passive sales speed; budget pricing does the opposite. Tune it to your playstyle in the Employees tab.",
      },
      {
        title: "Finding Your Sweet Spot",
        icon: <Star className="w-10 h-10 text-amber-300" />,
        body: "If you're actively clicking, raise the price for bigger manual payouts. If you're going idle and relying on staff, lower it to keep passive sales flowing fast. The default is balanced — experiment and check your income/s in the sidebar to find the optimal setting for your play session.",
      },
    ],
  },
  8: {
    label: "Special Upgrades",
    steps: [
      {
        title: "Special Upgrades Unlocked!",
        icon: <Wrench className="w-10 h-10 text-orange-400" />,
        body: "A new section has appeared in the Upgrades tab: Special Upgrades. These are powerful one-time purchases — Double Shot, Golden Touch, and more — that permanently boost your income in big ways standard upgrades can't match.",
      },
      {
        title: "Prioritize Wisely",
        icon: <Award className="w-10 h-10 text-amber-400" />,
        body: "Special upgrades are expensive, but their multipliers stack on top of everything else. Double Shot doubles all manual blend income; Golden Touch gives a chance for x5 payouts on every click. Save up for the ones that match your style — they're game-changers.",
      },
    ],
  },
  10: {
    label: "Wage Management",
    steps: [
      {
        title: "Wage Management Unlocked!",
        icon: <Coins className="w-10 h-10 text-amber-400" />,
        body: "Set wage policy in the Employees tab. Happier, better-paid staff blend more effectively — but a bigger payroll eats into profit every 30 game days. Balance it against your income so you don't go broke!",
      },
      {
        title: "Payroll Strategy",
        icon: <Users className="w-10 h-10 text-purple-400" />,
        body: "Higher wages boost your passive income multiplier noticeably — but they're paid every 30 in-game days regardless of earnings. As a rule: raise wages once your passive income comfortably covers the bill with room to spare. Check the wage cost vs. income/s numbers before committing.",
      },
    ],
  },
  12: {
    label: "Background Customization",
    steps: [
      {
        title: "Background Customization Unlocked!",
        icon: <Image className="w-10 h-10 text-sky-400" />,
        body: "You've unlocked the ability to change your game background! Head to Settings and open the Display tab — there you'll find a selection of background themes to personalize your milkshake empire.",
      },
      {
        title: "Your Empire, Your Style",
        icon: <Palette className="w-10 h-10 text-fuchsia-400" />,
        body: "Choose from vibrant color themes and atmospheric backdrops — from neon cityscapes to tropical vibes. Backgrounds are purely cosmetic, so pick whatever keeps you in the zone. More themes unlock as the game evolves!",
      },
    ],
  },
  15: {
    label: "Global Expansion",
    steps: [
      {
        title: "Global Expansion Unlocked!",
        icon: <Globe className="w-10 h-10 text-green-400" />,
        body: "The Countries tab is open! Expand to new countries — each one multiplies ALL of your income. Country multipliers stack with everything else, so even a small one is a massive upgrade at this stage.",
      },
      {
        title: "Country Strategy",
        icon: <Zap className="w-10 h-10 text-cyan-400" />,
        body: "Countries scale in both cost and multiplier. Unlock them in order — each makes the next one more affordable faster. Once you have multiple countries active, their multipliers compound and your income will grow explosively. This is how empires become truly global.",
      },
    ],
  },
};

/** A combined list for the Help menu's replay buttons. */
export const ALL_REPLAYABLE_GUIDES: {
  key: string;
  label: string;
  icon: any;
  steps: GuideStep[];
}[] = [
  {
    key: "starter",
    label: "Getting Started",
    icon: <Sparkles className="w-4 h-4" />,
    steps: STARTER_GUIDE,
  },
  ...Object.entries(FEATURE_GUIDES).map(([level, g]) => ({
    key: `feature_${level}`,
    label: g.label,
    icon: g.steps[0].icon,
    steps: g.steps,
  })),
];
