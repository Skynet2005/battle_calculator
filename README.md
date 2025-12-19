# Expedition Battle Calculator - Whiteout Survival

A comprehensive, accurate battle calculator for planning expeditions and rallies in Whiteout Survival. This tool implements all the game's battle mechanics and formulas to help players optimize their troop formations and predict battle outcomes.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [How It Works](#how-it-works)
  - [Profile System](#profile-system)
  - [Rally Configuration](#rally-configuration)
  - [Joiner Skill Stacking](#joiner-skill-stacking)
  - [Calculation System](#calculation-system)
- [Usage Guide](#usage-guide)
- [Battle Mechanics](#battle-mechanics)
- [Technical Architecture](#technical-architecture)
- [Data Files](#data-files)
- [Technology Stack](#technology-stack)

## Features

### Core Calculations
- **Final Stats Calculation**: Implements the complete formula:
  - `Final Bonus = (Basic Bonus + Additive Bonuses) × Multiplicative Bonuses`
- **Accurate Formula Implementation**: Uses the actual game formula for multiplicative bonuses:
  - `X' = X × (1 + Σyᵢ%) + Σyᵢ − Σzⱼ ÷ (1 + Σzⱼ%)`
- **Troop Scaling**: Properly implements √(troop count) scaling for damage calculations

### User Profile System
- **Save/Load Profiles**: Create multiple profiles to save different configurations
- **Auto-Save**: Changes are automatically saved to local storage with debouncing
- **Profile Migration**: Automatically migrates old profile formats to new structures
- **Persistent Storage**: All data stored in browser local storage

### Rally System
- **Leader Configuration**: Select one Infantry, one Lancer, and one Marksman hero as leaders
- **Leader Skills**: Configure skill levels and exclusive weapon levels for each leader
- **Joiner System**: Add up to 4 joiners (only first 4 contribute bonuses)
- **Joiner Skills**: Each joiner uses their first expedition skill at maximum available level
- **Auto-Calculation**: Rally bonuses automatically populate Additive and Multiplicative tabs
- **Troop Capacity**: Configure troop types, tiers, Fire Crystal levels, and counts

### Joiner Skill Stacking (Advanced)
- **Same Skill Type → Additive**: If two joiners have the same type of bonus (e.g., both +DMG), their bonuses add together
  - Example: Jesse Lvl 2 (+10% DMG) + Jesse Lvl 5 (+25% DMG) = +35% DMG total
- **Different Skill Types → Multiplicative**: If joiners have different types (e.g., +DMG and +ATK), they multiply
  - Example: Jesse (+25% DMG) × Reina (+10% ATK) = Base × 1.25 × 1.10 = 1.375 (137.5%)
- **Visual Math Display**: See the exact calculation breakdown in the Rally Configuration tab

### Bonus Sources Supported

#### Basic Bonuses (Permanent Additives)
- ✅ Combat Tech (Research) - Troop-Type and Total Troop bonuses
- ✅ Alliance Tech (max +10% to ATK, DEF, LETH, HP)
- ✅ Experts (Cyrille, Agnes, Holger, Romulus, Baldur, Fabian) - Auto-calculated from level
- ✅ Daybreak Island decorations
- ✅ Pets (levels/breakthroughs = ATK/DEF; refinements = LETH/HP)
- ✅ Stacked Skins (Castle, Avatar, Relocation, Chat)
- ✅ Hero (Leader) - Rally lead bonuses (auto-calculated from Rally Configuration)
- ✅ Chief Gear (6 pieces + set bonus) - ATK/DEF only
- ✅ Charms - LETH/HP only, organized by gear piece and troop type:
  - Cap & Watch: Lancer Lethality/Health
  - Coat & Pants: Infantry Lethality/Health
  - Ring & Weapon: Marksman Lethality/Health
- ✅ Hero Gear - Troop-type specific bonuses (Goggles/Boot = LETH, Glove/Belt = HP, plus empowerment bonuses)
- ✅ Alliance Facilities (up to +13% ATK/DEF)
- ✅ Special Heroes (Jeronimo: +15% LETH & HP, Natalia: +10% ATK & DEF)
- ✅ VIP Prestige
- ✅ Globe (VIP Skin)

#### Additive Bonuses (Flat % Layers)
- ✅ Temporary Events (manual input)
- ✅ Supreme President skills (manual input)
- ✅ Special Buffs (auto-calculated from Rally Configuration - includes leader skills and joiner bonuses)

#### Multiplicative Bonuses (Scaling Buffs & Debuffs)
- ✅ Castle Buffs (manual input)
- ✅ Event Buffs (manual input)
- ✅ Active Pet Skills (manual input)
- ✅ Combat Buffs/Debuffs (manual input)
- ✅ Exclusive Weapon Effects (auto-calculated from Rally Configuration leaders)
- ✅ Alliance Territory bonuses (manual input)
- ✅ Tyrant Spire Skills (manual input)

### Battle Tools
- **Battle Predictor**: Calculate battle outcomes using the balance equation
- **Troop Ratio Calculator**: Optimize troop formations (Infantry/Lancer/Marksman ratios)
- **Damage Calculator**: Calculate damage for mixed troop types
- **Power Index**: Predict win probability based on stats and troop count (formatted as full numbers, not scientific notation)

### UI Features
- **Light/Dark Theme**: Toggle between light and dark themes with system preference detection
- **Tabbed Interface**: Organized tabs for Profile, Basic Bonuses, Additive, Multiplicative, Rally Configuration, and Results
- **Auto-Defaults**: All dropdowns default to maximum levels if not saved otherwise
- **Real-Time Calculations**: All calculations update automatically as you change inputs
- **Visual Feedback**: Color-coded results and clear formatting for large numbers

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set environment variables (create `.env.local`):
```bash
DATABASE_URL=postgres://user:pass@host:5432/dbname
AUTH_SECRET=your-long-random-string
NEXTAUTH_SECRET=your-long-random-string
```

3. Run the development server (kills any old Next.js on 3000 before starting):
```bash
npm run dev
```

This runs a predev hook that frees port 3000 and clears stale Turbopack locks, so the app stays on `http://localhost:3000`.

4. Open [http://localhost:3000](http://localhost:3000) in your browser

> Migrations: Drizzle migrations run at startup (via `migrationsReady`) and you can also apply them manually with `npx drizzle-kit migrate` if needed.

## Building for Production

```bash
npm run build
npm start
```

## How It Works

### Profile System

The application uses a profile-based system where all user inputs are stored in a `UserProfile` object. This allows users to:

1. **Create Multiple Profiles**: Save different configurations for different scenarios
2. **Auto-Save**: Changes are automatically saved to local storage after 2 seconds of inactivity (debounced)
3. **Load Profiles**: Switch between saved profiles instantly
4. **Delete Profiles**: Remove profiles you no longer need

**Profile Structure:**
```typescript
interface UserProfile {
  id: string;
  name: string;
  basicBonuses: BasicBonuses;
  additiveBonuses: AdditiveBonuses;
  multiplicativeBonuses: MultiplicativeBonuses;
  rally: RallyConfiguration;
}
```

**Storage:**
- Profiles are stored in browser `localStorage` under the key `wos_battle_calculator_profiles`
- Current profile is stored under `wos_battle_calculator_current_profile`
- Theme preference is stored under `wos_battle_calculator_theme`

**Migration:**
- The system automatically migrates old profile formats to new structures
- Charm structures are migrated from flat objects to troop-type specific objects
- Hero gear structures are automatically initialized if missing

### Rally Configuration

The Rally Configuration system is the heart of expedition planning. It consists of three main components:

#### 1. Leaders (3 Required)
- **One Infantry Hero**: Select an Infantry-class hero as the Infantry leader
- **One Lancer Hero**: Select a Lancer-class hero as the Lancer leader
- **One Marksman Hero**: Select a Marksman-class hero as the Marksman leader

**Leader Configuration:**
- **Hero Selection**: Choose from available heroes filtered by class
- **Star Level**: Set the hero's star level (0-5)
- **Generation**: Automatically detected from hero data
- **Exclusive Weapon Level**: Set if the hero has an exclusive weapon
- **Expedition Skills**: Configure skill levels for each expedition skill

**Leader Bonuses:**
- **Basic Bonuses**: Hero base stats (ATK/DEF from rarity × gen × star level) go to Basic Bonuses
- **Additive Bonuses**: Leader expedition skills contribute to Additive Bonuses (Special Buffs)
- **Multiplicative Bonuses**: Exclusive weapon expedition skills contribute to Multiplicative Bonuses

#### 2. Joiners (Up to 4)
- **First 4 Only**: Only the first 4 joiners in the list contribute bonuses
- **First Skill Only**: Each joiner uses only their first expedition skill
- **Maximum Level**: The first skill uses its highest available skill level (not level 1)

**Joiner Configuration:**
- **Hero Selection**: Choose any hero (not restricted by class)
- **Star Level**: Set the hero's star level (0-5)
- **Skills**: Automatically set to maximum level (not user-configurable)

**Joiner Bonuses:**
- All joiner bonuses go to **Additive Bonuses (Special Buffs)**
- Bonuses are categorized by skill type (damage, attack, defense, health, lethality)
- Same-type bonuses are summed (additive stacking)
- Different-type bonuses multiply (multiplicative stacking)

#### 3. Troop Capacity
Configure the actual troops in your rally:

- **Troop Type**: Infantry, Lancer, or Marksman
- **Tier**: Normal or Helios
- **Fire Crystal Level**: 1-10
- **Count**: Number of troops in this group

**Power Calculation:**
- Each troop group's power is calculated as: `Troop Power × Count`
- Total power is the sum of all groups
- Base stats are displayed for each troop type/tier/FC level combination

### Joiner Skill Stacking

This is one of the most complex and important features. Understanding how joiner skills stack is crucial for optimizing rallies.

#### Skill Type Categorization

Each joiner's first skill is categorized into one of five types:
1. **Damage (DMG)**: Skills that increase damage dealt (e.g., `damage_dealt_increase`, `damage_boost`)
2. **Attack (ATK)**: Skills that increase attack stat (e.g., `attack_increase`)
3. **Defense (DEF)**: Skills that increase defense stat (e.g., `defense_increase`)
4. **Health (HP)**: Skills that increase health stat (e.g., `health_increase`)
5. **Lethality (LETH)**: Skills that increase lethality stat (e.g., `lethality_increase`)

#### Stacking Rules

**Rule 1: Same Skill Type → Additive**
- If multiple joiners have the same skill type, their bonuses are added together
- Example:
  - Joiner 1: Jesse (Level 2) → +10% DMG
  - Joiner 2: Jesse (Level 5) → +25% DMG
  - **Total DMG Bonus = 10% + 25% = +35%**

**Rule 2: Different Skill Types → Multiplicative**
- If joiners have different skill types, their effects multiply
- Example:
  - Joiner 1: Jesse → +25% DMG
  - Joiner 2: Reina → +10% ATK
  - **Final = Base × (1 + 25%) × (1 + 10%) = Base × 1.25 × 1.10 = 1.375 (137.5%)**

#### Calculation Example

Let's say you have 4 joiners:
1. Jesse (Level 5) → +25% DMG
2. Jesse (Level 2) → +10% DMG
3. Reina (Level 3) → +15% ATK
4. Marcus (Level 4) → +20% HP

**Step 1: Group by Type**
- DMG: [25%, 10%] → Sum = 35%
- ATK: [15%] → Sum = 15%
- HP: [20%] → Sum = 20%

**Step 2: Apply Stacking**
- Same types (DMG) are added: 25% + 10% = 35%
- Different types multiply: Base × (1 + 35%) × (1 + 15%) × (1 + 20%)
- **Final = 1 × 1.35 × 1.15 × 1.20 = 1.863 (186.3%)**

#### Visual Display

The Rally Configuration tab shows:
- Each joiner's skill type and bonus value
- How same types are summed (e.g., "10% + 25% = 35%")
- The final multiplicative formula
- The calculated result with Base = 1

### Calculation System

The calculation system processes bonuses in a specific order:

#### Step 1: Calculate Basic Bonus
```typescript
Basic Bonus = Combat Tech + Alliance Tech + Experts + Daybreak Island +
              Pets + Stacked Skins + Hero (Leader) + Chief Gear + Charms +
              Hero Gear + Alliance Facilities + Special Heroes + VIP Prestige + Globe
```

**Notes:**
- All basic bonuses are permanent and additive
- Some bonuses are troop-type specific (Combat Tech, Charms, Hero Gear)
- Alliance Tech is capped at +10% per stat
- Alliance Facilities are capped at +13% ATK/DEF

#### Step 2: Calculate Additive Bonus
```typescript
Additive Bonus = Temporary Events + Supreme President + Special Buffs
```

**Special Buffs include:**
- Leader expedition skill bonuses (from Rally Configuration)
- Joiner bonuses (from Rally Configuration, with proper stacking applied)

#### Step 3: Combine Basic + Additive
```typescript
Base Stats = Basic Bonus + Additive Bonus
```

#### Step 4: Apply Multiplicative Bonuses
```typescript
Final Stat = Base Stat × (1 + Σbuff%) / (1 + Σdebuff%)
```

**Multiplicative bonuses include:**
- Castle Buffs
- Event Buffs
- Pet Skills
- Combat Buffs
- Combat Debuffs (applied as division)
- Exclusive Weapon Effects (from Rally Configuration leaders)
- Alliance Territory
- Tyrant Spire

**Formula Details:**
```
X' = X × (1 + Σyᵢ%) + Σyᵢ − Σzⱼ ÷ (1 + Σzⱼ%)
```
Where:
- X = Base stat after Basic + Additive
- Σyᵢ% = Sum of all buff percentages
- Σyᵢ = Sum of flat buff bonuses (rare, typically 0)
- Σzⱼ% = Sum of all debuff percentages
- Σzⱼ = Sum of flat debuff bonuses (rare, typically 0)

#### Step 5: Calculate Final Stats
The final stats are calculated for each troop type (Infantry, Lancer, Marksman) separately, as some bonuses are troop-type specific.

## Usage Guide

### Step 1: Create or Load a Profile
1. Navigate to the "Profile" tab
2. Either create a new profile or load an existing one
3. Profiles are automatically saved as you make changes

### Step 2: Configure Rally Leaders
1. Navigate to the "Rally Configuration" tab
2. Click on the "Leaders (3)" tab
3. For each troop type (Infantry, Lancer, Marksman):
   - Select a hero from the dropdown
   - Set the star level (0-5)
   - If the hero has an exclusive weapon, set its level
   - Configure expedition skill levels
4. Leader bonuses are automatically calculated and added to Basic/Additive/Multiplicative bonuses

### Step 3: Configure Rally Joiners
1. In the "Rally Configuration" tab, click on the "Joiners" tab
2. Click "+ Add Joiner" to add joiners (up to 4)
3. For each joiner:
   - Select a hero
   - Set the star level
   - The system automatically uses the first expedition skill at maximum level
4. View the stacking calculations at the bottom:
   - See each joiner's skill type and bonus
   - See how same types are summed
   - See the final multiplicative formula and result

### Step 4: Configure Troop Capacity
1. In the "Rally Configuration" tab, click on the "Troop Capacity" tab
2. For each troop type, click "+ Add Group"
3. Configure:
   - Tier (Normal or Helios)
   - Fire Crystal Level (1-10)
   - Troop Count
4. View total power and count for each troop type

### Step 5: Input Basic Bonuses
1. Navigate to the "Basic Bonuses" tab
2. Use the sub-tabs to configure:
   - **Experts**: Select expert levels (defaults to max)
   - **Chief Gear**: Select gear pieces and levels (defaults to max)
   - **Charms**: Select charm levels for each gear piece (defaults to max)
     - Cap & Watch: Lancer Lethality/Health
     - Coat & Pants: Infantry Lethality/Health
     - Ring & Weapon: Marksman Lethality/Health
   - **Research**: Select research levels (defaults to max)
   - **War Academy**: Select tech levels (defaults to max)
   - **Hero Gear**: Configure hero gear for each troop type (defaults to max)
   - **Other**: Input remaining basic bonuses manually

### Step 6: Input Additive Bonuses
1. Navigate to the "Additive" tab
2. Input:
   - **Temporary Events**: Event bonuses
   - **Supreme President**: Skill bonuses
   - **Special Buffs**: Read-only, auto-calculated from Rally Configuration

### Step 7: Input Multiplicative Bonuses
1. Navigate to the "Multiplicative" tab
2. Input:
   - **Castle Buffs**: Castle-specific buffs
   - **Event Buffs**: Event-specific buffs
   - **Pet Skills**: Active pet skill bonuses
   - **Combat Buffs/Debuffs**: Combat modifiers
   - **Exclusive Weapon**: Read-only, auto-calculated from Rally Configuration
   - **Alliance Territory**: Territory bonuses
   - **Tyrant Spire**: Spire skill bonuses

### Step 8: View Results
1. Navigate to the "Results" tab
2. Select a troop type (Infantry, Lancer, or Marksman)
3. View:
   - **Final Stats**: Calculated final stats for the selected troop type
   - **Battle Predictor**: Compare attacker vs defender stats
   - **Troop Ratio Calculator**: Optimize troop formations
   - **Power Index**: See the full number (not scientific notation)

## Battle Mechanics

### Damage Formula
```
Damage ≈ Hidden Factor × √(Troop Count) × Attack × Lethality ÷ Enemy Defense
```

### Balance Equation
```
(Attacker_HP × Attacker_ATK × Attacker_LETH × Attacker_DEF) /
(Defender_HP × Defender_ATK × Defender_LETH × Defender_DEF) =
(Defender_Troops / Attacker_Troops)^1.5
```
- **> 1** = Attacker wins
- **< 1** = Defender holds

### Power Index
```
(1+ATK%) × (1+LETH%) × (1+DEF%) × (1+HP%) × (Troop Count)^1.5
```
The Power Index is displayed as a full number (e.g., "822,000,000,000") rather than scientific notation.

### Troop Scaling
- **< 5k troops**: Nearly linear scaling
- **5k+ troops**: √ scaling (diminishing returns)
- Doubling troops from 10k to 20k gives ~41% more damage, not 100%

### Mixed Troop Damage
When using mixed troop types, damage is calculated with ratio adjustments:
- Each troop type contributes based on its ratio in the formation
- Final damage is the weighted sum of each type's contribution

## Technical Architecture

### File Structure
```
├── app/
│   ├── page.tsx              # Main application component
│   ├── layout.tsx            # Root layout with theme provider
│   └── globals.css           # Global styles and theme variables
├── components/
│   ├── ProfileManager.tsx   # Profile creation/loading/deletion
│   ├── RallyConfiguration.tsx # Rally setup (leaders, joiners, capacity)
│   ├── DataSelectors.tsx     # Basic bonus input components
│   ├── AdditiveBonusesInput.tsx # Additive bonus inputs
│   ├── MultiplicativeBonusesInput.tsx # Multiplicative bonus inputs
│   ├── BattlePredictor.tsx   # Battle outcome prediction
│   ├── TroopRatioCalculator.tsx # Troop formation optimizer
│   ├── RallyJoinerFormula.tsx # Joiner formula explanation
│   ├── ThemeToggle.tsx       # Theme switcher
│   ├── HeroGearSelector.tsx  # Hero gear configuration
│   └── [data folders]/       # Game data files
├── lib/
│   ├── calculations.ts       # Core calculation engine
│   ├── rally-bonus-extractor.ts # Rally bonus extraction and stacking
│   ├── data-extractors.ts   # Data extraction from game files
│   ├── data-selectors.ts    # Data selection helpers
│   ├── profile-storage.ts   # Profile persistence
│   ├── profile-migration.ts # Profile format migration
│   ├── max-levels.ts        # Maximum level helpers
│   ├── hero-gear-extractor.ts # Hero gear bonus calculation
│   ├── theme-context.tsx    # Theme management
│   └── types.ts             # TypeScript type definitions
└── README.md
```

### Key Components

#### `lib/calculations.ts`
- Core calculation engine
- Implements all battle formulas
- Handles Basic, Additive, and Multiplicative bonus calculations
- Calculates final stats for each troop type

#### `lib/rally-bonus-extractor.ts`
- Extracts bonuses from Rally Configuration
- Implements joiner skill stacking logic
- Categorizes skills by type (damage, attack, defense, health, lethality)
- Applies additive stacking for same types
- Applies multiplicative stacking for different types

#### `lib/data-extractors.ts`
- Extracts bonus values from game data files
- Functions for Experts, Chief Gear, Charms, Research, War Academy, Heroes

#### `lib/profile-storage.ts`
- Manages profile persistence in local storage
- Handles profile CRUD operations
- Auto-saves with debouncing

#### `lib/profile-migration.ts`
- Migrates old profile formats to new structures
- Ensures backward compatibility

### Data Flow

1. **User Input** → Profile State
2. **Rally Configuration** → Auto-calculated bonuses (via `calculateRallyBonuses`)
3. **Profile State** → Final Stats Calculation (via `calculateFinalStats`)
4. **Final Stats** → Battle Predictor / Results Display

### State Management

- **React Hooks**: `useState` for component state, `useEffect` for side effects
- **Local Storage**: Persistent storage for profiles and theme
- **Context API**: Theme management across the application
- **Auto-Calculation**: `useEffect` hooks automatically recalculate when dependencies change

## Data Files

The calculator uses data from the following files in the `components/` directory:

- `components/experts/` - Expert level bonuses (Cyrille, Agnes, Holger, Romulus, Baldur, Fabian)
- `components/chief_gear/` - Chief gear stats and bonuses
- `components/chief_charms/` - Charm bonuses by level
- `components/research/` - Research tree data and bonuses
- `components/war_academy/` - War Academy tech data
- `components/heroes/` - Hero data, skills, and exclusive weapons
- `components/hero_gear/` - Hero gear data and calculation functions
- `components/troop_levels/` - Troop definitions by tier and Fire Crystal level
- `components/pets/` - Pet skill data
- `components/exclusive_weapons/` - Exclusive weapon data

All data files are TypeScript modules that export structured data objects.

## Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **React Hooks** - State management and side effects
- **CSS Variables** - Theming system (light/dark mode)
- **Local Storage API** - Profile persistence
- **React Context API** - Theme management

## Recommended Formations

- **Attacking**: 50% Infantry / 20% Lancers / 30% Marksmen
- **Defending**: 60% Infantry / 40% Lancers / 0% Marksmen
- **PvP**: 30% Infantry / 30% Lancers / 40% Marksmen

## Accuracy Notes

- Battle reports round to 1 decimal, but the game uses 2 decimals internally
- ±0.1% variance is normal due to rounding
- All calculations use the exact formulas from the game mechanics
- The calculator prioritizes accuracy over speed
- Joiner stacking follows the documented rules: same type = additive, different types = multiplicative

## Contributing

Accuracy is the top priority. If you find any discrepancies with actual game mechanics, please report them. When contributing:

1. Ensure all calculations match the game's formulas exactly
2. Test with known values from the game
3. Update this README if adding new features
4. Maintain type safety with TypeScript
5. Follow the existing code style and structure

## License

This project is a tool for the Whiteout Survival game community. Use at your own discretion.
