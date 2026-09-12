/* =========================================================
   FILE: js/sales.js
   SOURCE PAGE: sales.html
   PURPOSE: Page-specific JavaScript extracted from the HTML.
   DATA SAFETY: This is a structural refactor only; field names,
   storage keys, save ordering, and business rules must remain compatible.
   MAINTENANCE RULE: Shared services stay in their existing shared files.
========================================================= */


/* ---- Extracted inline script block 1 (original order preserved) ---- */
const PHRASE_STRIP_NAME = "شريط عبارة";

  function isPhraseStripItem(item) {
    return String(
      item && item.name ? item.name : ""
    ).trim() === PHRASE_STRIP_NAME;
  }
    document.addEventListener("DOMContentLoaded",async function () {
      const filterButtons = document.querySelectorAll('.filter-btn');
      const totalProductsElement = document.getElementById('totalProducts');
      const salesTableBody = document.getElementById('salesTableBody');
      const salesTableFooter = document.getElementById('salesTableFooter');
      let salesData = {};
      let clients = [];
      let currentFilter = 'current-month';
	  
      // عناصر النافذة المنبثقة
      const clientsModal = document.getElementById('clientsModal');
      const closeModalBtn = document.getElementById('closeModal');
      const modalProductName = document.getElementById('modalProductName');
      const modalSubtitle = document.getElementById('modalSubtitle');
      const clientsList = document.getElementById('clientsList');

      // عناصر نافذة ضبط الخط
      const fontModal = document.getElementById('fontModal');
      const openFontModalBtn = document.getElementById('openFontModal');
      const closeFontModalBtn = document.getElementById('closeFontModal');
      const currentFontSizeElement = document.getElementById('currentFontSize');
      const decreaseFontBtn = document.getElementById('decreaseFont');
      const increaseFontBtn = document.getElementById('increaseFont');
      const resetFontBtn = document.getElementById('resetFont');
      const fontPreviewText = document.getElementById('fontPreviewText');
			const totalClientsElement = document.getElementById("totalClients");

      function showStorageError(error) {
        console.error("خطأ IndexedDB:", error);
        alert("❌ حدث خطأ أثناء القراءة أو الحفظ في IndexedDB. تأكد أن ملف db.js موجود في نفس المجلد وأنك استوردت النسخة بنجاح.");
      }

      async function ensureDBReady() {
        if (!window.NoshiDB) {
          throw new Error("ملف db.js غير مربوط أو لم يتم تحميله");
        }
      }

      async function initStorageData() {
        await ensureDBReady();

        const live = NoshiDB.getMany
          ? await NoshiDB.getMany(["salesData", "clients", "salesTableFontSize"], {
              salesData: {}, clients: [], salesTableFontSize: DEFAULT_FONT_SIZE
            })
          : {
              salesData: await NoshiDB.get("salesData", {}),
              clients: await NoshiDB.get("clients", []),
              salesTableFontSize: await NoshiDB.get("salesTableFontSize", DEFAULT_FONT_SIZE)
            };
        salesData = live.salesData && typeof live.salesData === "object" && !Array.isArray(live.salesData) ? live.salesData : {};
        clients = Array.isArray(live.clients) ? live.clients : [];
        currentFontSize = parseInt(live.salesTableFontSize, 10) || DEFAULT_FONT_SIZE;
      }

      function loadTotalClients() {
        totalClientsElement.textContent = clients.length;
      }

      // حجم الخط الافتراضي (بالنقاط)
      const DEFAULT_FONT_SIZE = 16;
      const MIN_FONT_SIZE = 10;
      const MAX_FONT_SIZE = 24;
      let currentFontSize = DEFAULT_FONT_SIZE;

      try {
        await initStorageData();
      } catch (error) {
        showStorageError(error);
        return;
      }

      // شغّلها عند فتح الصفحة
      loadTotalClients();

      // دالة لتطبيق حجم الخط
      function applyFontSize(size) {
        // تحديث المتغيرات CSS
        document.documentElement.style.setProperty('--table-font-size', `${size}px`);
        document.documentElement.style.setProperty('--table-padding', `${size * 0.75}px`);
        
        // تحديث العرض في النافذة
        currentFontSizeElement.textContent = size;
        
        // تحديث معاينة الخط
        fontPreviewText.style.fontSize = `${size}px`;
        
        // حفظ الإعداد
        currentFontSize = size;
        NoshiDB.set("salesTableFontSize", size).catch(showStorageError);
      }

      // دالة لزيادة حجم الخط
      function increaseFontSize() {
        if (currentFontSize < MAX_FONT_SIZE) {
          applyFontSize(currentFontSize + 1);
        }
      }

      // دالة لتقليل حجم الخط
      function decreaseFontSize() {
        if (currentFontSize > MIN_FONT_SIZE) {
          applyFontSize(currentFontSize - 1);
        }
      }

      // دالة لإعادة الضبط
      function resetFontSize() {
        applyFontSize(DEFAULT_FONT_SIZE);
      }

      // تهيئة حجم الخط
      applyFontSize(currentFontSize);

      // فتح نافذة ضبط الخط
      openFontModalBtn.addEventListener('click', function() {
        fontModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      });

      // إغلاق نافذة ضبط الخط
      closeFontModalBtn.addEventListener('click', function() {
        fontModal.style.display = 'none';
        document.body.style.overflow = '';
      });

      // إغلاق النافذة عند النقر خارجها
      fontModal.addEventListener('click', function(event) {
        if (event.target === fontModal) {
          fontModal.style.display = 'none';
          document.body.style.overflow = '';
        }
      });

      // إضافة أحداث الأزرار
      decreaseFontBtn.addEventListener('click', decreaseFontSize);
      increaseFontBtn.addEventListener('click', increaseFontSize);
      resetFontBtn.addEventListener('click', resetFontSize);

      // إغلاق النافذة بزر Escape
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
          if (fontModal.style.display === 'flex') {
            fontModal.style.display = 'none';
            document.body.style.overflow = '';
          }
        }
      });

      // دالة لجمع كل الطلبات من جميع الأشهر
      function getAllOrders() {
        let allOrders = [];
        Object.keys(salesData).forEach(monthKey => {
          const orders = salesData[monthKey] || [];
          allOrders = allOrders.concat(orders);
        });
        return allOrders;
      }

      // دالة لإغلاق نافذة العملاء
      function closeModal() {
        clientsModal.style.display = 'none';
        document.body.style.overflow = '';
      }

      // إضافة أحداث نافذة العملاء
      closeModalBtn.addEventListener('click', closeModal);
      clientsModal.addEventListener('click', function(event) {
        if (event.target === clientsModal) {
          closeModal();
        }
      });

      // دالة لعرض عملاء منتج معين
      function showProductClients(productName) {
        const allOrders = getAllOrders();
        const clientData = {};
        
        allOrders.forEach(order => {
          const clientName = order.client || "عميل غير معروف";
          const productOrder = order.items.find(item => item.name === productName);
          
          if (productOrder) {
            if (!clientData[clientName]) {
              clientData[clientName] = {
                totalQuantity: 0,
                firstOrderDate: null,
                lastOrderDate: null
              };
            }
            
            clientData[clientName].totalQuantity += productOrder.qty;
            
            const orderDate = order.date || new Date().toISOString().split('T')[0];
            if (!clientData[clientName].firstOrderDate || orderDate < clientData[clientName].firstOrderDate) {
              clientData[clientName].firstOrderDate = orderDate;
            }
            if (!clientData[clientName].lastOrderDate || orderDate > clientData[clientName].lastOrderDate) {
              clientData[clientName].lastOrderDate = orderDate;
            }
          }
        });
        
        const clientArray = Object.keys(clientData).map(clientName => {
          return {
            name: clientName,
            totalQuantity: clientData[clientName].totalQuantity,
            firstOrderDate: clientData[clientName].firstOrderDate,
            lastOrderDate: clientData[clientName].lastOrderDate
          };
        }).sort((a, b) => b.totalQuantity - a.totalQuantity);
        
        modalProductName.textContent = productName;
        modalSubtitle.textContent = `${clientArray.length} عميل - مرتبين حسب الكمية (من الأكثر للأقل)`;
        
        clientsList.innerHTML = '';
        
        if (clientArray.length === 0) {
          clientsList.innerHTML = `
            <div class="empty-state">
              <div class="empty-icon">👥</div>
              <div class="empty-text">
                لا يوجد عملاء طلبوا هذا المنتج
              </div>
            </div>
          `;
        } else {
          clientArray.forEach((client, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';
            
            const dateInfo = client.firstOrderDate ? 
              `<div class="stat-badge">
                <span>📅</span>
                <span>أول طلب: ${formatDate(client.firstOrderDate)}</span>
              </div>` : '';
            
            clientsList.innerHTML += `
              <div class="client-item ${rankClass}">
                <div class="client-rank-badge">#${rank}</div>
                <div class="client-info">
                  <div class="client-name">${client.name}</div>
                  <div class="client-stats">
                    <div class="stat-badge">
                      <span>📦</span>
                      <span class="stat-value">${client.totalQuantity}</span>
                      <span>قطعة</span>
                    </div>
                    ${dateInfo}
                  </div>
                </div>
                <div class="count-badge">
                  ${client.totalQuantity} قطعة
                </div>
              </div>
            `;
          });
          
          const totalClients = clientArray.length;
          const totalQuantity = clientArray.reduce((sum, client) => sum + client.totalQuantity, 0);
          
          clientsList.innerHTML += `
            <div class="summary-section">
              <div class="summary-title">📊 ملخص إجمالي</div>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${totalClients}</div>
                  <div class="stat-label">إجمالي العملاء</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${totalQuantity}</div>
                  <div class="stat-label">إجمالي القطع</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${clientArray[0] ? clientArray[0].name : '---'}</div>
                  <div class="stat-label">الأكثر طلباً</div>
                </div>
              </div>
            </div>
          `;
        }
        
        clientsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }

      // دالة لتنسيق التاريخ (الميلادي)
      function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      // بقية الدوال كما هي
      function setActiveFilter(filter) {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        filterButtons.forEach(btn => {
          if (btn.dataset.filter === filter) btn.classList.add('active');
        });
        currentFilter = filter;
        loadSalesData();
        loadAllTimeStats();
        loadFilteredStats(); // تحديث الإحصائيات عند تغيير الفلتر
      }

      function getFilteredOrders() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        let filteredOrders = [];

        Object.keys(salesData).forEach(monthKey => {
          const orders = salesData[monthKey] || [];
          const [year, month] = monthKey.split('-').map(Number);

          if (currentFilter === 'current-month' && year === currentYear && month === currentMonth)
            filteredOrders = filteredOrders.concat(orders);

          else if (currentFilter === 'last-month') {
            let lastMonth = currentMonth - 1;
            let lastYear = currentYear;
            if (lastMonth === 0) { lastMonth = 12; lastYear--; }
            if (year === lastYear && month === lastMonth)
              filteredOrders = filteredOrders.concat(orders);
          }

          else if (currentFilter === 'from-beginning' && year >= 2025)
            filteredOrders = filteredOrders.concat(orders);
        });

        return filteredOrders;
      }

      function loadSalesData() {
        const orders = getFilteredOrders();
        const productSales = {};
        let totalQuantity = 0;

        orders.forEach(order => {
          const generalDiscount = order.generalDiscount || 0;
          const generalMultiplier = 1 - (generalDiscount / 100);

          order.items.forEach(item => {
            if (item.name === "مندوب") return;

            if (!productSales[item.name]) {
              productSales[item.name] = {
                quantity: 0,
                originalTotal: 0,
                discountTotal: 0,
                finalTotal: 0
              };
            }

            const originalPrice = item.qty * item.price;
            const itemMultiplier = 1 - ((item.discount || 0) / 100);
            const finalPrice = originalPrice * itemMultiplier * generalMultiplier;
            const discount = originalPrice - finalPrice;

            productSales[item.name].quantity += item.qty;
            productSales[item.name].originalTotal += originalPrice;
            productSales[item.name].discountTotal += discount;
            productSales[item.name].finalTotal += finalPrice;

            totalQuantity += item.qty;
          });
        });

        totalProductsElement.textContent = totalQuantity;
        displaySalesData(productSales);
      }

      function displaySalesData(productSales) {
        salesTableBody.innerHTML = '';
        salesTableFooter.innerHTML = '';

        const products = Object.keys(productSales).sort((a, b) =>
          productSales[b].quantity - productSales[a].quantity
        );

        let grandOriginalTotal = 0;
        let grandDiscountTotal = 0;
        let grandFinalTotal = 0;

        if (products.length === 0) {
          salesTableBody.innerHTML = `
            <tr><td colspan="6" style="text-align:center;padding:20px;">
            لا توجد مبيعات في الفترة المحددة
            </td></tr>`;
          return;
        }

        let topProducts = [];
        let topProductsCount = 0;
        
        for (let i = 0; i < products.length && topProductsCount < 3; i++) {
          const product = products[i];
if (
  product !== "صحن تقديم" &&
  product !== PHRASE_STRIP_NAME
) {
  topProducts.push(product);
  topProductsCount++;
}
        }

const productsToDisplay = [];

products.forEach(product => {
  if (
    product !== "صحن تقديم" &&
    product !== PHRASE_STRIP_NAME
  ) {
    productsToDisplay.push(product);
  }
});

/*
  نضع الشريط قبل صحن التقديم مباشرة.
*/
if (products.includes(PHRASE_STRIP_NAME)) {
  productsToDisplay.push(
    PHRASE_STRIP_NAME
  );
}

if (products.includes("صحن تقديم")) {
  productsToDisplay.push(
    "صحن تقديم"
  );
}

        productsToDisplay.forEach((product, displayIndex) => {
const isServingDish =
  product === "صحن تقديم";

const isPhraseStrip =
  product === PHRASE_STRIP_NAME;

const isTopProduct =
  topProducts.includes(product);

const data = productSales[product];

/*
  الشريط يظهر في الجدول بجميع أرقامه،
  لكنه لا يدخل في صف الإجمالي.
*/
if (!isPhraseStrip) {
  grandOriginalTotal +=
    data.originalTotal;

  grandDiscountTotal +=
    data.discountTotal;

  grandFinalTotal +=
    data.finalTotal;
}

          let displayRank;
          if (isServingDish) {
            displayRank = productsToDisplay.length;
          } else {
            displayRank = displayIndex + 1;
          }

          let rowStyle = '';
          let medal = '';
          let rankText = `#${displayRank}`;
          
          if (isTopProduct) {
            const topIndex = topProducts.indexOf(product);
            if (topIndex === 0) {
              rowStyle = 'background:#FFF3E0;font-weight:bold;border-left:4px solid #FFD700;';
              medal = '🥇 ';
            } else if (topIndex === 1) {
              rowStyle = 'background:#E0E0E0;font-weight:bold;border-left:4px solid #A0A0A0;';
              medal = '🥈 ';
            } else if (topIndex === 2) {
              rowStyle = 'background:#FBE9E7;font-weight:bold;border-left:4px solid #CD7F32;';
              medal = '🥉 ';
            }
} else if (isPhraseStrip) {
  rowStyle =
    'background:#F3E5F5;' +
    'font-weight:bold;' +
    'border-left:4px solid #8E44AD;' +
    'color:#5B2C6F;';

} else if (isServingDish) {
  rowStyle =
    'background:#E8F5E9;' +
    'font-weight:bold;' +
    'border-left:4px solid #4CAF50;';
}

          salesTableBody.innerHTML += `
            <tr style="${rowStyle}">
              <td>
                ${medal}${rankText} ${product}
              </td>
              <td>${data.quantity}</td>
              <td class="original-price">${data.originalTotal.toFixed(2)} ريال</td>
              <td class="discount-price">${data.discountTotal.toFixed(2)} ريال</td>
              <td class="final-price">${data.finalTotal.toFixed(2)} ريال</td>
              <td>
                <button class="client-btn" data-product="${product}">
                  👥 العملاء
                </button>
              </td>
            </tr>
          `;
        });

        salesTableFooter.innerHTML = `
          <tr class="total-row" style="border-top:5px solid #e67e22;font-weight:bold;background:#fff8f0;">
            <td>الإجمالي</td>
            <td></td>
            <td class="original-price">${grandOriginalTotal.toFixed(2)} ريال</td>
            <td class="discount-price">${grandDiscountTotal.toFixed(2)} ريال</td>
            <td class="final-price">${grandFinalTotal.toFixed(2)} ريال</td>
            <td></td>
          </tr>`;

        document.querySelectorAll('.client-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const productName = this.getAttribute('data-product');
            showProductClients(productName);
          });
        });
      }

      filterButtons.forEach(btn => {
        btn.addEventListener('click', () => setActiveFilter(btn.dataset.filter));
      });

      // ---------------------------
      // التشغيل عند تحميل الصفحة
      // ---------------------------
      loadSalesData();
      loadAllTimeStats();
      loadFilteredStats();
    });


