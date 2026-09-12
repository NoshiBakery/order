/* =========================================================
   FILE: js/sales.js
   SOURCE: inline script #1 from sales.html
   REFACTOR RULE: extracted in the SAME parser position.
   No business logic, storage key, or execution order changed.
========================================================= */
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
        console.error("تعذر تنفيذ عملية التخزين:", error);
        alert("تعذر تحميل أو حفظ البيانات الآن. لم يتم حذف أي بيانات. تحقق من الاتصال ثم أعد المحاولة.");
      }

      function showPreferenceSaveWarning(error) {
        console.warn("تعذر حفظ تفضيل حجم الخط على هذا الجهاز:", error);
      }

      async function ensureDBReady() {
        if (!window.NoshiDB) {
          throw new Error("ملف db.js غير مربوط أو لم يتم تحميله");
        }
      }

      async function initStorageData() {
        await ensureDBReady();
        if (window.NoshiAuth && typeof NoshiAuth.guard === "function") {
          await NoshiAuth.guard();
        }

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
      function applyFontSize(size, persist = true) {
        // تحديث المتغيرات CSS
        document.documentElement.style.setProperty('--table-font-size', `${size}px`);
        document.documentElement.style.setProperty('--table-padding', `${size * 0.75}px`);
        
        // تحديث العرض في النافذة
        currentFontSizeElement.textContent = size;
        
        // تحديث معاينة الخط
        fontPreviewText.style.fontSize = `${size}px`;
        
        // حفظ الإعداد
        currentFontSize = size;
        if (persist) NoshiDB.set("salesTableFontSize", size).catch(showPreferenceSaveWarning);
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

      // تهيئة العرض فقط؛ لا نكتب أي شيء لمجرد فتح الصفحة.
      applyFontSize(currentFontSize, false);

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
