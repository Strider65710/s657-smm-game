import { ChevronDown, ChevronRight, Lock } from "lucide-react";
import { GameState } from "../../types";
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORY_LABELS } from "../../achievements";
import { formatLargeNumber } from "../../utils/format";

interface AchievementsPanelProps {
  state: GameState;
  playerLevel: number;
  collapsedAchCats: Set<string>;
  setCollapsedAchCats: (fn: (prev: Set<string>) => Set<string>) => void;
  employeeCount: number;
  totalShopExtensions: number;
}

export default function AchievementsPanel({
  state,
  playerLevel,
  collapsedAchCats,
  setCollapsedAchCats,
  employeeCount,
  totalShopExtensions,
}: AchievementsPanelProps) {
  const employees = employeeCount;
  const shopExts = totalShopExtensions;
  const upgradeSum = Object.values(state.upgrades).reduce((a, b) => a + b, 0);

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
          current: Object.values(state.upgrades).filter((v) => v > 0).length,
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
          current: Object.values(state.upgrades).filter((v) => v >= 1).length,
          target: Object.keys(state.upgrades).length,
        };
      case "days_30":
        return { current: state.gameDays, target: 30 };
      case "days_90":
        return { current: state.gameDays, target: 90 };
      case "days_180":
        return { current: state.gameDays, target: 180 };
      case "days_365":
        return { current: state.gameDays, target: 365 };
      case "days_730":
        return { current: state.gameDays, target: 730 };
      case "days_1825":
        return { current: state.gameDays, target: 1_825 };
      case "level_3":
        return { current: playerLevel, target: 3 };
      case "level_5":
        return { current: playerLevel, target: 5 };
      case "level_10":
        return { current: playerLevel, target: 10 };
      case "level_20":
        return { current: playerLevel, target: 20 };
      case "level_35":
        return { current: playerLevel, target: 35 };
      case "level_50":
        return { current: playerLevel, target: 50 };
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
          current: Object.values(state.upgrades).filter((v) => v >= 5).length,
          target: Object.keys(state.upgrades).length,
        };
      case "days_3650":
        return { current: state.gameDays, target: 3_650 };
      case "days_7300":
        return { current: state.gameDays, target: 7_300 };
      case "days_10000":
        return { current: state.gameDays, target: 10_000 };
      case "countries_20":
        return {
          current: state.unlockedCountries.length,
          target: 20,
        };
      case "countries_25":
        return {
          current: state.unlockedCountries.length,
          target: 25,
        };
      case "countries_30":
        return {
          current: state.unlockedCountries.length,
          target: 30,
        };
      case "shakes_25m":
        return {
          current: state.totalStats.totalMilkshakes,
          target: 25_000_000,
        };
      case "shakes_100m":
        return {
          current: state.totalStats.totalMilkshakes,
          target: 100_000_000,
        };
      case "money_10t":
        return { current: state.money, target: 10_000_000_000_000 };
      case "money_100t":
        return {
          current: state.money,
          target: 100_000_000_000_000,
        };
      case "shops_1000":
        return { current: shopExts, target: 1_000 };
      case "employees_5000":
        return { current: employees, target: 5_000 };
      case "golden_5000":
        return {
          current: state.totalStats.totalGolden,
          target: 5_000,
        };
      case "fan_10000":
        return {
          current: state.totalStats.totalFanFavorite,
          target: 10_000,
        };
      case "upgrades_300_total":
        return { current: upgradeSum, target: 300 };
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
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            }}
          >
            {earnedAchs.map((ach) => {
              const chipStyle: Record<string, string> = {
                shakes: "bg-cyan-500/15 border-cyan-500/35 text-cyan-300",
                money: "bg-yellow-500/15 border-yellow-500/35 text-yellow-300",
                employees: "bg-green-500/15 border-green-500/35 text-green-300",
                shops: "bg-purple-500/15 border-purple-500/35 text-purple-300",
                flavors: "bg-pink-500/15 border-pink-500/35 text-pink-300",
                countries:
                  "bg-emerald-500/15 border-emerald-500/35 text-emerald-300",
                specials: "bg-amber-500/15 border-amber-500/35 text-amber-300",
                upgrades: "bg-sky-500/15 border-sky-500/35 text-sky-300",
                time: "bg-violet-500/15 border-violet-500/35 text-violet-300",
                misc: "bg-rose-500/15 border-rose-500/35 text-rose-300",
                combos: "bg-teal-500/15 border-teal-500/35 text-teal-300",
                events: "bg-orange-500/15 border-orange-500/35 text-orange-300",
                legend: "bg-yellow-600/15 border-yellow-600/35 text-yellow-200",
                secrets:
                  "bg-indigo-500/15 border-indigo-500/35 text-indigo-300",
                quirks:
                  "bg-fuchsia-500/15 border-fuchsia-500/35 text-fuchsia-300",
                levels: "bg-lime-500/15 border-lime-500/35 text-lime-300",
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
                  <span className="text-xs font-bold truncate">{ach.name}</span>
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
        const catAchs = ACHIEVEMENTS.filter((a) => a.category === cat);
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
                const earned = state.earnedAchievements.includes(ach.id);
                const progress = !earned ? getAchievementProgress(ach) : null;
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
                            Math.min(progress.current, progress.target),
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
}
