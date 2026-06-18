/**
 * @license
 * All Rights Reserved.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Milk,
  Flame,
  TrendingUp,
  Store,
  Users,
  Zap,
  Trophy,
  ChevronRight,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Coins,
  Palette,
  Globe,
  MapPin,
  Rocket,
  Settings,
  Layers,
  Smile,
  Info,
  Snowflake,
  HelpCircle,
  Lock,
  AlertTriangle,
  Wrench,
  Star,
  Heart,
  Megaphone,
  Pause,
  Play,
  Award,
  PanelRightOpen,
  PanelRightClose,
  Target,
} from "lucide-react";
import { GameState, FlavorType, Shop, Country, EventLogEntry } from "./types";
import {
  ALL_GOAL_MAP,
  applyGoalProgress,
  checkGoalResets,
  getGoalLabel,
  getRewardLabel,
} from "./game/goals";
import {
  FLAVORS,
  INITIAL_SHOPS,
  CHANCES,
  MULTIPLIERS,
  COUNTRIES,
  BACKGROUNDS,
  INITIAL_BLEND_TIME,
  TAX_RATE,
  FLAVOR_COMBOS,
} from "./constants";
import type { FlavorCombo } from "./constants";
import { UPGRADE_REGISTRY } from "./registry";
import { createDefaultState, sanitizeLoadedState } from "./state";
import pkg from "../package.json";
import { formatLargeNumber, timeToAfford } from "./utils/format";
import SmoothMoneyCounter from "./components/SmoothMoneyCounter";
import { encodeSaveCode, decodeSaveCode } from "./utils/saveCode";
import UpgradeCard from "./components/UpgradeCard";
import StatBox from "./components/StatBox";
import MusicPlayer from "./components/MusicPlayer";
import AboutPanel from "./components/panels/AboutPanel";
import HelpPanel from "./components/panels/HelpPanel";
import AchievementsPanel from "./components/panels/AchievementsPanel";
import SettingsPanel from "./components/panels/SettingsPanel";
import GuideModal from "./components/GuideModal";
import {
  STARTER_GUIDE,
  FEATURE_GUIDES,
  ALL_REPLAYABLE_GUIDES,
  type GuideStep,
} from "./components/guides";
import { useSavedGameState } from "./hooks/useSavedGameState";
import {
  calcGlobalMultiplier,
  calcIncomePerSecond,
  calcManualBlendGain,
  rollSpecialOutcomes,
} from "./game/logic";
import {
  ACHIEVEMENTS,
  scaleAchievementMoney,
  scaleAchievementBuff,
} from "./achievements";
import {
  levelFromXp,
  levelProgress,
  levelUpReward,
  LEVEL_UNLOCKS,
  WAGE_EMPLOYEE_REQUIREMENT,
  XP_REWARDS,
} from "./game/leveling";

import { Analytics } from "@vercel/analytics/react";

const SAVE_KEY = "milkshake-tycoon-v1";
const APP_VERSION = pkg.version;

// Background milkshakes produced per employee per second. Lets staff
// contribute to the total shake count (and shake achievements), not just cash.
const EMPLOYEE_SHAKE_RATE = 0.15;

// --- Utility Functions ---
/** Safely convert any value to a valid number, defaulting to 0 if NaN or undefined */
const safeNumber = (value: any, defaultVal: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultVal : num;
};

/** Safely perform a calculation, returning 0 if result is NaN */
const safeCalc = (fn: () => number): number => {
  const result = fn();
  return isNaN(result) ? 0 : result;
};

const formatGameDate = (
  gameDays: number,
  format: "mdy" | "dmy" = "mdy",
): string => {
  const baseDate = new Date(2025, 0, 1);
  const current = new Date(baseDate);
  current.setDate(baseDate.getDate() + gameDays - 1);
  const mm = String(current.getMonth() + 1).padStart(2, "0");
  const dd = String(current.getDate()).padStart(2, "0");
  const yy = String(current.getFullYear()).slice(-2);
  return format === "dmy" ? `${dd}/${mm}/${yy}` : `${mm}/${dd}/${yy}`;
};

const CONSUMABLES = [
  {
    id: "blender_fury",
    name: "Blender Fury",
    desc: "3× all income",
    detail: "5 min",
    multiplier: 3,
    durationSec: 300,
    baseCost: 500,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/25",
  },
  {
    id: "sugar_rush",
    name: "Sugar Rush",
    desc: "2× all income",
    detail: "3 min",
    multiplier: 2,
    durationSec: 180,
    baseCost: 250,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/25",
  },
  {
    id: "employee_overtime",
    name: "Employee Overtime",
    desc: "4× all income",
    detail: "10 min",
    multiplier: 4,
    durationSec: 600,
    baseCost: 1000,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/25",
  },
  {
    id: "lucky_batch",
    name: "Lucky Batch",
    desc: "5× all income",
    detail: "2 min",
    multiplier: 5,
    durationSec: 120,
    baseCost: 2000,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/25",
  },
];

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "soon";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

const EMPLOYEE_BLENDER_ANIMATE = {
  opacity: 1,
  scale: 1,
  y: [0, -6, 0],
  rotate: [-3, 3, -3],
};

