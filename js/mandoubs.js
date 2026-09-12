/* =========================================================
   FILE: js/mandoubs.js
   SOURCE: inline script #1 from mandoubs.html
   REFACTOR RULE: extracted in the SAME parser position.
   No business logic, storage key, or execution order changed.
========================================================= */
// إعدادات حجم الخط
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 16;
let currentFontSize = DEFAULT_FONT_SIZE;

const STORAGE_KEYS = {
  salesData: "salesData",
  fontSize: "mandoubsTableFontSize",
  lastUpdateDay: "lastUpdateDay"
};

// البيانات
const mandoubs = ['ماهر', 'اياد', 'عماد', 'عبد الملك', 'عبدالرحمن'];
let salesData = {};
let currentEditIndex = null;
let currentDisplayMonth = new Date().getMonth() + 1;
let currentDisplayYear = new Date().getFullYear();
let selectedMandoubForPay = null;

function showStorageError(error) {
  console.error("خطأ التخزين:", error);
  alert("تعذر تحميل أو حفظ البيانات الآن. لم يتم حذف أي بيانات. تحقق من الاتصال ثم أعد المحاولة.");
}

async function ensureDBReady() {
  if (!window.NoshiDB) {
    throw new Error("ملف db.js غير مربوط أو لم يتم تحميله");
  }
}

async function loadStorageState() {
  await ensureDBReady();

  const live = NoshiDB.getMany
    ? await NoshiDB.getMany([STORAGE_KEYS.salesData, STORAGE_KEYS.fontSize], {
        [STORAGE_KEYS.salesData]: {}, [STORAGE_KEYS.fontSize]: DEFAULT_FONT_SIZE
      })
    : {
        [STORAGE_KEYS.salesData]: await NoshiDB.get(STORAGE_KEYS.salesData, {}),
        [STORAGE_KEYS.fontSize]: await NoshiDB.get(STORAGE_KEYS.fontSize, DEFAULT_FONT_SIZE)
      };
  const savedSalesData = live[STORAGE_KEYS.salesData];
  salesData = savedSalesData && typeof savedSalesData === "object" && !Array.isArray(savedSalesData) ? savedSalesData : {};
  currentFontSize = parseInt(live[STORAGE_KEYS.fontSize], 10) || DEFAULT_FONT_SIZE;
}

async function saveSalesData() {
  await ensureDBReady();
  await NoshiDB.set(STORAGE_KEYS.salesData, salesData);
}

// دالة لفتح نافذة ضبط الخط
function openFontSizeModal() {
  document.getElementById('fontSizeModal').style.display = 'flex';
  updateFontSizeDisplay();
}

