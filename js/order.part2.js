/* =========================================================
   FILE: js/order.part2.js
   SOURCE: inline script #2 from order.html
   REFACTOR RULE: extracted in the SAME parser position.
   No business logic, storage key, or execution order changed.
========================================================= */
showDetails = function(month, index, event) {
  event?.preventDefault?.();
  const order = salesData?.[month]?.[index];
  if (!order) return showMessage?.("❌ لم يتم العثور على الطلب");
  NoshiInvoice.open(order, {
    onEdit: () => editInvoice(month, index, { preventDefault() {} })
  });
};
