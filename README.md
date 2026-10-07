# LibraryUI

Angular 20 front end for the Library management system. Talks to the `libraryBk`
Spring Boot backend over REST and STOMP/WebSocket for chat.

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Angular 20 (standalone components) |
| UI | Angular Material + Tailwind CSS |
| Charts | Chart.js via ng2-charts |
| Realtime | `@stomp/stompjs` + `sockjs-client` |
| Tests | Karma + Jasmine |
| Build | Angular CLI (`ng`) |

## Prerequisites

- Node.js 22+
- npm 10+

## Development server

```bash
npm ci        # install exact dependencies from the lockfile
npm start     # ng serve
```

Open `http://localhost:4200/`. The app reloads on source changes.

The dev environment (`src/environments/environment.ts`) points at the backend on
`http://localhost:8080`.

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
# Backend must be running on :8080 with APP_ADMIN_PASSWORD=admin
npx playwright test --project=chromium
npx playwright test --project=mobile
```

The config (`playwright.config.ts`) starts the Angular dev server automatically.

## Linting / formatting

ESLint (via `ng lint`) is configured and enforced in CI; it currently reports warnings only
(`no-explicit-any`, `prefer-inject`, …) and no errors. `npx tsc --noEmit -p tsconfig.app.json`
is also enforced in CI.
