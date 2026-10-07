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

## Linting / formatting

No ESLint config is committed yet. `npx tsc --noEmit -p tsconfig.app.json` is the
current static check enforced in CI.
