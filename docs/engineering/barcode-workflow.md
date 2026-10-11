# Staff barcode-assisted entry

The book creation dialog supports keyboard-wedge USB/Bluetooth scanners. Open **Add book**, focus is moved to **Scan barcode or enter ISBN**, scan the code, then use the scanner's Enter suffix or choose **Search metadata**. Scanners without an Enter suffix work with the button. The field does not capture global keystrokes, and staff can always complete the ordinary form manually.

Only ISBN-10 and ISBN-13 values with valid check digits are sent to the staff-only metadata endpoint. The backend queries Open Library's ISBN-filtered Search API and returns up to five edition candidates. One candidate is copied to the editable form; multiple candidates require a deliberate selection. Missing provider fields remain empty. Staff review and correct the form, then use the normal save action; a scan never creates a record by itself. The metadata base URL can be overridden through `APP_CATALOG_METADATA_BASE_URL`; requests have short connect/read timeouts.

The scanner accepts the usual hyphens and whitespace. A malformed or non-ISBN barcode is rejected with an explanation and manual entry remains available. Repeating a successful scan in the same add dialog does not repeat the provider lookup.

This workflow does not use the camera and does not identify physical copies. It has not yet been verified against every scanner model or an unreliable/limited provider environment. Local duplicate-title checks by ISBN, camera scanning, per-copy barcodes, and checkout/return by copy barcode remain future work.

Verification includes checksum unit cases for ISBN-10 (including `X`) and ISBN-13, metadata mapping/no-match/provider-isolation tests, and a browser test for invalid wedge input with an Enter suffix and manual fallback. Provider metadata is mocked in tests; no external call is required for the test suite.
