# LibraryUI

Angular 22 front end for the Library management system. Talks to the `libraryBk`
Spring Boot backend over authenticated REST APIs.

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Angular 22.2 (standalone components) |
| UI | Angular Material + Tailwind CSS |
| Charts | Chart.js via ng2-charts |
| Tests | Vitest unit tests; Playwright desktop/mobile browser tests |
| Mobile scanning | Installable Angular PWA, camera ISBN scanning, and keyboard-wedge scanners |
| Staff access | Admin-only staff account and role management |
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
npm run typecheck
npm run lint
npm run test:ci
npm run build
npm run e2e -- --workers=1
```

Component tests use a shared provider helper at
`src/app/testing/test-providers.ts` which supplies `HttpClient`, the router, and
animations. Add `providers: provideTestProviders()` to any new component spec that
injects an HTTP-backed service. Playwright runs desktop Chromium and a Pixel 5 profile;
the backend must be available on port `8079`. Browser tests share its H2 database, so run
them with one worker.

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
staff catalog dialog supports manual entry, ISBN lookup, and title/author search through the
Open Library and Google Books catalogs. Provider results are best-effort and do not represent
an exhaustive index of every published book; staff should review metadata before saving.

USB, Bluetooth, and Wi-Fi barcode readers that expose themselves as a keyboard (HID/keyboard
wedge) work by typing the ISBN into the focused scan field and pressing Enter. For phones,
the book-entry dialog can create a short-lived pairing session and QR link to `/phone-scan`.
That route is an installable PWA with camera scanning (on HTTPS), manual ISBN input, and
support for a scanner connected to the phone as a keyboard. Pairing is temporary and the
desktop and phone must be able to reach the same application origin. Scanner models that
use a proprietary serial or network protocol instead of keyboard emulation need a
model-specific integration.

See `docs/engineering/` for the feature matrix, responsive and security audits, barcode
workflow, and production release gates. Public self-registration remains controlled by the
backend deployment policy. Password recovery is available at `/forgot-password`; members
use their registered email and staff use the recovery email maintained by an administrator.
The emailed link opens `/reset-password`, expires after 20 minutes, and can only be used once.
SMTP and `PUBLIC_APP_URL` must be configured in the backend before the feature can deliver mail.

Administrators can manage librarian and administrator accounts at `/staff-accounts`. New
staff passwords must contain at least 12 characters and a unique recovery email. Deactivation is reversible and
preserves the account record; the API rechecks current roles and account status on every
request, so role changes or deactivation also take effect for already-issued tokens.
