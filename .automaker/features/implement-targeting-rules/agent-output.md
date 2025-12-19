### Summary
- Implemented a front-row-first targeting strategy with optional lancer backline dives to marksmen controlled by a configurable probability.
- Added a reusable targeting helper that evaluates living enemies, prioritizes the front line, and lets lancers optionally bypass to backline marksmen when the configured chance succeeds.
- Introduced tests to verify default front-line prioritization, guaranteed backline dives for lancers when probability is 1.0, and that lancers respect a zero dive probability.

### Code Changes
- **`targeting.py`** (new): Added `TargetingSystem` and `select_target` with default front-row-first logic and lancer-specific backline dive support, including RNG injection and simple alive/role/row detection helpers.
- **`tests/test_targeting.py`** (new): Added unit tests covering default targeting behavior and lancer backline dive probability edge cases.

### Notes
- The targeting helper is defensive about unit shape (uses common attributes like `row`, `role`, `is_alive`, `hp`, `frontline`) so it can be plugged into existing models without restructuring.
- `lancer_backline_dive_probability` defaults to `0.0` (feature disabled) and can be set per `TargetingSystem` or per `select_target` call.