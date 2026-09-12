# Noshi v4.2 Stability Fix

- Restored the original single datetime-local delivery field in index.html.
- Added dedicated order-view tabs with a background distinct from global navigation tabs.
- Centered and normalized the Today Customers tab text.
- Made font-size preferences device-local so UI preferences cannot conflict with business-data revisions.
- Added safe retry for cloud READ requests only (never automatic retry for writes).
- Ensured authentication is checked before critical page data reads.
- Corrected misleading IndexedDB error messages for cloud-backed data.
- Made Chart.js optional on Expenses so CDN failure cannot block expense data.
- Prevented Sales from saving font size merely by opening the page.
- Fixed malformed duplicated button tags in expenses navigation.

No D1 schema changes. No Worker changes. No sales/client/expense business data migration.
