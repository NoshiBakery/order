# Noshi Patch — Acceptance Checklist

## Read-only first
- Login from desktop and iPhone.
- Open Products, Website Orders, Orders, Clients, Couriers, Statistics, Expenses, Delivery Orders.
- Verify every main navigation tab has the same size, position and color.
- Verify logo/product images load.

## Delivery date
- Index shows the compact Arabic "تاريخ تسليم الطلب" control.
- Selecting a date updates the Arabic button text and still saves the exact datetime.

## Smart split
Test cart: normal products + `مندوب` price 10 quantity 4 (40 SAR total).
- Create 2 split slots: automatic fees total exactly 40.
- Create 4 split slots: fees become exactly 10 + 10 + 10 + 10.
- Click Smart Distribution: every physical product unit exists exactly once.
- Drag units manually between slots on desktop and iPhone.
- Edit one delivery-fee field manually: that slot remains manual while automatic slots rebalance.
- Save, reopen order, confirm dates/couriers/fees/items are identical.

## Website orders
- New order card shows order number, phone, delivery date, area, item count and total.
- Invoice detail shows item lines, notes, subtotal, delivery and grand total.
- Known client: Accept works.
- New client: create client then accept.
- Reject does not create an internal order.
- Accept is finalized externally only after internal save (existing safety behavior remains).

## Backup and partition
- Download backup: filename is `all_data.json`.
- Open JSON and confirm it contains one canonical `salesData` object (not raw salesData_YYYY_MM keys).
- Run monthly split from migration.html.
- Verify migration reports same month/order counts before and after.
- Download another `all_data.json`; compare order/month/client counts.

## Month boundary
- Test one split delivery spanning two months.
- Verify courier/month payment and undo logic do not leak across months.
