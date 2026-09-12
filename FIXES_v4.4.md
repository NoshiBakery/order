# Noshi v4.4 — Incoming + Split + Stability

- Dashboard removes order-content summary and shows customer notes instead.
- Registered-customer name gets a distinct soft green treatment.
- Delivery date display uses Gregorian YYYY-MM-DD + Arabic weekday + 12-hour time.
- New-client modal is compact and mobile-safe.
- Accept requires confirmation with order number and client name.
- Products page has a safe Back action before saving an incoming order.
- Split delivery highlights the selected product more clearly.
- Split fields are re-laid out for mobile clarity.
- Delivery fee budget auto-distributes over automatic slots while preserving manual fee edits.
- Legacy saved split fees are preserved.
- Worker/API auth requests have a 15-second timeout to prevent indefinite white auth-cloak screens.
- IndexedDB open is bounded and recoverable instead of hanging indefinitely.
- No database schema migration in this patch.
