# Feature matrix

This matrix describes the verified local working trees for `LibraryUI` and `libraryBk`.

| Feature | UI and API | Persistence and access | Current evidence / status |
| --- | --- | --- | --- |
| Public home and discovery | `/`, `/catalog`, `/categories`, `/books/:id`; `GET /api/public/books`, `/categories`, book detail and cover | Active-only public DTO; excludes shelf/position data; bounded page size and sortable fields | Desktop/mobile E2E search, detail, browser history, categories, empty results; H2 API projection tests — verified |
| Login and session | `/login`; `POST /api/auth/login`; token interceptor and route guards | Configured admin/staff credentials and member account credentials; JWT protects APIs | Front unit/E2E and backend security tests — verified |
| Member registration | `/register`; `POST /api/auth/register` | BCrypt password, normalized email, duplicate email/national-ID rejection; role fixed as MEMBER; production flag defaults registration off | H2 registration/hash tests and desktop/mobile signup E2E — verified locally; production registration deliberately disabled pending verification/recovery |
| Member portal | `/account`; profile/phone, own loans and reservations, reserve/cancel | `/api/account/**` requires MEMBER; service binds records to the authenticated member | H2 ownership/role tests and desktop/mobile signup-reserve-cancel E2E — verified |
| Staff catalog | `/book`; book list/filter/create/update/deactivate, covers and Excel import | `/api/book/**` restricted to ADMIN/LIBRARIAN; Flyway, JPA, file storage | Unit, H2 integration, desktop/mobile CRUD/history E2E — verified |
| Barcode assisted title entry | Staff add-book dialog; `/api/book/metadata/isbn/{isbn}` | Wedge scanner input; ISBN checksum validation; bounded Open Library lookup; staff-only endpoint; review required before persistence | ISBN and provider-mapping unit tests plus desktop/mobile invalid-scan/manual-fallback E2E — core wedge workflow verified |
| Inventory and circulation | `/loan`, `/reservation`; loan creation/return and reservation fulfillment/cancellation | Aggregate copy count per title; transaction and pessimistic lock prevent oversubscription | H2 concurrency and workflow tests; UI E2E — verified. No individually tracked copy or copy barcode |
| People | `/person`; CRUD, search, profile picture and Excel import | Staff-only API; shared person records | UI/backend and desktop/mobile E2E — core workflow verified |
| Dashboard | `/dashboard`; live summary and recent records | Authenticated; aggregated from persisted data | Backend tests, UI checks, desktop/mobile axe — verified. No full reporting/export workbench |
| Message/file APIs | Backend message and file APIs | Server-side authorization and file validation | Backend test coverage exists; no member-facing chat/notification route in the UI |
| Administration and policy | Staff navigation/API role checks; no member/staff provisioning UI | Roles are assigned by existing configuration or server-controlled registration | Partial. No role-management, circulation-policy, audit-browser, or system-configuration UI |
| Orders, favorites, lists, notifications | No complete application workflow | No end-to-end API/domain model | Not implemented; deferred |

## Cross-cutting status

Staff and member route guards improve navigation UX; backend authorization is authoritative. H2 and Flyway are exercised by integration tests. Production profile requires external MySQL settings, but the MySQL migration path has not been validated against the intended deployment provider in this turn. See the security and production-readiness reviews for release gates.
