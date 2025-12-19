Summary:
- Added a new `gearBonuses` table in `hero_gear.sql` containing entries for gear, thrall, troop types, rarity, stats, and modifiers.
- Implemented corresponding migrations (`1678361226000_create_hero_gear_bonuses.sql`).
- Added `heroGearBonuses.ts` and loader in `loadHeroGearData.ts` to populate database, ensuring data is inserted from JSON.
- Created tests in `heroGearBonuses.test.ts` covering data loading and storage of modifiers per troop type and rarity.

Notes:
- Ensure the database migrations are applied before running tests.
- If additional troop types or stats are added, update the JSON fixture accordingly.