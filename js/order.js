/* =========================================================
   FILE: js/order.js
   SOURCE PAGE: order.html
   PURPOSE: Page-specific JavaScript extracted from the HTML.
   DATA SAFETY: This is a structural refactor only; field names,
   storage keys, save ordering, and business rules must remain compatible.
   MAINTENANCE RULE: Shared services stay in their existing shared files.
========================================================= */


/* ---- Extracted inline script block 1 (original order preserved) ---- */
// إعدادات حجم الخط
  const MIN_FONT_SIZE = 6;
  const MAX_FONT_SIZE = 24;
  const DEFAULT_FONT_SIZE = 16;
  let currentFontSize = DEFAULT_FONT_SIZE;

  // بيانات التطبيق من IndexedDB
  let salesData = {};
  let clients = [];
  let backupBaseData = {};

  // العناصر الأساسية
  const container = document.getElementById("ordersContainer");
  const clickSound = document.getElementById("clickSound");
  const deleteSound = document.getElementById("deleteSound");
  const currentMonthTitle = document.getElementById("currentMonthTitle");
  const noOrdersMessage = document.getElementById("noOrdersMessage");
  const prevMonthBtn = document.getElementById("prevMonthBtn");
  const nextMonthBtn = document.getElementById("nextMonthBtn");
  
  // تحميل البيانات من IndexedDB
  async function initStorageData() {
    if (!window.NoshiDB) {
      throw new Error("ملف db.js غير مربوط أو لم يتم تحميله");
    }

    const live = NoshiDB.getMany
      ? await NoshiDB.getMany(["salesData", "clients", "ordersTableFontSize"], {
          salesData: {}, clients: [], ordersTableFontSize: DEFAULT_FONT_SIZE
        })
      : {
          salesData: await NoshiDB.get("salesData", {}),
          clients: await NoshiDB.get("clients", []),
          ordersTableFontSize: await NoshiDB.get("ordersTableFontSize", DEFAULT_FONT_SIZE)
        };

    salesData = live.salesData && typeof live.salesData === "object" && !Array.isArray(live.salesData) ? live.salesData : {};
    clients = Array.isArray(live.clients) ? live.clients : [];
    currentFontSize = parseInt(live.ordersTableFontSize) || DEFAULT_FONT_SIZE;

    // لا نجلب النسخة الكاملة عند فتح الصفحة. النسخة الاحتياطية الكاملة
    // تُقرأ من السحابة فقط عند تنفيذ عملية السداد نفسها.
    backupBaseData = {};

  }

  // حفظ بيانات الطلبات في IndexedDB
  async function saveSalesData() {
    await NoshiDB.set("salesData", salesData);
  }

function cloneForBackup(data) {
  return JSON.parse(JSON.stringify(data || {}));
}

function createBackupFile(label, baseData = backupBaseData) {
  const allData = cloneForBackup(baseData);

  // نضمن أن النسخة تستخدم آخر بيانات موجودة في الذاكرة بعد IndexedDB
  allData.salesData = cloneForBackup(salesData);
  allData.clients = cloneForBackup(clients);

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");

  const fileName = `${label}_${yyyy}-${mm}-${dd}_${hh}${min}.json`;

  const text = JSON.stringify(allData, null, 2);
  const blob = new Blob([text], { type: "application/json" });

  return new File([blob], fileName, { type: "application/json" });
}

function downloadBackupFiles(beforeFile, afterFile) {
  [beforeFile, afterFile].forEach(file => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  });
}

  // حفظ حجم الخط في IndexedDB
  async function saveFontSizeToDB() {
    await NoshiDB.set("ordersTableFontSize", currentFontSize.toString());
  }
  // أسماء الشهور العربية
  const monthNames = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  // متغيرات حالة التطبيق
  let currentDisplayYear = new Date().getFullYear();
  let currentDisplayMonth = new Date().getMonth() + 1;
  let totalOrders = 0;
  let grossSales = 0;
  let netSales = 0;
  let deliveryCost = 0;
  let unpaidAmount = 0;
let clientTransferredNotCheckedAmount = 0;
let clientTransferredNotCheckedCount = 0;
let phraseStripAmount = 0;
let phraseStripQuantity = 0;
let autoUpdateEnabled = true;
  let showingOnlyUnpaidMonthly = false;
  
  const PHRASE_STRIP_NAME = "شريط عبارة";

function isPhraseStripItem(item) {
  return String(
    item && item.name ? item.name : ""
  ).trim() === PHRASE_STRIP_NAME;
}

function getPhraseStripInfo(order) {
  // شريط العبارة مستثنى من الخصم العام؛ يبقى الخصم الفردي فقط.
  const generalMultiplier = 1;

  let amount = 0;
  let quantity = 0;

  const items = Array.isArray(order && order.items)
    ? order.items
    : [];

  items.forEach(item => {
    if (!isPhraseStripItem(item)) {
      return;
    }

    const qty = Number(item.qty || 0);
    const price = Number(item.price || 0);

    const itemMultiplier =
      1 - (Number(item.discount || 0) / 100);

    quantity += qty;

    /*
      نحسب مبلغ الشريط الفعلي بعد خصم المنتج
      وبعد الخصم العام للفاتورة.
    */
    amount +=
      qty *
      price *
      itemMultiplier *
      generalMultiplier;
  });

  return {
    quantity,
    amount
  };
}
  
  function getClientPhone(clientName) {
    const client = clients.find(c => c.name === clientName);
    return client && client.phone ? client.phone : null;
  }
  
