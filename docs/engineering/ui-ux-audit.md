# UI and UX audit

## Reviewed screens and controls

The current UI exposes public home/catalog/categories/detail, registration/login, member account, and staff dashboard/books/people/loans/reservations. Shared UI includes responsive navigation, paginated/filterable tables, dialogs, date input, image/file pickers, confirmation prompts, and stored-image loading. Role-specific product routes are guarded in the UI and APIs. Browser runs covered desktop Chromium and a Pixel 5 viewport.

## Changes and evidence in this working tree

- Book import submit state now follows the reactive form's selected file rather than a removed component property.
- Book cover file selection, validation, and removal are represented through a shared picker and tested in component specs.
- Destructive actions use a shared accessible confirmation dialog; the Book delete unit test now correctly injects its confirmation spy.
- Table scrolling areas are keyboard-focusable and labeled for assistive technology.
- Mobile navigation E2E uses the mobile menu and confirms responsive behavior without horizontal overflow at narrow viewports.
- Public book discovery and member signup/reservation/cancellation flows use persisted H2-backed data in both desktop and mobile browser projects.
- The staff book dialog supports keyboard-wedge ISBN input and reviewable external metadata candidates, with a manual-entry path and invalid-scan feedback.
- Visual review caught default English paginator controls and a missing translator shown as `undefined`; both now use Persian labels/fallbacks and have a dedicated unit/browser regression check.
- Password automation targets the textbox role, avoiding ambiguity with the separately labeled password-visibility button.
- axe reports no violations at any impact level on login, books, people, reservations, dashboard, and the loan modal in desktop and mobile Chromium runs. E2E assertions now fail on any axe violation.

## Remaining review

The browser matrix covers core CRUD paths and narrow/mobile responsive behavior, but it does not exercise every file-validation edge, keyboard-only sequence, or tablet width. Automated checks do not substitute for a manual screen-reader and keyboard review.
