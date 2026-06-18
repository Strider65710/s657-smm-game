import { useState, useEffect } from "react";
import {
  Sparkles, Sun, Milk, TrendingUp, Palette, Music, Snowflake, MapPin,
  Download, Upload, FileDown, FileUp, Megaphone, RefreshCw, ZapOff,
  Monitor, Type, Save, Lock,
} from "lucide-react";
import { GameState } from "../../types";
import { BACKGROUNDS } from "../../constants";

const DARK_MODE_DEFAULT_BG_INDEX = Math.max(0, BACKGROUNDS.findIndex(bg => String(bg.name).toLowerCase() === "rainforest cafe"));
const LIGHT_MODE_DEFAULT_BG_INDEX = Math.max(0, BACKGROUNDS.findIndex(bg => String(bg.name).toLowerCase() === "lounge"));

interface SettingsPanelProps {
  state: GameState;
  setState: (fn: (prev: GameState) => GameState) => void;
  isLightMode: boolean;
  appVersion: string;
  saveNow: () => void;
  addNotification: (msg: string, type: string) => void;
  onExportSave: () => void;
  onImportSave: () => void;
  onExportSaveFile: () => void;
  onImportSaveFile: () => void;
  onResetGame: (opts: { keepOptions: boolean }) => void;
  onResetSettings: () => void;
  onShowModal: (modal: { title: string; msg: string; type: "danger" | "info"; onConfirm: () => void }) => void;
  backgroundsUnlocked: boolean;
}

