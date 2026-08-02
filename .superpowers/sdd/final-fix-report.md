# Final review fix report

## 2026-08-02

- Updated listing deletes in `firestore.rules` to use `resource` directly and avoid an additional `exists()` access per batch operation.
- Added strict Brazilian price parsing (`1.234,56`), rejected malformed input, and normalized saved prices to two decimal places.
- Added an inline PT-BR error when creating or updating an offering returns `false`.
- Extracted a shared `OfferingTermsSummary` used by the explore board, public profile, and private offering grid.
- Changed wanted-card thumbnails to `low.webp` and deduplicated normalized wanted cards by ID.
- Verification: targeted parser/normalizer checks passed; `npm run build` passed; `npm run lint` passed with three pre-existing Fast Refresh warnings in Motion-adjacent files outside this task's scope.
