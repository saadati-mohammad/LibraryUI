# Product transformation audit

This audit complements the pre-existing `AUDIT_REPORT.md`, `SYSTEM_MAP.md`, and `AUDIT_PROGRESS.md`. It does not claim the full transformation is complete.

## Repository

- Repository: LibraryUI
- Frontend: Angular standalone app; existing OPAC, account, staff CRUD, loans/reservations, scanner, import preview, dashboard, unit and Playwright coverage are present.
- Backend: Spring Boot, JPA, Flyway, JWT, role rules, auth throttling, member registration, public catalog, book/loan/reservation APIs, scanner sessions and import preview are present.
- Schema policy: Hibernate is configured to validate; versioned Flyway migrations exist for H2 and MySQL.
- License gate: `KG.bat` exists in backend resources (see backend `SYSTEM_MAP.md` / existing audit); preserve its exclusion from packaged artifacts.

## Open transformation gaps

- Bibliographic records still use aggregate book/copy counts; there is no Work/Edition/Item model or individually barcoded copy checkout.
- Membership plans/categories, branch-aware loan rules, renewal policy, fine ledger and transactional hold queue are incomplete.
- Self-registration still relies on national ID and lacks email proof / safe member linking.
- Tenant isolation, commercial licensing, onboarding setup wizard, fine-grained RBAC and searchable audit UI are incomplete.
- Scanner implementation and import/export do not satisfy all of SPEC §§6–8.
- Commercial deployment, SaaS billing, university integrations, enterprise standards and Phase 4–5 features remain open.

## Current-turn verified changes

- Registration has enabled submit, field-level validation, password checklist and show/hide controls.
- Public home book/category sections have loading, empty, retryable-error states.
- Dashboard month labels use Jalali month and year.
- The localized controls Playwright test previously skipped its mobile assertion in desktop projects and relied on data seeded by unrelated tests. It now uses its own mobile viewport and seeds its own book through the authenticated API. The focused four-case run and full 126-case Playwright + axe suite pass with zero skips. Backend Maven verify and frontend lint, typecheck, 192 unit tests, and production build also pass.

See `CHECKLIST.md` for requirement-by-requirement acceptance criteria and status.
