# Noshi Bakery — Architecture & Maintenance Guide

## Non-negotiable rules
1. Data correctness and recoverability come before speed.
2. Never delete a D1 database. Never wipe shared data as part of a performance patch.
3. `all_data.json` is the canonical portable backup format.
4. Browser pages must not display stale cached business data as truth.
5. Any migration is copy -> verify -> switch readers -> optional cleanup later.

## Main layers
- `config.js`: public endpoints/config only. No secrets.
- `auth.js`: authenticated calls/session handling.
- `db.js`: the only browser storage gateway for shared business data.
- `internal-worker.js`: authentication, authorization, D1 reads/writes, revisions, incoming-order API.
- `incoming.js`: conversion/normalization of website orders.
- `invoice.js`: invoice rendering.
- `css/tab.css`: single source of truth for main navigation tabs.
- `css/dashboard.css`: website-order dashboard presentation.

## Sales storage compatibility strategy
Legacy canonical key: `salesData` (object keyed by `YYYY-MM`).
New performance keys: `salesData_YYYY_MM` (one array per month).

During transition the legacy key remains untouched as a safety net. `db.js` can:
- `getSalesMonth("YYYY-MM")`
- `setSalesMonth("YYYY-MM", rows)`
- `migrateSalesDataToMonthly()` (copy + exact JSON verification)
- `exportAll()` (merges monthly partitions back into canonical `salesData`)

Backups NEVER expose monthly storage keys. They always export one `all_data.json`.

## Backup invariant
A valid backup must contain `salesData` as an object. Monthly partitions are implementation detail only.
Restoration can rebuild monthly partitions automatically from `salesData`.

## Delivery split invariant
- Every physical product unit exists exactly once across delivery slots.
- Courier product (`مندوب`) is not treated as a physical product unit.
- Each delivery slot owns its own date, courier, delivery fee, delivered flag and deliveryPaid flag.
- Automatic courier-fee distribution may change only non-manually-edited fee fields.

## Change discipline
For every patch:
1. Add/keep comments around business-critical logic.
2. Avoid unrelated formatting or wholesale rewrites.
3. Run JavaScript syntax checks.
4. Test read-only first, then create/edit, split delivery, courier, month boundary, incoming order, backup/restore.
5. Update `CHANGES.txt` with what changed and deployment order.
