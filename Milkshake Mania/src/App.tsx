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
} from "./constants";
import { UPGRADE_REGISTRY } from "./registry";
import { createDefaultState, sanitizeLoadedState } from "./state";
import pkg from "../package.json";
import { formatLargeNumber } from "./utils/format";
import UpgradeCard from "./components/UpgradeCard";
import StatBox from "./components/StatBox";
import { useSavedGameState } from "./hooks/useSavedGameState";
import {
  calcGlobalMultiplier,
  calcIncomePerSecond,
  calcManualBlendGain,
  rollSpecialOutcomes,
} from "./game/logic";

const SAVE_KEY = "milkshake-tycoon-v1";
const APP_VERSION = pkg.version;

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

const formatGameDate = (gameDays: number): string => {
  const baseDate = new Date(2025, 0, 1);
  const current = new Date(baseDate);
  current.setDate(baseDate.getDate() + gameDays - 1);
  const mm = String(current.getMonth() + 1).padStart(2, "0");
  const dd = String(current.getDate()).padStart(2, "0");
  const yy = String(current.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
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

  const [notifications, setNotifications] = useState<
    {
      id: number;
      text: string;
      type: "normal" | "crusty" | "baked" | "golden" | "swirled";
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
    | "settings"
    | "about"
  >("employees");
  const [isBlending, setIsBlending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [blendMode, setBlendMode] = useState<"manual" | "autoMix" | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  // --- Refs for Game Loop ---
  const requestRef = useRef<number>(null);
  const previousTimeRef = useRef<number>(null);
  const blendFrameRef = useRef<number | null>(null);
  const blendTimeoutRef = useRef<number | null>(null);
  const dayTimeRef = useRef<number>(0);

  // --- Logic Helpers ---
  const addNotification = (
    text: string,
    type: "normal" | "crusty" | "baked" | "golden" = "normal",
  ) => {
    const id = Date.now();
    setNotifications((prev: any) => [{ id, text, type }, ...prev].slice(0, 5));
    setTimeout(() => {
      setNotifications((prev: any) => prev.filter((n: any) => n.id !== id));
    }, 3000);
  };

  const getGlobalMultiplier = useCallback(() => {
    return safeCalc(() =>
      calcGlobalMultiplier(
        {
          unlockedCountries: state.unlockedCountries,
          activeFlavors: state.activeFlavors,
          upgrades: state.upgrades,
        },
        COUNTRIES,
        FLAVORS,
      ),
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
      const outcome = rollSpecialOutcomes(state.upgrades, CHANCES, MULTIPLIERS);
      const gain = calcManualBlendGain(
        { shops: state.shops, upgrades: state.upgrades },
        globalMult,
        outcome.multiplier,
      );

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
        if (outcome.activeTypes.includes("CRUSTY"))
          newTotalStats.totalCrusty += 1;
        if (outcome.activeTypes.includes("BAKED"))
          newTotalStats.totalBaked += 1;
        if (outcome.activeTypes.includes("GOLDEN"))
          newTotalStats.totalGolden += 1;
        if (outcome.activeTypes.includes("SWIRLED"))
          newTotalStats.totalSwirled += 1;

        return {
          ...prev,
          money: prev.money + gain,
          totalStats: newTotalStats,
        };
      });

      if (outcome.activeTypes.length > 0) {
        const typeLabel = outcome.activeTypes.join(" ") + " BLEND!";
        const multLabel = ` x${outcome.multiplier.toLocaleString()}`;
        addNotification(
          `${typeLabel} ${multLabel}`,
          outcome.activeTypes[0].toLowerCase() as any,
        );
      }
    },
    [state.shops, state.upgrades, getGlobalMultiplier],
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
      INITIAL_BLEND_TIME - state.upgrades.mixSpeed * 0.5,
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
    if (state.money < cost) return;

    setState((prev: GameState) => ({
      ...prev,
      money: prev.money - cost,
      upgrades: { ...prev.upgrades, [key]: (prev.upgrades[key] || 0) + 1 },
    }));
    const name = UPGRADE_REGISTRY[key]?.name ?? key;
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
        INITIAL_BLEND_TIME - state.upgrades.mixSpeed * 0.5,
      );
      return `${def.description} Currently: ${blendTime.toFixed(1)}s`;
    }
    return def.description;
  };

  const toggleFlavor = (type: FlavorType) => {
    setState((prev: GameState) => {
      const active = [...prev.activeFlavors];
      if (active.includes(type)) {
        if (active.length > 1) {
          return { ...prev, activeFlavors: active.filter((t) => t !== type) };
        }
        return prev;
      }
      return { ...prev, activeFlavors: [...active, type] };
    });
  };

  const exportSave = () => {
    const code = btoa(JSON.stringify(state));
    navigator.clipboard.writeText(code);
    setShowModal({
      title: "Save exported",
      msg: "Your save code has been copied to your clipboard.\n\nKeep it safe. You can use it to restore your progress on any device.",
      type: "info",
      onConfirm: () => {},
    });
  };

  const importSave = () => {
    setImportOpen(true);
    setImportText("");
  };

  const resetGame = (factoryReset: boolean) => {
    clearSave();

    const base = createDefaultState();

    setState(factoryReset ? base : { ...base, options: { ...base.options } });

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
      const income = getIncomePerSecond() * dt;
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
              nextMoney -= prev.shops.reduce(
                (sum, shop) =>
                  sum + (shop.count || 0) * (shop.monthlyCost || 0),
                0,
              );
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
    isBlending,
    produceMilkshake,
    state.upgrades.mixSpeed,
  ]);

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

  const blenderFillHeight = isBlending
    ? Math.min(100, 40 + progress * 0.6)
    : 40;

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-neutral-100 font-sans selection:bg-pink-500/30">
      {/* Left Pane: The Blender / Visual Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center border-r border-white/10 p-8 overflow-hidden bg-black">
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
          Array.from({ length: 10 }).map((_, i) => {
            const flavor =
              state.activeFlavors[i % state.activeFlavors.length] ||
              (Object.keys(FLAVORS)[0] as FlavorType);
            const startX = Math.random() * 80 + 8;
            const endX = Math.random() * 80 + 8;
            const startY = 110 + Math.random() * 20;
            const endY = -20 - Math.random() * 20;

            return (
              <motion.div
                key={`float-${i}-${flavor}`}
                initial={{
                  y: `${startY}vh`,
                  x: `${startX}%`,
                  opacity: 0,
                  rotate: Math.random() * 360,
                }}
                animate={{
                  y: `${endY}vh`,
                  x: `${endX}%`,
                  opacity: [0.2, 0.8, 0.2],
                  rotate: 360 + Math.random() * 180,
                }}
                transition={{
                  duration: 8 + Math.random() * 10,
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 3,
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

        <div className="absolute bottom-8 left-8 z-30 w-[28rem] space-y-3">
          <div className="glass-panel p-4 border-white/10 bg-black/40 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-400 font-black">
                Empire Stats
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-bold">
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
                <div className="font-black uppercase text-pink-300">
                  Flavors
                </div>
                <div className="mt-1 font-bold text-white">
                  {state.unlockedFlavors.length}/{flavorTypes.length}
                </div>
              </div>
            </div>
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
                  +${formatLargeNumber(getIncomePerSecond())}/s
                </span>
              </div>
              <div className="flex justify-between mt-2">
                <span>Next payroll</span>
                <span className="font-bold text-white">
                  {daysUntilPayroll} day{daysUntilPayroll === 1 ? "" : "s"} · -$
                  {formatLargeNumber(monthlyOperatingCost)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-[0.2em] text-neutral-400">
              <span className="text-blue-400">
                {(
                  (CHANCES.crustyBase +
                    state.upgrades.qualityControl * 0.005 +
                    state.upgrades.equipmentUpgrade * 0.002) *
                  100
                ).toFixed(1)}
                % Crusty
              </span>
              <span className="text-orange-400">
                {(
                  (CHANCES.bakedBase + state.upgrades.heatControl * 0.001) *
                  100
                ).toFixed(1)}
                % Baked
              </span>
              <span className="text-purple-400">
                {(CHANCES.swirledBase * 100).toFixed(1)}% Swirl
              </span>
              <span className="text-yellow-400">
                {(
                  (CHANCES.goldenBase +
                    state.upgrades.recipeDevelopment * 0.0001) *
                  100
                ).toFixed(2)}
                % Gold
              </span>
            </div>
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
          </div>

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
                className="absolute bottom-0 w-full"
                initial={{ height: "40%" }}
                animate={{
                  height: `${blenderFillHeight}%`,
                }}
                transition={{
                  type: "spring",
                  stiffness: 60,
                  damping: 20,
                }}
                style={{
                  background:
                    state.activeFlavors.length > 1
                      ? `linear-gradient(to top, ${state.activeFlavors.map((t) => FLAVORS[t].color).join(", ")})`
                      : FLAVORS[state.activeFlavors[0]]?.color || "#3d2b1f",
                  backgroundSize: "100% 200%",
                  backgroundPosition: "bottom",
                }}
              >
                {/* Highlight and liquid surface */}
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
                  n.type === "crusty"
                    ? "bg-blue-500/20 border-blue-400 text-blue-300"
                    : n.type === "baked"
                      ? "bg-orange-500/20 border-orange-400 text-orange-300"
                      : n.type === "golden"
                        ? "bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-yellow-500/20"
                        : "bg-white/10 border-white/20 text-white"
                }`}
              >
                {n.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Pane: Management Sidebar */}
      <div className="w-[450px] bg-neutral-900 flex flex-col border-l border-white/10 shrink-0 z-50">
        {/* Sidebar Header / Tabs - 2 Row Layout */}
        <div className="bg-neutral-800/80 p-2 border-b border-white/5 space-y-1">
          <div className="grid grid-cols-4 gap-1">
            {(["employees", "shops", "upgrades", "flavors"] as const).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    activeTab === tab
                      ? "bg-white text-black"
                      : "bg-white/5 text-neutral-400 hover:bg-white/20"
                  }`}
                >
                  {tab === "employees" && <Users className="w-4 h-4" />}
                  {tab === "shops" && <Store className="w-4 h-4" />}
                  {tab === "upgrades" && <Zap className="w-4 h-4" />}
                  {tab === "flavors" && <Palette className="w-4 h-4" />}
                  {tab}
                </button>
              ),
            )}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(["countries", "settings", "about"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab
                    ? "bg-white text-black"
                    : "bg-white/5 text-neutral-400 hover:bg-white/20"
                }`}
              >
                {tab === "countries" && <Globe className="w-4 h-4" />}
                {tab === "settings" && <Settings className="w-4 h-4" />}
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
              <div className="px-1 pb-2 border-b border-white/5">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                  Employee Roster
                </h3>
              </div>
              {visibleEmployees.map((shop) => {
                const cost = getShopCost(shop);
                return (
                  <div
                    key={shop.id}
                    className={`glass-panel p-4 flex items-center justify-between transition-all ${state.money < cost ? "opacity-50 grayscale" : "hover:bg-white/5 cursor-pointer active:scale-95"}`}
                    onClick={() => buyShop(shop.id)}
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
              ).map((key) => {
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
                      return { icon: <Smile />, iconColor: "text-yellow-400" };
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
                      return { icon: <Trophy />, iconColor: "text-yellow-400" };
                    case "customBlending":
                      return { icon: <Palette />, iconColor: "text-pink-400" };
                    case "bulkPurchasing":
                      return { icon: <Layers />, iconColor: "text-cyan-400" };
                    case "distributionNetwork":
                      return { icon: <Rocket />, iconColor: "text-orange-400" };
                    case "portionSize":
                      return { icon: <Milk />, iconColor: "text-white" };
                    case "specialMastery":
                      return {
                        icon: <Sparkles />,
                        iconColor: "text-purple-400",
                      };
                    case "ingredientQuality":
                      return { icon: <Milk />, iconColor: "text-emerald-300" };
                    case "storefrontAppeal":
                      return { icon: <Store />, iconColor: "text-amber-300" };
                    case "expansionNegotiation":
                      return {
                        icon: <MapPin />,
                        iconColor: "text-green-300",
                      };
                    case "autoMixerTuning":
                      return { icon: <Zap />, iconColor: "text-sky-300" };
                    default:
                      return {
                        icon: <ChevronRight />,
                        iconColor: "text-neutral-400",
                      };
                  }
                })();

                return (
                  <UpgradeCard
                    key={key}
                    icon={icon}
                    iconColor={iconColor}
                    name={UPGRADE_REGISTRY[key].name}
                    desc={getUpgradeDesc(key)}
                    level={level}
                    cost={cost}
                    canAfford={state.money >= cost}
                    onBuy={() => buyUpgrade(key, cost)}
                  />
                );
              })}
            </div>
          )}

          {/* --- FLAVORS TAB --- */}
          {activeTab === "flavors" &&
            visibleFlavors.map((type) => {
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
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-all border ${
                        isCurrent
                          ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent shadow-lg shadow-pink-500/20"
                          : "bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {isCurrent ? "Mixing" : "Add"}
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

          {/* --- ABOUT TAB --- */}
          {activeTab === "about" && (
            <div className="space-y-4">
              <div className="glass-panel p-4 space-y-3">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-300 text-justify">
                  About
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed text-justify">
                  Milkshake Mania is an incremental, clicker-like game built
                  with <span className="text-cyan-300">React + Vite</span>. It
                  features manual blending, passive income from employees, and a
                  variety of upgrades and special outcomes. This experience
                  allows you to create your own milkshake empire, starting from
                  a small shop and building your empire through blends, staff,
                  and expansion.
                </p>
                <p className="text-xs text-green-300">Version: {APP_VERSION}</p>
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

              <div className="glass-panel p-4 space-y-3">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-400">
                  Credits
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed  text-justify">
                  UI design, music, and game logic brought together by the
                  <strong> Strider657's Milkshake Mania</strong> team.
                  <br />
                  <br />
                  <hr />
                  <br />
                  <strong className="text-center">MAIN DEVELOPER</strong>
                  <p class="text-center">Strider657</p>
                  <br />
                  <hr />
                  <br />
                  <strong className="text-center">
                    MAIN DIRECTOR OF CONCEPTUAL GAME DESIGN (IDEAS AND GAME
                    CONCEPTS)
                  </strong>
                  <p className="text-center">Oliver382</p>
                  <br />
                  <hr />
                  <br />
                  <p className="text-justify">
                    Huge thanks to everyone who contributed to this project!
                    Special shoutout to Oliver382 for bringing so many creative
                    ideas and shaping the gameplay and features of Milkshake
                    Mania. I'm Strider657, and it's been awesome collaborating
                    with him on the game's design and overall vision.
                  </p>
                  <br />
                  <p className="text-justify">
                    This game wouldn't be what it is without Oliver382's ideas.
                    His creativity inspired a lot of the game's mechanics and
                    features, and I'm really grateful for his support throughout
                    development. Big thanks, Oliver!
                  </p>
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

                <div className="glass-panel p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-purple-400" />
                    <div>
                      <h4 className="text-sm font-bold">Atmosphere</h4>
                      <p className="text-[10px] text-neutral-400">
                        {BACKGROUNDS[state.options.bgIndex]?.name || "Default"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        options: {
                          ...prev.options,
                          bgIndex:
                            (prev.options.bgIndex + 1) % BACKGROUNDS.length,
                        },
                      }))
                    }
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all active:scale-95"
                  >
                    <RefreshCw className="w-3 h-3 text-white/40" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Cycle
                    </span>
                  </button>
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
                        resetGame(true);
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
              Paste your save code (base64) or raw JSON.
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
                    let decoded = text;
                    try {
                      decoded = atob(text);
                    } catch {
                      // Not base64; assume JSON
                    }
                    const loaded = sanitizeLoadedState(JSON.parse(decoded));
                    setState(loaded);
                    setImportOpen(false);
                    setImportText("");
                    addNotification("Save imported", "normal");
                  } catch (e) {
                    setShowModal({
                      title: "Import failed",
                      msg: "That did not look like a valid save. Make sure you copied the full code.",
                      type: "danger",
                      onConfirm: () => {},
                    });
                  }
                }}
                className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
              >
                Import
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
