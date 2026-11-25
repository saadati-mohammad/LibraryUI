# Product transformation progress

## Current position

- Verified checklist records: 8 (three existing UI fixes, four foundation-document checks, and the mobile E2E fix).
- Tracked checklist records: 252 unique IDs after correcting a duplicate API-documentation ID.
- Product transformation is **not complete**; implementation tasks remain open.
- Active branch in both repositories: `feature/product-transformation`.

## Latest full-gate evidence

- Backend: `mvnw.cmd -B verify` — `BUILD SUCCESS` (2026-11-25).
- Frontend lint: `npm run lint` — passed.
- Frontend typecheck: `npm run typecheck` — passed.
- Frontend unit: `npm run test:ci` — 35 test files, 192 tests passed.
- Frontend production build: `npm run build` — passed.
- Playwright + axe: `npm run e2e` — 126 passed, 0 skipped.
- Isolated viewport regression: `npx playwright test e2e/localized-controls.e2e.spec.ts` — 4 passed, 0 skipped.

## Current focus

Complete the five-task foundation batch, then continue through the spec in dependency order. Keep checklist statuses tied to test evidence.

## Next five tasks

1. `P0-DOC-005` — decompose the remaining compound requirements into atomic tasks.
2. Define the Work/Edition/Item persistence and backward-compatible API contract.
3. Add Work and Edition entities and repository tests.
4. Add individually barcoded Item entities and availability/status rules.
5. Plan and test deterministic legacy book/loan allocation before production migration.

## Latest task record

- Task: `P0-TEST-VER-001` — verified; explicit 390×844 viewport, independently seeded ISBN-valid book, all four project/test cases pass.
- Root cause: the mobile assertion depended on each Playwright project's default width and was skipped at desktop width. Running it against a clean database also exposed an order-dependent assumption that another spec had seeded book rows.
- Fix: set the assertion's viewport explicitly and create its own book through the authenticated API. The full suite now passes with zero skips.
