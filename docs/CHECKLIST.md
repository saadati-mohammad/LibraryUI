# Product transformation master checklist

Canonical scope: `LIBRARY_PRODUCT_TRANSFORMATION_SPEC.md`; this inventory covers all requirements in §1, §3–§9, §13–§15.

Status legend: `[ ]` todo · `[~]` in progress · `[x]` implemented but not verified · `[v]` verified · `[!]` blocked with reason. Every task records a source section, acceptance criterion and dependency.

Tracked task records: **252**. Every record has a unique ID, source, acceptance criteria, dependencies, and status. Compound roadmap items are being decomposed under `P0-DOC-005`; they stay open until their child outcomes are explicit and verified.


## Source coverage map

The checklist covers every requested scope in the supplied spec. Section 1 findings are identified by their finding code and mapped as follows: `P` → §1.1, `R` → §1.2, `L` → §1.3, `A` → §1.4, `B` → §1.5, `M` → §1.6, `LN` → §1.7, `RS` → §1.8, `S` → §1.9, `D` → §1.10, and cross-cutting findings → §1.11. Remaining scope is recorded by the source section on each task.

| Spec scope | Checklist coverage |
|---|---|
| §1.1–§1.11 | Finding-code records plus cross-cutting records |
| §3.1–§3.3 | 33 source records |
| §4.1–§4.5 | 19 source records |
| §5.1–§5.2 | 10 source records |
| §6.1–§6.11 | 36 source records |
| §7 | 12 source records |
| §8 | 9 source records |
| §9 | 23 source records |
| §13 | 12 source records |
| §14 | 15 source records |
| §15 | 9 source records |

## P1-UX-001 — P1 | Home: "Recently added" shows "در حال دریافت فهرست کتاب‌ها…" and never resolves; Catalog shows "0 عنوان" + endless loading; Categories shows endless "در حال دریافت موضوع‌ها…". No error/empty/retry states. | Implement proper **skeleton → data / empty / error+retry** states on every async view. Never show infinite loading.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, P1 | Home: "Recently added" shows "در حال دریافت فهرست کتاب‌ها…" and never resolves; Catalog shows "0 عنوان" + endless loading; Categories shows endless "در حال دریافت موضوع‌ها…". No error/empty/retry states. | Implement proper **skeleton → data / empty / error+retry** states on every async view. Never show infinite loading.
- Dependencies: none
- Status: [ ]

## P1-UX-002 — P2 | Home copy/design is generic; hero is nice but content below is empty ("subjects appear after books are registered"); weak trust/value signals; a odd line "فهرست زندهٔ کتابخانه، بدون عنوان ساختگی". | Redesign landing as a real **OPAC home** (Section 5). Remove awkward copy. Use tenant branding (name, logo, colors).
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, P2 | Home copy/design is generic; hero is nice but content below is empty ("subjects appear after books are registered"); weak trust/value signals; a odd line "فهرست زندهٔ کتابخانه، بدون عنوان ساختگی". | Redesign landing as a real **OPAC home** (Section 5). Remove awkward copy. Use tenant branding (name, logo, colors).
- Dependencies: P1-UX-001
- Status: [ ]

## P1-UX-003 — P3 | Browser tab shows the **default Angular favicon**; tab titles inconsistent ("کتابخانه | کشف کتاب‌های تازه", "موضوع‌های کتاب | کتابخانه", "کتابخانه آنلاین | جست‌وجو، رزرو و بیگیری"). | Per-tenant favicon/app icons, consistent title pattern `Page — Library Name`, correct `<meta>`/Open Graph, `lang="fa" dir="rtl"`.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, P3 | Browser tab shows the **default Angular favicon**; tab titles inconsistent ("کتابخانه | کشف کتاب‌های تازه", "موضوع‌های کتاب | کتابخانه", "کتابخانه آنلاین | جست‌وجو، رزرو و بیگیری"). | Per-tenant favicon/app icons, consistent title pattern `Page — Library Name`, correct `<meta>`/Open Graph, `lang="fa" dir="rtl"`.
- Dependencies: P1-UX-002
- Status: [ ]

## P1-FE-001 — P4 | Catalog has only text search, one subject dropdown, one sort. No book detail page, no availability, no covers shown. | Full OPAC search with facets + book detail page (Section 5).
- Phase: P1 · Area: FE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, P4 | Catalog has only text search, one subject dropdown, one sort. No book detail page, no availability, no covers shown. | Full OPAC search with facets + book detail page (Section 5).
- Dependencies: none
- Status: [ ]

## P1-BE-001 — P5 | Nav has both "ورود اعضا" (primary button) and "عضویت" — confusing; login page has a different, stripped-down header. | Unified header: Login / Sign up clearly differentiated; logged-in state shows avatar menu.
- Phase: P1 · Area: BE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, P5 | Nav has both "ورود اعضا" (primary button) and "عضویت" — confusing; login page has a different, stripped-down header. | Unified header: Login / Sign up clearly differentiated; logged-in state shows avatar menu.
- Dependencies: none
- Status: [ ]

## P1-UX-004 — P6 | Footer is minimal. | Real footer: hours, address, contact, social, policies, language switch, accessibility statement, "Powered by" (removable via license).
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, P6 | Footer is minimal. | Real footer: hours, address, contact, social, policies, language switch, accessibility statement, "Powered by" (removable via license).
- Dependencies: P1-UX-003
- Status: [ ]

## P1-SEC-001 — R1 | **"Create account" button is disabled with no explanation** even when the form looks filled (screenshot: 8-char password with 12 min, repeat password empty). User cannot tell what is wrong. | **Never silently disable submit.** Keep button enabled; on submit (or on blur) show **inline, field-level, specific messages** adjacent to each invalid field, scroll/focus the first invalid field, and show an error summary (`role="alert"`). Show live **password requirement checklist** (length ≥ 12 ✓/✗, match ✓/✗, strength meter).
- Phase: P1 · Area: SEC · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, R1 | **"Create account" button is disabled with no explanation** even when the form looks filled (screenshot: 8-char password with 12 min, repeat password empty). User cannot tell what is wrong. | **Never silently disable submit.** Keep button enabled; on submit (or on blur) show **inline, field-level, specific messages** adjacent to each invalid field, scroll/focus the first invalid field, and show an error summary (`role="alert"`). Show live **password requirement checklist** (length ≥ 12 ✓/✗, match ✓/✗, strength meter).
- Dependencies: none
- Status: [ ]

## P1-UX-005 — R2 | No **show/hide password** toggle on password and repeat-password (login has one, register does not). Fields must also not be forced into dot-only mode with no way to verify. | Add visible toggle (eye icon, accessible label, `aria-pressed`) on all password fields app-wide via one shared component.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, R2 | No **show/hide password** toggle on password and repeat-password (login has one, register does not). Fields must also not be forced into dot-only mode with no way to verify. | Add visible toggle (eye icon, accessible label, `aria-pressed`) on all password fields app-wide via one shared component.
- Dependencies: P1-UX-004
- Status: [ ]

