# Changelog — LibraryUI

All notable changes to the LibraryUI Angular frontend are documented here.
Entries cover the coordinated `feature/system-overhaul` branch (2026-10-11 → 2026-10-14).

## [Unreleased] — feature/system-overhaul

### Added

- **HID keyboard-wedge profile integration** (`KeyboardWedgeScannerDirective`): standalone Angular directive
  that distinguishes rapid scanner bursts from manual typing using `performance.now()`. Applies
  configured prefix/suffix stripping, ENTER/TAB/NONE terminator handling and minimum-length guard
  from the device profile delivered by the effective-policy API. Wired to book barcode, loan-checkout
  and loan-return scan inputs. [T-011 T-012]
- **Test-scan wizard panel** in the device admin form: visible when KEYBOARD_WEDGE type is selected;
  shows decoded value and status message so operators can verify scanner config without leaving the
  admin UI. [T-011]
- **`InputDeviceRuntimeProfile`** model and `deviceProfiles` field on `InputFormPolicy`: frontend
  contract for the safe scanner profile delivered by the API effective-policy endpoint. [T-012]
- **Review-first ISBN batch queue** in book-entry form: bounded 50-item queue with deduplication,
  individual review, removal and explicit save. Auto-registration and review-first modes selectable
  per session. [T-013 T-029]
- **Phone PWA failed-scan retry queue**: persists unacknowledged scans locally, restores on reload,
  retries after a new pairing session. [T-029 T-030]
- **Camera selection and torch controls** in the book scanner. [T-030]
- **Relevance sort** in the public catalog: exact normalized title, title-prefix, author/subject
  match, then stable ID. [T-034]
- **Staff account directory search and filter**: text search across display name, username and email;
  active/inactive/all status filter. [T-016]
- **Bounded XLSX import preview/confirm** for both books and members: server validates and dry-runs
  before any write; row-level issues and duplicate reporting shown to operator. [T-028]
- **Loan return by ISBN scan**: barcode input on the return panel triggers loan lookup by ISBN-10/13,
  presents matching active loans for confirmation. [T-012]
- **Form input policy UI**: operator selects allowed input sources per form context; policy stored
  and retrieved from API. [T-012]
- **Per-device QR enrollment** flow in the device admin UI. [T-011]
- **`CameraBarcodeScannerService`**: camera lifecycle, decoder control and torch/stream cancellation
  extracted from `BookComponent`. [T-040]
- **`BookFormFactory` / `PersonFormFactory` / `LoanFormFactory`**: form schema construction extracted from components.
  [T-040]

### Fixed

- ISBN normalization and checksum validation applied consistently across manual entry, scan and import
  paths (ASCII / Persian / Arabic-Indic digits and separators). [T-024]
- Staff form primary action alignment for account creation and editing. [T-016]
- QR enrollment link loading race condition in the device management page. [T-011]
- Phone camera scan hands-free mode kept active after barcode detection. [T-030]

### Changed

- Loan-checkout and loan-return scan inputs now use `KeyboardWedgeScannerDirective` for
  profile-aware HID handling; manual Enter behavior preserved when no profile is active. [T-012]
- Book barcode input wired to directive; `handleKeyboardWedgeScan` dispatches detected value to
  existing ISBN lookup flow. [T-011 T-012]
- `AUDIT_PROGRESS.md` updated with 2026-10-14 evidence: 189 unit tests, 196 API tests, production
  build, npm audit 0 high, CHANGELOG and handoff produced. [T-018]

### Infrastructure / CI

- CI workflow retains Playwright failure diagnostics (report + test-results) as artifacts. [T-041]
- E2E worker count fixed to 1 (serialized) to avoid cross-worker H2 data races. [T-041]
- Backend `feature/system-overhaul` branch cloned for integration job (not master). [T-041]

### Verified baselines (2026-10-14)

| Check | Result |
|---|---|
| `npm run lint` | ✓ All files pass |
| `npm run typecheck` | ✓ No errors |
| `npm run test:ci` | ✓ 189 tests, 0 failures (34 files) |
| `npm run build` | ✓ Clean (2 expected CommonJS warnings for qrcode/dijkstrajs) |
| `npm audit --omit=peer --audit-level=high` | ✓ 0 vulnerabilities |

### Deferred / Out-of-scope

Items below are documented as future work with rationale in `docs/AUDIT_PROGRESS.md`:

- **T-023** — Email verification for self-registered members (requires SMTP and multi-step flow)
- **T-025** — Per-copy physical inventory and barcode circulation (requires schema migration and reconciliation)
- **T-026** — Configurable circulation rules (loan duration, renewals, fines)
- **T-031** — Structured actor-attributed audit trail
- **T-032** — Formal soft-delete / retention / privacy-erasure policy
- **T-033** — Backend session revocation center
- **T-035** — Production MySQL CI gate
- **T-037** — Live Iranian ISBN lookup via licensed provider

---

*Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).*
