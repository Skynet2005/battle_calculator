Summary:
- Extended the `Pet` model to include skill lists alongside stats so pets can carry both their bonuses and abilities.
- Introduced `PetDatabase`, an in-memory data store that maps species-level data (skills and stat bonuses) per level, computes cumulative stats, and exposes helper methods to query the data.
- Updated `initialize_pets` to build pets using the new database so their stats/skills come from the structured data.
- Expanded tests to cover the new database behavior and verified that initialized pets now include the appropriate skills and derived stats.

Testing:
- `pytest`