/* =========================================================
   FILE: js/client.js
   SOURCE: inline script #1 from client.html
   REFACTOR RULE: extracted in the SAME parser position.
   No business logic, storage key, or execution order changed.
========================================================= */
// ========== دالة تنظيف رقم الجوال (إزالة كل ما ليس رقم أو + أو مسافة) ==========
function normalizeSaudiPhone(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return { valid: true, normalized: "", formatted: "" };
  if (digits.startsWith("00966")) digits = digits.slice(5);
  else if (digits.startsWith("966")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  if (!/^5\d{8}$/.test(digits)) return { valid: false, normalized: "", formatted: "" };
  return {
    valid: true,
    normalized: "+966" + digits,
    formatted: `+966 ${digits.slice(0,2)} ${digits.slice(2,5)} ${digits.slice(5)}`
  };
}
function cleanPhoneNumber(phone) {
  const result = normalizeSaudiPhone(phone);
  return result.valid ? result.formatted : String(phone || "").replace(/[^0-9+ ]/g, "");
}
function normalizePhoneForMatch(phone) {
  const result = normalizeSaudiPhone(phone);
  return result.valid ? result.normalized : "";
}
function formatPhoneOrReject(phone) {
  const result = normalizeSaudiPhone(phone);
  if (!result.valid) return null;
  return result.formatted;
}

function phoneExists(phone, exceptClientId = null) {
  const normalized = normalizePhoneForMatch(phone);
  if (!normalized) return false;
  return clients.some(c =>
    String(c.id) !== String(exceptClientId) &&
    normalizePhoneForMatch(c.phone) === normalized
  );
}

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 16;

let currentFontSize = DEFAULT_FONT_SIZE;
let clients = [];
let salesData = {};

function showStorageError(error) {
  console.error("خطأ IndexedDB:", error);
  alert("❌ حدث خطأ أثناء القراءة أو الحفظ في IndexedDB.\nتأكد أن ملف db.js موجود في نفس المجلد وأنك استوردت النسخة بنجاح.");
}

async function ensureDBReady() {
  if (!window.NoshiDB) {
    throw new Error("ملف db.js غير مربوط أو لم يتم تحميله");
  }
}

async function initStorageData() {
  await ensureDBReady();

  const live = NoshiDB.getMany
    ? await NoshiDB.getMany(["clients", "salesData", "clientsTableFontSize"], {
        clients: [], salesData: {}, clientsTableFontSize: DEFAULT_FONT_SIZE
      })
    : {
        clients: await NoshiDB.get("clients", []),
        salesData: await NoshiDB.get("salesData", {}),
        clientsTableFontSize: await NoshiDB.get("clientsTableFontSize", DEFAULT_FONT_SIZE)
      };

  clients = Array.isArray(live.clients) ? live.clients : [];
  salesData = live.salesData && typeof live.salesData === "object" && !Array.isArray(live.salesData) ? live.salesData : {};
  currentFontSize = parseInt(live.clientsTableFontSize, 10) || DEFAULT_FONT_SIZE;
}

async function saveClients() {
  await ensureDBReady();
  await NoshiDB.set("clients", clients);
}

async function saveSalesData() {
  await ensureDBReady();
  await NoshiDB.set("salesData", salesData);
}

async function saveClientsAndSalesData() {
  await ensureDBReady();
  await NoshiDB.setMany({
    clients: clients,
    salesData: salesData
  });
}

const form = document.getElementById('addClientForm');
const nameInput = document.getElementById('clientName');
const phoneInput = document.getElementById('clientPhone');
const dateInput = document.getElementById('clientDate');
const errorDiv = document.getElementById('clientNameError');
const table = document.getElementById('clientsTable');
const searchInput = document.getElementById('searchInput');

const ordersModal = document.getElementById('ordersModal');
const ordersClientName = document.getElementById('ordersClientName');
const ordersCount = document.getElementById('ordersCount');
const ordersTotal = document.getElementById('ordersTotal');
const ordersNet = document.getElementById('ordersNet');
const ordersDelivery = document.getElementById('ordersDelivery');
const lastOrderDate = document.getElementById('lastOrderDate');
const ordersList = document.getElementById('ordersList');

const editModal = document.getElementById('editClientModal');
const editNameInput = document.getElementById('editClientName');
const editPhoneInput = document.getElementById('editClientPhone');
const editDateInput = document.getElementById('editClientDate');

const addSound = document.getElementById('addSound');
const removeSound = document.getElementById('removeSound');

let currentEditIndex = null;

[phoneInput, editPhoneInput].forEach(input => {
  input?.addEventListener('blur', () => {
    if (!input.value.trim()) return;
    const formatted = formatPhoneOrReject(input.value);
    if (formatted !== null) input.value = formatted;
  });
});

// ========== ضبط حجم الخط ==========
function openFontSizeModal() {
  document.getElementById('fontSizeModal').style.display = 'flex';
  updateFontSizeDisplay();
}

function closeFontSizeModal() {
  document.getElementById('fontSizeModal').style.display = 'none';
}

function updateFontSizeDisplay() {
  document.getElementById('currentFontSizeDisplay').textContent = currentFontSize;
  const preview = document.getElementById('fontPreview');
  preview.style.fontSize = currentFontSize + 'px';
  applyFontSizeToTable();
}

async function decreaseFontSize() {
  if (currentFontSize > MIN_FONT_SIZE) {
    currentFontSize--;
    try {
      await saveFontSize();
      updateFontSizeDisplay();
    } catch (error) {
      showStorageError(error);
    }
  }
}

async function increaseFontSize() {
  if (currentFontSize < MAX_FONT_SIZE) {
    currentFontSize++;
    try {
      await saveFontSize();
      updateFontSizeDisplay();
    } catch (error) {
      showStorageError(error);
    }
  }
}

async function resetFontSize() {
  currentFontSize = DEFAULT_FONT_SIZE;
  try {
    await saveFontSize();
    updateFontSizeDisplay();
  } catch (error) {
    showStorageError(error);
  }
}
async function saveFontSize() {
  await ensureDBReady();
  await NoshiDB.set("clientsTableFontSize", currentFontSize.toString());
}

function applyFontSizeToTable() {
  const tableCells = document.querySelectorAll('table td, table th');
  tableCells.forEach(cell => {
    cell.style.fontSize = currentFontSize + 'px';
  });
  
  const actionButtons = document.querySelectorAll('.action-btn');
  actionButtons.forEach(btn => {
    btn.style.fontSize = (currentFontSize - 2) + 'px';
  });
}

// ========== أزرار اللصق ==========
// زر لصق الاسم في الإضافة
document.getElementById('pasteButton').addEventListener('click', function() {
  navigator.clipboard.readText().then(function(text) {
    document.getElementById('clientName').value = text;
  }).catch(function(err) {
    console.error('فشل في لصق النص: ', err);
  });
});

// زر لصق رقم الجوال في الإضافة (مع التنظيف)
document.getElementById('pastePhoneBtn').addEventListener('click', function() {
  navigator.clipboard.readText().then(function(text) {
    const formatted = formatPhoneOrReject(text);
    document.getElementById('clientPhone').value = formatted === null ? '' : formatted;
  }).catch(function(err) {
    console.error('فشل في اللصق:', err);
  });
});

// أزرار التعديل
document.getElementById('clearNameButton').addEventListener('click', function() {
  document.getElementById('editClientName').value = '';
});

document.getElementById('pasteNameButton').addEventListener('click', function() {
  navigator.clipboard.readText().then(function(text) {
    document.getElementById('editClientName').value = text;
  }).catch(function(err) {
    console.error('فشل في لصق النص: ', err);
  });
});

// زر لصق رقم الجوال في نافذة التعديل (مع التنظيف)
document.getElementById('pasteEditPhoneBtn').addEventListener('click', function() {
  navigator.clipboard.readText().then(function(text) {
    const formatted = formatPhoneOrReject(text);
    document.getElementById('editClientPhone').value = formatted === null ? '' : formatted;
  }).catch(function(err) {
    console.error('فشل في اللصق:', err);
  });
});

// ========== دوال العملاء ==========
function getClientOrders(clientId) {
  let orders = [];
  Object.values(salesData).forEach(monthOrders => {
    monthOrders.forEach(order => {
      if (order.clientId === clientId) {
        orders.push(order);
      }
    });
  });
  return orders.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderClients(filter = "") {
  table.innerHTML = "";
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(filter.toLowerCase())
  );

  filteredClients.forEach((client, index) => {
    const clientOrders = getClientOrders(client.id);
    const tr = document.createElement("tr");
    
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(client.name)}</td>
<td>
  <button onclick="openPhoneModalById('${client.id}')" 
          style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; border: none; border-radius: 20px; padding: 4px 12px; font-size: 0.65rem; cursor: pointer; -webkit-tap-highlight-color: transparent; font-weight: 600; box-shadow: 0 2px 8px rgba(52,152,219,0.3); transition: all 0.15s;">
    📱 عرض
  </button>
</td>
      <td>${client.date || "—"}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit-btn" onclick="openEditModalById('${client.id}')">✏️ تعديل</button>
          <button class="action-btn view-btn" onclick="window.location.href='client-history.html?id=${client.id}'">
            📦 الطلبات ${clientOrders.length ? `(${clientOrders.length})` : ''}
          </button>
          <button class="action-btn delete-btn" onclick="deleteClientById('${client.id}')">🗑️ حذف</button>
        </div>
      </td>
    `;
    table.appendChild(tr);
  });
}

let currentHistoryOrders = [];

function safeNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

function formatMoney(value) {
  return safeNumber(value).toFixed(2) + " ر.س";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getOrderItems(order) {
  return Array.isArray(order.items) ? order.items : [];
}

function getOrderOriginalTotal(order) {
  const itemsTotal = getOrderItems(order).reduce((sum, item) => {
    return sum + safeNumber(item.price) * safeNumber(item.qty);
  }, 0);

  return safeNumber(order.totalBefore) || itemsTotal;
}

function getOrderNetTotal(order) {
  const itemsTotal = getOrderOriginalTotal(order);
  return safeNumber(order.totalAfter) || itemsTotal;
}

function getOrderDeliveryTotal(order) {
  const item = getOrderItems(order).find(i => i.name === "مندوب");
  return item ? safeNumber(item.price) * safeNumber(item.qty) : 0;
}

function getPaymentInfo(order) {
  if (order.paymentMethod === "cash") {
    return {
      methodText: "نقد",
      methodClass: "badge-cash",
      statusText: order.cashReceived ? "مدفوع" : "بانتظار الدفع",
      statusClass: order.cashReceived ? "badge-paid" : "badge-unpaid",
      isPaid: !!order.cashReceived
    };
  }

  if (order.paymentMethod === "transfer") {
    return {
      methodText: "تحويل",
      methodClass: "badge-transfer",
      statusText: order.transferred ? "تم التحويل" : "بانتظار التحويل",
      statusClass: order.transferred ? "badge-paid" : "badge-unpaid",
      isPaid: !!order.transferred
    };
  }

  return {
    methodText: "غير محدد",
    methodClass: "badge-unknown",
    statusText: "غير محدد",
    statusClass: "badge-unknown",
    isPaid: false
  };
}

function getOrderCardClass(order) {
  if (order.paymentMethod === "cash") {
    return order.cashReceived ? "order-card-cash-paid" : "order-card-cash-unpaid";
  }

  if (order.paymentMethod === "transfer") {
    return order.transferred ? "order-card-transfer-paid" : "order-card-transfer-unpaid";
  }

  return "order-card-unknown";
}

function getOrderStatus(order) {
  return getPaymentInfo(order).statusText;
}

function getOrderMonthKey(order) {
  const dateText = String(order.date || "");
  return dateText.slice(0, 7) || "غير محدد";
}

function fillOrderHistoryMonths(orders) {
  const monthFilter = document.getElementById("orderHistoryMonthFilter");
  if (!monthFilter) return;

  const months = [...new Set(orders.map(getOrderMonthKey).filter(Boolean))];

  monthFilter.innerHTML = `<option value="all">كل الشهور</option>` + months.map(month => {
    return `<option value="${escapeHtml(month)}">${escapeHtml(month)}</option>`;
  }).join("");
}

function viewClientOrders(clientId) {
  const client = clients.find(c => c.id === clientId);
  if (!client) return;

  const clientOrders = getClientOrders(clientId);
  currentHistoryOrders = clientOrders;

  ordersClientName.textContent = client.name;

  fillOrderHistoryMonths(clientOrders);

  const searchInput = document.getElementById("orderHistorySearchInput");
  const statusFilter = document.getElementById("orderHistoryStatusFilter");
  const monthFilter = document.getElementById("orderHistoryMonthFilter");

  if (searchInput) searchInput.value = "";
  if (statusFilter) statusFilter.value = "all";
  if (monthFilter) monthFilter.value = "all";

  renderOrderHistory();

  ordersModal.style.display = "flex";
}

function renderOrderHistory() {
  const searchValue = (document.getElementById("orderHistorySearchInput")?.value || "").trim().toLowerCase();
  const selectedMonth = document.getElementById("orderHistoryMonthFilter")?.value || "all";
  const selectedStatus = document.getElementById("orderHistoryStatusFilter")?.value || "all";

  let filteredOrders = currentHistoryOrders.filter(order => {
    const payment = getPaymentInfo(order);
	const cardClass = getOrderCardClass(order);
    const monthKey = getOrderMonthKey(order);

    const matchesMonth = selectedMonth === "all" || monthKey === selectedMonth;

    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "paid" && payment.isPaid) ||
      (selectedStatus === "unpaid" && !payment.isPaid) ||
      (selectedStatus === "cash" && order.paymentMethod === "cash") ||
      (selectedStatus === "transfer" && order.paymentMethod === "transfer");

    const textForSearch = [
      order.date,
      order.deliveryDate,
      order.deliveryPerson,
      order.mandoub,
      order.globalNote,
      getOrderItems(order).map(item => item.name).join(" ")
    ].join(" ").toLowerCase();

    const matchesSearch = !searchValue || textForSearch.includes(searchValue);

    return matchesMonth && matchesStatus && matchesSearch;
  });

  updateOrderHistorySummary(filteredOrders);
  renderOrderHistoryList(filteredOrders);
}

function updateOrderHistorySummary(orders) {
  const total = orders.reduce((sum, order) => sum + getOrderOriginalTotal(order), 0);
  const net = orders.reduce((sum, order) => sum + getOrderNetTotal(order), 0);
  const delivery = orders.reduce((sum, order) => sum + getOrderDeliveryTotal(order), 0);
  const discount = Math.max(total - net, 0);

  ordersCount.textContent = orders.length;
  ordersTotal.textContent = formatMoney(total);
  ordersNet.textContent = formatMoney(net);
  ordersDelivery.textContent = formatMoney(delivery);
  lastOrderDate.textContent = orders[0]?.date || "-";

  const discountEl = document.getElementById("ordersDiscount");
  if (discountEl) {
    discountEl.textContent = formatMoney(discount);
  }
}

function renderOrderHistoryList(orders) {
  if (!orders.length) {
    ordersList.innerHTML = `
      <div class="empty-orders">
        لا توجد طلبات مطابقة للفلاتر الحالية
      </div>
    `;
    return;
  }

  ordersList.innerHTML = orders.map((order, idx) => {
    const payment = getPaymentInfo(order);
    const originalTotal = getOrderOriginalTotal(order);
    const netTotal = getOrderNetTotal(order);
    const deliveryTotal = getOrderDeliveryTotal(order);
    const discountAmount = Math.max(originalTotal - netTotal, 0);
    const items = getOrderItems(order);

    const productsHtml = items.length
      ? items.map(item => {
          const itemName = escapeHtml(item.name || "منتج");
          const qty = safeNumber(item.qty);
          const price = safeNumber(item.price);
          const lineTotal = qty * price;

          return `
            <li>
              <span>${itemName} × ${qty}</span>
              <strong>${formatMoney(lineTotal)}</strong>
            </li>
          `;
        }).join("")
      : `<li><span>لا توجد منتجات محفوظة</span><strong>-</strong></li>`;

    const noteHtml = order.globalNote
      ? `<div class="order-note">📝 ملاحظة: ${escapeHtml(order.globalNote)}</div>`
      : "";

    const deliveryDateHtml = order.deliveryDate
      ? `<div style="margin-top:6px; color:#555;">🕒 وقت التسليم: <span dir="ltr">${escapeHtml(order.deliveryDate)}</span></div>`
      : "";

    const mandoubName = order.deliveryPerson || order.mandoub || "غير محدد";

    return `
      <div class="order-item ${cardClass}">
        <div class="order-card-header">
          <div class="order-number">طلب #${idx + 1}</div>
          <div class="order-date">${escapeHtml(order.date || "تاريخ غير محدد")}</div>
        </div>

        <div class="order-badges">
          <span class="order-badge ${payment.methodClass}">💳 ${payment.methodText}</span>
          <span class="order-badge ${payment.statusClass}">🔁 ${payment.statusText}</span>
        </div>

        <div style="color:#555; font-size:0.9rem;">
          🚚 المندوب: ${escapeHtml(mandoubName)}
        </div>

        ${deliveryDateHtml}

        <div class="order-money-grid">
<div class="order-money-box money-total">
  <small>قبل الخصم</small>
  <strong>${formatMoney(originalTotal)}</strong>
</div>

<div class="order-money-box money-discount">
  <small>الخصم</small>
  <strong>${formatMoney(discountAmount)}</strong>
</div>

<div class="order-money-box money-net">
  <small>الصافي</small>
  <strong>${formatMoney(netTotal)}</strong>
</div>
        </div>

        <div class="order-money-grid" style="grid-template-columns: 1fr;">
<div class="order-money-box money-delivery">
  <small>المدفوع للمندوب داخل هذا الطلب</small>
  <strong>${formatMoney(deliveryTotal)}</strong>
</div>
        </div>

        ${noteHtml}

        <details class="order-products-details">
          <summary>📋 عرض المنتجات</summary>
          <ul class="order-products-list">
            ${productsHtml}
          </ul>
        </details>
      </div>
    `;
  }).join("");
}

function resetOrderHistoryFilters() {
  const searchInput = document.getElementById("orderHistorySearchInput");
  const monthFilter = document.getElementById("orderHistoryMonthFilter");
  const statusFilter = document.getElementById("orderHistoryStatusFilter");

  if (searchInput) searchInput.value = "";
  if (monthFilter) monthFilter.value = "all";
  if (statusFilter) statusFilter.value = "all";

  renderOrderHistory();
}

// ========== إضافة عميل جديد (مع تنظيف رقم الجوال) ==========
form.addEventListener("submit", async function(e) {
  e.preventDefault();
  let name = nameInput.value.trim();
  let phone = phoneInput.value.trim();
  
  const formattedPhone = formatPhoneOrReject(phone);
  if (formattedPhone === null) {
    errorDiv.textContent = "⚠️ رقم الجوال غير صحيح. استخدم رقم سعودي مثل 0501234567";
    errorDiv.style.display = "block";
    return;
  }
  phone = formattedPhone;
  
  const date = dateInput.value;

  if (!name) {
    alert("يجب إدخال اسم العميل");
    return;
  }

  if (clients.some(c => c.name === name)) {
    errorDiv.textContent = "⚠️ هذا الاسم موجود بالفعل، اختر اسمًا مختلفًا";
    errorDiv.style.display = "block";
    return;
  }

  if (phoneExists(phone)) {
    errorDiv.textContent = "⚠️ رقم الجوال مسجل لعميل آخر";
    errorDiv.style.display = "block";
    return;
  }

  const newClient = {
    id: Date.now().toString(),
    name,
    phone: phone || "",
    date: date || new Date().toISOString().split('T')[0]
  };

clients.push(newClient);

try {
  await saveClients();

  nameInput.value = "";
  phoneInput.value = "";
  dateInput.value = "";
  errorDiv.style.display = "none";
  playSound(addSound);
  renderClients(searchInput.value);
} catch (error) {
  clients = clients.filter(c => c.id !== newClient.id);
  showStorageError(error);
}
});


function openEditModalById(clientId) {
  const index = clients.findIndex(c => String(c.id) === String(clientId));
  if (index < 0) {
    alert("تعذر العثور على العميل. حدّث الصفحة وحاول مرة أخرى.");
    return;
  }
  currentEditIndex = index;
  const client = clients[index];
  editNameInput.value = client.name;
  editPhoneInput.value = client.phone || "";
  editDateInput.value = client.date || "";
  editModal.style.display = "flex";
}

// إبقاء الدالة القديمة للتوافق مع أي استدعاء قديم.
function openEditModal(index) {
  const client = clients[index];
  if (client) openEditModalById(client.id);
}

// ========== حفظ تعديل العميل (مع تنظيف رقم الجوال) ==========
async function saveClientEdit() {
  let newName = editNameInput.value.trim();
  let newPhone = editPhoneInput.value.trim();

  const formattedPhone = formatPhoneOrReject(newPhone);
  if (formattedPhone === null) {
    alert("⚠️ رقم الجوال غير صحيح. استخدم رقم سعودي مثل 0501234567");
    return;
  }
  newPhone = formattedPhone;

  const newDate = editDateInput.value;

  if (!newName) {
    alert("يجب إدخال اسم العميل");
    return;
  }

  if (clients.some((c, idx) => c.name === newName && idx !== currentEditIndex)) {
    alert("⚠️ يوجد عميل بنفس الاسم");
    return;
  }

  const editingClientId = clients[currentEditIndex]?.id;
  if (phoneExists(newPhone, editingClientId)) {
    alert("⚠️ رقم الجوال مسجل لعميل آخر");
    return;
  }

  const previousClients = JSON.parse(JSON.stringify(clients));
  const previousSalesData = JSON.parse(JSON.stringify(salesData));

  try {
    const oldClient = clients[currentEditIndex];

    clients[currentEditIndex].name = newName;
    clients[currentEditIndex].phone = newPhone;
    clients[currentEditIndex].date = newDate;

    Object.values(salesData).forEach(monthOrders => {
      monthOrders.forEach(order => {
        if (order.clientId === oldClient.id) {
          order.client = newName;
        }
      });
    });

    await saveClientsAndSalesData();

    playSound(addSound);
    closeEditModal();
    renderClients(searchInput.value);
  } catch (error) {
    clients = previousClients;
    salesData = previousSalesData;
    showStorageError(error);
  }
}

function deleteClientById(clientId) {
  const index = clients.findIndex(c => String(c.id) === String(clientId));
  if (index < 0) {
    alert("تعذر العثور على العميل. حدّث الصفحة وحاول مرة أخرى.");
    return;
  }
  return deleteClient(index);
}

function deleteClient(index) {
  const clientName = clients[index]?.name || "هذا العميل";
  const message = `هل أنت متأكد من حذف العميل: ${clientName}؟ سيتم الاحتفاظ بطلباته التاريخية.`;

  showConfirm(message, async () => {
    const deletedClient = clients[index];

    clients.splice(index, 1);

    try {
      await saveClients();
      playSound(removeSound);
      renderClients(searchInput.value);
    } catch (error) {
      clients.splice(index, 0, deletedClient);
      showStorageError(error);
    }
  });
}

function closeEditModal() {
  editModal.style.display = "none";
  currentEditIndex = null;
}

function closeOrdersModal() {
  ordersModal.style.display = "none";
}

function playSound(audioElement) {
  if (audioElement) {
    audioElement.currentTime = 0;
    audioElement.play().catch(e => console.log("لا يمكن تشغيل الصوت:", e));
  }
}

searchInput.addEventListener("input", function() {
  renderClients(this.value);
});

document.addEventListener("DOMContentLoaded", async function() {
  try {
    await initStorageData();

    let clientsNeedRepair = false;
    clients = clients.map((c, index) => {
      if (!c.id) {
        c.id = `${Date.now()}-${index}`;
        clientsNeedRepair = true;
      }
      if (c.phone === undefined || c.phone === null) {
        c.phone = "";
        clientsNeedRepair = true;
      }
      return c;
    });

    // لا نكتب clients للسحابة عند كل فتح للصفحة. نصلح السجلات القديمة فقط عند الحاجة.
    if (clientsNeedRepair) await saveClients();

    renderClients();

    if (!dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    updateFontSizeDisplay();

    setTimeout(() => {
      applyFontSizeToTable();
    }, 100);
  } catch (error) {
    showStorageError(error);
  }
});
window.addEventListener('click', function(event) {
  if (event.target === editModal) {
    closeEditModal();
  }
  if (event.target === ordersModal) {
    closeOrdersModal();
  }
  if (event.target === document.getElementById('fontSizeModal')) {
    closeFontSizeModal();
  }
});

function showConfirm(message, onConfirm) {
  const modal = document.getElementById("confirmModal");
  const text = document.getElementById("confirmText");
  const yesBtn = document.getElementById("confirmYes");
  const noBtn = document.getElementById("confirmNo");

  text.textContent = message;
  modal.style.display = "flex";

  const cleanup = () => {
    modal.style.display = "none";
    yesBtn.onclick = null;
    noBtn.onclick = null;
  };

  yesBtn.onclick = () => {
    const delSound = document.getElementById("deleteSound");
    if (delSound) {
      delSound.currentTime = 0;
      delSound.play();
    }
    cleanup();
    onConfirm();
  };

  noBtn.onclick = cleanup;
}

// ===== دوال عرض رقم الجوال مع اسم العميل =====
function openPhoneModalById(clientId) {
    const client = clients.find(c => String(c.id) === String(clientId));
    if (!client) {
        alert("تعذر العثور على العميل.");
        return;
    }
    openPhoneModal(client.id, client.name, client.phone || "");
}

function openPhoneModal(clientId, clientName, phoneNumber) {
    const modal = document.getElementById('phoneModal');
    const display = document.getElementById('phoneDisplay');
    const nameDisplay = document.getElementById('clientNameDisplay');
    
    // عرض الاسم والرقم
    nameDisplay.textContent = `👤 ${clientName}`;
    display.textContent = phoneNumber || 'لا يوجد رقم';
    modal.style.display = 'flex';
    
    // خاصية النسخ عند الضغط على الرقم
    display.onclick = function() {
        const text = this.textContent;
        if (text && text !== 'لا يوجد رقم') {
            navigator.clipboard.writeText(text).then(() => {
                this.textContent = '✅ تم النسخ!';
                this.style.color = '#27ae60';
                setTimeout(() => {
                    this.textContent = text;
                    this.style.color = '#2c3e50';
                }, 1500);
            }).catch(() => {
                const range = document.createRange();
                range.selectNode(this);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                document.execCommand('copy');
                this.textContent = '✅ تم النسخ!';
                this.style.color = '#27ae60';
                setTimeout(() => {
                    this.textContent = text;
                    this.style.color = '#2c3e50';
                }, 1500);
            });
        }
    };
}

function closePhoneModal() {
    document.getElementById('phoneModal').style.display = 'none';
}

// إغلاق المودال عند الضغط خارج المحتوى
document.addEventListener('click', function(event) {
    const modal = document.getElementById('phoneModal');
    if (event.target === modal) {
        closePhoneModal();
    }
});
