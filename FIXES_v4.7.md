# FIXES v4.7 — Incoming discount live/cache fix

- Confirmed D1 snapshot for order #1143: p12 original=60, discount=15, final=51.
- Internal API now exposes compatibility fields: originalUnitPrice/originalPrice/price, unitPrice/finalPrice, discountPercent/discount.
- `price` on incoming API items now means pre-discount price so older frontend paths do not silently flatten the discount.
- incoming.js and dashboard.js accept camelCase and snake_case pricing fields.
- dashboard.html/index.html use explicit v=4.7.0 cache-busting for incoming/invoice/dashboard scripts.
- No external DB deletion/rebuild. No changes to existing rows.
