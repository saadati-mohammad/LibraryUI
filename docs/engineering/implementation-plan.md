# Engineering implementation status

This is an evidence-based view of the current uncommitted work across both repositories.

| Workstream | Status | Evidence or remaining work |
| --- | --- | --- |
| Angular/Spring stack upgrade | Implemented | Angular 22.2.2 / TypeScript 6.0.3; Spring Boot 4.1.1 / Java 21 |
| Public discovery and member self-service | Implemented | Public projection and member account APIs, UI, guards, H2 tests, desktop/mobile browser workflows |
| Staff and circulation workflows | Core workflows verified | CRUD, loans, reservations, aggregate copy capacity; no per-copy inventory or management console for roles/policies |
| Barcode assisted entry | Core keyboard-wedge flow implemented | ISBN-10/13 checksum, Open Library search, multiple-candidate selection, manual fallback; no camera or copy barcode |
| Frontend quality checks | Passed | 157/157 unit tests, strict application/E2E TypeScript checks, lint; build succeeds with 614.35 kB initial bundle, 14.35 kB over warning budget |
| Backend quality checks | Passed | Maven `verify`, 142 tests, H2 migrations and application context |
| Browser verification | Passed | Final Playwright matrix: 51 passed, 1 expected desktop-only skip (52 cases total) across desktop Chrome and mobile emulation; includes scanner fallback, axe, narrow-width overflow, mobile card/paginator geometry, public discovery, member, staff, and circulation journeys |
| Production database | Not verified | H2 is tested. MySQL service is installed but stopped; this session cannot open the service. MySQL Flyway migrations/schema and provider-specific behavior still need validation on the target database engine |
| Public identity lifecycle | Release blocker | Production registration defaults off. Email verification, password reset, throttling, and anti-abuse controls are not implemented |
| Delivery | In progress | User requested separate, thematic commits in each repository and GitHub push. Verify exact staged file groups and avoid secrets before publishing; remote CI has not run |

## Next actions

1. Push the verified work in separate, descriptive commits for each repository; then inspect remote CI results.
2. Optimize the 14.35 kB bundle-budget overage and review deprecation/audit findings.
3. Validate MySQL migrations against the deployment provider, then rehearse upgrade, backup/restore, and rollback.
4. Implement email verification, password recovery, and signup/login rate limits before enabling public registration.
5. Add missing product scope only where the library business requires it: copy barcodes, role/policy management, notifications, and reporting.
