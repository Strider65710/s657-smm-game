# Milkshake Mania

Milkshake Mania is an incremental, clicker-like game built with React + Vite. It features manual blending, passive income from employees, and a variety of upgrades and special outcomes.

**Game (v0.1-alpha)** now available [https://striderplays-smm.vercel.app/](https://striderplays-smm.vercel.app/)!

**Note:** For some reason, github in the code section may recognize .tsx files (react ts) as LaTeX.

## Gameplay (quick)

- Manual blending starts at **10s per blend** (upgradeable).
- Special outcomes are independent and can stack per blend:
  - **Crusty:** 10%
  - **Baked:** 5%
  - **Swirled:** 1%
  - **Golden:** 0.1%
- Employees provide passive income (automation is intentionally weaker than manual).

## Project structure

```text
src/
├── App.tsx        # Main UI + game loop
├── types.ts       # TypeScript types
├── state.ts       # Default state + save sanitizing (reset/import use this)
├── constants.ts   # Chances/multipliers/countries/backgrounds
├── registry.ts    # Content registries (shops, upgrades, flavors)
├── index.css      # Styling
└── main.tsx       # React entry
```

## Content systems (how to add things)

### Add / tweak upgrades

1. Add the upgrade key to `src/types.ts` (`GameState["upgrades"]`).
2. Set its default level in `src/state.ts` (`createDefaultState()`).
3. Define cost + text in `src/registry.ts` (`UPGRADE_REGISTRY`).
4. (Optional) Give it a custom icon/color in `src/App.tsx` (Upgrades tab `switch (key)`).

The upgrades UI is generated from `UPGRADE_REGISTRY`, so adding an upgrade usually does not require touching the UI.

### Add shop tiers (employees)

- Add a new entry in `src/registry.ts` (`SHOP_REGISTRY`).
- New tiers show up automatically via `INITIAL_SHOPS`.

### Add flavors

1. Add the enum variant in `src/types.ts` (`FlavorType`).
2. Add flavor info in `src/registry.ts` (`FLAVOR_REGISTRY`).

## Save / reset

- Auto-saves to localStorage key `milkshake-tycoon-v1`.
- Export copies a base64 save code to clipboard.
- Import opens a modal where you can paste the base64 code (or raw JSON).
- Hard Reset clears only this game’s save key and resets state (no page reload, does not wipe unrelated localStorage keys).

## Dev commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
npm run clean
```

Windows note:

- If PowerShell blocks `npm` scripts, use `npm.cmd` (example: `npm.cmd run dev`).

Vite note:

- Scripts use `--configLoader native` to avoid permission issues in restricted environments.
