/* =========================================================
   FILE: js/expenses.js
   SOURCE: inline script #1 from expenses.html
   REFACTOR RULE: extracted in the SAME parser position.
   No business logic, storage key, or execution order changed.
========================================================= */
// ====== بيانات أساسية ======
    const DEFAULT_ITEMS = [
      {name:'زيت', category:'مواد خام'},
      {name:'زيت زيتون', category:'مواد خام'},
      {name:'بخاخ الزيت', category:'مواد خام'},	  	  
      {name:'دقيق', category:'مواد خام'},
      {name:'حليب بودرة', category:'مواد خام'},	  
      {name:'سكر', category:'مواد خام'},
      {name:'سكر بني', category:'مواد خام'},
      {name:'فلادلفيا', category:'مواد خام'},
      {name:'بكنج بودر', category:'مواد خام'},
      {name:'فانيلا', category:'مواد خام'},
      {name:'زبادي', category:'مواد خام'},
      {name:'جبن كيري', category:'مواد خام'},	  
      {name:'جبن سالم', category:'مواد خام'},
      {name:'جبن مالح', category:'مواد خام'},	  
      {name:'قشطة', category:'مواد خام'},
      {name:'زبدة', category:'مواد خام'},	  
      {name:'حليب نستله', category:'مواد خام'},
      {name:'بسكوت دايجستف', category:'مواد خام'},	
      {name:'مربى', category:'مواد خام'},
      {name:'عسل', category:'مواد خام'},
      {name:'صوص شوكليت', category:'مواد خام'},	
      {name:'شوكليت', category:'مواد خام'},		  
      {name:'قرفة', category:'مواد خام'},
      {name:'عين الجمل', category:'مواد خام'},
      {name:'تفاح', category:'مواد خام'},
      {name:'ليمون', category:'مواد خام'},
      {name:'برتقال', category:'مواد خام'},
	  
	  
      {name:'علب', category:'بلاستيكات'},
      {name:'قاعدة', category:'بلاستيكات'},
      {name:'قالب كيك', category:'بلاستيكات'},	  	  
	  
	  
      {name:'صحون تقديم', category:'تغليف'},
      {name:'طباعة استكرات', category:'تغليف'},
      {name:'أكياس', category:'تغليف'},	  
      {name:'قطع تزيين ( زينه )', category:'تغليف'},
	  
    ];
    const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth() + 1; // 1..12
    // بيانات الصفحة بعد تحميلها من البيانات المحمّلة
    // الهيكل: expensesData[YYYY-MM] = [{id, date, item, category, amount, note}]
    let expensesData = {};
    let allItems = [];
    let salesData = {};

