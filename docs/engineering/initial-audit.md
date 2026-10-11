# Initial engineering audit

## Scope and repository state

The frontend and backend are separate repositories: `LibraryUI` (Angular) and `libraryBk` (Spring Boot). At the start of this pass both already had extensive uncommitted work. The UI had 106 changed paths and the backend 54; those edits were preserved. This report describes the working tree as inspected and verified on 2026-10-10, not a clean upstream baseline.

## Stack and baseline

| Area | Before migration | Evidence |
| --- | --- | --- |
| Frontend | Angular 20.3, Material/CDK 20.2, TypeScript 5.9; Node 24.19 installed, Node 22.23.3 used for Angular 22 compatibility | `package.json`, lockfile, `node --version` |
| Backend | Spring Boot 3.5.16, Java 21, Maven wrapper | `pom.xml`, `java -version`, `mvnw` |
| Database | H2 default, Flyway migrations, Hibernate validate | `application.properties`, `db/migration` |

Pre-upgrade backend tests passed (126). Frontend typecheck passed; production build failed with two template binding errors and a chart type error. The initial frontend test run exposed a stale status-select query and a deletion test whose confirmation dependency was not mocked correctly. The migration subsequently surfaced and resolved those same test defects.

## Product surface observed

Authenticated routes present in the current UI: dashboard, books, people, loans, and reservations. Public route: login. Backend also contains message and file APIs; there is no matching route in the current frontend. The working tree deletes earlier chat, profile, report, home, and system-settings UI modules. Their removal is treated as intentional existing work, but those capabilities are not part of the current end-user interface.

## Findings and residual risks

- Backend API is protected by a JWT-based admin configuration; local development defaults must not be used as production credentials.
- Default storage is in-memory H2. Production persistence, backups, and deployment-specific secrets need an explicit environment configuration.
- Product functionality exists across multiple domains, but browser verification covers core login, book workflow, responsive layout, and accessibility checks rather than every CRUD permutation.
- The Playwright loan-return case skips when the local database has no active loans.
- The frontend migrated from Karma/Jasmine to Vitest. The full npm audit still reports four high findings through Angular Build's optional Karma peer; the Vitest setup does not use Karma, and audits omitting peer dependencies and development dependencies are clean. CI uses `npm ci --omit=peer` and audits the resulting dependency set.
- Both repositories remain broadly dirty, so a focused commit cannot yet be safely isolated from pre-existing work.