function sendWhatsAppToClient(clientName, monthKey, orderIndex) {
  const phone = getClientPhone(clientName);
  if (!phone) {
    alert(`⚠️ لا يوجد رقم هاتف مسجل للعميلة: ${clientName}\nالرجاء إضافة الرقم في صفحة العملاء`);
    return;
  }
  
  // تنظيف الرقم
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('05')) cleanPhone = '966' + cleanPhone.substring(1);
  if (cleanPhone.startsWith('5')) cleanPhone = '966' + cleanPhone;
  
  // جلب بيانات الطلب
  const monthOrders = salesData[monthKey];
  const order = monthOrders[orderIndex];
  
  const message = `السلام عليكم الله يسعدك💕\nماحولتي حق الطلبية🙏`;
  const encodedMsg = encodeURIComponent(message);
  
  // ✅ الطريقة الذهبية: استخدام عنصر <a> مخفي والضغط عليه برمجياً
  const link = document.createElement('a');
  link.href = `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  playSound('clickSound');
}

  // دالة لفتح نافذة ضبط الخط
  function openFontSizeModal() {
    const modal = document.getElementById('fontSizeModal');
    modal.style.display = 'flex';
    updateFontSizeDisplay();
    playSound('clickSound');
  }

  // دالة لإغلاق نافذة ضبط الخط
  function closeFontSizeModal() {
    const modal = document.getElementById('fontSizeModal');
    modal.style.display = 'none';
    playSound('clickSound');
  }

  // دالة لتحديث عرض حجم الخط
  function updateFontSizeDisplay() {
    document.getElementById('currentFontSizeDisplay').textContent = currentFontSize;
    
    // تحديث معاينة النص
    const preview = document.getElementById('fontPreview');
    preview.style.fontSize = currentFontSize + 'px';
    
    // تحديث حجم الخط في الجدول مباشرة
    applyFontSizeToTable();
  }

  // دالة لتقليل حجم الخط
  function decreaseFontSize() {
    if (currentFontSize > MIN_FONT_SIZE) {
      currentFontSize--;
      saveFontSize();
      updateFontSizeDisplay();
      playSound('clickSound');
    }
  }

  // دالة لزيادة حجم الخط
  function increaseFontSize() {
    if (currentFontSize < MAX_FONT_SIZE) {
      currentFontSize++;
      saveFontSize();
      updateFontSizeDisplay();
      playSound('clickSound');
    }
  }

  // دالة لإعادة ضبط حجم الخط
  function resetFontSize() {
    currentFontSize = DEFAULT_FONT_SIZE;
    saveFontSize();
    updateFontSizeDisplay();
    playSound('clickSound');
  }

  // دالة لحفظ حجم الخط في IndexedDB
  async function saveFontSize() {
    try {
      await saveFontSizeToDB();
    } catch (error) {
      console.error("فشل حفظ حجم الخط:", error);
    }
  }

  // دالة لتطبيق حجم الخط على الجدول
  function applyFontSizeToTable() {
    const tableCells = document.querySelectorAll('table td, table th');
    tableCells.forEach(cell => {
      cell.style.fontSize = currentFontSize + 'px';
    });
    
    // أيضًا تحديث النصوص الأخرى في الجدول إذا لزم الأمر
    const clientNames = document.querySelectorAll('.client-name');
    clientNames.forEach(name => {
      name.style.fontSize = (currentFontSize + 2) + 'px';
    });
    
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
      btn.style.fontSize = (currentFontSize - 2) + 'px';
    });
  }

  // دالة تشغيل الصوت
  function playSound(id) {
    const sound = document.getElementById(id);
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
  }

  function loadData() {
    // مسح محتوى الطلبات فقط (لا تمسح عناصر التحكم)
    container.innerHTML = '';
    
    // تحديث عنوان الشهر
    currentMonthTitle.textContent = `${monthNames[currentDisplayMonth - 1]} ${currentDisplayYear}`;
    
    // ✅ التحقق من التحديث التلقائي فقط إذا كان مفعلاً
    if (autoUpdateEnabled) {
      checkMonthAutoUpdate();
    }

    const monthKey = `${currentDisplayYear}-${currentDisplayMonth.toString().padStart(2, '0')}`;
    const originalMonthOrders = salesData[monthKey] || [];
    const monthOrders = [...originalMonthOrders].reverse();

    // إعادة تعيين الإحصائيات
    totalOrders = 0;
    grossSales = 0;
    netSales = 0;
    deliveryCost = 0;
    unpaidAmount = 0;
clientTransferredNotCheckedAmount = 0;
clientTransferredNotCheckedCount = 0;
phraseStripAmount = 0;
phraseStripQuantity = 0;

    // حساب الإحصائيات
originalMonthOrders.forEach(order => {
  const stripInfo = getPhraseStripInfo(order);

  phraseStripAmount += stripInfo.amount;
  phraseStripQuantity += stripInfo.quantity;

  const filteredItems = order.items.filter(
    item => item.name !== "مندوب"
  );
      const orderGross = filteredItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
      grossSales += orderGross;

      const deliveryCostItem = order.items.find(item => item.name === "مندوب");
      const deliveryAmount = deliveryCostItem ? (deliveryCostItem.qty * deliveryCostItem.price) : 0;
      netSales += (parseFloat(order.totalAfter) - deliveryAmount);

      if (deliveryCostItem) {
        deliveryCost += deliveryAmount;
      }

      if (order.paymentMethod === "transfer" && !order.paidByEmad) {
        unpaidAmount += parseFloat(order.totalAfter);
      }
	  // ✅ العميل محوّل + ما عليها تشيك بوكس (غير مُقفَل عندك)
if (
  order.paymentMethod === "transfer" &&
  order.transferred === true &&
  !order.paidByEmad
) {
  clientTransferredNotCheckedCount++;
  clientTransferredNotCheckedAmount += parseFloat(order.totalAfter || 0);
}
    });

    totalOrders = originalMonthOrders.length;

    // تحديث عداد الطلبات غير المحولة هنا - قبل displayOrders
    updateUnpaidOrdersCount();

    // رسالة إذا ما فيه طلبات
    if (originalMonthOrders.length === 0) {
      noOrdersMessage.style.display = "block";
    } else {
      noOrdersMessage.style.display = "none";
    }

    displayOrders(monthKey, originalMonthOrders, monthOrders);
	updateTodayDeliverySummaryUI();
    
    // تطبيق حجم الخط بعد تحميل البيانات
    setTimeout(() => {
      applyFontSizeToTable();
    }, 50);
  }

  // عرض الطلبات في الجدول
  function displayOrders(monthKey, originalMonthOrders, monthOrders) {
    let html = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>✔️</th>
              <th>#</th>
              <th>التاريخ</th>
              <th>العميل</th>
              <th>المبلغ</th>
              <th>طريقة الدفع</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>`;

    monthOrders.forEach((order, reversedIndex) => {
      const originalIndex = originalMonthOrders.length - 1 - reversedIndex;
      const orderDate = order.date || "-";
      const totalAfter = parseFloat(order.totalAfter);
      const paymentMethod = order.paymentMethod || "not-set";
      const paymentClass = paymentMethod === "transfer" ? "payment-transfer" : 
                         paymentMethod === "cash" ? "payment-cash" : "payment-not-set";
      
      let paymentText = paymentMethod === "transfer" ? 
                       (order.transferred ? "تم التحويل ✅" : "<span class='unpaid-transfer'>لم يتم التحويل ⚠️</span>") : 
                       paymentMethod === "cash" ? "كاش 💵" : "غير محدد ❗";

      html += `
        <tr id="order-${originalIndex}" class="${paymentClass}">
          <td>
            <input type="checkbox" class="checkbox" 
              ${order.paidByEmad ? 'checked' : ''}
              onchange="updatePaymentStatus('${monthKey}', ${originalIndex}, this.checked, event)"
            >
          </td>
          <td>${originalIndex + 1}</td>
          <td>${orderDate}</td>
          <td class="client-name">${order.client || "—"}</td>
          <td>${totalAfter.toFixed(2)} ريال</td>
          <td>${paymentText}</td>
          <td>
            <div class="action-buttons">
              <button class="action-btn details-btn" onclick="playSound('clickSound'); showDetails('${monthKey}', ${originalIndex}, event)">
                عرض الفاتورة
              </button>
              <button class="action-btn edit-btn" onclick="editPaymentMethod('${monthKey}', ${originalIndex}, event)">
                 تعديل الدفع
              </button>
              <button class="action-btn delete-btn" onclick="playSound('deleteSound'); deleteOrder('${monthKey}', ${originalIndex}, event)">
                حذف الطلب
              </button>
            </div>
          </td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    
// ملخص المبيعات (نسخة مصغّرة)
html += `
  <div class="orange-line"></div>
  <div class="sales-summary" style="
    background: #fff8f0;
    padding: 10px;
    border-radius: 10px;
    margin-top: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  ">
    <h3 style="margin-top:0; margin-bottom:10px; text-align:center; color:#d35400; font-size:1.1em;">
      ملخص مبيعات الشهر
    </h3>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 6px;">

      <div style="background:#fff; padding:8px 10px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="font-size:0.75em; color:#555; margin-bottom:3px;">عدد الطلبات</div>
        <div style="font-size:1.1em; font-weight:bold; color:#e67e22;">${totalOrders}</div>
      </div>

      <div style="background:#fff; padding:8px 10px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="font-size:0.75em; color:#555; margin-bottom:3px;">إجمالي المبيعات</div>
        <div style="font-size:1.1em; font-weight:bold; color:#27ae60;">${grossSales.toFixed(2)} ريال</div>
      </div>

      <div style="background:#fff; padding:8px 10px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="font-size:0.75em; color:#555; margin-bottom:3px;">صافي المبيعات</div>
        <div style="font-size:1.1em; font-weight:bold; color:#d35400;">${netSales.toFixed(2)} ريال</div>
      </div>

      <div style="background:#fff; padding:8px 10px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="font-size:0.75em; color:#555; margin-bottom:3px;">تكاليف التوصيل</div>
        <div style="font-size:1.1em; font-weight:bold; color:#2980b9;">${deliveryCost.toFixed(2)} ريال</div>
      </div>

      <div style="background:#fff; padding:8px 10px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="font-size:0.75em; color:#555; margin-bottom:3px;">المبالغ المحولة والغير محولة</div>
        <div style="font-size:1.1em; font-weight:bold; color:#c0392b;">${unpaidAmount.toFixed(2)} ريال</div>
      </div>

      <div style="background:#fff; padding:8px 10px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="font-size:0.75em; color:#555; margin-bottom:3px;">المبالغ المحولة من العملاء</div>
        <div style="font-size:1.1em; font-weight:bold; color:#8e44ad;">
          ${clientTransferredNotCheckedAmount.toFixed(2)} ريال
        </div>
        <div style="font-size:0.7em; color:#777; margin-top:2px;">
          عددها: ${clientTransferredNotCheckedCount}
        </div>
      </div>
<div style="
  background:#f5efff;
  padding:8px 10px;
  border-radius:8px;
  border:1px solid #d8c4f0;
  box-shadow:0 1px 3px rgba(0,0,0,0.05);
">
  <div style="
    font-size:0.75em;
    color:#6c3483;
    margin-bottom:3px;
  ">
    🎀 مبالغ الشريط — عماد
  </div>

  <div style="
    font-size:1.1em;
    font-weight:bold;
    color:#8e44ad;
  ">
    ${phraseStripAmount.toFixed(2)} ريال
  </div>

  <div style="
    font-size:0.7em;
    color:#777;
    margin-top:2px;
  ">
    العدد: ${phraseStripQuantity}
  </div>
</div>

    </div>
  </div>
`;

    container.innerHTML = html;
    
    // تطبيق حجم الخط بعد عرض الجدول
    setTimeout(() => {
      applyFontSizeToTable();
    }, 50);
  }

  // تحديث عنوان الشهر
  function updateMonthTitle() {
    currentMonthTitle.textContent = `${monthNames[currentDisplayMonth - 1]} ${currentDisplayYear}`;
  }

  // التحقق من التحديث التلقائي للشهر - معدلة
  function checkMonthAutoUpdate() {
    const now = new Date();
    const isNewMonth = now.getDate() === 1 && 
                      (now.getMonth() + 1 !== currentDisplayMonth || 
                       now.getFullYear() !== currentDisplayYear);
    
    // فقط إذا كان المستخدم يشهر الشهر الحالي، نحدث تلقائياً
    const isCurrentMonth = currentDisplayMonth === (now.getMonth() + 1) && 
                          currentDisplayYear === now.getFullYear();
    
    if (isNewMonth && isCurrentMonth) {
      currentDisplayMonth = now.getMonth() + 1;
      currentDisplayYear = now.getFullYear();
      showMessage(`تم التحديث تلقائياً لشهر ${monthNames[currentDisplayMonth - 1]}`);
    }
  }

  // دالة للتبديل بين التبويبات
  function switchTab(tabName) {
    // إخفاء جميع المحتويات
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // إزالة النشاط من جميع الأزرار
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // إظهار المحتوى المحدد وإضافة النشاط للزر
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    // ✅ التحكم في إظهار زر الفلترة
    const filterBtn = document.getElementById('filterUnpaidBtn');
    if (filterBtn) {
      if (tabName === 'monthly') {
        // إظهار الزر في تبويب طلبات الشهر
        filterBtn.style.display = 'block';
        // إعادة تعيين الفلترة إذا كنا في وضع الفلترة
        if (showingOnlyUnpaidMonthly) {
          filterUnpaidMonthlyOrders();
        }
      } else {
        // إخفاء الزر في التبويبات الأخرى
        filterBtn.style.display = 'none';
        // إعادة تعيين حالة الفلترة
        if (showingOnlyUnpaidMonthly) {
          showingOnlyUnpaidMonthly = false;
          // إعادة تعيين نص الزر
          filterBtn.innerHTML = "⚠️ عرض الطلبات غير المحولة (<span id=\"unpaidCountText\" style=\"color:#ffeb3b; font-weight:bold;\">0</span>)";
          filterBtn.style.background = "#c0392b";
        }
      }
    }
    
    // إذا كان التبويب هو الطلبات القادمة، نحمله
    if (tabName === 'upcoming') {
      loadUpcomingOrders();
    }
  }

  // دالة لتحميل وعرض الطلبات القادمة
  async function loadUpcomingOrders() {
    const container = document.getElementById('upcomingOrdersContainer');
    const noMessage = document.getElementById('noUpcomingMessage');
    
    container.innerHTML = '';
    
    // جمع جميع الطلبات من جميع الأشهر
    const allOrders = [];
    
    Object.keys(salesData).forEach(monthKey => {
      salesData[monthKey].forEach((order, index) => {
        const slots = Array.isArray(order.deliveries) && order.deliveries.length ? order.deliveries : null;
        if (slots) {
          slots.forEach((slot, deliveryIndex) => {
            if (!slot.deliveryDate) return;
            allOrders.push({
              ...order,
              deliveryDate: slot.deliveryDate,
              mandoub: slot.mandoub || slot.deliveryPerson || null,
              delivered: !!slot.delivered,
              deliveryPaid: !!slot.deliveryPaid,
              deliveryItems: Array.isArray(slot.items) ? slot.items : [],
              monthKey,
              originalIndex: index,
              deliveryIndex
            });
          });
          return;
        }
        if (!order.deliveryDate) {
          order.delivered = true;
          order.deliveryDate = new Date().toISOString().slice(0, 16);
        }
        allOrders.push({ ...order, monthKey, originalIndex: index, deliveryIndex: -1 });
      });
    });
    
    // ترتيب الطلبات حسب وقت التسليم (من الأقرب إلى الأبعد)
    allOrders.sort((a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate));
    
    // فلترة فقط الطلبات اللي لم يتم تسليمها بعد
    const upcomingOrders = allOrders.filter(order => !order.delivered);
    
    if (upcomingOrders.length === 0) {
      noMessage.style.display = 'block';
      container.style.display = 'none';
      return;
    }
    
    noMessage.style.display = 'none';
    container.style.display = 'block';
    
    // تصنيف الطلبات حسب الفترة الزمنية
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(0, 0, 0, 0);
    
    const todayOrders = [];
    const tomorrowOrders = [];
    const thisWeekOrders = [];
    const futureOrders = [];
    
    upcomingOrders.forEach(order => {
      const deliveryDate = new Date(order.deliveryDate);
      
      if (deliveryDate.toDateString() === now.toDateString()) {
        todayOrders.push(order);
      } else if (deliveryDate.toDateString() === tomorrow.toDateString()) {
        tomorrowOrders.push(order);
      } else if (deliveryDate < nextWeek) {
        thisWeekOrders.push(order);
      } else {
        futureOrders.push(order);
      }
    });
    
    // عرض الطلبات حسب التصنيف
    if (todayOrders.length > 0) {
      container.innerHTML += `<h3 style="color: #e74c3c; margin: 20px 0 10px; font-size: 1.3em;">📅 اليوم</h3>`;
      todayOrders.forEach(order => renderUpcomingOrder(order, container));
    }
    
    if (tomorrowOrders.length > 0) {
      container.innerHTML += `<h3 style="color: #e67e22; margin: 20px 0 10px; font-size: 1.3em;">📅 غداً</h3>`;
      tomorrowOrders.forEach(order => renderUpcomingOrder(order, container));
    }
    
    if (thisWeekOrders.length > 0) {
      container.innerHTML += `<h3 style="color: #f39c12; margin: 20px 0 10px; font-size: 1.3em;">📅 خلال الأسبوع</h3>`;
      thisWeekOrders.forEach(order => renderUpcomingOrder(order, container));
    }
    
    if (futureOrders.length > 0) {
      container.innerHTML += `<h3 style="color: #3498db; margin: 20px 0 10px; font-size: 1.3em;">📅 مستقبلاً</h3>`;
      futureOrders.forEach(order => renderUpcomingOrder(order, container));
    }
    
try {
  await saveSalesData();
} catch (error) {
  console.error("فشل حفظ تحديث الطلبات القادمة:", error);
  showMessage("❌ حدث خطأ أثناء حفظ الطلبات القادمة");
}
  }

  // دالة لعرض طلب فردي في قائمة الطلبات القادمة
  function renderUpcomingOrder(order, container) {
    const deliveryDate = new Date(order.deliveryDate);
    const now = new Date();
    const timeDiff = deliveryDate - now;
    
    // حساب الوقت المتبقي
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    let countdownText = '';
    if (order.delivered) {
      countdownText = '✅ تم التسليم';
    } else if (timeDiff <= 0) {
      countdownText = '⏰ انتهى وقت التسليم';
    } else if (days > 0) {
      countdownText = `⏳ متبقي: ${days} يوم ${hours} ساعة`;
    } else if (hours > 0) {
      countdownText = `⏳ متبقي: ${hours} ساعة ${minutes} دقيقة`;
    } else {
      countdownText = `⏳ متبقي: ${minutes} دقيقة`;
    }
    
    const orderDiv = document.createElement('div');
    orderDiv.className = `upcoming-order ${order.delivered ? 'delivered' : ''}`;
    orderDiv.innerHTML = `
      <div class="order-header">
        <div class="client-name ${order.delivered ? 'delivered' : 'pending'}">
          ${order.client}
        </div>
<div class="delivery-time">
  ${deliveryDate.toLocaleString('ar-SA', { hour12: true })}
</div>
      </div>
      
      <div class="order-info">
        <div>المبلغ: ${order.totalAfter} ريال</div>
        <div>طريقة الدفع: ${getPaymentMethodDisplay(order)}</div>
        <div>المندوب: ${order.mandoub || 'غير محدد'}</div>
      </div>
      
      <div class="countdown ${order.delivered ? 'delivered' : (timeDiff <= 2 * 60 * 60 * 1000 ? 'urgent' : '')}">
        ${countdownText}
      </div>
      
      <div class="order-actions">
        <button class="action-btn details-btn" onclick="playSound('clickSound'); showDetails('${order.monthKey}', ${order.originalIndex}, event)">
          عرض الفاتورة
        </button>
        <button class="action-btn edit-btn" onclick="editDeliveryTime('${order.monthKey}', ${order.originalIndex}, ${order.deliveryIndex ?? -1})">
          تعديل الوقت
        </button>
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
          <input type="checkbox" class="delivery-checkbox" 
            ${order.delivered ? 'checked' : ''}
            onchange="toggleDeliveryStatus('${order.monthKey}', ${order.originalIndex}, this.checked, ${order.deliveryIndex ?? -1})">
          ${order.delivered ? 'تم التسليم ✅' : 'تسليم'}
        </label>
      </div>
    `;
    
    container.appendChild(orderDiv);
  }

  // دالة لتعديل وقت التسليم
  function editDeliveryTime(monthKey, index, deliveryIndex = -1) {
    const parent = salesData[monthKey][index];
    const slot = deliveryIndex >= 0 && Array.isArray(parent?.deliveries) ? parent.deliveries[deliveryIndex] : null;
    const order = slot || parent;
    
    const modal = document.createElement('div');
    modal.id = 'deliveryTimeModal';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); display: flex; justify-content: center;
      align-items: center; z-index: 10000;
    `;
    
    modal.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 10px; width: 90%; max-width: 400px;">
        <h3 style="margin-top: 0; color: #e67e22;">تعديل وقت التسليم</h3>
        
        <label style="display: block; margin: 15px 0 5px;">وقت التسليم الجديد:</label>
        <input type="datetime-local" id="newDeliveryTime" 
               value="${order.deliveryDate ? order.deliveryDate.replace(' ', 'T') : new Date().toISOString().slice(0, 16)}" 
               style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button id="cancelDeliveryBtn" style="flex: 1; padding: 10px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
            إلغاء
          </button>
          <button id="saveDeliveryBtn" style="flex: 1; padding: 10px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer;">
            حفظ
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);

    document.getElementById('cancelDeliveryBtn').addEventListener('click', function() {
      document.getElementById('deliveryTimeModal').remove();
    });

    document.getElementById('saveDeliveryBtn').addEventListener('click', function() {
      saveDeliveryTime(monthKey, index, deliveryIndex);
    });

    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

async function saveDeliveryTime(monthKey, index, deliveryIndex = -1) {
  const newTime = document.getElementById('newDeliveryTime').value;
  const parent = salesData[monthKey][index];
  if (deliveryIndex >= 0 && Array.isArray(parent?.deliveries) && parent.deliveries[deliveryIndex]) {
    parent.deliveries[deliveryIndex].deliveryDate = newTime.replace('T', ' ');
    if (deliveryIndex === 0) parent.deliveryDate = parent.deliveries[deliveryIndex].deliveryDate;
  } else {
    parent.deliveryDate = newTime.replace('T', ' ');
  }

  try {
    await saveSalesData();
  } catch (error) {
    console.error("فشل حفظ وقت التسليم:", error);
    showMessage("❌ حدث خطأ أثناء حفظ وقت التسليم");
    return;
  }

  var modal = document.getElementById('deliveryTimeModal');
  if (modal) modal.remove();

  await loadUpcomingOrders();
  updateTodayDeliverySummaryUI();
  showMessage('تم تحديث وقت التسليم بنجاح');
}

  // دالة لتغيير حالة التسليم
async function toggleDeliveryStatus(monthKey, index, isDelivered, deliveryIndex = -1) {
  const parent = salesData[monthKey][index];
  if (deliveryIndex >= 0 && Array.isArray(parent?.deliveries) && parent.deliveries[deliveryIndex]) {
    parent.deliveries[deliveryIndex].delivered = isDelivered;
    if (deliveryIndex === 0) parent.delivered = isDelivered;
  } else {
    parent.delivered = isDelivered;
  }

  try {
    await saveSalesData();
  } catch (error) {
    console.error("فشل حفظ حالة التسليم:", error);
    showMessage("❌ حدث خطأ أثناء حفظ حالة التسليم");
    return;
  }

  updateTodayDeliverySummaryUI();
  await loadUpcomingOrders();
  showMessage(isDelivered ? 'تم تسليم الطلب بنجاح' : 'تم إلغاء حالة التسليم');
}

  function changeMonth(offset) {
    autoUpdateEnabled = false;
    
    currentDisplayMonth += offset;
    
    if (currentDisplayMonth > 12) {
      currentDisplayMonth = 1;
      currentDisplayYear++;
    } else if (currentDisplayMonth < 1) {
      currentDisplayMonth = 12;
      currentDisplayYear--;
    }
    
    loadData();
  }

  // عرض رسالة للمستخدم
  function showMessage(text) {
    const msg = document.createElement('div');
    msg.style.position = 'fixed';
    msg.style.top = '20px';
    msg.style.left = '50%';
    msg.style.transform = 'translateX(-50%)';
    msg.style.backgroundColor = '#27ae60';
    msg.style.color = 'white';
    msg.style.padding = '10px 20px';
    msg.style.borderRadius = '5px';
    msg.style.zIndex = '1000';
    msg.textContent = text;
    
    document.body.appendChild(msg);
    
    setTimeout(() => {
      document.body.removeChild(msg);
    }, 3000);
  }

  // تحديث حالة الدفع
async function updatePaymentStatus(month, index, isChecked, event) {
  event.preventDefault();

  playSound('clickSound');

  const order = salesData[month][index];

  order.paidByEmad = isChecked;
  order.checkboxStatus = isChecked;

  try {
    await saveSalesData();
  } catch (error) {
    console.error("فشل حفظ حالة الدفع:", error);
    showMessage("❌ حدث خطأ أثناء حفظ حالة الدفع");
    return;
  }

  changeMonth(0);
}

  // حذف الطلب
  function deleteOrder(monthKey, orderIndex, event) {
    event.preventDefault();
    
    const confirmModal = document.createElement('div');
    confirmModal.style.position = 'fixed';
    confirmModal.style.top = '0';
    confirmModal.style.left = '0';
    confirmModal.style.right = '0';
    confirmModal.style.bottom = '0';
    confirmModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    confirmModal.style.display = 'flex';
    confirmModal.style.justifyContent = 'center';
    confirmModal.style.alignItems = 'center';
    confirmModal.style.zIndex = '10000';

    confirmModal.innerHTML = `
      <div style="background: white; padding: 25px; border-radius: 12px; width: 100%; max-width: 400px; text-align: center;">
        <h2 style="color: #e74c3c;">هل أنت متأكد أنك تريد حذف هذا الطلب؟</h2>
        <div style="display: flex; justify-content: space-between; gap: 10px;">
          <button id="cancelBtn" style="padding: 16px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer;">
            إلغاء
          </button>
          <button id="confirmBtn" style="padding: 16px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer;">
            تأكيد
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(confirmModal);

    document.getElementById('cancelBtn').addEventListener('click', function() {
      document.body.removeChild(confirmModal);
    });

document.getElementById('confirmBtn').addEventListener('click', function() {
  document.body.removeChild(confirmModal);

  setTimeout(async function() {
    playSound('deleteSound');

    if (salesData[monthKey]?.[orderIndex]) {
      salesData[monthKey].splice(orderIndex, 1);

      if (salesData[monthKey].length === 0) {
        delete salesData[monthKey];
      }

      try {
        await saveSalesData();
      } catch (error) {
        console.error("فشل حذف الطلب من IndexedDB:", error);
        showMessage("❌ حدث خطأ أثناء حذف الطلب");
        return;
      }

      changeMonth(0);
    }
  }, 300);
});
  }
  
  function escapePaymentHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// تعديل طريقة الدفع بتصميم بسيط ومرتب
function editPaymentMethod(month, index, event) {
  if (event) {
    event.preventDefault();
  }

  playSound('clickSound');

  const monthOrders = salesData[month];

  if (!Array.isArray(monthOrders) || !monthOrders[index]) {
    showMessage("❌ لم يتم العثور على الطلب");
    return;
  }

  const order = monthOrders[index];

  const clientName = escapePaymentHtml(
    order.client || "عميلة غير محددة"
  );

  const amountNumber = Number.parseFloat(order.totalAfter);

  const totalAmount = Number.isFinite(amountNumber)
    ? amountNumber
    : 0;

  const validMethods = [
    "cash",
    "transfer",
    "not-set"
  ];

  const currentMethod = validMethods.includes(order.paymentMethod)
    ? order.paymentMethod
    : "not-set";

  const modal = document.createElement("div");
  modal.className = "payment-simple-overlay";

  modal.innerHTML = `
    <div
      class="payment-simple-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paymentSimpleTitle"
    >
      <div class="payment-simple-header">
        <button
          type="button"
          class="payment-simple-close"
          id="paymentSimpleClose"
          aria-label="إغلاق"
        >
          ×
        </button>

        <h2 id="paymentSimpleTitle">
          💳 تعديل الدفع
        </h2>
      </div>

      <div class="payment-simple-body">

        <div class="payment-client-box">
          <div class="payment-client-header">
		  
		  
		             <div class="payment-order-number">
              الطلب #${index + 1}
            </div>
          </div>
		  
		  
            <div>
              <span class="payment-client-label">
                اسم العميلة:  
              </span>

              <strong class="payment-client-name">
                ${clientName}
              </strong>
            </div>


          <div class="payment-amount-box">
            <span class="payment-amount-label">
              مبلغ الطلب
            </span>

            <strong class="payment-amount-value">
              ${totalAmount.toFixed(2)} ريال
            </strong>
          </div>
        </div>

        <div class="payment-simple-field">
          <label for="paymentSimpleSelect">
            طريقة الدفع
          </label>

          <select
            class="payment-simple-select"
            id="paymentSimpleSelect"
          >
            <option
              value="cash"
              ${currentMethod === "cash" ? "selected" : ""}
            >
              💵 كاش
            </option>

            <option
              value="transfer"
              ${currentMethod === "transfer" ? "selected" : ""}
            >
              🏦 تحويل
            </option>

            <option
              value="not-set"
              ${currentMethod === "not-set" ? "selected" : ""}
            >
              ❓ غير محدد
            </option>
          </select>
        </div>

        <div
          class="payment-simple-check-box transfer-box"
          id="paymentSimpleTransferBox"
          style="${
            currentMethod === "transfer"
              ? ""
              : "display:none;"
          }"
        >
          <label class="payment-simple-check-label">
            <input
              type="checkbox"
              id="paymentSimpleTransferred"
              ${order.transferred ? "checked" : ""}
            >

            <span>
              تم التحويل من العميلة
            </span>
          </label>
        </div>

        <div class="payment-simple-check-box">
          <label class="payment-simple-check-label">
            <input
              type="checkbox"
              id="paymentSimpleDelivered"
              ${order.delivered ? "checked" : ""}
            >

            <span>
              تم تسليم الطلب
            </span>
          </label>
        </div>

        <div class="payment-simple-actions">
          <button
            type="button"
            class="payment-simple-button payment-simple-cancel"
            id="paymentSimpleCancel"
          >
            إلغاء
          </button>

          <button
            type="button"
            class="payment-simple-button payment-simple-save"
            id="paymentSimpleSave"
          >
            حفظ
          </button>
        </div>

      </div>
    </div>
  `;

  const previousBodyOverflow =
    document.body.style.overflow;

document.body.classList.add("payment-modal-open");
document.body.style.overflow = "hidden";
document.body.appendChild(modal);

  const closeButton =
    modal.querySelector("#paymentSimpleClose");

  const cancelButton =
    modal.querySelector("#paymentSimpleCancel");

  const saveButton =
    modal.querySelector("#paymentSimpleSave");

  const paymentSelect =
    modal.querySelector("#paymentSimpleSelect");

  const transferBox =
    modal.querySelector("#paymentSimpleTransferBox");

  const transferredCheck =
    modal.querySelector("#paymentSimpleTransferred");

  const deliveredCheck =
    modal.querySelector("#paymentSimpleDelivered");


function closePaymentSimpleModal() {
  document.removeEventListener(
    "keydown",
    closePaymentByEscape
  );

  document.body.classList.remove("payment-modal-open");

  document.body.style.overflow =
    previousBodyOverflow;

  modal.remove();
}

  function closePaymentByEscape(keyEvent) {
    if (keyEvent.key === "Escape") {
      closePaymentSimpleModal();
    }
  }


  paymentSelect.addEventListener("change", function () {
    transferBox.style.display =
      this.value === "transfer"
        ? "block"
        : "none";
  });


  closeButton.addEventListener(
    "click",
    closePaymentSimpleModal
  );

  cancelButton.addEventListener(
    "click",
    closePaymentSimpleModal
  );

  document.addEventListener(
    "keydown",
    closePaymentByEscape
  );


  saveButton.addEventListener("click", async function () {
    const newMethod = paymentSelect.value;

    const newTransferred =
      newMethod === "transfer"
        ? transferredCheck.checked
        : false;

    const newDelivered =
      deliveredCheck.checked;

    /*
      الاحتفاظ بالقيم القديمة لإعادتها
      في حال فشل الحفظ في IndexedDB.
    */
    const previousMethod =
      order.paymentMethod;

    const previousTransferred =
      order.transferred;

    const previousDelivered =
      order.delivered;

    saveButton.disabled = true;
    saveButton.textContent = "جاري الحفظ...";

    order.paymentMethod =
      newMethod;

    order.transferred =
      newTransferred;

    order.delivered =
      newDelivered;

    try {
      await saveSalesData();

      closePaymentSimpleModal();

      if (
        document
          .getElementById("upcomingTab")
          .classList
          .contains("active")
      ) {
        await loadUpcomingOrders();
      } else {
        changeMonth(0);
      }

      updateTodayDeliverySummaryUI();

      showMessage("✅ تم حفظ تعديل الدفع");

    } catch (error) {
      order.paymentMethod =
        previousMethod;

      order.transferred =
        previousTransferred;

      order.delivered =
        previousDelivered;

      console.error(
        "فشل حفظ تعديل الدفع:",
        error
      );

      showMessage(
        "❌ تعذر حفظ التعديل، ولم تتغير بيانات الطلب"
      );

      saveButton.disabled = false;
      saveButton.textContent = "حفظ";
    }
  });
}

// عرض تفاصيل الطلب - تصميم صغير ومرتب
function showDetails(month, index, event) {
  if (event) event.preventDefault();
  const order = salesData?.[month]?.[index];
  if (!order) {
    NoshiUI.alert("لم يتم العثور على الطلب المطلوب", { title: "الفاتورة" });
    return;
  }
  if (!window.NoshiInvoice) {
    NoshiUI.alert("تعذر تحميل ملف الفاتورة الموحد invoice.js", { title: "الفاتورة" });
    return;
  }

  NoshiInvoice.open(order, {
    onEdit: () => editInvoice(month, index, { preventDefault() {} })
  });
  playSound('clickSound');
}

async function editInvoice(monthKey, orderIndex, event) {
  event.preventDefault();

  const order = salesData[monthKey][orderIndex];

  try {
    await NoshiDB.set("editingOrder", {
      order: order,
      monthKey: monthKey,
      orderIndex: orderIndex
    });
  } catch (error) {
    console.error("فشل تجهيز الفاتورة للتحرير:", error);
    showMessage("❌ حدث خطأ أثناء فتح تحرير الفاتورة");
    return;
  }

  window.location.href = "index.html";
}

  // حساب المبلغ الأصلي
  function calculateOriginalTotal(items) {
    return items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }

  // الحصول على حالة الطلب
  function getOrderStatus(order) {
    if (order.delivered) return 'تم التوصيل';
    if (order.paymentMethod === 'cash' && order.cashReceived) return 'مدفوع';
    if (order.paymentMethod === 'transfer' && order.transferred) return 'تم التحويل';
    return 'قيد المعالجة';
  }

function updateTodayDateText() {
  var el = document.getElementById("todayDateText");
  if (!el) return;

  var d = summarySelectedDate || new Date();
  var day = String(d.getDate()).padStart(2, "0");
  var month = String(d.getMonth() + 1).padStart(2, "0");
  var year = d.getFullYear();

  el.textContent = day + " / " + month + " / " + year;

  var label = document.getElementById("summaryDayLabel");
  if (label) {
    label.textContent = dateKey(d) === dateKey(new Date())
      ? "طلبات اليوم"
      : "طلبات التاريخ";
  }
}

function changeSummaryDay(offset) {
  var d = new Date(summarySelectedDate);
  d.setDate(d.getDate() + Number(offset || 0));
  summarySelectedDate = d;
  updateTodayDeliverySummaryUI();
}

function resetSummaryDay() {
  summarySelectedDate = new Date();
  updateTodayDeliverySummaryUI();
}


  // الحصول على طريقة الدفع
  function getPaymentMethodDisplay(order) {
    const methods = {
      'cash': 'نقدي',
      'transfer': 'تحويل',
      'not-set': 'غير محدد'
    };
    return methods[order.paymentMethod] || 'غير محدد';
  }

  // دالة لحساب وتحديث عدد الطلبات غير المحولة
  function updateUnpaidOrdersCount() {
    const monthKey = `${currentDisplayYear}-${currentDisplayMonth.toString().padStart(2, '0')}`;
    const monthOrders = salesData[monthKey] || [];
    
    const unpaidCount = monthOrders.filter(
      order => order.paymentMethod === "transfer" && !order.transferred
    ).length;
    
    const countElement = document.getElementById("unpaidCountText");
    if (countElement) {
      countElement.textContent = unpaidCount;
    }
  }

  function filterUnpaidMonthlyOrders() {
    const btn = document.getElementById("filterUnpaidBtn");
    const container = document.getElementById("ordersContainer");

    if (!showingOnlyUnpaidMonthly) {
      cachedMonthOrders = JSON.parse(JSON.stringify(salesData));

      const monthKey = `${currentDisplayYear}-${currentDisplayMonth.toString().padStart(2, '0')}`;
      const monthOrders = cachedMonthOrders[monthKey] || [];

      const unpaidOrders = monthOrders.filter(
        o => o.paymentMethod === "transfer" && !o.transferred
      );

      if (unpaidOrders.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; color:#27ae60; font-size:1.2em; margin:20px 0;">
            ✅ لا توجد طلبات غير محولة
          </div>
        `;
      } else {
        displayUnpaidOrders(monthKey, unpaidOrders);
      }

      btn.innerHTML = "↩️ عرض جميع الطلبات";
      btn.style.background = "#27ae60";
      showingOnlyUnpaidMonthly = true;
      
    } else {
      loadData();
      btn.innerHTML = "⚠️ عرض الطلبات غير المحولة (<span id=\"unpaidCountText\" style=\"color:#ffeb3b; font-weight:bold;\">0</span>)";
      btn.style.background = "#e74c3c";
      showingOnlyUnpaidMonthly = false;
    }
    
    updateUnpaidOrdersCount();
  }

  // دالة خاصة لعرض الطلبات غير المحولة (معدلة بإضافة زر واتساب)
  function displayUnpaidOrders(monthKey, unpaidOrders) {
    let html = `
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>✔️</th>
              <th>#</th>
              <th>التاريخ</th>
              <th>العميل</th>
              <th>المبلغ</th>
              <th>طريقة الدفع</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>`;

    unpaidOrders.forEach((order, index) => {
      const orderDate = order.date || "-";
      const totalAfter = parseFloat(order.totalAfter);
      const originalIndex = findOriginalIndex(monthKey, order);
      
      html += `
        <tr class="payment-not-set">
          <td>
            <input type="checkbox" class="checkbox" 
              ${order.paidByEmad ? 'checked' : ''}
              onchange="updatePaymentStatus('${monthKey}', ${originalIndex}, this.checked, event)"
            >
          </td>
          <td>${index + 1}</td>
          <td>${orderDate}</td>
          <td class="client-name">${order.client || "—"}</td>
          <td>${totalAfter.toFixed(2)} ريال</td>
          <td><span class='unpaid-transfer'>لم يتم التحويل ⚠️</span></td>
          <td>
            <div class="action-buttons">
              <button class="action-btn details-btn" onclick="playSound('clickSound'); showDetails('${monthKey}', ${originalIndex}, event)">
                عرض الفاتورة
              </button>
              <button class="action-btn edit-btn" onclick="editPaymentMethod('${monthKey}', ${originalIndex}, event)">
                تعديل الدفع
              </button>
              <button class="action-btn whatsapp-btn" onclick="sendWhatsAppToClient('${order.client}', '${monthKey}', ${originalIndex})">
                📱 واتساب
              </button>
              <button class="action-btn delete-btn" onclick="playSound('deleteSound'); deleteOrder('${monthKey}', ${originalIndex}, event)">
                حذف الطلب
              </button>
            </div>
           </td>
         </tr>`;
    });

    html += `</tbody> </table> </div>`;
    
    const totalUnpaidAmount = unpaidOrders.reduce((sum, order) => {
      return sum + parseFloat(order.totalAfter);
    }, 0);
    
    html += `
      <div class="orange-line"></div>
      <div class="sales-summary" style="
        background: #fff8f0;
        padding: 15px;
        border-radius: 10px;
        margin-top: 20px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
      ">
        <h3 style="margin-top:0; margin-bottom:15px; text-align:center; color:#e74c3c; font-size:1.3em;">
          ملخص المبالغ غير المحولة
        </h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
          <div style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); text-align:center;">
            <div style="font-size:0.9em; color:#555; margin-bottom:5px;">عدد الطلبات غير المحولة</div>
            <div style="font-size:1.5em; font-weight:bold; color:#e74c3c;">${unpaidOrders.length}</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); text-align:center;">
            <div style="font-size:0.9em; color:#555; margin-bottom:5px;">إجمالي المبالغ غير المحولة</div>
            <div style="font-size:1.5em; font-weight:bold; color:#e74c3c;">${totalUnpaidAmount.toFixed(2)} ريال</div>
          </div>
        </div>
      </div>`;
    
    container.innerHTML = html;
    
    // تطبيق حجم الخط بعد عرض الجدول
    setTimeout(() => {
      applyFontSizeToTable();
    }, 50);
  }

  // دالة للعثور على الفهرس الأصلي للطلب
  function findOriginalIndex(monthKey, targetOrder) {
    const originalOrders = salesData[monthKey] || [];
    return originalOrders.findIndex(order => 
      order.date === targetOrder.date &&
      order.client === targetOrder.client &&
      order.totalAfter === targetOrder.totalAfter
    );
  }

  // تهيئة التطبيق عند تحميل الصفحة
  document.addEventListener("DOMContentLoaded", async () => {
    // تهيئة الشهر الحالي
    const now = new Date();
    currentDisplayYear = now.getFullYear();
    currentDisplayMonth = now.getMonth() + 1;
	    
    try {
      await initStorageData();
    } catch (error) {
      console.error("فشل تحميل بيانات IndexedDB:", error);
      alert("حدث خطأ أثناء تحميل بيانات الطلبات من IndexedDB");
      return;
    }
    
    loadData();
    
    document.getElementById("prevMonthBtn").addEventListener("click", () => changeMonth(-1));
    document.getElementById("nextMonthBtn").addEventListener("click", () => changeMonth(1));
    
    // إغلاق نافذة ضبط الخط عند الضغط خارجها
    const modal = document.getElementById('fontSizeModal');
    modal.addEventListener('click', function(event) {
      if (event.target === modal) {
        closeFontSizeModal();
      }
    });
    
    // تطبيق حجم الخط عند التحميل
    setTimeout(() => {
      applyFontSizeToTable();
    }, 100);
  });
  
  // ===============================
