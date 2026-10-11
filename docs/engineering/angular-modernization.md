# Angular modernization

## Current implementation

- Angular and Angular CLI 22.2.2 with TypeScript 6.0.3, RxJS 7.8, and Node.js 24.19.0 in the verified local environment.
- Standalone components and lazy route loading are used across public, member, and staff areas. Staff-only and member-only route guards check the role for navigation UX; the API independently enforces the roles.
- Staff book, member, and loan list pages extend the no-template `PagedFilterPage<T>` base for shared list state, debounced filter teardown, and pagination. Domain-specific fetch and filtering remain in each page.
- Signals are used for small local UI state such as session, loading, and status. HttpClient APIs remain observable because request cancellation/composition and existing services already use RxJS.
- Vitest replaces the legacy Karma/Jasmine runner. Current frontend suite: 157 unit tests; the generated coverage report records 80.46% statements and 81.67% lines.
- TypeScript strict checks and Angular lint pass. The production build currently compiles but its 614.35 kB initial bundle exceeds the 600 kB warning budget by 14.35 kB.

## Deliberate limits

- Do not migrate every observable to signals without a state ownership or performance reason.
- Continue analyzing the shared initial chunks before tuning the budget; route-specific book, dashboard, and member features are lazy chunks.
- `@angular/animations` reports deprecation under Angular 22. Replace legacy Material animation dependencies with supported native enter/leave patterns when the Material surfaces involved are migrated.

## Verification commands

```powershell
npm run typecheck
npm run lint
npm run test:ci
npm run build
```
