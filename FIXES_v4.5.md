# Noshi v4.5 — Website Offer → Internal Individual Discount

- External order worker now freezes `original_unit_price` and `discount_percent` on each new `order_items` row.
- Migration is additive/idempotent via `PRAGMA table_info` + `ALTER TABLE ADD COLUMN`; no table/database is deleted or rebuilt.
- Internal worker returns original/final price and discount percentage to the dashboard.
- `incoming.js` maps website discounts to the internal cart as `price = original price` and `discount = individual discount %`.
- Dashboard invoice preview uses the same original price + individual discount.
- Legacy rows without the new fields remain compatible: original price falls back to unit price and discount falls back to 0.

## Deployment order
1. External Order Worker (`external-order-worker.js`)
2. Internal Worker (`internal-worker.js`)
3. GitHub Pages files (`incoming.js`, `js/dashboard.js`; or upload the full package)

No manual D1 SQL is required; the two workers safely ensure the additive columns exist.
