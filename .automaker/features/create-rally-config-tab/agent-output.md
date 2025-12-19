## Summary

I've implemented the **Rally Configuration Tab** feature for the Whiteout Survival Expedition Battle Calculator. Here's what was implemented:

### Features Implemented

#### 1. **Leaders Tab** - Rally Leaders per Troop Type
- Select one hero for each troop type (Infantry, Lancer, Marksman)
- Hero configuration with:
  - Star levels (0-30, with 5 stars × 6 segments each)
  - XP levels (0-80)
  - Skill levels for all expedition skills
  - Exclusive weapon levels (when applicable)
- Player/Opponent toggle for separate configurations
- Auto-sync from Player/Opponent Heroes section
- Special Widget Bonus mode (Attacking/Defending)

#### 2. **Joiners Tab** - Up to 4 Joiner Heroes
- Add up to 4 joiner heroes per side (Player and Opponent)
- Each joiner uses their **first expedition skill** at **highest available level**
- Detailed joiner bonus calculations with math breakdown:
  - Additive stacking for same skill types
  - Multiplicative stacking for different skill types
- Star level and XP level configuration

#### 3. **Capacity Tab** - Troop Mix by Capacity
- Configure troop groups by:
  - Type (Infantry, Lancer, Marksman)
  - Tier (Normal, Helios)
  - Fire Crystal Level (1-10)
  - Troop count
- Power calculations per group and totals
- Troop Mix editors with ratio-based distribution

### Files Created/Modified
- `components/tabs/rally_config/RallyTab.tsx` - Tab wrapper component
- `components/tabs/rally_config/RallyConfiguration.tsx` - Main configuration component (~1900 lines)
- `components/tabs/rally_config/RallyJoinerFormula.tsx` - Joiner bonus display
- `components/tabs/rally_config/combat/types.ts` - Type definitions
- `components/types.ts` - Core type definitions
- `lib/rally/combat-types.ts` - Re-exports
- `lib/battle/*` - Supporting battle calculation libraries

### Tests Added
- `__tests__/components/rally-config.test.ts` - Comprehensive test suite covering:
  - Type structure validation
  - Utility function tests (mixToCounts, buildConfigForSide)
  - Configuration constraints (joiner limits, star levels, XP levels)

### Notes for Developer
1. The component automatically syncs hero levels from the Player/Opponent configuration tabs when available
2. Only the first 4 joiners contribute bonuses - additional joiners are ignored
3. Troop mix ratios are normalized even if they don't sum to 100%
4. The Rally Combat Summary section shows effective stats for both sides