# Responsive verification audit

**Status: implemented and browser-checked at the tested viewports; not certified for every display condition.**

## Findings and changes

- The visitor home, public navigation, catalog cards, category list, detail view, registration, login, and member account use fluid widths and narrow-screen navigation.
- Staff data tables switch to labeled vertical records on narrow screens. Text and action controls wrap rather than relying on a fixed desktop table width.
- Forms use native inputs where possible, labels and errors are associated with their controls, and modal content has a viewport-bounded layout.
- The staff chart and dashboard remain lazy loaded. Charts fit their containing card rather than driving page width.

## Evidence

- Playwright runs both desktop Chromium and Pixel 5 emulation. The exploratory browser check exercises 320, 375, 768, 1024, and 1440 CSS-pixel widths for horizontal overflow.
- axe checks cover login, book management, people, reservations, dashboard, and the loan modal in both projects.
- Public discovery and member registration/reservation journeys are exercised in both desktop and mobile projects.
- Screenshots and Playwright traces are retained for failed browser checks in `test-results/`.

## Limits

- Browser zoom at 200% and 400%, operating-system text scaling, landscape tablet, ultrawide/projector display, and every long-content state were not exhaustively certified.
- The browser binary used for this verification is the installed Chrome executable selected through `PW_CHROMIUM_EXECUTABLE`; Playwright's pinned browser download is blocked in this environment.
- Re-run `npm run e2e` in CI and perform a manual keyboard and touch pass on the target deployment before release.
