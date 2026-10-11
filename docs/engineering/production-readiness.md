# Production readiness assessment

**Verdict: not ready for an unrestricted public launch.** Core public discovery and member self-service paths are implemented and verified locally, but identity assurance, production database validation, and deployment recovery remain release blockers.

## Verified locally

- Angular production compilation, type checks, lint, and frontend unit tests run against the development workspace.
- Spring Boot `mvn verify` runs on H2 with Flyway migrations and application tests.
- Playwright verifies staff book CRUD, visitor catalog search/detail/history, member signup and reservation ownership, login/logout, staff route protection, responsive widths, and axe checks in desktop Chrome and mobile emulation.
- Public catalogue does not disclose staff shelf/location notes; registration passwords are hashed before storage.

## Release gates

1. Implement email verification, password recovery, and throttling/anti-abuse before enabling `MEMBER_REGISTRATION_ENABLED` in a public deployment.
2. Execute migrations and smoke tests against the actual production MySQL engine/version, including an upgrade rehearsal from a copy of existing data.
3. Configure and verify TLS, CORS, JWT secret rotation, database credentials, backups, restore rehearsal, monitoring, and deployment rollback.
4. Complete privacy/legal review of national-ID and contact-data collection; publish accurate privacy, lending, and reservation policies.
5. Define librarian/admin provisioning and credential rotation; confirm least privilege for each operational role.
6. Capture deployment-specific logs/metrics and verify alerting and database restore procedures.

## Product scope still deferred

- Keyboard-wedge barcode/ISBN entry, ISBN checksum checks, and staff-reviewed Open Library metadata lookup are available; a camera scanner and individual-copy barcode inventory are not implemented.
- The current inventory model tracks counts per title rather than individually identified copies.
- Member orders, favorites/lists, fine payments, email notifications, and an administrator role-management UI are not implemented.
- Member registration/profile does not provide verified contact details or a full credential lifecycle.

No production deployment or public account opening has been performed.