/* ---- Extracted inline script block 2 (original order preserved) ---- */
let isSortedByOrders = false;
let originalMonthsData = [];

function showSalesStorageError(error) {
  console.error("خطأ IndexedDB في صفحة المبيعات:", error);
}

async function readSalesDataFromDB() {
  if (!window.NoshiDB) {
    throw new Error("ملف db.js غير مربوط أو لم يتم تحميله");
  }

  const savedSalesData = await NoshiDB.get("salesData", {});
  return savedSalesData && typeof savedSalesData === "object" && !Array.isArray(savedSalesData)
    ? savedSalesData
    : {};
}
/* ===============================
   👥 إحصائيات العملاء (تصميم جديد) - V3
   =============================== */
  async function readSalesData() {
    try {
      return await readSalesDataFromDB();
    } catch (e) {
      showSalesStorageError(e);
      return {};
    }
  }

  function getActiveFilterKey() {
    const active = document.querySelector(".filter-btn.active");
    return (active && active.dataset && active.dataset.filter) ? active.dataset.filter : "current-month";
  }

  function getFilterLabel(filterKey) {
    if (filterKey === "current-month") return "هذا الشهر";
    if (filterKey === "last-month") return "الشهر الماضي";
    if (filterKey === "from-beginning") return "من البداية";
    return "—";
  }

  function monthKeyOf(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  function getOrdersForFilter(salesData, filterKey) {
    if (filterKey === "from-beginning") {
      let all = [];
      Object.values(salesData).forEach(arr => { all = all.concat(arr || []); });
      return all;
    }
    const now = new Date();
    let target = now;
    if (filterKey === "last-month") target = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const key = monthKeyOf(target);
    return (salesData[key] || []).slice();
  }

  function rankClients(orders, mode) {
    const map = {};
    orders.forEach(o => {
      const name = o.client || "غير معروف";
      if (!map[name]) map[name] = { orders: 0, total: 0 };
      map[name].orders += 1;
      map[name].total += parseFloat(o.totalAfter || 0);
    });

    return Object.entries(map)
      .sort((a, b) => mode === "orders"
        ? (b[1].orders - a[1].orders) || (b[1].total - a[1].total)
        : (b[1].total - a[1].total) || (b[1].orders - a[1].orders)
      )
      .slice(0, 20);
  }

  function topInvoices(orders) {
    return orders
      .map(o => ({ client: o.client || "غير معروف", total: parseFloat(o.totalAfter || 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  function renderClientList(list, kind) {
    if (!list.length) {
      return `
        <div class="empty-clients">
          <div class="empty-clients-icon">📊</div>
          <div>لا توجد بيانات</div>
        </div>
      `;
    }

    let html = "";
    list.forEach((it, i) => {
      const medalClass = i === 0 ? "medal-1" : i === 1 ? "medal-2" : i === 2 ? "medal-3" : "medal-other";
      const medalText = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
      const name = kind === "invoice" ? it.client : it[0];
      const value = kind === "money"
        ? `${(it[1].total).toFixed(2)} ريال`
        : kind === "orders"
          ? `${it[1].orders} طلب`
          : `${it.total.toFixed(2)} ريال`;
      
      const valueClass = kind === "orders" ? "value-orders" : kind === "money" ? "value-money" : "value-invoice";

      html += `
        <div class="client-list-item">
          <div class="client-rank">
            <div class="client-medal ${medalClass}">${medalText}</div>
            <div class="client-name" title="${name}">${name}</div>
          </div>
          <div class="client-value ${valueClass}">${value}</div>
        </div>
      `;
    });
    
    return html;
  }

  function renderStatCard(type, period, icon, title, list, kind) {
    const cardClass = type === "orders" ? "card-orders" : type === "money" ? "card-money" : "card-invoice";
    
    return `
      <div class="client-stat-card ${cardClass}">
        <div class="client-stat-header">
          <div class="client-stat-title">
            <div class="client-stat-icon">${icon}</div>
            <div>${title}</div>
          </div>
          <div class="client-stat-period">${period}</div>
        </div>
        <div class="client-stat-body">
          ${renderClientList(list, kind)}
        </div>
      </div>
    `;
  }

  async function renderAll() {
    const container = document.getElementById("clientStatsContent");
    if (!container) return;

    const salesData = await readSalesData();
    const filterKey = getActiveFilterKey();
    const filterLabel = getFilterLabel(filterKey);

    const allOrders = getOrdersForFilter(salesData, "from-beginning");
    const filteredOrders = getOrdersForFilter(salesData, filterKey);

    const cards = [
      renderStatCard("orders", "كل الوقت", "🔁", "الأكثر طلبًا (Top 20)", rankClients(allOrders, "orders"), "orders"),
      renderStatCard("orders", filterLabel, "🔁", "الأكثر طلبًا (Top 20)", rankClients(filteredOrders, "orders"), "orders"),
      renderStatCard("money", "كل الوقت", "💰", "الأعلى إنفاقًا (Top 20)", rankClients(allOrders, "money"), "money"),
      renderStatCard("money", filterLabel, "💰", "الأعلى إنفاقًا (Top 20)", rankClients(filteredOrders, "money"), "money"),
      renderStatCard("invoice", "كل الوقت", "💎", "أكبر فواتير (Top 5)", topInvoices(allOrders), "invoice"),
      renderStatCard("invoice", filterLabel, "💎", "أكبر فواتير (Top 5)", topInvoices(filteredOrders), "invoice"),
    ];

    container.innerHTML = cards.join("");
  }

  function hook() {
    renderAll();
    setTimeout(renderAll, 0);
    setTimeout(renderAll, 50);

    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        setTimeout(renderAll, 0);
        setTimeout(renderAll, 30);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hook);
  } else {
    hook();
  }


/* ===============================
   🏆 أفضل الأشهر على الإطلاق
   =============================== */
async function loadAllTimeStats() {
  try {
    const salesData = await readSalesDataFromDB();
    let bestSalesMonth = null;
    let bestSalesValue = 0;
    let bestOrdersMonth = null;
    let bestOrdersCount = 0;

    Object.keys(salesData).forEach(monthKey => {
      const orders = salesData[monthKey] || [];
      let monthTotal = 0;

      // حساب الصافي بدون قيمة المندوب
      orders.forEach(order => {
        const generalMultiplier = 1 - ((order.generalDiscount || 0) / 100);
        
        order.items.forEach(item => {
          if (
  item.name === "مندوب" ||
  isPhraseStripItem(item)
) {
  return;
} // تجاهل المندوب
          
          const originalPrice = item.qty * item.price;
          const itemMultiplier = 1 - ((item.discount || 0) / 100);
          const finalPrice = originalPrice * itemMultiplier * generalMultiplier;
          
          monthTotal += finalPrice; // فقط الصافي بعد الخصم
        });
      });

      if (monthTotal > bestSalesValue) {
        bestSalesValue = monthTotal;
        bestSalesMonth = monthKey;
      }

      if (orders.length > bestOrdersCount) {
        bestOrdersCount = orders.length;
        bestOrdersMonth = monthKey;
      }
    });

    // تنسيق الشهر الميلادي
    function formatMonthDisplay(monthKey) {
      if (!monthKey) return "—";
      const [year, month] = monthKey.split("-");
      const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", 
                         "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }

    document.getElementById("bestSalesMonthDisplay").textContent = 
      bestSalesMonth ? formatMonthDisplay(bestSalesMonth) : "—";
    document.getElementById("bestSalesValueDisplay").textContent = 
      bestSalesMonth ? `${bestSalesValue.toFixed(2)} ريال` : "";
    
    document.getElementById("bestOrdersMonthDisplay").textContent = 
      bestOrdersMonth ? formatMonthDisplay(bestOrdersMonth) : "—";
    document.getElementById("bestOrdersValueDisplay").textContent = 
      bestOrdersMonth ? `${bestOrdersCount} طلب` : "";
  } catch (e) {
    console.error("Error loading all time stats:", e);
  }
}

/* ===============================
   📊 الإحصائيات حسب الفلترة
   =============================== */
function getFilterLabel(filter) {
  if (filter === "current-month") return "هذا الشهر";
  if (filter === "last-month") return "الشهر الماضي";
  if (filter === "from-beginning") return "من البداية";
  return "";
}

async function loadFilteredStats() {
  try {
    const salesData = await readSalesDataFromDB();
    const filterButtons = document.querySelectorAll(".filter-btn");
    let currentFilter = "current-month";
    
    // تحديد الفلتر النشط
    filterButtons.forEach(btn => {
      if (btn.classList.contains("active")) {
        currentFilter = btn.dataset.filter;
      }
    });

    function getFilteredOrders() {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      let filteredOrders = [];

      Object.keys(salesData).forEach(monthKey => {
        const orders = salesData[monthKey] || [];
        const [year, month] = monthKey.split("-").map(Number);

        if (currentFilter === "current-month" && year === currentYear && month === currentMonth)
          filteredOrders = filteredOrders.concat(orders);

        else if (currentFilter === "last-month") {
          let lastMonth = currentMonth - 1;
          let lastYear = currentYear;
          if (lastMonth === 0) { lastMonth = 12; lastYear--; }
          if (year === lastYear && month === lastMonth)
            filteredOrders = filteredOrders.concat(orders);
        }

        else if (currentFilter === "from-beginning") {
          filteredOrders = filteredOrders.concat(orders);
        }
      });

      return filteredOrders;
    }

    const orders = getFilteredOrders();
    let original = 0;
    let discount = 0;
    let finalTotal = 0;

    orders.forEach(order => {
      const generalMultiplier = 1 - ((order.generalDiscount || 0) / 100);

      order.items.forEach(item => {
        if (
  item.name === "مندوب" ||
  isPhraseStripItem(item)
) {
  return;
} // تجاهل المندوب

        const o = item.qty * item.price;
        const itemMultiplier = 1 - ((item.discount || 0) / 100);
        const f = o * itemMultiplier * generalMultiplier;

        original += o;
        finalTotal += f;
        discount += (o - f);
      });
    });

    // تحديث القيم
    document.getElementById("filteredOriginal").textContent = `${original.toFixed(2)} ريال`;
    document.getElementById("filteredDiscount").textContent = `${discount.toFixed(2)} ريال`;
    document.getElementById("filteredFinal").textContent = `${finalTotal.toFixed(2)} ريال`;
    document.getElementById("filteredOrdersCount").textContent = `${orders.length} طلب`;
    
    // تحديث نص الفلتر
    const filterText = getFilterLabel(currentFilter);
    document.getElementById("currentFilterDisplay").textContent = `(${filterText})`;
    
  } catch (e) {
    console.error("Error loading filtered stats:", e);
  }
}
async function loadMonthlySalesStats() {
  try {
    const salesData = await readSalesDataFromDB();
    const body = document.getElementById("monthlySalesStatsBody");
    const footer = document.getElementById("monthlySalesStatsFooter");
    if (!body || !footer) return;

    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

    function formatMonth(monthKey) {
      const [year, month] = monthKey.split("-").map(Number);
      return `${monthNames[month - 1] || month} ${year}`;
    }

    // تجميع البيانات
    const monthsData = [];
    let allOrders = 0, allProducts = 0, allOriginal = 0, allDiscount = 0, allFinal = 0;

    Object.keys(salesData)
      .filter(key => Array.isArray(salesData[key]) && salesData[key].length > 0)
      .sort((a, b) => a.localeCompare(b))
      .forEach(monthKey => {
        const orders = salesData[monthKey] || [];
        let monthProducts = 0, monthOriginal = 0, monthDiscount = 0, monthFinal = 0;

        orders.forEach(order => {
          const generalMultiplier = 1 - ((order.generalDiscount || 0) / 100);
(order.items || []).forEach(item => {
  if (item.name === "مندوب") {
    return;
  }

  const qty = Number(item.qty || 0);

  /*
    كمية الشريط تبقى ضمن عدد المنتجات.
  */
  monthProducts += qty;

  /*
    لكن مبالغه لا تدخل ماليًا.
  */
  if (isPhraseStripItem(item)) {
    return;
  }

  const price = Number(item.price || 0);
  const originalPrice = qty * price;

  const itemMultiplier =
    1 - ((item.discount || 0) / 100);

  const finalPrice =
    originalPrice *
    itemMultiplier *
    generalMultiplier;

  monthOriginal += originalPrice;

  monthDiscount +=
    (originalPrice - finalPrice);

  monthFinal += finalPrice;
});
        });

        monthsData.push({
          monthKey: monthKey,
          monthName: formatMonth(monthKey),
          ordersCount: orders.length,
          products: monthProducts,
          original: monthOriginal,
          discount: monthDiscount,
          final: monthFinal
        });

        allOrders += orders.length;
        allProducts += monthProducts;
        allOriginal += monthOriginal;
        allDiscount += monthDiscount;
        allFinal += monthFinal;
      });

    // حفظ البيانات الأصلية
    originalMonthsData = [...monthsData];

    // تطبيق الترتيب الحالي
    let sortedData = [...monthsData];
    if (isSortedByOrders) {
      sortedData.sort((a, b) => b.ordersCount - a.ordersCount);
    } else {
      sortedData.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    }

    // عرض البيانات
    body.innerHTML = "";
    sortedData.forEach(month => {
      body.innerHTML += `
        <tr>
          <td class="monthly-month-name">${month.monthName}</td>
          <td class="monthly-orders">${month.ordersCount} طلب</td>
          <td class="monthly-products">${month.products}</td>
          <td class="monthly-original">${month.original.toFixed(2)} ريال</td>
          <td class="monthly-discount">${month.discount.toFixed(2)} ريال</td>
          <td class="monthly-final">${month.final.toFixed(2)} ريال</td>
        </tr>
      `;
    });

    footer.innerHTML = `
      <tr class="month-total-row">
        <td>الإجمالي</td>
        <td class="monthly-orders">${allOrders} طلب</td>
        <td class="monthly-products">${allProducts}</td>
        <td class="monthly-original">${allOriginal.toFixed(2)} ريال</td>
        <td class="monthly-discount">${allDiscount.toFixed(2)} ريال</td>
        <td class="monthly-final">${allFinal.toFixed(2)} ريال</td>
      </tr>
    `;
  } catch (e) {
    console.error("Error loading monthly sales stats:", e);
  }
}
// تشغيل الدوال عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", function() {
  loadAllTimeStats();
  loadFilteredStats();
  loadMonthlySalesStats();
// زر ترتيب الجدول
const sortBtn = document.getElementById('sortMonthsBtn');
if (sortBtn) {
  sortBtn.addEventListener('click', function() {
    isSortedByOrders = !isSortedByOrders;
    this.textContent = isSortedByOrders ? '🔼 ترتيب أصلي' : '🔽 ترتيب حسب الأعلى';
    loadMonthlySalesStats();
  });
}
  // تحديث الإحصائيات عند تغيير الفلتر
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      setTimeout(() => {
        loadAllTimeStats();
        loadFilteredStats();
      }, 100);
    });
  });
  
});


/* ---- Extracted inline script block 3 (original order preserved) ---- */
NoshiAuth.guard().catch(()=>{});
