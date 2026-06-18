/**
 * @license
 * All Rights Reserved.
 */

import { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  Milk,
  Store,
  Palette,
  Globe,
  Coins,
  Wrench,
  Star,
  Trophy,
  Lightbulb,
  Keyboard,
  HelpCircle,
} from "lucide-react";
import { ALL_REPLAYABLE_GUIDES, type GuideStep } from "../guides";

type SectionProps = {
  title: string;
  icon: any;
  accentClass: string;
  children: any;
  defaultOpen?: boolean;
};

function Section({
  title,
  icon,
  accentClass,
  children,
  defaultOpen = false,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 transition-colors text-left`}
      >
        <span className={accentClass}>{icon}</span>
        <span
          className={`font-black uppercase tracking-widest text-[10px] flex-1 ${accentClass}`}
        >
          {title}
        </span>
        {open ? (
          <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-3 py-3 space-y-2 text-xs text-neutral-300 bg-black/20">
          {children}
        </div>
      )}
    </div>
  );
}

function Tip({ children }: { children: any }) {
  return (
    <div className="flex gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
      <Lightbulb className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

/**
 * Help tab — collapsible sections covering every game mechanic, plus replay
 * buttons for every tutorial guide.
 */
export default function HelpPanel({
  onReplay,
}: {
  onReplay: (steps: GuideStep[]) => void;
}) {
  return (
    <div className="space-y-2 p-1">
      {/* ── Replay Guides ── */}
      <div className="glass-panel p-3 space-y-2">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-sky-300/80">
          Replay a Guide
        </h4>
        <p className="text-[10px] text-neutral-400">
          Missed something? Replay any tutorial at any time.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ALL_REPLAYABLE_GUIDES.map((g) => (
            <button
              key={g.key}
              onClick={() => onReplay(g.steps)}
              title={`Replay the ${g.label} guide`}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-black uppercase tracking-wider text-[10px] bg-gradient-to-r from-sky-500/15 to-cyan-500/15 border border-sky-500/25 hover:from-sky-500/30 hover:to-cyan-500/30 transition-all text-sky-200"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{g.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Getting Started ── */}
      <Section
        title="Getting Started"
        icon={<Milk className="w-3.5 h-3.5" />}
        accentClass="text-pink-300"
        defaultOpen={true}
      >
        <p>
          You own a milkshake stand. Click the blender to make shakes, earn
          money, and reinvest into upgrades, staff, and global expansion.
        </p>
        <ol className="list-decimal list-inside space-y-1 pl-1">
          <li>Click the blender to blend your first shake</li>
          <li>Spend earnings on upgrades to earn more per blend</li>
          <li>Level up to unlock shops, employees, flavors, and more</li>
          <li>Hire employees for passive income — even when you're idle</li>
          <li>Expand globally for massive income multipliers</li>
        </ol>
        <Tip>
          Press <strong>Space</strong> or <strong>ESC</strong> to pause, and{" "}
          <strong>Ctrl+S</strong> to save instantly at any time.
        </Tip>
      </Section>

      {/* ── Making Money ── */}
      <Section
        title="Making Money"
        icon={<Coins className="w-3.5 h-3.5" />}
        accentClass="text-yellow-300"
      >
        <p>There are two main income sources:</p>
        <div className="space-y-2">
          <div className="bg-white/5 rounded-lg p-2">
            <p className="font-bold text-white mb-1">Manual Blending</p>
            <p>
              Click the blender jar to create a shake instantly. You earn 100%
              of the blend value, boosted by your upgrades, active flavors, and
              any active combo bonus. Enable <strong>Auto-Blend</strong> in the
              top left corner to blend automatically without clicking.
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <p className="font-bold text-white mb-1">
              Passive Income (Employees)
            </p>
            <p>
              Hired employees blend continuously in the background. They earn
              less per blend than manual, but they never stop. Hire more staff
              and fill every shop slot to maximize your income/s shown in the
              sidebar.
            </p>
          </div>
        </div>
        <Tip>
          Your <strong>income/s</strong> in the sidebar is the most important
          number — it tells you how fast your empire is growing without any
          clicks.
        </Tip>
      </Section>

      {/* ── Special Blend Outcomes ── */}
      <Section
        title="Special Blend Outcomes"
        icon={<Star className="w-3.5 h-3.5" />}
        accentClass="text-amber-300"
      >
        <p>
          Every manual blend has a chance to turn out extra special, earning
          bonus cash on top of the normal payout:
        </p>
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-white/10">
                <th className="px-2 py-1.5 text-left font-black uppercase tracking-wider text-white">
                  Outcome
                </th>
                <th className="px-2 py-1.5 text-left font-black uppercase tracking-wider text-white">
                  Chance
                </th>
                <th className="px-2 py-1.5 text-left font-black uppercase tracking-wider text-white">
                  Bonus
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="bg-white/5">
                <td className="px-2 py-1.5 text-orange-300 font-bold">
                  Crusty
                </td>
                <td className="px-2 py-1.5">10%</td>
                <td className="px-2 py-1.5">+$10</td>
              </tr>
              <tr className="bg-white/5">
                <td className="px-2 py-1.5 text-yellow-300 font-bold">Baked</td>
                <td className="px-2 py-1.5">5%</td>
                <td className="px-2 py-1.5">+$25</td>
              </tr>
              <tr className="bg-white/5">
                <td className="px-2 py-1.5 text-purple-300 font-bold">
                  Swirled
                </td>
                <td className="px-2 py-1.5">1%</td>
                <td className="px-2 py-1.5">+$100</td>
              </tr>
              <tr className="bg-white/5">
                <td className="px-2 py-1.5 text-yellow-400 font-bold">
                  Golden
                </td>
                <td className="px-2 py-1.5">0.1%</td>
                <td className="px-2 py-1.5">+$1,000</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          🎉 Outcomes <strong>stack</strong>! A single blend can be Crusty +
          Baked + Swirled + Golden simultaneously. The legendary full stack —
          <strong>
            {" "}
            "FAN FAVORITE: CREAMY CRUSTY BAKED SWIRLED GOLDEN DECORATED BLEND!"
          </strong>{" "}
          — has roughly a <strong>1 in 107 billion</strong> chance per blend.
        </p>
        <Tip>
          The <strong>Golden Touch</strong> special upgrade raises your Golden
          chance significantly. It's one of the best purchases in the game.
        </Tip>
      </Section>

      {/* ── Flavors & Combos ── */}
      <Section
        title="Flavors & Combos"
        icon={<Palette className="w-3.5 h-3.5" />}
        accentClass="text-purple-300"
      >
        <p>
          Unlocked at <strong>Level 1</strong>. Each flavor multiplies your
          blend income when active. You start with one active slot — unlock
          Multi-Flavor Blending from Upgrades to run two or three at once.
        </p>
        <p>
          Certain flavor pairs form <strong>Combos</strong>. Activate both
          flavors in a combo and a glowing badge appears near the blender — all
          income gets a flat multiplier bonus for as long as both flavors are
          active.
        </p>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
          <p className="font-bold text-purple-200 mb-1">Combo Tiers</p>
          <ul className="space-y-0.5 text-neutral-300">
            <li>• Common combos: +10–32% income</li>
            <li>• Rare combos: +38–62% income</li>
            <li>• Epic combos: +78–100% income</li>
          </ul>
        </div>
        <Tip>
          Check the combo list in the Flavors tab before unlocking — some flavor
          pairs give dramatically bigger bonuses than others.
        </Tip>
      </Section>

      {/* ── Upgrades ── */}
      <Section
        title="Upgrades"
        icon={<Wrench className="w-3.5 h-3.5" />}
        accentClass="text-orange-300"
      >
        <p>
          The Upgrades tab has two sections: <strong>Standard</strong> (tiered
          upgrades you level up repeatedly) and <strong>Special</strong>{" "}
          (one-time purchases that unlock at Level 8 and have the biggest
          individual impact).
        </p>
        <div className="space-y-1.5">
          <div className="bg-white/5 rounded-lg p-2">
            <p className="font-bold text-orange-200 mb-0.5">
              Standard Upgrades
            </p>
            <p>
              Blend Speed, Blender Power, Employee Training, Multi-Flavor
              Blending, and more. Each level costs more but compounds with your
              other multipliers.
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <p className="font-bold text-amber-200 mb-0.5">
              Special Upgrades (Level 8+)
            </p>
            <p>
              Double Shot (2× manual income), Golden Touch (raises golden shake
              chance), and other powerful one-time boosts. These are the
              single-best investments once you can afford them.
            </p>
          </div>
        </div>
        <Tip>
          Early game: prioritize Blend Speed and Blender Power. Mid game: fill
          shop slots with employees. Late game: Special Upgrades change
          everything.
        </Tip>
      </Section>

      {/* ── Shops & Employees ── */}
      <Section
        title="Shops & Employees"
        icon={<Store className="w-3.5 h-3.5" />}
        accentClass="text-emerald-300"
      >
        <p>
          <strong>Shops</strong> unlock at Level 3. Each shop extension raises
          your employee capacity by 1 and provides its own small passive income.
          You cannot hire more staff than your total shop count.
        </p>
        <p>
          <strong>Employees</strong> unlock at Level 5. They auto-blend at a
          fixed rate based on their tier. Higher-tier employees earn more per
          second but cost more to hire and have a higher monthly wage.
        </p>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          <p className="font-bold text-emerald-200 mb-1">Staff Loop</p>
          <p>
            Buy shops → hire employees → buy more shops → hire more → repeat.
          </p>
        </div>
        <p>
          <strong>Wage Management</strong> unlocks at Level 10. Paying higher
          wages boosts employee productivity. Every 30 in-game days (days tick
          at 1 second each) your payroll is deducted — make sure your income
          covers it.
        </p>
        <Tip>
          Always keep shop capacity a step ahead of your employee count so you
          can hire immediately when you have the cash.
        </Tip>
      </Section>

      {/* ── Level Progression ── */}
      <Section
        title="Level Progression"
        icon={<Trophy className="w-3.5 h-3.5" />}
        accentClass="text-cyan-300"
      >
        <p>
          XP is earned from blending, hiring, buying upgrades, unlocking
          flavors, and reaching money milestones. Each level up grants a cash
          bonus and may unlock a new feature.
        </p>
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-white/10">
                <th className="px-2 py-1.5 text-left font-black uppercase tracking-wider text-white">
                  Level
                </th>
                <th className="px-2 py-1.5 text-left font-black uppercase tracking-wider text-white">
                  Unlock
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="bg-white/5">
                <td className="px-2 py-1.5 font-bold text-cyan-300">1</td>
                <td className="px-2 py-1.5">Flavors</td>
              </tr>
              <tr className="bg-white/5">
                <td className="px-2 py-1.5 font-bold text-cyan-300">3</td>
                <td className="px-2 py-1.5">Shop Extensions</td>
              </tr>
              <tr className="bg-white/5">
                <td className="px-2 py-1.5 font-bold text-cyan-300">5</td>
                <td className="px-2 py-1.5">Employee Hiring</td>
              </tr>
              <tr className="bg-white/5">
                <td className="px-2 py-1.5 font-bold text-cyan-300">7</td>
                <td className="px-2 py-1.5">Shake Price Control</td>
              </tr>
              <tr className="bg-white/5">
                <td className="px-2 py-1.5 font-bold text-cyan-300">8</td>
                <td className="px-2 py-1.5">Special Upgrades</td>
              </tr>
              <tr className="bg-white/5">
                <td className="px-2 py-1.5 font-bold text-cyan-300">10</td>
                <td className="px-2 py-1.5">Wage Management</td>
              </tr>
              <tr className="bg-white/5">
                <td className="px-2 py-1.5 font-bold text-cyan-300">15</td>
                <td className="px-2 py-1.5">Global Expansion (Countries)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Tip>
          Auto-Blend and Background Customization are available from the start —
          no level gate. Background is a preference found in Settings.
        </Tip>
      </Section>

      {/* ── Global Expansion ── */}
      <Section
        title="Global Expansion"
        icon={<Globe className="w-3.5 h-3.5" />}
        accentClass="text-green-300"
      >
        <p>
          Unlocked at Level 15. Countries apply a multiplier to <em>all</em> of
          your income — employee output, manual blends, shop income, everything.
          Country multipliers stack with each other, so having multiple
          countries gives an exponential boost.
        </p>
        <p>
          Countries are expensive but worth saving for. Use your current
          income/s as a guide — if a country costs roughly what you'd earn in a
          few minutes, it's worth buying immediately.
        </p>
        <Tip>
          Unlock countries in order — each one compounds the income you use to
          afford the next. Skipping ahead is rarely more efficient.
        </Tip>
      </Section>

      {/* ── Events & Chronicle ── */}
      <Section
        title="Events & Chronicle"
        icon={<Star className="w-3.5 h-3.5" />}
        accentClass="text-sky-300"
      >
        <p>
          Random events fire periodically as your empire grows. There are two
          kinds:
        </p>
        <div className="space-y-1.5">
          <div className="bg-white/5 rounded-lg p-2">
            <p className="font-bold text-white mb-0.5">Choice Events</p>
            <p>
              A popup asks you to pick between two options — e.g. pay a fine,
              gamble an inspection, or invest in a viral campaign. Your choice
              has lasting effects (buffs, penalties, or money swings).
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <p className="font-bold text-white mb-0.5">Auto Events</p>
            <p>
              Smaller events that apply automatically — a fan surge that boosts
              your Fan Favorite chance, a viral moment, or a health scare.
              They're shown in a badge near the blender and expire after a few
              in-game days.
            </p>
          </div>
        </div>
        <p>
          The <strong>Event Chronicle</strong> button (top-left of the blender
          area) shows a log of every event you've resolved, newest first.
        </p>
        <Tip>
          Resolving an event counts toward the daily "Resolve 1 game event" goal
          — both auto and choice events qualify.
        </Tip>
      </Section>

      {/* ── Goals & Power-Ups ── */}
      <Section
        title="Goals & Power-Ups"
        icon={<Trophy className="w-3.5 h-3.5" />}
        accentClass="text-teal-300"
      >
        <div className="space-y-1.5">
          <div className="bg-white/5 rounded-lg p-2">
            <p className="font-bold text-teal-200 mb-0.5">
              Daily & Hourly Goals
            </p>
            <p>
              Five daily goals reset every 24 hours; three hourly goals reset
              every 60 minutes. Goals are seed-deterministic — everyone sees the
              same goals on the same real-world day and hour.
            </p>
            <p className="mt-1">
              Goal types: blend shakes manually, earn passive income, hire
              employees, resolve events, or buy upgrades. Rewards include XP,
              cash, or a short income buff. Click <strong>Claim</strong> once
              the progress bar fills.
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <p className="font-bold text-amber-200 mb-0.5">Active Power-Ups</p>
            <p>
              Consumable boosts found in the Upgrades tab under{" "}
              <strong>Power-Ups</strong>. Each power-up can be purchased (cost
              scales with your game days), stocked, then activated at will.
              Activation uses one charge and applies an income buff immediately.
            </p>
            <ul className="mt-1 space-y-0.5 text-neutral-300">
              <li>• Blender Fury — 3× income, 5 min</li>
              <li>• Sugar Rush — 2× income, 3 min</li>
              <li>• Employee Overtime — 4× income, 10 min</li>
              <li>• Lucky Batch — 5× income, 2 min</li>
            </ul>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <p className="font-bold text-violet-200 mb-0.5">
              Shift Manager (Offline Income)
            </p>
            <p>
              A special upgrade in the Upgrades tab that earns passive income
              while you're away. Level 1: 25% of normal income, capped at 1
              hour. Level 2: 50%, capped at 2 hours. A summary modal shows what
              you earned when you return.
            </p>
            <p className="mt-1 text-neutral-400">
              The game auto-pauses after 1 minute of inactivity (configurable in
              Settings) and saves your progress. The pause timer keeps your
              offline clock accurate.
            </p>
          </div>
        </div>
        <Tip>
          Stack power-ups with an active combo bonus and a country multiplier
          for exponential short-term gains — great for buying expensive upgrades
          or countries.
        </Tip>
      </Section>

      {/* ── Tips & Tricks ── */}
      <Section
        title="Tips & Tricks"
        icon={<Lightbulb className="w-3.5 h-3.5" />}
        accentClass="text-yellow-300"
      >
        <ul className="space-y-2">
          <li className="flex gap-2">
            <span className="text-yellow-400 font-black shrink-0">1.</span>
            <span>
              <strong>Upgrades first, employees second</strong> — early on,
              upgrades give better return on investment than hiring more staff.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-400 font-black shrink-0">2.</span>
            <span>
              <strong>Always keep shop capacity ahead</strong> of your employee
              count so you can hire the moment you have cash.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-400 font-black shrink-0">3.</span>
            <span>
              <strong>Flavor combos are huge</strong> — plan your flavor unlocks
              around high-tier combos to stack the multiplier bonus on all
              income.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-400 font-black shrink-0">4.</span>
            <span>
              <strong>Special Upgrades at Level 8</strong> — Double Shot and
              Golden Touch are among the biggest single-upgrade gains in the
              game.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-400 font-black shrink-0">5.</span>
            <span>
              <strong>Watch income/s, not money</strong> — income per second
              tells you how fast you're growing; money just tells you where you
              are right now.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-400 font-black shrink-0">6.</span>
            <span>
              <strong>Save often</strong> — the game auto-saves, but export your
              save code to a file for a reliable backup.
            </span>
          </li>
        </ul>
      </Section>

      {/* ── FAQ ── */}
      <Section
        title="Frequently Asked Questions"
        icon={<HelpCircle className="w-3.5 h-3.5" />}
        accentClass="text-sky-300"
      >
        <div className="space-y-3">
          <div>
            <p className="font-bold text-white">How do I earn money faster?</p>
            <p>
              Buy upgrades first — Blender Power and Blend Speed compound with
              everything else. Then fill shop slots with employees, and unlock
              flavor combos for passive multipliers.
            </p>
          </div>
          <div>
            <p className="font-bold text-white">
              Should I hire employees or buy upgrades?
            </p>
            <p>
              Early game: upgrades. Mid game: balance both. Late game: keep shop
              slots full and put savings into Special Upgrades and Countries.
            </p>
          </div>
          <div>
            <p className="font-bold text-white">
              What happens if I close the game?
            </p>
            <p>
              Your progress auto-saves to localStorage. It persists until you
              clear browser data. Use the Export Save feature for a portable
              backup you control.
            </p>
          </div>
          <div>
            <p className="font-bold text-white">
              How do I get Golden Milkshakes?
            </p>
            <p>
              There's a base 0.1% chance per blend. Buy the{" "}
              <strong>Golden Touch</strong> special upgrade (unlocks at Level 8)
              to significantly raise those odds.
            </p>
          </div>
          <div>
            <p className="font-bold text-white">
              What's the rarest possible blend?
            </p>
            <p>
              The fully-stacked "FAN FAVORITE: CREAMY CRUSTY BAKED SWIRLED
              GOLDEN DECORATED BLEND" — roughly 1 in 107 billion blends at base
              rates.
            </p>
          </div>
          <div>
            <p className="font-bold text-white">
              Does the game work on mobile?
            </p>
            <p>
              The browser version is touch-compatible — tap the blender just
              like clicking. The desktop app is Windows-only. Some layouts may
              need zoom adjustment on small screens.
            </p>
          </div>
        </div>
      </Section>

      {/* ── Keyboard Shortcuts ── */}
      <Section
        title="Keyboard Shortcuts"
        icon={<Keyboard className="w-3.5 h-3.5" />}
        accentClass="text-neutral-300"
      >
        <div className="space-y-1.5">
          {[
            ["Space / ESC", "Pause / Resume game"],
            ["Ctrl+S", "Save now"],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center gap-3">
              <kbd className="bg-white/10 border border-white/20 rounded px-2 py-0.5 font-mono text-[10px] text-white shrink-0">
                {key}
              </kbd>
              <span className="text-neutral-300">{desc}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