export default function SettingsPanel({
  state,
  setState,
  isLightMode,
  appVersion: _appVersion,
  saveNow,
  addNotification,
  onExportSave,
  onImportSave,
  onExportSaveFile,
  onImportSaveFile,
  onResetGame,
  onResetSettings,
  onShowModal,
  backgroundsUnlocked,
}: SettingsPanelProps) {
  const [guiPreview, setGuiPreview] = useState(state.options.guiScale);
  const [txtPreview, setTxtPreview] = useState(state.options.textScale);

  useEffect(() => { setGuiPreview(state.options.guiScale); }, [state.options.guiScale]);
  useEffect(() => { setTxtPreview(state.options.textScale); }, [state.options.textScale]);

  return (
    <div className="space-y-6">
      {/* ── Save & Load ───────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase text-neutral-500 tracking-widest">
          Save &amp; Load
        </h3>
        <button
          onClick={() => {
            saveNow();
            addNotification("Game saved.", "save");
          }}
          className="w-full py-3 glass-panel flex items-center justify-center gap-2 hover:bg-white/10 text-sm font-black uppercase tracking-widest text-green-300 active:scale-95 transition-all border border-green-500/30"
        >
          <Save className="w-4 h-4" />
          Save Now
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onExportSave}
            className="glass-panel p-4 flex flex-col items-center gap-2 hover:bg-white/10"
          >
            <Download className="w-6 h-6 text-yellow-400" />
            <span className="text-[10px] font-bold uppercase">
              Copy Code
            </span>
          </button>
          <button
            onClick={onImportSave}
            className="glass-panel p-4 flex flex-col items-center gap-2 hover:bg-white/10"
          >
            <Upload className="w-6 h-6 text-blue-400" />
            <span className="text-[10px] font-bold uppercase">
              Paste Code
            </span>
          </button>
          <button
            onClick={onExportSaveFile}
            className="glass-panel p-4 flex flex-col items-center gap-2 hover:bg-white/10"
          >
            <FileDown className="w-6 h-6 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase">
              Save to File
            </span>
          </button>
          <button
            onClick={onImportSaveFile}
            className="glass-panel p-4 flex flex-col items-center gap-2 hover:bg-white/10"
          >
            <FileUp className="w-6 h-6 text-violet-400" />
            <span className="text-[10px] font-bold uppercase">
              Load from File
            </span>
          </button>
        </div>
      </div>

      {/* ── Display Scale ─────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase text-neutral-500 tracking-widest">
          Display Scale
        </h3>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-purple-400 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold">GUI Scale</h4>
                <span className="text-xs text-neutral-400">
                  {Math.round(guiPreview * 100)}%
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mb-2">
                Scales the entire UI. Release to apply.
              </p>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={guiPreview}
                onChange={(e) => setGuiPreview(Number(e.target.value))}
                onPointerUp={() =>
                  setState((prev) => ({
                    ...prev,
                    options: { ...prev.options, guiScale: guiPreview },
                  }))
                }
                className="w-full accent-purple-400"
              />
              <div className="flex justify-between text-[9px] text-neutral-600 mt-1">
                <span>50%</span>
                <span>100%</span>
                <span>150%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <Type className="w-5 h-5 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold">Text Scale</h4>
                <span className="text-xs text-neutral-400">
                  {Math.round(txtPreview * 100)}%
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mb-2">
                Adjusts font size only. Release to apply.
              </p>
              <input
                type="range"
                min={0.7}
                max={1.3}
                step={0.05}
                value={txtPreview}
                onChange={(e) => setTxtPreview(Number(e.target.value))}
                onPointerUp={() =>
                  setState((prev) => ({
                    ...prev,
                    options: { ...prev.options, textScale: txtPreview },
                  }))
                }
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] text-neutral-600 mt-1">
                <span>70%</span>
                <span>100%</span>
                <span>130%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── General Options ───────────────────────── */}
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
                {backgroundsUnlocked ? "Select your background theme" : "Unlocks at Level 12"}
              </p>
            </div>
          </div>
          {!backgroundsUnlocked ? (
            <div className="text-center py-3 text-xs text-neutral-500 flex flex-col items-center gap-1">
              <Lock className="w-4 h-4 opacity-40" />
              Reach Level 12 to customize the background
            </div>
          ) : (
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
          )}
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
        {/* Auto-Save Interval */}
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-sky-400" />
            <div>
              <h4 className="text-sm font-bold">Auto-Save Interval</h4>
              <p className="text-[10px] text-neutral-400">
                How often the game auto-saves. Press Ctrl+S to save now.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([30, 45, 60, 120, 240, Infinity] as const).map((secs) => (
              <button
                key={secs}
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    options: {
                      ...prev.options,
                      autoSaveInterval: secs,
                    },
                  }))
                }
                className={`py-1.5 rounded-lg text-xs font-black transition-all border ${
                  state.options.autoSaveInterval === secs
                    ? "bg-sky-500/30 border-sky-400 text-sky-200"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10"
                }`}
              >
                {isFinite(secs) ? `${secs}s` : "Never"}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Duration */}
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Megaphone className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="text-sm font-bold">
                Notification Duration
              </h4>
              <p className="text-[10px] text-neutral-400">
                How long popups stay visible. Click any notification to
                dismiss early.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {([3, 5, 8, 15, 30] as const).map((secs) => (
              <button
                key={secs}
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    options: { ...prev.options, notifDuration: secs },
                  }))
                }
                className={`py-1.5 rounded-lg text-xs font-black transition-all border ${
                  state.options.notifDuration === secs
                    ? "bg-amber-500/30 border-amber-400 text-amber-200"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10"
                }`}
              >
                {secs}s
              </button>
            ))}
          </div>
        </div>

        {/* Auto Idle Pause */}
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-violet-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold">Auto-Pause on Idle</h4>
                <p className="text-[10px] text-neutral-400">
                  Pauses and saves after 1 minute of no input.
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  options: {
                    ...prev.options,
                    autoIdlePause: !prev.options.autoIdlePause,
                  },
                }))
              }
              className={`shrink-0 w-12 h-6 rounded-full border-2 transition-all relative ${
                state.options.autoIdlePause
                  ? "bg-violet-500/40 border-violet-400"
                  : "bg-white/5 border-white/20"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                  state.options.autoIdlePause
                    ? "left-6 bg-violet-300"
                    : "left-0.5 bg-neutral-500"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 bg-red-900/20 rounded-xl border border-red-500/40">
        <h3 className="text-xs font-black uppercase text-red-500 tracking-widest flex items-center gap-2">
          <ZapOff className="w-3 h-3" /> Danger Zone
        </h3>
        <button
          onClick={() => {
            onShowModal({
              title: "Reset Settings",
              msg: "Reset all settings (graphics, background, etc.) back to defaults?\n\nThis does NOT delete your game progress.",
              type: "danger",
              onConfirm: () => onResetSettings(),
            });
          }}
          className="w-full py-3 bg-orange-600/20 hover:bg-orange-600/40 text-orange-100 font-black text-xs rounded-xl uppercase tracking-[0.2em] border border-orange-500/50 transition-all active:scale-95 flex items-center justify-center gap-2"
          title="Reset settings to defaults"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Settings
        </button>
        <button
          onClick={(e: MouseEvent & { currentTarget: HTMLButtonElement }) => {
            const fullWipe = e.shiftKey;
            onShowModal({
              title: fullWipe ? "FULL WIPE" : "Hard Reset",
              msg: fullWipe
                ? "FULL WIPE — Are you 100% sure?\n\nThis erases EVERYTHING: all progress, flavors, countries, AND your settings — and replays the first-time tutorials as if you just installed the game. This CANNOT be undone!"
                : "Are you 100% sure?\nYou will lose all progress including flavors, countries, etc. (your settings are kept). This CANNOT be undone!",
              type: "danger",
              onConfirm: () => {
                onResetGame({ keepOptions: !fullWipe });
              },
            });
          }}
          className="w-full py-3 bg-red-600/20 hover:bg-red-600/40 text-red-100 font-black text-xs rounded-xl uppercase tracking-[0.2em] shadow-lg shadow-red-500/20 border border-red-500/50 transition-all active:scale-95"
          title="Click: reset progress (keeps settings). Shift+Click: full wipe — erases everything including settings and replays tutorials."
        >
          HARD RESET
        </button>
        <p className="text-[10px] text-red-300/70 text-center leading-relaxed">
          <strong>Tip:</strong> Hold{" "}
          <kbd className="px-1 py-0.5 rounded bg-red-500/20 border border-red-500/40 font-mono">
            Shift
          </kbd>{" "}
          while clicking Hard Reset for a <strong>full wipe</strong> —
          this also erases your settings and replays the tutorials, just
          like a fresh install.
        </p>
      </div>
    </div>
  );
}
