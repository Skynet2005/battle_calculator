![Expedition Battle Calculator favicon](public/favicon.png)

# Expedition Battle Calculator – Whiteout Survival

A Next.js 16 tool for planning rallies and simulating battles in Whiteout Survival. It models the game’s stacking rules, troop scaling, and rally composition so you can compare player vs. opponent setups with confidence.

## Table of Contents

- [Overview](#overview)
- [Feature Highlights](#feature-highlights)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [How to Use](#how-to-use)
- [Calculation Model](#calculation-model)
- [API Surface](#api-surface)
- [Project Structure](#project-structure)
- [Testing & Quality](#testing--quality)
- [Accuracy & Contributions](#accuracy--contributions)
- [License](#license)

## Overview

The calculator lets you:
- Configure a player and an opponent with full hero, gear, pet, research, and bonus data.
- Build a rally (leaders, joiners, troop mix, capacities) for both sides.
- Run deterministic or Monte Carlo simulations and review detailed breakdowns.
- Save multiple profiles to the database and quickly switch between them.

## Feature Highlights

- **Profile-aware UI**: Tabs for Player Setup, Opponent Setup, Rally Configuration, Results, and How To. Readiness chips show which steps still need data.
- **Server-backed profiles**: Profiles are stored via API routes (`profiles`, `profile-state`) in Postgres using Drizzle. Legacy shapes are migrated on load.
- **Rally builder**: Assign leaders per troop type, configure joiners, set capacity overrides, and normalize troop mixes before simulation.
- **Joiner stacking rules**: Same-type joiner bonuses add; different types multiply. The UI surfaces names and contribution breakdowns.
- **Simulation modes**: Monte Carlo (hit/miss variance) or deterministic expected value. Supports up to 1000 simulations per run.
- **Capacity and mix helpers**: Defaults to max-capacity values and clamps troop mixes to available capacity.
- **Admin area (scaffolded)**: Admin layout exists under `app/(admin)` for future dashboards.

## Quick Start

1. **Prerequisites**: Node 18.18+ and a Postgres database URL.
2. **Install**:
   ```bash
   npm install
   ```
3. **Configure env**: Create `.env.local` (see [Configuration](#configuration)).
4. **Run dev** (predev clears stale Turbopack locks):
   ```bash
   npm run dev
   # app: http://localhost:3000
   ```
5. **Build / serve**:
   ```bash
   npm run build
   npm start
   ```

## Configuration

Create `.env.local` with:
```
DATABASE_URL=postgres://user:pass@host:5432/dbname
AUTH_SECRET=your-long-random-string    # or NEXTAUTH_SECRET
```

Notes:
- Drizzle migrations run automatically at startup via `migrationsReady`. You can also run `npx drizzle-kit migrate` manually.
- Auth cookies are HTTP-only (`auth_token`), signed with the secret above.
- `npm run killports` is available if you need to free 3000/3001 on Windows.

## How to Use

1. **Authenticate**: Register or log in (cookies stored securely). The app will then load or prompt you to create a profile.
2. **Player Setup**: Enter commander basics, hero levels, gear, research, pets, charms, and other base stats. Defaults lean toward max values for convenience.
3. **Opponent Setup**: Mirror the same inputs for the defending side; defaults start at max hero/pet/research values with zeroed bonuses so you can dial down as needed.
4. **Rally Configuration**: Choose leaders per troop type, add joiners, set roles, and define troop mix/capacity. Joiner stacking and hero weapon effects flow into additive/multiplicative layers automatically.
5. **Results**: Pick Monte Carlo or deterministic mode, set simulation count, and view outcome, turn log, multipliers, and capacity breakdowns. Adjust troop mixes inline and rerun.
6. **How To**: Quick readiness checklist and troubleshooting if a tab is incomplete or a simulation failed.

## Calculation Model

- **Layering**: `(Basic + Additive) × Multiplicative`, with buffs/debuffs separated; formulas live in `lib/battle` and `lib/rally`.
- **Joiners**: Same-type skills add; different types multiply. Only the first four joiners count, and each uses its first expedition skill at its highest available level.
- **Troop scaling**: Damage scales with √(troop count); troop mixes are normalized to available capacity when missing or overfilled.
- **Simulation**: `simulateBattleFromUI` runs either Monte Carlo (variance) or expected value (average). Turn logs and per-side multipliers are displayed in Results.
- **Data sources**: Game data (heroes, pets, research, gear, charms, max levels, troop tiers) live under `lib/battle/data/**` and feed selectors and default builders.

## API Surface

All routes live under `app/api` and use Drizzle with Postgres:
- `POST /api/auth/register` – create user (hashed password).
- `POST /api/auth/login` – set `auth_token` cookie.
- `POST /api/auth/logout` – clear cookie.
- `GET /api/auth/me` – current user.
- `GET/POST /api/profiles` – list/create profiles; stores `data` payload plus metadata.
- `GET/PUT/DELETE /api/profiles/:id` – load/update/delete a profile.
- `GET/POST /api/profile-state` – get/set the current profile id (stored in `user_settings`).
- `GET /api/profile` / `DELETE /api/profile` – fetch or delete the authenticated user.
- `GET /api/joiners` – static joiner data for UI pickers.

Auth tokens are verified with `lib/auth.ts`; database access is configured in `lib/db/db.ts`.

## Project Structure

```
app/
  page.tsx, layout.tsx, globals.css
  (admin)/...           # admin layout + pages scaffold
  api/...               # auth, profiles, profile-state, joiners
components/
  BattleCalculatorPage.tsx
  auth/, layout/, profile/
  tabs/ (player, opponent, rally, results, how_to)
  ui/ (PageShell, SectionCard, StatTile, etc.)
hooks/
  useBattleCalculatorState.ts
lib/
  auth.ts, db/, battle/, rally/, combat/, profile-storage.ts, profile-migration.ts
schema/
  users.ts, profiles.ts, user-settings.ts, etc.
drizzle/
  migrations and meta
```

## Testing & Quality

- **Tests**: `npm test` (Vitest; unit coverage for battle logic and UI helpers).
- **Lint**: `npm run lint` (ESLint with Next.js config).
- **Types**: TypeScript is enforced; prefer strict types and Zod schemas for API payloads.

## Accuracy & Contributions

- Calculations aim to mirror in-game behavior; if you spot drift, open an issue with an in-game repro.
- Keep functions small and typed, prefer data-driven additions (extend `lib/battle/data/**`).
- When adding features, update migrations, API validators, and this README.

## License

This project is open source and provided free for the Whiteout Survival community under the MIT License.

**Non-Commercial Use**: This software is intended for personal, educational, and community use only. Commercial use, monetization, or redistribution for profit is strictly prohibited without explicit written permission from the project maintainers.

Use at your own discretion. The developers are not affiliated with Whiteout Survival or its publishers.