export default function App() {
  // --- Game State ---
  const [showModal, setShowModal] = useState<{
    title: string;
    msg: string;
    onConfirm: () => void;
    type: "danger" | "info";
  } | null>(null);

  const { state, setState, clearSave, saveNow } = useSavedGameState(SAVE_KEY);
  const isLightMode = state.options.colorMode === "light";

  useEffect(() => {
    document.documentElement.classList.toggle("light-mode", isLightMode);
    document.documentElement.classList.toggle("dark-mode", !isLightMode);
  }, [isLightMode]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--txt-s",
      String(state.options.textScale),
    );
  }, [state.options.textScale]);

  const [notifications, setNotifications] = useState<
    {
      id: number;
      text: string;
      detail?: string;
      type:
        | "normal"
        | "fanFavorite"
        | "creamy"
        | "crusty"
        | "baked"
        | "golden"
        | "swirled"
        | "decorated"
        | "achievement"
        | "save";
    }[]
  >([]);
  const [floatingGains, setFloatingGains] = useState<
    { id: number; amount: string; x: number; y: number }[]
  >([]);
  const [activeTab, setActiveTab] = useState<
    | "employees"
    | "shops"
    | "upgrades"
    | "flavors"
    | "countries"
    | "achievements"
    | "settings"
    | "help"
    | "about"
  >("employees");
  const [isBlending, setIsBlending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [blendMode, setBlendMode] = useState<"manual" | "autoMix" | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [buyQty, setBuyQty] = useState<1 | 5 | 10 | 50>(1);
  const [displayedIncome, setDisplayedIncome] = useState(0);
  const [collapsedAchCats, setCollapsedAchCats] = useState<Set<string>>(
    new Set(),
  );
  const [upgradesSectionCollapsed, setUpgradesSectionCollapsed] = useState<{
    standard: boolean;
    special: boolean;
  }>({ standard: false, special: false });
  const [isPaused, setIsPaused] = useState(false);
  // Management sidebar collapse. Always toggleable; starts collapsed on phone-
  // sized screens so the blender gets the full width on first load.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );
  const [buffsOpen, setBuffsOpen] = useState(true);
  const [incomeBreakdownOpen, setIncomeBreakdownOpen] = useState(false);
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [offlineSummary, setOfflineSummary] = useState<{
    earned: number;
    durationMs: number;
  } | null>(null);
  const [shownLogCount, setShownLogCount] = useState(10);
  // The currently-displayed guide (first-time tutorial or a feature unlock
  // guide). `starter` marks the first-time walkthrough so finishing it flips
  // the seenTutorial flag.
  const [activeGuide, setActiveGuide] = useState<{
    steps: GuideStep[];
    starter: boolean;
  } | null>(null);

  // Auto "zoom to fit" so the dense two-pane layout scales down on small
  // screens / low resolutions instead of jumbling or overflowing.
  const [uiScale, setUiScale] = useState(1);
  useEffect(() => {
    const compute = () => {
      const baseW = 1180;
      const baseH = 720;
      const s = Math.min(
        1,
        window.innerWidth / baseW,
        window.innerHeight / baseH,
      );
      setUiScale(Math.max(0.45, s));
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("orientationchange", compute);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("orientationchange", compute);
    };
  }, []);

  type PendingChoiceEvent = {
    id:
      | "health_inspector"
      | "tiktok_viral"
      | "blender_malfunction"
      | "supply_disruption"
      | "celebrity_endorsement"
      | "staff_walkout"
      | "lucky_ingredient";
    title: string;
    description: string;
    icon: "alert" | "star" | "wrench";
    choiceA: { label: string; description: string; cost: number };
    choiceB: { label: string; description: string };
  };
  const [pendingChoiceEvent, setPendingChoiceEvent] =
    useState<PendingChoiceEvent | null>(null);

  type ActiveEventType = {
    id: string;
    title: string;
    description: string;
    icon: "alert" | "star" | "zap";
    bonusLabel: string;
    duration: number;
    expiresAtDay: number;
  };
  const [activeEvent, setActiveEvent] = useState<ActiveEventType | null>(null);

  // --- Refs for Game Loop ---
  const previousTimeRef = useRef<number>(null);
  const blendFrameRef = useRef<number | null>(null);
  const blendTimeoutRef = useRef<number | null>(null);
  const dayTimeRef = useRef<number>(0);
  const earningsBuffer = useRef(0);
  const lastIncomeUpdate = useRef(Date.now());
  const cycleEarningsRef = useRef(0);
  const gameDaysRef = useRef(state.gameDays);
  const lastCycleRef = useRef(Math.floor((state.gameDays - 1) / 30));
  const lastEventDayRef = useRef<number>(-999);
  const fanFavBonusRef = useRef<number>(0);
  const wageChancesMultRef = useRef<number>(1);
  const wageIncomeMultRef = useRef<number>(1);
  const wagePayrollMultRef = useRef<number>(1);
  const employeeCountRef = useRef<number>(0);
  const shakePriceManualMultRef = useRef<number>(1);
  const shakePricePassiveMultRef = useRef<number>(1);
  const produceMilkshakeRef = useRef<(isManual?: boolean) => void>(() => {});
  const shakeBufferRef = useRef(0);
  const moneyXpBucketRef = useRef(
    state.money > 0 ? Math.floor(Math.log10(state.money)) : 0,
  );
  const blenderCountRef = useRef(1);
  const prevLevelRef = useRef(levelFromXp(state.xp));
  const gamePausedRef = useRef(false);
  const pauseStartRef = useRef<number | null>(null);
  const lastActivityRef = useRef(Date.now());
  // Track which achievement IDs have already fired a notification so rapid
  // re-renders or StrictMode double-fires can't show the same popup twice.
  const shownAchievementsRef = useRef<Set<string>>(
    new Set(state.earnedAchievements),
  );
  // Monotonically increasing ID for notifications to avoid Date.now() collisions.
  const notifSeqRef = useRef(0);

  // --- Logic Helpers ---
  const addNotification = (
    text: string,
    type:
      | "normal"
      | "fanFavorite"
      | "creamy"
      | "crusty"
      | "baked"
      | "golden"
      | "swirled"
      | "decorated"
      | "achievement"
      | "save" = "normal",
    durationMs?: number,
    detail?: string,
  ) => {
    notifSeqRef.current += 1;
    const id = notifSeqRef.current;
    setNotifications((prev: any) =>
      [{ id, text, detail, type }, ...prev].slice(0, 7),
    );
    // Use the player's configured duration unless an explicit override is passed.
    const defaultMs =
      type === "achievement" || type === "save"
        ? (state.options.notifDuration ?? 8) * 1000
        : 3000;
    const duration = durationMs ?? defaultMs;
    setTimeout(() => {
      setNotifications((prev: any) => prev.filter((n: any) => n.id !== id));
    }, duration);
  };

  // --- Buff Multiplier ---
  const getBuffMultiplier = useCallback(() => {
    const now = Date.now();
    return state.activeBuffs
      .filter((b) => b.expiresAt > now)
      .reduce((acc, b) => acc * b.multiplier, 1);
  }, [state.activeBuffs]);

  // Active (non-expired) buffs, used by the itemized buff panel.
  const activeBuffsList = state.activeBuffs.filter(
    (b) => b.expiresAt > Date.now(),
  );

  // --- Centralized buff helper ---
  // Always a functional update so concurrent grants (achievements, events,
  // level-ups) can never clobber each other or drop existing buffs.
  const buffSeqRef = useRef(0);
  const addBuff = useCallback(
    (multiplier: number, durationSec: number, label: string) => {
      const now = Date.now();
      buffSeqRef.current += 1;
      const seq = buffSeqRef.current;
      setState((prev: GameState) => ({
        ...prev,
        activeBuffs: [
          ...prev.activeBuffs,
          {
            id: `buff_${now}_${seq}`,
            multiplier,
            expiresAt: now + durationSec * 1000,
            label,
            kind: multiplier >= 1 ? ("bonus" as const) : ("penalty" as const),
          },
        ],
      }));
    },
    [setState],
  );

  // --- XP helper ---
  const addXp = useCallback(
    (amount: number) => {
      if (!Number.isFinite(amount) || amount <= 0) return;
      setState((prev: GameState) => ({ ...prev, xp: (prev.xp || 0) + amount }));
    },
    [setState],
  );

  // --- Power-Up helpers ---
  const buyConsumable = useCallback(
    (id: string, cost: number) => {
      setState((prev: GameState) => {
        if (prev.money < cost) return prev;
        let result: GameState = {
          ...prev,
          money: prev.money - cost,
          consumables: {
            ...prev.consumables,
            [id]: (prev.consumables[id] || 0) + 1,
          },
        };
        result = applyGoalProgress(result, "spendMoney", cost);
        return result;
      });
    },
    [setState],
  );

  const activateConsumable = useCallback(
    (id: string, multiplier: number, durationSec: number, label: string) => {
      setState((prev: GameState) => {
        const stock = prev.consumables[id] || 0;
        if (stock <= 0) return prev;
        let result: GameState = {
          ...prev,
          consumables: { ...prev.consumables, [id]: stock - 1 },
        };
        result = applyGoalProgress(result, "activatePowerUp", 1);
        return result;
      });
      addBuff(multiplier, durationSec, label);
    },
    [setState, addBuff],
  );

  const claimGoal = useCallback(
    (id: string, category: "daily" | "hourly") => {
      const def = ALL_GOAL_MAP.get(id);
      if (!def) return;
      const goalList =
        category === "daily" ? state.goals?.daily : state.goals?.hourly;
      const goal = goalList?.find((g) => g.id === id);
      if (!goal || goal.progress < goal.target || goal.claimed) return;

      setState((prev: GameState) => {
        if (!prev.goals) return prev;
        const gList =
          category === "daily" ? prev.goals.daily : prev.goals.hourly;
        const g = gList.find((ge) => ge.id === id);
        if (!g || g.progress < g.target || g.claimed) return prev;
        let result: GameState = {
          ...prev,
          goals: {
            ...prev.goals,
            [category]: gList.map((ge) =>
              ge.id === id ? { ...ge, claimed: true } : ge,
            ),
          },
        };
        if (def.reward.kind === "xp") {
          result = { ...result, xp: (result.xp || 0) + def.reward.xp };
        } else if (def.reward.kind === "money") {
          result = {
            ...result,
            money: result.money + Math.floor(g.target * def.reward.factor),
          };
        }
        return result;
      });

      if (def.reward.kind === "buff") {
        addBuff(
          def.reward.multiplier,
          def.reward.durationSec,
          def.reward.label,
        );
      }

      addNotification(
        `Goal complete! ${getRewardLabel(def.reward, goal.target)}`,
        "achievement",
      );
    },
    [setState, addBuff, addNotification, state.goals],
  );

  // --- Level info + feature gating ---
  const lvlInfo = levelProgress(state.xp);
  const playerLevel = lvlInfo.level;
  const flavorsUnlocked = playerLevel >= LEVEL_UNLOCKS.flavors;
  const shopsUnlocked = playerLevel >= LEVEL_UNLOCKS.shops;
  const employeesUnlocked = playerLevel >= LEVEL_UNLOCKS.employees;
  const shakePriceUnlocked = playerLevel >= LEVEL_UNLOCKS.shakePrice;
  const specialUpgradesUnlocked = playerLevel >= LEVEL_UNLOCKS.specialUpgrades;
  const backgroundsUnlocked = playerLevel >= LEVEL_UNLOCKS.backgrounds;
  const countriesUnlocked = playerLevel >= LEVEL_UNLOCKS.countries;

  const activeCombo =
    FLAVOR_COMBOS.find((c) =>
      c.flavors.every((f) => state.activeFlavors.includes(f)),
    ) ?? null;

  const getGlobalMultiplier = useCallback(() => {
    const comboMult = FLAVOR_COMBOS.filter((c) =>
      c.flavors.every((f) => state.activeFlavors.includes(f)),
    ).reduce((acc, c) => acc * c.multiplier, 1);
    return safeCalc(
      () =>
        calcGlobalMultiplier(
          {
            unlockedCountries: state.unlockedCountries,
            activeFlavors: state.activeFlavors,
            upgrades: state.upgrades,
          },
          COUNTRIES,
          FLAVORS,
        ) * comboMult,
    );
  }, [
    state.unlockedCountries,
    state.activeFlavors,
    state.upgrades.recipeDevelopment,
    state.upgrades.ingredientQuality,
    state.upgrades.storefrontAppeal,
    state.upgrades.socialMediaBuzz,
    state.upgrades.masterMixologist,
  ]);

  const getIncomePerSecond = useCallback(() => {
    return calcIncomePerSecond(
      { shops: state.shops, upgrades: state.upgrades },
      getGlobalMultiplier(),
    );
  }, [
    state.shops,
    state.upgrades.marketingCampaign,
    state.upgrades.employeeTraining,
    state.upgrades.customBlending,
    state.upgrades.distributionNetwork,
    state.upgrades.portionSize,
    state.upgrades.loyaltyProgram,
    state.upgrades.freezerTech,
    state.upgrades.rushHourOptimization,
    getGlobalMultiplier,
  ]);

  const getEmployeeCount = useCallback(
    () =>
      state.shops
        .filter((shop) => shop.section === "employees")
        .reduce((acc, shop) => acc + (shop.count || 0), 0),
    [state.shops],
  );

  const getEmployeeCapacity = useCallback(
    () =>
      state.shops
        .filter((shop) => shop.section === "shops")
        .reduce(
          (acc, shop) => acc + (shop.count || 0) * (shop.employeeCapacity || 0),
          0,
        ),
    [state.shops],
  );

  const totalShopExtensions = state.shops.reduce(
    (acc, shop) => acc + (shop.section === "shops" ? shop.count : 0),
    0,
  );

  const wagePayrollMult =
    state.options.wageLevel === "high"
      ? 1.5
      : state.options.wageLevel === "low"
        ? 0.7
        : 1;
  const monthlyOperatingCost =
    state.shops.reduce(
      (acc, shop) => acc + (shop.count || 0) * (shop.monthlyCost || 0),
      0,
    ) * wagePayrollMult;

  const daysUntilPayroll = 30 - ((state.gameDays - 1) % 30);

  const incomeBreakdown = React.useMemo(() => {
    const total = getIncomePerSecond();
    if (total === 0) return null;
    const employeeBase = state.shops
      .filter((s) => s.section === "employees")
      .reduce((acc, s) => acc + (s.count || 0) * (s.baseIncome || 0), 0);
    const shopBase = state.shops
      .filter((s) => s.section === "shops")
      .reduce((acc, s) => acc + (s.count || 0) * (s.baseIncome || 0), 0);
    const totalBase = employeeBase + shopBase;
    if (totalBase === 0) return null;
    const upgMult =
      (1 + state.upgrades.marketingCampaign * 0.1) *
      (1 + state.upgrades.employeeTraining * 0.08) *
      (1 + state.upgrades.customBlending * 0.15) *
      (1 + state.upgrades.distributionNetwork * 0.08) *
      (1 + state.upgrades.portionSize * 0.1) *
      (1 + (state.upgrades.loyaltyProgram || 0) * 0.08) *
      (1 + (state.upgrades.freezerTech || 0) * 0.06) *
      (1 + (state.upgrades.rushHourOptimization || 0) * 0.07);
    return {
      employeeIncome: (total * employeeBase) / totalBase,
      shopIncome: (total * shopBase) / totalBase,
      upgMult,
      globalMult: getGlobalMultiplier(),
    };
  }, [state.shops, state.upgrades, getIncomePerSecond, getGlobalMultiplier]);

  const produceMilkshake = useCallback(
    (isManual = false) => {
      // No flavor in the blender → nothing to sell. The blender always keeps
      // at least one flavor available via the single-slot swap, so an empty
      // blender is a deliberate choice and earns nothing.
      if (state.activeFlavors.length === 0) return;
      const globalMult = getGlobalMultiplier();
      const wageMult = wageChancesMultRef.current;
      const modifiedChances = {
        fanFavoriteBase: Math.min(
          0.95,
          CHANCES.fanFavoriteBase * wageMult + fanFavBonusRef.current,
        ),
        creamyBase: Math.min(0.95, CHANCES.creamyBase * wageMult),
        crustyBase: Math.min(0.95, CHANCES.crustyBase * wageMult),
        bakedBase: Math.min(0.95, CHANCES.bakedBase * wageMult),
        swirledBase: Math.min(0.95, CHANCES.swirledBase * wageMult),
        decoratedBase: Math.min(0.95, CHANCES.decoratedBase * wageMult),
        goldenBase: Math.min(
          0.95,
          CHANCES.goldenBase *
            (state.upgrades.goldenTouch >= 1 ? 5 : 1) *
            wageMult,
        ),
      };
      const outcome = rollSpecialOutcomes(
        state.upgrades,
        modifiedChances,
        MULTIPLIERS,
      );
      const gain = Math.floor(
        calcManualBlendGain(
          { shops: state.shops, upgrades: state.upgrades },
          globalMult,
          outcome.multiplier,
        ) *
          getBuffMultiplier() *
          (state.upgrades.doubleShot >= 1 ? 2 : 1) *
          shakePriceManualMultRef.current,
      );
      earningsBuffer.current += gain;
      cycleEarningsRef.current += gain;

      if (isManual) {
        const id = Date.now();
        const randomX = (Math.random() - 0.5) * 100;
        setFloatingGains((prev: any) => [
          ...prev,
          { id, amount: formatLargeNumber(gain), x: randomX, y: -100 },
        ]);
        setTimeout(
          () =>
            setFloatingGains((prev: any) =>
              prev.filter((g: any) => g.id !== id),
            ),
          1000,
        );
      }

      setState((prev: GameState) => {
        const newTotalStats = { ...prev.totalStats };
        newTotalStats.totalMilkshakes += 1;
        if (outcome.activeTypes.includes("FAN_FAVORITE"))
          newTotalStats.totalFanFavorite += 1;
        if (outcome.activeTypes.includes("CREAMY"))
          newTotalStats.totalCreamy += 1;
        if (outcome.activeTypes.includes("CRUSTY"))
          newTotalStats.totalCrusty += 1;
        if (outcome.activeTypes.includes("BAKED"))
          newTotalStats.totalBaked += 1;
        if (outcome.activeTypes.includes("GOLDEN"))
          newTotalStats.totalGolden += 1;
        if (outcome.activeTypes.includes("SWIRLED"))
          newTotalStats.totalSwirled += 1;
        if (outcome.activeTypes.includes("DECORATED"))
          newTotalStats.totalDecorated += 1;

        let result: GameState = {
          ...prev,
          money: prev.money + gain,
          totalStats: newTotalStats,
          xp:
            (prev.xp || 0) +
            (isManual ? XP_REWARDS.manualBlend : XP_REWARDS.autoBlend),
        };
        if (isManual) result = applyGoalProgress(result, "manualBlend", 1);
        if (outcome.activeTypes.includes("GOLDEN"))
          result = applyGoalProgress(result, "triggerGolden", 1);
        if (outcome.activeTypes.includes("FAN_FAVORITE"))
          result = applyGoalProgress(result, "triggerFanFavorite", 1);
        return result;
      });

      if (outcome.activeTypes.length > 0) {
        const formatOutcomeLabel = () => {
          const names = outcome.activeTypes.map((t) =>
            t === "FAN_FAVORITE"
              ? "FAN FAVORITE"
              : t === "CREAMY"
                ? "CREAMY"
                : t,
          );
          const hasFan = outcome.activeTypes.includes("FAN_FAVORITE");
          if (!hasFan) return `${names.join(" ")} BLEND!`;

          const rest = names.filter((n) => n !== "FAN FAVORITE");
          if (rest.length === 0) return "FAN FAVORITE BLEND!";
          return `FAN FAVORITE: ${rest.join(" ")} BLEND!`;
        };

        const typeLabel = formatOutcomeLabel();
        const multLabel = ` x${outcome.multiplier.toLocaleString()}`;

        const notificationType =
          outcome.activeTypes[0] === "FAN_FAVORITE"
            ? "fanFavorite"
            : outcome.activeTypes[0] === "CREAMY"
              ? "creamy"
              : outcome.activeTypes[0] === "DECORATED"
                ? "decorated"
                : outcome.activeTypes[0].toLowerCase();
        addNotification(`${typeLabel} ${multLabel}`, notificationType as any);
      }
    },
    [
      state.shops,
      state.upgrades,
      state.activeFlavors.length,
      getGlobalMultiplier,
      getBuffMultiplier,
    ],
  );

  // Keep a stable ref so the blend animation can call the latest produceMilkshake
  // without including it in the blend effect's deps (which would restart the blend
  // mid-animation whenever an achievement buff changes its identity).
  useEffect(() => {
    produceMilkshakeRef.current = produceMilkshake;
  }, [produceMilkshake]);

  // Keep the live blender count in a ref so the blend animation can read it
  // without restarting whenever the player buys an Additional Blender.
  useEffect(() => {
    blenderCountRef.current = 1 + (state.upgrades.extraBlender || 0);
  }, [state.upgrades.extraBlender]);

  // --- Global pause state ---
  // Manual pause OR any blocking overlay (tutorial, modal, event, import).
  const gamePaused =
    isPaused ||
    !!activeGuide ||
    !!showModal ||
    !!pendingChoiceEvent ||
    importOpen;
  // Update synchronously during render so intervals always see the latest value.
  gamePausedRef.current = gamePaused;

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+S — manual save; capture phase ensures we beat the browser's Save dialog.
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        e.stopPropagation();
        saveNow();
        addNotification("Game saved.", "save");
        return;
      }
      // ESC closes any open popup first, then falls through to pause
      if (e.key === "Escape") {
        if (chronicleOpen) {
          setChronicleOpen(false);
          return;
        }
        if (goalsOpen) {
          setGoalsOpen(false);
          return;
        }
      }
      // ESC or Space — toggle pause (only when no modal/overlay is open)
      if (
        (e.key === "Escape" || e.key === " ") &&
        !activeGuide &&
        !showModal &&
        !pendingChoiceEvent &&
        !importOpen
      ) {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    // Use capture:true so our handler fires before the browser's native shortcut handler.
    document.addEventListener("keydown", handler, { capture: true });
    return () =>
      document.removeEventListener("keydown", handler, { capture: true });
  }, [saveNow, activeGuide, showModal, pendingChoiceEvent, importOpen]);

  // --- Manual Shake Handle ---
  const handleManualShake = () => {
    if (isBlending) return;
    if (gamePausedRef.current) return;
    if (state.activeFlavors.length === 0) {
      addNotification("Add a flavor to the blender before mixing!", "crusty");
      return;
    }
    setIsBlending(true);
    setProgress(0);
    setBlendMode("manual");
  };

  useEffect(() => {
    if (!isBlending) {
      return;
    }

    // Calculate blend time: reduced by mixSpeed, halved by speedBlending, min 0.5s
    const blendTime = Math.max(
      0.5,
      (INITIAL_BLEND_TIME - state.upgrades.mixSpeed * 0.2) *
        (state.upgrades.speedBlending >= 1 ? 0.5 : 1),
    );
    const durationMs = blendTime * 1000;
    let start = performance.now();
    let lastFrame = start;

    const updateProgress = () => {
      const now = performance.now();
      // While paused, keep sliding the start time forward so the blend
      // progress freezes instead of completing in the background.
      if (gamePausedRef.current) {
        start += now - lastFrame;
        lastFrame = now;
        blendFrameRef.current = requestAnimationFrame(updateProgress);
        return;
      }
      lastFrame = now;
      const elapsed = now - start;
      const newProgress = Math.min(100, (elapsed / durationMs) * 100);

      setProgress(newProgress);

      if (newProgress < 100) {
        blendFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        setProgress(100);
        // Each installed blender produces an independent milkshake this cycle.
        const blenders = Math.max(1, blenderCountRef.current);
        for (let b = 0; b < blenders; b += 1) {
          produceMilkshakeRef.current(blendMode === "manual");
        }

        blendTimeoutRef.current = window.setTimeout(() => {
          setIsBlending(false);
          setProgress(0);
          setBlendMode(null);
        }, 300);
      }
    };

    blendFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (blendFrameRef.current !== null) {
        cancelAnimationFrame(blendFrameRef.current);
        blendFrameRef.current = null;
      }
      if (blendTimeoutRef.current !== null) {
        clearTimeout(blendTimeoutRef.current);
        blendTimeoutRef.current = null;
      }
    };
  }, [
    isBlending,
    state.upgrades.mixSpeed,
    state.upgrades.speedBlending,
    blendMode,
  ]);

  // --- Purchases ---
  const getShopCost = (shop: Shop) => {
    const discount = 1 - state.upgrades.bulkPurchasing * 0.05;
    return Math.floor(shop.cost * Math.max(0.5, discount));
  };

  const buyShop = (id: string) => {
    const shop = state.shops.find((s: Shop) => s.id === id);
    const cost = shop ? getShopCost(shop) : 0;
    const employeeCapacity = getEmployeeCapacity();
    const currentEmployees = getEmployeeCount();
    if (!shop || state.money < cost) return;

    if (shop.section === "employees" && currentEmployees >= employeeCapacity) {
      addNotification(
        employeeCapacity === 0
          ? "No shop extensions purchased yet. Add a shop first to hire staff."
          : "Employee capacity reached. Buy more shop extensions to hire additional staff.",
        "crusty",
      );
      return;
    }

    setState((prev: GameState) => {
      const isEmployee = shop.section === "employees";
      let result: GameState = {
        ...prev,
        money: prev.money - cost,
        xp:
          (prev.xp || 0) +
          (isEmployee ? XP_REWARDS.hireEmployee : XP_REWARDS.buyShop),
        shops: prev.shops.map((s: Shop) =>
          s.id === id
            ? { ...s, count: s.count + 1, cost: Math.floor(s.cost * 1.15) }
            : s,
        ),
      };
      if (isEmployee) result = applyGoalProgress(result, "hireEmployee", 1);
      result = applyGoalProgress(result, "spendMoney", cost);
      return result;
    });
  };

  const bulkBuyCost = (shop: Shop, qty: number): number => {
    const discount = qty >= 50 ? 0.9 : qty >= 10 ? 0.95 : qty >= 5 ? 0.98 : 1.0;
    let total = 0;
    let cost = getShopCost(shop);
    for (let i = 0; i < qty; i++) {
      total += cost;
      cost = Math.floor(cost * 1.15);
    }
    return Math.floor(total * discount);
  };

  const buyShopBulk = (id: string, qty: number) => {
    const shop = state.shops.find((s: Shop) => s.id === id);
    if (!shop || shop.section !== "employees") return;
    const employeeCapacity = getEmployeeCapacity();
    const currentEmployees = getEmployeeCount();
    const canBuy = Math.min(
      qty,
      Math.max(0, employeeCapacity - currentEmployees),
    );
    if (canBuy <= 0) {
      addNotification(
        employeeCapacity === 0
          ? "No shop extensions purchased yet. Add a shop first to hire staff."
          : "Employee capacity reached. Buy more shop extensions to hire additional staff.",
        "crusty",
      );
      return;
    }
    const totalCost = bulkBuyCost(shop, canBuy);
    if (state.money < totalCost) return;
    setState((prev: GameState) => {
      const currentShop = prev.shops.find((s) => s.id === id);
      const newCount = (currentShop?.count ?? 0) + canBuy;
      let result: GameState = {
        ...prev,
        money: prev.money - totalCost,
        xp: (prev.xp || 0) + XP_REWARDS.hireEmployee * canBuy,
        shops: prev.shops.map((s: Shop) =>
          s.id === id
            ? {
                ...s,
                count: newCount,
                cost: Math.floor(s.cost * Math.pow(1.15, canBuy)),
              }
            : s,
        ),
      };
      result = applyGoalProgress(result, "hireEmployee", canBuy);
      result = applyGoalProgress(result, "spendMoney", totalCost);
      return result;
    });
  };

  const unlockFlavor = (type: FlavorType) => {
    const flavor = FLAVORS[type];
    if (state.unlockedFlavors.includes(type) || state.money < flavor.unlockCost)
      return;

    setState((prev: GameState) => {
      let result: GameState = {
        ...prev,
        money: prev.money - flavor.unlockCost,
        xp: (prev.xp || 0) + XP_REWARDS.unlockFlavor,
        unlockedFlavors: [...prev.unlockedFlavors, type],
      };
      result = applyGoalProgress(result, "spendMoney", flavor.unlockCost);
      return result;
    });
  };

  const buyCountry = (id: string) => {
    const country = COUNTRIES.find((c: Country) => c.id === id);
    const negotiation = state.upgrades.expansionNegotiation || 0;
    const discount = 1 - Math.min(0.3, negotiation * 0.03);
    const cost = country ? Math.floor(country.cost * discount) : 0;
    if (!country || state.unlockedCountries.includes(id) || state.money < cost)
      return;

    setState((prev: GameState) => {
      let result: GameState = {
        ...prev,
        money: prev.money - cost,
        xp: (prev.xp || 0) + XP_REWARDS.unlockCountry,
        unlockedCountries: [...prev.unlockedCountries, id],
      };
      result = applyGoalProgress(result, "spendMoney", cost);
      return result;
    });
  };

  const buyUpgrade = (key: keyof GameState["upgrades"], cost: number) => {
    const def = UPGRADE_REGISTRY[key];
    const level = state.upgrades[key] || 0;
    if (level >= def.maxLevel || state.money < cost) return;

    setState((prev: GameState) => {
      let result: GameState = {
        ...prev,
        money: prev.money - cost,
        xp: (prev.xp || 0) + XP_REWARDS.buyUpgrade,
        upgrades: { ...prev.upgrades, [key]: (prev.upgrades[key] || 0) + 1 },
      };
      result = applyGoalProgress(result, "buyUpgrade", 1);
      result = applyGoalProgress(result, "spendMoney", cost);
      return result;
    });
    const name = def.name ?? key;
    addNotification(`${name} upgraded`, "normal");
  };

  const getUpgradeCost = (key: keyof GameState["upgrades"]) => {
    const def = UPGRADE_REGISTRY[key];
    const level = state.upgrades[key] || 0;
    return Math.floor(def.baseCost * Math.pow(def.costMultiplier, level));
  };

  const getUpgradeDesc = (key: keyof GameState["upgrades"]) => {
    const def = UPGRADE_REGISTRY[key];
    if (key === "mixSpeed") {
      const blendTime = Math.max(
        0.5,
        INITIAL_BLEND_TIME - state.upgrades.mixSpeed * 0.2,
      );
      return `${def.description} Currently: ${blendTime.toFixed(1)}s`;
    }
    if (key === "flavorSlots") {
      const slots = (state.upgrades.flavorSlots || 0) + 1;
      return `${slots}/3 flavor slot${slots !== 1 ? "s" : ""} unlocked`;
    }
    if (key === "goldenTouch") {
      const base = (CHANCES.goldenBase * 100).toFixed(2);
      const boosted = (CHANCES.goldenBase * 5 * 100).toFixed(2);
      return state.upgrades.goldenTouch >= 1
        ? `Golden Milkshake chance boosted to ${boosted}%.`
        : `Boosts Golden Milkshake chance from ${base}% to ${boosted}%.`;
    }
    if (key === "doubleShot") {
      return state.upgrades.doubleShot >= 1
        ? "Active: every manual blend earns 2× income."
        : "One-time unlock: every manual blend earns 2× income.";
    }
    if (key === "speedBlending") {
      const baseSecs = Math.max(
        0.5,
        INITIAL_BLEND_TIME - state.upgrades.mixSpeed * 0.2,
      );
      const boostedSecs = Math.max(0.5, baseSecs * 0.5);
      return state.upgrades.speedBlending >= 1
        ? `Active: blend time is ${boostedSecs.toFixed(1)}s (halved).`
        : `One-time unlock: halves blend time (currently ${baseSecs.toFixed(1)}s → ${boostedSecs.toFixed(1)}s).`;
    }
    if (key === "extraBlender") {
      const total = 1 + (state.upgrades.extraBlender || 0);
      return total >= 4
        ? "Maxed: 4 blenders running. Every blend cycle makes 4 milkshakes."
        : `${total}/4 blenders running. Each blend cycle makes ${total} milkshake${total !== 1 ? "s" : ""}. Buy another to add one more.`;
    }
    if (key === "shiftManager") {
      const level = state.upgrades.shiftManager ?? 0;
      if (level >= 2)
        return "Active (Lv.2): earns 50% of normal income while offline, capped at 2 hours.";
      if (level >= 1)
        return "Active (Lv.1): earns 25% of normal income while offline, capped at 1 hour. Upgrade for 50% + 2hr cap.";
      return "Your manager keeps income flowing when you step away. Lv.1: 25% offline income (1hr cap). Lv.2: 50% offline income (2hr cap).";
    }
    return def.description;
  };

  const toggleFlavor = (type: FlavorType) => {
    const maxSlots = (state.upgrades.flavorSlots || 0) + 1;
    if (
      !state.activeFlavors.includes(type) &&
      state.activeFlavors.length >= maxSlots
    ) {
      if (maxSlots === 1) {
        // Single slot: swap instead of blocking
        setState((prev: GameState) => ({ ...prev, activeFlavors: [type] }));
        return;
      }
      addNotification(
        maxSlots < 3
          ? "Blender full! Upgrade Multi-Flavor Blending for more slots."
          : "Blender full! Max 3 flavors at once.",
        "crusty",
      );
      return;
    }
    setState((prev: GameState) => {
      const active = [...prev.activeFlavors];
      if (active.includes(type)) {
        // Allow removing down to empty — player can pick a different flavor after
        return { ...prev, activeFlavors: active.filter((t) => t !== type) };
      }
      return { ...prev, activeFlavors: [...active, type] };
    });
  };

  const exportSave = async () => {
    try {
      const code = await encodeSaveCode(state);
      await navigator.clipboard.writeText(code);
      setShowModal({
        title: "Save exported",
        msg: "Your save code has been copied to your clipboard.\n\nKeep it safe. You can use it to restore your progress on any device.",
        type: "info",
        onConfirm: () => {},
      });
    } catch (e) {
      console.error("Export failed", e);
      setShowModal({
        title: "Export failed",
        msg: "Could not export your save code. Try again (or copy it manually from localStorage).",
        type: "danger",
        onConfirm: () => {},
      });
    }
  };

  const importSave = () => {
    setImportOpen(true);
    setImportText("");
  };

  const exportSaveFile = async () => {
    try {
      const code = await encodeSaveCode(state);
      const blob = new Blob([code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "milkshake-mania.smm";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("File export failed", e);
      setShowModal({
        title: "Export failed",
        msg: "Could not save the file. Try exporting via clipboard instead.",
        type: "danger",
        onConfirm: () => {},
      });
    }
  };

  const importSaveFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".smm";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const decoded = await decodeSaveCode(text.trim());
        const loaded = sanitizeLoadedState(decoded);
        setState(loaded);
        addNotification("Save imported", "normal");
      } catch {
        setShowModal({
          title: "Import failed",
          msg: "That does not look like a valid .smm save file. Make sure the file has not been modified.",
          type: "danger",
          onConfirm: () => {},
        });
      }
    };
    input.click();
  };

  const resetGame = ({ keepOptions }: { keepOptions: boolean }) => {
    clearSave();

    const base = createDefaultState();
    const nextOptions = keepOptions ? state.options : base.options;

    setState({
      ...base,
      options: { ...nextOptions },
      earnedAchievements: [],
      activeBuffs: [],
    });

    setNotifications([]);
    setFloatingGains([]);
    setActiveTab("employees");
    setIsBlending(false);
    setProgress(0);
    setBlendMode(null);
    setImportOpen(false);
    setImportText("");
    setIsPaused(false);
    shakeBufferRef.current = 0;
    moneyXpBucketRef.current = 0;
    prevLevelRef.current = 0;
    blenderCountRef.current = 1;

    // A full wipe (options reset too) clears seenTutorial, so replay the
    // first-time tutorial exactly as if the game were freshly installed.
    if (!keepOptions) {
      setActiveGuide({ steps: STARTER_GUIDE, starter: true });
    } else {
      setActiveGuide(null);
    }

    setTimeout(() => {
      window.dispatchEvent(new Event("storage"));
    }, 0);
  };

  const resetSettings = () => {
    const base = createDefaultState();
    setState((prev) => ({
      ...prev,
      options: { ...base.options },
    }));
  };

  // --- Auto Visual Blend & Auto-Mixer Logic ---
  useEffect(() => {
    let interval: any;
    if (state.options.autoMix) {
      const tuning = state.upgrades.autoMixerTuning || 0;
      const intervalMs = Math.max(400, 1000 - tuning * 100);
      interval = setInterval(() => {
        if (
          !isBlending &&
          !gamePausedRef.current &&
          state.activeFlavors.length > 0
        ) {
          setIsBlending(true);
          setProgress(0);
          setBlendMode("autoMix");
        }
      }, intervalMs);
    }
    return () => clearInterval(interval);
  }, [
    isBlending,
    state.options.autoMix,
    state.upgrades.autoMixerTuning,
    state.activeFlavors.length,
  ]);

  // Persistence handled by useSavedGameState

  // --- Game Loop ---
  // Runs on a fixed ~5 Hz interval rather than every animation frame: a single
  // batched state commit per tick keeps the (large) app from re-rendering 60+
  // times a second, which matters a lot on low-end hardware. Income is still
  // delta-time accurate because we measure real elapsed time each tick.
  useEffect(() => {
    const COMMIT_MS = 200;
    previousTimeRef.current = Date.now();
    const interval = window.setInterval(() => {
      const now = Date.now();
      // Paused: advance nothing and reset the clock so the gap isn't counted.
      if (gamePausedRef.current) {
        previousTimeRef.current = now;
        return;
      }
      const dt = previousTimeRef.current
        ? (now - previousTimeRef.current) / 1000
        : 0;
      previousTimeRef.current = now;
      if (dt <= 0) return;

      const income =
        getIncomePerSecond() *
        getBuffMultiplier() *
        wageIncomeMultRef.current *
        shakePricePassiveMultRef.current *
        dt;
      earningsBuffer.current += income;
      cycleEarningsRef.current += income;

      // Employees also blend in the background, contributing to shake count.
      const employees = employeeCountRef.current;
      let shakesProduced = 0;
      if (employees > 0) {
        shakeBufferRef.current += employees * EMPLOYEE_SHAKE_RATE * dt;
        if (shakeBufferRef.current >= 1) {
          shakesProduced = Math.floor(shakeBufferRef.current);
          shakeBufferRef.current -= shakesProduced;
        }
      }

      // Game clock + monthly payroll/tax, folded into one commit.
      dayTimeRef.current += dt;
      const daysToAdvance =
        dayTimeRef.current >= 1 ? Math.floor(dayTimeRef.current) : 0;
      if (daysToAdvance > 0) dayTimeRef.current -= daysToAdvance;

      setState((prev: GameState) => {
        let nextMoney = prev.money + income;
        let newDay = prev.gameDays;
        if (daysToAdvance > 0) {
          newDay = prev.gameDays + daysToAdvance;
          for (let day = prev.gameDays + 1; day <= newDay; day += 1) {
            if (day % 30 === 0) {
              const payroll =
                prev.shops.reduce(
                  (sum, shop) =>
                    sum + (shop.count || 0) * (shop.monthlyCost || 0),
                  0,
                ) * wagePayrollMultRef.current;
              const taxBill =
                calcIncomePerSecond(
                  { shops: prev.shops, upgrades: prev.upgrades },
                  calcGlobalMultiplier(
                    {
                      unlockedCountries: prev.unlockedCountries,
                      activeFlavors: prev.activeFlavors,
                      upgrades: prev.upgrades,
                    },
                    COUNTRIES,
                    FLAVORS,
                  ),
                ) *
                30 *
                TAX_RATE;
              nextMoney -= payroll + taxBill;
            }
          }
        }
        let result: GameState = {
          ...prev,
          money: nextMoney,
          gameDays: newDay,
          totalStats:
            shakesProduced > 0
              ? {
                  ...prev.totalStats,
                  totalMilkshakes:
                    prev.totalStats.totalMilkshakes + shakesProduced,
                }
              : prev.totalStats,
        };
        result = checkGoalResets(result, now);
        if (income > 0)
          result = applyGoalProgress(result, "earnIncome", income);
        return result;
      });
    }, COMMIT_MS);
    return () => clearInterval(interval);
  }, [getIncomePerSecond, getBuffMultiplier]);

  const totalUpgradeLevel = Object.values(state.upgrades).reduce(
    (a, b) => a + b,
    0,
  );

  // --- Achievement Checking ---
  useEffect(() => {
    const derived = {
      employees: getEmployeeCount(),
      shopExtensions: state.shops
        .filter((s) => s.section === "shops")
        .reduce((acc, s) => acc + s.count, 0),
    };

    const newlyEarned = ACHIEVEMENTS.filter(
      (ach) =>
        !state.earnedAchievements.includes(ach.id) && ach.check(state, derived),
    );

    if (newlyEarned.length === 0) return;

    // Prevent duplicate notifications: only fire for achievements we haven't
    // shown a notification for yet (handles StrictMode double-fire and rapid
    // dependency changes that re-run this effect before state flushes).
    const trulyNew = newlyEarned.filter(
      (ach) => !shownAchievementsRef.current.has(ach.id),
    );
    trulyNew.forEach((ach) => shownAchievementsRef.current.add(ach.id));

    setState((prev: GameState) => {
      let newMoney = prev.money;
      const newBuffs = [...prev.activeBuffs];
      const newEarned = [...prev.earnedAchievements];
      let xpGain = 0;
      const now = Date.now();

      newlyEarned.forEach((ach) => {
        if (newEarned.includes(ach.id)) return;
        newEarned.push(ach.id);
        xpGain += XP_REWARDS.achievement;
        if (ach.reward?.type === "money") {
          newMoney += scaleAchievementMoney(ach.reward.amount);
        } else if (ach.reward?.type === "buff") {
          const scaled = scaleAchievementBuff(
            ach.reward.multiplier,
            ach.reward.duration,
          );
          buffSeqRef.current += 1;
          newBuffs.push({
            id: `ach_${ach.id}_${now}_${buffSeqRef.current}`,
            multiplier: scaled.multiplier,
            expiresAt: now + scaled.duration * 1000,
            label: ach.name,
            kind: "bonus",
          });
        }
      });

      return {
        ...prev,
        money: newMoney,
        earnedAchievements: newEarned,
        activeBuffs: newBuffs,
        xp: (prev.xp || 0) + xpGain,
      };
    });

    if (trulyNew.length === 0) return;

    // When a flood unlocks at once (big jump or import), collapse to one toast.
    if (trulyNew.length > 3) {
      addNotification(
        `${trulyNew.length} achievements unlocked!`,
        "achievement",
        undefined,
        "Check the Achievements tab to see them all.",
      );
    } else {
      trulyNew.forEach((ach) => {
        const rewardLabel = ach.reward
          ? ach.reward.type === "money"
            ? `+$${formatLargeNumber(scaleAchievementMoney(ach.reward.amount))}`
            : scaleAchievementBuff(ach.reward.multiplier, ach.reward.duration)
                .label
          : "";
        addNotification(
          `${ach.name}${rewardLabel ? ` · ${rewardLabel}` : ""}`,
          "achievement",
          undefined,
          ach.description,
        );
      });
    }
  }, [
    state.totalStats.totalMilkshakes,
    state.totalStats.totalGolden,
    state.totalStats.totalDecorated,
    state.totalStats.totalSwirled,
    state.totalStats.totalFanFavorite,
    state.totalStats.totalCreamy,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Math.floor(Math.log10(Math.max(1, state.money))),
    state.unlockedFlavors.length,
    state.unlockedCountries.length,
    state.gameDays,
    state.options.autoMix,
    totalUpgradeLevel,
    state.earnedAchievements.length,
    state.xp,
    // totalEmployees and totalShopExtensions derived inside effect
    state.shops,
  ]);

  // --- Buff Cleanup ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (gamePausedRef.current) return; // don't expire buffs while paused
      setState((prev: GameState) => {
        const now = Date.now();
        const filtered = prev.activeBuffs.filter((b) => b.expiresAt > now);
        if (filtered.length === prev.activeBuffs.length) return prev;
        return { ...prev, activeBuffs: filtered };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // --- Money milestone XP (one grant per new order of magnitude) ---
  useEffect(() => {
    const bucket = state.money > 0 ? Math.floor(Math.log10(state.money)) : 0;
    if (bucket > moneyXpBucketRef.current) {
      const steps = bucket - moneyXpBucketRef.current;
      moneyXpBucketRef.current = bucket;
      addXp(XP_REWARDS.moneyMilestone * steps);
    } else if (bucket < moneyXpBucketRef.current) {
      // Money dropped (reset / big spend) — keep the bucket honest.
      moneyXpBucketRef.current = bucket;
    }
  }, [state.money, addXp]);

  // --- Level-up detection: rewards, unlock notes, notifications ---
  useEffect(() => {
    const newLevel = levelFromXp(state.xp);
    if (newLevel > prevLevelRef.current) {
      const from = prevLevelRef.current;
      prevLevelRef.current = newLevel;
      let reward = 0;
      for (let l = from + 1; l <= newLevel; l += 1) reward += levelUpReward(l);
      if (reward > 0) {
        setState((prev: GameState) => ({
          ...prev,
          money: prev.money + reward,
        }));
      }
      // Collect any feature-unlock guides for the levels just crossed. If a
      // big jump unlocks several at once, chain their steps into one guide.
      const unlockedSteps: GuideStep[] = [];
      for (let l = from + 1; l <= newLevel; l += 1) {
        const guide = FEATURE_GUIDES[l];
        if (guide) unlockedSteps.push(...guide.steps);
      }
      if (unlockedSteps.length > 0) {
        // Don't clobber the first-time tutorial if it's still open.
        setActiveGuide((cur) =>
          cur?.starter ? cur : { steps: unlockedSteps, starter: false },
        );
      }
      addNotification(
        `Level ${newLevel} reached! +$${formatLargeNumber(reward)}`,
        "achievement",
        5000,
      );
    } else if (newLevel < prevLevelRef.current) {
      prevLevelRef.current = newLevel; // after a reset
    }
  }, [state.xp]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Pause: freeze buff timers & realtime refs across the paused span ---
  useEffect(() => {
    if (gamePaused) {
      if (pauseStartRef.current == null) pauseStartRef.current = Date.now();
      return;
    }
    if (pauseStartRef.current != null) {
      const pausedMs = Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
      if (pausedMs > 0) {
        setState((prev: GameState) => ({
          ...prev,
          activeBuffs: prev.activeBuffs.map((b) => ({
            ...b,
            expiresAt: b.expiresAt + pausedMs,
          })),
        }));
        lastIncomeUpdate.current += pausedMs;
      }
      previousTimeRef.current = Date.now();
    }
  }, [gamePaused]);

  // --- Wage Refs Sync ---
  // High wages: happier staff (better specials/income) but a heavier payroll.
  // Low wages: cheaper payroll but weaker output and strike risk.
  useEffect(() => {
    const isHigh = state.options.wageLevel === "high";
    const isLow = state.options.wageLevel === "low";
    wageChancesMultRef.current = isHigh ? 2 : isLow ? 0.7 : 1;
    wageIncomeMultRef.current = isHigh ? 1.15 : isLow ? 0.85 : 1;
    wagePayrollMultRef.current = isHigh ? 1.5 : isLow ? 0.7 : 1;
  }, [state.options.wageLevel]);

  // Keep a live employee count in a ref for the (frame-rate) game loop.
  useEffect(() => {
    employeeCountRef.current = state.shops
      .filter((shop) => shop.section === "employees")
      .reduce((acc, shop) => acc + (shop.count || 0), 0);
  }, [state.shops]);

  // --- Shake Price Refs Sync ---
  // Low price: sells more (1.4× passive) but less per manual shake (0.7×)
  // High price: earns more per manual shake (1.5×) but slower passive sales (0.7×)
  useEffect(() => {
    const isHigh = state.options.shakePrice === "high";
    const isLow = state.options.shakePrice === "low";
    shakePriceManualMultRef.current = isHigh ? 1.5 : isLow ? 0.7 : 1;
    shakePricePassiveMultRef.current = isHigh ? 0.7 : isLow ? 1.4 : 1;
  }, [state.options.shakePrice]);

  // --- Low Wage Strike Risk ---
  useEffect(() => {
    if (state.options.wageLevel !== "low") return;
    if (state.shops.every((s) => s.count === 0)) return; // no employees to strike
    if (Math.random() > 0.03) return; // 3% daily chance
    const now = Date.now();
    setState((prev) => ({
      ...prev,
      activeBuffs: [
        ...prev.activeBuffs,
        {
          id: `strike_${now}`,
          multiplier: 0.5,
          expiresAt: now + 3000,
          label: "Workers on Strike",
          kind: "penalty" as const,
        },
      ],
    }));
    addNotification(
      "Workers on strike! -50% income for 3 days.",
      "crusty",
      7000,
    );
  }, [state.gameDays]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Random Events ---
  useEffect(() => {
    if (playerLevel < 2) return;
    const daysSinceLast = state.gameDays - lastEventDayRef.current;
    if (daysSinceLast < 30) return;
    if (activeEvent && state.gameDays < activeEvent.expiresAtDay) return;
    if (pendingChoiceEvent) return;
    if (Math.random() > 0.08) return;

    lastEventDayRef.current = state.gameDays;

    // ~40% chance of interactive event once player has some progress
    const scaledCost = Math.max(500, state.gameDays * 25);
    if (state.gameDays >= 5 && Math.random() < 0.4) {
      const interactiveFactories = [
        (): PendingChoiceEvent => ({
          id: "health_inspector",
          title: "Health Inspector Visit!",
          description:
            "A health inspector just arrived. Your kitchen is borderline. What do you do?",
          icon: "alert",
          choiceA: {
            label: "Pay the Fine",
            description: "Settle quietly. No disruption to operations.",
            cost: scaledCost,
          },
          choiceB: {
            label: "Take Your Chances",
            description:
              "50/50: pass cleanly or fail and suffer -30% income for 5 days.",
          },
        }),
        (): PendingChoiceEvent => ({
          id: "tiktok_viral",
          title: "TikTok Viral Trend!",
          description:
            "One of your shakes is blowing up online. Capitalize or let it ride?",
          icon: "star",
          choiceA: {
            label: "Boost Production",
            description: "Invest now for +150% income for 7 days!",
            cost: scaledCost * 2,
          },
          choiceB: {
            label: "Stay Organic",
            description: "Free but smaller bonus: +50% income for 3 days.",
          },
        }),
        (): PendingChoiceEvent => ({
          id: "blender_malfunction",
          title: "Blender Malfunction!",
          description:
            "Your primary blender is making horrible noises. Act now or push through?",
          icon: "wrench",
          choiceA: {
            label: "Emergency Repair",
            description: "Fix it now. Back to full speed immediately.",
            cost: Math.max(200, Math.floor(scaledCost * 0.5)),
          },
          choiceB: {
            label: "Keep Going",
            description: "Risk it: -20% income for 5 days if it breaks.",
          },
        }),
        (): PendingChoiceEvent => ({
          id: "supply_disruption",
          title: "Supply Chain Disruption!",
          description:
            "Your ingredient supplier just raised prices 40% overnight. What's your move?",
          icon: "alert",
          choiceA: {
            label: "Pay Premium",
            description: "Order emergency stock at full price. No disruption.",
            cost: Math.max(300, Math.floor(scaledCost * 0.6)),
          },
          choiceB: {
            label: "Ration Portions",
            description: "Stretch what you have. -15% income for 3 days.",
          },
        }),
        (): PendingChoiceEvent => ({
          id: "celebrity_endorsement",
          title: "Celebrity Endorsement Offer!",
          description:
            "A well-known food influencer wants to sponsor your shake brand. It's not cheap.",
          icon: "star",
          choiceA: {
            label: "Sign the Deal",
            description: "Pay up front for +200% income boost for 10 days!",
            cost: scaledCost * 3,
          },
          choiceB: {
            label: "Decline",
            description: "Keep your cash. Miss the spotlight.",
          },
        }),
        (): PendingChoiceEvent => ({
          id: "staff_walkout",
          title: "Staff Walkout!",
          description:
            "Your employees are threatening to walk unless you address their demands right now.",
          icon: "alert",
          choiceA: {
            label: "Pay Bonuses",
            description: "Costly but keeps everyone at work.",
            cost: Math.max(400, Math.floor(scaledCost * 0.8)),
          },
          choiceB: {
            label: "Call Their Bluff",
            description: "Risk it: if they walk, -25% income for 4 days.",
          },
        }),
        (): PendingChoiceEvent => ({
          id: "lucky_ingredient",
          title: "Mystery Ingredient!",
          description:
            "A delivery driver left an unmarked crate of something amazing-smelling. Use it?",
          icon: "star",
          choiceA: {
            label: "Add It to the Mix",
            description:
              "Small investment, big payoff: +100% income for 5 days.",
            cost: Math.max(150, Math.floor(scaledCost * 0.3)),
          },
          choiceB: {
            label: "Leave It",
            description: "Mystery solved by ignoring it. Safe but boring.",
          },
        }),
      ];
      const factory =
        interactiveFactories[
          Math.floor(Math.random() * interactiveFactories.length)
        ];
      setState((prev) => ({
        ...prev,
        eventStats: {
          ...prev.eventStats,
          totalChoiceEvents: prev.eventStats.totalChoiceEvents + 1,
        },
      }));
      setPendingChoiceEvent(factory());
      return;
    }

    // Auto-events
    const autoFactories: Array<() => ActiveEventType> = [
      () => ({
        id: "fan_fav_surge",
        title: "Fan Favorite Surge!",
        description:
          "Social media is buzzing! Fan Favorite chance +30% for the next 5 days.",
        icon: "star" as const,
        bonusLabel: "+30% Fan Favorite chance",
        duration: 5,
        expiresAtDay: state.gameDays + 5,
      }),
      () => ({
        id: "viral_moment",
        title: "Viral Moment!",
        description:
          "A shake clip went viral! Fan Favorite chance +20% for the next 7 days.",
        icon: "zap" as const,
        bonusLabel: "+20% Fan Favorite chance",
        duration: 7,
        expiresAtDay: state.gameDays + 7,
      }),
      () => ({
        id: "health_scare",
        title: "Health Scare",
        description:
          "A news story about sugar is worrying customers. Fan Favorite chance -10% for 4 days.",
        icon: "alert" as const,
        bonusLabel: "-10% Fan Favorite chance",
        duration: 4,
        expiresAtDay: state.gameDays + 4,
      }),
    ];

    const factory =
      autoFactories[Math.floor(Math.random() * autoFactories.length)];
    const evt = factory();

    if (evt.id === "fan_fav_surge") fanFavBonusRef.current = 0.3;
    else if (evt.id === "viral_moment") fanFavBonusRef.current = 0.2;
    else if (evt.id === "health_scare") fanFavBonusRef.current = -0.1;

    setState((prev) => {
      let result = {
        ...prev,
        eventStats: {
          ...prev.eventStats,
          totalAutoEvents: prev.eventStats.totalAutoEvents + 1,
        },
        eventLog: [
          {
            day: prev.gameDays,
            name: evt.title,
            choice: "Auto",
            outcome: evt.description,
            timestamp: Date.now(),
          },
          ...prev.eventLog,
        ].slice(0, 50),
      };
      return applyGoalProgress(result, "triggerEvent", 1);
    });
    setActiveEvent(evt);

    const msUntilExpiry = evt.duration * 1000;
    const timer = window.setTimeout(() => {
      setActiveEvent(null);
      fanFavBonusRef.current = 0;
    }, msUntilExpiry);

    return () => clearTimeout(timer);
  }, [state.gameDays, activeEvent, pendingChoiceEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Event log helper ---
  const pushEventLog = (entry: EventLogEntry) => {
    const stamped = { ...entry, timestamp: entry.timestamp ?? Date.now() };
    setState((prev) => ({
      ...prev,
      eventLog: [stamped, ...prev.eventLog].slice(0, 50),
    }));
  };

  // --- Interactive event resolution ---
  const resolveChoiceEvent = (choice: "A" | "B") => {
    if (!pendingChoiceEvent) return;
    const now = Date.now();
    const EVT_DURATION = 7000;
    let logOutcome = "";

    if (pendingChoiceEvent.id === "health_inspector") {
      if (choice === "A") {
        setState((prev) => ({
          ...prev,
          money: prev.money - pendingChoiceEvent.choiceA.cost,
          eventStats: {
            ...prev.eventStats,
            finesPaid: prev.eventStats.finesPaid + 1,
          },
        }));
        addNotification(
          "Fine paid. Inspector satisfied.",
          "normal",
          EVT_DURATION,
        );
        logOutcome = "Paid fine. Inspector satisfied.";
      } else {
        setState((prev) => ({
          ...prev,
          eventStats: {
            ...prev.eventStats,
            inspectionsGambled: prev.eventStats.inspectionsGambled + 1,
          },
        }));
        if (Math.random() < 0.5) {
          addNotification(
            "Passed! Inspector found no issues.",
            "fanFavorite",
            EVT_DURATION,
          );
          logOutcome = "Gambled — passed inspection.";
        } else {
          setState((prev) => ({
            ...prev,
            activeBuffs: [
              ...prev.activeBuffs,
              {
                id: `inspector_fail_${now}`,
                multiplier: 0.7,
                expiresAt: now + 5000,
                label: "Failed Inspection",
                kind: "penalty" as const,
              },
            ],
          }));
          addNotification(
            "Failed inspection! -30% income for 5 days.",
            "crusty",
            EVT_DURATION,
          );
          logOutcome = "Gambled — failed. -30% income for 5 days.";
        }
      }
    } else if (pendingChoiceEvent.id === "tiktok_viral") {
      if (choice === "A") {
        setState((prev) => ({
          ...prev,
          money: prev.money - pendingChoiceEvent.choiceA.cost,
          eventStats: {
            ...prev.eventStats,
            viralInvestments: prev.eventStats.viralInvestments + 1,
          },
          activeBuffs: [
            ...prev.activeBuffs,
            {
              id: `tiktok_invest_${now}`,
              multiplier: 2.5,
              expiresAt: now + 7000,
              label: "Viral Campaign",
              kind: "bonus" as const,
            },
          ],
        }));
        addNotification(
          "Viral campaign! +150% income for 7 days!",
          "fanFavorite",
          EVT_DURATION,
        );
        logOutcome = "Invested — +150% income for 7 days.";
      } else {
        setState((prev) => ({
          ...prev,
          activeBuffs: [
            ...prev.activeBuffs,
            {
              id: `tiktok_organic_${now}`,
              multiplier: 1.5,
              expiresAt: now + 3000,
              label: "Organic Buzz",
              kind: "bonus" as const,
            },
          ],
        }));
        addNotification(
          "Natural boost! +50% income for 3 days.",
          "creamy",
          EVT_DURATION,
        );
        logOutcome = "Organic buzz — +50% income for 3 days.";
      }
    } else if (pendingChoiceEvent.id === "blender_malfunction") {
      if (choice === "A") {
        setState((prev) => ({
          ...prev,
          money: prev.money - pendingChoiceEvent.choiceA.cost,
          eventStats: {
            ...prev.eventStats,
            blendersRepaired: prev.eventStats.blendersRepaired + 1,
          },
        }));
        addNotification(
          "Blender repaired. Back to full speed.",
          "normal",
          EVT_DURATION,
        );
        logOutcome = "Paid for repair. Blender fixed.";
      } else {
        if (Math.random() < 0.6) {
          setState((prev) => ({
            ...prev,
            activeBuffs: [
              ...prev.activeBuffs,
              {
                id: `malfunction_${now}`,
                multiplier: 0.8,
                expiresAt: now + 5000,
                label: "Blender Breakdown",
                kind: "penalty" as const,
              },
            ],
          }));
          addNotification(
            "Blender broke worse! -20% income for 5 days.",
            "baked",
            EVT_DURATION,
          );
          logOutcome = "Risky — broke worse. -20% income for 5 days.";
        } else {
          addNotification(
            "Held together for now. Lucky!",
            "normal",
            EVT_DURATION,
          );
          logOutcome = "Risky — held together. Lucky!";
        }
      }
    } else if (pendingChoiceEvent.id === "supply_disruption") {
      if (choice === "A") {
        setState((prev) => ({
          ...prev,
          money: prev.money - pendingChoiceEvent.choiceA.cost,
        }));
        addNotification(
          "Emergency stock secured. No downtime.",
          "normal",
          EVT_DURATION,
        );
        logOutcome = "Secured emergency stock. No disruption.";
      } else {
        setState((prev) => ({
          ...prev,
          activeBuffs: [
            ...prev.activeBuffs,
            {
              id: `supply_wait_${now}`,
              multiplier: 0.85,
              expiresAt: now + 3000,
              label: "Supply Shortage",
              kind: "penalty" as const,
            },
          ],
        }));
        addNotification(
          "Rationing portions. -15% income for 3 days.",
          "crusty",
          EVT_DURATION,
        );
        logOutcome = "Rationed portions. -15% income for 3 days.";
      }
    } else if (pendingChoiceEvent.id === "celebrity_endorsement") {
      if (choice === "A") {
        setState((prev) => ({
          ...prev,
          money: prev.money - pendingChoiceEvent.choiceA.cost,
          activeBuffs: [
            ...prev.activeBuffs,
            {
              id: `celeb_${now}`,
              multiplier: 3,
              expiresAt: now + 10000,
              label: "Celebrity Endorsement",
              kind: "bonus" as const,
            },
          ],
        }));
        addNotification(
          "Celebrity deal signed! +200% income for 10 days!",
          "fanFavorite",
          EVT_DURATION,
        );
        logOutcome = "Signed deal. +200% income for 10 days.";
      } else {
        addNotification(
          "Passed on the endorsement. Saving the cash.",
          "normal",
          EVT_DURATION,
        );
        logOutcome = "Declined endorsement. Saved the cash.";
      }
    } else if (pendingChoiceEvent.id === "staff_walkout") {
      if (choice === "A") {
        setState((prev) => ({
          ...prev,
          money: prev.money - pendingChoiceEvent.choiceA.cost,
        }));
        addNotification(
          "Bonuses paid. Staff back on the job.",
          "normal",
          EVT_DURATION,
        );
        logOutcome = "Paid bonuses. Staff returned.";
      } else {
        setState((prev) => ({
          ...prev,
          activeBuffs: [
            ...prev.activeBuffs,
            {
              id: `walkout_${now}`,
              multiplier: 0.75,
              expiresAt: now + 4000,
              label: "Staff Walkout",
              kind: "penalty" as const,
            },
          ],
        }));
        addNotification(
          "Half the crew walked out. -25% income for 4 days.",
          "crusty",
          EVT_DURATION,
        );
        logOutcome = "Refused — crew walked. -25% income for 4 days.";
      }
    } else if (pendingChoiceEvent.id === "lucky_ingredient") {
      if (choice === "A") {
        setState((prev) => ({
          ...prev,
          money: prev.money - pendingChoiceEvent.choiceA.cost,
          activeBuffs: [
            ...prev.activeBuffs,
            {
              id: `lucky_${now}`,
              multiplier: 2,
              expiresAt: now + 5000,
              label: "Mystery Ingredient",
              kind: "bonus" as const,
            },
          ],
        }));
        addNotification(
          "Mystery ingredient is a hit! +100% income for 5 days!",
          "creamy",
          EVT_DURATION,
        );
        logOutcome = "Used ingredient. +100% income for 5 days.";
      } else {
        addNotification(
          "Left the ingredient on the shelf. Probably fine.",
          "normal",
          EVT_DURATION,
        );
        logOutcome = "Left it on the shelf.";
      }
    }

    if (logOutcome) {
      pushEventLog({
        day: state.gameDays,
        name: pendingChoiceEvent.title,
        choice:
          choice === "A"
            ? pendingChoiceEvent.choiceA.label
            : pendingChoiceEvent.choiceB.label,
        outcome: logOutcome,
      });
    }
    setState((prev: GameState) => applyGoalProgress(prev, "triggerEvent", 1));
    setPendingChoiceEvent(null);
  };

  // --- Tutorial trigger ---
  useEffect(() => {
    if (!state.options.seenTutorial) {
      setActiveGuide({ steps: STARTER_GUIDE, starter: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Offline earnings on load (Shift Manager) ---
  useEffect(() => {
    const now = Date.now();
    const awayMs = now - state.lastUpdate;
    if (awayMs > 60_000 && (state.upgrades.shiftManager ?? 0) > 0) {
      const level = state.upgrades.shiftManager ?? 0;
      const efficiency = level >= 2 ? 0.5 : 0.25;
      const capMs = level >= 2 ? 2 * 60 * 60 * 1000 : 60 * 60 * 1000;
      const effectiveMs = Math.min(awayMs, capMs);
      const comboMult = FLAVOR_COMBOS.filter((c) =>
        c.flavors.every((f) => state.activeFlavors.includes(f)),
      ).reduce((acc, c) => acc * c.multiplier, 1);
      const globalMult =
        calcGlobalMultiplier(
          {
            unlockedCountries: state.unlockedCountries,
            activeFlavors: state.activeFlavors,
            upgrades: state.upgrades,
          },
          COUNTRIES,
          FLAVORS,
        ) * comboMult;
      const incomePerSec = calcIncomePerSecond(
        { shops: state.shops, upgrades: state.upgrades },
        globalMult,
      );
      const earned = Math.floor(
        incomePerSec * (effectiveMs / 1000) * efficiency,
      );
      if (earned > 0) {
        setOfflineSummary({ earned, durationMs: awayMs });
        setState((prev) => ({ ...prev, money: prev.money + earned }));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Activity tracking for idle auto-pause ---
  useEffect(() => {
    const update = () => {
      lastActivityRef.current = Date.now();
    };
    window.addEventListener("pointermove", update);
    window.addEventListener("keydown", update);
    window.addEventListener("click", update);
    return () => {
      window.removeEventListener("pointermove", update);
      window.removeEventListener("keydown", update);
      window.removeEventListener("click", update);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (gamePausedRef.current) return;
      if (!state.options.autoIdlePause) return;
      if (Date.now() - lastActivityRef.current > 60_000) {
        lastActivityRef.current = Date.now();
        setIsPaused(true);
        saveNow();
        addNotification("Auto-paused after 1 minute of inactivity.", "save");
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [state.options.autoIdlePause, saveNow]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Rolling Income Measurement (5s window, includes manual blending) ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastIncomeUpdate.current) / 1000;
      if (elapsed > 0) {
        setDisplayedIncome(earningsBuffer.current / elapsed);
        earningsBuffer.current = 0;
        lastIncomeUpdate.current = now;
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // --- Sync gameDaysRef and reset cycle earnings on new 30-day cycle ---
  useEffect(() => {
    gameDaysRef.current = state.gameDays;
    const currentCycle = Math.floor((state.gameDays - 1) / 30);
    if (currentCycle > lastCycleRef.current) {
      cycleEarningsRef.current = 0;
      lastCycleRef.current = currentCycle;
    }
  }, [state.gameDays]);

  // --- Visibility Filters ---
  const getVisibleShopItems = (section: "employees" | "shops") => {
    const items = state.shops.filter((shop) => shop.section === section);
    let lastOwnedIndex = -1;
    for (let i = items.length - 1; i >= 0; i -= 1) {
      if (items[i].count > 0) {
        lastOwnedIndex = i;
        break;
      }
    }
    return items.filter((_, index) => index <= lastOwnedIndex + 3);
  };

  const visibleEmployees = getVisibleShopItems("employees");
  const visibleShopExtensions = getVisibleShopItems("shops");

  const flavorTypes = Object.values(FLAVORS).map(
    (flavor) => flavor.type,
  ) as FlavorType[];
  const visibleFlavors = flavorTypes.filter((type, index) => {
    const isUnlocked = state.unlockedFlavors.includes(type);
    const lastUnlockedIndex = flavorTypes.reduce(
      (acc, flavorType, flavorIndex) =>
        state.unlockedFlavors.includes(flavorType) ? flavorIndex : acc,
      -1,
    );
    return (
      isUnlocked ||
      index <= Math.min(lastUnlockedIndex + 8, flavorTypes.length - 1)
    );
  });

  const totalEmployees = getEmployeeCount();
  const totalShopCapacity = getEmployeeCapacity();
  // Wages need both a level gate and a real workforce to matter financially.
  const wagesUnlocked =
    playerLevel >= LEVEL_UNLOCKS.wages &&
    totalEmployees >= WAGE_EMPLOYEE_REQUIREMENT;
  const ownedShops = state.shops.filter((shop) => shop.count > 0).length;
  const totalCountries = state.unlockedCountries.length;

  const floatingShakeConfig = React.useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => {
        const left = ((i * 10 + Math.random() * 8) % 94) + 2;
        const startY = 110 + Math.random() * 20;
        const endY = -20 - Math.random() * 20;
        const driftX = (Math.random() - 0.5) * 80;
        const duration = 8 + Math.random() * 10;
        const delay = Math.random() * 3;
        const rotate = Math.random() * 360;
        const rotateEnd = 360 + Math.random() * 180;
        return {
          left,
          initial: { y: `${startY}vh`, x: 0, opacity: 0, rotate },
          animate: {
            y: `${endY}vh`,
            x: driftX,
            opacity: [0.2, 0.8, 0.2],
            rotate: rotateEnd,
          },
          transition: { duration, repeat: Infinity, ease: "linear", delay },
        };
      }),
    [],
  );

  const bgParticleConfig = React.useMemo(
    () =>
      Array.from({ length: 22 }).map(() => {
        const initialX = Math.random() * 80 + 10;
        const initialY = Math.random() * 80 + 10;
        const scale = Math.random() * 0.5 + 0.5;
        const animX1 = Math.random() * 90 + 5;
        const animX2 = Math.random() * 90 + 5;
        const duration = 10 + Math.random() * 20;
        const delay = Math.random() * 5;
        return {
          initial: { x: `${initialX}%`, y: `${initialY}%`, opacity: 0, scale },
          animate: {
            y: ["0%", "-40%", "0%"],
            opacity: [0, 0.3, 0],
            x: [`${animX1}%`, `${animX2}%`],
          },
          transition: { duration, repeat: Infinity, ease: "linear", delay },
        };
      }),
    [],
  );

  const bubbleConfig = React.useMemo(
    () =>
      Array.from({ length: 8 }).map(() => {
        const x = Math.random() * 200;
        const delay = Math.random() * 0.5;
        return {
          initial: { y: 300, x },
          animate: { y: -100, opacity: [0, 1, 0] },
          transition: { duration: 0.3, repeat: Infinity, delay },
        };
      }),
    [],
  );

  const bubbleConfigShort = React.useMemo(
    () => bubbleConfig.slice(0, 4),
    [bubbleConfig],
  );

  const employeeBlenderConfig = React.useMemo(
    () =>
      Array.from({ length: 20 }).map((_, si) =>
        Array.from({ length: 2 }).map((_, i) => ({
          transition: {
            duration: 1.2 + ((si * 3 + i) % 8) * 0.1,
            repeat: Infinity,
            delay: si * 0.2 + i * 0.1,
          },
        })),
      ),
    [],
  );

  const blenderFillHeight = isBlending
    ? Math.min(100, 40 + progress * 0.6)
    : 40;

  // Number of physical blenders (1 + Additional Blender upgrade, capped at 4).
  const blenderCount = Math.min(4, 1 + (state.upgrades.extraBlender || 0));
  // Per-blender scale so the fleet shrinks to fit as it grows.
  const blenderScale = [1, 0.74, 0.6, 0.52][
    Math.min(3, Math.max(0, blenderCount - 1))
  ];

  // Root zoom-to-fit style (auto-fit × user GUI scale). Passing via a variable
  // lets the nonstandard `zoom` property through the style typing.
  const combinedScale = uiScale * state.options.guiScale;
  const rootStyle =
    combinedScale !== 1
      ? {
          zoom: combinedScale,
          width: `${100 / combinedScale}vw`,
          height: `${100 / combinedScale}vh`,
        }
      : undefined;

  // Reusable "feature locked until level N" panel.
  const lockedFeature = (title: string, unlockLevel: number, note: string) => (
    <div className="glass-panel p-6 flex flex-col items-center text-center gap-3 border border-white/10">
      <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
        <Lock className="w-8 h-8 text-neutral-500" />
      </div>
      <h3 className="text-sm font-black uppercase tracking-widest text-neutral-300">
        {title}
      </h3>
      <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
        {note}
      </p>
      <div className="w-full max-w-xs mt-1">
        <div className="flex justify-between text-[10px] font-mono text-neutral-500 mb-1">
          <span>Level {playerLevel}</span>
          <span className="text-amber-400">Unlocks at Level {unlockLevel}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500"
            style={{
              width: `${Math.min(100, (playerLevel / unlockLevel) * 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`relative flex h-screen w-full overflow-hidden font-sans selection:bg-blue-500/30 ${isLightMode ? "bg-slate-300 text-slate-800" : "bg-neutral-950 text-neutral-100"}`}
      style={rootStyle}
    >
      <Analytics />

      {/* Sidebar open button — fixed, only visible when sidebar is collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          title="Open management panel"
          aria-label="Open management panel"
          className="fixed top-3 right-3 z-[80] p-2 rounded-xl bg-black/60 border border-white/15 text-neutral-200 backdrop-blur-md shadow-lg hover:bg-white/15 transition-all active:scale-95"
        >
          <PanelRightOpen className="w-5 h-5" />
        </button>
      )}

      {/* Left Pane: The Blender / Visual Area */}
      <div
        className={`flex-1 relative flex flex-col border-r p-8 overflow-hidden ${isLightMode ? "border-slate-300/20 bg-slate-200" : "border-white/10 bg-black"}`}
      >
        {/* Background Image Layer - Dynamic Selection */}
        <div
          className="absolute inset-0 z-0 transition-all duration-1000"
          style={{
            backgroundImage: `url("${BACKGROUNDS[state.options.bgIndex]?.url || BACKGROUNDS[0].url}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: state.options.highQuality ? 0.45 : 0.25,
            filter: state.options.highQuality
              ? BACKGROUNDS[state.options.bgIndex]?.filter ||
                BACKGROUNDS[0].filter
              : "grayscale(1) brightness(0.2)",
          }}
        />

        {/* Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

        {/* Background Atmosphere - Dynamic Glow */}
        {state.activeFlavors.length > 0 && (
          <div
            className="absolute inset-0 opacity-50 blur-[130px] pointer-events-none z-10"
            style={{
              background: `conic-gradient(from 0deg, ${state.activeFlavors.map((t: FlavorType) => FLAVORS[t].color).join(", ")})`,
            }}
          />
        )}

        {/* Background Particles Layer (skipped when Better Animations is off) */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {state.options.betterAnimations &&
            bgParticleConfig.map((cfg, i) => (
              <motion.div
                key={i}
                initial={cfg.initial}
                animate={cfg.animate}
                transition={cfg.transition}
                className="absolute w-2 h-2 rounded-full bg-blue-300/20 blur-[1px]"
              />
            ))}
        </div>

        {/* Decorative Vibes */}
        <div
          className="absolute inset-0 opacity-[0.2] pointer-events-none z-20"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 70%)`,
          }}
        />

        {/* Floating Icons */}
        {state.options.floatingShakes &&
          floatingShakeConfig.map((cfg, i) => {
            const flavor =
              state.activeFlavors[i % state.activeFlavors.length] ||
              (Object.keys(FLAVORS)[0] as FlavorType);
            return (
              <motion.div
                key={`float-${i}`}
                style={{ left: `${cfg.left}%` }}
                initial={cfg.initial}
                animate={cfg.animate}
                transition={cfg.transition}
                className="absolute opacity-20 pointer-events-none z-10"
              >
                <Milk
                  className="w-16 h-16"
                  style={{ color: FLAVORS[flavor].color }}
                />
              </motion.div>
            );
          })}

        {/* Money Display */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-30">
          <div className="text-4xl sm:text-5xl xl:text-6xl font-sans font-black tracking-tighter flex items-center gap-3 drop-shadow-[0_0_35px_rgba(59,130,246,0.4)]">
            <Coins className="text-yellow-400 w-8 h-8 sm:w-10 sm:h-10 xl:w-12 xl:h-12" />
            <div className="flex items-center tabular-nums font-mono text-white tracking-[0.1em] bg-black/40 px-8 py-3 rounded-2xl border border-white/20 backdrop-blur-xl shadow-[0_0_40px_rgba(255,255,255,0.05)]">
              <span className="text-yellow-400 mr-2 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
                $
              </span>
              <SmoothMoneyCounter value={state.money} />
            </div>
          </div>
          {getGlobalMultiplier() > 1 && (
            <motion.div
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-2 text-xs font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 uppercase"
            >
              Global Multiplier: x{getGlobalMultiplier().toFixed(1)}
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-3 sm:bottom-8 left-3 sm:left-8 z-30 w-[calc(100%-1.5rem)] sm:w-[32rem] space-y-3">
          <div className="glass-panel p-4 border-white/10 bg-black/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase text-justify tracking-[0.35em]">
                <strong style={{ color: "#efefef", fontWeight: "bold" }}>
                  Strider657's Milkshake Mania
                </strong>
                <br />
                <span style={{ color: "#9cf40f" }}>
                  ⸻ Milkshake Empire Stats ⸻
                </span>
                <br />
                <br />
              </div>
              <div
                className="text-xs uppercase tracking-[0.2em] font-bold"
                style={{ color: "#40e0d0" }}
              >
                v{APP_VERSION}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm text-neutral-200">
              <div className="bg-white/5 rounded-2xl p-3">
                <div className="font-black uppercase text-neutral-400">
                  Shakes
                </div>
                <div className="mt-1 font-bold text-white">
                  {formatLargeNumber(state.totalStats.totalMilkshakes)}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3">
                <div className="font-black uppercase text-cyan-300">
                  Fan Favorite
                </div>
                <div className="mt-1 font-bold text-white">
                  {formatLargeNumber(state.totalStats.totalFanFavorite)}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3">
                <div className="font-black uppercase text-red-300">Creamy</div>
                <div className="mt-1 font-bold text-white">
                  {formatLargeNumber(state.totalStats.totalCreamy)}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3">
                <div className="font-black uppercase text-blue-300">Crusty</div>
                <div className="mt-1 font-bold text-white">
                  {formatLargeNumber(state.totalStats.totalCrusty)}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3">
                <div className="font-black uppercase text-orange-300">
                  Baked
                </div>
                <div className="mt-1 font-bold text-white">
                  {formatLargeNumber(state.totalStats.totalBaked)}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3">
                <div className="font-black uppercase text-purple-300">
                  Swirled
                </div>
                <div className="mt-1 font-bold text-white">
                  {formatLargeNumber(state.totalStats.totalSwirled)}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3">
                <div className="font-black uppercase text-emerald-300">
                  Decorated
                </div>
                <div className="mt-1 font-bold text-white">
                  {formatLargeNumber(state.totalStats.totalDecorated)}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3">
                <div className="font-black uppercase text-yellow-300">
                  Golden
                </div>
                <div className="mt-1 font-bold text-white">
                  {formatLargeNumber(state.totalStats.totalGolden)}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3">
                <div className="font-black uppercase text-sky-300">Flavors</div>
                <div className="mt-1 font-bold text-white">
                  {state.unlockedFlavors.length}/{flavorTypes.length}
                </div>
              </div>
            </div>

            <hr className="border-white/30" />

            <div className="grid grid-cols-3 gap-2 text-sm text-neutral-200">
              <div className="bg-white/5 rounded-2xl p-3">
                <div className="font-black uppercase text-emerald-300">
                  Employees
                </div>
                <div className="mt-1 font-bold text-white">
                  {totalEmployees}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3">
                <div className="font-black uppercase text-cyan-300">
                  Extensions
                </div>
                <div className="mt-1 font-bold text-white">
                  {totalShopExtensions}
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3">
                <div className="font-black uppercase text-lime-300">
                  Capacity
                </div>
                <div className="mt-1 font-bold text-white">
                  {totalShopCapacity}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-neutral-200">
              <button
                className="flex justify-between w-full items-center"
                onClick={() => setIncomeBreakdownOpen((o) => !o)}
              >
                <span className="flex items-center gap-1">
                  Income /s
                  {incomeBreakdown && (
                    <ChevronDown
                      className={`w-3 h-3 opacity-40 transition-transform ${incomeBreakdownOpen ? "rotate-180" : ""}`}
                    />
                  )}
                </span>
                <span className="font-bold text-white">
                  {gamePaused
                    ? "—"
                    : `+$${formatLargeNumber(displayedIncome || getIncomePerSecond())}/s`}
                </span>
              </button>
              {incomeBreakdownOpen && incomeBreakdown && (
                <div className="mt-2 space-y-1 border-t border-white/10 pt-2 text-[11px] text-neutral-400">
                  {incomeBreakdown.employeeIncome > 0 && (
                    <div className="flex justify-between">
                      <span>Employees</span>
                      <span className="text-emerald-300 font-mono">
                        +${formatLargeNumber(incomeBreakdown.employeeIncome)}/s
                      </span>
                    </div>
                  )}
                  {incomeBreakdown.shopIncome > 0 && (
                    <div className="flex justify-between">
                      <span>Shop Extensions</span>
                      <span className="text-cyan-300 font-mono">
                        +${formatLargeNumber(incomeBreakdown.shopIncome)}/s
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Upgrades</span>
                    <span className="text-amber-300 font-mono">
                      ×{incomeBreakdown.upgMult.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Global (flavors + countries)</span>
                    <span className="text-purple-300 font-mono">
                      ×{incomeBreakdown.globalMult.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-between mt-2">
                <span>Payroll</span>
                <span className="font-bold text-white">
                  {daysUntilPayroll} day{daysUntilPayroll === 1 ? "" : "s"} · -$
                  {formatLargeNumber(monthlyOperatingCost)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-red-400">
                  Tax ({(TAX_RATE * 100).toFixed(0)}%)
                </span>
                <span className="font-bold text-red-300">
                  -${formatLargeNumber(getIncomePerSecond() * 30 * TAX_RATE)}
                </span>
              </div>

              <hr className="border-white/10 my-2" />

              <div className="flex justify-between">
                <span className="text-neutral-400">Income /month</span>
                <span className="font-bold text-green-300">
                  +${formatLargeNumber(getIncomePerSecond() * 30)}/mo
                </span>
              </div>

              <hr className="border-white/10 my-2" />

              <div className="flex justify-between">
                <span>Game Date</span>
                <span className="font-bold text-white">
                  {formatGameDate(state.gameDays, state.options.dateFormat)}
                </span>
              </div>
            </div>
            <div className="hidden xl:block">
              {(() => {
                const wm =
                  state.options.wageLevel === "high"
                    ? 2
                    : state.options.wageLevel === "low"
                      ? 0.7
                      : 1;
                const wageColor =
                  state.options.wageLevel === "high"
                    ? "text-emerald-400"
                    : state.options.wageLevel === "low"
                      ? "text-red-400"
                      : "text-neutral-500";
                return (
                  <div className="space-y-1">
                    {state.options.wageLevel !== "normal" && (
                      <p
                        className={`text-[10px] font-bold uppercase tracking-widest ${wageColor}`}
                      >
                        {state.options.wageLevel === "high"
                          ? "High wages — 2× special chances"
                          : "Low wages — 0.7× special chances"}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-[0.2em] text-neutral-400 text-justify">
                      <span className="text-cyan-300">
                        {(CHANCES.fanFavoriteBase * wm * 100).toFixed(1)}% Fan
                        Favorite
                      </span>
                      <span className="text-red-300">
                        {(CHANCES.creamyBase * wm * 100).toFixed(1)}% Creamy
                      </span>
                      <span className="text-blue-400">
                        {(
                          (CHANCES.crustyBase * wm +
                            state.upgrades.qualityControl * 0.005 +
                            state.upgrades.equipmentUpgrade * 0.002) *
                          100
                        ).toFixed(1)}
                        % Crusty
                      </span>
                      <span className="text-orange-400">
                        {(
                          (CHANCES.bakedBase * wm +
                            state.upgrades.heatControl * 0.001) *
                          100
                        ).toFixed(1)}
                        % Baked
                      </span>
                      <span className="text-purple-400">
                        {(CHANCES.swirledBase * wm * 100).toFixed(1)}% Swirl
                      </span>
                      <span className="text-emerald-300">
                        {(CHANCES.decoratedBase * wm * 100).toFixed(1)}%
                        Decorated
                      </span>
                      <span className="text-yellow-400">
                        {(CHANCES.goldenBase * wm * 100).toFixed(1)}% Gold
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center justify-center relative pt-36 pb-64">
          {/* Auto-Mixer Toggle Overlay */}
          <div className="absolute top-4 left-4 z-40 flex flex-col gap-2 scale-100 origin-top-left pointer-events-auto max-w-[15rem]">
            <button
              onClick={() => setIsPaused((p) => !p)}
              className={`flex items-center gap-3 px-4 py-2 rounded-2xl border-2 transition-all shadow-2xl ${
                isPaused
                  ? "bg-amber-500/30 border-amber-400 text-white"
                  : "bg-black/60 border-white/10 text-neutral-300 hover:bg-white/10"
              }`}
              title={isPaused ? "Resume game" : "Pause game"}
            >
              {isPaused ? (
                <Play className="w-5 h-5 text-amber-300" />
              ) : (
                <Pause className="w-5 h-5" />
              )}
              <div className="text-left">
                <p className="text-xs font-black uppercase leading-none">
                  {isPaused ? "Paused" : "Pause"}
                </p>
                <p className="text-xs font-bold opacity-60 uppercase">
                  {isPaused ? "Game Paused" : "Temporarily pause the game"}
                </p>
              </div>
            </button>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  options: { ...prev.options, autoMix: !prev.options.autoMix },
                }))
              }
              className={`flex items-center gap-3 px-4 py-2 rounded-2xl border-2 transition-all shadow-2xl ${
                state.options.autoMix
                  ? "bg-blue-600/30 border-blue-400 text-white"
                  : "bg-black/60 border-white/10 text-neutral-500 grayscale"
              }`}
            >
              <Zap
                className={`w-5 h-5 ${state.options.autoMix ? "animate-pulse text-yellow-400" : ""}`}
              />
              <div className="text-left">
                <p className="text-xs font-black uppercase leading-none">
                  Auto-Mixer
                </p>
                <p className="text-xs font-bold opacity-60 uppercase">
                  {state.options.autoMix ? "Enabled" : "Disabled"}
                </p>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${state.options.autoMix ? "bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" : "bg-red-500"}`}
              />
            </button>
            {activeBuffsList.length > 0 &&
              (() => {
                const now = Date.now();
                const total = activeBuffsList.reduce(
                  (acc, b) => acc * b.multiplier,
                  1,
                );
                const isNet = total >= 1;
                return (
                  <div
                    className={`rounded-2xl border-2 backdrop-blur-md shadow-2xl overflow-hidden ${
                      isNet
                        ? "bg-amber-500/20 border-amber-400/60 text-amber-100"
                        : "bg-red-500/20 border-red-400/60 text-red-100"
                    }`}
                  >
                    <button
                      onClick={() => setBuffsOpen((o) => !o)}
                      className="flex items-center gap-2 px-4 py-2 border-b border-white/10 w-full text-left hover:bg-white/5 transition-colors"
                    >
                      <Zap
                        className={`w-4 h-4 animate-pulse ${isNet ? "text-amber-400" : "text-red-400"}`}
                      />
                      <div className="text-left flex-1">
                        <p className="text-xs font-black uppercase leading-none">
                          Income Modifiers
                        </p>
                        <p className="text-xs font-bold opacity-80">
                          Total ×{total.toFixed(2)} · {activeBuffsList.length}{" "}
                          active
                        </p>
                      </div>
                      <ChevronDown
                        className={`w-3 h-3 shrink-0 opacity-60 transition-transform ${buffsOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {buffsOpen && (
                      <div className="max-h-44 overflow-y-auto custom-scrollbar divide-y divide-white/5">
                        {activeBuffsList
                          .slice()
                          .sort((a, b) => a.expiresAt - b.expiresAt)
                          .map((b) => {
                            const secs = Math.max(
                              0,
                              Math.ceil((b.expiresAt - now) / 1000),
                            );
                            const good = b.multiplier >= 1;
                            const fallbackLabel = good ? "Bonus" : "Penalty";
                            const displayLabel = b.label || fallbackLabel;
                            const tooltipText = `${displayLabel} · ×${b.multiplier.toFixed(2)} income for ${secs}s`;
                            return (
                              <div
                                key={b.id}
                                title={tooltipText}
                                className="flex items-center justify-between gap-2 px-4 py-1.5 text-[11px] cursor-default"
                              >
                                <span
                                  className={`truncate font-bold ${good ? "opacity-90" : "text-red-300"}`}
                                >
                                  {displayLabel}
                                </span>
                                <span className="shrink-0 font-mono font-black tabular-nums">
                                  <span
                                    className={
                                      good ? "text-emerald-300" : "text-red-300"
                                    }
                                  >
                                    ×{b.multiplier.toFixed(2)}
                                  </span>
                                  <span className="opacity-60"> · {secs}s</span>
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>

          {/* Right overlay column — Chronicle + Goals, positioned on the right to avoid overlapping the stats panel */}
          <div className="absolute top-4 right-4 z-40 flex flex-col gap-2 pointer-events-auto w-[15rem]">
            {/* Event Chronicle trigger */}
            {state.eventLog.length > 0 && (
              <button
                onClick={() => {
                  setChronicleOpen(true);
                  setShownLogCount(10);
                }}
                className="flex flex-col gap-1.5 px-4 py-3 rounded-2xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 transition-colors w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-sky-400 shrink-0" />
                  <p className="text-xs font-black uppercase leading-none text-sky-300 flex-1">
                    Event Chronicle
                  </p>
                  <span className="text-[10px] text-sky-400/70 font-mono">
                    {state.eventLog.length}
                  </span>
                  <ChevronRight className="w-3 h-3 shrink-0 text-sky-500" />
                </div>
                {state.eventLog.slice(0, 2).map((entry, i) => (
                  <div
                    key={i}
                    className="text-[10px] flex gap-1.5 items-baseline pl-6"
                  >
                    <span className="text-white/70 font-bold truncate max-w-[120px]">
                      {entry.name}
                    </span>
                    <span className="text-white/50 truncate flex-1">
                      {entry.outcome}
                    </span>
                  </div>
                ))}
              </button>
            )}

            {/* Goals trigger */}
            {state.goals &&
              (() => {
                const nowMs = Date.now();
                const unclaimedCount = [
                  ...state.goals.daily,
                  ...state.goals.hourly,
                ].filter((g) => g.progress >= g.target && !g.claimed).length;
                const totalGoals =
                  state.goals.daily.length + state.goals.hourly.length;
                const claimedCount = [
                  ...state.goals.daily,
                  ...state.goals.hourly,
                ].filter((g) => g.claimed).length;
                const dailyMsLeft = Math.max(
                  0,
                  state.goals.dailyResetAt - nowMs,
                );
                const previewGoals = [
                  ...state.goals.daily,
                  ...state.goals.hourly,
                ]
                  .filter((g) => !g.claimed)
                  .slice(0, 2);
                return (
                  <button
                    onClick={() => setGoalsOpen(true)}
                    className="flex flex-col gap-1.5 px-4 py-3 rounded-2xl border border-teal-500/40 bg-teal-500/15 hover:bg-teal-500/25 transition-colors w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-teal-400 shrink-0" />
                      <p className="text-xs font-black uppercase leading-none text-teal-300 flex-1">
                        Goals
                      </p>
                      {unclaimedCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-teal-500/30 text-teal-200 rounded-full">
                          {unclaimedCount} ready
                        </span>
                      )}
                      {unclaimedCount === 0 && (
                        <span className="text-[10px] text-teal-400/70 font-mono">
                          {claimedCount}/{totalGoals}
                        </span>
                      )}
                      <ChevronRight className="w-3 h-3 shrink-0 text-teal-500" />
                    </div>
                    {previewGoals.map((goal) => {
                      const def = ALL_GOAL_MAP.get(goal.id);
                      if (!def) return null;
                      const pct = Math.min(1, goal.progress / goal.target);
                      return (
                        <div key={goal.id} className="pl-6 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-white/70 truncate">
                              {getGoalLabel(goal)}
                            </span>
                            <span className="text-[10px] text-white/40 font-mono shrink-0">
                              {def.type === "earnIncome" ||
                              def.type === "spendMoney"
                                ? `$${formatLargeNumber(Math.floor(goal.progress))}`
                                : Math.floor(goal.progress)}
                              /
                              {def.type === "earnIncome" ||
                              def.type === "spendMoney"
                                ? `$${formatLargeNumber(goal.target)}`
                                : goal.target}
                            </span>
                          </div>
                          <div className="h-0.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-teal-400/70"
                              style={{ width: `${pct * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div className="pl-6 text-[10px] text-teal-400/50 font-mono">
                      Daily resets in {fmtCountdown(dailyMsLeft)}
                    </div>
                  </button>
                );
              })()}
          </div>

          {/* Active Event Banner */}
          <AnimatePresence>
            {activeEvent && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-3 rounded-2xl border-2 shadow-2xl backdrop-blur-md pointer-events-auto ${
                  activeEvent.icon === "alert"
                    ? "bg-red-900/80 border-red-500/60 text-red-200"
                    : "bg-emerald-900/80 border-emerald-500/60 text-emerald-200"
                }`}
              >
                {activeEvent.icon === "alert" ? (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                ) : activeEvent.icon === "star" ? (
                  <Star className="w-4 h-4 shrink-0" />
                ) : (
                  <Zap className="w-4 h-4 shrink-0" />
                )}
                <div className="text-left">
                  <p className="text-xs font-black leading-none">
                    {activeEvent.title}
                  </p>
                  <p className="text-[10px] opacity-80 mt-0.5">
                    {activeEvent.bonusLabel}
                  </p>
                  <p className="text-[10px] opacity-60">
                    {Math.max(0, activeEvent.expiresAtDay - state.gameDays)} day
                    {activeEvent.expiresAtDay - state.gameDays !== 1
                      ? "s"
                      : ""}{" "}
                    left
                  </p>
                </div>
                <button
                  onClick={() => setActiveEvent(null)}
                  className="ml-1 opacity-50 hover:opacity-100 transition-opacity text-xs leading-none"
                  title="Dismiss"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* The Blender Fleet (1–4 blenders, scaled to fit) */}
          <motion.div
            onMouseDown={handleManualShake}
            className={`relative cursor-pointer group z-30 flex items-end justify-center flex-wrap gap-2 sm:gap-4 max-w-full px-4 ${isBlending && state.options.screenShake ? "animate-shake" : ""}`}
          >
            {/* Mini Blender Fleet for Employees (hidden on small screens) */}
            <div className="hidden xl:flex absolute -right-32 top-1/2 -translate-y-1/2 flex-wrap gap-3 w-24 pointer-events-none opacity-60">
              {state.shops.slice(1).map(
                (shop, si) =>
                  shop.count > 0 &&
                  Array.from({ length: Math.min(shop.count, 2) }).map(
                    (_, i) => (
                      <motion.div
                        key={`${si}-${i}`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={EMPLOYEE_BLENDER_ANIMATE}
                        transition={employeeBlenderConfig[si]?.[i]?.transition}
                        className="w-10 h-14 bg-white/10 border border-white/20 rounded-lg flex flex-col justify-end overflow-hidden backdrop-blur-md shadow-lg"
                      >
                        {state.activeFlavors.length > 0 && (
                          <div
                            className="w-full transition-all duration-1000"
                            style={{
                              height: "60%",
                              backgroundColor:
                                FLAVORS[state.activeFlavors[0]]?.color,
                              opacity: 0.8,
                            }}
                          />
                        )}
                        <div className="absolute top-0 w-full h-full bg-linear-to-b from-white/10 to-transparent pointer-none" />
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-4 h-1 bg-white/30 rounded-full" />
                      </motion.div>
                    ),
                  ),
              )}
            </div>

            {Array.from({ length: blenderCount }).map((_, bi) => (
              <div
                key={`blender-${bi}`}
                className="relative shrink-0"
                style={{
                  width: `${16 * blenderScale}rem`,
                  height: `${22 * blenderScale}rem`,
                }}
              >
                <div
                  className="absolute left-1/2 bottom-2"
                  style={{
                    width: "16rem",
                    height: "20rem",
                    transform: `translateX(-50%) scale(${blenderScale})`,
                    transformOrigin: "bottom center",
                  }}
                >
                  {/* Jar Glow */}
                  {state.options.highQuality && (
                    <div
                      className="absolute -inset-8 blur-3xl opacity-30 pointer-events-none rounded-full transition-colors duration-500"
                      style={{
                        background:
                          FLAVORS[state.activeFlavors[0]]?.color || "#fff",
                      }}
                    />
                  )}

                  {/* Glass Jar */}
                  <div className="absolute inset-0 border-4 border-white/30 rounded-b-3xl rounded-t-lg bg-white/5 backdrop-blur-xl overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.1)]">
                    {/* Liquid Fill — hidden when no flavor is active */}
                    {state.activeFlavors.length > 0 && (
                      <div
                        className="absolute bottom-0 w-full overflow-hidden"
                        style={{ height: `${blenderFillHeight}%` }}
                      >
                        <div
                          className="absolute bottom-0 w-full"
                          style={{
                            height: "320px",
                            background:
                              state.activeFlavors.length > 1
                                ? `linear-gradient(to top, ${state.activeFlavors.map((t) => FLAVORS[t].color).join(", ")})`
                                : FLAVORS[state.activeFlavors[0]]?.color,
                          }}
                        />
                        <div className="absolute top-0 w-full h-20 bg-white/40 blur-3xl -translate-y-10" />
                        <div className="absolute top-0 w-full h-3 bg-white/60 -translate-y-1.5 shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                      </div>
                    )}

                    {/* Bubbles if blending */}
                    {isBlending &&
                      (state.options.betterAnimations
                        ? bubbleConfig
                        : bubbleConfigShort
                      ).map((bub, i) => (
                        <motion.div
                          key={i}
                          initial={bub.initial}
                          animate={bub.animate}
                          transition={bub.transition}
                          className="absolute w-1.5 h-1.5 rounded-full bg-white/40"
                        />
                      ))}
                  </div>

                  {/* Lid */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-neutral-800 rounded-lg shadow-xl" />

                  {/* Base */}
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-72 h-16 bg-neutral-800 border-t border-white/10 flex items-center justify-center">
                    <Zap
                      className={`w-8 h-8 transition-colors ${isBlending ? "text-yellow-400" : "text-neutral-600"}`}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Floating Money Gains (centered over the fleet) */}
            <AnimatePresence>
              {floatingGains.map((gain) => (
                <motion.div
                  key={gain.id}
                  initial={{ opacity: 1, y: 0, scale: 0.5 }}
                  animate={{ opacity: 0, y: -150, scale: 1.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute left-1/2 -translate-x-1/2 top-1/4 z-50 text-3xl font-black font-sans text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.6)] pointer-events-none"
                >
                  +${gain.amount}
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="absolute -bottom-10 w-full text-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm font-mono text-neutral-400 bg-black/50 px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">
                {blenderCount > 1
                  ? `Click to Blend · ${blenderCount} blenders`
                  : "Click to Blend"}
              </span>
            </div>
          </motion.div>

          {/* Active Combo Badge */}
          {activeCombo && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/50 backdrop-blur-md shadow-[0_0_20px_rgba(217,70,239,0.3)]"
              >
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-300 animate-pulse" />
                <span className="text-xs font-black text-fuchsia-200 uppercase tracking-wider">
                  {activeCombo.name}
                </span>
                <span className="text-xs font-bold text-fuchsia-400">
                  {activeCombo.label}
                </span>
              </motion.div>
            </div>
          )}

          {/* Music Player — hidden on phones where space is tight */}
          <div className="hidden sm:block absolute bottom-4 right-4 z-30 w-64">
            <MusicPlayer />
          </div>
        </div>

        {/* Floating Notifications */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-none z-50 max-w-xs w-72">
          <AnimatePresence mode="popLayout">
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ x: 50, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: 40, opacity: 0, scale: 0.8 }}
                onClick={() =>
                  setNotifications((prev: any) =>
                    prev.filter((p: any) => p.id !== n.id),
                  )
                }
                title="Click to dismiss"
                className={`px-4 py-2.5 rounded-xl border font-bold shadow-2xl pointer-events-auto cursor-pointer select-none ${
                  n.type === "fanFavorite"
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-cyan-500/20"
                    : n.type === "creamy"
                      ? "bg-red-500/20 border-red-400 text-red-200 shadow-red-500/10"
                      : n.type === "crusty"
                        ? "bg-blue-500/20 border-blue-400 text-blue-300"
                        : n.type === "baked"
                          ? "bg-orange-500/20 border-orange-400 text-orange-300"
                          : n.type === "swirled"
                            ? "bg-purple-500/20 border-purple-400 text-purple-200 shadow-purple-500/10"
                            : n.type === "golden"
                              ? "bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-yellow-500/20"
                              : n.type === "decorated"
                                ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-emerald-500/10"
                                : n.type === "achievement"
                                  ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-amber-500/20"
                                  : n.type === "save"
                                    ? "bg-sky-500/20 border-sky-400/60 text-sky-200"
                                    : "bg-white/10 border-white/20 text-white"
                }`}
              >
                <p className="text-sm leading-snug">{n.text}</p>
                {n.detail && (
                  <p className="text-xs opacity-70 mt-0.5 leading-snug font-normal">
                    {n.detail}
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Manual Pause Overlay */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-black/70 backdrop-blur-md"
            >
              <Pause className="w-16 h-16 text-amber-300" />
              <div className="text-center">
                <h2 className="text-4xl font-display font-black uppercase tracking-tighter text-white">
                  Paused
                </h2>
                <p className="text-sm text-neutral-300 mt-2">
                  Income, payroll, blending, and buff timers are frozen.
                </p>
              </div>
              <button
                onClick={() => setIsPaused(false)}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-sky-500/20 hover:opacity-90 transition-all active:scale-95"
              >
                <Play className="w-5 h-5" />
                Resume
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Mobile backdrop — tapping it closes the sidebar */}
      {!sidebarCollapsed && (
        <div
          className="sm:hidden absolute inset-0 z-[45] bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Right Pane: Management Sidebar.
          Mobile: absolute overlay that slides in from the right so the blender
          stays fully visible underneath.
          Desktop (sm+): flex sibling that uses negative margin to slide off-screen. */}
      <div
        className={`flex flex-col border-l shrink-0 z-50
          absolute inset-y-0 right-0 w-full sm:relative sm:inset-auto sm:w-[500px]
          transition-[transform,margin] duration-300 ease-in-out ${
            sidebarCollapsed
              ? "translate-x-full sm:translate-x-0 sm:-mr-[500px]"
              : "translate-x-0 sm:mr-0"
          } ${
            isLightMode
              ? "bg-slate-300 border-slate-300/20"
              : "bg-neutral-900 border-white/10"
          }`}
      >
        {/* Sidebar Header / Tabs - 3 Row Layout */}
        <div
          className={`px-3 py-2 space-y-2 border-b ${
            isLightMode
              ? "bg-slate-400/50 border-slate-300/20"
              : "bg-neutral-800/80 border-white/5"
          }`}
        >
          <div className="grid grid-cols-12 gap-2">
            {(
              [
                {
                  id: "employees",
                  icon: <Users className="w-4 h-4" />,
                  locked: !employeesUnlocked,
                  lockLevel: LEVEL_UNLOCKS.employees,
                  span: 4 as const,
                },
                {
                  id: "shops",
                  icon: <Store className="w-4 h-4" />,
                  locked: !shopsUnlocked,
                  lockLevel: LEVEL_UNLOCKS.shops,
                  span: 4 as const,
                },
                {
                  id: "upgrades",
                  icon: <Zap className="w-4 h-4" />,
                  locked: false,
                  lockLevel: 0,
                  span: 3 as const,
                },
              ] as const
            ).map(({ id, icon, locked, lockLevel, span }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                title={locked ? `Unlocks at level ${lockLevel}` : undefined}
                className={`${span === 4 ? "col-span-4" : "col-span-3"} w-full py-2 px-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === id
                    ? isLightMode
                      ? "bg-slate-950 text-white"
                      : "bg-white text-black"
                    : locked
                      ? "bg-white/5 text-neutral-600 cursor-default"
                      : isLightMode
                        ? "bg-white/5 text-slate-600 hover:bg-slate-200/80"
                        : "bg-white/5 text-neutral-400 hover:bg-white/20"
                }`}
              >
                {locked ? <Lock className="w-3 h-3 opacity-60" /> : icon}
                {id}
              </button>
            ))}
            {/* Collapse button — inline in the tab row, aligned with the sidebar edge */}
            <button
              onClick={() => setSidebarCollapsed(true)}
              title="Collapse management panel"
              aria-label="Collapse management panel"
              className={`col-span-1 flex items-center justify-center py-2 rounded-lg transition-all active:scale-95 ${
                isLightMode
                  ? "bg-white/10 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                  : "bg-white/10 text-neutral-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-12 gap-2">
            {(
              [
                {
                  id: "flavors",
                  icon: <Palette className="w-4 h-4" />,
                  locked: !flavorsUnlocked,
                  lockLevel: LEVEL_UNLOCKS.flavors,
                },
                {
                  id: "countries",
                  icon: <Globe className="w-4 h-4" />,
                  locked: !countriesUnlocked,
                  lockLevel: LEVEL_UNLOCKS.countries,
                },
                {
                  id: "achievements",
                  icon: <Trophy className="w-4 h-4" />,
                  locked: false,
                  lockLevel: 0,
                },
              ] as const
            ).map(({ id, icon, locked, lockLevel }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                title={locked ? `Unlocks at level ${lockLevel}` : undefined}
                className={`col-span-4 w-full py-2 px-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === id
                    ? isLightMode
                      ? "bg-slate-950 text-white"
                      : "bg-white text-black"
                    : locked
                      ? "bg-white/5 text-neutral-600 cursor-default"
                      : isLightMode
                        ? "bg-white/5 text-slate-600 hover:bg-slate-200/80"
                        : "bg-white/5 text-neutral-400 hover:bg-white/20"
                }`}
              >
                {locked ? <Lock className="w-3 h-3 opacity-60" /> : icon}
                {id}
              </button>
            ))}
          </div>

          <hr
            className={`${isLightMode ? "border-slate-300/40" : "border-white/20"} mt-2 mb-2`}
          />

          <div className="grid grid-cols-12 gap-2">
            {(["settings", "help", "about"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`col-span-4 w-full py-2 px-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab
                    ? isLightMode
                      ? "bg-slate-950 text-white"
                      : "bg-white text-black"
                    : isLightMode
                      ? "bg-white/5 text-slate-600 hover:bg-slate-200/80"
                      : "bg-white/5 text-neutral-400 hover:bg-white/20"
                }`}
              >
                {tab === "settings" && <Settings className="w-4 h-4" />}
                {tab === "help" && <HelpCircle className="w-4 h-4" />}
                {tab === "about" && <Info className="w-4 h-4" />}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* --- EMPLOYEES TAB --- */}
          {activeTab === "employees" &&
            (!employeesUnlocked ? (
              lockedFeature(
                "Employee Hiring Locked",
                LEVEL_UNLOCKS.employees,
                "Level up by blending, upgrading, and expanding to unlock hiring. Staff blend milkshakes around the clock for passive income.",
              )
            ) : (
              <div className="space-y-3">
                {/* Wage Level Selector */}
                {wagesUnlocked ? (
                  <div
                    className={`glass-panel p-4 space-y-3 border ${
                      state.options.wageLevel === "high"
                        ? "border-emerald-500/30"
                        : state.options.wageLevel === "low"
                          ? "border-red-500/30"
                          : isLightMode
                            ? "border-slate-300/20"
                            : "border-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400">
                          Employee Wages
                        </h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {state.options.wageLevel === "high"
                            ? "Happy staff — double special blend chances."
                            : state.options.wageLevel === "low"
                              ? "Unhappy staff — reduced chances + risk of strike."
                              : "Standard wages. No modifiers."}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {(["low", "normal", "high"] as const).map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() =>
                              setState((prev) => ({
                                ...prev,
                                options: { ...prev.options, wageLevel: lvl },
                              }))
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                              state.options.wageLevel === lvl
                                ? lvl === "high"
                                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                                  : lvl === "low"
                                    ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                                    : "bg-neutral-400 text-black"
                                : isLightMode
                                  ? "bg-white/20 text-slate-500 hover:bg-slate-200"
                                  : "bg-white/5 text-neutral-500 hover:bg-white/10"
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div
                        className={`rounded-lg p-2 text-center ${isLightMode ? "bg-red-100 text-red-700" : "bg-red-500/10 text-red-400"}`}
                      >
                        <div className="font-black uppercase mb-1">Low</div>
                        <div>70% special chances</div>
                        <div className="opacity-70 mt-0.5">
                          3% daily strike risk
                        </div>
                      </div>
                      <div
                        className={`rounded-lg p-2 text-center ${isLightMode ? "bg-slate-100 text-slate-600" : "bg-white/5 text-neutral-400"}`}
                      >
                        <div className="font-black uppercase mb-1">Normal</div>
                        <div>Standard chances</div>
                        <div className="opacity-70 mt-0.5">No risk</div>
                      </div>
                      <div
                        className={`rounded-lg p-2 text-center ${isLightMode ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500/10 text-emerald-400"}`}
                      >
                        <div className="font-black uppercase mb-1">High</div>
                        <div>2× special chances</div>
                        <div className="opacity-70 mt-0.5">No risk</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  lockedFeature(
                    "Wage Management Locked",
                    LEVEL_UNLOCKS.wages,
                    `Reach level ${LEVEL_UNLOCKS.wages} and employ at least ${WAGE_EMPLOYEE_REQUIREMENT} staff before you can tune wage policy.`,
                  )
                )}

                {/* Shake Price Selector */}
                {shakePriceUnlocked ? (
                  <div
                    className={`glass-panel p-4 space-y-3 border ${
                      state.options.shakePrice === "high"
                        ? "border-yellow-500/30"
                        : state.options.shakePrice === "low"
                          ? "border-cyan-500/30"
                          : isLightMode
                            ? "border-slate-300/20"
                            : "border-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400">
                          Shake Price
                        </h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {state.options.shakePrice === "high"
                            ? "Premium pricing — higher manual gains, slower passive sales."
                            : state.options.shakePrice === "low"
                              ? "Budget pricing — lower manual gains, faster passive sales."
                              : "Standard pricing. No modifiers."}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {(["low", "normal", "high"] as const).map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() =>
                              setState((prev) => ({
                                ...prev,
                                options: { ...prev.options, shakePrice: lvl },
                              }))
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                              state.options.shakePrice === lvl
                                ? lvl === "high"
                                  ? "bg-yellow-400 text-black shadow-lg shadow-yellow-400/30"
                                  : lvl === "low"
                                    ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/30"
                                    : "bg-neutral-400 text-black"
                                : isLightMode
                                  ? "bg-white/20 text-slate-500 hover:bg-slate-200"
                                  : "bg-white/5 text-neutral-500 hover:bg-white/10"
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div
                        className={`rounded-lg p-2 text-center ${isLightMode ? "bg-cyan-100 text-cyan-700" : "bg-cyan-500/10 text-cyan-400"}`}
                      >
                        <div className="font-black uppercase mb-1">Low</div>
                        <div>1.4× passive income</div>
                        <div className="opacity-70 mt-0.5">
                          0.7× manual gain
                        </div>
                      </div>
                      <div
                        className={`rounded-lg p-2 text-center ${isLightMode ? "bg-slate-100 text-slate-600" : "bg-white/5 text-neutral-400"}`}
                      >
                        <div className="font-black uppercase mb-1">Normal</div>
                        <div>Standard sales</div>
                        <div className="opacity-70 mt-0.5">No modifiers</div>
                      </div>
                      <div
                        className={`rounded-lg p-2 text-center ${isLightMode ? "bg-yellow-100 text-yellow-700" : "bg-yellow-500/10 text-yellow-400"}`}
                      >
                        <div className="font-black uppercase mb-1">High</div>
                        <div>1.5× manual gain</div>
                        <div className="opacity-70 mt-0.5">
                          0.7× passive income
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  lockedFeature(
                    "Shake Price Control Locked",
                    LEVEL_UNLOCKS.shakePrice,
                    "Set premium or budget pricing once you reach this level — trade manual payout against passive sales speed.",
                  )
                )}

                <div className="px-1 pb-2 border-b border-white/5 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                    Employee Roster
                  </h3>
                  <div className="flex gap-1">
                    {([1, 5, 10, 50] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => setBuyQty(q)}
                        className={`flex-1 py-1 rounded text-xs font-black uppercase transition-all ${
                          buyQty === q
                            ? "bg-cyan-500 text-black"
                            : isLightMode
                              ? "bg-white/20 text-slate-600 hover:bg-slate-200"
                              : "bg-white/10 text-neutral-400 hover:bg-white/20"
                        }`}
                      >
                        ×{q}
                      </button>
                    ))}
                  </div>
                </div>
                {visibleEmployees.map((shop) => {
                  const capacityRemaining =
                    getEmployeeCapacity() - getEmployeeCount();
                  const atCapacity =
                    capacityRemaining <= 0 && getEmployeeCapacity() > 0;
                  const noCapacityYet = getEmployeeCapacity() === 0;
                  const blocked = atCapacity || noCapacityYet;
                  const actualQty = blocked
                    ? 1
                    : Math.min(buyQty, Math.max(1, capacityRemaining));
                  const cost =
                    blocked || buyQty === 1
                      ? getShopCost(shop)
                      : bulkBuyCost(shop, actualQty);
                  const cantAfford = !blocked && state.money < cost;
                  const isDisabled = blocked || cantAfford;
                  return (
                    <div
                      key={shop.id}
                      className={`glass-panel p-4 flex items-center justify-between transition-all ${
                        atCapacity || noCapacityYet
                          ? "border border-amber-500/40 bg-amber-500/5"
                          : isDisabled
                            ? "opacity-50 grayscale"
                            : "hover:bg-white/5 cursor-pointer active:scale-95"
                      }`}
                      onClick={() =>
                        buyQty === 1
                          ? buyShop(shop.id)
                          : buyShopBulk(shop.id, buyQty)
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <Users className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm tracking-tight">
                            {shop.name}
                          </h4>
                          <p className="text-xs font-mono text-neutral-500">
                            {shop.description}
                          </p>
                          <p className="text-xs font-mono text-neutral-500 mt-1">
                            Staff Count: {shop.count}
                          </p>
                          {(atCapacity || noCapacityYet) && (
                            <p className="text-xs font-bold text-amber-400 mt-1 uppercase tracking-wide">
                              {noCapacityYet
                                ? "⚠ No shop capacity"
                                : "⚠ Capacity full"}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {!blocked && actualQty < buyQty && (
                          <div className="text-[10px] text-amber-400 font-bold mb-0.5">
                            cap: {actualQty}/{buyQty}
                          </div>
                        )}
                        <div
                          className={`text-sm font-mono font-black tracking-tighter ${cantAfford ? "text-red-400" : "text-yellow-500"}`}
                        >
                          {!blocked && actualQty > 1 ? `×${actualQty} · ` : ""}$
                          {formatLargeNumber(cost)}
                        </div>
                        <div className="text-xs text-green-400 font-mono">
                          +$
                          {formatLargeNumber(
                            shop.baseIncome * (blocked ? 1 : actualQty),
                          )}
                          /s
                        </div>
                        {cantAfford &&
                          !blocked &&
                          (() => {
                            const eta = timeToAfford(
                              cost,
                              state.money,
                              getIncomePerSecond(),
                            );
                            return eta ? (
                              <div className="text-[10px] text-neutral-500 font-mono">
                                {eta}
                              </div>
                            ) : null;
                          })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

          {/* --- SHOPS TAB --- */}
          {activeTab === "shops" &&
            (!shopsUnlocked ? (
              lockedFeature(
                "Shop Extensions Locked",
                LEVEL_UNLOCKS.shops,
                "Keep blending and leveling up to unlock shop extensions — they expand seating, marketing reach, and the staff capacity you can hire into.",
              )
            ) : (
              <div className="space-y-3">
                <div className="px-1 pb-2 border-b border-white/5 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                    Shop Extensions
                  </h3>
                  <div className="flex gap-1">
                    {([1, 5, 10, 50] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => setBuyQty(q)}
                        className={`flex-1 py-1 rounded text-xs font-black uppercase transition-all ${
                          buyQty === q
                            ? "bg-cyan-500 text-black"
                            : isLightMode
                              ? "bg-white/20 text-slate-600 hover:bg-slate-200"
                              : "bg-white/10 text-neutral-400 hover:bg-white/20"
                        }`}
                      >
                        ×{q}
                      </button>
                    ))}
                  </div>
                </div>
                {visibleShopExtensions.map((shop) => {
                  const cost =
                    buyQty === 1
                      ? getShopCost(shop)
                      : bulkBuyCost(shop, buyQty);
                  return (
                    <div
                      key={shop.id}
                      className={`glass-panel p-4 flex items-center justify-between transition-all ${state.money < cost ? "opacity-50 grayscale" : "hover:bg-white/5 cursor-pointer active:scale-95"}`}
                      onClick={() =>
                        buyQty === 1
                          ? buyShop(shop.id)
                          : buyShopBulk(shop.id, buyQty)
                      }
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <Store className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm tracking-tight">
                            {shop.name}
                          </h4>
                          <p className="text-xs font-mono text-neutral-500">
                            {shop.description}
                          </p>
                          <p className="text-xs font-mono text-neutral-500 mt-1">
                            Level: {shop.count}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-black text-yellow-500 tracking-tighter">
                          {buyQty > 1 ? `×${buyQty} · ` : ""}$
                          {formatLargeNumber(cost)}
                        </div>
                        <div className="text-xs text-green-400 font-mono text-center">
                          +${formatLargeNumber(shop.baseIncome * buyQty)}/s
                        </div>
                        {state.money < cost &&
                          (() => {
                            const eta = timeToAfford(
                              cost,
                              state.money,
                              getIncomePerSecond(),
                            );
                            return eta ? (
                              <div className="text-[10px] text-neutral-500 font-mono text-center">
                                {eta}
                              </div>
                            ) : null;
                          })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

          {/* --- UPGRADES TAB --- */}
          {activeTab === "upgrades" && (
            <div className="space-y-4">
              {(["special", "standard"] as const).map((section) => {
                const sectionKeys = (
                  Object.keys(
                    UPGRADE_REGISTRY,
                  ) as (keyof GameState["upgrades"])[]
                )
                  .filter((k) =>
                    section === "special"
                      ? UPGRADE_REGISTRY[k].section === "special"
                      : UPGRADE_REGISTRY[k].section !== "special",
                  )
                  .sort((a, b) => {
                    const costA = UPGRADE_REGISTRY[a].baseCost;
                    const costB = UPGRADE_REGISTRY[b].baseCost;
                    return costA !== costB ? costA - costB : a.localeCompare(b);
                  });

                const isCollapsed = upgradesSectionCollapsed[section];
                const sectionLabel =
                  section === "special" ? "Special Unlocks" : "Upgrades";
                const sectionSubtitle =
                  section === "special"
                    ? "One-time permanent unlocks"
                    : "Repeatable upgrade tiers";

                if (section === "special" && !specialUpgradesUnlocked) {
                  return (
                    <div
                      key={section}
                      className="glass-panel p-3 text-center text-xs text-neutral-500"
                    >
                      <Lock className="w-4 h-4 mx-auto mb-1 opacity-40" />
                      Special Unlocks available at Level{" "}
                      {LEVEL_UNLOCKS.specialUpgrades}
                    </div>
                  );
                }

                return (
                  <div key={section} className="space-y-3">
                    <button
                      onClick={() =>
                        setUpgradesSectionCollapsed((prev) => ({
                          ...prev,
                          [section]: !prev[section],
                        }))
                      }
                      className="w-full flex items-center justify-between px-1 py-0.5 hover:bg-white/5 rounded transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        {isCollapsed ? (
                          <ChevronRight className="w-3 h-3 text-neutral-500" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-neutral-500" />
                        )}
                        <div className="text-left">
                          <h4 className="text-xs font-black uppercase tracking-[0.15em] text-neutral-400">
                            {sectionLabel}
                          </h4>
                          <p className="text-[10px] text-neutral-600">
                            {sectionSubtitle}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {
                          sectionKeys.filter(
                            (k) =>
                              (state.upgrades[k] || 0) >=
                              UPGRADE_REGISTRY[k].maxLevel,
                          ).length
                        }
                        /{sectionKeys.length} maxed
                      </span>
                    </button>

                    {!isCollapsed &&
                      sectionKeys.map((key) => {
                        const cost = getUpgradeCost(key);
                        const level = state.upgrades[key] || 0;

                        const { icon, iconColor } = (() => {
                          switch (key) {
                            case "mixSpeed":
                              return {
                                icon: <RefreshCw />,
                                iconColor: "text-blue-400",
                              };
                            case "marketingCampaign":
                              return {
                                icon: <TrendingUp />,
                                iconColor: "text-green-400",
                              };
                            case "employeeTraining":
                              return {
                                icon: <Smile />,
                                iconColor: "text-yellow-400",
                              };
                            case "qualityControl":
                              return {
                                icon: <Sparkles />,
                                iconColor: "text-indigo-400",
                              };
                            case "equipmentUpgrade":
                              return {
                                icon: <Zap />,
                                iconColor: "text-blue-500",
                              };
                            case "heatControl":
                              return {
                                icon: <Flame />,
                                iconColor: "text-red-500",
                              };
                            case "recipeDevelopment":
                              return {
                                icon: <Trophy />,
                                iconColor: "text-yellow-400",
                              };
                            case "customBlending":
                              return {
                                icon: <Palette />,
                                iconColor: "text-sky-400",
                              };
                            case "bulkPurchasing":
                              return {
                                icon: <Layers />,
                                iconColor: "text-cyan-400",
                              };
                            case "distributionNetwork":
                              return {
                                icon: <Rocket />,
                                iconColor: "text-orange-400",
                              };
                            case "portionSize":
                              return {
                                icon: <Milk />,
                                iconColor: "text-white",
                              };
                            case "specialMastery":
                              return {
                                icon: <Sparkles />,
                                iconColor: "text-purple-400",
                              };
                            case "ingredientQuality":
                              return {
                                icon: <Milk />,
                                iconColor: "text-emerald-300",
                              };
                            case "storefrontAppeal":
                              return {
                                icon: <Store />,
                                iconColor: "text-amber-300",
                              };
                            case "expansionNegotiation":
                              return {
                                icon: <MapPin />,
                                iconColor: "text-green-300",
                              };
                            case "autoMixerTuning":
                              return {
                                icon: <Zap />,
                                iconColor: "text-sky-300",
                              };
                            case "flavorSlots":
                              return {
                                icon: <Layers />,
                                iconColor: "text-teal-400",
                              };
                            case "goldenTouch":
                              return {
                                icon: <Sparkles />,
                                iconColor: "text-yellow-400",
                              };
                            case "loyaltyProgram":
                              return {
                                icon: <Heart />,
                                iconColor: "text-rose-400",
                              };
                            case "freezerTech":
                              return {
                                icon: <Snowflake />,
                                iconColor: "text-cyan-300",
                              };
                            case "socialMediaBuzz":
                              return {
                                icon: <Megaphone />,
                                iconColor: "text-sky-400",
                              };
                            case "masterMixologist":
                              return {
                                icon: <Trophy />,
                                iconColor: "text-amber-400",
                              };
                            case "rushHourOptimization":
                              return {
                                icon: <Zap />,
                                iconColor: "text-orange-300",
                              };
                            case "doubleShot":
                              return {
                                icon: <Zap />,
                                iconColor: "text-yellow-300",
                              };
                            case "speedBlending":
                              return {
                                icon: <RefreshCw />,
                                iconColor: "text-sky-400",
                              };
                            case "extraBlender":
                              return {
                                icon: <Layers />,
                                iconColor: "text-fuchsia-400",
                              };
                            case "shiftManager":
                              return {
                                icon: <Users />,
                                iconColor: "text-violet-400",
                              };
                            case "talentRecruitment":
                              return {
                                icon: <Users />,
                                iconColor: "text-purple-300",
                              };
                            case "supplyChainOptimization":
                              return {
                                icon: <Rocket />,
                                iconColor: "text-cyan-400",
                              };
                            case "brandLicensing":
                              return {
                                icon: <Award />,
                                iconColor: "text-amber-300",
                              };
                            case "premiumPackaging":
                              return {
                                icon: <Star />,
                                iconColor: "text-yellow-300",
                              };
                            case "automationExpansion":
                              return {
                                icon: <Zap />,
                                iconColor: "text-violet-400",
                              };
                            case "wifiOptimization":
                              return {
                                icon: <Zap />,
                                iconColor: "text-indigo-300",
                              };
                            case "customerAnalyticsAI":
                              return {
                                icon: <TrendingUp />,
                                iconColor: "text-emerald-400",
                              };
                            case "cloudKitchenIntegration":
                              return {
                                icon: <Globe />,
                                iconColor: "text-blue-400",
                              };
                            case "viralMarketingAI":
                              return {
                                icon: <Megaphone />,
                                iconColor: "text-fuchsia-400",
                              };
                            case "automationOverclock":
                              return {
                                icon: <Zap />,
                                iconColor: "text-red-400",
                              };
                            case "quantumLogistics":
                              return {
                                icon: <Rocket />,
                                iconColor: "text-violet-300",
                              };
                            default:
                              return {
                                icon: <ChevronRight />,
                                iconColor: "text-neutral-400",
                              };
                          }
                        })();

                        const isMaxed = level >= UPGRADE_REGISTRY[key].maxLevel;
                        return (
                          <UpgradeCard
                            key={key}
                            icon={icon}
                            iconColor={iconColor}
                            name={UPGRADE_REGISTRY[key].name}
                            desc={getUpgradeDesc(key)}
                            effect={UPGRADE_REGISTRY[key].effect}
                            level={level}
                            maxLevel={UPGRADE_REGISTRY[key].maxLevel}
                            cost={cost}
                            canAfford={!isMaxed && state.money >= cost}
                            onBuy={() => buyUpgrade(key, cost)}
                            timeToAffordLabel={
                              !isMaxed && state.money < cost
                                ? timeToAfford(
                                    cost,
                                    state.money,
                                    getIncomePerSecond(),
                                  )
                                : null
                            }
                          />
                        );
                      })}
                  </div>
                );
              })}

              {/* Power-Ups section */}
              <div className="glass-panel p-3 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                    Power-Ups
                  </h4>
                  <span className="text-[10px] text-neutral-600">
                    Consumable boosts
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {CONSUMABLES.map((c) => {
                    const cost = Math.floor(
                      c.baseCost * Math.pow(1 + state.gameDays / 200, 1.3),
                    );
                    const stock = state.consumables[c.id] || 0;
                    const isActive = activeBuffsList.some(
                      (b) => b.label === c.name,
                    );
                    const canAfford = state.money >= cost;
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${c.bg}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-black ${c.color}`}>
                              {c.name}
                            </span>
                            {isActive && (
                              <span className="text-[9px] font-bold bg-white/10 text-white px-1 rounded uppercase">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-400">
                            {c.desc} · {c.detail}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {stock > 0 && (
                            <button
                              onClick={() =>
                                activateConsumable(
                                  c.id,
                                  c.multiplier,
                                  c.durationSec,
                                  c.name,
                                )
                              }
                              disabled={isActive}
                              className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${isActive ? "bg-white/5 text-neutral-500 cursor-not-allowed" : "bg-white/15 hover:bg-white/25 text-white active:scale-95"}`}
                            >
                              Use ({stock})
                            </button>
                          )}
                          <button
                            onClick={() => buyConsumable(c.id, cost)}
                            disabled={!canAfford}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${canAfford ? `${c.bg} ${c.color} hover:brightness-125 active:scale-95` : "bg-white/5 text-neutral-500 cursor-not-allowed"}`}
                          >
                            ${formatLargeNumber(cost)}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* --- FLAVORS TAB --- */}
          {activeTab === "flavors" &&
            (!flavorsUnlocked ? (
              lockedFeature(
                "Flavor Unlocking Locked",
                LEVEL_UNLOCKS.flavors,
                "Reach level 1 to start unlocking new milkshake flavors and flavor combos.",
              )
            ) : (
              <>
                <div className="px-1 pb-2 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                    Flavors
                  </h3>
                  <span className="text-xs font-bold text-neutral-500">
                    {state.activeFlavors.length}/
                    {(state.upgrades.flavorSlots || 0) + 1} active
                  </span>
                </div>
                {visibleFlavors.map((type) => {
                  const flavor = FLAVORS[type];
                  const isUnlocked = state.unlockedFlavors.includes(type);
                  const isCurrent = state.activeFlavors.includes(type);
                  return (
                    <div
                      key={type}
                      className={`glass-panel p-4 flex items-center justify-between ${!isUnlocked && state.money < flavor.unlockCost ? "opacity-40" : ""}`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center"
                          style={{
                            backgroundColor: isUnlocked ? flavor.color : "#333",
                          }}
                        >
                          {isCurrent && (
                            <Zap className="w-4 h-4 text-white drop-shadow-md" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm tracking-tight">
                            {isUnlocked ? flavor.type : "Locked Flavor"}
                          </h4>
                          <p className="text-xs text-neutral-400">
                            Yield: +{flavor.multiplier}x
                          </p>
                        </div>
                      </div>
                      {isUnlocked ? (
                        <button
                          onClick={() => toggleFlavor(type)}
                          disabled={
                            !isCurrent &&
                            state.activeFlavors.length >=
                              (state.upgrades.flavorSlots || 0) + 1 &&
                            (state.upgrades.flavorSlots || 0) + 1 > 1
                          }
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-all border ${
                            isCurrent
                              ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white border-transparent shadow-lg shadow-sky-500/20"
                              : !isCurrent &&
                                  state.activeFlavors.length >=
                                    (state.upgrades.flavorSlots || 0) + 1 &&
                                  (state.upgrades.flavorSlots || 0) + 1 === 1
                                ? "bg-white/5 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                                : state.activeFlavors.length >=
                                    (state.upgrades.flavorSlots || 0) + 1
                                  ? "bg-white/5 text-neutral-600 border-white/5 cursor-not-allowed"
                                  : "bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {isCurrent
                            ? "Mixing"
                            : !isCurrent &&
                                state.activeFlavors.length >=
                                  (state.upgrades.flavorSlots || 0) + 1 &&
                                (state.upgrades.flavorSlots || 0) + 1 === 1
                              ? "Swap"
                              : "Add"}
                        </button>
                      ) : (
                        <button
                          onClick={() => unlockFlavor(type)}
                          disabled={state.money < flavor.unlockCost}
                          className="flex flex-col items-end"
                        >
                          <span className="text-xs font-bold text-yellow-400">
                            ${formatLargeNumber(flavor.unlockCost)}
                          </span>
                          <span className="text-xs uppercase text-neutral-500 font-bold">
                            Unlock
                          </span>
                          {state.money < flavor.unlockCost &&
                            (() => {
                              const eta = timeToAfford(
                                flavor.unlockCost,
                                state.money,
                                getIncomePerSecond(),
                              );
                              return eta ? (
                                <span className="text-[10px] text-neutral-600 font-mono">
                                  {eta}
                                </span>
                              ) : null;
                            })()}
                        </button>
                      )}
                    </div>
                  );
                })}
                {(() => {
                  const visibleCombos = FLAVOR_COMBOS.filter((c) =>
                    c.flavors.some((f) => state.unlockedFlavors.includes(f)),
                  );
                  if (visibleCombos.length === 0) return null;
                  const sorted = [...visibleCombos].sort((a, b) => {
                    const aActive = a.flavors.every((f) =>
                      state.activeFlavors.includes(f),
                    );
                    const bActive = b.flavors.every((f) =>
                      state.activeFlavors.includes(f),
                    );
                    const aNear =
                      !aActive &&
                      a.flavors.filter((f) => !state.activeFlavors.includes(f))
                        .length === 1;
                    const bNear =
                      !bActive &&
                      b.flavors.filter((f) => !state.activeFlavors.includes(f))
                        .length === 1;
                    if (aActive !== bActive) return aActive ? -1 : 1;
                    if (aNear !== bNear) return aNear ? -1 : 1;
                    return 0;
                  });
                  return (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-amber-400 px-1">
                        Flavor Combos
                      </h3>
                      {sorted.map((combo) => {
                        const isActive = combo.flavors.every((f) =>
                          state.activeFlavors.includes(f),
                        );
                        const missing = combo.flavors.filter(
                          (f) => !state.activeFlavors.includes(f),
                        );
                        const isNear = !isActive && missing.length === 1;
                        return (
                          <div
                            key={combo.id}
                            className={`glass-panel p-3 space-y-1.5 transition-all ${
                              isActive
                                ? "border border-yellow-500/40 bg-yellow-500/5"
                                : isNear
                                  ? "border border-white/10 opacity-80"
                                  : "opacity-40"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                {isActive && (
                                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                                )}
                                <span className="text-sm font-bold">
                                  {combo.name}
                                </span>
                              </div>
                              <span
                                className={`text-xs font-bold ${combo.color}`}
                              >
                                {combo.label}
                              </span>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              {combo.flavors.map((f) => (
                                <span
                                  key={f}
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                                    state.activeFlavors.includes(f)
                                      ? "bg-white/20 border-white/30 text-white"
                                      : state.unlockedFlavors.includes(f)
                                        ? "bg-white/5 border-white/15 text-neutral-400"
                                        : "bg-black/20 border-white/5 text-neutral-600"
                                  }`}
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                            {isNear && (
                              <p className="text-[10px] text-amber-400 font-bold">
                                Add {missing[0]} to activate!
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </>
            ))}

          {/* --- COUNTRIES TAB --- */}
          {activeTab === "countries" &&
            (!countriesUnlocked ? (
              lockedFeature(
                "Global Expansion Locked",
                LEVEL_UNLOCKS.countries,
                "Reach level 15 to start expanding your milkshake empire to new countries and unlock income multipliers.",
              )
            ) : (
              <div className="space-y-3">
                {COUNTRIES.map((country, index) => {
                  const isUnlocked = state.unlockedCountries.includes(
                    country.id,
                  );
                  const negotiation = state.upgrades.expansionNegotiation || 0;
                  const discount = 1 - Math.min(0.3, negotiation * 0.03);
                  const cost = Math.floor(country.cost * discount);
                  let lastUnlockedIndex = -1;
                  for (let i = COUNTRIES.length - 1; i >= 0; i--) {
                    if (state.unlockedCountries.includes(COUNTRIES[i].id)) {
                      lastUnlockedIndex = i;
                      break;
                    }
                  }

                  // Show next 6 countries ahead of current progress
                  if (!isUnlocked && index > lastUnlockedIndex + 6) return null;

                  return (
                    <div
                      key={country.id}
                      className={`glass-panel p-4 space-y-3 transition-all ${!isUnlocked && state.money < cost ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/5 rounded-lg">
                            {country.id === "moon" ? (
                              <Rocket className="w-5 h-5 text-blue-400" />
                            ) : (
                              <Globe className="w-5 h-5 text-green-400" />
                            )}
                          </div>
                          <h4 className="font-bold text-sm tracking-tight">
                            {country.name}
                          </h4>
                        </div>
                        {isUnlocked && (
                          <Trophy className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed italic">
                        {country.description}
                      </p>
                      {!isUnlocked ? (
                        <>
                          {(() => {
                            const curIncome = calcIncomePerSecond(
                              { shops: state.shops, upgrades: state.upgrades },
                              getGlobalMultiplier(),
                            );
                            const newIncome = curIncome * country.multiplier;
                            if (curIncome > 0.01) {
                              return (
                                <div className="text-[10px] text-neutral-400 flex items-center gap-1 justify-center">
                                  <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span>
                                    ${formatLargeNumber(curIncome)}/s
                                    <span className="text-neutral-500">
                                      {" "}
                                      →{" "}
                                    </span>
                                    <span className="text-emerald-400 font-bold">
                                      ${formatLargeNumber(newIncome)}/s
                                    </span>
                                    <span className="text-neutral-500 ml-1">
                                      (×{country.multiplier})
                                    </span>
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}
                          <button
                            onClick={() => buyCountry(country.id)}
                            disabled={state.money < cost}
                            className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-yellow-500 font-bold text-xs flex items-center justify-center gap-2"
                          >
                            <MapPin className="w-3 h-3" />
                            Expand: ${formatLargeNumber(cost)}
                          </button>
                        </>
                      ) : (
                        <div className="text-[10px] uppercase tracking-widest font-black text-green-500 text-center">
                          Active: x{country.multiplier} Empire Bonus
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

          {/* --- ACHIEVEMENTS TAB --- */}
          {activeTab === "achievements" && (
            <AchievementsPanel
              state={state}
              playerLevel={playerLevel}
              collapsedAchCats={collapsedAchCats}
              setCollapsedAchCats={setCollapsedAchCats}
              employeeCount={getEmployeeCount()}
              totalShopExtensions={totalShopExtensions}
            />
          )}

          {/* --- ABOUT TAB --- */}
          {activeTab === "about" && <AboutPanel appVersion={APP_VERSION} />}

          {/* --- SETTINGS TAB --- */}
          {activeTab === "settings" && (
            <SettingsPanel
              state={state}
              setState={setState}
              isLightMode={isLightMode}
              appVersion={APP_VERSION}
              saveNow={saveNow}
              addNotification={addNotification}
              onExportSave={exportSave}
              onImportSave={importSave}
              onExportSaveFile={exportSaveFile}
              onImportSaveFile={importSaveFile}
              onResetGame={resetGame}
              onResetSettings={resetSettings}
              onShowModal={setShowModal}
              backgroundsUnlocked={backgroundsUnlocked}
            />
          )}
          {/* --- HELP TAB --- */}
          {activeTab === "help" && (
            <HelpPanel
              onReplay={(steps) => setActiveGuide({ steps, starter: false })}
            />
          )}
        </div>
        {/* --- Level / XP Footer --- */}
        <div
          className={`shrink-0 border-t px-4 py-3 ${
            isLightMode
              ? "border-slate-300/30 bg-slate-400/30"
              : "border-white/10 bg-neutral-800/60"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center min-w-11 h-11 px-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black font-black text-xl shadow-lg shadow-amber-500/20">
                {lvlInfo.level}
              </div>
              <div className="leading-tight">
                <p className="text-base font-black uppercase tracking-wider text-amber-400">
                  Level {lvlInfo.level}
                </p>
                <p className="text-xs text-neutral-500">
                  Milkshake Empire Rank
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-neutral-300">
              {Math.floor(
                parseInt(formatLargeNumber(Math.floor(lvlInfo.intoLevel))),
              )}{" "}
              / {Math.floor(parseInt(formatLargeNumber(lvlInfo.needed)))} XP
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-[width] duration-500 ease-out"
              style={{ width: `${Math.round(lvlInfo.pct * 100)}%` }}
            />
          </div>
        </div>
      </div>
      {/* --- CUSTOM MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`max-w-md w-full glass-panel p-8 border-2 ${showModal.type === "danger" ? "border-red-500/50" : "border-blue-500/50"}`}
          >
            <h2
              className={`text-2xl font-display font-black uppercase tracking-tighter mb-4 ${showModal.type === "danger" ? "text-red-500" : "text-blue-400"}`}
            >
              {showModal.title}
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed mb-8 whitespace-pre-wrap">
              {showModal.msg}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowModal(null)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showModal.onConfirm();
                  setShowModal(null);
                }}
                className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                  showModal.type === "danger"
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                }`}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {importOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-lg w-full glass-panel p-8 border-2 border-blue-500/40"
          >
            <h2 className="text-2xl font-display font-black uppercase tracking-tighter mb-4 text-blue-400">
              Import save
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed mb-4">
              Paste your save code (starts with <strong>SMM1:</strong>).
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={6}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 font-mono text-xs text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Paste save code here…"
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setImportOpen(false);
                  setImportText("");
                }}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  navigator.clipboard
                    .readText()
                    .then((text) => setImportText(text))
                    .catch(() =>
                      setShowModal({
                        title: "Clipboard blocked",
                        msg: "Could not read clipboard. Paste the save code manually.",
                        type: "danger",
                        onConfirm: () => {},
                      }),
                    );
                }}
                className="py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl font-black uppercase tracking-widest text-xs transition-colors border border-white/10"
              >
                Paste
              </button>
              <button
                onClick={() => {
                  (async () => {
                    try {
                      const text = importText.trim();
                      if (!text) {
                        setShowModal({
                          title: "Nothing to import",
                          msg: "Paste a save code first.",
                          type: "danger",
                          onConfirm: () => {},
                        });
                        return;
                      }
                      const decoded = await decodeSaveCode(text);
                      const loaded = sanitizeLoadedState(decoded);
                      setState(loaded);
                      setImportOpen(false);
                      setImportText("");
                      addNotification("Save imported", "normal");
                    } catch (e) {
                      setShowModal({
                        title: "Import failed",
                        msg: "That did not look like a valid save code. Make sure you copied the full code (it should start with SMM1:).",
                        type: "danger",
                        onConfirm: () => {},
                      });
                    }
                  })();
                }}
                className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
              >
                Import
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* --- EVENT CHRONICLE POPUP --- */}
      <AnimatePresence>
        {chronicleOpen && (
          <motion.div
            key="chronicle-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setChronicleOpen(false)}
          >
            <motion.div
              key="chronicle-panel"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => {
                (e as { stopPropagation: () => void }).stopPropagation();
              }}
              className="w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl border border-sky-500/30 bg-neutral-900/95 shadow-2xl shadow-black/60 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                <Info className="w-5 h-5 text-sky-400 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-sky-300">
                    Event Chronicle
                  </h3>
                  <p className="text-[10px] text-neutral-500">
                    {state.eventLog.length} event
                    {state.eventLog.length !== 1 ? "s" : ""} logged
                  </p>
                </div>
                <button
                  onClick={() => setChronicleOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 transition-colors text-neutral-400 hover:text-white"
                >
                  <span className="sr-only">Close</span>✕
                </button>
              </div>
              {/* Entries */}
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
                {state.eventLog.slice(0, shownLogCount).map((entry, i) => {
                  let dateLabel: string;
                  if (entry.timestamp) {
                    const d = new Date(entry.timestamp);
                    const mo = d.toLocaleString("en-US", { month: "short" });
                    const dy = d.getDate();
                    const yr = String(d.getFullYear()).slice(-2);
                    dateLabel =
                      state.options.dateFormat === "dmy"
                        ? `${dy} ${mo} '${yr}`
                        : `${mo} ${dy}, '${yr}`;
                  } else {
                    dateLabel = `Day ${entry.day}`;
                  }
                  return (
                    <div key={i} className="px-5 py-3 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-black text-white">
                          {entry.name}
                        </span>
                        <span className="shrink-0 text-neutral-500 font-mono text-[10px]">
                          {dateLabel}
                        </span>
                      </div>
                      <div className="text-sky-300/80 mb-0.5">
                        {entry.choice}
                      </div>
                      <div className="text-neutral-400">{entry.outcome}</div>
                    </div>
                  );
                })}
                {state.eventLog.length === 0 && (
                  <div className="px-5 py-8 text-center text-neutral-600 text-xs">
                    No events recorded yet.
                  </div>
                )}
              </div>
              {/* Load More */}
              {state.eventLog.length > shownLogCount && (
                <div className="border-t border-white/10 px-5 py-3">
                  <button
                    onClick={() => setShownLogCount((n) => n + 10)}
                    className="w-full py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-bold transition-colors"
                  >
                    Load More ({state.eventLog.length - shownLogCount}{" "}
                    remaining)
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- GOALS POPUP --- */}
      <AnimatePresence>
        {goalsOpen &&
          state.goals &&
          (() => {
            const nowMs = Date.now();
            const dailyMsLeft = Math.max(0, state.goals.dailyResetAt - nowMs);
            const hourlyMsLeft = Math.max(0, state.goals.hourlyResetAt - nowMs);
            const sections = [
              {
                label: "Daily Goals",
                goals: state.goals.daily,
                msLeft: dailyMsLeft,
                cat: "daily" as const,
              },
              {
                label: "Hourly Goals",
                goals: state.goals.hourly,
                msLeft: hourlyMsLeft,
                cat: "hourly" as const,
              },
            ] as const;
            return (
              <motion.div
                key="goals-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                onClick={() => setGoalsOpen(false)}
              >
                <motion.div
                  key="goals-panel"
                  initial={{ scale: 0.92, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  onClick={(e) => {
                    (e as { stopPropagation: () => void }).stopPropagation();
                  }}
                  className="w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl border border-teal-500/30 bg-neutral-900/95 shadow-2xl shadow-black/60 overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                    <Target className="w-5 h-5 text-teal-400 shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-black uppercase tracking-widest text-teal-300">
                        Goals
                      </h3>
                      <p className="text-[10px] text-neutral-500">
                        {
                          [...state.goals.daily, ...state.goals.hourly].filter(
                            (g) => g.claimed,
                          ).length
                        }{" "}
                        / {state.goals.daily.length + state.goals.hourly.length}{" "}
                        completed
                      </p>
                    </div>
                    <button
                      onClick={() => setGoalsOpen(false)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 transition-colors text-neutral-400 hover:text-white"
                    >
                      <span className="sr-only">Close</span>✕
                    </button>
                  </div>
                  {/* Content */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {sections.map(({ label, goals, msLeft, cat }) => (
                      <div
                        key={cat}
                        className="px-5 py-4 border-b border-white/5 last:border-b-0"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
                            {label}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            resets in {fmtCountdown(msLeft)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {goals.map((goal) => {
                            const def = ALL_GOAL_MAP.get(goal.id);
                            if (!def) return null;
                            const pct = Math.min(
                              1,
                              goal.progress / goal.target,
                            );
                            const complete = goal.progress >= goal.target;
                            const rewardLbl = getRewardLabel(
                              def.reward,
                              goal.target,
                            );
                            return (
                              <div
                                key={goal.id}
                                className={`rounded-xl border p-3 ${goal.claimed ? "opacity-40 border-white/5" : complete ? "border-teal-500/40 bg-teal-500/5" : "border-white/10 bg-white/3"}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-xs font-semibold leading-snug ${goal.claimed ? "line-through text-neutral-500" : "text-neutral-100"}`}
                                    >
                                      {getGoalLabel(goal)}
                                    </p>
                                    <p className="text-[10px] text-neutral-500 mt-0.5">
                                      {rewardLbl}
                                    </p>
                                  </div>
                                  {complete && !goal.claimed && (
                                    <button
                                      onClick={() => claimGoal(goal.id, cat)}
                                      className="shrink-0 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide bg-teal-500/20 text-teal-300 border border-teal-500/40 rounded-lg hover:bg-teal-500/30 active:scale-95 transition-all"
                                    >
                                      Claim
                                    </button>
                                  )}
                                  {goal.claimed && (
                                    <span className="shrink-0 text-[10px] text-neutral-600 font-bold uppercase">
                                      Done
                                    </span>
                                  )}
                                </div>
                                {!goal.claimed && (
                                  <>
                                    <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-[width] duration-300 ${complete ? "bg-teal-400" : "bg-teal-600/60"}`}
                                        style={{ width: `${pct * 100}%` }}
                                      />
                                    </div>
                                    <p className="text-[10px] text-neutral-500 font-mono mt-1 text-right">
                                      {def.type === "earnIncome" ||
                                      def.type === "spendMoney"
                                        ? `$${formatLargeNumber(Math.floor(goal.progress))} / $${formatLargeNumber(goal.target)}`
                                        : `${Math.floor(goal.progress)} / ${goal.target}`}
                                    </p>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      {/* --- OFFLINE SUMMARY MODAL --- */}
      <AnimatePresence>
        {offlineSummary && (
          <motion.div
            key="offline-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              key="offline-panel"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-sm rounded-3xl border border-violet-500/30 bg-neutral-900/95 shadow-2xl shadow-black/60 p-6 text-center space-y-4"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/30 mx-auto">
                <Users className="w-7 h-7 text-violet-400" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-widest text-violet-300">
                  Welcome Back!
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  You were away{" "}
                  {(() => {
                    const s = Math.floor(offlineSummary.durationMs / 1000);
                    const h = Math.floor(s / 3600);
                    const m = Math.floor((s % 3600) / 60);
                    return h > 0 ? `${h}h ${m}m` : `${m}m`;
                  })()}
                </p>
              </div>
              <div className="rounded-2xl bg-violet-500/10 border border-violet-500/20 p-4">
                <p className="text-xs text-neutral-400 mb-1">
                  Your Shift Manager kept things running
                </p>
                <p className="text-2xl font-black text-white font-mono">
                  +${formatLargeNumber(offlineSummary.earned)}
                </p>
              </div>
              <button
                onClick={() => setOfflineSummary(null)}
                className="w-full py-3 rounded-2xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 font-black text-xs uppercase tracking-widest transition-all active:scale-95"
              >
                Collect Earnings
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CHOICE EVENT MODAL --- */}
      {pendingChoiceEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full glass-panel p-8 border-2 border-yellow-500/40"
          >
            <div className="flex items-center gap-3 mb-2">
              {pendingChoiceEvent.icon === "alert" && (
                <AlertTriangle className="w-6 h-6 text-yellow-400 shrink-0" />
              )}
              {pendingChoiceEvent.icon === "star" && (
                <Star className="w-6 h-6 text-amber-400 shrink-0" />
              )}
              {pendingChoiceEvent.icon === "wrench" && (
                <Wrench className="w-6 h-6 text-orange-400 shrink-0" />
              )}
              <h2 className="text-2xl font-display font-black uppercase tracking-tighter text-yellow-300">
                {pendingChoiceEvent.title}
              </h2>
            </div>
            <p className="text-neutral-300 text-sm leading-relaxed mb-6">
              {pendingChoiceEvent.description}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => resolveChoiceEvent("A")}
                disabled={state.money < pendingChoiceEvent.choiceA.cost}
                className={`w-full p-4 rounded-xl text-left transition-all border ${
                  state.money < pendingChoiceEvent.choiceA.cost
                    ? "bg-white/5 border-white/5 opacity-50 cursor-not-allowed"
                    : "bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20"
                }`}
              >
                <div className="font-bold text-sm text-yellow-300 mb-1">
                  {pendingChoiceEvent.choiceA.label}
                  {pendingChoiceEvent.choiceA.cost > 0 && (
                    <span className="ml-2 text-neutral-400 font-normal">
                      (${formatLargeNumber(pendingChoiceEvent.choiceA.cost)})
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-400">
                  {pendingChoiceEvent.choiceA.description}
                </div>
              </button>
              <button
                onClick={() => resolveChoiceEvent("B")}
                className="w-full p-4 rounded-xl text-left bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="font-bold text-sm text-neutral-200 mb-1">
                  {pendingChoiceEvent.choiceB.label}
                </div>
                <div className="text-xs text-neutral-400">
                  {pendingChoiceEvent.choiceB.description}
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* --- GUIDE / TUTORIAL MODAL --- */}
      {activeGuide && (
        <GuideModal
          steps={activeGuide.steps}
          onClose={() => {
            if (activeGuide.starter) {
              setState((prev: GameState) => ({
                ...prev,
                options: { ...prev.options, seenTutorial: true },
              }));
            }
            setActiveGuide(null);
          }}
        />
      )}
    </div>
  );
}
