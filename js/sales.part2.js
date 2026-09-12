/* =========================================================
   FILE: js/sales.part2.js
   SOURCE: inline script #2 from sales.html
   REFACTOR RULE: extracted in the SAME parser position.
   No business logic, storage key, or execution order changed.
========================================================= */
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
