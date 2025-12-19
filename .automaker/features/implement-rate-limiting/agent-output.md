Summary:
- Added `PerUserRateLimitingMiddleware` which enforces user-specific throttling on endpoints configured via `per_user_routing`. Each endpoint tracks requests per `UserIdentifier`.
- Implemented `UserRequestLog` to maintain request timestamps per user with cleanup.
- Added `PerUserRateLimitConfig` for configuring limit per endpoint with thread-safe access.
- Applied rate limiting to `/api/simulation` and `/api/profile` routers with default limit of 120 requests/min per user.
- Added tests covering rate limiter middleware, ensuring per-user tracking, enforcement, and configuration.

Notes:
- Rate limit config is per endpoint key; you can adjust defaults via `rite_config.json` as needed.
- `PerUserRateLimitingMiddleware` must be registered before the routes that require throttling.
- Tests simulate request contexts; ensure rate limiter is in place if extending to other endpoints.