# LibraryUI

Angular 22 front end for the Library management system. Talks to the `libraryBk`
Spring Boot backend over authenticated REST APIs.

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Angular 22.2 (standalone components) |
| UI | Angular Material + Tailwind CSS |
| Charts | Chart.js via ng2-charts |
| Tests | Vitest; Playwright browser tests |
| Build | Angular CLI (`ng`) |

## Prerequisites

- Node.js 22.22.3+ or 24.15.0+ (Angular 22 supported versions)
- npm 10+

## Development server

```bash
npm ci        # install exact dependencies from the lockfile
npm start     # ng serve
```

Open `http://localhost:4200/`. The app reloads on source changes and proxies `/api` and
`/ws-chat` to the backend on port `8079` (configured in `proxy.conf.json`). Start the backend
with the development profile; local development defaults to `admin` / `admin` only in that
profile.

## Building

```bash
npm run build
```

Artifacts are written to `dist/library-ui`. The production build uses
`environment.prod.ts` (relative `/api` and `/ws-chat` paths, intended to sit behind a
reverse proxy).

## Testing

```bash
npm test
```

Component tests use a shared provider helper at
`src/app/testing/test-providers.ts` which supplies `HttpClient`, the router, and
animations. Add `providers: provideTestProviders()` to any new component spec that
injects an HTTP-backed service.

## Project layout

```
src/app/
  core/           services (API clients), models, interfaces
  features/       routed feature components (book, person, loan, chat, ...)
  shared/         reusable UI components (list, modal, header, footer)
  layout/         app shell (base layout)
  testing/        test-only helpers
```

## Authentication

The app requires a signed-in session. `AuthService` (`core/service/auth.service.ts`) calls
`POST /api/auth/login`, stores the JWT in `localStorage`, and exposes `isAuthenticated()` and
`getToken()`. A functional `authInterceptor` attaches the bearer token to API requests and
signs the user out on `401`; `authGuard` redirects unauthenticated navigation to `/login`.
The chat client passes the same token on the STOMP CONNECT frame.

For local development the default dev credentials are `admin` / `admin` (see the backend
`application-development.properties`).

## End-to-end tests

Playwright browser tests live in `e2e/` and drive the real UI against a running backend:

```bash
# Backend must be running on :8079 with APP_ADMIN_PASSWORD=admin
npx playwright test --project=chromium
npx playwright test --project=mobile
```

The config (`playwright.config.ts`) starts the Angular dev server automatically.

## Linting / formatting

ESLint (via `ng lint`) is configured and enforced in CI. Strict application and browser-test
type checks use `npm run typecheck`.

## Public catalog and member accounts

The public pages use read-only `/api/public/**` projections. Registration creates a member
account and the account area reads that member's own profile, loans, and reservations. The
staff catalog dialog accepts USB/Bluetooth keyboard-wedge ISBN scanners and can request
Open Library metadata; staff review metadata before saving. See `docs/engineering/` for the
feature matrix, responsive and security audits, barcode workflow, and production release
gates. Email verification and password recovery are not implemented, so public self-
registration must remain closed until those release gates are met.