// مراجع DOM
    const itemSelect = document.getElementById('itemSelect');
    const categorySelect = document.getElementById('categorySelect');
    const amountInput = document.getElementById('amountInput');
    const dateInput = document.getElementById('dateInput');
    const noteInput = document.getElementById('noteInput');
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const clearFormBtn = document.getElementById('clearFormBtn');
    const monthTitle = document.getElementById('monthTitle');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    const expensesTableBody = document.querySelector('#expensesTable tbody');
    const monthTotalEl = document.getElementById('monthTotal');

    const salesSumEl = document.getElementById('salesSum');
    const expensesSumEl = document.getElementById('expensesSum');
    const netProfitEl = document.getElementById('netProfit');

    // Charts
    let pieChart, barChart, lineChart;

    // إعداد أولي: لا تبدأ الصفحة قبل اكتمال قراءة IndexedDB
    document.addEventListener("DOMContentLoaded", initializeExpensesPage);

    async function initializeExpensesPage(){
      try {
        if(!window.NoshiDB){
          throw new Error("ملف db.js غير مربوط أو لم يتم تحميله");
        }
        if (window.NoshiAuth && typeof NoshiAuth.guard === "function") {
          await NoshiAuth.guard();
        }

        const live = await NoshiDB.getMany(
          ["expensesData", "expenseItems", "salesData"],
          { expensesData: {}, expenseItems: [], salesData: {} }
        );

        expensesData = isPlainObject(live.expensesData) ? live.expensesData : {};
        allItems = Array.isArray(live.expenseItems) ? live.expenseItems : [];
        salesData = isPlainObject(live.salesData) ? live.salesData : {};

        // نفس السلوك السابق: إنشاء البنود الافتراضية فقط إذا لم توجد بنود محفوظة
        if(allItems.length === 0){
          allItems = DEFAULT_ITEMS.map(item => ({...item}));
          await NoshiDB.set("expenseItems", allItems);
        }

        initForm();
        bindMonthNav();
        refreshUI();
      } catch(error) {
        console.error("فشل تحميل بيانات المصروفات:", error);
        if (error && (error.status === 401 || error.message === "unauthorized")) return;
        alert("تعذر تحميل بيانات المصروفات الآن. لم يتم تعديل أي بيانات. تحقق من الاتصال ثم أعد المحاولة.");
      }
    }

    function isPlainObject(value){
      return value !== null && typeof value === "object" && !Array.isArray(value);
    }

    async function replaceExpensesData(nextData){
      await NoshiDB.set("expensesData", nextData);
      expensesData = nextData;
    }

    // ====== دوال واجهة ======
    function initForm(){
      // تعبئة القائمة
      renderItemOptions();
      // التاريخ اليوم
      dateInput.valueAsDate = new Date();

      addExpenseBtn.addEventListener('click', onAddExpense);
      clearFormBtn.addEventListener('click', clearForm);

      // عند اختيار بند من القائمة نضبط التصنيف الافتراضي إن وجد
      itemSelect.addEventListener('change', () => {
        const found = allItems.find(i => i.name === itemSelect.value);
        if(found){ categorySelect.value = found.category || 'أخرى'; }
      });

      // التفويض للأزرار (قائمة iOS)
      if(expensesTableBody){
        expensesTableBody.addEventListener('click', (e)=>{
          const btn = e.target.closest('button');
          if(!btn) return;
          if(btn.classList.contains('action-menu')){
            openSheet(btn.dataset.key, parseInt(btn.dataset.idx,10));
          }
        }, {passive:true});
      }
    }

    function bindMonthNav(){
      prevMonthBtn.addEventListener('click', () => changeMonth(-1));
      nextMonthBtn.addEventListener('click', () => changeMonth(1));
    }

    function changeMonth(offset){
      currentMonth += offset;
      if(currentMonth > 12){ currentMonth = 1; currentYear++; }
      if(currentMonth < 1){ currentMonth = 12; currentYear--; }
      refreshUI();
    }

    function refreshUI(){
      const key = monthKey(currentYear, currentMonth);
      monthTitle.textContent = `${monthNames[currentMonth-1]} ${currentYear}`;
      renderTable(key);
      renderSummaryAndProfit(key);
      renderCharts(key);
    }

