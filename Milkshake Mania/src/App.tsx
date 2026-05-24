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
  Download,
  Upload,
  Layers,
  Smile,
  ZapOff,
  Info,
  Music,
  Snowflake,
  Sun,
  HelpCircle,
  Lock,
  AlertTriangle,
  Wrench,
  Star,
} from "lucide-react";
import { GameState, FlavorType, Shop, Country } from "./types";
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
import { formatLargeNumber } from "./utils/format";
import { encodeSaveCode, decodeSaveCode } from "./utils/saveCode";
import UpgradeCard from "./components/UpgradeCard";
import StatBox from "./components/StatBox";
import MusicPlayer from "./components/MusicPlayer";
import { useSavedGameState } from "./hooks/useSavedGameState";
import {
  calcGlobalMultiplier,
  calcIncomePerSecond,
  calcManualBlendGain,
  rollSpecialOutcomes,
} from "./game/logic";
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORY_LABELS } from "./achievements";

import { Analytics } from "@vercel/analytics/react";

const SAVE_KEY = "milkshake-tycoon-v1";
const APP_VERSION = pkg.version;

const DARK_MODE_DEFAULT_BG_INDEX = Math.max(
  0,
  BACKGROUNDS.findIndex(
    (bg) => String(bg.name).toLowerCase() === "rainforest cafe",
  ),
);
const LIGHT_MODE_DEFAULT_BG_INDEX = Math.max(
  0,
  BACKGROUNDS.findIndex((bg) => String(bg.name).toLowerCase() === "lounge"),
);

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

