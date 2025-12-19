All files are staged. Let me provide a summary of what was implemented:

## Summary

I've successfully implemented the **Results Tab** feature for the Expedition Battle Calculator. Here's what was created:

### Files Created

**New Components (`components/tabs/results/`):**

1. **`ResultsTab.tsx`** - Main Results tab component with:
   - Overview section with battle prediction summary and quick stats
   - Tabbed navigation between different result views
   - Export functionality (copy to clipboard, download JSON)

2. **`CalculatedStatsSection.tsx`** - Displays final calculated stats:
   - Stats tables for player and opponent (by troop type)
   - Visual comparison bar charts for each troop type

3. **`CapacityReportSection.tsx`** - Shows capacity breakdowns:
   - Rally/Deployment capacity for both sides
   - March/Squad capacity for both sides
   - Detailed bonus breakdowns with sources
   - Comparison visualizations

4. **`BattlePredictionSection.tsx`** - Battle prediction feature:
   - Winner prediction with confidence level
   - Power Index gauge visualization
   - Balance ratio display
   - Damage estimates comparison
   - Formula explanations (collapsible)

5. **`JoinerBreakdownSection.tsx`** - Joiner skill analysis:
   - Individual joiner cards with skill details
   - Bonus type labels (individual/all_troops/rally_troops)
   - Combined bonus summaries

6. **`StatBar.tsx`** - Reusable stat comparison bar component

7. **`results-calculator.ts`** - Core calculation logic:
   - `calculateAllStats()` - Computes final stats for all troop types
   - `calculateCapacityReport()` - Calculates capacity breakdowns
   - `extractJoinerBreakdown()` - Extracts joiner skill bonuses
   - `calculateBattlePrediction()` - Predicts battle outcomes
   - `calculateResultsData()` - Main function combining all calculations

8. **`types.ts`** - TypeScript type definitions

9. **`index.ts`** - Module exports

**Tests (`__tests__/components/results-tab.test.ts`):**
- 32 tests covering all calculator functions and types
- Tests for stat calculation, capacity reports, joiner breakdown, and battle prediction

### Key Features

1. **Calculated Stats Display** - Shows final stats (Attack, Defense, Lethality, Health) for each troop type after applying all bonuses

2. **Capacity Reports** - Breaks down rally and march capacity with all bonus sources (pet skills, command center, city bonuses, etc.)

3. **Battle Prediction** - Predicts winner using:
   - Power Index formula: `(1+ATK%) × (1+LETH%) × (1+DEF%) × (1+HP%) × (Troop Count)^1.5`
   - Balance Ratio calculation
   - Damage estimates
   - Confidence levels and expected outcome descriptions

4. **Joiner Skill Breakdown** - Shows how each joiner's first expedition skill contributes bonuses at max level

5. **Visualizations** - Bar charts comparing player vs opponent stats

### Notes for Developer

- The component follows the existing patterns from `RallyTab` and uses the same styling conventions
- Uses Tailwind CSS classes for styling
- All calculations leverage the existing `lib/battle/calculations.ts` functions
- The tab integrates with the existing `UserProfile` and `RallyConfiguration` types
- Tests pass using vitest (32/32 tests passing)