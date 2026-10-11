# Final verification matrix

Local verification performed on 2026-10-11 across `LibraryUI` and `libraryBk`. Tests use H2 and the actual Angular UI/backend. Playwright used the installed Chrome executable because downloading the pinned browser binary was blocked in this environment.

| Check | Command or procedure | Result |
| --- | --- | --- |
| Frontend production build | Angular CLI `ng build` with Node 24.19.0 | Pass; initial bundle 614.35 kB, 14.35 kB above the 600 kB warning budget (below error budget) |
| Frontend application/E2E type checks | `tsc --noEmit -p tsconfig.json` and `tsc --noEmit -p tsconfig.e2e.json` | Pass |
| Frontend lint | Angular CLI `ng lint` | Pass |
| Frontend unit tests | Angular CLI `ng test --watch=false` | Pass, 157/157 across 28 files; 80.46% statement and 81.67% line coverage |
| Backend verification | `./mvnw verify` | Pass, 142 tests, 0 failures/errors/skips |
| H2/Flyway | Backend suite and running E2E app | Pass; four H2 migrations applied and schema validated; member, catalog, role, ISBN-13-only book, and reservation workflows tested |
| Browser matrix | Playwright full suite, desktop Chrome and Pixel 5 emulation, one worker | Pass, 51 passed and 1 expected desktop-only skip (52 cases total); visitor discovery/history, member registration/reservation/cancellation, staff CRUD/circulation, invalid barcode/manual fallback, login/logout, responsive journeys, and mobile card/paginator geometry |
| Accessibility | axe within desktop/mobile Playwright suite | Pass on login, books, people, reservations, dashboard, and loan modal; zero reported violations |
| Responsive behavior | Exploratory E2E at 320, 375, 768, 1024, and 1440 CSS pixels | Pass; no horizontal overflow in tested flows. Other zoom/display settings are not certified |
| Open Library mapping | Mocked HTTP service tests | Pass for field mapping, partial fields, no match, valid/invalid ISBN, and provider-failure handling. Live provider availability is not claimed |
| Production account registration | Service test with registration disabled | Pass; fails closed without touching member repositories. Production config defaults `MEMBER_REGISTRATION_ENABLED=false` |
| MySQL migration/schema | No target MySQL instance available in this verification | Not run; production MySQL compatibility remains a release gate |
| Production deployment / backup / restore | No deployment performed | Not run |
| CI / remote GitHub | No remote workflow run | Not run |
| Commit and push | Both repositories are on `master` with extensive existing modifications/untracked work | Not done; staging the full mixed working trees would risk including unrelated or previously unreviewed changes |

The frontend coverage report is a unit-test metric, not end-to-end feature coverage. External metadata tests are mocked. H2 does not prove production MySQL behavior. Public account registration is available locally for verification but disabled by default in the production profile.