export default function App() {
  // --- Game State ---
  const [showModal, setShowModal] = useState<{
    title: string;
    msg: string;
    onConfirm: () => void;
    type: "danger" | "info";
  } | null>(null);

  const { state, setState, clearSave } = useSavedGameState(SAVE_KEY);
  const isLightMode = state.options.colorMode === "light";

  useEffect(() => {
    document.documentElement.classList.toggle("light-mode", isLightMode);
    document.documentElement.classList.toggle("dark-mode", !isLightMode);
  }, [isLightMode]);

  const [notifications, setNotifications] = useState<
    {
      id: number;
      text: string;
      type:
        | "normal"
        | "fanFavorite"
        | "creamy"
        | "crusty"
        | "baked"
        | "golden"
        | "swirled"
        | "decorated"
        | "achievement";
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
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

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
  const requestRef = useRef<number>(null);
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
      | "achievement" = "normal",
    durationMs?: number,
  ) => {
    const id = Date.now();
    setNotifications((prev: any) => [{ id, text, type }, ...prev].slice(0, 6));
    const duration = durationMs ?? (type === "achievement" ? 5000 : 3000);
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

  const monthlyOperatingCost = state.shops.reduce(
    (acc, shop) => acc + (shop.count || 0) * (shop.monthlyCost || 0),
    0,
  );

  const daysUntilPayroll = 30 - ((state.gameDays - 1) % 30);

  const produceMilkshake = useCallback(
    (isManual = false) => {
      const globalMult = getGlobalMultiplier();
      const wageMult =
        state.options.wageLevel === "high"
          ? 2
          : state.options.wageLevel === "low"
            ? 0.7
            : 1;
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
        goldenBase: Math.min(0.95, CHANCES.goldenBase * wageMult),
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
        ) * getBuffMultiplier(),
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

        return {
          ...prev,
          money: prev.money + gain,
          totalStats: newTotalStats,
        };
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
    [state.shops, state.upgrades, getGlobalMultiplier, getBuffMultiplier],
  );

  // --- Manual Shake Handle ---
  const handleManualShake = () => {
    if (isBlending) return;
    setIsBlending(true);
    setProgress(0);
    setBlendMode("manual");
  };

  useEffect(() => {
    if (!isBlending) {
      return;
    }

    // Calculate blend time: starts at 10s, reduced by 0.5s per mixSpeed upgrade, min 0.5s
    const blendTime = Math.max(
      0.5,
      INITIAL_BLEND_TIME - state.upgrades.mixSpeed * 0.2,
    );
    const durationMs = blendTime * 1000; // Convert to milliseconds
    const start = performance.now();

    const updateProgress = () => {
      const now = performance.now();
      const elapsed = now - start;
      const newProgress = Math.min(100, (elapsed / durationMs) * 100);

      setProgress(newProgress);

      if (newProgress < 100) {
        blendFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        // Force set to 100 for final frame
        setProgress(100);
        if (blendMode === "manual") {
          produceMilkshake(true);
        } else if (blendMode === "autoMix") {
          produceMilkshake(false);
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
  }, [isBlending, state.upgrades.mixSpeed, produceMilkshake, blendMode]);

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

    setState((prev: GameState) => ({
      ...prev,
      money: prev.money - cost,
      shops: prev.shops.map((s: Shop) =>
        s.id === id
          ? { ...s, count: s.count + 1, cost: Math.floor(s.cost * 1.15) }
          : s,
      ),
    }));
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
      return {
        ...prev,
        money: prev.money - totalCost,
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
    });
  };

  const unlockFlavor = (type: FlavorType) => {
    const flavor = FLAVORS[type];
    if (state.unlockedFlavors.includes(type) || state.money < flavor.unlockCost)
      return;

    setState((prev: GameState) => ({
      ...prev,
      money: prev.money - flavor.unlockCost,
      unlockedFlavors: [...prev.unlockedFlavors, type],
    }));
  };

  const buyCountry = (id: string) => {
    const country = COUNTRIES.find((c: Country) => c.id === id);
    const negotiation = state.upgrades.expansionNegotiation || 0;
    const discount = 1 - Math.min(0.3, negotiation * 0.03);
    const cost = country ? Math.floor(country.cost * discount) : 0;
    if (!country || state.unlockedCountries.includes(id) || state.money < cost)
      return;

    setState((prev: GameState) => ({
      ...prev,
      money: prev.money - cost,
      unlockedCountries: [...prev.unlockedCountries, id],
    }));
  };

  const buyUpgrade = (key: keyof GameState["upgrades"], cost: number) => {
    const def = UPGRADE_REGISTRY[key];
    const level = state.upgrades[key] || 0;
    if (level >= def.maxLevel || state.money < cost) return;

    setState((prev: GameState) => ({
      ...prev,
      money: prev.money - cost,
      upgrades: { ...prev.upgrades, [key]: (prev.upgrades[key] || 0) + 1 },
    }));
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
        if (!isBlending) {
          setIsBlending(true);
          setProgress(0);
          setBlendMode("autoMix");
        }
      }, intervalMs);
    }
    return () => clearInterval(interval);
  }, [isBlending, state.options.autoMix, state.upgrades.autoMixerTuning]);

  // Persistence handled by useSavedGameState

  // --- Game Loop ---
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const dt = previousTimeRef.current
        ? (now - previousTimeRef.current!) / 1000
        : 0;
      previousTimeRef.current = now;

      // Auto income (scaled by delta time)
      const income = getIncomePerSecond() * getBuffMultiplier() * dt;
      earningsBuffer.current += income;
      cycleEarningsRef.current += income;
      setState((prev: GameState) => ({ ...prev, money: prev.money + income }));

      // Game clock and payroll
      dayTimeRef.current += dt;
      if (dayTimeRef.current >= 1) {
        const daysToAdvance = Math.floor(dayTimeRef.current);
        dayTimeRef.current -= daysToAdvance;

        setState((prev: GameState) => {
          const oldDay = prev.gameDays;
          const newDay = prev.gameDays + daysToAdvance;
          let nextMoney = prev.money;

          for (let day = oldDay + 1; day <= newDay; day += 1) {
            if (day % 30 === 0) {
              const payroll = prev.shops.reduce(
                (sum, shop) =>
                  sum + (shop.count || 0) * (shop.monthlyCost || 0),
                0,
              );
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

          return { ...prev, gameDays: newDay, money: nextMoney };
        });
      }

      // Manual blending animation removed from auto-loop
      // progress is now only handled by handleManualShake clicks

      requestRef.current = requestAnimationFrame(tick);
    };

    previousTimeRef.current = Date.now();
    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [
    getIncomePerSecond,
    getBuffMultiplier,
    isBlending,
    produceMilkshake,
    state.upgrades.mixSpeed,
  ]);

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

    setState((prev: GameState) => {
      let newMoney = prev.money;
      const newBuffs = [...prev.activeBuffs];
      const newEarned = [...prev.earnedAchievements];

      newlyEarned.forEach((ach) => {
        if (newEarned.includes(ach.id)) return;
        newEarned.push(ach.id);
        if (ach.reward?.type === "money") {
          newMoney += ach.reward.amount;
        } else if (ach.reward?.type === "buff") {
          newBuffs.push({
            id: `${ach.id}_buff_${Date.now()}`,
            multiplier: ach.reward.multiplier,
            expiresAt: Date.now() + ach.reward.duration * 1000,
          });
        }
      });

      return {
        ...prev,
        money: newMoney,
        earnedAchievements: newEarned,
        activeBuffs: newBuffs,
      };
    });

    newlyEarned.forEach((ach, i) => {
      const notifId = Date.now() + i;
      const text = `${ach.name}${ach.reward ? ` · ${ach.reward.label}` : ""}`;
      setNotifications((prev: any) =>
        [{ id: notifId, text, type: "achievement" }, ...prev].slice(0, 6),
      );
      setTimeout(() => {
        setNotifications((prev: any) =>
          prev.filter((n: any) => n.id !== notifId),
        );
      }, 5000);
    });
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
    // totalEmployees and totalShopExtensions derived inside effect
    state.shops,
  ]);

  // --- Buff Cleanup ---
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev: GameState) => {
        const now = Date.now();
        const filtered = prev.activeBuffs.filter((b) => b.expiresAt > now);
        if (filtered.length === prev.activeBuffs.length) return prev;
        return { ...prev, activeBuffs: filtered };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
        { id: `strike_${now}`, multiplier: 0.5, expiresAt: now + 3000 },
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

    setState((prev) => ({
      ...prev,
      eventStats: {
        ...prev.eventStats,
        totalAutoEvents: prev.eventStats.totalAutoEvents + 1,
      },
    }));
    setActiveEvent(evt);

    const msUntilExpiry = evt.duration * 1000;
    const timer = window.setTimeout(() => {
      setActiveEvent(null);
      fanFavBonusRef.current = 0;
    }, msUntilExpiry);

    return () => clearTimeout(timer);
  }, [state.gameDays, activeEvent, pendingChoiceEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Interactive event resolution ---
  const resolveChoiceEvent = (choice: "A" | "B") => {
    if (!pendingChoiceEvent) return;
    const now = Date.now();
    const EVT_DURATION = 7000;

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
        } else {
          setState((prev) => ({
            ...prev,
            activeBuffs: [
              ...prev.activeBuffs,
              {
                id: `inspector_fail_${now}`,
                multiplier: 0.7,
                expiresAt: now + 5000,
              },
            ],
          }));
          addNotification(
            "Failed inspection! -30% income for 5 days.",
            "crusty",
            EVT_DURATION,
          );
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
            },
          ],
        }));
        addNotification(
          "Viral campaign! +150% income for 7 days!",
          "fanFavorite",
          EVT_DURATION,
        );
      } else {
        setState((prev) => ({
          ...prev,
          activeBuffs: [
            ...prev.activeBuffs,
            {
              id: `tiktok_organic_${now}`,
              multiplier: 1.5,
              expiresAt: now + 3000,
            },
          ],
        }));
        addNotification(
          "Natural boost! +50% income for 3 days.",
          "creamy",
          EVT_DURATION,
        );
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
              },
            ],
          }));
          addNotification(
            "Blender broke worse! -20% income for 5 days.",
            "baked",
            EVT_DURATION,
          );
        } else {
          addNotification(
            "Held together for now. Lucky!",
            "normal",
            EVT_DURATION,
          );
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
      } else {
        setState((prev) => ({
          ...prev,
          activeBuffs: [
            ...prev.activeBuffs,
            {
              id: `supply_wait_${now}`,
              multiplier: 0.85,
              expiresAt: now + 3000,
            },
          ],
        }));
        addNotification(
          "Rationing portions. -15% income for 3 days.",
          "crusty",
          EVT_DURATION,
        );
      }
    } else if (pendingChoiceEvent.id === "celebrity_endorsement") {
      if (choice === "A") {
        setState((prev) => ({
          ...prev,
          money: prev.money - pendingChoiceEvent.choiceA.cost,
          activeBuffs: [
            ...prev.activeBuffs,
            { id: `celeb_${now}`, multiplier: 3, expiresAt: now + 10000 },
          ],
        }));
        addNotification(
          "Celebrity deal signed! +200% income for 10 days!",
          "fanFavorite",
          EVT_DURATION,
        );
      } else {
        addNotification(
          "Passed on the endorsement. Saving the cash.",
          "normal",
          EVT_DURATION,
        );
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
      } else {
        setState((prev) => ({
          ...prev,
          activeBuffs: [
            ...prev.activeBuffs,
            { id: `walkout_${now}`, multiplier: 0.75, expiresAt: now + 4000 },
          ],
        }));
        addNotification(
          "Half the crew walked out. -25% income for 4 days.",
          "crusty",
          EVT_DURATION,
        );
      }
    } else if (pendingChoiceEvent.id === "lucky_ingredient") {
      if (choice === "A") {
        setState((prev) => ({
          ...prev,
          money: prev.money - pendingChoiceEvent.choiceA.cost,
          activeBuffs: [
            ...prev.activeBuffs,
            { id: `lucky_${now}`, multiplier: 2, expiresAt: now + 5000 },
          ],
        }));
        addNotification(
          "Mystery ingredient is a hit! +100% income for 5 days!",
          "creamy",
          EVT_DURATION,
        );
      } else {
        addNotification(
          "Left the ingredient on the shelf. Probably fine.",
          "normal",
          EVT_DURATION,
        );
      }
    }

    setPendingChoiceEvent(null);
  };

  // --- Tutorial trigger ---
  useEffect(() => {
    if (!state.options.seenTutorial) {
      setShowTutorial(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  const ownedShops = state.shops.filter((shop) => shop.count > 0).length;
  const totalCountries = state.unlockedCountries.length;

  const floatingShakeConfig = React.useMemo(
    () =>
      Array.from({ length: 10 }).map(() => ({
        startX: Math.random() * 130 - 15,
        endX: Math.random() * 130 - 15,
        startY: 110 + Math.random() * 20,
        endY: -20 - Math.random() * 20,
        duration: 8 + Math.random() * 10,
        delay: Math.random() * 3,
        rotate: Math.random() * 360,
        rotateEnd: 360 + Math.random() * 180,
      })),
    [],
  );

  const blenderFillHeight = isBlending
    ? Math.min(100, 40 + progress * 0.6)
    : 40;

  return (
    <div
      className={`flex h-screen w-full font-sans selection:bg-blue-500/30 ${isLightMode ? "bg-slate-300 text-slate-800" : "bg-neutral-950 text-neutral-100"}`}
    >
      <Analytics />

      {/* Left Pane: The Blender / Visual Area */}
      <div
        className={`flex-1 relative flex flex-col items-center justify-center border-r p-8 overflow-hidden ${isLightMode ? "border-slate-300/20 bg-slate-200" : "border-white/10 bg-black"}`}
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
        <div
          className="absolute inset-0 opacity-50 blur-[130px] pointer-events-none z-10"
          style={{
            background: `conic-gradient(from 0deg, ${state.activeFlavors.length > 0 ? state.activeFlavors.map((t: FlavorType) => FLAVORS[t].color).join(", ") : "#3d2b1f"})`,
          }}
        />

        {/* Background Particles Layer */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * 80 + 10 + "%",
                y: Math.random() * 80 + 10 + "%",
                opacity: 0,
                scale: Math.random() * 0.5 + 0.5,
              }}
              animate={{
                y: ["0%", "-40%", "0%"],
                opacity: [0, 0.3, 0],
                x: [Math.random() * 90 + 5 + "%", Math.random() * 90 + 5 + "%"],
              }}
              transition={{
                duration: 10 + Math.random() * 20,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 5,
              }}
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
                initial={{
                  y: `${cfg.startY}vh`,
                  x: `${cfg.startX}%`,
                  opacity: 0,
                  rotate: cfg.rotate,
                }}
                animate={{
                  y: `${cfg.endY}vh`,
                  x: `${cfg.endX}%`,
                  opacity: [0.2, 0.8, 0.2],
                  rotate: cfg.rotateEnd,
                }}
                transition={{
                  duration: cfg.duration,
                  repeat: Infinity,
                  ease: "linear",
                  delay: cfg.delay,
                }}
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
        <div className="absolute top-12 flex flex-col items-center z-30">
          <div className="text-6xl font-sans font-black tracking-tighter flex items-center gap-3 drop-shadow-[0_0_35px_rgba(59,130,246,0.4)]">
            <Coins className="text-yellow-400 w-12 h-12" />
            <div className="flex tabular-nums font-mono text-white tracking-[0.1em] bg-black/40 px-8 py-3 rounded-2xl border border-white/20 backdrop-blur-xl shadow-[0_0_40px_rgba(255,255,255,0.05)]">
              <span className="text-yellow-400 mr-2 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
                $
              </span>
              {formatLargeNumber(state.money)
                .split("")
                .map((char, i) =>
                  state.options.numberAnimation ? (
                    <motion.span
                      key={`${i}-${char}`}
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                      className="inline-block"
                    >
                      {char}
                    </motion.span>
                  ) : (
                    <span key={`${i}-${char}`} className="inline-block">
                      {char}
                    </span>
                  ),
                )}
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

        <div className="absolute bottom-8 left-8 z-30 w-[32rem] space-y-3">
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
                <div className="font-black uppercase text-yellow-300">
                  Golden
                </div>
                <div className="mt-1 font-bold text-white">
                  {formatLargeNumber(state.totalStats.totalGolden)}
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
                <div className="font-black uppercase text-pink-300">
                  Flavors
                </div>
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
              <div className="flex justify-between">
                <span>Income /s</span>
                <span className="font-bold text-white">
                  +${formatLargeNumber(displayedIncome || getIncomePerSecond())}
                  /s
                </span>
              </div>
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
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${wageColor}`}>
                      {state.options.wageLevel === "high"
                        ? "High wages — 2× special chances"
                        : "Low wages — 0.7× special chances"}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-[0.2em] text-neutral-400 text-justify">
                    <span className="text-cyan-300">
                      {(CHANCES.fanFavoriteBase * wm * 100).toFixed(1)}% Fan Favorite
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
                      {(CHANCES.decoratedBase * wm * 100).toFixed(1)}% Decorated
                    </span>
                    <span className="text-yellow-400">
                      {(
                        (CHANCES.goldenBase * wm +
                          state.upgrades.recipeDevelopment * 0.0001) *
                        100
                      ).toFixed(2)}
                      % Gold
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center justify-center relative">
          {/* Auto-Mixer Toggle Overlay */}
          <div className="absolute top-4 left-4 z-40 flex flex-col gap-2 scale-100 origin-top-left pointer-events-auto">
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
            {state.activeBuffs.some((b) => b.expiresAt > Date.now()) && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/20 border-2 border-amber-400/60 text-amber-200">
                <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                <div className="text-left">
                  <p className="text-xs font-black uppercase leading-none">
                    Income Buff
                  </p>
                  <p className="text-xs font-bold opacity-80">
                    ×
                    {state.activeBuffs
                      .filter((b) => b.expiresAt > Date.now())
                      .reduce((acc, b) => acc * b.multiplier, 1)
                      .toFixed(1)}{" "}
                    active
                  </p>
                </div>
              </div>
            )}
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

          {/* The Blender */}
          <motion.div
            onMouseDown={handleManualShake}
            className={`relative w-64 h-80 cursor-pointer group z-30 ${isBlending && state.options.screenShake ? "animate-shake" : ""}`}
          >
            {/* Mini Blender Fleet for Employees */}
            <div className="absolute -left-32 top-1/2 -translate-y-1/2 flex flex-wrap gap-3 w-24 pointer-events-none opacity-60">
              {state.shops.slice(1).map(
                (shop, si) =>
                  shop.count > 0 &&
                  Array.from({ length: Math.min(shop.count, 2) }).map(
                    (_, i) => (
                      <motion.div
                        key={`${si}-${i}`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          y: [0, -6, 0],
                          rotate: [-3, 3, -3],
                        }}
                        transition={{
                          duration: 1.2 + Math.random(),
                          repeat: Infinity,
                          delay: si * 0.2 + i * 0.1,
                        }}
                        className="w-10 h-14 bg-white/10 border border-white/20 rounded-lg flex flex-col justify-end overflow-hidden backdrop-blur-md shadow-lg"
                      >
                        <div
                          className="w-full transition-all duration-1000"
                          style={{
                            height: "60%",
                            backgroundColor:
                              FLAVORS[state.activeFlavors[0]]?.color ||
                              "#3d2b1f",
                            opacity: 0.8,
                          }}
                        />
                        <div className="absolute top-0 w-full h-full bg-linear-to-b from-white/10 to-transparent pointer-none" />
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-4 h-1 bg-white/30 rounded-full" />
                      </motion.div>
                    ),
                  ),
              )}
            </div>

            {/* Jar Glow */}
            {state.options.highQuality && (
              <div
                className="absolute -inset-8 blur-3xl opacity-30 pointer-events-none rounded-full transition-colors duration-500"
                style={{
                  background: FLAVORS[state.activeFlavors[0]]?.color || "#fff",
                }}
              />
            )}

            {/* Glass Jar */}
            <div className="absolute inset-0 border-4 border-white/30 rounded-b-3xl rounded-t-lg bg-white/5 backdrop-blur-xl overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.1)]">
              {/* Liquid Fill */}
              <motion.div
                className="absolute bottom-0 w-full overflow-hidden"
                initial={{ height: "40%" }}
                animate={{ height: `${blenderFillHeight}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 20 }}
              >
                <div
                  className="absolute bottom-0 w-full"
                  style={{
                    height: "320px",
                    background:
                      state.activeFlavors.length > 1
                        ? `linear-gradient(to top, ${state.activeFlavors.map((t) => FLAVORS[t].color).join(", ")})`
                        : FLAVORS[state.activeFlavors[0]]?.color || "#3d2b1f",
                  }}
                />
                <div className="absolute top-0 w-full h-20 bg-white/40 blur-3xl -translate-y-10" />
                <div className="absolute top-0 w-full h-3 bg-white/60 -translate-y-1.5 shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
              </motion.div>

              {/* Bubbles if blending */}
              {isBlending &&
                Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 300, x: Math.random() * 200 }}
                    animate={{ y: -100, opacity: [0, 1, 0] }}
                    transition={{
                      duration: 0.3,
                      repeat: Infinity,
                      delay: Math.random() * 0.5,
                    }}
                    className="absolute w-1.5 h-1.5 rounded-full bg-white/40"
                  />
                ))}
            </div>

            {/* Floating Money Gains */}
            <AnimatePresence>
              {floatingGains.map((gain) => (
                <motion.div
                  key={gain.id}
                  initial={{ opacity: 1, y: 0, scale: 0.5 }}
                  animate={{ opacity: 0, y: -150, scale: 1.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute left-1/2 -translate-x-1/2 z-50 text-3xl font-black font-sans text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.6)] pointer-events-none"
                >
                  +${gain.amount}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Lid */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-neutral-800 rounded-lg shadow-xl" />

            {/* Base */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-72 h-16 bg-neutral-800 border-t border-white/10 flex items-center justify-center">
              <Zap
                className={`w-8 h-8 transition-colors ${isBlending ? "text-yellow-400" : "text-neutral-600"}`}
              />
            </div>

            <div className="absolute -bottom-24 w-full text-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm font-mono text-neutral-400 bg-black/50 px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">
                Click to Blend
              </span>
            </div>
          </motion.div>
        </div>

        {/* Floating Notifications */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-none z-50">
          <AnimatePresence mode="popLayout">
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ x: 50, opacity: 0, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -20, opacity: 0, scale: 0.5 }}
                className={`px-4 py-3 rounded-xl border text-lg font-bold shadow-2xl ${
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
                                  ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-amber-500/20 text-base"
                                  : "bg-white/10 border-white/20 text-white"
                }`}
              >
                {n.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Music Player */}
        <div className="absolute bottom-8 right-8 z-30 w-64">
          <MusicPlayer />
        </div>
      </div>
      {/* Right Pane: Management Sidebar */}
      <div
        className={`w-[500px] flex flex-col border-l shrink-0 z-50 ${
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
            {(["employees", "shops", "upgrades"] as const).map((tab) => (
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
                {tab === "employees" && <Users className="w-4 h-4" />}
                {tab === "shops" && <Store className="w-4 h-4" />}
                {tab === "upgrades" && <Zap className="w-4 h-4" />}
                {tab}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-12 gap-2">
            {(["flavors", "countries", "achievements"] as const).map((tab) => (
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
                {tab === "flavors" && <Palette className="w-4 h-4" />}
                {tab === "countries" && <Globe className="w-4 h-4" />}
                {tab === "achievements" && <Trophy className="w-4 h-4" />}
                {tab}
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
          {activeTab === "employees" && (
            <div className="space-y-3">
              {/* Wage Level Selector */}
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
                    <div className="opacity-70 mt-0.5">3% daily strike risk</div>
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* --- SHOPS TAB --- */}
          {activeTab === "shops" && (
            <div className="space-y-3">
              <div className="px-1 pb-2 border-b border-white/5">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                  Shop Extensions
                </h3>
              </div>
              {visibleShopExtensions.map((shop) => {
                const cost = getShopCost(shop);
                return (
                  <div
                    key={shop.id}
                    className={`glass-panel p-4 flex items-center justify-between transition-all ${state.money < cost ? "opacity-50 grayscale" : "hover:bg-white/5 cursor-pointer active:scale-95"}`}
                    onClick={() => buyShop(shop.id)}
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
                        ${formatLargeNumber(cost)}
                      </div>
                      <div className="text-xs text-green-400 font-mono text-center">
                        +${formatLargeNumber(shop.baseIncome)}/s
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* --- UPGRADES TAB --- */}
          {activeTab === "upgrades" && (
            <div className="space-y-4">
              {(
                Object.keys(UPGRADE_REGISTRY) as (keyof GameState["upgrades"])[]
              )
                .sort((a, b) => {
                  const costA = UPGRADE_REGISTRY[a].baseCost;
                  const costB = UPGRADE_REGISTRY[b].baseCost;
                  if (costA !== costB) {
                    return costA - costB;
                  }
                  return a.localeCompare(b);
                })
                .map((key) => {
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
                        return { icon: <Zap />, iconColor: "text-blue-500" };
                      case "heatControl":
                        return { icon: <Flame />, iconColor: "text-red-500" };
                      case "recipeDevelopment":
                        return {
                          icon: <Trophy />,
                          iconColor: "text-yellow-400",
                        };
                      case "customBlending":
                        return {
                          icon: <Palette />,
                          iconColor: "text-pink-400",
                        };
                      case "bulkPurchasing":
                        return { icon: <Layers />, iconColor: "text-cyan-400" };
                      case "distributionNetwork":
                        return {
                          icon: <Rocket />,
                          iconColor: "text-orange-400",
                        };
                      case "portionSize":
                        return { icon: <Milk />, iconColor: "text-white" };
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
                        return { icon: <Store />, iconColor: "text-amber-300" };
                      case "expansionNegotiation":
                        return {
                          icon: <MapPin />,
                          iconColor: "text-green-300",
                        };
                      case "autoMixerTuning":
                        return { icon: <Zap />, iconColor: "text-sky-300" };
                      case "flavorSlots":
                        return { icon: <Layers />, iconColor: "text-teal-400" };
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
                    />
                  );
                })}
            </div>
          )}

          {/* --- FLAVORS TAB --- */}
          {activeTab === "flavors" && (
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
                            ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent shadow-lg shadow-pink-500/20"
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
          )}

          {/* --- COUNTRIES TAB --- */}
          {activeTab === "countries" &&
            COUNTRIES.map((country, index) => {
              const isUnlocked = state.unlockedCountries.includes(country.id);
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
                    <button
                      onClick={() => buyCountry(country.id)}
                      disabled={state.money < cost}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-yellow-500 font-bold text-xs flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-3 h-3" />
                      Expand: ${formatLargeNumber(cost)}
                    </button>
                  ) : (
                    <div className="text-[10px] uppercase tracking-widest font-black text-green-500 text-center">
                      Active: x{country.multiplier} Empire Bonus
                    </div>
                  )}
                </div>
              );
            })}

          {/* --- ACHIEVEMENTS TAB --- */}
          {activeTab === "achievements" &&
            (() => {
              const employees = getEmployeeCount();
              const shopExts = totalShopExtensions;
              const upgradeSum = Object.values(state.upgrades).reduce(
                (a, b) => a + b,
                0,
              );

              const getAchievementProgress = (
                ach: (typeof ACHIEVEMENTS)[number],
              ): { current: number; target: number } | null => {
                const e = employees;
                const s = shopExts;
                switch (ach.id) {
                  case "first_shake":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 1,
                    };
                  case "shakes_10":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 10,
                    };
                  case "shakes_50":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 50,
                    };
                  case "shakes_100":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 100,
                    };
                  case "shakes_500":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 500,
                    };
                  case "shakes_1000":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 1_000,
                    };
                  case "shakes_5000":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 5_000,
                    };
                  case "shakes_10000":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 10_000,
                    };
                  case "shakes_20000":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 20_000,
                    };
                  case "shakes_50000":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 50_000,
                    };
                  case "shakes_100000":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 100_000,
                    };
                  case "shakes_500000":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 500_000,
                    };
                  case "shakes_1000000":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 1_000_000,
                    };
                  case "money_100":
                    return { current: state.money, target: 100 };
                  case "money_1000":
                    return { current: state.money, target: 1_000 };
                  case "money_10000":
                    return { current: state.money, target: 10_000 };
                  case "money_100000":
                    return { current: state.money, target: 100_000 };
                  case "money_1m":
                    return { current: state.money, target: 1_000_000 };
                  case "money_1b":
                    return { current: state.money, target: 1_000_000_000 };
                  case "money_1t":
                    return { current: state.money, target: 1_000_000_000_000 };
                  case "money_1q":
                    return {
                      current: state.money,
                      target: 1_000_000_000_000_000,
                    };
                  case "money_1qt":
                    return { current: state.money, target: 1e18 };
                  case "first_employee":
                    return { current: e, target: 1 };
                  case "employees_5":
                    return { current: e, target: 5 };
                  case "employees_10":
                    return { current: e, target: 10 };
                  case "employees_25":
                    return { current: e, target: 25 };
                  case "employees_50":
                    return { current: e, target: 50 };
                  case "employees_100":
                    return { current: e, target: 100 };
                  case "employees_200":
                    return { current: e, target: 200 };
                  case "first_shop":
                    return { current: s, target: 1 };
                  case "shops_5":
                    return { current: s, target: 5 };
                  case "shops_10":
                    return { current: s, target: 10 };
                  case "shops_25":
                    return { current: s, target: 25 };
                  case "shops_50":
                    return { current: s, target: 50 };
                  case "shops_100":
                    return { current: s, target: 100 };
                  case "flavor_2":
                    return { current: state.unlockedFlavors.length, target: 2 };
                  case "flavors_5":
                    return { current: state.unlockedFlavors.length, target: 5 };
                  case "flavors_10":
                    return {
                      current: state.unlockedFlavors.length,
                      target: 10,
                    };
                  case "flavors_15":
                    return {
                      current: state.unlockedFlavors.length,
                      target: 15,
                    };
                  case "flavors_20":
                    return {
                      current: state.unlockedFlavors.length,
                      target: 20,
                    };
                  case "all_flavors":
                    return {
                      current: state.unlockedFlavors.length,
                      target: 25,
                    };
                  case "first_country":
                    return {
                      current: state.unlockedCountries.length,
                      target: 1,
                    };
                  case "countries_3":
                    return {
                      current: state.unlockedCountries.length,
                      target: 3,
                    };
                  case "countries_5":
                    return {
                      current: state.unlockedCountries.length,
                      target: 5,
                    };
                  case "countries_10":
                    return {
                      current: state.unlockedCountries.length,
                      target: 10,
                    };
                  case "first_golden":
                    return { current: state.totalStats.totalGolden, target: 1 };
                  case "golden_10":
                    return {
                      current: state.totalStats.totalGolden,
                      target: 10,
                    };
                  case "golden_100":
                    return {
                      current: state.totalStats.totalGolden,
                      target: 100,
                    };
                  case "first_decorated":
                    return {
                      current: state.totalStats.totalDecorated,
                      target: 1,
                    };
                  case "decorated_50":
                    return {
                      current: state.totalStats.totalDecorated,
                      target: 50,
                    };
                  case "first_swirled":
                    return {
                      current: state.totalStats.totalSwirled,
                      target: 1,
                    };
                  case "swirled_25":
                    return {
                      current: state.totalStats.totalSwirled,
                      target: 25,
                    };
                  case "fan_100":
                    return {
                      current: state.totalStats.totalFanFavorite,
                      target: 100,
                    };
                  case "fan_1000":
                    return {
                      current: state.totalStats.totalFanFavorite,
                      target: 1_000,
                    };
                  case "creamy_100":
                    return {
                      current: state.totalStats.totalCreamy,
                      target: 100,
                    };
                  case "first_upgrade":
                    return {
                      current: Object.values(state.upgrades).filter(
                        (v) => v > 0,
                      ).length,
                      target: 1,
                    };
                  case "upgrades_10_total":
                    return { current: upgradeSum, target: 10 };
                  case "upgrades_50_total":
                    return { current: upgradeSum, target: 50 };
                  case "mix_speed_5":
                    return { current: state.upgrades.mixSpeed, target: 5 };
                  case "marketing_5":
                    return {
                      current: state.upgrades.marketingCampaign,
                      target: 5,
                    };
                  case "all_upgrades_1":
                    return {
                      current: Object.values(state.upgrades).filter(
                        (v) => v >= 1,
                      ).length,
                      target: Object.keys(state.upgrades).length,
                    };
                  case "days_7":
                    return { current: state.gameDays, target: 7 };
                  case "days_30":
                    return { current: state.gameDays, target: 30 };
                  case "days_100":
                    return { current: state.gameDays, target: 100 };
                  case "days_365":
                    return { current: state.gameDays, target: 365 };
                  case "days_1000":
                    return { current: state.gameDays, target: 1_000 };
                  case "all_countries":
                    return {
                      current: state.unlockedCountries.length,
                      target: 21,
                    };
                  case "hot_streak":
                    return {
                      current: state.totalStats.totalBaked,
                      target: 500,
                    };
                  case "penny_saved":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 500,
                    };
                  case "shakes_250000":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 250_000,
                    };
                  case "shakes_2000000":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 2_000_000,
                    };
                  case "shakes_5000000":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 5_000_000,
                    };
                  case "shakes_10000000":
                    return {
                      current: state.totalStats.totalMilkshakes,
                      target: 10_000_000,
                    };
                  case "money_500":
                    return { current: state.money, target: 500 };
                  case "money_5000":
                    return { current: state.money, target: 5_000 };
                  case "money_50000":
                    return { current: state.money, target: 50_000 };
                  case "money_500k":
                    return { current: state.money, target: 500_000 };
                  case "money_10m":
                    return { current: state.money, target: 10_000_000 };
                  case "money_100m":
                    return { current: state.money, target: 100_000_000 };
                  case "money_10b":
                    return { current: state.money, target: 10_000_000_000 };
                  case "employees_500":
                    return { current: e, target: 500 };
                  case "employees_1000":
                    return { current: e, target: 1_000 };
                  case "employees_2000":
                    return { current: e, target: 2_000 };
                  case "shops_200":
                    return { current: s, target: 200 };
                  case "shops_500":
                    return { current: s, target: 500 };
                  case "countries_15":
                    return {
                      current: state.unlockedCountries.length,
                      target: 15,
                    };
                  case "golden_500":
                    return {
                      current: state.totalStats.totalGolden,
                      target: 500,
                    };
                  case "golden_1000":
                    return {
                      current: state.totalStats.totalGolden,
                      target: 1_000,
                    };
                  case "decorated_200":
                    return {
                      current: state.totalStats.totalDecorated,
                      target: 200,
                    };
                  case "swirled_100":
                    return {
                      current: state.totalStats.totalSwirled,
                      target: 100,
                    };
                  case "swirled_250":
                    return {
                      current: state.totalStats.totalSwirled,
                      target: 250,
                    };
                  case "fan_5000":
                    return {
                      current: state.totalStats.totalFanFavorite,
                      target: 5_000,
                    };
                  case "creamy_500":
                    return {
                      current: state.totalStats.totalCreamy,
                      target: 500,
                    };
                  case "baked_100":
                    return {
                      current: state.totalStats.totalBaked,
                      target: 100,
                    };
                  case "baked_250":
                    return {
                      current: state.totalStats.totalBaked,
                      target: 250,
                    };
                  case "upgrades_100_total":
                    return { current: upgradeSum, target: 100 };
                  case "upgrades_200_total":
                    return { current: upgradeSum, target: 200 };
                  case "all_upgrades_5":
                    return {
                      current: Object.values(state.upgrades).filter(
                        (v) => v >= 5,
                      ).length,
                      target: Object.keys(state.upgrades).length,
                    };
                  case "days_2000":
                    return { current: state.gameDays, target: 2_000 };
                  case "days_5000":
                    return { current: state.gameDays, target: 5_000 };
                  default:
                    return null;
                }
              };

              const earnedAchs = ACHIEVEMENTS.filter((a) =>
                state.earnedAchievements.includes(a.id),
              );

              return (
                <div className="space-y-4">
                  <div className="px-1 pb-2 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                      Achievements
                    </h3>
                    <span className="text-xs font-bold text-amber-400">
                      {state.earnedAchievements.length}/{ACHIEVEMENTS.length}
                    </span>
                  </div>

                  {earnedAchs.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-[0.15em] text-amber-400 px-1">
                        Unlocked
                      </h4>
                      <div
                        className="grid gap-1.5"
                        style={{
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(110px, 1fr))",
                        }}
                      >
                        {earnedAchs.map((ach) => {
                          const chipStyle: Record<string, string> = {
                            shakes:
                              "bg-cyan-500/15 border-cyan-500/35 text-cyan-300",
                            money:
                              "bg-yellow-500/15 border-yellow-500/35 text-yellow-300",
                            employees:
                              "bg-green-500/15 border-green-500/35 text-green-300",
                            shops:
                              "bg-purple-500/15 border-purple-500/35 text-purple-300",
                            flavors:
                              "bg-pink-500/15 border-pink-500/35 text-pink-300",
                            countries:
                              "bg-emerald-500/15 border-emerald-500/35 text-emerald-300",
                            specials:
                              "bg-amber-500/15 border-amber-500/35 text-amber-300",
                            upgrades:
                              "bg-sky-500/15 border-sky-500/35 text-sky-300",
                            time: "bg-violet-500/15 border-violet-500/35 text-violet-300",
                            misc: "bg-rose-500/15 border-rose-500/35 text-rose-300",
                            combos:
                              "bg-teal-500/15 border-teal-500/35 text-teal-300",
                          };
                          const style =
                            chipStyle[ach.category] ??
                            "bg-white/10 border-white/20 text-neutral-300";
                          return (
                            <div
                              key={ach.id}
                              className={`flex items-center gap-1.5 px-2 py-1.5 border rounded-lg w-full ${style}`}
                            >
                              <ach.icon className="w-3.5 h-3.5 shrink-0 opacity-90" />
                              <span className="text-xs font-bold truncate">
                                {ach.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(
                    Object.keys(ACHIEVEMENT_CATEGORY_LABELS) as Array<
                      keyof typeof ACHIEVEMENT_CATEGORY_LABELS
                    >
                  ).map((cat) => {
                    const catAchs = ACHIEVEMENTS.filter(
                      (a) => a.category === cat,
                    );
                    const earnedCount = catAchs.filter((a) =>
                      state.earnedAchievements.includes(a.id),
                    ).length;
                    const isCatCollapsed = collapsedAchCats.has(cat);
                    return (
                      <div key={cat} className="space-y-2">
                        <button
                          onClick={() =>
                            setCollapsedAchCats((prev) => {
                              const next = new Set(prev);
                              if (next.has(cat)) next.delete(cat);
                              else next.add(cat);
                              return next;
                            })
                          }
                          className="w-full flex items-center justify-between px-1 py-0.5 hover:bg-white/5 rounded transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            {isCatCollapsed ? (
                              <ChevronRight className="w-3 h-3 text-neutral-500" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-neutral-500" />
                            )}
                            <h4 className="text-xs font-black uppercase tracking-[0.15em] text-neutral-400">
                              {ACHIEVEMENT_CATEGORY_LABELS[cat]}
                            </h4>
                          </div>
                          <span className="text-xs text-neutral-500">
                            {earnedCount}/{catAchs.length}
                          </span>
                        </button>
                        {!isCatCollapsed &&
                          catAchs.map((ach) => {
                            const earned = state.earnedAchievements.includes(
                              ach.id,
                            );
                            const progress = !earned
                              ? getAchievementProgress(ach)
                              : null;
                            return (
                              <div
                                key={ach.id}
                                className={`glass-panel p-3 flex items-start gap-3 transition-all ${
                                  earned
                                    ? "border border-amber-500/30 bg-amber-500/5"
                                    : "opacity-60"
                                }`}
                              >
                                <div className="mt-0.5 shrink-0">
                                  {earned ? (
                                    <ach.icon className="w-5 h-5 text-amber-400" />
                                  ) : (
                                    <Lock className="w-5 h-5 text-neutral-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p
                                      className={`text-sm font-bold truncate ${earned ? "text-amber-200" : "text-neutral-400"}`}
                                    >
                                      {ach.name}
                                    </p>
                                    {earned && (
                                      <span className="text-xs text-amber-400 shrink-0">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-neutral-500 leading-snug mt-0.5">
                                    {ach.description}
                                  </p>
                                  {progress && (
                                    <p className="text-xs font-mono text-neutral-500 mt-0.5">
                                      {formatLargeNumber(
                                        Math.min(
                                          progress.current,
                                          progress.target,
                                        ),
                                      )}{" "}
                                      / {formatLargeNumber(progress.target)}
                                    </p>
                                  )}
                                  {ach.reward && (
                                    <p
                                      className={`text-xs font-bold mt-1 ${earned ? "text-green-400" : "text-neutral-500"}`}
                                    >
                                      Reward: {ach.reward.label}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

          {/* --- ABOUT TAB --- */}
          {activeTab === "about" && (
            <div className="space-y-4">
              <div className="glass-panel p-4 space-y-3">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-300 text-justify">
                  About
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed text-justify">
                  <span className="text-pink-400 font-bold">
                    Milkshake Mania
                  </span>{" "}
                  is an{" "}
                  <span className="text-orange-400">
                    incremental, clicker-like
                  </span>{" "}
                  game built with{" "}
                  <span className="text-cyan-300">React + Vite</span>. It
                  features{" "}
                  <span className="text-orange-400">manual blending</span>,{" "}
                  <span className="text-lime-400">passive income</span> from{" "}
                  <span className="text-cyan-400">employees</span>, and a
                  variety of <span className="text-orange-400">upgrades</span>{" "}
                  and <span className="text-orange-400">special outcomes</span>.
                  This experience allows you to create your own{" "}
                  <span className="text-lime-400 font-medium">
                    milkshake empire
                  </span>
                  , starting from a small shop and building your{" "}
                  <span className="text-lime-400 font-medium">empire</span>{" "}
                  through blends, staff, and expansion.
                </p>
                <p className="text-xs text-lime-300">Version: {APP_VERSION}</p>
              </div>

              <div className="glass-panel p-4 space-y-3">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-400">
                  Credits
                </h3>
                <div className="text-xs text-neutral-300 leading-relaxed text-justify">
                  <p className="text-indigo-400">
                    UI design, original music, and game logic brought together
                    by the{" "}
                    <strong className="text-indigo-300 font-bold">
                      Strider657's Milkshake Mania
                    </strong>{" "}
                    team.
                  </p>

                  <hr className="my-3 border-neutral-700" />

                  <div className="text-center space-y-1">
                    <strong className="block text-cyan-400">
                      Lead Developer, Solo Composer & First Playtester
                    </strong>
                    <div className="text-cyan-200 font-medium">Strider657</div>
                  </div>

                  <hr className="my-3 border-neutral-700" />

                  <div className="text-center space-y-1">
                    <strong className="block text-amber-400">
                      Lead Concept Designer & Second Playtester
                    </strong>
                    <div className="text-amber-200 font-medium">Oliver382</div>
                  </div>

                  <hr className="my-3 border-neutral-700" />

                  <div className="space-y-2">
                    <strong className="block text-center text-lime-400">
                      The Alpha (and release) Playtesters
                    </strong>
                    <div className="text-justify text-neutral-300 bg-neutral-900/30 p-2 rounded border border-neutral-800/50 space-y-1">
                      <div>
                        •{" "}
                        <span className="text-blue-300 font-medium">
                          Strider657
                        </span>
                        : First ever playtester and lead game developer.
                      </div>
                      <div>
                        •{" "}
                        <span className="text-blue-300 font-medium">
                          Oliver382
                        </span>
                        : Second ever playtester and lead concept designer.
                      </div>
                      <div>
                        •{" "}
                        <span className="text-lime-300 font-medium">
                          Reuben G.
                        </span>
                        : Third ever playtester. Provided highly valuable
                        balancing and GUI feedback.
                      </div>
                      <div>
                        •{" "}
                        <span className="text-lime-300 font-medium">
                          Max L.
                        </span>
                        : Fourth ever playtester. Gave a lot of feedback with
                        gameplay.
                      </div>
                    </div>
                  </div>

                  <hr className="my-3 border-neutral-700" />

                  <div className="text-justify space-y-2 pt-1">
                    <p className="text-lime-400 font-medium">
                      Huge thanks to everyone who contributed to this project!
                    </p>
                    <p>
                      Special shoutout to{" "}
                      <span className="text-amber-400 font-medium">
                        Oliver382
                      </span>{" "}
                      for bringing so many creative ideas and shaping the
                      gameplay and features of{" "}
                      <span className="text-indigo-300 font-bold">
                        Milkshake Mania
                      </span>
                      . This message was written by the creator, himself—more
                      accurately, <em className="text-cyan-400">myself</em>,{" "}
                      <strong className="text-cyan-300 font-bold">
                        Strider657
                      </strong>
                      —and it's been awesome collaborating with him on the
                      game's design and overall vision.
                      <span className="text-amber-400 font-medium">
                        {" "}
                        Oliver382
                      </span>{" "}
                      was important playtesting the early versions and providing
                      game concepts and ideas, including the entire (most) game
                      concept.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-4 space-y-3">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-red-300">
                  Legal (EULA)
                </h3>

                <p className="text-xs text-neutral-300 leading-relaxed text-justify">
                  END USER LICENSE AGREEMENT (EULA)
                  <br />
                  <br />
                  Effective Date: January 1, 2026
                  <br />
                  Copyright © 2026 Strider657. All Rights Reserved.
                  <br />
                  <br />
                  This End User License Agreement ("Agreement") is a legal
                  agreement between you ("User", "you") and Strider657
                  ("Licensor", "we", "our", or "us") governing the use of the
                  software product known as "Milkshake Mania" (the "Software").
                  <br />
                  <br />
                  BY INSTALLING, ACCESSING, COPYING, DOWNLOADING, LAUNCHING, OR
                  USING THE SOFTWARE IN ANY WAY, YOU AGREE TO BE BOUND BY THE
                  TERMS OF THIS AGREEMENT. IF YOU DO NOT AGREE TO THESE TERMS,
                  DO NOT INSTALL OR USE THE SOFTWARE.
                  <br />
                  <br />
                  1. OWNERSHIP
                  <br />
                  <br />
                  The Software and all associated content, including but not
                  limited to source code, compiled binaries, assets, textures,
                  models, animations, music, sound effects, dialogue, visual
                  designs, UI/UX elements, systems, mechanics, scripts,
                  documentation, branding, and related materials are and shall
                  remain the exclusive intellectual property of Strider657 and
                  are protected under applicable copyright, trademark, and
                  intellectual property laws.
                  <br />
                  <br />
                  No ownership rights are transferred to you under this
                  Agreement.
                  <br />
                  <br />
                  1A. MUSIC / AUDIO ASSETS
                  <br />
                  <br />
                  All music, sound recordings, sound effects, and audio files
                  included with the Software (including any files located in an
                  "assets/music" or similar folder) are part of the Software and
                  are protected works. You may not extract, separate, rip,
                  download, re-upload, copy, distribute, publicly perform, or
                  otherwise reuse any audio assets outside the Software, except
                  where you have separately obtained explicit written permission
                  from Strider657 (or where such restriction is prohibited by
                  applicable law).
                  <br />
                  <br />
                  2. LIMITED LICENSE
                  <br />
                  <br />
                  Subject to your compliance with this Agreement, Strider657
                  grants you a limited, revocable, non-exclusive,
                  non-transferable, non-sublicensable license to install and use
                  one copy of the Software solely for personal, non-commercial
                  entertainment purposes.
                  <br />
                  <br />
                  3. RESTRICTIONS
                  <br />
                  <br />
                  You may NOT, without prior written permission from Strider657:
                  <br />
                  - Copy, reproduce, distribute, republish, or redistribute the
                  Software or any component thereof
                  <br />
                  - Modify, adapt, translate, patch, or create derivative works
                  based on the Software
                  <br />
                  - Sell, rent, lease, sublicense, monetize, or commercially
                  exploit the Software
                  <br />
                  - Reverse engineer, decompile, disassemble, or attempt to
                  derive the source code, algorithms, or underlying systems of
                  the Software, except where expressly permitted by applicable
                  law
                  <br />
                  - Remove, alter, or obscure any copyright, trademark, or
                  proprietary notices
                  <br />
                  - Upload, mirror, host, or redistribute the Software on
                  third-party platforms under any name other than the official
                  release
                  <br />
                  - Use the Software for unlawful, harmful, fraudulent, or
                  malicious purposes
                  <br />
                  - Circumvent, disable, or interfere with security features,
                  authentication systems, or technical protections used by the
                  Software
                  <br />
                  <br />
                  3A. MODS / USER-MADE CONTENT (IF EVER SUPPORTED)
                  <br />
                  <br />
                  If the Software ever supports mods, plug-ins, add-ons,
                  user-made levels, or any other user-made content ("Mods"),
                  then:
                  <br />
                  - Mods must be free of charge. Paid Mods, paywalled content,
                  subscriptions, or "premium" unlocks are not permitted.
                  <br />
                  - Ads are not permitted in or via Mods (including ad SDKs,
                  affiliate links, ad overlays, sponsored placements, or any
                  other advertising or promotional monetization).
                  <br />
                  - In-app purchases and paid digital content are not permitted
                  via the Software or via Mods (including purchase flows,
                  external stores, microtransactions, tips, donations, or any
                  mechanism that results in the user paying money for content,
                  features, access, currency, or progression).
                  <br />
                  - Mods may not require or encourage payment to access gameplay
                  content, features, or progression, whether inside the Software
                  or via external links.
                  <br />
                  - Strider657 may remove, disable, or block any Mod at any time
                  and for any reason, including for violations of this
                  Agreement.
                  <br />
                  <br />
                  4. USER CONTENT
                  <br />
                  <br />
                  If the Software permits the creation or sharing of
                  user-generated content, you retain ownership of your original
                  content. However, by submitting or sharing such content
                  through the Software, you grant Strider657 a worldwide,
                  non-exclusive, royalty-free license to host, display,
                  reproduce, and distribute that content solely for operation,
                  promotion, and improvement of the Software.
                  <br />
                  <br />
                  You are solely responsible for any content you create or
                  share.
                  <br />
                  <br />
                  5. UPDATES AND MODIFICATIONS
                  <br />
                  <br />
                  Strider657 may update, patch, modify, suspend, or discontinue
                  the Software or any online functionality at any time without
                  notice or liability.
                  <br />
                  <br />
                  6. TERMINATION
                  <br />
                  <br />
                  This Agreement automatically terminates if you violate any
                  provision of this Agreement. Upon termination, you must
                  immediately cease all use of the Software and delete all
                  copies in your possession or control.
                  <br />
                  <br />
                  7. DISCLAIMER OF WARRANTIES
                  <br />
                  <br />
                  THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                  WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
                  LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR
                  A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, OR THAT THE
                  SOFTWARE WILL BE UNINTERRUPTED OR ERROR-FREE.
                  <br />
                  <br />
                  8. LIMITATION OF LIABILITY
                  <br />
                  <br />
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, STRIDER657 SHALL NOT
                  BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                  CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING LOSS
                  OF DATA, LOSS OF PROFITS, BUSINESS INTERRUPTION, OR SYSTEM
                  FAILURE ARISING FROM OR RELATED TO USE OF THE SOFTWARE.
                  <br />
                  <br />
                  9. INDEMNIFICATION
                  <br />
                  <br />
                  You agree to indemnify and hold harmless Strider657 from any
                  claims, liabilities, damages, losses, or expenses arising from
                  your misuse of the Software or violation of this Agreement.
                  <br />
                  <br />
                  10. GOVERNING LAW
                  <br />
                  <br />
                  This Agreement shall be governed and interpreted in accordance
                  with the laws applicable in the Licensor's jurisdiction,
                  without regard to conflict of law principles.
                  <br />
                  <br />
                  11. ENTIRE AGREEMENT
                  <br />
                  <br />
                  This Agreement constitutes the complete and exclusive
                  agreement between you and Strider657 regarding the Software
                  and supersedes all prior agreements or understandings.
                  <br />
                  <br />
                  All rights not expressly granted herein are reserved
                  exclusively by Strider657.
                  <br />
                  <br />
                  Copyright © 2026 Strider657. All Rights Reserved.
                </p>
              </div>
            </div>
          )}

          {/* --- SETTINGS TAB --- */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-neutral-500 tracking-widest">
                  General Options
                </h3>
                <div className="glass-panel p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <div>
                      <h4 className="text-sm font-bold">High Quality FX</h4>
                      <p className="text-xs text-neutral-400">
                        Better gradients and shadows.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          highQuality: !prev.options.highQuality,
                        },
                      }))
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${state.options.highQuality ? "bg-green-500" : "bg-neutral-700"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${state.options.highQuality ? "right-1" : "left-1"}`}
                    />
                  </button>
                </div>

                <div className="glass-panel p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sun className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="text-sm font-bold">Light Mode</h4>
                      <p className="text-xs text-neutral-400">
                        Toggle between dark and light interface themes.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setState((prev) => {
                        const nextMode =
                          prev.options.colorMode === "light" ? "dark" : "light";
                        const nextBgIndex =
                          nextMode === "light" &&
                          prev.options.bgIndex === DARK_MODE_DEFAULT_BG_INDEX
                            ? LIGHT_MODE_DEFAULT_BG_INDEX
                            : nextMode === "dark" &&
                                prev.options.bgIndex ===
                                  LIGHT_MODE_DEFAULT_BG_INDEX
                              ? DARK_MODE_DEFAULT_BG_INDEX
                              : prev.options.bgIndex;

                        return {
                          ...prev,
                          options: {
                            ...prev.options,
                            colorMode: nextMode,
                            bgIndex: nextBgIndex,
                          },
                        };
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${state.options.colorMode === "light" ? "bg-amber-500" : "bg-neutral-700"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${state.options.colorMode === "light" ? "right-1" : "left-1"}`}
                    />
                  </button>
                </div>

                <div className="glass-panel p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Milk className="w-5 h-5 text-pink-400" />
                    <div>
                      <h4 className="text-sm font-bold">Floating Shakes</h4>
                      <p className="text-[10px] text-neutral-400">
                        Animated items in the background.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          floatingShakes: !prev.options.floatingShakes,
                        },
                      }))
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${state.options.floatingShakes ? "bg-green-500" : "bg-neutral-700"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${state.options.floatingShakes ? "right-1" : "left-1"}`}
                    />
                  </button>
                </div>

                <div className="glass-panel p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <div>
                      <h4 className="text-sm font-bold">Screen Shake</h4>
                      <p className="text-[10px] text-neutral-400">
                        Shake effect during blending.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          screenShake: !prev.options.screenShake,
                        },
                      }))
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${state.options.screenShake ? "bg-blue-500" : "bg-neutral-700"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${state.options.screenShake ? "right-1" : "left-1"}`}
                    />
                  </button>
                </div>

                <div className="glass-panel p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-purple-400" />
                    <div>
                      <h4 className="text-sm font-bold">Atmosphere</h4>
                      <p className="text-[10px] text-neutral-400">
                        Select your background theme
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {BACKGROUNDS.map((bg, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            options: { ...prev.options, bgIndex: index },
                          }))
                        }
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          state.options.bgIndex === index
                            ? "border-white/60 ring-2 ring-white/20"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div
                          className="absolute inset-0 bg-cover bg-center"
                          style={{
                            backgroundImage: `url("${bg.url}")`,
                            filter: bg.filter ?? "none",
                          }}
                        />
                        <div
                          className={`absolute inset-0 transition-colors ${
                            isLightMode
                              ? "bg-slate-950/15 hover:bg-slate-950/10"
                              : "bg-black/30 hover:bg-black/20"
                          }`}
                        />
                        <div
                          className={`absolute bottom-0 left-0 right-0 p-1 backdrop-blur-sm ${
                            isLightMode ? "bg-white/70" : "bg-black/50"
                          }`}
                        >
                          <span
                            className={`text-[8px] font-bold uppercase truncate block ${
                              isLightMode ? "text-slate-950" : "text-white"
                            }`}
                          >
                            {bg.name}
                          </span>
                        </div>
                        {state.options.bgIndex === index && (
                          <div className="absolute top-1 right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-lg" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass-panel p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-sky-400" />
                    <div>
                      <h4 className="text-sm font-bold">Animate Numbers</h4>
                      <p className="text-[10px] text-neutral-400">
                        Toggle rolling number transitions.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          numberAnimation: !prev.options.numberAnimation,
                        },
                      }))
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${state.options.numberAnimation ? "bg-green-500" : "bg-neutral-700"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${state.options.numberAnimation ? "right-1" : "left-1"}`}
                    />
                  </button>
                </div>

                <div className="glass-panel p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Snowflake className="w-5 h-5 text-teal-400" />
                    <div>
                      <h4 className="text-sm font-bold">Better Animations</h4>
                      <p className="text-[10px] text-neutral-400">
                        Smoother movement and visual polish.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          betterAnimations: !prev.options.betterAnimations,
                        },
                      }))
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${state.options.betterAnimations ? "bg-green-500" : "bg-neutral-700"}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${state.options.betterAnimations ? "right-1" : "left-1"}`}
                    />
                  </button>
                </div>

                <div className="glass-panel p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    <div>
                      <h4 className="text-sm font-bold">Game Date Format</h4>
                      <p className="text-[10px] text-neutral-400">
                        Default is MM/DD/YY. Toggle to DD/MM/YY.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          dateFormat:
                            prev.options.dateFormat === "dmy" ? "mdy" : "dmy",
                        },
                      }))
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${state.options.dateFormat === "dmy" ? "bg-blue-500" : "bg-neutral-700"}`}
                    title={
                      state.options.dateFormat === "dmy"
                        ? "DD/MM/YY"
                        : "MM/DD/YY"
                    }
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${state.options.dateFormat === "dmy" ? "right-1" : "left-1"}`}
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-neutral-500 tracking-widest">
                  Empire Data
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={exportSave}
                    className="glass-panel p-4 flex flex-col items-center gap-2 hover:bg-white/10"
                  >
                    <Download className="w-6 h-6 text-yellow-400" />
                    <span className="text-[10px] font-bold uppercase">
                      Export Save
                    </span>
                  </button>
                  <button
                    onClick={importSave}
                    className="glass-panel p-4 flex flex-col items-center gap-2 hover:bg-white/10"
                  >
                    <Upload className="w-6 h-6 text-blue-400" />
                    <span className="text-[10px] font-bold uppercase">
                      Import Save
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-neutral-500 tracking-widest">
                  Settings
                </h3>
                <button
                  onClick={() => {
                    setShowModal({
                      title: "Reset Settings",
                      msg: "Reset all settings (graphics, background, etc.) back to defaults?\n\nThis does NOT delete your game progress.",
                      type: "danger",
                      onConfirm: () => resetSettings(),
                    });
                  }}
                  className="w-full glass-panel p-4 flex items-center justify-center gap-3 hover:bg-white/10 border border-white/10 active:scale-95 transition-all"
                  title="Reset settings to defaults"
                >
                  <RefreshCw className="w-5 h-5 text-red-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-100">
                    Reset Settings
                  </span>
                </button>
              </div>

              <div className="space-y-3 p-4 bg-red-900/20 rounded-xl border border-red-500/40">
                <h3 className="text-xs font-black uppercase text-red-500 tracking-widest flex items-center gap-2">
                  <ZapOff className="w-3 h-3" /> Danger Zone
                </h3>
                <button
                  onClick={() => {
                    setShowModal({
                      title: "Hard Reset",
                      msg: "Are you 100% sure?\nYou will lose all progress including, flavors, and countries, etc. This CANNOT be undone!",
                      type: "danger",
                      onConfirm: () => {
                        resetGame({ keepOptions: true });
                      },
                    });
                  }}
                  className="w-full py-3 bg-red-600/20 hover:bg-red-600/40 text-red-100 font-black text-xs rounded-xl uppercase tracking-[0.2em] shadow-lg shadow-red-500/20 border border-red-500/50 transition-all active:scale-95"
                >
                  HARD RESET
                </button>
              </div>
            </div>
          )}
          {/* --- HELP TAB --- */}
          {activeTab === "help" && (
            <div className="glass-panel p-4 space-y-3 text-justify text-xs">
              <button
                onClick={() => {
                  setTutorialStep(0);
                  setShowTutorial(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 mb-2 rounded-xl font-black uppercase tracking-widest text-xs bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 hover:from-pink-500/30 hover:to-purple-500/30 transition-all text-pink-300"
              >
                <Sparkles className="w-4 h-4" />
                Replay Getting Started Guide
              </button>
              <blockquote>
                <p>
                  <strong>Welcome to Milkshake Mania!</strong> You&#39;ve just
                  opened your very own milkshake stand, and it&#39;s time to
                  blend your way to milkshake greatness! This guide will teach
                  you everything you need to know to become the ultimate
                  milkshake mogul.
                </p>
              </blockquote>
              <hr />
              <h2 id="quick-start-guide">Quick Start Guide</h2>
              <p>Ready to start blending? Here&#39;s what to do:</p>
              <ol>
                <li>
                  <strong>Click the Blend Button</strong> - This is your main
                  action! Each click makes a milkshake.
                </li>
                <li>
                  <strong>Watch Your Money Grow</strong> - Each milkshake you
                  make earns you cash ($).
                </li>
                <li>
                  <strong>Unlock Upgrades</strong> - Spend your earnings on
                  upgrades to make more money per blend.
                </li>
                <li>
                  <strong>Hire Employees</strong> - Let them make milkshakes
                  while you&#39;re busy!
                </li>
                <li>
                  <strong>Expand Your Empire</strong> - Keep upgrading and
                  hiring until you&#39;re the milkshake tycoon!
                </li>
              </ol>
              <hr />
              <h2 id="how-to-play">How to Play</h2>
              <h3 id="milkshake-blender">Milkshake Blender</h3>
              <p>
                The <strong>Milkshake Blender</strong> is your best friend.
                Every click:
              </p>
              <ul>
                <li>Creates a delicious milkshake</li>
                <li>Earns you money</li>
              </ul>
              <p>
                The blend time starts at <strong>7.5 seconds per blend</strong>,
                but you can upgrade this to blend faster!
              </p>
              <h3 id="making-money">Making Money</h3>
              <p>There are two ways to make money in Milkshake Mania:</p>
              <table className="w-full border-collapse border border-white/10 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-white/10">
                    <th className="border border-white/10 px-3 py-2 text-left text-xs font-black uppercase tracking-wider">
                      Method
                    </th>
                    <th className="border border-white/10 px-3 py-2 text-left text-xs font-black uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white/5">
                    <td className="border border-white/10 px-3 py-2">
                      <strong>Manual Blending</strong>
                    </td>
                    <td className="border border-white/10 px-3 py-2">
                      Click the Milkshake Blender to make milkshakes yourself.
                      You earn 100% of the profits!
                    </td>
                  </tr>
                  <tr className="bg-white/5">
                    <td className="border border-white/10 px-3 py-2">
                      <strong>Auto-blend Mode</strong>
                    </td>
                    <td className="border border-white/10 px-3 py-2">
                      Enable the auto-blend mode in the top left corner, and it
                      saves the hassle of spamming.
                    </td>
                  </tr>
                  <tr className="bg-white/5">
                    <td className="border border-white/10 px-3 py-2">
                      <strong>Employees</strong>
                    </td>
                    <td className="border border-white/10 px-3 py-2">
                      Hire workers to make milkshakes for you. They work
                      automatically but earn less individually.
                    </td>
                  </tr>
                </tbody>
              </table>
              <h3 id="the-upgrade-shop">The Upgrade Shop</h3>
              <p>
                Press the <strong>Upgrades</strong> tab to see all the ways to
                improve your operation:
              </p>
              <ul>
                <li>
                  <strong>Blend Speed</strong> - Blend faster (reduce that
                  10-second timer!)
                </li>
                <li>
                  <strong>Employee Training</strong> - Your employees become
                  more efficient
                </li>
                <li>
                  And a lot more, so many that they can&#39;t be listed here
                </li>
              </ul>
              <h3 id="the-employee-shop">The Employee Shop</h3>
              <p>
                Press the <strong>Employees</strong> tab to hire help. Although
                you get passive income, the tradeoff is that every month in
                game, where each day is a second, you must pay their salaries.
              </p>
              <blockquote>
                <p>
                  💡 <strong>Tip:</strong> Employees are great for earning money
                  while you&#39;re away or busy clicking!
                </p>
              </blockquote>
              <hr />
              <h2 id="special-outcomes">Special Outcomes</h2>
              <p>
                When you blend a milkshake, there&#39;s a chance it turns out
                extra special! These give you bonus money:
              </p>
              <table className="w-full border-collapse border border-white/10 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-white/10">
                    <th className="border border-white/10 px-3 py-2 text-left text-xs font-black uppercase tracking-wider">
                      Outcome
                    </th>
                    <th className="border border-white/10 px-3 py-2 text-left text-xs font-black uppercase tracking-wider">
                      Chance
                    </th>
                    <th className="border border-white/10 px-3 py-2 text-left text-xs font-black uppercase tracking-wider">
                      Bonus
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white/5">
                    <td className="border border-white/10 px-3 py-2">
                      <strong>Crusty</strong>
                    </td>
                    <td className="border border-white/10 px-3 py-2">10%</td>
                    <td className="border border-white/10 px-3 py-2">
                      +$10 bonus
                    </td>
                  </tr>
                  <tr className="bg-white/5">
                    <td className="border border-white/10 px-3 py-2">
                      <strong>Baked</strong>
                    </td>
                    <td className="border border-white/10 px-3 py-2">5%</td>
                    <td className="border border-white/10 px-3 py-2">
                      +$25 bonus
                    </td>
                  </tr>
                  <tr className="bg-white/5">
                    <td className="border border-white/10 px-3 py-2">
                      <strong>Swirled</strong>
                    </td>
                    <td className="border border-white/10 px-3 py-2">1%</td>
                    <td className="border border-white/10 px-3 py-2">
                      +$100 bonus
                    </td>
                  </tr>
                  <tr className="bg-white/5">
                    <td className="border border-white/10 px-3 py-2">
                      <strong>Golden</strong>
                    </td>
                    <td className="border border-white/10 px-3 py-2">0.1%</td>
                    <td className="border border-white/10 px-3 py-2">
                      +$1,000 bonus
                    </td>
                  </tr>
                </tbody>
              </table>

              <hr />

              <blockquote>
                <p>
                  🎉 These special outcomes can stack! You might get a
                  <strong>"Golden Swirled"</strong> milkshake worth even more!
                  With enough luck, modifiers can combine into increasingly rare
                  creations like a<br />
                  <strong>
                    "Creamy Crusty Baked Swirled Decorated Blend!"
                  </strong>
                </p>
                <br />

                <p>
                  Technically, the rarest possible outcome is the fully stacked:
                </p>
                <br />

                <p>
                  <strong>
                    "FAN FAVORITE: CREAMY CRUSTY BAKED SWIRLED GOLDEN DECORATED
                    BLEND!"
                  </strong>
                </p>
                <br />

                <p>
                  At base chances, this legendary combination is approximately:
                </p>
                <br />

                <p>
                  <strong>0.0000000009375%</strong>
                  <br />(<strong>1 in 106,666,666,667 blends!</strong>)
                </p>
                <br />

                <p>
                  Most players will probably never see one naturally... but if
                  it happens, consider yourself unbelievably lucky.
                </p>
              </blockquote>

              <h3 id="how-to-get-better-outcomes">
                How to Get Better Outcomes
              </h3>
              <p>
                The <strong>Golden Milkshake</strong> is the rarest and most
                valuable, excluding stacking. You have a 0.1% chance for each
                blend to be Golden
              </p>
              <hr />
              <h2 id="game-screens">Game Screens</h2>
              <h3 id="milkshake-panel-main-screen-">
                Milkshake Panel (Main Screen)
              </h3>
              <ul>
                <li>
                  Your milkshake blender, which you click to{" "}
                  <em>make a shake</em>.
                </li>
                <li>Current money and earnings per second</li>
                <li>Progress bar for current blend</li>
              </ul>
              <h3 id="upgrades-tab">Upgrades Tab</h3>
              <ul>
                <li>All purchasable upgrades</li>
                <li>Shows current level, cost, and effect</li>
                <li>Grayed out if you can&#39;t afford it</li>
              </ul>
              <h3 id="employees-tab">Employees Tab</h3>
              <ul>
                <li>All employee types you can hire</li>
                <li>Shows how many you own and their total output</li>
                <li>Costs increase as you hire more</li>
              </ul>
              <h3 id="shop-extensions-tab">Shop Extensions Tab</h3>
              <ul>
                <li>All purchasable shop extensions</li>
                <li>Shop extensions to increase employee capacity</li>
              </ul>
              <h3 id="stats-panel-in-the-milkshake-panel-">
                Stats Panel (in the Milkshake Panel)
              </h3>
              <ul>
                <li>Total money earned</li>
                <li>Total milkshakes made</li>
                <li>And more!</li>
              </ul>
              <h3 id="settings-tab">Settings Tab</h3>
              <ul>
                <li>
                  <strong>Export Save</strong> - Copy your save code to share or
                  backup
                </li>
                <li>
                  <strong>Import Save</strong> - Load a saved game from a code
                </li>
                <li>
                  <strong>Hard Reset</strong> - Start completely over (Warning:
                  This erases all progress!)
                </li>
                <li>
                  Don&#39;t worry if you don&#39;t export your save though, as
                  the game automatically saves to <em>localStorage</em>, which
                  only gets wiped when you clear your cache
                </li>
              </ul>
              <h2 id="economy-progression">Economy &amp; Progression</h2>
              <h3 id="early-game-start-5-000-">Early Game (Start - $5,000)</h3>
              <p>Focus on:</p>
              <ul>
                <li>
                  Clicking the Blend Button frequently (or use the auto-blend
                  feature)
                </li>
                <li>Buying the first few upgrades</li>
                <li>Hiring a few Student Interns</li>
                <li>Expanding the employee capacity</li>
              </ul>
              <h3 id="mid-game-5-000-100-000-">Mid Game ($5,000 - $100,000)</h3>
              <p>Focus on:</p>
              <ul>
                <li>Upgrading Blender Power for bigger payouts</li>
                <li>Hiring Milkshake Artists and Shake Scientists</li>
                <li>Working toward the more expensive upgrades</li>
              </ul>
              <h3 id="late-game-100-000-">Late Game ($100,000+)</h3>
              <p>Focus on:</p>
              <ul>
                <li>Higher level staff, e.g. a Chef</li>
                <li>Maximing out your upgrades</li>
                <li>
                  Improving and leveling up some of the upgrades, which raises
                  the chance of getting
                  <strong>Crusty</strong>, <strong>Baked</strong>,{" "}
                  <strong>Swirled</strong> and <strong>Golden</strong> shakes.
                </li>
                <li>Watching your income and money grow!</li>
              </ul>
              <hr />
              <h2 id="tips-tricks">Tips &amp; Tricks</h2>
              <h3 id="1-be-patient">1. Be Patient</h3>
              <p>
                The game is called &quot;incremental&quot; for a reason.
                Progress might feel slow at first, but it accelerates as you
                upgrade!
              </p>
              <h3 id="2-don-t-neglect-upgrades">
                2. Don&#39;t Neglect Upgrades
              </h3>
              <p>
                Upgrades often give better returns than hiring more employees
                early on. Check your Upgrades tab often!
              </p>
              <h3 id="3-watch-for-sales">3. Watch for Sales</h3>
              <p>
                Some upgrades might feel expensive at first. Come back later and
                check again!
              </p>
              <h3 id="4-employees-are-great">4. Employees Are Great</h3>
              <p>
                Even though employees earn less than manual clicking, they work
                24/7! They&#39;re perfect for building wealth over time.
              </p>
              <h3 id="5-special-outcomes-add-up">5. Special Outcomes Add Up</h3>
              <p>
                Even though Crusty and Baked milkshakes are common, they add up
                over time. Every bonus helps!
              </p>
              <h3 id="6-save-often">6. Save Often</h3>
              <p>
                Your game auto-saves, but you can manually save anytime. Export
                your save code to a text file for backup!
              </p>
              <h3 id="7-frequent-updates">7. Frequent Updates</h3>
              <p>
                The game is regularly updated with new features, improvements,
                upgrades, and exciting content, so make sure to check back often
                and don&#39;t miss out!
              </p>
              <hr />
              <h2 id="frequently-asked-questions-faq-">
                Frequently Asked Questions (FAQ)
              </h2>
              <p>
                <strong>Q: How do I earn money faster?</strong>
                A: Buy upgrades first! Shop Popularity increases your per-blend
                earnings, while Blend Speed lets you click more often.
              </p>
              <p>
                <strong>Q: Should I hire employees or buy upgrades?</strong>
                A: Early game, upgrades give better value. Mid to late game,
                employees become more important for passive income.
              </p>
              <p>
                <strong>Q: What happens if I close the game?</strong>
                A: Your progress is automatically saved! Just open the game
                again and you&#39;ll continue right where you left off.
              </p>
              <p>
                <strong>Q: How do I get Golden Milkshakes?</strong>
                A: Buy the &quot;Golden Touch&quot; upgrade in the Upgrades tab.
                Then you have a small chance each blend!
              </p>
              <p>
                <strong>Q: Can I play on my phone?</strong>
                A: Yes! The game is playable on mobile devices. Simply tap the{" "}
                <strong>Blend Button</strong> just like you would click it on a
                computer.
              </p>
              <p>
                <strong>Important:</strong> You may need to lower your browser
                zoom/scale depending on your device. The game is still being
                optimized for smaller screens and may not display properly on
                lower resolutions or high zoom levels.
              </p>
              <p>
                Also, just to be clear, there's obviously no way to play the
                Windows desktop version of the game on a phone. Mobile support
                only applies to the browser version of the game.
              </p>
              <p>
                <strong>Q: What&#39;s the rarest outcome?</strong>
                A: <strong>Golden</strong> at 0.1% chance! But with enough
                blends, you&#39;ll start seeing them.
              </p>
              <hr />
              <h2 id="milestones-to-achieve">Milestones to Achieve</h2>
              <p>Here&#39;s what to work toward:</p>
              <ul>
                <li>
                  <strong>First $100</strong> - Your first milestone! (probably)
                </li>
                <li>
                  <strong>First Upgrade</strong> - Invest in your business
                </li>
                <li>
                  <strong>First Employee</strong> - Welcome to automation
                </li>
                <li>
                  <strong>First Crusty Milkshake</strong> - A little bonus!
                </li>
                <li>
                  <strong>First Baked Milkshake</strong> - Even better bonus!
                </li>
                <li>
                  <strong>First Swirled Milkshake</strong> - You&#39;re getting
                  lucky!
                </li>
                <li>
                  <strong>$10,000 earned</strong> - Small business owner!
                </li>
                <li>
                  <strong>First Golden Milkshake</strong> - Ultimate rarity
                  achieved!
                </li>
                <li>
                  <strong>$100,000 earned</strong> - Milkshake mogul!
                </li>
                <li>
                  <strong>All upgrades purchased</strong> - Maximum efficiency!
                </li>
                <li>
                  <strong>100 Employees</strong> - Running a milkshake factory!
                </li>
                <li>Those are just ideas for goals, so be creative!</li>
              </ul>
              <hr />
              <h2 id="that-s-it">That&#39;s It</h2>
              <p>You&#39;re ready to start your milkshake empire! Remember:</p>
              <ul>
                <li>
                  <strong>Click to blend</strong>
                </li>
                <li>
                  <strong>Upgrade your equipment</strong>
                </li>
                <li>
                  <strong>Hire employees</strong>
                </li>
                <li>
                  <strong>Chase rare milkshakes</strong>
                </li>
                <li>
                  <strong>Have fun!</strong>
                </li>
              </ul>
              <p>Now get out there and make some delicious milkshakes!</p>
              <ul>
                <li>Auto-saves to localStorage key.</li>
                <li>Export copies an obfuscated save code to clipboard.</li>
                <li>Import opens a modal where you can paste the save code.</li>
                <li>
                  Hard Reset clears only this game's save key and resets state
                  (keeps your settings, no page reload, does not wipe unrelated
                  localStorage keys).
                </li>
              </ul>
            </div>
          )}
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
                <Star className="w-6 h-6 text-pink-400 shrink-0" />
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
      {/* --- TUTORIAL MODAL --- */}
      {showTutorial &&
        (() => {
          const steps = [
            {
              title: "Welcome to Milkshake Mania!",
              icon: <Milk className="w-10 h-10 text-pink-400" />,
              body: "You run a milkshake empire — from a tiny blender to a global franchise. Click your way to the top, hire staff, unlock exotic flavors, and blend your path to fame.",
            },
            {
              title: "The Blender",
              icon: <Zap className="w-10 h-10 text-yellow-400" />,
              body: "Tap the blender to mix milkshakes and earn money. Each blend takes a moment — upgrades in the Upgrades tab reduce blend time. Special blends (Fan Favorite, Creamy, Golden...) earn bonus cash!",
            },
            {
              title: "Hire & Upgrade",
              icon: <Users className="w-10 h-10 text-blue-400" />,
              body: "Head to the Employees & Shops tabs to hire staff and open locations that earn money automatically. Visit the Upgrades tab to boost your income, speed, and unlock powerful perks.",
            },
            {
              title: "Flavors & Combos",
              icon: <Sparkles className="w-10 h-10 text-purple-400" />,
              body: "Unlock new flavors in the Flavors tab — each adds a yield multiplier to every blend. You start with one active slot; upgrade Multi-Flavor Blending to mix up to three flavors at once for powerful combos.",
            },
            {
              title: "Go Global",
              icon: <Globe className="w-10 h-10 text-green-400" />,
              body: "Once you've built a thriving business, expand to new countries! Each unlocked market multiplies your total income. Random events will shake things up along the way — choose wisely.",
            },
          ];
          const step = steps[tutorialStep];
          const isLast = tutorialStep === steps.length - 1;
          return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
              <motion.div
                key={tutorialStep}
                initial={{ scale: 0.92, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="max-w-sm w-full glass-panel p-8 border-2 border-pink-500/30"
              >
                <div className="flex flex-col items-center text-justify gap-4 mb-6">
                  {step.icon}
                  <h2 className="text-2xl font-display font-black uppercase tracking-tighter text-white">
                    {step.title}
                  </h2>
                  <p className="text-neutral-300 text-sm leading-relaxed">
                    {step.body}
                  </p>
                </div>
                <div className="flex items-center gap-2 mb-5 justify-center">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${i === tutorialStep ? "bg-pink-400 w-4" : "bg-white/20"}`}
                    />
                  ))}
                </div>
                <div className="flex gap-3">
                  {tutorialStep > 0 && (
                    <button
                      onClick={() => setTutorialStep((s) => s - 1)}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (isLast) {
                        setState((prev: GameState) => ({
                          ...prev,
                          options: { ...prev.options, seenTutorial: true },
                        }));
                        setShowTutorial(false);
                      } else {
                        setTutorialStep((s) => s + 1);
                      }
                    }}
                    className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/20 transition-all hover:opacity-90"
                  >
                    {isLast ? "Let's Blend!" : "Next"}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
    </div>
  );
}
