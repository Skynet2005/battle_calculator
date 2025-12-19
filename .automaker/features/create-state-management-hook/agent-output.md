## Summary

### What I Implemented

The `useBattleCalculatorState` hook was already implemented in the repository at `hooks/useBattleCalculatorState.ts` (688 lines). This comprehensive hook manages the entire application state for the Expedition Battle Calculator.

### Hook Features

The hook provides:

**State Management:**
- `currentProfile` / `setCurrentProfile` - Current user profile
- `activeTab` / `setActiveTab` - Main navigation tabs (profile, opponent, rally, results, howto)
- `profileSubTab` / `setProfileSubTab` - Player profile sub-tabs
- `opponentSubTab` / `setOpponentSubTab` - Opponent profile sub-tabs

**Computed Stats (via useMemo):**
- `playerBaseStats` / `opponentBaseStats` - Calculated base stats for both sides
- `playerCapacityReport` / `opponentCapacityReport` - Rally/march capacity breakdowns
- `simulatedFightResult` - Complete battle simulation results
- `playerJoinerInfo` / `opponentJoinerInfo` - Joiner bonus calculations

**Battle Context:**
- `simulatedPlayerContext` / `simulatedOpponentContext` - Full battle side contexts
- `fightSimulationError` - Error message if simulation fails

**Status Flags:**
- `profileLoaded`, `playerReady`, `opponentReady`, `rallyReady`, `fightReady`
- `roundsSimulated` - Number of battle rounds simulated

**Event Handlers:**
- `handleProfileChange` - Update current profile
- `handleSave` - Save profile to database
- `handleClearPlayerStorage` / `handleClearOpponentStorage` - Clear player/opponent data
- `handleTroopMixChange` - Update troop mix configuration

**Auto-Features:**
- Auto-calculation of rally bonuses when configuration changes
- Auto-save with 1.5s debounce and 3s grace period on profile load

### Tests Added

I created comprehensive tests at `__tests__/hooks/useBattleCalculatorState.test.ts` covering:

1. **Hook Return Type** - Verifies all 29 expected exports
2. **Type Definitions** - Tests UserProfile, BasicBonuses, AdditiveBonuses, MultiplicativeBonuses, RallyConfiguration structures
3. **Profile Validation** - UUID validation, required fields, optional opponent config
4. **TroopMixConfig** - Structure and ratio validation
5. **Tab Types** - Main tabs and sub-tabs
6. **Rally Configuration** - Leaders, joiners, special widget bonus, troop mix
7. **Status Flags Computation** - Ready state logic
8. **Helper Function Types** - Empty base stats creation

All **75 tests pass** (20 new tests + 55 existing tests).

### Notes for Developer

1. **ESLint Warnings**: There are 3 ESLint warnings about React hook dependencies. These are intentional to prevent infinite re-render loops - the dependencies are carefully chosen.

2. **TypeScript**: The hook file has no TypeScript errors. Existing TS errors in the codebase are in other files (API routes, components, docs).

3. **Integration**: The hook is fully integrated with `app/page.tsx` and properly distributes state to all tab components.

4. **Auto-Save**: The hook includes sophisticated auto-save logic with:
   - 1.5 second debounce after changes
   - 3 second grace period after profile load to prevent immediate save
   - UUID validation before saving
   - Error handling without alerting on auto-save failures