## Summary

I have successfully implemented the UI adapter for the combat engine. Here's what was done:

### Changes Made

#### 1. **Enhanced `lib/combat/adapter.ts`**
- Added exported functions for bidirectional type mapping:
  - `toSideComposition(side, role)` - Converts UI `RallySideConfig` to engine `SideComposition`
  - `mapCounts(counts)` - Converts lowercase troop counts to PascalCase
  - `mapBaseStats(stats)` - Converts legacy base stats to engine format
  - `toLegacyFight(report)` - Converts `BattleReport` back to legacy `FightResult`
  - `toLegacyCounts(counts)` - Converts PascalCase counts to lowercase
  - `fromLegacyCounts(counts)` - Converts lowercase counts to PascalCase (new helper)

#### 2. **Updated `lib/combat/index.ts`**
- Added adapter exports section with all public adapter functions and types
- Exported `UISimulationInput` and `UISimulationOutput` types

#### 3. **Created `__tests__/lib/combat/adapter.test.ts`**
- 9 comprehensive tests covering:
  - Troop count conversion (both directions)
  - Base stats mapping
  - Side composition generation for attacker/defender roles
  - Full simulation with legacy FightResult compatibility
  - Winner flag verification in legacy format

### Key Features
1. **Bidirectional Mapping**: Converts between UI lowercase types (`infantry`, `lancer`, `marksman`) and engine PascalCase types (`Infantry`, `Lancer`, `Marksman`)
2. **Legacy Compatibility**: The `toLegacyFight` function ensures existing UI components continue to work with the `FightResult` format
3. **Type Safety**: All functions have proper TypeScript types for both input and output
4. **Full Integration**: `simulateBattleFromUI` provides a single entry point that returns both the new `BattleReport` and legacy `FightResult`

### Test Results
All 9 tests pass:
```
✓ __tests__/lib/combat/adapter.test.ts (9 tests) 8ms
Test Files: 1 passed (1)
Tests: 9 passed (9)
```

### Notes for the Developer
- The adapter currently maps basic configuration (troop counts, base stats). For more advanced features like hero skill extraction and damage modifier mapping from multiplicative bonuses, the `ExtendedRallySideConfig` interface has been defined but the full implementation would require integrating with the hero extraction system (`buildHeroCombatProfile`).
- The existing `useBattleCalculatorState` hook already uses `simulateBattleFromUI` correctly and will continue to work with these changes.