# Angular modernization assessment

## Migration result

The frontend migrated from Angular 20.3 / Material-CDK 20.2 to Angular 22.2.2 / Material-CDK 22.2.2. The CLI migration converted the application builder, updated templates and test providers, and added explicit eager change detection to preserve pre-migration behavior. Node 22.23.3 was used because it satisfies Angular 22.2's supported Node range. TypeScript, Angular ESLint, TypeScript ESLint, Vitest, and lockfiles were aligned with the selected framework packages.

The backend repository was independently upgraded to Spring Boot 4.1.1. See the backend `pom.xml` and application configuration. Java 21 remains the supported LTS runtime.

## Adopted Angular patterns visible in the current UI

- Standalone, lazy-loaded feature components and route-level authentication guard.
- Signals for selected dashboard and header/session state where local reactive state benefits from signal semantics.
- Reactive forms for book, person, loan, and import workflows.
- Shared typed file/date/list/modal components and explicit API services.
- `takeUntilDestroyed`/`DestroyRef` in newer stateful flows and cleanup subjects in legacy RxJS components.
- Strict template checks, app-wide TypeScript checks, and a separate Playwright typecheck project.
- Application builder plus SSR-safe guards around browser-only APIs.

## Decisions and remaining work

Angular's migration inserted explicit `ChangeDetectionStrategy.Eager` settings to preserve the existing rendering semantics after the framework default changed. The lint rule favoring OnPush is disabled with a comment explaining this migration decision; converting all components to OnPush requires a separate behavior-focused pass and signal/input review. The existing Jasmine/Karma test runner remains in place; the optional Vitest conversion was not selected during this migration.

The existing Jasmine/Karma suite was migrated using Angular's `refactor-jasmine-vitest` schematic and manual fixes for partial service doubles and `DataTransfer` behavior in the DOM emulator. The 150-test suite passes under Vitest with Zone's Vitest patch. Karma and Jasmine test-runner packages were removed. Angular documents this existing-project migration as experimental; preserve the Vitest test run in CI and review schematic-generated changes as tests evolve.

The production bundle is 611.53 kB raw, 11.53 kB above the current warning budget. Analyze shared chart/material chunks and lazy boundaries before changing the budget. Signals are used selectively; a broad RxJS-to-signals rewrite is not justified without state ownership or performance evidence. Continue with accessibility testing, an OnPush migration plan, framework update monitoring, and review of the remaining optional Karma peer advisory in the dependency audit.
