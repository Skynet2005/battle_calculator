Summary:
- Added a new Monte Carlo mode that allows running N simulations with seeded random number generation.
- Implemented logic to compute mean and variance across simulation runs and report the aggregated statistics.
- Introduced tests covering deterministic random streams through seeds, simulation count validation, and statistics accuracy.

Notes:
- Please double-check numerical tolerances in the environment if tests involving floating-point comparisons fail sporadically.