// ====== جدول المصروفات ======
function renderTable(key){
  const rows = (expensesData[key]||[]);
  expensesTableBody.innerHTML = '';
  let sum = 0;

  rows.forEach((row, idx) => {
    sum += Number(row.amount) || 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>${row.date||'-'}</td>
      <td>${row.item||'-'}</td>
      <td>${row.category||'-'}</td>
      <td>${Number(row.amount).toFixed(2)}</td>
      <td>${row.note||''}</td>
      <td class="actions">
        <button class="btn ghost action-menu" type="button" data-key="${key}" data-idx="${idx}">⋯</button>
      </td>`;
    expensesTableBody.appendChild(tr);
  });

  monthTotalEl.textContent = sum.toFixed(2) + ' ريال';
}

// ====== الملخص وصافي الربح (من salesData) ======
    function renderSummaryAndProfit(key){
      const expensesSum = sumExpenses(key);
      const salesSum = sumSalesFromIndexedDB(key);
      const net = salesSum - expensesSum;
      salesSumEl.textContent = salesSum.toFixed(2) + ' ر.س';
      expensesSumEl.textContent = expensesSum.toFixed(2) + ' ر.س';
      netProfitEl.textContent = net.toFixed(2) + ' ر.س';
    }

    function sumExpenses(key){
      return (expensesData[key]||[]).reduce((a,b)=>a + (Number(b.amount)||0), 0);
    }
    // يجمع totalAfter لكل الطلبات في الشهر المحدد من salesData المحمّلة من البيانات المحمّلة
function sumSalesFromIndexedDB(key) {
  const orders = Array.isArray(salesData[key]) ? salesData[key] : [];

  return orders.reduce((sum, order) => {
    const orderTotal = parseFloat(order?.totalAfter) || 0;
    const orderItems = Array.isArray(order?.items) ? order.items : [];

    // خصم تكاليف التوصيل (مندوب) كما في order.html
    const deliveryCostItem = orderItems.find(item => item?.name === "مندوب");
    const deliveryAmount = deliveryCostItem
      ? (Number(deliveryCostItem.qty) || 0) * (Number(deliveryCostItem.price) || 0)
      : 0;

    return sum + (orderTotal - deliveryAmount);
  }, 0);
}

    // ====== الرسوم البيانية ======
    function renderCharts(key){
      // Charts are optional UI. If the external Chart.js CDN is unavailable,
      // the expenses table and business data must continue working normally.
      if (typeof window.Chart !== "function") {
        console.warn("Chart.js غير متاح؛ تم تجاوز الرسوم فقط بدون تعطيل المصروفات.");
        return;
      }
      const rows = (expensesData[key]||[]);
      const byItem = aggregateBy(rows, 'item');
      const byCat = aggregateBy(rows, 'category');
      const lineSeries = monthlyTotalsLastN(6); // آخر 6 شهور

      // Pie
      const pieData = {
        labels: Object.keys(byItem),
        datasets: [{ data: Object.values(byItem) }]
      };
      // Bar
      const barData = {
        labels: Object.keys(byCat),
        datasets: [{ label:'إجمالي الفئة', data: Object.values(byCat) }]
      };
      // Line
      const lineData = {
        labels: lineSeries.labels,
        datasets: [{ label:'إجمالي المصروفات', data: lineSeries.values }]
      };

      if(pieChart) pieChart.destroy();
      if(barChart) barChart.destroy();
      if(lineChart) lineChart.destroy();

      pieChart = new Chart(document.getElementById('pieCanvas'), { type:'pie', data: pieData });
      barChart = new Chart(document.getElementById('barCanvas'), { type:'bar', data: barData, options:{scales:{y:{beginAtZero:true}}} });
      lineChart = new Chart(document.getElementById('lineCanvas'), { type:'line', data: lineData, options:{scales:{y:{beginAtZero:true}}} });
    }

    function aggregateBy(rows, key){
      return rows.reduce((acc,row)=>{
        const k = row[key]||'غير محدد';
        acc[k] = (acc[k]||0) + (Number(row.amount)||0);
        return acc;
      },{});
    }

    // يعيد مجموع كل شهر آخر N شهور (للمخطط الخطي)
    function monthlyTotalsLastN(n){
      const labels = [];
      const values = [];
      for(let i=n-1;i>=0;i--){
        const d = new Date();
        d.setMonth(d.getMonth()-i);
        const yy = d.getFullYear();
        const mm = d.getMonth()+1;
        const k = monthKey(yy, mm);
        labels.push(`${monthNames[mm-1]} ${String(yy).slice(-2)}`);
        values.push(sumExpenses(k));
      }
      return {labels, values};
    }

    // ====== إضافة/تعديل/حذف عبر الشيت والمودال ======
function clearForm(resetCat=true){
      amountInput.value='';
      noteInput.value='';
      if(resetCat) categorySelect.value='مواد خام';
      // احتفظ بالتاريخ الحالي
    }

    // ====== أدوات مساعدة ======
    function monthKey(y, m){ return `${y}-${String(m).padStart(2,'0')}`; }
    function cryptoRandomId(){ if(window.crypto?.randomUUID) return crypto.randomUUID(); return 'id-' + Math.random().toString(36).slice(2,10); }
    function mergeItems(def,saved){ const map = new Map(); [...def, ...saved].forEach(it=>{ map.set(it.name, it); }); return Array.from(map.values()); }
async function upsertItem(item){
  const items = allItems.map(savedItem => ({...savedItem}));
  const idx = items.findIndex(i => i.name === item.name);

  if(idx > -1){
    items[idx] = {...item};
  } else {
    items.push({...item});
  }

  await NoshiDB.set("expenseItems", items);
  allItems = items;
  renderItemOptions();
}
    function renderItemOptions(){ itemSelect.innerHTML = ''; allItems.forEach(i=>{ const opt = document.createElement('option'); opt.value = i.name; opt.textContent = i.name; itemSelect.appendChild(opt); }); const first = allItems[0]; if(first) categorySelect.value = first.category||'أخرى'; }

    // ====== iOS Action Sheet + Modal ======
    let curKey=null, curIdx=null;
    const bodyEl = document.body;
    const sheet = document.getElementById('actionSheet');
    const sheetBg = document.getElementById('sheetBg');
    const sheetEdit = document.getElementById('sheetEdit');
    const sheetDelete = document.getElementById('sheetDelete');
    const sheetCancel = document.getElementById('sheetCancel');

    const editBg = document.getElementById('editBg');
    const editModal = document.getElementById('editModal');
    const editItem = document.getElementById('editItem');
    const editCat = document.getElementById('editCat');
    const editAmount = document.getElementById('editAmount');
    const editDate = document.getElementById('editDate');
    const editNote = document.getElementById('editNote');
    const editSave = document.getElementById('editSave');
    const editClose = document.getElementById('editClose');

    // ===== مودال إضافة بند =====
    const newItemBtn = document.getElementById('openNewItemModal');
    const newItemBg = document.getElementById('newItemBg');
    const newItemName = document.getElementById('newItemName');
    const newItemCat = document.getElementById('newItemCat');
    const saveNewItem = document.getElementById('saveNewItem');
    const cancelNewItem = document.getElementById('cancelNewItem');

    // ===== مودال حذف بند =====
    const openDeleteItemModal = document.getElementById('openDeleteItemModal');
    const deleteItemBg = document.getElementById('deleteItemBg');
    const deleteItemSelect = document.getElementById('deleteItemSelect');
    const confirmDeleteItem = document.getElementById('confirmDeleteItem');
    const cancelDeleteItem = document.getElementById('cancelDeleteItem');
	
	// ===== مودال حذف سجل مصروف =====
const deleteExpenseBg =
  document.getElementById('deleteExpenseBg');

const deleteExpenseText =
  document.getElementById('deleteExpenseText');

const confirmDeleteExpense =
  document.getElementById('confirmDeleteExpense');

const cancelDeleteExpense =
  document.getElementById('cancelDeleteExpense');

    // ===== دالة إغلاق جميع المودالات =====
    function closeAllModals() {
      bodyEl.classList.remove(
        'show-add-item-modal',
        'show-delete-item-modal',
        'show-edit-expense-modal',
	    'show-delete-expense-modal',	
        'sheet-open'
      );
      unlockScroll();
    }

    function openSheet(key, idx){
      curKey = key;
      curIdx = idx;
      // أغلق أي مودالات مفتوحة أولاً
      closeAllModals();
      bodyEl.classList.add('sheet-open');
      lockScroll();
    }

    function closeSheet(){
      bodyEl.classList.remove('sheet-open');
      unlockScroll();
    }

    function lockScroll(){ document.documentElement.style.overflow='hidden'; document.body.style.overflow='hidden'; }
    function unlockScroll(){ document.documentElement.style.overflow=''; document.body.style.overflow=''; }

    function openEdit(row){
      // أغلق جميع المودالات أولاً
      closeAllModals();
      
      editItem.value = row.item||'';
      editCat.value = row.category||'أخرى';
      editAmount.value = row.amount||'';
      editDate.value = row.date||'';
      editNote.value = row.note||'';
      
      // استخدم الكلاس الجديد الخاص بالتعديل
      bodyEl.classList.add('show-edit-expense-modal');
      lockScroll();
    }

    function closeEdit(){
      bodyEl.classList.remove('show-edit-expense-modal');
      unlockScroll();
      curKey=null; curIdx=null;
    }

    [sheetBg, sheetCancel].forEach(el=> el.addEventListener('click', closeSheet, {passive:true}));
    
    sheetEdit.addEventListener('click', ()=>{ 
      const row = (expensesData[curKey]||[])[curIdx]; 
      if(!row){ 
        closeSheet(); 
        return; 
      } 
      closeAllModals(); // أغلق كل شيء أولاً
      setTimeout(() => openEdit(row), 50); // تأخير بسيط للتأكد
    }, {passive:true});
sheetDelete.addEventListener('click', () => {
  if (curKey === null || curIdx === null) {
    return;
  }

  const rows = Array.isArray(expensesData[curKey])
    ? expensesData[curKey]
    : [];

  const row = rows[curIdx];

  if (!row) {
    closeSheet();
    return;
  }

  const itemName = row.item || 'بدون اسم';
  const amount = Number(row.amount || 0);

  deleteExpenseText.textContent =
    `هل تريد حذف مصروف ${itemName} بمبلغ ${amount.toFixed(2)} ريال؟`;

  closeSheet();

  bodyEl.classList.add('show-delete-expense-modal');
  lockScroll();
});

function closeDeleteExpenseModal() {
  bodyEl.classList.remove('show-delete-expense-modal');
  unlockScroll();

  curKey = null;
  curIdx = null;
}

[deleteExpenseBg, cancelDeleteExpense].forEach((element) => {
  element.addEventListener('click', () => {
    closeDeleteExpenseModal();
  });
});

confirmDeleteExpense.addEventListener('click', async () => {
  if (curKey === null || curIdx === null) {
    closeDeleteExpenseModal();
    return;
  }

  const deleteKey = curKey;
  const deleteIndex = curIdx;

  const currentRows = Array.isArray(expensesData[deleteKey])
    ? expensesData[deleteKey]
    : [];

  const deletedExpense = currentRows[deleteIndex];

  if (!deletedExpense) {
    closeDeleteExpenseModal();
    return;
  }

  const nextRows = [...currentRows];
  nextRows.splice(deleteIndex, 1);

  const nextExpensesData = {
    ...expensesData,
    [deleteKey]: nextRows
  };

  confirmDeleteExpense.disabled = true;
  confirmDeleteExpense.textContent = 'جاري الحذف...';

  try {
    await replaceExpensesData(nextExpensesData);

    refreshUI();

    bodyEl.classList.remove('show-delete-expense-modal');
    unlockScroll();

    curKey = null;
    curIdx = null;

    showToast('✅ تم حذف المصروف بنجاح');
  } catch (error) {
    console.error(
      'فشل حذف المصروف من البيانات المحمّلة:',
      error
    );

    alert(
      'تعذر حفظ الحذف. لم يتم حذف المصروف من قاعدة البيانات.'
    );
  } finally {
    confirmDeleteExpense.disabled = false;
    confirmDeleteExpense.textContent = 'حذف';
  }
});

    editSave.addEventListener('click', async ()=>{
      const editKey = curKey;
      const editIndex = curIdx;
      const rows = Array.isArray(expensesData[editKey]) ? expensesData[editKey] : [];
      const row = rows[editIndex];

      if(!row){ closeEdit(); return; }

      const amount = parseFloat(editAmount.value||'0');
      if(!(amount>0)){ alert('مبلغ غير صالح'); return; }

      const nextRows = [...rows];
      nextRows[editIndex] = {
        ...row,
        item: (editItem.value||row.item).trim(),
        category: editCat.value||'أخرى',
        amount: amount,
        date: editDate.value||row.date,
        note: editNote.value||''
      };

      const nextExpensesData = {...expensesData, [editKey]: nextRows};
      editSave.disabled = true;

      try {
        await replaceExpensesData(nextExpensesData);
        closeEdit();
        refreshUI();
        showToast('✅ تم تعديل المصروف بنجاح');
      } catch(error) {
        console.error("فشل تعديل المصروف في IndexedDB:", error);
        alert("تعذر حفظ التعديل. بقي السجل السابق كما هو.");
      } finally {
        editSave.disabled = false;
      }
    });
    
    [editClose, editBg].forEach(el => el.addEventListener('click', closeEdit, {passive:true}));

    // ===== مودال إضافة بند جديد =====
    newItemBtn.addEventListener('click', ()=> {
      closeAllModals(); // أغلق كل شيء أولاً
      setTimeout(() => {
        bodyEl.classList.add('show-add-item-modal');
      }, 50);
    });

    [newItemBg, cancelNewItem].forEach(el => el.addEventListener('click', ()=>{
      bodyEl.classList.remove('show-add-item-modal');
    }));
    saveNewItem.addEventListener('click', async ()=>{
      const name = newItemName.value.trim();
      const cat = newItemCat.value;
      if(!name){ alert('فضلاً أدخل اسم البند'); return; }

      saveNewItem.disabled = true;

      try {
        await upsertItem({name, category:cat});
        itemSelect.value = name;
        categorySelect.value = cat;

        bodyEl.classList.remove('show-add-item-modal');
        newItemName.value = '';
        showToast('✅ تم إضافة البند الجديد');
      } catch(error) {
        console.error("فشل حفظ بند المصروف في IndexedDB:", error);
        alert("تعذر حفظ البند الجديد. لم يتم تعديل البيانات.");
      } finally {
        saveNewItem.disabled = false;
      }
    });

    // ===== مودال حذف بند =====
    openDeleteItemModal.addEventListener('click', ()=>{
      closeAllModals(); // أغلق كل شيء أولاً
      
      setTimeout(() => {
        deleteItemSelect.innerHTML = '';
        const items = allItems;
        items.forEach(i=>{
          const opt = document.createElement('option');
          opt.value = i.name;
          opt.textContent = i.name;
          deleteItemSelect.appendChild(opt);
        });

        bodyEl.classList.add('show-delete-item-modal');
      }, 50);
    });

    [deleteItemBg, cancelDeleteItem].forEach(el => el.addEventListener('click', ()=>{
      bodyEl.classList.remove('show-delete-item-modal');
    }));
    confirmDeleteItem.addEventListener('click', async ()=>{
      const name = deleteItemSelect.value;
      if(!name){ alert('اختر بنداً أولاً'); return; }

      const items = allItems.filter(i => i.name !== name);
      confirmDeleteItem.disabled = true;

      try {
        await NoshiDB.set("expenseItems", items);
        allItems = items;
        renderItemOptions();

        bodyEl.classList.remove('show-delete-item-modal');
        showToast(`🗑 تم حذف البند: ${name}`);
      } catch(error) {
        console.error("فشل حذف بند المصروف من البيانات المحمّلة:", error);
        alert("تعذر حفظ حذف البند. بقيت البيانات السابقة كما هي.");
      } finally {
        confirmDeleteItem.disabled = false;
      }
    });

    // إغلاق بـ Escape
    document.addEventListener('keydown', (ev)=>{
      if(ev.key === 'Escape'){
        closeAllModals();
      }
    });

	function showToast(msg){
      const old = document.getElementById('toastMsg');
      if(old) old.remove();

      const div = document.createElement('div');
      div.id = 'toastMsg';
      div.textContent = msg;
      div.style.position = 'fixed';
      div.style.bottom = '60px';
      div.style.left = '50%';
      div.style.transform = 'translateX(-50%)';
      div.style.background = 'rgba(0,0,0,0.8)';
      div.style.color = '#fff';
      div.style.padding = '10px 16px';
      div.style.borderRadius = '12px';
      div.style.fontSize = '0.95rem';
      div.style.zIndex = 10000;
      div.style.opacity = '0';
      div.style.transition = 'opacity 0.3s ease';
      document.body.appendChild(div);

      // اظهر الرسالة
      requestAnimationFrame(()=>{ div.style.opacity='1'; });
      setTimeout(()=>{
        div.style.opacity='0';
        setTimeout(()=>div.remove(),800);
      },2500);
    }
    async function onAddExpense(){
      const item = itemSelect.value;
      const category = categorySelect.value || 'أخرى';
      const amount = parseFloat(amountInput.value||'0');
      const dateVal = dateInput.value || new Date().toISOString().slice(0,10);
      const note = noteInput.value.trim();

      if(!item){ alert('فضلاً أدخل اسم البند'); return; }
      if(!(amount>0)){ alert('فضلاً أدخل مبلغ صحيح'); return; }

      const key = monthKey(currentYear, currentMonth);
      const currentRows = Array.isArray(expensesData[key]) ? expensesData[key] : [];
      const newExpense = {
        id: cryptoRandomId(),
        date: dateVal,
        item,
        category,
        amount,
        note
      };

      const nextExpensesData = {
        ...expensesData,
        [key]: [...currentRows, newExpense]
      };

      addExpenseBtn.disabled = true;

      try {
        await replaceExpensesData(nextExpensesData);
        showToast(`✅ تم إضافة المصروف: "${item}" بنجاح!`);
        clearForm(false);
        refreshUI();
      } catch(error) {
        console.error("فشل إضافة المصروف إلى IndexedDB:", error);
        alert("تعذر حفظ المصروف. لم تتم إضافة أي بيانات.");
      } finally {
        addExpenseBtn.disabled = false;
      }
    }


document.addEventListener("input", e => {
  const el = e.target;
  if (!el.matches("input[data-numeric]")) return;

  el.value = el.value
    // أرقام عربية → إنجليزية
    .replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)])
    // فاصلة عربية أو فاصلة عادية → نقطة
    .replace(/[٫،]/g, ".")
    // منع أكثر من فاصلة عشرية
    .replace(/(\..*)\./g, "$1");
});
