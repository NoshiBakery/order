/* =========================================================
   FILE: js/order.part2.js
   SOURCE: inline script #2 from order.html
   REFACTOR RULE: extracted in the SAME parser position.
   No business logic, storage key, or execution order changed.
========================================================= */
// =====================================================
// NOSHI - REPRINT SAVED INVOICE
// =====================================================

let noshiReprintInProgress = false;

async function noshiReprintOrder(order) {
  if (noshiReprintInProgress) return;

  if (!order || order.id === undefined || order.id === null) {
    alert("تعذر تحديد الفاتورة.");
    return;
  }

  // نافذة اختيار نوع الورقة
  const modal = document.createElement("div");

  modal.style.cssText = `
    position:fixed;
    inset:0;
    z-index:2147483500;
    background:rgba(0,0,0,.65);
    display:flex;
    justify-content:center;
    align-items:center;
    padding:15px;
    direction:rtl;
  `;

  const panel = document.createElement("div");

  panel.style.cssText = `
    background:#fff;
    color:#222;
    border-radius:18px;
    padding:22px;
    width:100%;
    max-width:370px;
    box-sizing:border-box;
    text-align:center;
    font-family:Tahoma,Arial,sans-serif;
  `;

  const title = document.createElement("h3");
  title.textContent = "إعادة طباعة الفاتورة";

  const client = document.createElement("p");
  client.textContent = "العميل: " + (order.client || "غير محدد");

  const status = document.createElement("p");
  status.style.cssText =
    "font-size:13px;color:#555;line-height:1.7;overflow-wrap:anywhere";

  panel.append(title, client);

  const actionButtons = [];

  function addButton(text, target, color) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = text;

    button.style.cssText = `
      width:100%;
      padding:13px;
      margin:6px 0;
      background:${color};
      color:#fff;
      border:0;
      border-radius:10px;
      font-weight:bold;
      cursor:pointer;
    `;

    if (target) {
      actionButtons.push(button);
      button.onclick = () => sendReprint(target);
    } else {
      button.onclick = () => {
        if (!noshiReprintInProgress) modal.remove();
      };
    }

    panel.appendChild(button);
  }

  async function sendReprint(target) {
    if (noshiReprintInProgress) return;

    if (!window.NoshiAuth || !NoshiAuth.enabled()) {
      status.textContent = "الاتصال بنوشي الداخلي غير متاح.";
      return;
    }

    noshiReprintInProgress = true;
    actionButtons.forEach(button => button.disabled = true);

    // لكل ضغطة مستقلة معرف، حتى ما تتكرر بالخطأ.
    const requestId = "rp-" + crypto.randomUUID();

    status.textContent = "جاري إرسال طلب إعادة الطباعة...";

    try {
      const result = await NoshiAuth.api("/api/print/reprint", {
        method: "POST",
        body: JSON.stringify({
          internalId: String(order.id),
          requestId: requestId,
          target: target
        })
      });

      if (result?.ok !== true || result?.print?.success !== true) {
        throw new Error("REPRINT_NOT_CONFIRMED");
      }

      status.textContent = "تم قبول طلب إعادة الطباعة.";

      setTimeout(() => modal.remove(), 1200);

    } catch (error) {
      console.error("NOSHI REPRINT:", error);

      status.textContent =
        "تعذر تأكيد وصول طلب الطباعة. راجع سجل NOSHI Print قبل محاولة جديدة. رقم المحاولة: "
        + requestId;

      // نبقي الخيارات معطلة لتجنب إرسال مهمة مكررة.
    } finally {
      noshiReprintInProgress = false;
    }
  }

  addButton("🧾 فاتورة العميل فقط", "customer", "#2980b9");
  addButton("👨‍🍳 تذكرة المطبخ فقط", "kitchen", "#8e44ad");
  addButton("🖨️ الفاتورتان معًا", "both", "#27ae60");
  addButton("إلغاء", null, "#777");

  panel.appendChild(status);
  modal.appendChild(panel);
  document.body.appendChild(modal);
}
showDetails = function(month, index, event) {
  event?.preventDefault?.();
  const order = salesData?.[month]?.[index];
  if (!order) return showMessage?.("❌ لم يتم العثور على الطلب");
  NoshiInvoice.open(order, {
    showDeliveryInfo: true,
    onEdit: () => editInvoice(month, index, { preventDefault() {} })
  });
};
