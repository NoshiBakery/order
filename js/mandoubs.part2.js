/* =========================================================
   FILE: js/mandoubs.part2.js
   SOURCE: inline script #2 from mandoubs.html
   REFACTOR RULE: extracted in the SAME parser position.
   No business logic, storage key, or execution order changed.
========================================================= */
showOrderDetails = function(month, index) {
  const order = salesData?.[month]?.[index];
  if (!order) return alert("❌ لم يتم العثور على الطلب");
  NoshiInvoice.open(order, { showDeliveryInfo: true });
};
