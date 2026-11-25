# Product decisions

1. Treat the supplied transformation spec as the product scope; use existing `AUDIT_REPORT.md`/`SYSTEM_MAP.md` as evidence, but do not copy their old completion claims to the new checklist.
2. Do not migrate aggregate loans into individual copies until deterministic legacy loan-to-copy allocation is defined; preserve history and reconcile rather than inventing patron/item associations.
3. Keep H2 and MySQL migrations aligned and use additive Flyway migrations for schema changes; keep Hibernate `ddl-auto=validate`.
4. Until backend supports alternate identity modes, do not make national ID optional only in the UI; implement verification/linking as an API-backed flow.
5. Run mobile layout tests at explicit viewport sizes independent of the Playwright project's default device viewport.
6. Browser tests that require catalog rows create their own valid fixture through the authenticated API; test outcomes must not depend on row creation in an unrelated spec or on test ordering.

7. Keep checklist statuses evidence-based: completion of an implementation requires its stated acceptance check and the full requested gates; a passing build alone does not close unrelated requirements.