// دالة لإغلاق نافذة ضبط الخط
function closeFontSizeModal() {
  document.getElementById('fontSizeModal').style.display = 'none';
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

async function decreaseFontSize() {
  if (currentFontSize > MIN_FONT_SIZE) {
    currentFontSize--;
    updateFontSizeDisplay();
    try { await saveFontSize(); }
    catch (error) { console.warn("تعذر حفظ تفضيل حجم الخط على هذا الجهاز:", error); }
  }
}

async function increaseFontSize() {
  if (currentFontSize < MAX_FONT_SIZE) {
    currentFontSize++;
    updateFontSizeDisplay();
    try { await saveFontSize(); }
    catch (error) { console.warn("تعذر حفظ تفضيل حجم الخط على هذا الجهاز:", error); }
  }
}

async function resetFontSize() {
  currentFontSize = DEFAULT_FONT_SIZE;
  updateFontSizeDisplay();
  try { await saveFontSize(); }
  catch (error) { console.warn("تعذر حفظ تفضيل حجم الخط على هذا الجهاز:", error); }
}

// دالة لحفظ حجم الخط كإعداد محلي للجهاز
async function saveFontSize() {
  await ensureDBReady();
  await NoshiDB.set(STORAGE_KEYS.fontSize, currentFontSize);
}

// دالة لتطبيق حجم الخط على الجداول
function applyFontSizeToTable() {
  // تطبيق على جدول الطلبات
  const tableCells = document.querySelectorAll('.orders-table td, .orders-table th');
  tableCells.forEach(cell => {
    cell.style.fontSize = currentFontSize + 'px';
  });
  
  // تطبيق على إحصائيات المناديب
  const statValues = document.querySelectorAll('.stat-value');
  statValues.forEach(value => {
    value.style.fontSize = (currentFontSize + 2) + 'px';
  });
  
  const statLabels = document.querySelectorAll('.stat-label');
  statLabels.forEach(label => {
    label.style.fontSize = (currentFontSize - 2) + 'px';
  });
  
  // تطبيق على أزرار الإجراءات
  const actionButtons = document.querySelectorAll('.action-btn');
  actionButtons.forEach(btn => {
    btn.style.fontSize = (currentFontSize - 2) + 'px';
  });
  
  // تطبيق على أسماء المناديب
  const mandoubNames = document.querySelectorAll('.mandoub-name');
  mandoubNames.forEach(name => {
    name.style.fontSize = (currentFontSize + 4) + 'px';
  });
}

// تحميل البيانات وعرضها
function loadData() {
  updateMandoubsStats();
  updateOrdersTable();
  updateMonthDisplay();
  
  // تطبيق حجم الخط بعد تحميل البيانات
  setTimeout(() => {
    applyFontSizeToTable();
  }, 50);
}

function getOrderMonthRef(order, sourceMonth) {
  // صفحة المناديب محاسبيًا وتشغيليًا تتبع شهر التسليم الفعلي/المجدول.
  // تاريخ إنشاء الطلب لا يتغير، لكنه ليس مرجع شهر المندوب.
  const raw = String(order?.deliveryDate || order?.date || "").trim().split(/[ T]/)[0];
  const m = raw.match(/^(\d{4})[-\/](\d{1,2})/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2,"0")}`;
  return /^\d{4}-\d{2}$/.test(String(sourceMonth || "")) ? String(sourceMonth) : "";
}
function deliveryView(parent, slot, deliveryIndex) {
  if (!slot) return parent;
  const items = Array.isArray(slot.items) ? slot.items.map(i => ({...i})) : [];
  const fee = Math.max(0, Number(slot.deliveryFee || 0));
  if (fee > 0) items.push({ name:"مندوب", originalName:"مندوب", qty:1, price:fee });
  return {
    ...parent,
    items,
    deliveryDate: slot.deliveryDate || parent.deliveryDate,
    deliveryPerson: slot.mandoub || slot.deliveryPerson || null,
    mandoub: slot.mandoub || slot.deliveryPerson || null,
    deliveryPaid: !!slot.deliveryPaid,
    delivered: !!slot.delivered,
    _deliveryIndex: deliveryIndex
  };
}
function getOrdersForDisplayedDeliveryMonth() {
  const wanted = `${currentDisplayYear}-${String(currentDisplayMonth).padStart(2,"0")}`;
  const rows = [];
  Object.entries(salesData).forEach(([sourceMonth, orders]) => {
    (Array.isArray(orders) ? orders : []).forEach((parentOrder, sourceIndex) => {
      const slots = Array.isArray(parentOrder.deliveries) && parentOrder.deliveries.length ? parentOrder.deliveries : null;
      if (slots) {
        slots.forEach((slot, deliveryIndex) => {
          const order = deliveryView(parentOrder, slot, deliveryIndex);
          if (getOrderMonthRef(order, sourceMonth) === wanted) rows.push({ order, parentOrder, sourceMonth, sourceIndex, deliveryIndex });
        });
      } else if (getOrderMonthRef(parentOrder, sourceMonth) === wanted) {
        rows.push({ order: parentOrder, parentOrder, sourceMonth, sourceIndex, deliveryIndex: -1 });
      }
    });
  });
  return rows;
}

// تحديث إحصائيات المناديب للشهر المعروض حسب تاريخ التسليم
function updateMandoubsStats() {
  const container = document.getElementById('mandoubsContainer');
  container.innerHTML = '';
  
  const stats = {};
  mandoubs.forEach(name => {

    stats[name] = { 
      total: 0,          // إجمالي هذا الشهر
      paid: 0,           // المدفوع هذا الشهر
      count: 0,          // عدد الطلبات هذا الشهر
      totalAllTime: 0,   // إجمالي منذ البداية
      countAllTime: 0    // عدد الطلبات منذ البداية
    };
  });

  const monthRows = getOrdersForDisplayedDeliveryMonth();

  // إحصائيات الشهر المعروض حسب تاريخ التسليم
  monthRows.forEach(({ order }) => {
    const deliveryItem = order.items.find(i => i.name === "مندوب");
    if (deliveryItem && order.deliveryPerson && stats[order.deliveryPerson]) {
      const amount = deliveryItem.price * deliveryItem.qty;
      stats[order.deliveryPerson].total += amount;
      stats[order.deliveryPerson].count++;
      if (order.deliveryPaid) {
        stats[order.deliveryPerson].paid += amount;
      }
    }
  });

  // إحصائيات منذ البداية لجميع الشهور
  Object.keys(salesData).forEach(key => {
    const allOrders = salesData[key] || [];
    allOrders.forEach(order => {
      const deliveryItem = order.items.find(i => i.name === "مندوب");
      if (deliveryItem && order.deliveryPerson && stats[order.deliveryPerson]) {
        const amount = deliveryItem.price * deliveryItem.qty;
        stats[order.deliveryPerson].totalAllTime += amount;
        stats[order.deliveryPerson].countAllTime++;
      }
    });
  });
  
  // عرض البطاقات
  mandoubs.forEach(name => {
  const remaining = stats[name].total - stats[name].paid;
    const mandoubDiv = document.createElement('div');
    mandoubDiv.className = 'mandoub-card';
    mandoubDiv.innerHTML = `
<div class="mandoub-header">
  <div class="mandoub-name">🚚 ${name}</div>

  <button class="action-btn bulk-pay-btn"
    onclick="payAllMandoubOrders('${name}')"
    ${remaining <= 0 ? 'disabled' : ''}>
    💵 سداد الكل (${remaining.toFixed(2)} ر.س)
  </button>
</div>
      <div class="mandoub-stats">
        <!-- صف يحتوي عدد الطلبات هذا الشهر وعدد الطلبات منذ البداية -->
        <div style="display:flex; gap:10px; flex-wrap: wrap;">
          <div class="stat-box" style="flex:1;">
            <div class="stat-label">عدد الطلبات هذا الشهر</div>
            <div class="stat-value">${stats[name].count}</div>
          </div>
          <div class="stat-box" style="flex:1;">
            <div class="stat-label">عدد الطلبات منذ البداية</div>
            <div class="stat-value">${stats[name].countAllTime}</div>
          </div>
        </div>
        <div class="stat-box">
          <div class="stat-label">إجمالي المستحقات</div>
          <div class="stat-value">${stats[name].total.toFixed(2)} ر.س</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">المدفوع</div>
          <div class="stat-value">${stats[name].paid.toFixed(2)} ر.س</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">المتبقي</div>
          <div class="stat-value">${(stats[name].total - stats[name].paid).toFixed(2)} ر.س</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">الإجمالي منذ البداية</div>
          <div class="stat-value">${stats[name].totalAllTime.toFixed(2)} ر.س</div>
        </div>
      </div>
    `;
    container.appendChild(mandoubDiv);
  });
}


// تحديث جدول الطلبات للشهر الحالي
function updateOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = '';

  const monthRows = getOrdersForDisplayedDeliveryMonth();
  const filteredRows = monthRows.filter(({ order }) =>
    order.items?.find(i => i.name === "مندوب") || order.deliveryPerson
  );

  // إضافة رسالة عندما لا يوجد طلبات
  if (filteredRows.length === 0) {
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const monthName = monthNames[currentDisplayMonth - 1];
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="6" style="padding: 20px; text-align: center; font-size: 1.1em; color: #666;">
        عذرًا، لا يوجد طلبات توصيل في ${monthName} ${currentDisplayYear}
      </td>
    `;
    tbody.appendChild(tr);
    return;
  }

  // عرض الطلبات إذا كانت موجودة
  filteredRows.slice().reverse().forEach(({ order, sourceMonth, sourceIndex, deliveryIndex }, reversedIndex) => {
    const deliveryItem = order.items.find(i => i.name === "مندوب");
    const amount = deliveryItem ? (deliveryItem.price * deliveryItem.qty) : 0;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${filteredRows.length - reversedIndex}</td>
      <td>${order.client || "—"}</td>
      <td>${amount.toFixed(2)} ر.س</td>
      <td>
        <button class="action-btn mandoub-btn" 
          onclick="openMandoubModal('${sourceMonth}', ${sourceIndex}, ${deliveryIndex})">
          ${order.deliveryPerson || "لم يتم تحديد المندوب"}
        </button>
      </td>
      <td>
        ${order.deliveryPerson ? `
          <button class="action-btn ${order.deliveryPaid ? 'paid-btn' : 'unpaid-btn'}"
            onclick="togglePayment('${sourceMonth}', ${sourceIndex}, ${deliveryIndex})">
            ${order.deliveryPaid ? '✅ تم الدفع' : '❌ لم أدفع'}
          </button>
        ` : `
          <button class="action-btn waiting-btn" type="button" disabled aria-disabled="true">
            ⏳ انتظار
          </button>
        `}
      </td>
      <td>
        <button class="action-btn details-btn" 
          onclick="showOrderDetails('${sourceMonth}', ${sourceIndex})">
          📋 التفاصيل
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// تحديث عرض الشهر الحالي
function updateMonthDisplay() {
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                     "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  document.getElementById('currentMonth').textContent = 
    `${monthNames[currentDisplayMonth - 1]} ${currentDisplayYear}`;
}

// تغيير الشهر المعروض
function changeMonth(offset) {
  currentDisplayMonth += offset;
  
  if (currentDisplayMonth > 12) {
    currentDisplayMonth = 1;
    currentDisplayYear++;
  } else if (currentDisplayMonth < 1) {
    currentDisplayMonth = 12;
    currentDisplayYear--;
  }
  
  updateMonthDisplay();
  loadData();
}

// التحقق من التحديث التلقائي للشهر
async function checkAndUpdateMonth() {
  const now = new Date();
  const currentDay = now.getDate();

  if (currentDay === 1) {
    const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    const lastDayText = lastDayOfPrevMonth.toString();

    const savedLastUpdateDay = await NoshiDB.get(STORAGE_KEYS.lastUpdateDay, "");
    const shouldUpdate = savedLastUpdateDay !== lastDayText;

    if (shouldUpdate) {
      currentDisplayMonth = now.getMonth() + 1;
      currentDisplayYear = now.getFullYear();
      await NoshiDB.set(STORAGE_KEYS.lastUpdateDay, lastDayText);
    }
  }
}

// فتح مودال اختيار المندوب
function openMandoubModal(month, index, deliveryIndex = -1) {
  currentEditIndex = { month, index, deliveryIndex };
  document.getElementById('mandoubModal').style.display = 'flex';
}

// إغلاق المودال
function closeModal() {
  document.getElementById('mandoubModal').style.display = 'none';
}

// اختيار المندوب
async function selectMandoub(name) {
  if (currentEditIndex) {
    const { month, index, deliveryIndex = -1 } = currentEditIndex;

    if (!salesData[month] || !salesData[month][index]) {
      alert("❌ لم يتم العثور على الطلب المطلوب");
      return;
    }
    const parent = salesData[month][index];
    const slot = deliveryIndex >= 0 && Array.isArray(parent.deliveries) ? parent.deliveries[deliveryIndex] : null;
    const previousMandoub = slot ? (slot.mandoub || slot.deliveryPerson || null) : (parent.deliveryPerson || null);
    const nextMandoub = name === null ? null : name;
    if (slot) {
      slot.mandoub = nextMandoub;
      slot.deliveryPerson = nextMandoub;
      if (!nextMandoub || previousMandoub !== nextMandoub) slot.deliveryPaid = false;
      if (deliveryIndex === 0) { parent.mandoub = nextMandoub; parent.deliveryPerson = nextMandoub; parent.deliveryPaid = !!slot.deliveryPaid; }
    } else {
      parent.deliveryPerson = nextMandoub;
      parent.mandoub = nextMandoub;
      if (!nextMandoub || previousMandoub !== nextMandoub) parent.deliveryPaid = false;
    }

    try {
      await saveSalesData();
    } catch (error) {
      showStorageError(error);
      return;
    }
    closeModal();
    loadData();
  }
}

// تغيير حالة الدفع
async function togglePayment(month, index, deliveryIndex = -1) {
  if (!salesData[month] || !salesData[month][index]) {
    alert("❌ لم يتم العثور على الطلب المطلوب");
    return;
  }
  const parent = salesData[month][index];
  const slot = deliveryIndex >= 0 && Array.isArray(parent.deliveries) ? parent.deliveries[deliveryIndex] : null;
  const deliveryPerson = slot ? (slot.mandoub || slot.deliveryPerson) : parent.deliveryPerson;
  if (!deliveryPerson) {
    await NoshiUI.alert("يجب تحديد مندوب رسمي أولًا. حالة الطلب الآن: انتظار ⏳", { title: "حالة المندوب" });
    return;
  }
  if (slot) {
    slot.deliveryPaid = !slot.deliveryPaid;
    if (deliveryIndex === 0) parent.deliveryPaid = !!slot.deliveryPaid;
  } else {
    parent.deliveryPaid = !parent.deliveryPaid;
  }

  try {
    await saveSalesData();
  } catch (error) {
    showStorageError(error);
    return;
  }
  loadData();
}

function payAllMandoubOrders(name) {
  const monthRows = getOrdersForDisplayedDeliveryMonth();

  let count = 0;
  let total = 0;

  monthRows.forEach(({order}) => {
    if (
      order.deliveryPerson === name &&
      order.deliveryPaid !== true
    ) {
      const deliveryItem = order.items?.find(
        item => item.name === "مندوب"
      );

      if (deliveryItem) {
        total +=
          Number(deliveryItem.price || 0) *
          Number(deliveryItem.qty || 0);
      }

      count++;
    }
  });

  const modal =
    document.getElementById("payMandoubModal");

  const info =
    document.getElementById("payMandoubInfo");

  const confirmBtn =
    document.getElementById("confirmPayMandoub");

  const cancelBtn =
    document.getElementById("cancelPayMandoub");

  if (!modal || !info || !confirmBtn || !cancelBtn) {
    alert("❌ لم يتم العثور على نافذة السداد");
    return;
  }

  /* تصغير المودال الخارجي */
  const modalContent =
    modal.querySelector(".modal-content");

  if (modalContent) {
    modalContent.style.width = "88%";
    modalContent.style.maxWidth = "335px";
    modalContent.style.padding = "14px";
    modalContent.style.borderRadius = "16px";
    modalContent.style.maxHeight =
      "calc(100dvh - 30px)";
    modalContent.style.overflowY = "auto";
  }

  /* لا توجد طلبات */
  if (count === 0) {
    info.innerHTML = `
      <div style="
        text-align:center;
        padding:8px 5px;
      ">
        <div style="
          font-size:38px;
          line-height:1.2;
          margin-bottom:5px;
        ">
          📭
        </div>

        <div style="
          font-size:16px;
          font-weight:800;
          color:#2c3e50;
        ">
          لا توجد طلبات غير مسددة
        </div>
      </div>
    `;

    info.style.marginBottom = "10px";

    confirmBtn.style.display = "none";
    cancelBtn.innerText = "إغلاق";

    modal.style.display = "flex";

    cancelBtn.onclick = () => {
      modal.style.display = "none";
    };

    return;
  }

  /* توجد طلبات */
  info.innerHTML = `
    <div style="
      background:linear-gradient(
        180deg,
        #ffffff 0%,
        #fcf8f4 100%
      );
      border-radius:14px;
      padding:12px 10px;
      font-family:'Cairo',sans-serif;
      max-width:305px;
      margin:0 auto;
      border:1px solid #f0e8e0;
    ">

      <!-- بيانات المندوب -->
      <div style="
        text-align:center;
        margin-bottom:10px;
        padding-bottom:9px;
        border-bottom:1px solid #f0e8e0;
      ">
        <div style="
          width:40px;
          height:40px;
          border-radius:50%;
          background:linear-gradient(
            135deg,
            #fef0e4,
            #fce3d0
          );
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:20px;
          margin:0 auto 4px;
        ">
          🚚
        </div>

        <div style="
          font-size:10px;
          color:#b09a88;
          font-weight:600;
        ">
          المندوب
        </div>

        <div style="
          font-weight:800;
          font-size:18px;
          color:#2c3e50;
          line-height:1.3;
        ">
          ${name}
        </div>
      </div>

      <!-- الطلبات والمبلغ -->
      <div style="
        display:flex;
        gap:7px;
      ">

        <div style="
          flex:1;
          background:linear-gradient(
            135deg,
            #e8f0fe,
            #d4e2f7
          );
          border-radius:11px;
          padding:8px 6px;
          text-align:center;
          border:1px solid #c5d8ef;
        ">
          <div style="
            font-size:10px;
            color:#4a6a8b;
            font-weight:600;
          ">
            📦 الطلبات
          </div>

          <div style="
            font-size:21px;
            font-weight:800;
            color:#2c5f8a;
            line-height:1.4;
          ">
            ${count}
          </div>
        </div>

        <div style="
          flex:1.3;
          background:linear-gradient(
            135deg,
            #fef2e8,
            #fde8d8
          );
          border-radius:11px;
          padding:8px 6px;
          text-align:center;
          border:1px solid #f5dcc8;
        ">
          <div style="
            font-size:10px;
            color:#b09a88;
            font-weight:600;
          ">
            💰 المبلغ
          </div>

          <div style="
            font-size:21px;
            font-weight:800;
            color:#d35400;
            line-height:1.4;
            white-space:nowrap;
          ">
            ${total.toFixed(2)}

            <span style="
              font-size:11px;
              color:#b09a88;
              font-weight:700;
            ">
              ر.س
            </span>
          </div>
        </div>

      </div>
    </div>
  `;

  info.style.marginBottom = "10px";

  confirmBtn.style.display = "block";
  confirmBtn.innerText = "تأكيد السداد";

  cancelBtn.innerText = "إلغاء";

  /* تصغير الأزرار */
  confirmBtn.style.padding = "9px";
  confirmBtn.style.fontSize = "14px";
  confirmBtn.style.borderRadius = "10px";

  cancelBtn.style.padding = "9px";
  cancelBtn.style.fontSize = "14px";
  cancelBtn.style.borderRadius = "10px";

  modal.style.display = "flex";

  cancelBtn.onclick = () => {
    modal.style.display = "none";
  };

  confirmBtn.onclick = async () => {
    monthRows.forEach(({order, parentOrder, deliveryIndex}) => {
      if (order.deliveryPerson !== name || order.deliveryPaid === true) return;
      if (deliveryIndex >= 0 && Array.isArray(parentOrder.deliveries)) {
        const slot = parentOrder.deliveries[deliveryIndex];
        if (slot) {
          slot.deliveryPaid = true;
          if (deliveryIndex === 0) parentOrder.deliveryPaid = true;
        }
      } else {
        parentOrder.deliveryPaid = true;
      }
    });

    try {
      await saveSalesData();
    } catch (error) {
      showStorageError(error);
      return;
    }

    modal.style.display = "none";

    const msg = document.createElement("div");

    msg.innerHTML = "✅ تم السداد بنجاح";

    msg.style.cssText = `
      position:fixed;
      top:20px;
      left:50%;
      transform:translateX(-50%);
      background:#27ae60;
      color:white;
      padding:11px 20px;
      border-radius:10px;
      font-size:16px;
      font-weight:bold;
      z-index:2147483647;
      box-shadow:0 4px 12px rgba(0,0,0,.2);
      white-space:nowrap;
    `;

    document.body.appendChild(msg);

    setTimeout(() => {
      msg.remove();
    }, 2000);

    loadData();
  };
}

function getPaymentMethodDisplay(order) {
  const methods = {
    cash: "كاش",
    transfer: "تحويل",
    "not-set": "غير محدد"
  };

  return methods[order.paymentMethod] || "غير محدد";
}

function showOrderDetails(month, index) {
  const order = salesData[month][index];

  // حساب الإجمالي قبل الخصم وبعده
  let totalBeforeDiscount = 0;
  let totalAfterDiscount = 0;
  let hasDiscount = false;

  const generalDiscount = parseFloat(order.generalDiscount) || 0;

  // بناء قائمة المنتجات
  let productsHtml = order.items.map((item, i) => {
    const qty = parseFloat(item.qty) || 0;
    const price = parseFloat(item.price) || 0;
    const itemTotal = qty * price;

    totalBeforeDiscount += itemTotal;

    // اسم المنتج الأصلي لاستخدامه في استثناءات الخصم العام
    const originalName = item.originalName || item.name || "";

    // الخصم الفردي
    const itemDiscount = parseFloat(item.discount) || 0;

    // الخصم العام لا يطبق على مندوب وصحن تقديم
    const canApplyGeneralDiscount =
      originalName !== "مندوب" &&
      originalName !== "صحن تقديم";

    let finalPrice = itemTotal;

    // تطبيق الخصم الفردي
    if (itemDiscount > 0) {
      finalPrice *= (1 - itemDiscount / 100);
    }

    // تطبيق الخصم العام على المنتجات المسموح بها فقط
    if (generalDiscount > 0 && canApplyGeneralDiscount) {
      finalPrice *= (1 - generalDiscount / 100);
    }

    // هل تم تطبيق خصم فعلي على هذا المنتج؟
    const itemHasDiscount = finalPrice < itemTotal - 0.01;

    totalAfterDiscount += finalPrice;

    if (itemHasDiscount) {
      hasDiscount = true;
    }

    // حساب نسبة الخصم الفعلية
    const appliedDiscountPercent =
      itemHasDiscount && itemTotal > 0
        ? ((1 - finalPrice / itemTotal) * 100).toFixed(0)
        : 0;

    let discountText = "";

    if (itemHasDiscount) {
      discountText = `
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #fef5f0;
          padding: 2px 8px;
          border-radius: 6px;
          margin-top: 2px;
          border-right: 3px solid #f39c12;
        ">
          <span style="
            font-size: 0.7rem;
            color: #e67e22;
            font-weight: 700;
          ">
            🏷️ خصم ${appliedDiscountPercent}%
          </span>

          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
          ">
            <span style="
              font-size: 0.9rem;
              color: #27ae60;
              font-weight: 800;
            ">
              ${finalPrice.toFixed(1)}
            </span>

            <span style="
              font-size: 0.7rem;
              color: #888;
            ">
              ر.س
            </span>
          </div>
        </div>
      `;
    }

    return `
      <div style="
        padding: 3px 0;
        font-size: 0.82rem;
        border-bottom: ${
          i < order.items.length - 1
            ? "1px solid #f0ece8"
            : "none"
        };
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span style="font-weight: 600;">
            ${item.name}
          </span>

          <span style="
            color: #555;
            font-weight: 600;
          ">
            ${qty}×

            <span style="
              ${
                itemHasDiscount
                  ? "text-decoration: line-through; color: #e74c3c;"
                  : ""
              }
            ">
              ${price.toFixed(1)}
            </span>

            ${
              !itemHasDiscount
                ? `= ${itemTotal.toFixed(1)} ر.س`
                : ""
            }
          </span>
        </div>

        ${discountText}
      </div>
    `;
  }).join("");

  // قيم الإجماليات المحفوظة
  const savedFinalTotal = parseFloat(order.totalAfter);
  const savedBeforeTotal = parseFloat(order.totalBefore);

  const finalTotal = Number.isFinite(savedFinalTotal)
    ? savedFinalTotal
    : totalAfterDiscount;

  const beforeTotal = Number.isFinite(savedBeforeTotal)
    ? savedBeforeTotal
    : totalBeforeDiscount;

  const hasAnyDiscount =
    hasDiscount ||
    Math.abs(beforeTotal - finalTotal) > 0.01;

  document.getElementById("orderDetailsContent").innerHTML = `
    <div style="
      background: linear-gradient(145deg, #ffffff, #fcf9f6);
      border-radius: 18px;
      padding: 12px 14px 14px 14px;
      font-family: 'Cairo', sans-serif;
      color: #2c3e50;
      box-shadow: 0 8px 30px rgba(0,0,0,0.18);
      max-width: 380px;
      margin: 0 auto;
      border: 1px solid rgba(230, 126, 34, 0.15);
    ">

      <!-- رأس المودال -->
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        border-bottom: 2px solid #f5ede6;
        padding-bottom: 6px;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
        ">
          <span style="font-size: 1rem;">📋</span>

          <span style="
            font-weight: 900;
            font-size: 0.9rem;
            color: #d35400;
          ">
            تفاصيل الطلب
          </span>
        </div>

        <button
          onclick="closeDetailsModal()"
          style="
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 50%;
            width: 26px;
            height: 26px;
            font-size: 0.9rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
          "
        >
          ✕
        </button>
      </div>

      <!-- معلومات العميل والمندوب -->
      <div style="
        display: flex;
        gap: 6px;
        margin-bottom: 8px;
      ">
        <div style="
          flex: 1;
          background: linear-gradient(135deg, #f8f4f0, #f0ebe6);
          border-radius: 8px;
          padding: 4px 6px;
          text-align: center;
          border: 1px solid #e8e0d8;
        ">
          <div style="
            font-size: 0.6rem;
            color: #888;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
          ">
            <span>👤</span>
            العميل
          </div>

          <div style="
            font-weight: 800;
            font-size: 0.85rem;
            line-height: 1.3;
            color: #2c3e50;
          ">
            ${order.client || "—"}
          </div>
        </div>

        <div style="
          flex: 1;
          background: linear-gradient(135deg, #f8f4f0, #f0ebe6);
          border-radius: 8px;
          padding: 4px 6px;
          text-align: center;
          border: 1px solid #e8e0d8;
        ">
          <div style="
            font-size: 0.6rem;
            color: #888;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 3px;
          ">
            <span>🚚</span>
            المندوب
          </div>

          <div style="
            font-weight: 800;
            font-size: 0.85rem;
            line-height: 1.3;
            color: #2c3e50;
          ">
            ${order.deliveryPerson || "—"}
          </div>
        </div>
      </div>

      <!-- قائمة المنتجات -->
      <div style="
        background: #fcf9f6;
        border-radius: 8px;
        padding: 4px 8px;
        margin-bottom: 8px;
        border: 1px solid #f0e8e0;
      ">
        <div style="
          font-size: 0.65rem;
          color: #999;
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span>🧁</span>
          المنتجات
        </div>

        ${
          productsHtml ||
          `
            <div style="
              text-align: center;
              color: #aaa;
              font-size: 0.7rem;
              padding: 4px 0;
            ">
              لا توجد منتجات
            </div>
          `
        }
      </div>

      <!-- الإجماليات -->
      <div style="
        display: flex;
        gap: 6px;
      ">
        ${
          hasAnyDiscount
            ? `
              <div style="
                flex: 1;
                background: #fef9f0;
                border: 2px solid #f39c12;
                border-radius: 8px;
                padding: 4px 6px;
                text-align: center;
              ">
                <div style="
                  font-size: 0.55rem;
                  color: #888;
                  font-weight: 600;
                ">
                  السعر السابق
                </div>

                <div style="
                  font-size: 0.8rem;
                  text-decoration: line-through;
                  color: #e74c3c;
                  font-weight: 700;
                ">
                  ${beforeTotal.toFixed(1)} ر.س
                </div>
              </div>
            `
            : ""
        }

        <div style="
          ${hasAnyDiscount ? "flex: 1;" : "width: 100%;"}
          background: linear-gradient(135deg, #27ae60, #219653);
          border-radius: 8px;
          padding: 4px 6px;
          text-align: center;
          box-shadow: 0 3px 10px rgba(39, 174, 96, 0.25);
        ">
          <div style="
            font-size: 0.55rem;
            color: rgba(255,255,255,0.85);
            font-weight: 600;
          ">
            الإجمالي
          </div>

          <div style="
            font-size: 0.9rem;
            color: white;
            font-weight: 900;
          ">
            ${finalTotal.toFixed(1)} ر.س
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("orderDetailsModal").style.display = "flex";
}
// دالة لإغلاق تفاصيل الطلب
function closeDetailsModal() {
  document.getElementById("orderDetailsModal").style.display = "none";
}

// نافذة التفاصيل تغلق عند النقر خارجها
window.addEventListener('click', (event) => {
  if (event.target === document.getElementById('orderDetailsModal')) {
    closeDetailsModal();
  }
  if (event.target === document.getElementById('mandoubModal')) {
    closeModal();
  }
  if (event.target === document.getElementById('fontSizeModal')) {
    closeFontSizeModal();
  }
});

// إضافة مستمعي الأحداث للأزرار
document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));

// تحميل البيانات عند بدء التشغيل
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadStorageState();

    const now = new Date();
    currentDisplayMonth = now.getMonth() + 1;
    currentDisplayYear = now.getFullYear();

    await checkAndUpdateMonth();

    loadData();

    // تطبيق حجم الخط عند التحميل
    setTimeout(() => {
      applyFontSizeToTable();
    }, 100);
  } catch (error) {
    showStorageError(error);
  }
});
