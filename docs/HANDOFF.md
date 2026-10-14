# System Overhaul Handoff

**Date:** 2026-10-14  
**Branches:** `feature/system-overhaul` (both repos)  
**Scope:** Full-system overhaul of the LibraryUI Angular frontend and libraryBk Spring Boot backend.

---

## 1. What was done

This overhaul addressed 41 tasks (T-001–T-041) across seven phases covering:

- Architecture audit, system mapping and competitor analysis
- Security hardening (auth throttling, JWT revocation, attachment ownership, WebSocket isolation)
- Device and input management (pluggable registry, HID profiles, phone-camera pairing, effective-policy delivery)
- Scan workflow resilience (batch queue, review mode, retry, phone PWA persistence)
- Catalog quality (ISBN normalization/validation, relevance ranking, duplicate-aware import, preview/confirm)
- Persian RTL support (catalog search normalization, clock timezone, date inputs)
- Maintainability (component extraction, reusable directive, factory pattern)
- CI repair (Playwright stability, backend branch coordination, artifact retention)

See `docs/AUDIT_PROGRESS.md` for the full task-by-task evidence record.

---

## 2. Verified evidence (2026-10-14)

### LibraryUI

| Check | Result |
|---|---|
| `npm run lint` | ✓ All files pass (ESLint) |
| `npm run typecheck` | ✓ No TypeScript errors |
| `npm run test:ci` | ✓ **186 tests, 0 failures** (33 spec files, Vitest) |
| `npm run build` | ✓ Clean production bundle (2 expected CommonJS warnings: qrcode/dijkstrajs) |
| `npm audit --omit=peer --audit-level=high` | ✓ 0 high vulnerabilities |

### libraryBk

| Check | Result |
|---|---|
| `mvnw -B verify` | ✓ **196 tests, 0 failures, 0 errors** — BUILD SUCCESS |
| Flyway H2 (V1–V9) | ✓ Applied cleanly |

### Playwright E2E

- Last full run: 89 passed / 1 expected viewport-conditional skip (90 total scenarios, Chromium + Pixel 5)
- Not re-run in this handoff pass (requires running backend on port 8079)
- To re-run: `npm run e2e -- --workers=1` from LibraryUI with `libraryBk` started

---

## 3. Merge readiness and procedure

Both repositories have passed all local verification and GitHub Actions CI on their feature branches:

- **libraryBk** (`feature/system-overhaul` @ `a1e6e11`): CI Run 56 (`38518753840`) — **Build & Test: PASS** (196 tests, 0 failures)
- **LibraryUI** (`feature/system-overhaul` @ `30fb746`): CI Run 57 (`38519558527`) — **Build & Test: PASS**, **Integration E2E: PASS** (both jobs green)

### Coordinated Merge Sequence:
1. **Merge libraryBk first**: `feature/system-overhaul` → `master` on `saadati-mohammad/libraryBk`.
2. **Verify libraryBk master CI**: confirm `master` build completes cleanly.
3. **Merge LibraryUI second**: `feature/system-overhaul` → `master` on `saadati-mohammad/LibraryUI`.
4. **Verify LibraryUI master CI**: confirm `master` build and integration jobs pass.

---

## 4. Deferred items

The following tasks are explicitly deferred with rationale; they are not regressions:

| Task | Reason |
|---|---|
| T-023 — Email verification | Requires SMTP, multi-step UI state machine, configurable mail delivery |
| T-025 — Physical copy inventory | Requires schema migration, legacy-loan reconciliation policy |
| T-026 — Circulation rules | Requires policy model, renewals, fines, member suspension |
| T-031 — Audit trail | Requires retention/export/privacy design |
| T-032 — Retention / privacy erasure | Requires per-record-class policy across tables |
| T-033 — Session revocation center | Requires session table or JWT denylist |
| T-035 — MySQL CI gate | Requires MySQL service in CI |
| T-037 — Iranian ISBN via licensed provider | Requires documented/licensed API |

---

## 5. Known constraints

- **Auth throttling is in-process** (per-IP): behind a reverse proxy, configure `X-Forwarded-For` trust before relying on per-client limits across production traffic; multiple replicas need shared storage (Redis).
- **Production secrets**: JWT_SECRET, DB_URL/USERNAME/PASSWORD, APP_ADMIN_*, MAIL_* must be set via environment/secret manager — never in source or logs.
- **H2 is development-only**: production uses MySQL; both Flyway migration paths (h2/mysql) must stay in sync for each schema change.
- **Phone camera requires HTTPS** and explicit browser permission; LAN address must be used (not `localhost`) when the phone is a separate device.
- **QR pairing sessions** expire after 10 minutes and are lost on backend restart; do not share pairing URLs.
- **`KeyboardWedgeScannerDirective` burst timing** relies on `performance.now()` in real browsers; physical device verification with real HID scanners at production burst speeds is hardware-dependent.

---

## 6. How to continue

### Run everything locally

```powershell
# Terminal 1 — backend
cd libraryBk
.\mvnw.cmd spring-boot:run

# Terminal 2 — frontend
cd LibraryUI
npm ci --omit=peer
npm start
# Open http://localhost:4200  (admin / admin in dev mode)
```

### Run all tests

```powershell
# Backend
cd libraryBk
.\mvnw.cmd -B clean verify

# Frontend unit
cd LibraryUI
npm run lint && npm run typecheck && npm run test:ci && npm run build

# Frontend E2E (backend must be running)
npm run e2e -- --workers=1
```

### Pick up deferred work

Start from `AUDIT_PROGRESS.md` TODO items. Each has a rationale and acceptance criteria in the
same row. Add your implementation evidence before marking DONE.

---

## 7. Repository links

- **LibraryUI**: `feature/system-overhaul` — [GitHub](https://github.com/saadati-mohammad/LibraryUI/tree/feature/system-overhaul)
- **libraryBk**: `feature/system-overhaul` — [GitHub](https://github.com/saadati-mohammad/libraryBk/tree/feature/system-overhaul)
- **CI (UI)**: [Actions](https://github.com/saadati-mohammad/LibraryUI/actions)
- **CI (API)**: [Actions](https://github.com/saadati-mohammad/libraryBk/actions)