// ✅ حساب ملخص طلبات اليوم (حسب تاريخ التوصيل)
// ===============================

// قراءة التاريخ بصيغة آمنة (عشان Safari)
function parseLocalDateTime(str) {
  if (!str) return null;

  var s = String(str).replace("T", " ");
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (!m) return null;

  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5])
  );
}

function dateKey(d) {
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

var summarySelectedDate = new Date();

function computeTodayDeliverySummary(selectedDate) {
  var data = salesData || {};
  var today = dateKey(selectedDate || summarySelectedDate);
  var count = 0, totalBefore = 0, totalAfter = 0, totalDeliveryCost = 0, totalPhraseStrip = 0;

  function accumulate(order, deliveryDate, items, deliveryFee) {
    var dt = parseLocalDateTime(deliveryDate);
    if (!dt || dateKey(dt) !== today) return;
    count++;
    var generalDiscount = Math.max(0, Math.min(100, parseFloat(order.generalDiscount) || 0));
    var before = 0, after = 0, phrase = 0;
    (items || []).forEach(function(item) {
      var name = String(item.originalName || item.name || '').trim();
      var price = parseFloat(item.price) || 0;
      var qty = parseFloat(item.qty ?? item.quantity) || 0;
      var line = price * qty;
      if (name === 'مندوب') { totalDeliveryCost += line; return; }
      var itemDiscount = Math.max(0, Math.min(100, parseFloat(item.discount) || 0));
      var lineAfter = line * (1 - itemDiscount / 100);
      if (name === PHRASE_STRIP_NAME) { phrase += lineAfter; return; }
      before += line;
      if (name !== 'صحن تقديم') lineAfter *= (1 - generalDiscount / 100);
      after += lineAfter;
    });
    totalBefore += before;
    totalAfter += after;
    totalPhraseStrip += phrase;
    totalDeliveryCost += Math.max(0, Number(deliveryFee || 0));
  }

  Object.values(data).forEach(function(monthOrders) {
    (monthOrders || []).forEach(function(order) {
      var slots = Array.isArray(order.deliveries) && order.deliveries.length ? order.deliveries : null;
      if (slots) {
        slots.forEach(function(slot) {
          accumulate(order, slot.deliveryDate, slot.items || [], slot.deliveryFee || 0);
        });
      } else {
        accumulate(order, order.deliveryDate, order.items || [], 0);
      }
    });
  });

  var discount = Math.max(0, totalBefore - totalAfter);
  var excludedTotal = totalDeliveryCost + totalPhraseStrip;
  return {
    count,
    totalBefore: totalBefore.toFixed(2),
    totalAfter: totalAfter.toFixed(2),
    discount: discount.toFixed(2),
    deliveryCost: totalDeliveryCost.toFixed(2),
    phraseStrip: totalPhraseStrip.toFixed(2),
    excludedTotal: excludedTotal.toFixed(2)
  };
}

function updateTodayDeliverySummaryUI() {
  var elCount =
    document.getElementById("td_count");

  if (!elCount) return;

  var elBefore =
    document.getElementById("td_before");

  var elAfter =
    document.getElementById("td_after");

  var elDisc =
    document.getElementById("td_discount");

  var s = computeTodayDeliverySummary(summarySelectedDate);

  elCount.textContent =
    s.count;

  elBefore.textContent =
    s.totalBefore + " ريال";

  elAfter.textContent =
    s.totalAfter + " ريال";

  elDisc.textContent =
    s.discount + " ريال";

  if (parseFloat(s.discount) > 0) {
    elDisc.style.color = "#c0392b";
    elDisc.style.fontWeight = "bold";
  } else {
    elDisc.style.color = "#27ae60";
    elDisc.style.fontWeight = "bold";
  }

  /*
    ملاحظة صغيرة تحت بوكس الخصم:
    تعرض المندوب والشريط المستثنيين.
  */
  var excludedNote =
    document.getElementById("excludedItemsNote");

  var excludedAmount =
    parseFloat(s.excludedTotal) || 0;

  if (excludedAmount > 0) {
    if (!excludedNote) {
      excludedNote =
        document.createElement("div");

      excludedNote.id =
        "excludedItemsNote";

      excludedNote.style.cssText = `
        font-size:0.66em;
        color:#7f8c8d;
        text-align:center;
        margin-top:4px;
        line-height:1.6;
      `;

      elDisc.parentNode.appendChild(
        excludedNote
      );
    }

    excludedNote.innerHTML = `
      <div>
        المستثنى من الحساب:
        المندوب ${s.deliveryCost} ريال
        — الشريط ${s.phraseStrip} ريال
      </div>

      <div style="
        color:#8e44ad;
        font-weight:bold;
      ">
        الإجمالي المستثنى:
        ${s.excludedTotal} ريال
      </div>
    `;

  } else if (excludedNote) {
    excludedNote.remove();
  }

  /*
    حذف الملاحظة القديمة إن كانت باقية.
  */
  var oldDeliveryNote =
    document.getElementById("deliveryNote");

  if (oldDeliveryNote) {
    oldDeliveryNote.remove();
  }

  updateTodayDateText();
}

function ensureOrderHasTotals(order) {
  if (!order.totalBefore || order.totalBefore === 0) {
    order.totalBefore = 0;
    (order.items || []).forEach(item => {
      if (item.name !== "مندوب") {
        order.totalBefore += (item.qty * item.price);
      }
    });
  }
  
  if (!order.totalAfter || order.totalAfter === 0) {
    order.totalAfter = order.totalBefore || 0;
  }
}

/* ====== ميزة السداد الجماعي + التراجع ====== */
(function () {
  const BULK_PAY_KEY = "bulk_pay_undo_history_v1";
  const TTL_MS = 60 * 24 * 60 * 60 * 1000;
  const MAX_UNDOS_PER_MONTH = 10;

  function ensureToastEl() {
    let el = document.getElementById("toast");
    if (el) return el;

    el = document.createElement("div");
    el.id = "toast";
    el.style.cssText = `
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      top: calc(16px + env(safe-area-inset-top));
      background: rgba(39,174,96,0.95);
      color: #fff;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 800;
      box-shadow: 0 8px 20px rgba(0,0,0,.25);
      z-index: 999999;
      display: none;
      max-width: 90vw;
      text-align: center;
      direction: rtl;
    `;
    document.body.appendChild(el);
    return el;
  }

  function toast(msg, ms = 2200) {
    const el = ensureToastEl();
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.style.display = "none"), ms);
  }

  function ensureConfirmModal() {
    let modal = document.getElementById("confirmModal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "confirmModal";
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.6);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000000;
      padding: 16px;
    `;

    modal.innerHTML = `
      <div style="
        background:#fff;
        width:min(420px, 95vw);
        border-radius:16px;
        padding:18px 16px;
        box-shadow:0 12px 30px rgba(0,0,0,.25);
        text-align:center;
        font-family: 'Cairo', sans-serif;
      ">
<div id="confirmText" style="
  font-size:16px;
  font-weight:400;
  color:#2c3e50;
  margin-bottom:14px;
  text-align:right;
">          هل أنت متأكد؟
        </div>
        <div style="display:flex; gap:10px;">
          <button id="confirmNoBtn" style="
            flex:1; padding:12px 14px; border:none; border-radius:12px;
            background:#e74c3c; color:#fff; font-size:16px; font-weight:900; cursor:pointer;
          ">إلغاء</button>
          <button id="confirmYesBtn" style="
            flex:1; padding:12px 14px; border:none; border-radius:12px;
            background:#27ae60; color:#fff; font-size:16px; font-weight:900; cursor:pointer;
          ">تأكيد</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });

    return modal;
  }

function confirmUI(content, onYes, useHtml = false) {
  const modal = ensureConfirmModal();
  const confirmText = modal.querySelector("#confirmText");
  const yesBtn = modal.querySelector("#confirmYesBtn");
  const noBtn = modal.querySelector("#confirmNoBtn");

  if (!confirmText || !yesBtn || !noBtn) {
    const plainText = useHtml
      ? "هل تريد تأكيد عملية السداد؟"
      : content;

    NoshiUI.confirm(plainText, { title: "تأكيد العملية" }).then((confirmed) => {
      if (confirmed) onYes();
    });

    return;
  }

  if (useHtml) {
    confirmText.innerHTML = content;
  } else {
    confirmText.textContent = content;
  }

  modal.style.display = "flex";

  const cleanup = () => {
    modal.style.display = "none";
    yesBtn.onclick = null;
    noBtn.onclick = null;
  };

  yesBtn.onclick = () => {
    cleanup();
    onYes();
  };

  noBtn.onclick = cleanup;
}

  async function loadStore() {
    let data = { entries: [] };

    try {
      data = await NoshiDB.get(BULK_PAY_KEY, { entries: [] });
    } catch (error) {
      console.error("فشل قراءة سجل التراجع:", error);
      data = { entries: [] };
    }

    if (!data || typeof data !== "object") data = { entries: [] };
    if (!Array.isArray(data.entries)) data.entries = [];

    const now = Date.now();
    const beforeCount = data.entries.length;

    data.entries = data.entries.filter(
      (e) => e && typeof e.expiresAt === "number" && now <= e.expiresAt
    );

    if (data.entries.length !== beforeCount) {
      await saveStore(data);
    }

    return data;
  }

  async function saveStore(data) {
    await NoshiDB.set(BULK_PAY_KEY, data);
  }

  async function upsertEntry(entry) {
    const data = await loadStore();

    data.entries.push(entry);
    data.entries.sort((a, b) => (a.atMs || 0) - (b.atMs || 0));

    const sameMonth = data.entries.filter(e => e.monthKey === entry.monthKey);

    if (sameMonth.length > MAX_UNDOS_PER_MONTH) {
      const overflow = sameMonth.length - MAX_UNDOS_PER_MONTH;
      let removed = 0;

      data.entries = data.entries.filter(e => {
        if (e.monthKey === entry.monthKey && removed < overflow) {
          removed++;
          return false;
        }
        return true;
      });
    }

    await saveStore(data);
  }

  async function findEntry(monthKey) {
    const data = await loadStore();
    const list = data.entries.filter(e => e.monthKey === monthKey);

    if (!list.length) return null;

    list.sort((a, b) => (a.atMs || 0) - (b.atMs || 0));
    return list[list.length - 1];
  }

  async function removeEntry(monthKey) {
    const data = await loadStore();

    const idxs = data.entries
      .map((e, i) => ({ e, i }))
      .filter(x => x.e.monthKey === monthKey)
      .map(x => x.i);

    if (!idxs.length) return;

    const lastIndex = idxs[idxs.length - 1];
    data.entries.splice(lastIndex, 1);

    await saveStore(data);
  }

  async function countMonthEntries(monthKey) {
    const data = await loadStore();
    return data.entries.filter(e => e.monthKey === monthKey).length;
  }

  function getCurrentMonthKey() {
    return `${currentDisplayYear}-${currentDisplayMonth.toString().padStart(2, "0")}`;
  }

function getBulkPayCandidates(mode) {
  const monthKey = getCurrentMonthKey();
  const monthOrders = salesData[monthKey] || [];
  const candidates = [];

  for (let i = 0; i < monthOrders.length; i++) {
    const order = monthOrders[i];

    /*
      يمنع سداد الطلب وخصم شريطه مرتين.
    */
    if (order.paidByEmad) {
      continue;
    }

    /*
      خيار باستثناء غير المحولة:
      نستبعد طلب التحويل الذي لم تحوّل عميلته.
      طلبات الكاش تبقى داخلة مثل النظام الحالي.
    */
    if (mode === "exceptNotTransferred") {
      if (
        order.paymentMethod === "transfer" &&
        !order.transferred
      ) {
        continue;
      }
    }

    candidates.push({
      index: i,
      order
    });
  }

  return candidates;
}


function getBulkPaySummary(mode) {
  const candidates = getBulkPayCandidates(mode);

  let transferAmount = 0;
  let transferStripAmount = 0;
  let cashStripAmount = 0;

  candidates.forEach(({ order }) => {
    const stripAmount =
      getPhraseStripInfo(order).amount;

    if (order.paymentMethod === "transfer") {
      /*
        في خيار all تدخل المحولة وغير المحولة.
        وفي الخيار الآخر تكون غير المحولة مستبعدة مسبقًا.
      */
      transferAmount += Number(
        order.totalAfter || 0
      );

      transferStripAmount += stripAmount;

    } else if (order.paymentMethod === "cash") {
      /*
        لا نضيف مبلغ طلب الكاش للتحويل.
        نأخذ فقط حق عماد من الشريط.
      */
      cashStripAmount += stripAmount;
    }
  });

  const totalStripAmount =
    transferStripAmount +
    cashStripAmount;

  const rawTransferAmount =
    transferAmount -
    totalStripAmount;

  return {
    candidates,
    transferAmount,
    transferStripAmount,
    cashStripAmount,
    totalStripAmount,

    amountToTransfer:
      Math.max(0, rawTransferAmount),

    emadBalance:
      Math.max(0, -rawTransferAmount)
  };
}


function buildBulkPayMessage(mode, summary) {
  const title =
    mode === "all"
      ? "سداد المحولة وغير المحولة"
      : "سداد المحولة فقط";

  const transferLabel =
    mode === "all"
      ? "مبالغ طلبات التحويل"
      : "المبالغ المحولة من العملاء";

  const balanceHtml =
    summary.emadBalance > 0
      ? `
        <div style="
          margin-top:10px;
          padding:10px;
          background:#fff3e0;
          border:1px solid #ffcc80;
          border-radius:11px;
          text-align:center;
        ">
          <div style="font-size:0.75rem;color:#8a5a00;">
            رصيد متبقٍ لعماد
          </div>

          <strong style="
            display:block;
            margin-top:3px;
            color:#d35400;
            font-size:1.05rem;
          ">
            ${summary.emadBalance.toFixed(2)} ريال
          </strong>
        </div>
      `
      : "";

  return `
    <div style="
      font-family:'Cairo',sans-serif;
      direction:rtl;
    ">
      <div style="
        text-align:center;
        margin-bottom:13px;
      ">
        <div style="font-size:1.1rem;font-weight:900;color:#d35400;">
          💳 ${title}
        </div>

        <div style="
          margin-top:3px;
          font-size:0.72rem;
          color:#888;
        ">
          راجع المبلغ قبل تأكيد السداد
        </div>
      </div>

      <div style="
        padding:12px;
        background:#f7f8fa;
        border-radius:13px;
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
        ">
          <span style="color:#555;font-size:0.82rem;">
            ${transferLabel}
          </span>

          <strong style="
            color:#2c3e50;
            white-space:nowrap;
          ">
            ${summary.transferAmount.toFixed(2)} ريال
          </strong>
        </div>
      </div>

      <div style="
        margin-top:10px;
        padding:12px;
        background:#f5efff;
        border:1px solid #dfcff1;
        border-radius:13px;
      ">
        <div style="
          margin-bottom:8px;
          color:#6c3483;
          font-size:0.82rem;
          font-weight:900;
        ">
          🎀 مبالغ الشريط — عماد
        </div>

        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:7px;
        ">
          <div style="
            padding:8px;
            background:#fff;
            border-radius:9px;
            text-align:center;
          ">
            <div style="font-size:0.7rem;color:#777;">
              طلبات تحويل
            </div>

            <strong style="color:#8e44ad;font-size:0.92rem;">
              ${summary.transferStripAmount.toFixed(2)} ريال
            </strong>
          </div>

          <div style="
            padding:8px;
            background:#fff;
            border-radius:9px;
            text-align:center;
          ">
            <div style="font-size:0.7rem;color:#777;">
              طلبات كاش
            </div>

            <strong style="color:#8e44ad;font-size:0.92rem;">
              ${summary.cashStripAmount.toFixed(2)} ريال
            </strong>
          </div>
        </div>

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:10px;
          margin-top:8px;
          padding-top:8px;
          border-top:1px dashed #cdb5e3;
        ">
          <span style="font-size:0.78rem;color:#6c3483;">
            إجمالي الخصم
          </span>

          <strong style="color:#8e44ad;">
            - ${summary.totalStripAmount.toFixed(2)} ريال
          </strong>
        </div>
      </div>

      <div style="
        margin-top:11px;
        padding:13px;
        background:#eaf8ef;
        border:1px solid #b9e4c8;
        border-radius:13px;
        text-align:center;
      ">
        <div style="
          font-size:0.76rem;
          color:#55745f;
        ">
          المبلغ النهائي الذي سيُحوّل
        </div>

        <strong style="
          display:block;
          margin-top:3px;
          color:#219150;
          font-size:1.45rem;
        ">
          ${summary.amountToTransfer.toFixed(2)} ريال
        </strong>
      </div>

      ${balanceHtml}
    </div>
  `;
}

async function bulkPay(mode) {
  const monthKey = getCurrentMonthKey();
  const summary = getBulkPaySummary(mode);

  if (!summary.candidates.length) {
    toast(
      "لا توجد طلبات جديدة داخلة في هذا السداد."
    );
    return;
  }

  // النسخة الكاملة تُقرأ لايف فقط وقت السداد، وليس عند فتح صفحة الطلبات.
  // هذا يحافظ على النسخ الاحتياطية الكاملة بدون إبطاء فتح الصفحة.
  let liveBackupBase = {};
  try {
    liveBackupBase = await NoshiDB.exportAll();
  } catch (error) {
    console.error("تعذر تجهيز النسخة الاحتياطية قبل السداد:", error);
    toast("❌ تعذر قراءة النسخة الاحتياطية من السحابة");
    return;
  }

  const beforeFile = createBackupFile("نسخة_قبل_السداد", liveBackupBase);
  const changes = [];

  summary.candidates.forEach(({ index, order }) => {
    // نخزن هوية الطلب الثابتة مع الشهر. index يبقى فقط لدعم السجلات القديمة.
    changes.push({
      orderId: String(order.id ?? ""),
      index,
      prevPaidByEmad: !!order.paidByEmad,
      prevCheckboxStatus: !!order.checkboxStatus
    });
    order.paidByEmad = true;
    order.checkboxStatus = true;
  });

  const now = Date.now();
  const afterFile = createBackupFile("نسخة_بعد_السداد", liveBackupBase);

  /*
    لم نغيّر آلية المشاركة أو تنزيل النسخ.
  */
  try {
    if (
      navigator.canShare &&
      navigator.canShare({
        files: [beforeFile, afterFile]
      })
    ) {
      await navigator.share({
        title: "نسخ احتياطية السداد",
        text: "نسخة قبل وبعد السداد",
        files: [beforeFile, afterFile]
      });
    } else {
      throw new Error(
        "share not supported"
      );
    }
  } catch (err) {
    downloadBackupFiles(
      beforeFile,
      afterFile
    );
  }

  try {
    await upsertEntry({
      monthKey,
      atMs: now,
      expiresAt: now + TTL_MS,
      mode,
      changes
    });

    await saveSalesData();

    backupBaseData.salesData =
      cloneForBackup(salesData);

    backupBaseData.clients =
      cloneForBackup(clients);

    toast("تم السداد ✅");

    closeBulkPayModal();
    changeMonth(0);

  } catch (error) {
    console.error(
      "فشل حفظ السداد في IndexedDB:",
      error
    );

    toast(
      "❌ تمت المشاركة، لكن حدث خطأ أثناء حفظ السداد"
    );
  }
}

async function undoBulkPayCore() {
  const monthKey = getCurrentMonthKey();
  const entry = await findEntry(monthKey);

  if (!entry) {
    toast("لا توجد عملية سداد للتراجع لهذا الشهر.");
    await updateUndoUI();
    return;
  }

  if (Date.now() > entry.expiresAt) {
    await removeEntry(monthKey);
    toast("انتهت مدة التراجع (60 يوم).");
    await updateUndoUI();
    return;
  }

  const monthOrders = salesData[monthKey] || [];

  (entry.changes || []).forEach((ch) => {
    // عزل كامل داخل الشهر: لا نبحث أبدًا في شهر آخر.
    // الهوية الثابتة تمنع رجوع السداد على طلب مختلف إذا تغيّر ترتيب الصفوف.
    let target = null;
    if (ch.orderId) {
      target = monthOrders.find(o => String(o?.id ?? "") === String(ch.orderId));
    }
    if (!target && Number.isInteger(ch.index)) target = monthOrders[ch.index] || null;
    if (!target) return;
    target.paidByEmad = !!ch.prevPaidByEmad;
    target.checkboxStatus = !!ch.prevCheckboxStatus;
  });

  try {
    await removeEntry(monthKey);
    await saveSalesData();

    backupBaseData.salesData = cloneForBackup(salesData);
    backupBaseData.clients = cloneForBackup(clients);

    toast("تم التراجع ↩️");
    closeBulkPayModal();
    changeMonth(0);

  } catch (error) {
    console.error("فشل التراجع عن السداد:", error);
    toast("❌ حدث خطأ أثناء التراجع");
  }
}

  const modal = document.getElementById("bulkPayModal");
  const openBtn = document.getElementById("openBulkPayModalBtn");
  const closeBtn = document.getElementById("closeBulkPayModalBtn");
  const payAllBtn = document.getElementById("bulkPayAllBtn");
  const payExceptBtn = document.getElementById("bulkPayExceptNotTransferredBtn");
  const undoBtn = document.getElementById("bulkPayUndoBtn");
  const hint = document.getElementById("bulkPayHint");

  if (!modal || !openBtn || !closeBtn || !payAllBtn || !payExceptBtn || !undoBtn || !hint) {
    return;
  }

  async function openBulkPayModal() {
    modal.style.display = "flex";
    await updateUndoUI();
  }

  function closeBulkPayModal() {
    modal.style.display = "none";
  }

  window.closeBulkPayModal = closeBulkPayModal;

  async function updateUndoUI() {
    const monthKey = getCurrentMonthKey();
    const entry = await findEntry(monthKey);
    const count = await countMonthEntries(monthKey);

    if (!entry) {
      undoBtn.style.display = "none";
      hint.textContent = `الشهر الحالي: ${monthKey}`;
      return;
    }

    const remaining = entry.expiresAt - Date.now();

    if (remaining <= 0) {
      await removeEntry(monthKey);
      undoBtn.style.display = "none";
      hint.textContent = `الشهر الحالي: ${monthKey} — انتهت مدة التراجع.`;
      return;
    }

    const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
    undoBtn.style.display = "block";
    hint.textContent = `الشهر الحالي: ${monthKey} — التراجع متاح لمدة ${days} يوم/أيام (متبقي ${count} عملية).`;
  }

  openBtn.addEventListener("click", () => {
    openBulkPayModal();
  });

  closeBtn.addEventListener("click", closeBulkPayModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeBulkPayModal();
  });

