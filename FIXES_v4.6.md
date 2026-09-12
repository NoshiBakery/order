# Noshi v4.6 — Incoming Discount Preview Fix

- Fixes website-order invoice preview totals so per-item discounts are not overwritten by equal totalBefore/totalAfter values.
- Invoice rows now explicitly show individual discount percentage and after-discount line total.
- Discount bridge introduced in v4.5 remains unchanged: new website orders store original_unit_price + discount_percent + unit_price.
- Existing orders created before v4.5 cannot be retroactively assigned a historical discount safely because that pricing snapshot was never stored.