## P1-SEC-002 — R3 | National ID (کد ملی) is mandatory with the helper "to link the account to the membership record". **This is an account-takeover risk** (anyone who knows a person's national ID + email could claim their member record). | Linking to an existing member record must require **proof**: library-issued membership number + OTP (SMS/email), or staff approval. Add **email verification** and optional **phone OTP**. National ID must be **optional/configurable per tenant** (Iranian checksum validation when enabled; passport/other ID for foreigners; student ID for universities).
- Phase: P1 · Area: SEC · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, R3 | National ID (کد ملی) is mandatory with the helper "to link the account to the membership record". **This is an account-takeover risk** (anyone who knows a person's national ID + email could claim their member record). | Linking to an existing member record must require **proof**: library-issued membership number + OTP (SMS/email), or staff approval. Add **email verification** and optional **phone OTP**. National ID must be **optional/configurable per tenant** (Iranian checksum validation when enabled; passport/other ID for foreigners; student ID for universities).
- Dependencies: P1-SEC-001
- Status: [ ]

## P1-UX-006 — R4 | No CAPTCHA/rate limiting, no terms/privacy consent, no marketing consent. | Add rate limiting + bot protection (pluggable: hCaptcha/Turnstile/self-hosted), required Terms/Privacy checkbox (configurable text), consent logging.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, R4 | No CAPTCHA/rate limiting, no terms/privacy consent, no marketing consent. | Add rate limiting + bot protection (pluggable: hCaptcha/Turnstile/self-hosted), required Terms/Privacy checkbox (configurable text), consent logging.
- Dependencies: P1-UX-005
- Status: [ ]

## P1-UX-007 — R5 | Phone field accepts `+98…`; no normalization/validation messaging. | Normalize to E.164, validate Iranian mobile format when region = IR, clear errors.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, R5 | Phone field accepts `+98…`; no normalization/validation messaging. | Normalize to E.164, validate Iranian mobile format when region = IR, clear errors.
- Dependencies: P1-UX-006
- Status: [ ]

## P1-UX-008 — R6 | Registration flow is identical for all library types. | Registration modes per tenant: **open**, **approval-required**, **invite-only**, **SSO-only (university)**.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, R6 | Registration flow is identical for all library types. | Registration modes per tenant: **open**, **approval-required**, **invite-only**, **SSO-only (university)**.
- Dependencies: P1-UX-007
- Status: [ ]

## P1-SEC-003 — L1 | Login button is **blue** — off-brand vs. green theme; look differs from rest of app. Browser-autofill light-blue field background clashes. | Apply design system tokens (Section 4).
- Phase: P1 · Area: SEC · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, L1 | Login button is **blue** — off-brand vs. green theme; look differs from rest of app. Browser-autofill light-blue field background clashes. | Apply design system tokens (Section 4).
- Dependencies: P1-SEC-002
- Status: [ ]

## P1-SEC-004 — L2 | "Forgot password" exists — verify it actually works end-to-end (email token, expiry, single-use, rate-limited). | Implement/verify full reset flow + SMS option.
- Phase: P1 · Area: SEC · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, L2 | "Forgot password" exists — verify it actually works end-to-end (email token, expiry, single-use, rate-limited). | Implement/verify full reset flow + SMS option.
- Dependencies: P1-SEC-003
- Status: [ ]

## P1-BE-002 — L3 | Default `admin` account. | **No default credentials in production.** First-run setup wizard forces creation of the owner account with a strong password. Seed demo users only in demo profile.
- Phase: P1 · Area: BE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, L3 | Default `admin` account. | **No default credentials in production.** First-run setup wizard forces creation of the owner account with a strong password. Seed demo users only in demo profile.
- Dependencies: P1-BE-001
- Status: [ ]

## P1-SEC-005 — L4 | No MFA, no lockout feedback, no session management. | TOTP 2FA (+ backup codes) for staff (mandatory option), progressive lockout with clear message, "active sessions/devices" page with revoke, refresh-token rotation, idle timeout.
- Phase: P1 · Area: SEC · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, L4 | No MFA, no lockout feedback, no session management. | TOTP 2FA (+ backup codes) for staff (mandatory option), progressive lockout with clear message, "active sessions/devices" page with revoke, refresh-token rotation, idle timeout.
- Dependencies: P1-SEC-004
- Status: [ ]

## P1-UX-009 — A1 | Top nav has 7 flat items, no global search, no notifications, no quick-actions, no breadcrumbs. Does not scale. | Redesign shell: collapsible **side navigation** (grouped: Circulation, Catalog, Members, Reports, Administration) + top bar with **global search (Ctrl/Cmd+K command palette)**, quick actions ("New loan", "Return"), notification bell, language, theme, user menu. Mobile-friendly.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, A1 | Top nav has 7 flat items, no global search, no notifications, no quick-actions, no breadcrumbs. Does not scale. | Redesign shell: collapsible **side navigation** (grouped: Circulation, Catalog, Members, Reports, Administration) + top bar with **global search (Ctrl/Cmd+K command palette)**, quick actions ("New loan", "Return"), notification bell, language, theme, user menu. Mobile-friendly.
- Dependencies: P1-UX-008
- Status: [ ]

## P1-DB-001 — A2 | **Inconsistent visual language** between pages: Books/Members use big white cards with yellow + green + purple + blue + red buttons; Staff accounts and Input devices use another style (eyebrow label + narrower cards); Loans uses green box etc. Multiple button palettes. | One **design system** (Section 4): one primary, one secondary, one destructive, consistent card/table/form/modal patterns.
- Phase: P1 · Area: DB · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, A2 | **Inconsistent visual language** between pages: Books/Members use big white cards with yellow + green + purple + blue + red buttons; Staff accounts and Input devices use another style (eyebrow label + narrower cards); Loans uses green box etc. Multiple button palettes. | One **design system** (Section 4): one primary, one secondary, one destructive, consistent card/table/form/modal patterns.
- Dependencies: none
- Status: [ ]

## P1-SEC-006 — A3 | **Dark mode contrast bugs:** page titles on *Devices* and *Staff accounts* are dark green on dark navy (nearly invisible); user-menu "خروج" is low contrast; some helper texts too dim; empty-state icons washed out. | Fix with semantic color tokens; run axe-core contrast checks on every page in both themes in CI.
- Phase: P1 · Area: SEC · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, A3 | **Dark mode contrast bugs:** page titles on *Devices* and *Staff accounts* are dark green on dark navy (nearly invisible); user-menu "خروج" is low contrast; some helper texts too dim; empty-state icons washed out. | Fix with semantic color tokens; run axe-core contrast checks on every page in both themes in CI.
- Dependencies: P1-SEC-005
- Status: [ ]

## P1-UX-010 — A4 | Dashboard: stat cards show tiny dot-sized "0"; **chart month labels are Gregorian transliterations (ژوئن/ژوئیه/اوت…)** while the rest of the app is Jalali; stray "(" character at the bottom of "Recent loans" card; empty chart with bare axis "1/0". | Real KPI cards (big numbers, trend deltas, click-through), Jalali/Gregorian per tenant setting consistently, meaningful empty states, remove stray glyph, richer widgets (Section 6.9).
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, A4 | Dashboard: stat cards show tiny dot-sized "0"; **chart month labels are Gregorian transliterations (ژوئن/ژوئیه/اوت…)** while the rest of the app is Jalali; stray "(" character at the bottom of "Recent loans" card; empty chart with bare axis "1/0". | Real KPI cards (big numbers, trend deltas, click-through), Jalali/Gregorian per tenant setting consistently, meaningful empty states, remove stray glyph, richer widgets (Section 6.9).
- Dependencies: P1-UX-009
- Status: [ ]

## P1-DB-002 — A5 | Tables have no pagination controls, sorting, column chooser, bulk actions, export, row detail drawer, density options visible in the empty state. | Standard **data-grid** component (Section 4.4).
- Phase: P1 · Area: DB · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, A5 | Tables have no pagination controls, sorting, column chooser, bulk actions, export, row detail drawer, density options visible in the empty state. | Standard **data-grid** component (Section 4.4).
- Dependencies: P1-DB-001
- Status: [ ]

## P1-UX-011 — A6 | Filters are hidden behind a "show filters" button and are plain text boxes for fields that should be selects (status/membership type/language). | Always-visible search bar + advanced filter drawer with proper controls, saved filters, removable filter chips.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, A6 | Filters are hidden behind a "show filters" button and are plain text boxes for fields that should be selects (status/membership type/language). | Always-visible search bar + advanced filter drawer with proper controls, saved filters, removable filter chips.
- Dependencies: P1-UX-010
- Status: [ ]

## P1-UX-012 — A7 | Empty states are plain text. | Illustrated, actionable empty states ("Add your first book", "Import from Excel", "Load demo data").
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, A7 | Empty states are plain text. | Illustrated, actionable empty states ("Add your first book", "Import from Excel", "Load demo data").
- Dependencies: P1-UX-011
- Status: [ ]

## P1-UX-013 — A8 | No visible tenant/library name, no help, no keyboard shortcuts, no onboarding. | Branding in shell, contextual help links, shortcut cheatsheet (`?`), guided first-run checklist.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, A8 | No visible tenant/library name, no help, no keyboard shortcuts, no onboarding. | Branding in shell, contextual help links, shortcut cheatsheet (`?`), guided first-run checklist.
- Dependencies: P1-UX-012
- Status: [ ]

## P1-UX-014 — B1 | **Domain model flaw: no distinction between a bibliographic record and physical copies.** The form has a single "تعداد نسخه" (number of copies) integer. Loans are made by *book + ISBN*, so two copies of the same title cannot be tracked individually (who has which copy, which is lost/damaged). | Introduce **Work/Title → Edition(Instance) → Item(Copy)** model (Section 6.1). Each item has its own **barcode / accession number**, status, location, condition. **Loans and returns scan the item barcode, not the ISBN.**
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, B1 | **Domain model flaw: no distinction between a bibliographic record and physical copies.** The form has a single "تعداد نسخه" (number of copies) integer. Loans are made by *book + ISBN*, so two copies of the same title cannot be tracked individually (who has which copy, which is lost/damaged). | Introduce **Work/Title → Edition(Instance) → Item(Copy)** model (Section 6.1). Each item has its own **barcode / accession number**, status, location, condition. **Loans and returns scan the item barcode, not the ISBN.**
- Dependencies: P1-UX-013
- Status: [ ]

## P1-DB-003 — B2 | Table columns omit availability, copy counts, ISBN-13, location, publisher, year. | Columns: cover, title (+subtitle), authors, subject(s), publisher/year, ISBN, call number, copies available/total, status, actions. User-configurable.
- Phase: P1 · Area: DB · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, B2 | Table columns omit availability, copy counts, ISBN-13, location, publisher, year. | Columns: cover, title (+subtitle), authors, subject(s), publisher/year, ISBN, call number, copies available/total, status, actions. User-configurable.
- Dependencies: P1-DB-002
- Status: [ ]

## P1-DB-004 — B3 | Form fields use **free text where structured data is required**: Subject (single text), Author (single text), Publisher (text), Language (text, e.g. "فارسی"), Edition (text), Membership type (text). | Authors/contributors as **many-to-many entities with roles** (author, translator, editor, illustrator) with autocomplete + authority control (dedupe/merge); Subjects as hierarchical **taxonomy** (multi-select, DDC/LCSH/Persian subject headings supported); Publisher as entity; Language as ISO 639 select (fa, en, ar, …); Series + volume; Edition statement.
- Phase: P1 · Area: DB · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, B3 | Form fields use **free text where structured data is required**: Subject (single text), Author (single text), Publisher (text), Language (text, e.g. "فارسی"), Edition (text), Membership type (text). | Authors/contributors as **many-to-many entities with roles** (author, translator, editor, illustrator) with autocomplete + authority control (dedupe/merge); Subjects as hierarchical **taxonomy** (multi-select, DDC/LCSH/Persian subject headings supported); Publisher as entity; Language as ISO 639 select (fa, en, ar, …); Series + volume; Edition statement.
- Dependencies: P1-DB-003
- Status: [ ]

## P1-UX-015 — B4 | Placeholder typo: "ISBN-10 یا **SBN**-13". Many placeholders are fake examples that look like values. | Fix; use proper labels + helper text; placeholders only as hints.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, B4 | Placeholder typo: "ISBN-10 یا **SBN**-13". Many placeholders are fake examples that look like values. | Fix; use proper labels + helper text; placeholders only as hints.
- Dependencies: P1-UX-014
- Status: [ ]

## P1-BE-003 — B5 | ISBN fields accept anything. | Validate ISBN-10/13 checksum, auto-convert 10↔13, detect duplicates (warn + offer "add copy to existing title").
- Phase: P1 · Area: BE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, B5 | ISBN fields accept anything. | Validate ISBN-10/13 checksum, auto-convert 10↔13, detect duplicates (warn + offer "add copy to existing title").
- Dependencies: P1-BE-002
- Status: [ ]

## P1-BE-004 — B6 | Add-book modal is a long scroll inside a small dialog with the scan/lookup panel on top. Redundant double upload control for cover (drop zone **and** a button). Two checkboxes ("continuous registration", "review queue") are cryptic. | Replace with a **full-page / wide drawer wizard**: (1) Find by ISBN/scan/title lookup → (2) Review & edit metadata → (3) Add copies (barcodes) & location → (4) Cover → Save. One upload control with preview, crop, drag-drop, paste, URL fetch (permitted sources only). "Continuous registration" renamed **"Rapid cataloging mode"** with explained behavior.
- Phase: P1 · Area: BE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, B6 | Add-book modal is a long scroll inside a small dialog with the scan/lookup panel on top. Redundant double upload control for cover (drop zone **and** a button). Two checkboxes ("continuous registration", "review queue") are cryptic. | Replace with a **full-page / wide drawer wizard**: (1) Find by ISBN/scan/title lookup → (2) Review & edit metadata → (3) Add copies (barcodes) & location → (4) Cover → Save. One upload control with preview, crop, drag-drop, paste, URL fetch (permitted sources only). "Continuous registration" renamed **"Rapid cataloging mode"** with explained behavior.
- Dependencies: P1-BE-003
- Status: [ ]

## P1-BE-005 — B7 | Lookup says results come from several public catalogs and "may not cover all books". | Implement pluggable **metadata providers** with caching, rate limits, and respect for each provider's ToS: Open Library, Google Books, Library of Congress / other **Z39.50 / SRU** targets (incl. National Library of Iran if available), user-configurable. Show provenance per field; let staff pick between candidates.
- Phase: P1 · Area: BE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, B7 | Lookup says results come from several public catalogs and "may not cover all books". | Implement pluggable **metadata providers** with caching, rate limits, and respect for each provider's ToS: Open Library, Google Books, Library of Congress / other **Z39.50 / SRU** targets (incl. National Library of Iran if available), user-configurable. Show provenance per field; let staff pick between candidates.
- Dependencies: P1-BE-004
- Status: [ ]

## P1-UX-016 — B8 | **ISBN barcode camera scanner**: the live preview is shown as a solid **orange block**; no scan guide. | See Section 7 (Scanner UX): viewfinder with **thin red scan-line animation**, corner brackets, dim outside region, torch/camera switch, beep + vibration + success flash, continuous mode, manual fallback. The red line must sit over exactly the region that is decoded (crop the decode area to the guide box).
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, B8 | **ISBN barcode camera scanner**: the live preview is shown as a solid **orange block**; no scan guide. | See Section 7 (Scanner UX): viewfinder with **thin red scan-line animation**, corner brackets, dim outside region, torch/camera switch, beep + vibration + success flash, continuous mode, manual fallback. The red line must sit over exactly the region that is decoded (crop the decode area to the guide box).
- Dependencies: P1-UX-015
- Status: [ ]

## P1-DB-005 — B9 | Missing metadata: price, acquisition date/source/vendor, donation flag, condition, audience level, page/dimension, table of contents, tags, series, cover back, call number split (Dewey + Cutter + year), item type (book, periodical, thesis, DVD, e-book, map…). | Add as appropriate (Section 6.1).
- Phase: P1 · Area: DB · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, B9 | Missing metadata: price, acquisition date/source/vendor, donation flag, condition, audience level, page/dimension, table of contents, tags, series, cover back, call number split (Dewey + Cutter + year), item type (book, periodical, thesis, DVD, e-book, map…). | Add as appropriate (Section 6.1).
- Dependencies: P1-DB-004
- Status: [ ]

## P1-UX-017 — B10 | Excel import: only a template + 10 MB limit + "preview" button; no mapping, no row-level error report. | Robust importer: column mapping UI, dry-run preview, per-row validation errors downloadable as Excel, duplicate strategy (skip/merge/update), async job with progress, undo/rollback of an import batch, CSV + MARC support. Also **export** (Excel/CSV/MARC21/UNIMARC/JSON).
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, B10 | Excel import: only a template + 10 MB limit + "preview" button; no mapping, no row-level error report. | Robust importer: column mapping UI, dry-run preview, per-row validation errors downloadable as Excel, duplicate strategy (skip/merge/update), async job with progress, undo/rollback of an import batch, CSV + MARC support. Also **export** (Excel/CSV/MARC21/UNIMARC/JSON).
- Dependencies: P1-UX-016
- Status: [ ]

## P1-UX-018 — B11 | No label/spine/barcode printing; no QR; no bulk actions (change location/status/delete/print labels). | Label designer + print (Code128/EAN-13/QR, Avery-like sheets, thermal 40×30/58mm), bulk operations.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, B11 | No label/spine/barcode printing; no QR; no bulk actions (change location/status/delete/print labels). | Label designer + print (Code128/EAN-13/QR, Avery-like sheets, thermal 40×30/58mm), bulk operations.
- Dependencies: P1-UX-017
- Status: [ ]

## P1-OPS-001 — B12 | Delete/edit has no history. | Per-record **history tab** (Envers) with diff and "restore". Soft delete with trash.
- Phase: P1 · Area: OPS · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, B12 | Delete/edit has no history. | Per-record **history tab** (Envers) with diff and "restore". Soft delete with trash.
- Dependencies: none
- Status: [ ]

## P1-DB-006 — M1 | "Membership type" is a **free-text** field ("standard, special"). | **Membership plans** entity (Section 6.2): loan period, max loans, max reservations, renewals, fines policy, fee, validity, allowed item types. Select, not text.
- Phase: P1 · Area: DB · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, M1 | "Membership type" is a **free-text** field ("standard, special"). | **Membership plans** entity (Section 6.2): loan period, max loans, max reservations, renewals, fines policy, fee, validity, allowed item types. Select, not text.
- Dependencies: P1-DB-005
- Status: [ ]

## P1-DB-007 — M2 | National ID is mandatory; no member number, no expiry, no card. | Auto/manual **member number + barcode/QR card**, join date, **expiry & renewal**, printable/PDF/Apple-Google Wallet-style digital card (QR) in member portal.
- Phase: P1 · Area: DB · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, M2 | National ID is mandatory; no member number, no expiry, no card. | Auto/manual **member number + barcode/QR card**, join date, **expiry & renewal**, printable/PDF/Apple-Google Wallet-style digital card (QR) in member portal.
- Dependencies: P1-DB-006
- Status: [ ]

## P1-BE-006 — M3 | No member categories (public / student / faculty / staff / child). University context absent. | Member categories + **university fields** (student/staff ID, faculty, department, degree, entry year, status) configurable on/off per tenant.
- Phase: P1 · Area: BE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, M3 | No member categories (public / student / faculty / staff / child). University context absent. | Member categories + **university fields** (student/staff ID, faculty, department, degree, entry year, status) configurable on/off per tenant.
- Dependencies: P1-BE-005
- Status: [ ]

## P1-DOC-001 — M4 | No guardian for minors, no blocks/notes, no fine balance, no borrowing history on the member page. | Member **profile page** with tabs: Overview, Loans (current/history), Reservations, Fines & payments, Notes, Documents, Audit. Block/ban with reason, guardian link, privacy-safe history policy (anonymize after N days if configured).
- Phase: P1 · Area: DOC · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, M4 | No guardian for minors, no blocks/notes, no fine balance, no borrowing history on the member page. | Member **profile page** with tabs: Overview, Loans (current/history), Reservations, Fines & payments, Notes, Documents, Audit. Block/ban with reason, guardian link, privacy-safe history policy (anonymize after N days if configured).
- Dependencies: none
- Status: [ ]

## P1-FE-002 — M5 | Photo upload is clunky (dropzone + button duplicate); no webcam capture. | Single photo control + **webcam capture** + crop.
- Phase: P1 · Area: FE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, M5 | Photo upload is clunky (dropzone + button duplicate); no webcam capture. | Single photo control + **webcam capture** + crop.
- Dependencies: P1-FE-001
- Status: [ ]

## P1-BE-007 — M6 | Filters use text boxes for status/membership. | Selects + chips.
- Phase: P1 · Area: BE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, M6 | Filters use text boxes for status/membership. | Selects + chips.
- Dependencies: P1-BE-006
- Status: [ ]

## P1-FE-003 — M7 | Birth date field is Jalali with a calendar button — good — but error hint "can't be after today" is always visible; the field placeholder looks like real data (۱۴۰۵/۰۷/۱۹). | Jalali/Gregorian-aware date picker component used app-wide; show errors only when relevant.
- Phase: P1 · Area: FE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, M7 | Birth date field is Jalali with a calendar button — good — but error hint "can't be after today" is always visible; the field placeholder looks like real data (۱۴۰۵/۰۷/۱۹). | Jalali/Gregorian-aware date picker component used app-wide; show errors only when relevant.
- Dependencies: P1-FE-002
- Status: [ ]

## P1-BE-008 — M8 | Excel import for members same limitations as B10. | Same importer framework; also **bulk-sync from university SIS** (CSV/LDAP/API).
- Phase: P1 · Area: BE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, M8 | Excel import for members same limitations as B10. | Same importer framework; also **bulk-sync from university SIS** (CSV/LDAP/API).
- Dependencies: P1-BE-007
- Status: [ ]

## P1-DB-008 — LN1 | Loan form picks *book* (title) + member; scan target dropdown says "book barcode (شابک)". Because of B1, wrong entity. Due date not visible/choosable. | Circulation desk redesign (Section 6.3): **two big scan inputs** — *Member card* then *Item barcodes* (multiple, rapid). Due date computed by policy and shown; override with permission + reason.
- Phase: P1 · Area: DB · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, LN1 | Loan form picks *book* (title) + member; scan target dropdown says "book barcode (شابک)". Because of B1, wrong entity. Due date not visible/choosable. | Circulation desk redesign (Section 6.3): **two big scan inputs** — *Member card* then *Item barcodes* (multiple, rapid). Due date computed by policy and shown; override with permission + reason.
- Dependencies: P1-DB-007
- Status: [ ]

## P1-BE-009 — LN2 | Return is "scan ISBN, system finds the active loan, asks you to confirm" — ambiguous with several copies. | Return by **item barcode**, instant, with audible/visual result; auto-detect holds → "Route to hold shelf for <member>", overdue → fine dialog, damaged/lost flows.
- Phase: P1 · Area: BE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, LN2 | Return is "scan ISBN, system finds the active loan, asks you to confirm" — ambiguous with several copies. | Return by **item barcode**, instant, with audible/visual result; auto-detect holds → "Route to hold shelf for <member>", overdue → fine dialog, damaged/lost flows.
- Dependencies: P1-BE-008
- Status: [ ]

## P1-BE-010 — LN3 | No renewals, no fines, no receipts, no overdue notices, no block rules (member expired, over limit, has fines). | Implement all (Section 6.3–6.5). Policy engine with clear human-readable denial reasons and staff override.
- Phase: P1 · Area: BE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, LN3 | No renewals, no fines, no receipts, no overdue notices, no block rules (member expired, over limit, has fines). | Implement all (Section 6.3–6.5). Policy engine with clear human-readable denial reasons and staff override.
- Dependencies: P1-BE-009
- Status: [ ]

## P1-UX-019 — LN4 | Status dropdown includes labels such as "بازگشتی" (ambiguous). | Clear statuses: Active, Overdue, Due soon, Returned, Lost, Claimed returned.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, LN4 | Status dropdown includes labels such as "بازگشتی" (ambiguous). | Clear statuses: Active, Overdue, Due soon, Returned, Lost, Claimed returned.
- Dependencies: P1-UX-018
- Status: [ ]

## P1-SEC-007 — LN5 | Filters limited to national ID, ISBN-13, status. | Filter by member, item barcode, title, date ranges, branch, staff.
- Phase: P1 · Area: SEC · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, LN5 | Filters limited to national ID, ISBN-13, status. | Filter by member, item barcode, title, date ranges, branch, staff.
- Dependencies: P1-SEC-006
- Status: [ ]

## P1-UX-020 — LN6 | Page layout: a green "scan to return" box floats inside the filters area, confusing. | Dedicated **Quick Return** and **Quick Checkout** modes (full-screen desk mode).
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, LN6 | Page layout: a green "scan to return" box floats inside the filters area, confusing. | Dedicated **Quick Return** and **Quick Checkout** modes (full-screen desk mode).
- Dependencies: P1-UX-019
- Status: [ ]

## P1-UX-021 — RS1 | New-reservation form shows **red errors immediately on open** (pristine form) and the messages sit *above* the wrong fields ("select a member from the list is required" appears between fields, a stray "ثبت" tooltip floats). | Validation only after interaction/submit; message directly under its field; fix tooltip glitch.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, RS1 | New-reservation form shows **red errors immediately on open** (pristine form) and the messages sit *above* the wrong fields ("select a member from the list is required" appears between fields, a stray "ثبت" tooltip floats). | Validation only after interaction/submit; message directly under its field; fix tooltip glitch.
- Dependencies: P1-UX-020
- Status: [ ]

## P1-BE-011 — RS2 | Reservation = member + book + manual expiry date (default +14 days). A reservation should be a **queue (hold) on a title**, fulfilled by the next returned copy. | Real **hold queue** with position, auto-assign on return, hold-shelf pickup window (e.g., 3 days), auto-expire, notifications (email/SMS/push), staff & member cancellation, priority rules, "hold on available item → pull from shelf" list.
- Phase: P1 · Area: BE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, RS2 | Reservation = member + book + manual expiry date (default +14 days). A reservation should be a **queue (hold) on a title**, fulfilled by the next returned copy. | Real **hold queue** with position, auto-assign on return, hold-shelf pickup window (e.g., 3 days), auto-expire, notifications (email/SMS/push), staff & member cancellation, priority rules, "hold on available item → pull from shelf" list.
- Dependencies: P1-BE-010
- Status: [ ]

## P1-BE-012 — RS3 | Calendar view uses Jalali month, but legend only shows "reservation date / expiry date". | Keep Jalali calendar; add event details popover, drag-less read-only, filters; list ↔ calendar toggle persisted.
- Phase: P1 · Area: BE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, RS3 | Calendar view uses Jalali month, but legend only shows "reservation date / expiry date". | Keep Jalali calendar; add event details popover, drag-less read-only, filters; list ↔ calendar toggle persisted.
- Dependencies: P1-BE-011
- Status: [ ]

## P1-BE-013 — RS4 | Autocomplete shows "no member found" with no way to create. | "Create new member" inline action.
- Phase: P1 · Area: BE · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, RS4 | Autocomplete shows "no member found" with no way to create. | "Create new member" inline action.
- Dependencies: P1-BE-012
- Status: [ ]

## P1-SEC-008 — S1 | Only two roles (Librarian, System admin). | **Granular RBAC**: permissions matrix, custom roles, branch scoping (Section 6.8).
- Phase: P1 · Area: SEC · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, S1 | Only two roles (Librarian, System admin). | **Granular RBAC**: permissions matrix, custom roles, branch scoping (Section 6.8).
- Dependencies: P1-SEC-007
- Status: [ ]

## P1-SEC-009 — S2 | Creating account requires manual password; "recovery email not registered" shown in the list. | Invite-by-email flow (set-password link), force 2FA setup, show last login, sessions, status, role chips.
- Phase: P1 · Area: SEC · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, S2 | Creating account requires manual password; "recovery email not registered" shown in the list. | Invite-by-email flow (set-password link), force 2FA setup, show last login, sessions, status, role chips.
- Dependencies: P1-SEC-008
- Status: [ ]

## P1-UX-022 — S3 | Page style inconsistent with others (see A2). | Apply shell + design system.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, S3 | Page style inconsistent with others (see A2). | Apply shell + design system.
- Dependencies: P1-UX-021
- Status: [ ]

## P1-UX-023 — D1 | Very technical, developer-facing UI: raw strings like `system-default`, `keyboard-wedge, usb, bluetooth, wifi, configurable-terminator` and "domain · 0" leak into the UI; labels mix English/Persian. | Rewrite as a **"Scanners & devices" settings page** in plain language with a **setup wizard** ("Plug in your scanner → scan the test code → we detect prefix/suffix automatically").
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, D1 | Very technical, developer-facing UI: raw strings like `system-default`, `keyboard-wedge, usb, bluetooth, wifi, configurable-terminator` and "domain · 0" leak into the UI; labels mix English/Persian. | Rewrite as a **"Scanners & devices" settings page** in plain language with a **setup wizard** ("Plug in your scanner → scan the test code → we detect prefix/suffix automatically").
- Dependencies: P1-UX-022
- Status: [ ]

## P1-UX-024 — D2 | "Scan test box" says slow manual typing is not recognized as a scanner — good idea; hidden at the bottom. | Keep and surface as step 2 of the wizard with real-time feedback (speed, length, terminator, symbology guess).
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, D2 | "Scan test box" says slow manual typing is not recognized as a scanner — good idea; hidden at the bottom. | Keep and surface as step 2 of the wizard with real-time feedback (speed, length, terminator, symbology guess).
- Dependencies: P1-UX-023
- Status: [ ]

## P1-DB-009 — D3 | Per-form policy table is confusing (form, station, staff, allowed methods, default). | Simplify: global default + per-station override.
- Phase: P1 · Area: DB · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, D3 | Per-form policy table is confusing (form, station, staff, allowed methods, default). | Simplify: global default + per-station override.
- Dependencies: P1-DB-008
- Status: [ ]

## P1-SEC-010 — D4 | Device token shown only as hashed; revoke is mentioned in text. | Device list with last seen, owner, station, revoke button, rename.
- Phase: P1 · Area: SEC · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, D4 | Device token shown only as hashed; revoke is mentioned in text. | Device list with last seen, owner, station, revoke button, rename.
- Dependencies: P1-SEC-009
- Status: [ ]

## P1-UX-025 — Mixed UI libraries/styles (Material + custom + Tailwind) → unify.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, Mixed UI libraries/styles (Material + custom + Tailwind) → unify.
- Dependencies: P1-UX-024
- Status: [ ]

## P1-UX-026 — Browser-native `<select>` with chevrons on the left clash in RTL; custom tooltips differ in style (some white-on-black native, some custom).
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, Browser-native `<select>` with chevrons on the left clash in RTL; custom tooltips differ in style (some white-on-black native, some custom).
- Dependencies: P1-UX-025
- Status: [ ]

## P1-DB-010 — Digits: decide per setting (Persian vs Latin digits), apply consistently in tables, dates, forms, charts.
- Phase: P1 · Area: DB · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, Digits: decide per setting (Persian vs Latin digits), apply consistently in tables, dates, forms, charts.
- Dependencies: P1-DB-009
- Status: [ ]

## P1-UX-027 — No i18n infrastructure for additional languages, no feature flags, no tenant settings UI, no notifications center.
- Phase: P1 · Area: UX · Source: SPEC §1
- Acceptance criteria: Given the affected workflow, No i18n infrastructure for additional languages, no feature flags, no tenant settings UI, no notifications center.
- Dependencies: P1-UX-026
- Status: [ ]

## P0-DOC-001 — Repository audit index exists
- Phase: P0 · Area: DOC · Source: SPEC §0
- Acceptance criteria: `docs/AUDIT.md` identifies architecture, prior audit evidence, major open gaps, and current verified changes without claiming completion.
- Dependencies: none
- Status: [v]

## P0-DOC-002 — Full requirement checklist exists
- Phase: P0 · Area: DOC · Source: SPEC §0
- Acceptance criteria: `docs/CHECKLIST.md` covers §1, §3–§9, and §13–§15; every record has a unique ID, source section, acceptance criteria, dependencies, and status; the source coverage map includes each requested section.
- Dependencies: P0-DOC-001
- Status: [v]

## P0-DOC-003 — Progress log exists
- Phase: P0 · Area: DOC · Source: SPEC §0
- Acceptance criteria: `docs/PROGRESS.md` records evidence, current focus, and next five tasks.
- Dependencies: P0-DOC-002
- Status: [v]

## P0-DOC-004 — Decisions log exists
- Phase: P0 · Area: DOC · Source: SPEC §0
- Acceptance criteria: `docs/DECISIONS.md` documents migration, identity, and test viewport decisions.
- Dependencies: P0-DOC-001
- Status: [v]


## P0-DOC-005 — Decompose compound roadmap requirements into atomic, verifiable tasks
- Phase: P0 · Area: DOC · Source: SPEC §0, §3–§9, §13–§15
- Acceptance criteria: Every remaining checklist leaf task represents one independently verifiable outcome, has a concrete acceptance check and direct dependencies, and compound phase summaries link to their child tasks. No grouped task is marked verified while a child is open.
- Dependencies: P0-DOC-002
- Status: [~]

## P0-DB-001 — Tenant model: `tenant_id` on all business tables (or schema-per-tenant — choose, document in DECISIONS.md), enforced in a single repository/filter layer (no accidental cross-tenant leaks; add automated tests proving isolation).
- Phase: P0 · Area: DB · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, Tenant model: `tenant_id` on all business tables (or schema-per-tenant — choose, document in DECISIONS.md), enforced in a single repository/filter layer (no accidental cross-tenant leaks; add automated tests proving isolation).
- Dependencies: none
- Status: [ ]

## P0-FE-001 — **On-prem licensing:** upgrade the existing offline license gate: signed license file (Ed25519/RSA), contains customer, edition (Public/University/Enterprise), limits (branches, members, staff seats, items), modules, expiry, grace period, hardware/instance binding (optional). Admin "License" page showing status & limits, graceful read-only mode after expiry (never data loss), offline renewal flow. Keep the key-generator tool out of shipped artifacts; provide a separate internal CLI/web tool for the vendor.
- Phase: P0 · Area: FE · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **On-prem licensing:** upgrade the existing offline license gate: signed license file (Ed25519/RSA), contains customer, edition (Public/University/Enterprise), limits (branches, members, staff seats, items), modules, expiry, grace period, hardware/instance binding (optional). Admin "License" page showing status & limits, graceful read-only mode after expiry (never data loss), offline renewal flow. Keep the key-generator tool out of shipped artifacts; provide a separate internal CLI/web tool for the vendor.
- Dependencies: none
- Status: [ ]

## P0-BE-001 — **SaaS:** plans, usage metering (members/items/storage), billing hooks (Stripe + Iranian gateways like Zarinpal/IDPay abstracted behind an interface), trial mode, custom domain + tenant branding.
- Phase: P0 · Area: BE · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **SaaS:** plans, usage metering (members/items/storage), billing hooks (Stripe + Iranian gateways like Zarinpal/IDPay abstracted behind an interface), trial mode, custom domain + tenant branding.
- Dependencies: none
- Status: [ ]

## P0-BE-002 — **Feature flags/modules** per edition (e.g., RFID, SIP2, ILL, digital lending).
- Phase: P0 · Area: BE · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **Feature flags/modules** per edition (e.g., RFID, SIP2, ILL, digital lending).
- Dependencies: P0-BE-001
- Status: [ ]

## P0-UX-001 — Layered, modular (consider Spring Modulith): `catalog`, `circulation`, `members`, `holds`, `fines`, `acquisitions`, `serials`, `notifications`, `reports`, `integration`, `admin`, `licensing`, `audit`.
- Phase: P0 · Area: UX · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, Layered, modular (consider Spring Modulith): `catalog`, `circulation`, `members`, `holds`, `fines`, `acquisitions`, `serials`, `notifications`, `reports`, `integration`, `admin`, `licensing`, `audit`.
- Dependencies: none
- Status: [ ]

## P0-DB-002 — DTO-based API (no entity leakage), MapStruct, global exception handler returning **RFC 9457 Problem Details** with stable machine-readable `code` + localized `message` + field errors.
- Phase: P0 · Area: DB · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, DTO-based API (no entity leakage), MapStruct, global exception handler returning **RFC 9457 Problem Details** with stable machine-readable `code` + localized `message` + field errors.
- Dependencies: P0-DB-001
- Status: [ ]

## P0-OPS-001 — **Pagination/sorting/filtering/specification** standard on all lists; consistent `Page<T>` envelope
- Phase: P0 · Area: OPS · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **Pagination/sorting/filtering/specification** standard on all lists; consistent `Page<T>` envelope
- Dependencies: none
- Status: [ ]

## P0-BE-003 — ETag/If-Match optimistic locking on edits.
- Phase: P0 · Area: BE · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, ETag/If-Match optimistic locking on edits.
- Dependencies: P0-BE-002
- Status: [ ]

## P0-SEC-001 — **Validation:** Bean Validation + custom validators (ISBN, Iranian national ID checksum, phone, dates). Same rules mirrored in FE.
- Phase: P0 · Area: SEC · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **Validation:** Bean Validation + custom validators (ISBN, Iranian national ID checksum, phone, dates). Same rules mirrored in FE.
- Dependencies: none
- Status: [ ]

## P0-OPS-002 — **Transactions & concurrency:** circulation operations (checkout, return, renew, hold-fulfill) are atomic and race-safe (pessimistic/optimistic locks; unique constraint "one active loan per item"). Add concurrency tests.
- Phase: P0 · Area: OPS · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **Transactions & concurrency:** circulation operations (checkout, return, renew, hold-fulfill) are atomic and race-safe (pessimistic/optimistic locks; unique constraint "one active loan per item"). Add concurrency tests.
- Dependencies: P0-OPS-001
- Status: [ ]

## P0-DB-003 — **Async jobs:** import/export, notifications, reports, overdue sweeps via a job framework (Spring Scheduler + persisted job table
- Phase: P0 · Area: DB · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **Async jobs:** import/export, notifications, reports, overdue sweeps via a job framework (Spring Scheduler + persisted job table
- Dependencies: P0-DB-002
- Status: [ ]

## P0-FE-002 — ShedLock for cluster safety). Progress via WebSocket/SSE.
- Phase: P0 · Area: FE · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, ShedLock for cluster safety). Progress via WebSocket/SSE.
- Dependencies: P0-FE-001
- Status: [ ]

## P0-FE-003 — **File storage abstraction:** local FS / S3-compatible (MinIO) for covers, photos, attachments; image resizing (thumbnails, WebP), virus-scan hook, size/type allow-list.
- Phase: P0 · Area: FE · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **File storage abstraction:** local FS / S3-compatible (MinIO) for covers, photos, attachments; image resizing (thumbnails, WebP), virus-scan hook, size/type allow-list.
- Dependencies: P0-FE-002
- Status: [ ]

## P0-BE-004 — **Caching:** Caffeine/Redis for hot reads (catalog search facets, settings).
- Phase: P0 · Area: BE · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **Caching:** Caffeine/Redis for hot reads (catalog search facets, settings).
- Dependencies: P0-BE-003
- Status: [ ]

## P0-DB-004 — **Search:** start with MySQL FULLTEXT + good indexes; design a `SearchService` interface so **OpenSearch/Elasticsearch/Meilisearch** can be swapped in. Persian-aware analysis: normalize ي/ی, ك/ک, ZWNJ (نیم‌فاصله), Arabic/Persian digits, diacritics, stemming; typo tolerance; transliteration search (Finglish optional). Autocomplete/suggest endpoint.
- Phase: P0 · Area: DB · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **Search:** start with MySQL FULLTEXT + good indexes; design a `SearchService` interface so **OpenSearch/Elasticsearch/Meilisearch** can be swapped in. Persian-aware analysis: normalize ي/ی, ك/ک, ZWNJ (نیم‌فاصله), Arabic/Persian digits, diacritics, stemming; typo tolerance; transliteration search (Finglish optional). Autocomplete/suggest endpoint.
- Dependencies: P0-DB-003
- Status: [ ]

## P0-OPS-003 — **Observability:** structured JSON logs w/ correlation IDs, Micrometer metrics, Prometheus endpoint, health/readiness probes, OpenTelemetry tracing.
- Phase: P0 · Area: OPS · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **Observability:** structured JSON logs w/ correlation IDs, Micrometer metrics, Prometheus endpoint, health/readiness probes, OpenTelemetry tracing.
- Dependencies: P0-OPS-002
- Status: [ ]

## P0-TEST-001 — **Config:** 12-factor, profiles (`dev`, `test`, `prod`, `demo`), secrets from env/Vault, **no secrets in repo**; validate config at startup with clear errors.
- Phase: P0 · Area: TEST · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **Config:** 12-factor, profiles (`dev`, `test`, `prod`, `demo`), secrets from env/Vault, **no secrets in repo**; validate config at startup with clear errors.
- Dependencies: none
- Status: [ ]

## P0-DB-005 — **DB:** MySQL 8 prod; indexes reviewed (EXPLAIN on search/list queries)
- Phase: P0 · Area: DB · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **DB:** MySQL 8 prod; indexes reviewed (EXPLAIN on search/list queries)
- Dependencies: P0-DB-004
- Status: [ ]

## P0-DB-006 — Flyway repeatable seeds for reference data
- Phase: P0 · Area: DB · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, Flyway repeatable seeds for reference data
- Dependencies: P0-DB-005
- Status: [ ]

## P0-DB-007 — Envers audit tables; soft-delete where needed
- Phase: P0 · Area: DB · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, Envers audit tables; soft-delete where needed
- Dependencies: P0-DB-006
- Status: [ ]

## P0-BE-005 — UTC timestamps + tenant timezone (default Asia/Tehran).
- Phase: P0 · Area: BE · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, UTC timestamps + tenant timezone (default Asia/Tehran).
- Dependencies: P0-BE-004
- Status: [ ]

## P0-API-001 — **API:** OpenAPI 3 accurate & complete, versioned `/api/v1`, generated TS client for Angular (e.g., openapi-generator) to remove hand-written drift.
- Phase: P0 · Area: API · Source: SPEC §3.2
- Acceptance criteria: Every published backend endpoint is described in an OpenAPI 3 contract under `/api/v1`, and the Angular client is generated from that contract with a drift check.
- Dependencies: none
- Status: [ ]

## P0-BE-006 — **Integrations (see Section 8).**
- Phase: P0 · Area: BE · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **Integrations (see Section 8).**
- Dependencies: P0-BE-005
- Status: [ ]

## P0-SEC-002 — Standalone components, **signals**, zoneless-ready where feasible, OnPush everywhere, typed reactive forms, lazy-loaded routes, route guards by permission, resolvers, error boundary + global HTTP interceptor (auth refresh, problem-details mapping, retry/backoff).
- Phase: P0 · Area: SEC · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, Standalone components, **signals**, zoneless-ready where feasible, OnPush everywhere, typed reactive forms, lazy-loaded routes, route guards by permission, resolvers, error boundary + global HTTP interceptor (auth refresh, problem-details mapping, retry/backoff).
- Dependencies: P0-SEC-001
- Status: [ ]

## P0-BE-007 — **State:** signal-based stores per feature; optimistic updates where safe.
- Phase: P0 · Area: BE · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **State:** signal-based stores per feature; optimistic updates where safe.
- Dependencies: P0-BE-006
- Status: [ ]

## P0-DB-008 — **Forms:** one reusable form-field system (label, hint, error, required marker, a11y wiring), shared validators, `ControlValueAccessor` components: Jalali date picker, phone input, ISBN input, autocomplete/entity picker, tag/multi-select, money input, password with toggle.
- Phase: P0 · Area: DB · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **Forms:** one reusable form-field system (label, hint, error, required marker, a11y wiring), shared validators, `ControlValueAccessor` components: Jalali date picker, phone input, ISBN input, autocomplete/entity picker, tag/multi-select, money input, password with toggle.
- Dependencies: P0-DB-007
- Status: [ ]

## P0-UX-002 — **i18n:** Angular i18n or Transloco; fa (default) + en
- Phase: P0 · Area: UX · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **i18n:** Angular i18n or Transloco; fa (default) + en
- Dependencies: P0-UX-001
- Status: [ ]

## P0-UX-003 — RTL/LTR switch
- Phase: P0 · Area: UX · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, RTL/LTR switch
- Dependencies: P0-UX-002
- Status: [ ]

## P0-BE-008 — Jalali/Gregorian + Latin/Persian digits as tenant/user settings
- Phase: P0 · Area: BE · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, Jalali/Gregorian + Latin/Persian digits as tenant/user settings
- Dependencies: P0-BE-007
- Status: [ ]

## P0-UX-004 — ICU plurals; number/date/currency formatting through a single service.
- Phase: P0 · Area: UX · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, ICU plurals; number/date/currency formatting through a single service.
- Dependencies: P0-UX-003
- Status: [ ]

## P0-OPS-004 — **PWA:** installable, offline-capable *circulation desk* queue (offline checkout/return queued & synced with conflict handling) — a headline feature for libraries with flaky internet.
- Phase: P0 · Area: OPS · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **PWA:** installable, offline-capable *circulation desk* queue (offline checkout/return queued & synced with conflict handling) — a headline feature for libraries with flaky internet.
- Dependencies: P0-OPS-003
- Status: [ ]

## P0-UX-005 — **Performance:** budgets enforced in CI, virtual scroll for big lists, image lazy-loading, bundle analysis, Lighthouse ≥ 90 on public pages.
- Phase: P0 · Area: UX · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **Performance:** budgets enforced in CI, virtual scroll for big lists, image lazy-loading, bundle analysis, Lighthouse ≥ 90 on public pages.
- Dependencies: P0-UX-004
- Status: [ ]

## P0-UX-006 — **Quality:** ESLint clean, strict TS, Vitest unit tests, Playwright e2e (all critical flows), axe a11y checks in CI, visual regression snapshots for key screens in light + dark.
- Phase: P0 · Area: UX · Source: SPEC §3
- Acceptance criteria: Given the affected workflow, **Quality:** ESLint clean, strict TS, Vitest unit tests, Playwright e2e (all critical flows), axe a11y checks in CI, visual regression snapshots for key screens in light + dark.
- Dependencies: P0-UX-005
- Status: [ ]

## P0-BE-009 — Clear, calm, fast, keyboard-first for staff, delightful for patrons. A new librarian must complete a checkout within **60 seconds of first login** without training.
- Phase: P0 · Area: BE · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Clear, calm, fast, keyboard-first for staff, delightful for patrons. A new librarian must complete a checkout within **60 seconds of first login** without training.
- Dependencies: P0-BE-008
- Status: [ ]

## P0-SEC-003 — Single semantic token set (CSS variables): `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-primary`, `--color-primary-contrast`, `--color-danger`, `--color-warning`, `--color-success`, `--color-info`, borders, radii, shadows, spacing scale, type scale, motion durations. Light and dark values for each. **Tenant branding** overrides primary/accent + logo at runtime (with automatic contrast validation so a bad brand color can't break accessibility).
- Phase: P0 · Area: SEC · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Single semantic token set (CSS variables): `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-primary`, `--color-primary-contrast`, `--color-danger`, `--color-warning`, `--color-success`, `--color-info`, borders, radii, shadows, spacing scale, type scale, motion durations. Light and dark values for each. **Tenant branding** overrides primary/accent + logo at runtime (with automatic contrast validation so a bad brand color can't break accessibility).
- Dependencies: P0-SEC-002
- Status: [ ]

## P0-BE-010 — Typography: Vazirmatn (variable) for fa
- Phase: P0 · Area: BE · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Typography: Vazirmatn (variable) for fa
- Dependencies: P0-BE-009
- Status: [ ]

## P0-DB-009 — Inter (or system) for Latin; proper Persian line-height; tabular numerals in tables.
- Phase: P0 · Area: DB · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Inter (or system) for Latin; proper Persian line-height; tabular numerals in tables.
- Dependencies: P0-DB-008
- Status: [ ]

## P0-UX-007 — Icons: one set (Material Symbols or Lucide), RTL-mirrored where directional.
- Phase: P0 · Area: UX · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Icons: one set (Material Symbols or Lucide), RTL-mirrored where directional.
- Dependencies: P0-UX-006
- Status: [ ]

## P0-DB-010 — Buttons (primary/secondary/tertiary/destructive/icon, loading state), inputs, selects (custom, searchable, RTL-correct), combobox/entity picker, date picker (Jalali+Gregorian), toggle, checkbox/radio groups, tabs, stepper, dialog/drawer, toast/snackbar (with undo), banner, tooltip (single style), badge/status chip, avatar, card, stat card w/ sparkline, empty state, skeleton, pagination, breadcrumbs, command palette, file uploader, image cropper, stepper wizard, timeline, charts wrappers.
- Phase: P0 · Area: DB · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Buttons (primary/secondary/tertiary/destructive/icon, loading state), inputs, selects (custom, searchable, RTL-correct), combobox/entity picker, date picker (Jalali+Gregorian), toggle, checkbox/radio groups, tabs, stepper, dialog/drawer, toast/snackbar (with undo), banner, tooltip (single style), badge/status chip, avatar, card, stat card w/ sparkline, empty state, skeleton, pagination, breadcrumbs, command palette, file uploader, image cropper, stepper wizard, timeline, charts wrappers.
- Dependencies: P0-DB-009
- Status: [ ]

## P0-UX-008 — Server-side pagination/sort/filter, column resize/reorder/visibility (persisted), sticky header, row selection + bulk actions bar, row-expand/detail drawer, inline status chips, export (CSV/Excel/PDF of current view), saved views, keyboard navigation, density toggle, RTL correct, responsive (cards on mobile).
- Phase: P0 · Area: UX · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Server-side pagination/sort/filter, column resize/reorder/visibility (persisted), sticky header, row selection + bulk actions bar, row-expand/detail drawer, inline status chips, export (CSV/Excel/PDF of current view), saved views, keyboard navigation, density toggle, RTL correct, responsive (cards on mobile).
- Dependencies: P0-UX-007
- Status: [ ]

## P0-BE-011 — **Never disable a primary action without telling the user why** (tooltip/helper text) — prefer enabled + inline validation.
- Phase: P0 · Area: BE · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, **Never disable a primary action without telling the user why** (tooltip/helper text) — prefer enabled + inline validation.
- Dependencies: P0-BE-010
- Status: [ ]

## P0-BE-012 — Inline validation on blur; error summary on submit; focus first error.
- Phase: P0 · Area: BE · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Inline validation on blur; error summary on submit; focus first error.
- Dependencies: P0-BE-011
- Status: [ ]

## P0-UX-009 — Every async action: loading → success toast (with undo when possible) → error with retry and a support code.
- Phase: P0 · Area: UX · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Every async action: loading → success toast (with undo when possible) → error with retry and a support code.
- Dependencies: P0-UX-008
- Status: [ ]

## P0-BE-013 — Destructive actions: confirm with consequence text; offer undo/soft-delete.
- Phase: P0 · Area: BE · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Destructive actions: confirm with consequence text; offer undo/soft-delete.
- Dependencies: P0-BE-012
- Status: [ ]

## P0-BE-014 — Confirmation dialogs name the object ("Delete member «Ali Mohammadi»?").
- Phase: P0 · Area: BE · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Confirmation dialogs name the object ("Delete member «Ali Mohammadi»?").
- Dependencies: P0-BE-013
- Status: [ ]

## P0-UX-010 — Preserve user input on errors; autosave drafts for long forms.
- Phase: P0 · Area: UX · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Preserve user input on errors; autosave drafts for long forms.
- Dependencies: P0-UX-009
- Status: [ ]

## P0-BE-015 — Keyboard shortcuts for desk work (F2 new loan, F3 return, `/` focus search, Esc close).
- Phase: P0 · Area: BE · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Keyboard shortcuts for desk work (F2 new loan, F3 return, `/` focus search, Esc close).
- Dependencies: P0-BE-014
- Status: [ ]

## P0-BE-016 — Sound + color + icon feedback on scans (accessible: never color alone).
- Phase: P0 · Area: BE · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Sound + color + icon feedback on scans (accessible: never color alone).
- Dependencies: P0-BE-015
- Status: [ ]

## P0-BE-017 — Microcopy: friendly, consistent Persian; no developer jargon.
- Phase: P0 · Area: BE · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Microcopy: friendly, consistent Persian; no developer jargon.
- Dependencies: P0-BE-016
- Status: [ ]

## P0-BE-018 — Motion: subtle, respects `prefers-reduced-motion`.
- Phase: P0 · Area: BE · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Motion: subtle, respects `prefers-reduced-motion`.
- Dependencies: P0-BE-017
- Status: [ ]

## P0-DB-011 — Responsive: desktop-first for staff, **mobile-first for patron portal**; tablet kiosk layouts.
- Phase: P0 · Area: DB · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, Responsive: desktop-first for staff, **mobile-first for patron portal**; tablet kiosk layouts.
- Dependencies: P0-DB-010
- Status: [ ]

## P0-UX-011 — WCAG 2.2 AA minimum: contrast, focus visible, labels, ARIA live regions for scan results, skip links, screen-reader tested.
- Phase: P0 · Area: UX · Source: SPEC §4
- Acceptance criteria: Given the affected workflow, WCAG 2.2 AA minimum: contrast, focus visible, labels, ARIA live regions for scan results, skip links, screen-reader tested.
- Dependencies: P0-UX-010
- Status: [ ]

## P1-SEC-011 — Hero search with scope selector (All / Title / Author / Subject / ISBN / Series), **instant suggestions** (titles, authors, subjects), recent searches.
- Phase: P1 · Area: SEC · Source: SPEC §5
- Acceptance criteria: Given the affected workflow, Hero search with scope selector (All / Title / Author / Subject / ISBN / Series), **instant suggestions** (titles, authors, subjects), recent searches.
- Dependencies: P1-SEC-010
- Status: [ ]

## P1-BE-014 — Home sections: new arrivals, most borrowed, trending, staff picks, subject tiles with covers, upcoming events/news, opening hours widget, "Ask a librarian".
- Phase: P1 · Area: BE · Source: SPEC §5
- Acceptance criteria: Given the affected workflow, Home sections: new arrivals, most borrowed, trending, staff picks, subject tiles with covers, upcoming events/news, opening hours widget, "Ask a librarian".
- Dependencies: P1-BE-013
- Status: [ ]

## P1-SEC-012 — **Search results:** cover, title, authors, year, publisher, format badge, **availability badge** ("2 of 3 available — Main branch, Shelf A2"), facets (subject, author, language, year range, format, branch, availability, audience), sort (relevance, newest, title, popularity), grid/list toggle, shareable URLs, pagination/infinite scroll.
- Phase: P1 · Area: SEC · Source: SPEC §5
- Acceptance criteria: Given the affected workflow, **Search results:** cover, title, authors, year, publisher, format badge, **availability badge** ("2 of 3 available — Main branch, Shelf A2"), facets (subject, author, language, year range, format, branch, availability, audience), sort (relevance, newest, title, popularity), grid/list toggle, shareable URLs, pagination/infinite scroll.
- Dependencies: P1-SEC-011
- Status: [ ]

## P1-DB-011 — **Book detail page:** large cover, full metadata, summary/TOC, item table (barcode, branch, location, status, due date), "Reserve/Place hold" CTA, similar books, same author/series, subject links, share, QR, citation export (BibTeX/RIS/APA), JSON-LD `schema.org/Book` for SEO.
- Phase: P1 · Area: DB · Source: SPEC §5
- Acceptance criteria: Given the affected workflow, **Book detail page:** large cover, full metadata, summary/TOC, item table (barcode, branch, location, status, due date), "Reserve/Place hold" CTA, similar books, same author/series, subject links, share, QR, citation export (BibTeX/RIS/APA), JSON-LD `schema.org/Book` for SEO.
- Dependencies: P1-DB-010
- Status: [ ]

## P1-DB-012 — Static pages: About, Hours, Contact, Policies, FAQ (admin-editable CMS blocks).
- Phase: P1 · Area: DB · Source: SPEC §5
- Acceptance criteria: Given the affected workflow, Static pages: About, Hours, Contact, Policies, FAQ (admin-editable CMS blocks).
- Dependencies: P1-DB-011
- Status: [ ]

## P1-FE-004 — SEO: SSR/prerender for public pages (Angular SSR), sitemap, canonical URLs.
- Phase: P1 · Area: FE · Source: SPEC §5
- Acceptance criteria: Given the affected workflow, SEO: SSR/prerender for public pages (Angular SSR), sitemap, canonical URLs.
- Dependencies: P1-FE-003
- Status: [ ]

## P1-UX-028 — Dashboard: current loans with **due-date countdown**, one-click **renew**, holds with queue position, fines due + pay online, notifications.
- Phase: P1 · Area: UX · Source: SPEC §5
- Acceptance criteria: Given the affected workflow, Dashboard: current loans with **due-date countdown**, one-click **renew**, holds with queue position, fines due + pay online, notifications.
- Dependencies: P1-UX-027
- Status: [ ]

## P1-BE-015 — History, reading lists/wishlist/favorites, personal shelves, ratings & reviews (moderated), reading stats/streaks (gamification, optional), book suggestions (purchase requests), notification preferences (email/SMS/push/Telegram), profile & privacy (download/delete my data), digital membership card (QR + brightness boost), family/child accounts.
- Phase: P1 · Area: BE · Source: SPEC §5
- Acceptance criteria: Given the affected workflow, History, reading lists/wishlist/favorites, personal shelves, ratings & reviews (moderated), reading stats/streaks (gamification, optional), book suggestions (purchase requests), notification preferences (email/SMS/push/Telegram), profile & privacy (download/delete my data), digital membership card (QR + brightness boost), family/child accounts.
- Dependencies: P1-BE-014
- Status: [ ]

## P1-BE-016 — Self-service: join online (per registration mode), renew membership, pay fees, report lost card.
- Phase: P1 · Area: BE · Source: SPEC §5
- Acceptance criteria: Given the affected workflow, Self-service: join online (per registration mode), renew membership, pay fees, report lost card.
- Dependencies: P1-BE-015
- Status: [ ]

## P1-SEC-013 — Personalized recommendations (start with collaborative + content-based on subjects/authors; keep simple and explainable).
- Phase: P1 · Area: SEC · Source: SPEC §5
- Acceptance criteria: Given the affected workflow, Personalized recommendations (start with collaborative + content-based on subjects/authors; keep simple and explainable).
- Dependencies: P1-SEC-012
- Status: [ ]

## P4-SEC-001 — Entities: `Work`, `Edition` (bibliographic record: ISBN, publisher, year, edition statement, language, pages, format/media type, series, price), `Item` (barcode/accession, branch, location (section/shelf/row/column), call number, status, condition, acquisition info, notes, loan-type, RFID tag UID), `Contributor` (+role), `Subject` (hierarchical), `Publisher`, `Series`, `Branch`, `Location`.
- Phase: P4 · Area: SEC · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, Entities: `Work`, `Edition` (bibliographic record: ISBN, publisher, year, edition statement, language, pages, format/media type, series, price), `Item` (barcode/accession, branch, location (section/shelf/row/column), call number, status, condition, acquisition info, notes, loan-type, RFID tag UID), `Contributor` (+role), `Subject` (hierarchical), `Publisher`, `Series`, `Branch`, `Location`.
- Dependencies: none
- Status: [ ]

## P1-BE-017 — Item statuses: Available, On loan, On hold shelf, In transit, In repair/binding, Missing, Lost, Withdrawn, Reference-only (no loan), Not-for-loan.
- Phase: P1 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, Item statuses: Available, On loan, On hold shelf, In transit, In repair/binding, Missing, Lost, Withdrawn, Reference-only (no loan), Not-for-loan.
- Dependencies: P1-BE-016
- Status: [ ]

## P3-UX-001 — Item types: book, periodical/issue, thesis/dissertation, DVD/CD, e-book (link/file), map, game, equipment (laptops, chargers) — each with its own loan rules.
- Phase: P3 · Area: UX · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, Item types: book, periodical/issue, thesis/dissertation, DVD/CD, e-book (link/file), map, game, equipment (laptops, chargers) — each with its own loan rules.
- Dependencies: none
- Status: [ ]

## P1-BE-018 — **Import/export:** MARC21 & UNIMARC (read/write, via a library like marc4j), MARCXML, CSV/Excel, ONIX optional
- Phase: P1 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Import/export:** MARC21 & UNIMARC (read/write, via a library like marc4j), MARCXML, CSV/Excel, ONIX optional
- Dependencies: P1-BE-017
- Status: [ ]

## P3-BE-001 — **Z39.50/SRU copy-cataloging** client.
- Phase: P3 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Z39.50/SRU copy-cataloging** client.
- Dependencies: none
- Status: [ ]

## P1-SEC-014 — **Authority control:** merge/dedupe authors, publishers, subjects (with redirect "see also").
- Phase: P1 · Area: SEC · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Authority control:** merge/dedupe authors, publishers, subjects (with redirect "see also").
- Dependencies: P1-SEC-013
- Status: [ ]

## P1-SEC-015 — **Duplicate detection** by ISBN / normalized title+author+year.
- Phase: P1 · Area: SEC · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Duplicate detection** by ISBN / normalized title+author+year.
- Dependencies: P1-SEC-014
- Status: [ ]

## P1-BE-019 — **Cover management:** upload, fetch from providers, generated placeholder cover (initials + color) when none.
- Phase: P1 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Cover management:** upload, fetch from providers, generated placeholder cover (initials + color) when none.
- Dependencies: P1-BE-018
- Status: [ ]

## P1-OPS-002 — **Withdrawals/weeding:** reports of low-circulation items, withdraw with reason.
- Phase: P1 · Area: OPS · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Withdrawals/weeding:** reports of low-circulation items, withdraw with reason.
- Dependencies: P1-OPS-001
- Status: [ ]

## P4-UX-001 — **Inventory/stocktaking (انبارگردانی):** the "inventory" input form exists in device settings — implement/finish a real feature: start session per location, scan shelf items (supports rapid + offline), live reconciliation (found / missing / misplaced / unexpected), mark missing, report, close session.
- Phase: P4 · Area: UX · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Inventory/stocktaking (انبارگردانی):** the "inventory" input form exists in device settings — implement/finish a real feature: start session per location, scan shelf items (supports rapid + offline), live reconciliation (found / missing / misplaced / unexpected), mark missing, report, close session.
- Dependencies: none
- Status: [ ]

## P1-UX-029 — **Labels:** barcode, spine labels, shelf labels, member cards — template designer + print.
- Phase: P1 · Area: UX · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Labels:** barcode, spine labels, shelf labels, member cards — template designer + print.
- Dependencies: P1-UX-028
- Status: [ ]

## P1-BE-020 — Entities: `Member`, `MembershipPlan`, `MemberCategory`, `Guardian`, `MemberNote`, `MemberBlock`.
- Phase: P1 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, Entities: `Member`, `MembershipPlan`, `MemberCategory`, `Guardian`, `MemberNote`, `MemberBlock`.
- Dependencies: P1-BE-019
- Status: [ ]

## P3-BE-002 — Plans define: loan period per item type, max concurrent loans, max holds, renewal limit, grace days, fine rate/cap, membership fee & validity, allowed branches, allowed item types.
- Phase: P3 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, Plans define: loan period per item type, max concurrent loans, max holds, renewal limit, grace days, fine rate/cap, membership fee & validity, allowed branches, allowed item types.
- Dependencies: P3-BE-001
- Status: [ ]

## P1-BE-021 — Statuses: Pending, Active, Suspended, Expired, Blocked, Archived.
- Phase: P1 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, Statuses: Pending, Active, Suspended, Expired, Blocked, Archived.
- Dependencies: P1-BE-020
- Status: [ ]

## P1-BE-022 — Duplicate detection on creation (name+birthdate / ID / email / phone).
- Phase: P1 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, Duplicate detection on creation (name+birthdate / ID / email / phone).
- Dependencies: P1-BE-021
- Status: [ ]

## P3-BE-003 — **University mode:** link to SIS, auto-expire at graduation, faculty/department filters, bulk operations, guest/external membership (**allowed only when the tenant setting "Allow external members" is ON**, with its own plan and fee).
- Phase: P3 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **University mode:** link to SIS, auto-expire at graduation, faculty/department filters, bulk operations, guest/external membership (**allowed only when the tenant setting "Allow external members" is ON**, with its own plan and fee).
- Dependencies: P3-BE-002
- Status: [ ]

## P1-BE-023 — Privacy: configurable retention of loan history (keep / anonymize after N days), export & erase member data (GDPR-style), consent log.
- Phase: P1 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, Privacy: configurable retention of loan history (keep / anonymize after N days), export & erase member data (GDPR-style), consent log.
- Dependencies: P1-BE-022
- Status: [ ]

## P2-BE-001 — **Checkout:** scan member card/ID (or search) → member banner (photo, name, plan, status, alerts: fines, expired, blocks, holds ready) → scan items rapidly → each row shows title, due date, result chip. Print/email/SMS **receipt**. Cancel/undo last scan.
- Phase: P2 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Checkout:** scan member card/ID (or search) → member banner (photo, name, plan, status, alerts: fines, expired, blocks, holds ready) → scan items rapidly → each row shows title, due date, result chip. Print/email/SMS **receipt**. Cancel/undo last scan.
- Dependencies: none
- Status: [ ]

## P3-SEC-001 — **Checkin:** scan item → instant result with **context alerts**: "Hold for Ali — place on hold shelf", "Overdue 5 days — fine 25,000 IRR", "Needs transit to Branch B", "Damaged? mark". Bulk return via continuous scanning; "return date override" for back-dated returns (permissioned + audited).
- Phase: P3 · Area: SEC · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Checkin:** scan item → instant result with **context alerts**: "Hold for Ali — place on hold shelf", "Overdue 5 days — fine 25,000 IRR", "Needs transit to Branch B", "Damaged? mark". Bulk return via continuous scanning; "return date override" for back-dated returns (permissioned + audited).
- Dependencies: none
- Status: [ ]

## P1-SEC-016 — **Renew** (single/all), **claim returned**, **mark lost** (with replacement-cost billing), **mark damaged**, **change due date** (permissioned).
- Phase: P1 · Area: SEC · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Renew** (single/all), **claim returned**, **mark lost** (with replacement-cost billing), **mark damaged**, **change due date** (permissioned).
- Dependencies: P1-SEC-015
- Status: [ ]

## P1-SEC-017 — **Policy engine:** rules evaluated server-side, return structured denial reasons (`MEMBER_EXPIRED`, `LOAN_LIMIT_REACHED`, `ITEM_NOT_FOR_LOAN`, `HAS_BLOCKING_FINES`, `ITEM_ON_HOLD_FOR_OTHER`…) with localized text and **staff-override with permission + reason + audit**.
- Phase: P1 · Area: SEC · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Policy engine:** rules evaluated server-side, return structured denial reasons (`MEMBER_EXPIRED`, `LOAN_LIMIT_REACHED`, `ITEM_NOT_FOR_LOAN`, `HAS_BLOCKING_FINES`, `ITEM_ON_HOLD_FOR_OTHER`…) with localized text and **staff-override with permission + reason + audit**.
- Dependencies: P1-SEC-016
- Status: [ ]

## P1-BE-024 — **Calendars:** library open days/holidays (Jalali holidays + custom closures) — due dates skip closed days per policy.
- Phase: P1 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Calendars:** library open days/holidays (Jalali holidays + custom closures) — due dates skip closed days per policy.
- Dependencies: P1-BE-023
- Status: [ ]

## P4-FE-001 — **Offline mode** (PWA): queue transactions locally with a clear "offline" banner, sync with conflict resolution.
- Phase: P4 · Area: FE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Offline mode** (PWA): queue transactions locally with a clear "offline" banner, sync with conflict resolution.
- Dependencies: none
- Status: [ ]

## P4-UX-002 — **Self-checkout kiosk mode:** touch-friendly, locked-down UI, idle reset, large buttons, optional RFID.
- Phase: P4 · Area: UX · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Self-checkout kiosk mode:** touch-friendly, locked-down UI, idle reset, large buttons, optional RFID.
- Dependencies: P4-UX-001
- Status: [ ]

## P1-BE-025 — Queue per title (and optionally per edition), pickup-location, hold-shelf lifetime, auto-promote next in queue, "title-level vs item-level", suspend/reactivate, patron & staff placement, expiry notifications, fulfillment report ("items to pull" / "holds ready").
- Phase: P1 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, Queue per title (and optionally per edition), pickup-location, hold-shelf lifetime, auto-promote next in queue, "title-level vs item-level", suspend/reactivate, patron & staff placement, expiry notifications, fulfillment report ("items to pull" / "holds ready").
- Dependencies: P1-BE-024
- Status: [ ]

## P2-BE-002 — Fine types: overdue (per-day/per-hour, caps, grace, closed-day exclusion), lost item (cost + processing fee), damage, membership fee, replacement card. Ledger with debit/credit entries (never edit—only adjust), waive with reason, partial payments, receipts, **online payment** via gateway abstraction (Zarinpal/IDPay/Stripe), cash register session (open/close, daily totals), blocking thresholds.
- Phase: P2 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, Fine types: overdue (per-day/per-hour, caps, grace, closed-day exclusion), lost item (cost + processing fee), damage, membership fee, replacement card. Ledger with debit/credit entries (never edit—only adjust), waive with reason, partial payments, receipts, **online payment** via gateway abstraction (Zarinpal/IDPay/Stripe), cash register session (open/close, daily totals), blocking thresholds.
- Dependencies: P2-BE-001
- Status: [ ]

## P4-BE-001 — Purchase suggestions from patrons → approval workflow → orders → receiving → auto-create items; vendors, budgets/funds, invoices. Serials: subscriptions, issue prediction, check-in of issues, claims, binding.
- Phase: P4 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, Purchase suggestions from patrons → approval workflow → orders → receiving → auto-create items; vendors, budgets/funds, invoices. Serials: subscriptions, issue prediction, check-in of issues, claims, binding.
- Dependencies: none
- Status: [ ]

## P4-BE-002 — E-book/PDF lending with DRM-light (expiring signed URLs), thesis/dissertation repository for universities (metadata, embargo, access levels), course reserves (instructor lists with short loan periods), **Interlibrary Loan** workflow.
- Phase: P4 · Area: BE · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, E-book/PDF lending with DRM-light (expiring signed URLs), thesis/dissertation repository for universities (metadata, embargo, access levels), course reserves (instructor lists with short loan periods), **Interlibrary Loan** workflow.
- Dependencies: P4-BE-001
- Status: [ ]

## P1-SEC-018 — **RBAC with permissions** (e.g., `catalog.edit`, `circulation.override`, `members.delete`, `fines.waive`, `settings.manage`, `reports.view`, `audit.view`), prebuilt roles (Owner, Admin, Head Librarian, Librarian, Circulation Clerk, Cataloger, Read-only, Auditor) + custom roles
- Phase: P1 · Area: SEC · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **RBAC with permissions** (e.g., `catalog.edit`, `circulation.override`, `members.delete`, `fines.waive`, `settings.manage`, `reports.view`, `audit.view`), prebuilt roles (Owner, Admin, Head Librarian, Librarian, Circulation Clerk, Cataloger, Read-only, Auditor) + custom roles
- Dependencies: P1-SEC-017
- Status: [ ]

## P3-SEC-002 — **branch-scoped** permissions.
- Phase: P3 · Area: SEC · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **branch-scoped** permissions.
- Dependencies: P3-SEC-001
- Status: [ ]

## P1-UX-030 — **Audit log UI:** who/what/when/IP/device, before→after diff, filter/export, tamper-evident (hash chain) option. Envers is already in the POM — expose it.
- Phase: P1 · Area: UX · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Audit log UI:** who/what/when/IP/device, before→after diff, filter/export, tamper-evident (hash chain) option. Envers is already in the POM — expose it.
- Dependencies: P1-UX-029
- Status: [ ]

## P2-DB-001 — **Security hardening (OWASP ASVS L2):** CSP, HSTS, secure cookies (HttpOnly/SameSite) or hardened JWT storage (prefer HttpOnly refresh cookie + short-lived access token), CSRF where cookies are used, rate limiting (Bucket4j), brute-force lockout, input sanitization, file-upload validation, SQL-injection safe, IDOR checks (tests), password policy (min 12, breach check via k-anonymity HIBP optional, argon2/bcrypt), 2FA (TOTP), session revocation, security headers tests, dependency scanning (OWASP Dependency-Check / npm audit in CI), secret scanning, **STOMP/WebSocket authorization tests**.
- Phase: P2 · Area: DB · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Security hardening (OWASP ASVS L2):** CSP, HSTS, secure cookies (HttpOnly/SameSite) or hardened JWT storage (prefer HttpOnly refresh cookie + short-lived access token), CSRF where cookies are used, rate limiting (Bucket4j), brute-force lockout, input sanitization, file-upload validation, SQL-injection safe, IDOR checks (tests), password policy (min 12, breach check via k-anonymity HIBP optional, argon2/bcrypt), 2FA (TOTP), session revocation, security headers tests, dependency scanning (OWASP Dependency-Check / npm audit in CI), secret scanning, **STOMP/WebSocket authorization tests**.
- Dependencies: none
- Status: [ ]

## P2-UX-001 — **Backups & DR:** scheduled DB + file backups (admin UI + CLI), one-click restore, verify-backup job; documented RPO/RTO.
- Phase: P2 · Area: UX · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, **Backups & DR:** scheduled DB + file backups (admin UI + CLI), one-click restore, verify-backup job; documented RPO/RTO.
- Dependencies: none
- Status: [ ]

## P3-SEC-003 — Dashboard (configurable widgets): active loans, overdue (with amount), items available/total, new members, holds waiting, fines collected, **loans trend (Jalali months)**, top borrowed titles/authors/subjects, peak hours heatmap, collection growth, member activity, branch comparison. Report center: circulation, overdue, never-borrowed items, collection by subject/age, member statistics, financial (fines/fees/cash), staff activity, inventory results, lost/missing, holds. **Schedule & email reports**, export Excel/PDF/CSV, saved parameters, drill-down. All with Jalali/Gregorian per setting.
- Phase: P3 · Area: SEC · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, Dashboard (configurable widgets): active loans, overdue (with amount), items available/total, new members, holds waiting, fines collected, **loans trend (Jalali months)**, top borrowed titles/authors/subjects, peak hours heatmap, collection growth, member activity, branch comparison. Report center: circulation, overdue, never-borrowed items, collection by subject/age, member statistics, financial (fines/fees/cash), staff activity, inventory results, lost/missing, holds. **Schedule & email reports**, export Excel/PDF/CSV, saved parameters, drill-down. All with Jalali/Gregorian per setting.
- Dependencies: P3-SEC-002
- Status: [ ]

## P4-UX-003 — Event-driven: due-soon, overdue (1st/2nd/3rd notice), hold ready, hold expiring, fines, card expiry, welcome, password reset, new arrivals digest, purchase-suggestion status. Channels: **email (templates, HTML + text), SMS (Kavenegar/Ghasedak/Melipayamak abstraction, Twilio), Web Push (PWA), in-app, Telegram/Bale/Eitaa bots (optional)**. Template editor (variables, preview, per-language), per-member preferences, delivery log with retry, quiet hours.
- Phase: P4 · Area: UX · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, Event-driven: due-soon, overdue (1st/2nd/3rd notice), hold ready, hold expiring, fines, card expiry, welcome, password reset, new arrivals digest, purchase-suggestion status. Channels: **email (templates, HTML + text), SMS (Kavenegar/Ghasedak/Melipayamak abstraction, Twilio), Web Push (PWA), in-app, Telegram/Bale/Eitaa bots (optional)**. Template editor (variables, preview, per-language), per-member preferences, delivery log with retry, quiet hours.
- Dependencies: P4-UX-002
- Status: [ ]

## P3-UX-002 — Library profile & branding (logo, colors, favicon), branches & hours & holidays, calendar & number formatting (Jalali/Gregorian, Persian/Latin digits, first day of week = Saturday default), loan policies, membership plans, fine rules, notification templates, registration mode, ID-field requirements, external-member toggle (university), scanner/devices, integrations, privacy/retention, license, backup, system health.
- Phase: P3 · Area: UX · Source: SPEC §6
- Acceptance criteria: Given the affected workflow, Library profile & branding (logo, colors, favicon), branches & hours & holidays, calendar & number formatting (Jalali/Gregorian, Persian/Latin digits, first day of week = Saturday default), loan policies, membership plans, fine rules, notification templates, registration mode, ID-field requirements, external-member toggle (university), scanner/devices, integrations, privacy/retention, license, backup, system health.
- Dependencies: P3-UX-001
- Status: [ ]

## P1-UX-031 — **Camera ISBN/barcode scanner component** (shared across Add Book, Circulation, Inventory, Member card):
- Phase: P1 · Area: UX · Source: SPEC §7
- Acceptance criteria: Given the affected workflow, **Camera ISBN/barcode scanner component** (shared across Add Book, Circulation, Inventory, Member card):
- Dependencies: P1-UX-030
- Status: [ ]

## P1-UX-032 — Live preview in a rounded viewport with **dimmed mask outside a central guide rectangle** and **four corner brackets**.
- Phase: P1 · Area: UX · Source: SPEC §7
- Acceptance criteria: Given the affected workflow, Live preview in a rounded viewport with **dimmed mask outside a central guide rectangle** and **four corner brackets**.
- Dependencies: P1-UX-031
- Status: [ ]

## P1-UX-033 — A **thin red horizontal scan line** (≈2 px, soft glow) animating up/down inside the guide box (CSS animation; paused/hidden when `prefers-reduced-motion`; becomes solid green + checkmark flash on successful decode).
- Phase: P1 · Area: UX · Source: SPEC §7
- Acceptance criteria: Given the affected workflow, A **thin red horizontal scan line** (≈2 px, soft glow) animating up/down inside the guide box (CSS animation; paused/hidden when `prefers-reduced-motion`; becomes solid green + checkmark flash on successful decode).
- Dependencies: P1-UX-032
- Status: [ ]

## P1-UX-034 — **The decoder is restricted to the guide box region** (crop frame before decode) so the visual indicator truthfully represents the scanned area; guide shape adapts (wide rectangle for 1D barcodes/EAN-13/Code128, square for QR).
- Phase: P1 · Area: UX · Source: SPEC §7
- Acceptance criteria: Given the affected workflow, **The decoder is restricted to the guide box region** (crop frame before decode) so the visual indicator truthfully represents the scanned area; guide shape adapts (wide rectangle for 1D barcodes/EAN-13/Code128, square for QR).
- Dependencies: P1-UX-033
- Status: [ ]

## P1-BE-026 — Controls: switch camera, torch (if supported), zoom slider (if supported), pause/resume, close; remembers last camera.
- Phase: P1 · Area: BE · Source: SPEC §7
- Acceptance criteria: Given the affected workflow, Controls: switch camera, torch (if supported), zoom slider (if supported), pause/resume, close; remembers last camera.
- Dependencies: P1-BE-025
- Status: [ ]

## P1-SEC-019 — Feedback: beep (toggleable), vibration, success flash, duplicate-scan debounce, "unsupported / permission denied / no camera / insecure context" states with actionable help.
- Phase: P1 · Area: SEC · Source: SPEC §7
- Acceptance criteria: Given the affected workflow, Feedback: beep (toggleable), vibration, success flash, duplicate-scan debounce, "unsupported / permission denied / no camera / insecure context" states with actionable help.
- Dependencies: P1-SEC-018
- Status: [ ]

## P1-UX-035 — Fix the current **orange placeholder block** — show a proper loading spinner until the first frame, then the stream.
- Phase: P1 · Area: UX · Source: SPEC §7
- Acceptance criteria: Given the affected workflow, Fix the current **orange placeholder block** — show a proper loading spinner until the first frame, then the stream.
- Dependencies: P1-UX-034
- Status: [ ]

## P1-BE-027 — Supports EAN-13/ISBN (incl. 978/979 and EAN-5 add-on ignore), EAN-8, Code128, Code39, ITF, QR, DataMatrix. Validate ISBN checksum before accepting.
- Phase: P1 · Area: BE · Source: SPEC §7
- Acceptance criteria: Given the affected workflow, Supports EAN-13/ISBN (incl. 978/979 and EAN-5 add-on ignore), EAN-8, Code128, Code39, ITF, QR, DataMatrix. Validate ISBN checksum before accepting.
- Dependencies: P1-BE-026
- Status: [ ]

## P1-UX-036 — Performance: use native `BarcodeDetector` when available, fall back to ZXing (WASM/JS); target ≥ 15 fps decode on mid-range phones; test low light.
- Phase: P1 · Area: UX · Source: SPEC §7
- Acceptance criteria: Given the affected workflow, Performance: use native `BarcodeDetector` when available, fall back to ZXing (WASM/JS); target ≥ 15 fps decode on mid-range phones; test low light.
- Dependencies: P1-UX-035
- Status: [ ]

## P1-UX-037 — **Hardware scanners** (USB/Bluetooth/Wi-Fi keyboard-wedge): auto-detect via timing heuristics, configurable prefix/suffix/terminator, global "scan anywhere" capture on desk screens, ignore accidental typing, visual "scanner ready" indicator.
- Phase: P1 · Area: UX · Source: SPEC §7
- Acceptance criteria: Given the affected workflow, **Hardware scanners** (USB/Bluetooth/Wi-Fi keyboard-wedge): auto-detect via timing heuristics, configurable prefix/suffix/terminator, global "scan anywhere" capture on desk screens, ignore accidental typing, visual "scanner ready" indicator.
- Dependencies: P1-UX-036
- Status: [ ]

## P1-SEC-020 — **RFID** (Phase 5): abstraction layer (WebHID/WebUSB or local agent) for 13.56 MHz HF library tags; bulk read for checkout/inventory; security-bit (EAS/AFI) toggle on check-in/out.
- Phase: P1 · Area: SEC · Source: SPEC §7
- Acceptance criteria: Given the affected workflow, **RFID** (Phase 5): abstraction layer (WebHID/WebUSB or local agent) for 13.56 MHz HF library tags; bulk read for checkout/inventory; security-bit (EAS/AFI) toggle on check-in/out.
- Dependencies: P1-SEC-019
- Status: [ ]

## P1-BE-028 — Every scan outcome is announced via `aria-live` and also visible.
- Phase: P1 · Area: BE · Source: SPEC §7
- Acceptance criteria: Given the affected workflow, Every scan outcome is announced via `aria-live` and also visible.
- Dependencies: P1-BE-027
- Status: [ ]

## P3-DB-001 — **Standards:** MARC21/UNIMARC import/export, Z39.50/SRU client (+ optional SRU server), OAI-PMH provider, **SIP2** server (for 3rd-party self-checkout, RFID, security gates), NCIP (optional), OpenURL, schema.org JSON-LD, COUNTER (e-resources, optional).
- Phase: P3 · Area: DB · Source: SPEC §8
- Acceptance criteria: Given the affected workflow, **Standards:** MARC21/UNIMARC import/export, Z39.50/SRU client (+ optional SRU server), OAI-PMH provider, **SIP2** server (for 3rd-party self-checkout, RFID, security gates), NCIP (optional), OpenURL, schema.org JSON-LD, COUNTER (e-resources, optional).
- Dependencies: none
- Status: [ ]

## P3-DB-002 — **Identity:** local accounts, **OIDC/OAuth2, SAML 2.0, LDAP/Active Directory, CAS** (university SSO), Google/Microsoft login (optional), magic-link/OTP login for patrons.
- Phase: P3 · Area: DB · Source: SPEC §8
- Acceptance criteria: Given the affected workflow, **Identity:** local accounts, **OIDC/OAuth2, SAML 2.0, LDAP/Active Directory, CAS** (university SSO), Google/Microsoft login (optional), magic-link/OTP login for patrons.
- Dependencies: P3-DB-001
- Status: [ ]

## P3-UX-003 — **University SIS sync:** scheduled CSV/API/LDAP import with mapping UI, dry-run and audit.
- Phase: P3 · Area: UX · Source: SPEC §8
- Acceptance criteria: Given the affected workflow, **University SIS sync:** scheduled CSV/API/LDAP import with mapping UI, dry-run and audit.
- Dependencies: P3-UX-002
- Status: [ ]

## P3-FE-001 — **Public API:** documented REST + webhooks (loan.created, hold.ready, member.created…) + API keys with scopes/rate limits.
- Phase: P3 · Area: FE · Source: SPEC §8
- Acceptance criteria: Given the affected workflow, **Public API:** documented REST + webhooks (loan.created, hold.ready, member.created…) + API keys with scopes/rate limits.
- Dependencies: none
- Status: [ ]

## P3-BE-004 — **Payments:** Zarinpal, IDPay, NextPay (via interface), Stripe.
- Phase: P3 · Area: BE · Source: SPEC §8
- Acceptance criteria: Given the affected workflow, **Payments:** Zarinpal, IDPay, NextPay (via interface), Stripe.
- Dependencies: P3-BE-003
- Status: [ ]

## P3-FE-002 — **Messaging:** SMTP, SMS providers, Web Push (VAPID), Telegram/Bale/Eitaa bots.
- Phase: P3 · Area: FE · Source: SPEC §8
- Acceptance criteria: Given the affected workflow, **Messaging:** SMTP, SMS providers, Web Push (VAPID), Telegram/Bale/Eitaa bots.
- Dependencies: P3-FE-001
- Status: [ ]

## P3-DB-003 — **Migration tools:** importers/mappers from Koha, Evergreen, generic Excel/CSV, MARC dumps, and common local Persian library software exports — wizard with validation report.
- Phase: P3 · Area: DB · Source: SPEC §8
- Acceptance criteria: Given the affected workflow, **Migration tools:** importers/mappers from Koha, Evergreen, generic Excel/CSV, MARC dumps, and common local Persian library software exports — wizard with validation report.
- Dependencies: P3-DB-002
- Status: [ ]

## P3-UX-004 — **Hardware:** label printers (ZPL/ESC-POS/PDF fallback), receipt printers (thermal 58/80 mm), card printers (PDF card template), barcode scanners, RFID.
- Phase: P3 · Area: UX · Source: SPEC §8
- Acceptance criteria: Given the affected workflow, **Hardware:** label printers (ZPL/ESC-POS/PDF fallback), receipt printers (thermal 58/80 mm), card printers (PDF card template), barcode scanners, RFID.
- Dependencies: P3-UX-003
- Status: [ ]

## P3-BE-005 — **Google Books/Open Library/Wikidata** enrichment (respect ToS, cache, attribution).
- Phase: P3 · Area: BE · Source: SPEC §8
- Acceptance criteria: Given the affected workflow, **Google Books/Open Library/Wikidata** enrichment (respect ToS, cache, attribution).
- Dependencies: P3-BE-004
- Status: [ ]

## P3-BE-006 — First-run **setup wizard** (library type: public/university, name, branding, branches, hours, calendar, owner account, demo data toggle).
- Phase: P3 · Area: BE · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, First-run **setup wizard** (library type: public/university, name, branding, branches, hours, calendar, owner account, demo data toggle).
- Dependencies: P3-BE-005
- Status: [ ]

## P1-TEST-001 — **Demo data generator** (hundreds of realistic Persian + English titles, covers, members, loans, overdue cases, fines) for sales demos and e2e tests; one-click reset.
- Phase: P1 · Area: TEST · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Demo data generator** (hundreds of realistic Persian + English titles, covers, members, loans, overdue cases, fines) for sales demos and e2e tests; one-click reset.
- Dependencies: none
- Status: [ ]

## P1-BE-029 — **Global search** across books/members/loans/barcodes in the staff shell.
- Phase: P1 · Area: BE · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Global search** across books/members/loans/barcodes in the staff shell.
- Dependencies: P1-BE-028
- Status: [ ]

## P1-FE-005 — **Notifications center** + real-time updates (WebSocket already present) — e.g., hold became ready, import finished.
- Phase: P1 · Area: FE · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Notifications center** + real-time updates (WebSocket already present) — e.g., hold became ready, import finished.
- Dependencies: P1-FE-004
- Status: [ ]

## P1-DOC-002 — **Help system:** in-app tour (first login), tooltips, link to docs, "what's new" modal per release, support bundle download (sanitized logs/config) for on-prem support.
- Phase: P1 · Area: DOC · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Help system:** in-app tour (first login), tooltips, link to docs, "what's new" modal per release, support bundle download (sanitized logs/config) for on-prem support.
- Dependencies: P1-DOC-001
- Status: [ ]

## P1-SEC-021 — **Data quality tools:** duplicate finder/merger for members, authors, books; broken-ISBN report; orphan cleanup.
- Phase: P1 · Area: SEC · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Data quality tools:** duplicate finder/merger for members, authors, books; broken-ISBN report; orphan cleanup.
- Dependencies: P1-SEC-020
- Status: [ ]

## P1-UX-038 — **Accessibility features for patrons:** font-size control, high-contrast theme, dyslexia-friendly font option, screen-reader friendly OPAC.
- Phase: P1 · Area: UX · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Accessibility features for patrons:** font-size control, high-contrast theme, dyslexia-friendly font option, screen-reader friendly OPAC.
- Dependencies: P1-UX-037
- Status: [ ]

## P4-BE-003 — **Events & news module** (reading clubs, workshops) with registration
- Phase: P4 · Area: BE · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Events & news module** (reading clubs, workshops) with registration
- Dependencies: P4-BE-002
- Status: [ ]

## P1-BE-030 — **announcements banner**.
- Phase: P1 · Area: BE · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **announcements banner**.
- Dependencies: P1-BE-029
- Status: [ ]

## P4-BE-004 — **Reading programs / gamification** (optional): badges, challenges.
- Phase: P4 · Area: BE · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Reading programs / gamification** (optional): badges, challenges.
- Dependencies: P4-BE-003
- Status: [ ]

## P3-OPS-001 — **Branch & multi-library** support: inter-branch transit, per-branch hours/policies, consortium catalog.
- Phase: P3 · Area: OPS · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Branch & multi-library** support: inter-branch transit, per-branch hours/policies, consortium catalog.
- Dependencies: none
- Status: [ ]

## P1-UX-039 — **Item "bundles"/kits** (e.g., textbook + CD), equipment loans (laptops, projectors) with short-period slots.
- Phase: P1 · Area: UX · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Item "bundles"/kits** (e.g., textbook + CD), equipment loans (laptops, projectors) with short-period slots.
- Dependencies: P1-UX-038
- Status: [ ]

## P3-BE-007 — **Room & seat booking** (study rooms) with calendar, check-in QR — a strong university selling point.
- Phase: P3 · Area: BE · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Room & seat booking** (study rooms) with calendar, check-in QR — a strong university selling point.
- Dependencies: P3-BE-006
- Status: [ ]

## P3-BE-008 — **Plagiarism-agnostic thesis repository** (metadata + PDF + embargo) for universities.
- Phase: P3 · Area: BE · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Plagiarism-agnostic thesis repository** (metadata + PDF + embargo) for universities.
- Dependencies: P3-BE-007
- Status: [ ]

## P1-DB-013 — **Printable & digital forms:** membership agreement PDF, clearance letter (تسویه‌حساب) for graduating students.
- Phase: P1 · Area: DB · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Printable & digital forms:** membership agreement PDF, clearance letter (تسویه‌حساب) for graduating students.
- Dependencies: P1-DB-012
- Status: [ ]

## P2-DOC-001 — **Legal/compliance:** privacy policy templates, cookie consent, data-processing docs, audit exports, Iranian regulatory-friendly hosting notes.
- Phase: P2 · Area: DOC · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Legal/compliance:** privacy policy templates, cookie consent, data-processing docs, audit exports, Iranian regulatory-friendly hosting notes.
- Dependencies: none
- Status: [ ]

## P2-DB-002 — **Installer & ops:** Docker Compose + Helm chart, one-line install script, Windows service installer (many Iranian libraries run Windows servers), automatic update mechanism with migration pre-checks, health dashboard, log viewer.
- Phase: P2 · Area: DB · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Installer & ops:** Docker Compose + Helm chart, one-line install script, Windows service installer (many Iranian libraries run Windows servers), automatic update mechanism with migration pre-checks, health dashboard, log viewer.
- Dependencies: P2-DB-001
- Status: [ ]

## P2-UX-002 — **Performance at scale:** load tests (k6/Gatling) targeting 1M items / 200k members / 50 concurrent desk users with p95 < 300 ms for common reads.
- Phase: P2 · Area: UX · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Performance at scale:** load tests (k6/Gatling) targeting 1M items / 200k members / 50 concurrent desk users with p95 < 300 ms for common reads.
- Dependencies: P2-UX-001
- Status: [ ]

## P1-BE-031 — **Disaster-safe import/undo** for every bulk operation.
- Phase: P1 · Area: BE · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Disaster-safe import/undo** for every bulk operation.
- Dependencies: P1-BE-030
- Status: [ ]

## P1-BE-032 — **Rate/Review moderation tools**, abuse reporting, profanity filter (Persian).
- Phase: P1 · Area: BE · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Rate/Review moderation tools**, abuse reporting, profanity filter (Persian).
- Dependencies: P1-BE-031
- Status: [ ]

## P1-SEC-022 — **Documentation:** admin guide, librarian quick-start (with screenshots), API docs, on-prem install guide, security whitepaper, in-product video snippets — in Persian and English.
- Phase: P1 · Area: SEC · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Documentation:** admin guide, librarian quick-start (with screenshots), API docs, on-prem install guide, security whitepaper, in-product video snippets — in Persian and English.
- Dependencies: P1-SEC-021
- Status: [ ]

## P2-BE-003 — **Analytics opt-in** (privacy-respecting) to learn feature usage across SaaS tenants.
- Phase: P2 · Area: BE · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Analytics opt-in** (privacy-respecting) to learn feature usage across SaaS tenants.
- Dependencies: P2-BE-002
- Status: [ ]

## P2-DB-003 — **Status page / uptime endpoint** and error reporting (Sentry-compatible, self-hostable).
- Phase: P2 · Area: DB · Source: SPEC §9
- Acceptance criteria: Given the affected workflow, **Status page / uptime endpoint** and error reporting (Sentry-compatible, self-hostable).
- Dependencies: P2-DB-002
- Status: [ ]

## P1-UX-040 — Replace infinite "loading…" with skeleton/empty/error+retry on Home, Catalog, Categories.
- Phase: P1 · Area: UX · Source: SPEC §13
- Acceptance criteria: Given the affected workflow, Replace infinite "loading…" with skeleton/empty/error+retry on Home, Catalog, Categories.
- Dependencies: P1-UX-039
- Status: [ ]

## P1-TEST-002 — Register: never-disabled submit + field-level messages + password checklist + show/hide toggles (both fields) + verification flow.
- Phase: P1 · Area: TEST · Source: SPEC §13
- Acceptance criteria: Given the affected workflow, Register: never-disabled submit + field-level messages + password checklist + show/hide toggles (both fields) + verification flow.
- Dependencies: P1-TEST-001
- Status: [ ]

## P1-BE-033 — Login: brand-consistent button, no default credentials, working forgot-password.
- Phase: P1 · Area: BE · Source: SPEC §13
- Acceptance criteria: Given the affected workflow, Login: brand-consistent button, no default credentials, working forgot-password.
- Dependencies: P1-BE-032
- Status: [ ]

## P1-BE-034 — Reservation modal: no pristine-state errors, correct message placement, remove stray "ثبت" tooltip.
- Phase: P1 · Area: BE · Source: SPEC §13
- Acceptance criteria: Given the affected workflow, Reservation modal: no pristine-state errors, correct message placement, remove stray "ثبت" tooltip.
- Dependencies: P1-BE-033
- Status: [ ]

## P1-UX-041 — Dashboard: real numbers, Jalali month labels, remove stray "(" glyph, empty-state design.
- Phase: P1 · Area: UX · Source: SPEC §13
- Acceptance criteria: Given the affected workflow, Dashboard: real numbers, Jalali month labels, remove stray "(" glyph, empty-state design.
- Dependencies: P1-UX-040
- Status: [ ]

## P1-UX-042 — Dark mode: fix invisible headings on Staff accounts & Input devices, user-menu contrast, helper text contrast; add automated contrast tests.
- Phase: P1 · Area: UX · Source: SPEC §13
- Acceptance criteria: Given the affected workflow, Dark mode: fix invisible headings on Staff accounts & Input devices, user-menu contrast, helper text contrast; add automated contrast tests.
- Dependencies: P1-UX-041
- Status: [ ]

## P1-BE-035 — Typo "SBN-13" → "ISBN-13" and review all Persian microcopy.
- Phase: P1 · Area: BE · Source: SPEC §13
- Acceptance criteria: Given the affected workflow, Typo "SBN-13" → "ISBN-13" and review all Persian microcopy.
- Dependencies: P1-BE-034
- Status: [ ]

## P1-BE-036 — Favicon/app icon/title consistency.
- Phase: P1 · Area: BE · Source: SPEC §13
- Acceptance criteria: Given the affected workflow, Favicon/app icon/title consistency.
- Dependencies: P1-BE-035
- Status: [ ]

## P1-UX-043 — Camera scanner: replace orange block with real viewfinder + red scan line + decode-region cropping.
- Phase: P1 · Area: UX · Source: SPEC §13
- Acceptance criteria: Given the affected workflow, Camera scanner: replace orange block with real viewfinder + red scan line + decode-region cropping.
- Dependencies: P1-UX-042
- Status: [ ]

## P1-BE-037 — Remove developer jargon from Input devices page.
- Phase: P1 · Area: BE · Source: SPEC §13
- Acceptance criteria: Given the affected workflow, Remove developer jargon from Input devices page.
- Dependencies: P1-BE-036
- Status: [ ]

## P1-OPS-003 — Unify button palette and spacing across all admin pages.
- Phase: P1 · Area: OPS · Source: SPEC §13
- Acceptance criteria: Given the affected workflow, Unify button palette and spacing across all admin pages.
- Dependencies: P1-OPS-002
- Status: [ ]

## P1-SEC-023 — Convert free-text fields (membership type, language, publisher, subject, author) to structured pickers.
- Phase: P1 · Area: SEC · Source: SPEC §13
- Acceptance criteria: Given the affected workflow, Convert free-text fields (membership type, language, publisher, subject, author) to structured pickers.
- Dependencies: P1-SEC-022
- Status: [ ]

## P5-DOC-001 — **Phase 0 — Foundation (audit & plumbing):** audit docs
- Phase: P5 · Area: DOC · Source: SPEC §14
- Acceptance criteria: Given the affected workflow, **Phase 0 — Foundation (audit & plumbing):** audit docs
- Dependencies: none
- Status: [ ]

## P5-SEC-001 — CI; lint/typecheck green; design tokens + component library skeleton; i18n infra; problem-details errors
- Phase: P5 · Area: SEC · Source: SPEC §14
- Acceptance criteria: Given the affected workflow, CI; lint/typecheck green; design tokens + component library skeleton; i18n infra; problem-details errors
- Dependencies: none
- Status: [ ]

## P5-DB-001 — Flyway baseline
- Phase: P5 · Area: DB · Source: SPEC §14
- Acceptance criteria: Given the affected workflow, Flyway baseline
- Dependencies: none
- Status: [ ]

## P5-DOC-002 — OpenAPI client generation; test infra (Testcontainers, Playwright, axe); setup wizard skeleton; remove default credentials.
- Phase: P5 · Area: DOC · Source: SPEC §14
- Acceptance criteria: Given the affected workflow, OpenAPI client generation; test infra (Testcontainers, Playwright, axe); setup wizard skeleton; remove default credentials.
- Dependencies: P5-DOC-001
- Status: [ ]

## P5-DB-002 — **Phase 1 — Core product (must be shippable):** new catalog model (Work/Edition/Item) + migration; structured authors/subjects/publishers; members + plans; circulation desk with policy engine, renewals, fines (basic), receipts; holds queue
- Phase: P5 · Area: DB · Source: SPEC §14
- Acceptance criteria: Given the affected workflow, **Phase 1 — Core product (must be shippable):** new catalog model (Work/Edition/Item) + migration; structured authors/subjects/publishers; members + plans; circulation desk with policy engine, renewals, fines (basic), receipts; holds queue
- Dependencies: P5-DB-001
- Status: [ ]

## P5-SEC-002 — RBAC + audit UI; settings center; redesigned admin shell + all admin screens; scanner component + devices wizard
- Phase: P5 · Area: SEC · Source: SPEC §14
- Acceptance criteria: Given the affected workflow, RBAC + audit UI; settings center; redesigned admin shell + all admin screens; scanner component + devices wizard
- Dependencies: P5-SEC-001
- Status: [ ]

## P5-BE-001 — Excel/CSV/MARC import-export with error reports
- Phase: P5 · Area: BE · Source: SPEC §14
- Acceptance criteria: Given the affected workflow, Excel/CSV/MARC import-export with error reports
- Dependencies: none
- Status: [ ]

## P5-UX-001 — OPAC home/search/detail; member portal basics; notifications (email + in-app); dashboard & core reports; dark mode & a11y pass; demo data.
- Phase: P5 · Area: UX · Source: SPEC §14
- Acceptance criteria: Given the affected workflow, OPAC home/search/detail; member portal basics; notifications (email + in-app); dashboard & core reports; dark mode & a11y pass; demo data.
- Dependencies: none
- Status: [ ]

## P5-OPS-001 — **Phase 2 — Commercial readiness:** licensing system + vendor key tool; multi-tenant SaaS & plans; branding per tenant; online payments
- Phase: P5 · Area: OPS · Source: SPEC §14
- Acceptance criteria: Given the affected workflow, **Phase 2 — Commercial readiness:** licensing system + vendor key tool; multi-tenant SaaS & plans; branding per tenant; online payments
- Dependencies: none
- Status: [ ]

## P5-OPS-002 — SMS & push; 2FA; session management; backups/restore
- Phase: P5 · Area: OPS · Source: SPEC §14
- Acceptance criteria: Given the affected workflow, SMS & push; 2FA; session management; backups/restore
- Dependencies: P5-OPS-001
- Status: [ ]

## P5-OPS-003 — Docker/installer/updates; observability; docs (fa/en)
- Phase: P5 · Area: OPS · Source: SPEC §14
- Acceptance criteria: Given the affected workflow, Docker/installer/updates; observability; docs (fa/en)
- Dependencies: P5-OPS-002
- Status: [ ]

## P5-UX-002 — QA hardening; performance tuning with load tests.
- Phase: P5 · Area: UX · Source: SPEC §14
- Acceptance criteria: Given the affected workflow, QA hardening; performance tuning with load tests.
- Dependencies: P5-UX-001
- Status: [ ]

## P5-FE-001 — **Phase 3 — University & enterprise:** SSO (OIDC/SAML/LDAP/CAS), SIS sync, member categories + external-member toggle, course reserves, thesis repository, room booking, multi-branch/transit, SIP2 server, Z39.50/SRU, OAI-PMH, webhooks & API keys, advanced reports + scheduled delivery.
- Phase: P5 · Area: FE · Source: SPEC §14
- Acceptance criteria: Given the affected workflow, **Phase 3 — University & enterprise:** SSO (OIDC/SAML/LDAP/CAS), SIS sync, member categories + external-member toggle, course reserves, thesis repository, room booking, multi-branch/transit, SIP2 server, Z39.50/SRU, OAI-PMH, webhooks & API keys, advanced reports + scheduled delivery.
- Dependencies: none
- Status: [ ]

## P5-DB-003 — **Phase 4 — Differentiators:** offline-first desk PWA, RFID, self-checkout kiosk, acquisitions & serials, ILL, recommendations, events/news, gamification, Telegram/Bale bots, migration wizards from other systems, accessibility extras.
- Phase: P5 · Area: DB · Source: SPEC §14
- Acceptance criteria: Given the affected workflow, **Phase 4 — Differentiators:** offline-first desk PWA, RFID, self-checkout kiosk, acquisitions & serials, ILL, recommendations, events/news, gamification, Telegram/Bale bots, migration wizards from other systems, accessibility extras.
- Dependencies: P5-DB-002
- Status: [ ]

## P5-SEC-003 — **Phase 5 — Polish & launch:** full visual QA light/dark/mobile, copywriting pass, onboarding tours, sales demo environment, security review/pen-test fixes, release notes, pricing-ready edition flags.
- Phase: P5 · Area: SEC · Source: SPEC §14
- Acceptance criteria: Given the affected workflow, **Phase 5 — Polish & launch:** full visual QA light/dark/mobile, copywriting pass, onboarding tours, sales demo environment, security review/pen-test fixes, release notes, pricing-ready edition flags.
- Dependencies: P5-SEC-002
- Status: [ ]

## P5-UX-003 — A first-time librarian can: finish the setup wizard, add a book by scanning an ISBN with a phone camera (red scan line visible), print labels for 3 copies, register a member with a printed/digital card, check out two items by scanning, receive a due-date receipt, and return one — **all without reading documentation**.
- Phase: P5 · Area: UX · Source: SPEC §15
- Acceptance criteria: Given the affected workflow, A first-time librarian can: finish the setup wizard, add a book by scanning an ISBN with a phone camera (red scan line visible), print labels for 3 copies, register a member with a printed/digital card, check out two items by scanning, receive a due-date receipt, and return one — **all without reading documentation**.
- Dependencies: P5-UX-002
- Status: [ ]

## P5-DB-004 — Every screen has loading, empty, error, and success states; works in light/dark, RTL/LTR, desktop/tablet/mobile; passes axe with zero critical/serious issues.
- Phase: P5 · Area: DB · Source: SPEC §15
- Acceptance criteria: Given the affected workflow, Every screen has loading, empty, error, and success states; works in light/dark, RTL/LTR, desktop/tablet/mobile; passes axe with zero critical/serious issues.
- Dependencies: P5-DB-003
- Status: [ ]

## P5-BE-002 — No page contains developer jargon, English leftovers, or inconsistent styles.
- Phase: P5 · Area: BE · Source: SPEC §15
- Acceptance criteria: Given the affected workflow, No page contains developer jargon, English leftovers, or inconsistent styles.
- Dependencies: P5-BE-001
- Status: [ ]

## P5-OPS-004 — All circulation edge cases (limits, expired member, fines, holds, lost, damaged, back-dated return, renewal limits) are covered by automated tests.
- Phase: P5 · Area: OPS · Source: SPEC §15
- Acceptance criteria: Given the affected workflow, All circulation edge cases (limits, expired member, fines, holds, lost, damaged, back-dated return, renewal limits) are covered by automated tests.
- Dependencies: P5-OPS-003
- Status: [ ]

## P5-SEC-004 — Tenant isolation, authorization matrix, and STOMP/WebSocket security are verified by automated tests.
- Phase: P5 · Area: SEC · Source: SPEC §15
- Acceptance criteria: Given the affected workflow, Tenant isolation, authorization matrix, and STOMP/WebSocket security are verified by automated tests.
- Dependencies: P5-SEC-003
- Status: [ ]

## P5-BE-003 — A university tenant can enable SSO + external-member policy; a public-library tenant has none of the university fields visible.
- Phase: P5 · Area: BE · Source: SPEC §15
- Acceptance criteria: Given the affected workflow, A university tenant can enable SSO + external-member policy; a public-library tenant has none of the university fields visible.
- Dependencies: P5-BE-002
- Status: [ ]

## P5-UX-004 — On-prem install from the Docker bundle works in < 15 minutes using only the install guide, with a valid license file; invalid/expired license behaves as specified without data loss.
- Phase: P5 · Area: UX · Source: SPEC §15
- Acceptance criteria: Given the affected workflow, On-prem install from the Docker bundle works in < 15 minutes using only the install guide, with a valid license file; invalid/expired license behaves as specified without data loss.
- Dependencies: P5-UX-003
- Status: [ ]

## P5-UX-005 — Demo environment seeded and impressive on first view; investor-ready screenshots/video flows are possible without manual data fixing.
- Phase: P5 · Area: UX · Source: SPEC §15
- Acceptance criteria: Given the affected workflow, Demo environment seeded and impressive on first view; investor-ready screenshots/video flows are possible without manual data fixing.
- Dependencies: P5-UX-004
- Status: [ ]

## P5-DOC-003 — All docs, changelog, third-party list, and SBOM exist.
- Phase: P5 · Area: DOC · Source: SPEC §15
- Acceptance criteria: Given the affected workflow, All docs, changelog, third-party list, and SBOM exist.
- Dependencies: P5-DOC-002
- Status: [ ]

## P1-UX-VER-001 — Registration submit stays available and reports field-level errors, password matching, and visibility toggles
- Phase: P1 · Area: UX · Source: SPEC §1.2 R1–R2, §13.2
- Acceptance criteria: Registration submit stays available and reports field-level errors, password matching, and visibility toggles behaves observably as described and its automated check passes.
- Dependencies: none
- Status: [v]

## P1-UX-VER-002 — Public home book and category sections expose loading, empty, error, and retry states
- Phase: P1 · Area: UX · Source: SPEC §1.1 P1, §13.1
- Acceptance criteria: Public home book and category sections expose loading, empty, error, and retry states behaves observably as described and its automated check passes.
- Dependencies: none
- Status: [v]

## P1-UX-VER-003 — Dashboard month labels use the Jalali calendar
- Phase: P1 · Area: UX · Source: SPEC §1.4 A4, §13.5
- Acceptance criteria: Dashboard month labels use the Jalali calendar behaves observably as described and its automated check passes.
- Dependencies: none
- Status: [v]

## P0-TEST-VER-001 — Viewport-specific mobile layout check runs at a mobile width on each browser project without skipping
- Phase: P0 · Area: TEST · Source: SPEC §12, §15
- Acceptance criteria: With no pre-existing catalog rows, the test creates one valid ISBN book through the API (201), verifies the book table and paginator, and measures that the rendered row, cells, and paginator do not overlap at 390×844. The mobile-layout assertion sets its own viewport in both Chromium and Pixel 5 projects. `npx playwright test e2e/localized-controls.e2e.spec.ts` passes all four project/test cases with zero skips.
- Dependencies: none
- Status: [v]