function openBulkPayConfirmation(mode) {
  const summary =
    getBulkPaySummary(mode);

  if (!summary.candidates.length) {
    toast(
      "لا توجد طلبات جديدة داخلة في هذا السداد."
    );
    return;
  }

confirmUI(
  buildBulkPayMessage(mode, summary),
  () => bulkPay(mode),
  true
);
}


payAllBtn.addEventListener("click", () => {
  openBulkPayConfirmation("all");
});


payExceptBtn.addEventListener("click", () => {
  openBulkPayConfirmation(
    "exceptNotTransferred"
  );
});

  undoBtn.addEventListener("click", () => {
    confirmUI("هل أنت متأكد من التراجع عن آخر عملية سداد لهذا الشهر؟", () => undoBulkPayCore());
  });
})();

// عرض عملاء اليوم (نسخة منقحة)
function showTodayCustomers() {
  const modal = document.getElementById('todayCustomersModal');
  const listContainer = document.getElementById('todayCustomersList');
  
  if (!modal) {
    console.error("modal not found");
    alert("حدث خطأ: لم يتم العثور على نافذة عرض العملاء");
    return;
  }
  if (!listContainer) {
    console.error("list container not found");
    alert("حدث خطأ: لم يتم العثور على حاوية القائمة");
    return;
  }
  
  const data = salesData || {};
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  
  const customers = [];
  
  function convertTo12HourFormat(time24) {
    if (!time24 || time24 === "وقت غير محدد") return "وقت غير محدد";
    
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours);
    const m = minutes;
    const period = h >= 12 ? 'م' : 'ص';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${period}`;
  }
  
Object.keys(data).forEach(monthKey => {
  (data[monthKey] || []).forEach(order => {
      const slots = Array.isArray(order.deliveries) && order.deliveries.length ? order.deliveries : [{ deliveryDate: order.deliveryDate, items: order.items || [] }];
      slots.forEach((slot, slotIndex) => {
        const deliveryDate = slot.deliveryDate;
        if (!deliveryDate) return;
        const orderDateStr = String(deliveryDate).split(' ')[0];
        const time24 = String(deliveryDate).split(' ')[1] || "وقت غير محدد";
        if (orderDateStr === todayStr) {
          customers.push({
            name: order.client || "بدون اسم",
            time: convertTo12HourFormat(time24),
            total: Array.isArray(order.deliveries) && order.deliveries.length > 1
              ? (slot.items || []).reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || item.quantity || 0), 0) + Number(slot.deliveryFee || 0)
              : (order.totalAfter || 0),
            payment: order.paymentMethod || "غير محدد",
            part: Array.isArray(order.deliveries) && order.deliveries.length > 1 ? ` (${slotIndex + 1}/${order.deliveries.length})` : ""
          });
        }
      });
    });
  });
  
  if (customers.length === 0) {
    listContainer.innerHTML = '<div style="text-align:center; padding:20px;">📭 لا يوجد طلبات اليوم</div>';
  } else {
    let html = '<ul style="list-style:none; padding:0; margin:0;">';
    customers.forEach((c, i) => {
      html += `
        <li style="
          border-bottom:1px solid #eee; padding:12px 0;
          display:flex; justify-content:space-between; align-items:center;
        ">
          <div>
            <strong style="font-size:1.1em;">${i+1}. ${c.name}${c.part || ""}</strong><br>
            <small>🕒 ${c.time} | 💰 ${c.total} ريال</small>
          </div>
          <span style="
            background:${c.payment === 'cash' ? '#27ae60' : (c.payment === 'transfer' ? '#3498db' : '#e67e22')};
            color:#fff; padding:4px 8px; border-radius:8px; font-size:0.8em;
          ">
            ${c.payment === 'cash' ? 'كاش' : (c.payment === 'transfer' ? 'تحويل' : 'غير محدد')}
          </span>
        </li>
      `;
    });
    html += '</ul>';
    html += `<div style="background:#f39c12; color:#fff; padding:8px; border-radius:10px; margin-top:15px; text-align:center; font-weight:bold;">
      📊 عدد العملاء اليوم: ${customers.length}
    </div>`;
    listContainer.innerHTML = html;
  }
  
  modal.style.display = 'flex';
  if (typeof playSound === 'function') playSound('clickSound');
}

function closeTodayCustomersModal() {
  const modal = document.getElementById('todayCustomersModal');
  if (modal) modal.style.display = 'none';
}


/* ---- Extracted inline script block 2 (original order preserved) ---- */
showDetails = function(month, index, event) {
  event?.preventDefault?.();
  const order = salesData?.[month]?.[index];
  if (!order) return showMessage?.("❌ لم يتم العثور على الطلب");
  NoshiInvoice.open(order, {
    onEdit: () => editInvoice(month, index, { preventDefault() {} })
  });
};


/* ---- Extracted inline script block 3 (original order preserved) ---- */
NoshiAuth.guard().catch(()=>{});
