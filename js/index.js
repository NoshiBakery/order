/* =========================================================
   FILE: js/index.js
   SOURCE PAGE: index.html
   PURPOSE: Page-specific JavaScript extracted from the HTML.
   DATA SAFETY: This is a structural refactor only; field names,
   storage keys, save ordering, and business rules must remain compatible.
   MAINTENANCE RULE: Shared services stay in their existing shared files.
========================================================= */


/* ---- Extracted inline script block 1 (original order preserved) ---- */
// البيانات الأساسية
  const cakes = [
    {name: "كيكة ليمون", price: 34, img:"images/thumbs/lemon.webp"},
    {name: "كيكة سينابون", price: 38, img:"images/thumbs/cinnamon1.webp"},
    {name: "كيكة برتقال", price: 36, img:"images/thumbs/orange.webp"},
    {name: "كيكة رمل", price: 45, img:"images/thumbs/sand.webp"},
    {name: "كيكة كوكيز", price: 60, img:"images/thumbs/cookies.webp"},
    {name: "كيكة ماربل", price: 50, img:"images/thumbs/marble.webp"},
    {name: "كيكة دايجستف", price: 50, img:"images/thumbs/digestive.webp"},
    {name: "كيك دايجستف ميني", price: 60, img:"images/thumbs/digestive-mini.webp"},		
    {name: "كيكة تمر", price: 45, img:"images/thumbs/dates.webp"},
    {name: "قرص عقيلي", price: 39, img:"images/thumbs/aqeeli.webp"},
    {name: "كيكة شوكليت", price: 50, img:"images/thumbs/choco.webp"},
    {name: "ميني كيك ليمون", price: 60, img:"images/thumbs/minilemon.webp"},
    {name: "كيكة الكيري", price: 45, img:"images/thumbs/kiri.webp"},
    {name: "ماتيلدا كيك", price: 75, img:"images/thumbs/mitlda.webp"}
  ];

  const sweets = [
    {name: "خلية قرفة", price: 28, img:"images/thumbs/honey1.webp"},
    {name: "خلية سمسم", price: 28, img:"images/thumbs/honey2.webp"},
    {name: "خلية سميد", price: 28, img:"images/thumbs/honey3.webp"},
    {name: "تاوة نوشي", price: 38, img:"images/thumbs/tawa.webp"},
    {name: "تاوة نوشي ميني", price: 45, img:"images/thumbs/tawamini.webp"},
    {name: "سينابون", price: 60, img:"images/thumbs/cinnabon.webp"},
    {name: "كرات الشعيرية", price: 65, img:"images/thumbs/shariya.webp"},
    {name: "فطيرة حلزونية", price: 40, img:"images/thumbs/spiral.webp"},
    {name: "تارت تفاح", price: 60, img:"images/thumbs/tart.webp"},
    {name: "تارت تشيز التمر", price: 60, img:"images/thumbs/tartdate.webp"},
    {name: "بوب كيك ليمون", price: 50, img:"images/thumbs/popcakelemon.webp"},
    {name: "بوب كيك شوكليت", price: 50, img:"images/thumbs/popcakechoco.webp"},
    {name: "بسبوسة", price: 60, img:"images/thumbs/basbousa.webp"},
    {name: "تشيز القشد", price: 55, img:"images/thumbs/chesedate.webp"},
    {name: "فطيرة المربى", price: 50, img:"images/thumbs/jam.webp"},
    {name: "وردات الشوكولاتة", price: 60, img:"images/thumbs/rose.webp"},
    {name: "تارت البيكان", price: 65, img:"images/thumbs/bekan.webp"},		
  ];

  const extras = [
    {name: "صحن تقديم", price: 10, img:"images/thumbs/plate.webp"},
    {name: "مندوب", price: 10, img:"images/thumbs/delivery.webp"},	    
	{name: "مندوب", price: 25, img:"images/thumbs/delivery.webp"},
	{name: "شريط عبارة", price: 5, img: "images/thumbs/phrase.webp"},
    {name: "تكلفة إضافية", price: 5, img: "images/thumbs/extra.webp"}
  ];
  // البيانات الأساسية
  const mandoubs = [
    {name: "ماهر", id: 1},
    {name: "اياد", id: 2},
    {name: "عماد", id: 3},
    {name: "عبد الملك", id: 4},
    {name: "عبدالرحمن", id: 5}
  ];

  // المتغيرات العامة
  let globalNote = "";
  let lastGlobalNoteApplied = "";
  let cart = [];
  let total = 0;
  let generalDiscount = 0;
  let paymentMethod = null;
  let currentEditIndex = null;
  let clients = [];
  let selectedMandoub = null; // هنا مرة واحدة فقط
  let deliveryPlan = null;
  let deliveryPlanSignature = "";

async function initIndexStorage() {
  if (!window.NoshiDB) {
    throw new Error("ملف db.js غير مربوط أو لم يتم تحميله");
  }

  clients = await NoshiDB.get("clients", []);

  if (!Array.isArray(clients)) {
    clients = [];
  }
}

  // العناصر الرئيسية
  const cakesContainer = document.getElementById("cakesContainer");
  const sweetsContainer = document.getElementById("sweetsContainer");
  const extrasContainer = document.getElementById("extrasContainer");
  const cartList = document.getElementById("cartList");
  const totalElAmount = document.querySelector("#total .amount");
  const msgBox = document.getElementById("msgBox");
  const clearCartBtn = document.getElementById("clearCartBtn");
  const copyOrderBtn = document.getElementById("copyOrderBtn");
  const discountInput = document.getElementById("discountInput");
  const applyDiscountBtn = document.getElementById("applyDiscountBtn");
  const editModal = document.getElementById("editModal");
  const editQtyInput = document.getElementById("editQty");
  const editPriceInput = document.getElementById("editPrice");
  const editDiscountInput = document.getElementById("editDiscount");
  const editNotesInput = document.getElementById("editNotes");
  const clientSelect = document.getElementById("clientSelect");

  // الأصوات
  const addSound = document.getElementById("addSound");
  const removeSound = document.getElementById("removeSound");
  const copySound = document.getElementById("copySound");
  const discountSound = document.getElementById("discountSound");
  const approveSound = document.getElementById("approveSound");
  const paymentSound = document.getElementById("paymentSound");
  const noteSound = document.getElementById("noteSound");

// تهيئة الصفحة
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await NoshiAuth.guard();
    await initIndexStorage();
  } catch (error) {
    console.error("فشل تحميل بيانات IndexedDB:", error);
    alert("حدث خطأ أثناء تحميل بيانات IndexedDB. تأكد من وجود db.js واستيراد البيانات.");
    return;
  }
  renderProducts(cakes, cakesContainer);
  renderProducts(sweets, sweetsContainer);
  renderProducts(extras, extrasContainer);
  loadClientsToSelect();
  setupEventListeners();
  clientPhoneModal = createClientPhoneModal();
  clientSelect.addEventListener("change", checkClientPhone);
  
  // ✅ إذا فيه طلب قديم يتم تحريره
  const editingOrder = await NoshiDB.get("editingOrder", null);
  if (editingOrder) {
    cart = editingOrder.order.items.map(i => ({
      name: i.name,
      originalName: i.originalName || i.name,
      price: i.price,
      originalPrice: i.price,
      qty: i.qty,
      discount: i.discount || 0,
      notes: i.notes || "",
      customName: i.customName || "",
      img: i.img || ([...cakes, ...sweets, ...extras].find(p => p.name === (i.originalName || i.name))?.img || "")
    }));

    // ✅ العميل + الدفع + المندوب
    clientSelect.value = editingOrder.order.client || "";
    paymentMethod = editingOrder.order.paymentMethod || null;
    selectedMandoub = editingOrder.order.mandoub || null;
    if (Array.isArray(editingOrder.order.deliveries) && editingOrder.order.deliveries.length > 1) {
      // نحفظ التوزيع القديم ونحوّله إلى وحدات عند فتح مخطط التقسيم.
      const units = expandDeliveryUnits();
      const availableByItem = new Map();
      units.forEach(u => {
        if (!availableByItem.has(u.itemIndex)) availableByItem.set(u.itemIndex, []);
        availableByItem.get(u.itemIndex).push(u.key);
      });
      deliveryPlan = editingOrder.order.deliveries.map((slot, slotIndex) => {
        const keys = [];
        (slot.items || []).forEach(si => {
          const itemIndex = cart.findIndex(ci => String(ci.originalName || ci.name) === String(si.originalName || si.name));
          const pool = availableByItem.get(itemIndex) || [];
          const take = Math.max(0, Math.floor(Number(si.qty || si.quantity || 0)));
          keys.push(...pool.splice(0, take));
        });
        return {
          id: slot.id || `slot-${slotIndex}`,
          deliveryDate: String(slot.deliveryDate || '').replace(' ', 'T'),
          mandoub: slot.mandoub || slot.deliveryPerson || '__UNASSIGNED__',
          deliveryFee: Number(slot.deliveryFee || 0),
          delivered: !!slot.delivered,
          deliveryPaid: !!slot.deliveryPaid,
          unitKeys: keys
        };
      });
      deliveryPlanSignature = cartDeliverySignature();
      updateSplitDeliverySummary();
    }

    if (selectedMandoub) {
      document.getElementById("selectMandoubBtn").textContent = "🚚 " + selectedMandoub;
    }

    // ✅ استرجاع الخصم العام
    generalDiscount = Number(editingOrder.order.generalDiscount || 0);
    if (typeof discountInput !== "undefined" && discountInput) {
      discountInput.value = generalDiscount > 0 ? generalDiscount : "";
    }

// ✅ استرجاع الملاحظة العامة عند تحرير الفاتورة
var noteVal = (editingOrder.order && editingOrder.order.globalNote) ? editingOrder.order.globalNote : "";
var globalNoteInputEl2 = document.getElementById("globalNoteInput");
if (globalNoteInputEl2) globalNoteInputEl2.value = noteVal;

// نخلي المتغير نفسه يتحدث (إذا تستخدمه لاحقًا)
if (typeof globalNote !== "undefined") {
  globalNote = noteVal;
}


    // ✅ تحديث السلة بعد استرجاع الخصم/الملاحظة
    updateCart();

    // ✅ تثبيت وقت/تاريخ التسليم عند التعديل (تعبئة تلقائية)
const deliveryInputEl = document.getElementById("deliveryDateInput");
if (deliveryInputEl && editingOrder.order && editingOrder.order.deliveryDate) {
  deliveryInputEl.value = String(editingOrder.order.deliveryDate).replace(" ", "T");
}

// ✅ مهم بعد تعبئة وقت التسليم تلقائياً
updateApproveButtonState();
  } else {
    // طلب مقبول من لوحة الموقع الخارجي: نعبّي النموذج فقط، ويبقى المندوب وطريقة الدفع للمستخدم.
    const incomingDraft = await NoshiDB.get("incomingOrderDraft", null);
    if (incomingDraft && Array.isArray(incomingDraft.items)) {
      cart = incomingDraft.items.map(i => ({
        name: i.name, originalName: i.originalName || i.name,
        price: Number(i.price || 0), originalPrice: Number(i.originalPrice ?? i.price ?? 0),
        qty: Math.max(1, Number(i.qty || 1)), discount: Number(i.discount || 0),
        notes: i.notes || "", notesLocked: false, customName: i.customName || "",
        img: i.img || ([...cakes, ...sweets, ...extras].find(p => p.name === (i.originalName || i.name))?.img || "")
      }));
      clientSelect.value = incomingDraft.clientName || "";
      const deliveryInput = document.getElementById("deliveryDateInput");
      if (deliveryInput && incomingDraft.deliveryDate) deliveryInput.value = String(incomingDraft.deliveryDate).replace(" ", "T");
      const noteInput = document.getElementById("globalNoteInput");
      if (noteInput) noteInput.value = incomingDraft.globalNote || "";
      globalNote = incomingDraft.globalNote || "";
      paymentMethod = null;
      selectedMandoub = null;
      updateCart();
      updateApproveButtonState();
    }
  }
});



  // دوال العرض
  function renderProducts(products, container) {
    container.innerHTML = "";
    products.forEach((p) => {
      const prodDiv = document.createElement("div");
      prodDiv.className = "product";
      prodDiv.innerHTML = `
        <img src="${p.img}" alt="${p.name}" loading="lazy" decoding="async">
        <button onclick="addToCart(this, '${p.name}', ${p.price})">
          <span class="name">${p.name}</span>
          <span class="price">${p.price} ريال</span>
        </button>
      `;
      container.appendChild(prodDiv);
    });
  }

  function updateProductButtons() {
    document.querySelectorAll('.product button').forEach(btn => {
      const btnName = btn.querySelector('.name').textContent;
      btn.classList.toggle('added', cart.some(item => item.name === btnName));
    });
  }

  // دوال العمليات
function addToCart(button, name, price) {
    let item = cart.find(i => i.name === name);
    if (item) {
        item.qty++;
    } else {
cart.push({
  name: name,
  originalName: name,
  price: price,
  originalPrice: price,
  qty: 1,
  discount: 0,
  notes: "",
  notesLocked: false,
  customName: "",
  img: ([...cakes, ...sweets, ...extras].find(p => p.name === name)?.img || "")
});

    }

    updateCart();

    // ✅ تشغيل صوت جديد في كل مرة
    const sound = new Audio('add.mp3');
    sound.play();

    showMessage(`تمت إضافة ${name}`);
}

  function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
    removeSound.currentTime = 0;
    removeSound.play();
  }

  function openEditModal(index) {
    currentEditIndex = index;
    const item = cart[index];

    const editNameInput = document.getElementById("editName");
    const editNameLabel = document.getElementById("editNameLabel");

    if (item.originalName === "تكلفة إضافية") {
      editNameInput.style.display = "block";
      editNameLabel.style.display = "block";
      editNameInput.value = item.customName || item.originalName;
    } else {
      editNameInput.style.display = "none";
      editNameLabel.style.display = "none";
    }

    editQtyInput.value = item.qty;
    editPriceInput.value = item.price.toFixed(2);
    editDiscountInput.value = item.discount;
    editNotesInput.value = item.notes || "";

    editModal.style.display = "flex";
  }

  function saveEdit() {
    const qty = Number(editQtyInput.value);
    const price = Number(editPriceInput.value);
    const discount = Number(editDiscountInput.value);
    const notes = editNotesInput.value.trim();
    const customNameInput = document.getElementById("editName").value.trim();

    if (qty <= 0 || price < 0) {
      alert("يرجى إدخال كمية وسعر صحيحين.");
      return;
    }

    const item = cart[currentEditIndex];
    item.qty = qty;
    item.price = price;
    item.discount = discount;
    item.notes = notes;
	// إذا المستخدم كتب ملاحظة لهذا المنتج يدويًا، نقفلها ضد الملاحظة العامة
item.notesLocked = (notes.trim() !== "" && notes.trim() !== globalNote);


    if (item.originalName === "تكلفة إضافية") {
      item.customName = customNameInput || item.originalName;
      item.name = item.customName;
    } else {
      item.name = item.originalName;
    }

    updateCart();
    closeEditModal();
  }

  function closeEditModal() {
    editModal.style.display = "none";
  }

function loadClientsToSelect() {
  const input = document.getElementById("clientSelect");
  const list  = document.getElementById("clientsList");

  if (!input || !list) return;

  list.innerHTML = "";

  if (clients.length === 0) {
    input.placeholder = "لا يوجد عملاء مسجلين";
    input.disabled = true;
    return;
  }

  input.disabled = false;
  input.placeholder = "ابحث عن العميل...";

  clients.forEach(client => {
    const option = document.createElement("option");
    option.value = (client.name || "").trim();
    list.appendChild(option);
  });
}


  function showMessage(text) {
    msgBox.textContent = text;
    msgBox.classList.add("show");
    
    setTimeout(() => {
      msgBox.classList.remove("show");
    }, 2000);
  }
  
  
function normalizeSaudiPhone(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return { valid: true, normalized: "", formatted: "" };
  if (digits.startsWith("00966")) digits = digits.slice(5);
  else if (digits.startsWith("966")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  if (!/^5\d{8}$/.test(digits)) return { valid: false, normalized: "", formatted: "" };
  return { valid: true, normalized: "+966" + digits, formatted: `+966 ${digits.slice(0,2)} ${digits.slice(2,5)} ${digits.slice(5)}` };
}
function normalizePhoneForMatch(phone) {
  const result = normalizeSaudiPhone(phone);
  return result.valid ? result.normalized : "";
}
function formatSaudiPhone(phone) {
  const result = normalizeSaudiPhone(phone);
  return result.valid ? result.formatted : null;
}
function quickClientPhoneExists(phone) {
  const normalized = normalizePhoneForMatch(phone);
  return normalized && clients.some(c => normalizePhoneForMatch(c.phone) === normalized);
}

function openQuickClientModal() {
  document.getElementById("quickClientModal").style.display = "flex";

  document.getElementById("quickClientName").value = "";
  document.getElementById("quickClientPhone").value = "";

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("quickClientDate").value = today;
}

function closeQuickClientModal() {
  document.getElementById("quickClientModal").style.display = "none";
}

async function saveQuickClient() {
  const name = document.getElementById("quickClientName").value.trim();
  let phone = document.getElementById("quickClientPhone").value.trim();
  const formattedPhone = formatSaudiPhone(phone);
  if (formattedPhone === null) {
    alert("رقم الجوال غير صحيح. استخدم رقم سعودي مثل 0501234567");
    return;
  }
  phone = formattedPhone;
  const date = document.getElementById("quickClientDate").value;

  if (!name) {
    alert("يرجى إدخال اسم العميل");
    return;
  }

  const exists = clients.some(
    c => c.name.trim().toLowerCase() === name.toLowerCase()
  );

  if (exists) {
    alert("هذا العميل موجود مسبقًا");
    return;
  }

  if (quickClientPhoneExists(phone)) {
    alert("رقم الجوال مسجل لعميل آخر");
    return;
  }

  const newClient = {
    id: Date.now().toString(),
    name: name,
    phone: phone,
    date: date
  };

  clients.push(newClient);

  try {
  await NoshiDB.set("clients", clients);
} catch (error) {
  console.error("فشل حفظ العميل في IndexedDB:", error);
  alert("حدث خطأ أثناء حفظ العميل");
  return;
}

  loadClientsToSelect();

  document.getElementById("clientSelect").value = name;

  closeQuickClientModal();

  showMessage("✅ تم إضافة العميل: " + name);
}
  
// دوال المودال
function openMandoubModal() {
  document.getElementById('mandoubModal').style.display = 'flex';
}

function closeMandoubModal() {
  document.getElementById('mandoubModal').style.display = 'none';
}

function selectMandoub(name) {
  selectedMandoub = name;
  document.getElementById('selectMandoubBtn').textContent =
    name === "__UNASSIGNED__" ? "⚪ لم يتم تحديد المندوب" : `🚚 ${name}`;
  document.getElementById('mandoubSelectError').style.display = 'none';
  closeMandoubModal();
  updateApproveButtonState();
}

  // دوال الأحداث
  function setupEventListeners() {
  document.getElementById("pasteGlobalNoteBtn").addEventListener("click", pasteGlobalNote);
  document.getElementById("applyGlobalNoteBtn").addEventListener("click", applyGlobalNote);
  document.getElementById("clearGlobalNoteBtn").addEventListener("click", clearGlobalNote);

    clearCartBtn.addEventListener("click", clearCart);
//  copyOrderBtn.addEventListener("click", copyOrder);
    applyDiscountBtn.addEventListener("click", applyDiscount);
clientSelect.addEventListener("input", () => {
  document.getElementById("clientSelectError").style.display = "none";

  const v = clientSelect.value.trim();
  clientSelect.classList.remove("is-valid","is-invalid");

  if (v) {
    const ok = clients.some(c => (c.name || "").trim() === v);
    clientSelect.classList.add(ok ? "is-valid" : "is-invalid");
  }

  updateApproveButtonState();
});

    
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.payment-method-btn').forEach(b => {
          b.style.background = '#f0f0f0';
          b.style.color = '#333';
        });
        
        this.style.background = '#e67e22';
        this.style.color = 'white';
        paymentMethod = this.dataset.method;
        document.getElementById("paymentError").style.display = "none";
        updateApproveButtonState();
        
        paymentSound.currentTime = 0;
        paymentSound.play().catch(e => console.log("Error playing sound:", e));
      });
    });
    
    document.getElementById("approveOrderBtn").addEventListener("click", approveOrder);
  }

  function clearCart() {
    cart = [];
    generalDiscount = 0;
    paymentMethod = null;
    
    discountInput.value = "";
    clientSelect.value = "";
    
    document.querySelectorAll('.payment-method-btn').forEach(b => {
      b.style.background = '#f0f0f0';
      b.style.color = '#333';
    });

    updateCart();
    removeSound.currentTime = 0;
    removeSound.play();

    clearCartBtn.classList.add("active");
    clearCartBtn.textContent = "تم حذف الطلب!";

    setTimeout(() => {
      clearCartBtn.classList.remove("active");
      clearCartBtn.textContent = "🗑️ حذف كل الطلب";
    }, 2000);
  }

  function copyOrder() {
    if (cart.length === 0) {
      alert("السلة فارغة!");
      return;
    }

    let message = `*🧾 طلبك من نوشي بيكري 💕:*\n\n`;
    let originalTotal = 0;
    let individualDiscounts = [];
    let allNotes = [];

    cart.forEach(item => {
      const qty = item.qty;
      const originalUnitPrice = item.originalPrice;
      const originalSubtotal = originalUnitPrice * qty;
      originalTotal += originalSubtotal;

      message += `* ${item.name} × ${qty} = ${originalSubtotal.toFixed(2)} ريال\n`;

      if (item.discount > 0) {
        individualDiscounts.push({ name: item.name, discount: item.discount });
      }

      if (item.notes && item.notes.trim() !== "") {
        allNotes.push(`- ${item.name}: ${item.notes.trim()}`);
      }
    });

    if (generalDiscount > 0 || individualDiscounts.length > 0) {
      message += `\n`;

      if (generalDiscount > 0) {
        message += `🏷️ تم تطبيق خصم عام ${generalDiscount}% على جميع المنتجات.\n`;
      }

      if (individualDiscounts.length > 0) {
        message += individualDiscounts.length === 1 ? 
          `🏷️ تم تطبيق خصم فردي على المنتج التالي:\n` : 
          `🏷️ وتم تطبيق خصومات فردية على المنتجات التالية:\n`;

        individualDiscounts.forEach(d => {
          message += `• ${d.name}: ${d.discount}%\n`;
        });
      }

      message += `\n💰 السعر قبل الخصم: ${originalTotal.toFixed(2)} ريال\n`;
      message += `✅ الإجمالي النهائي: ${total.toFixed(2)} ريال\n`;
    } else {
      message += `\n✅ الإجمالي النهائي: ${total.toFixed(2)} ريال\n`;
    }

    if (allNotes.length > 0) {
      message += `\n💬 ملاحظات الطلب:\n${allNotes.join('\n')}\n`;
    }


    message += `\n\n*شكراً لثِقتكم في نوشي بيكري!*\n*نسعد بخدمتكم دائمًا بأطيب النكهات وبـجودة مميزة 💖🍰!*`;

    navigator.clipboard.writeText(message).then(() => {
      showMessage("تم نسخ الطلب!");
      copySound.currentTime = 0;
      copySound.play();

      copyOrderBtn.classList.add("active");
      const originalText = copyOrderBtn.textContent;
      copyOrderBtn.textContent = "تم النسخ!✅";
      setTimeout(() => {
        copyOrderBtn.classList.remove("active");
        copyOrderBtn.textContent = originalText;
      }, 1500);
    });
  }

  function applyDiscount() {
    const val = Number(discountInput.value);
    if (val < 0 || val > 100 || isNaN(val)) {
      alert("يرجى إدخال نسبة خصم صحيحة بين 0 و 100.");
      return;
    }
    generalDiscount = val;
    updateCart();
    discountSound.currentTime = 0;
    discountSound.play();

    applyDiscountBtn.classList.add("added");
    const originalText = applyDiscountBtn.textContent;
    applyDiscountBtn.textContent = "تم التطبيق ✅️";
    setTimeout(() => {
      applyDiscountBtn.classList.remove("added");
      applyDiscountBtn.textContent = originalText;
    }, 2000);
  }

async function approveOrder() {
  if (!validateBeforeApprove()) return;

  try {
    // ✅ قراءة وضع التعديل من IndexedDB
    var editingOrder = await NoshiDB.get("editingOrder", null);

    // ✅ وقت/تاريخ التسليم (قفل أمان عند التعديل)
    var deliveryInputEl = document.getElementById("deliveryDateInput");
    var deliveryDateValue = deliveryInputEl ? deliveryInputEl.value : "";

    // وقت قديم (إذا كنا نعدّل فاتورة)
    var oldDeliveryDate = "";
    if (editingOrder && editingOrder.order && editingOrder.order.deliveryDate) {
      oldDeliveryDate = editingOrder.order.deliveryDate;
    }

    // النهائي: الجديد إذا موجود، وإلا القديم
    var finalDeliveryDateRaw = deliveryDateValue || oldDeliveryDate;

    // تحقق
    if (!finalDeliveryDateRaw) {
      document.getElementById("deliveryDateError").style.display = "block";
      return;
    } else {
      document.getElementById("deliveryDateError").style.display = "none";
    }

    // نخزنها بصيغة موحدة: "YYYY-MM-DD HH:MM" (بدون T)
    var finalDeliveryDate = String(finalDeliveryDateRaw).replace("T", " ");

    const now = new Date();
    const orderId = Date.now();
    const chosenClient = clientSelect.value.trim();
    const selectedClient = clients.find(c => (c.name || "").trim() === chosenClient);
    const activePlan = hasValidDeliveryPlan() ? deliveryPlanToSavedSlots(deliveryPlan) : null;
    if (activePlan && activePlan.length) {
      finalDeliveryDate = activePlan[0].deliveryDate;
      selectedMandoub = activePlan[0].mandoub || "__UNASSIGNED__";
    }
    const selectedMandoubObj = mandoubs.find(m => m.name === selectedMandoub);

    // حساب المبالغ
    const originalTotal = calculateOriginalTotal();
    const totalAfterDiscounts = total;

    // ✅ جلب الملاحظة العامة من الخانة مباشرة (الأدق)
    var globalNoteInputEl = document.getElementById("globalNoteInput");
    var savedGlobalNote = globalNoteInputEl ? (globalNoteInputEl.value || "").trim() : "";

    // تاريخ إنشاء الطلب ثابت ولا يتغير عند تعديل الفاتورة.
    // تاريخ التسليم مستقل عنه ولا يتغير إلا إذا غيّره المستخدم صراحة.
    const createdAt = (editingOrder && editingOrder.order && editingOrder.order.date)
      ? String(editingOrder.order.date)
      : `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,"0")}-${now.getDate().toString().padStart(2,"0")} ${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;

    const orderData = {
      id: orderId,
      date: createdAt,
      client: chosenClient,
      clientId: selectedClient ? selectedClient.id : null,
      deliveryPerson: selectedMandoub === "__UNASSIGNED__" ? null : selectedMandoub,
      mandoub: selectedMandoub === "__UNASSIGNED__" ? null : selectedMandoub,
      mandoubId: selectedMandoubObj ? selectedMandoubObj.id : null,
      items: [...cart],
      paymentMethod: paymentMethod,
      transferred: editingOrder?.order?.transferred ?? false,
      cashReceived: editingOrder?.order?.cashReceived ?? false,
      generalDiscount: generalDiscount,
      globalNote: savedGlobalNote,
      totalBefore: originalTotal.toFixed(2),
      totalAfter: totalAfterDiscounts.toFixed(2),
      status: editingOrder?.order?.status || "pending",
      deliveryDate: finalDeliveryDate,
      delivered: editingOrder?.order?.delivered ?? false,
      deliveryPaid: editingOrder?.order?.deliveryPaid ?? false,
      deliveries: activePlan || undefined
    };

    // إذا كان الطلب قادمًا من الموقع الخارجي نحفظ معرفه لمنع التكرار لاحقًا في D1.
    const incomingDraft = !editingOrder ? await NoshiDB.get("incomingOrderDraft", null) : null;
    if (incomingDraft && incomingDraft.externalRequestId) {
      orderData.externalRequestId = incomingDraft.externalRequestId;
      orderData.externalOrderNumber = incomingDraft.externalOrderNumber || incomingDraft.externalRequestId;
      orderData.source = "website";
    }

    let salesData = await NoshiDB.get("salesData", {});
    if (!salesData || typeof salesData !== "object" || Array.isArray(salesData)) {
      salesData = {};
    }

    // حماية من تكرار طلب الموقع: لو تم الحفظ داخليًا ثم فشل تحديث حالة الطلب الخارجي،
    // إعادة المحاولة لا تنشئ فاتورة ثانية؛ فقط تحاول إغلاق الطلب الخارجي من جديد.
    if (!editingOrder && incomingDraft?.externalRequestId) {
      let existingExternal = null;
      for (const [existingMonth, monthOrders] of Object.entries(salesData)) {
        if (!Array.isArray(monthOrders)) continue;
        const existingIndex = monthOrders.findIndex(o => String(o?.externalRequestId || "") === String(incomingDraft.externalRequestId));
        if (existingIndex >= 0) { existingExternal = { month: existingMonth, index: existingIndex, order: monthOrders[existingIndex] }; break; }
      }
      if (existingExternal) {
        try {
          if (NoshiAuth.enabled()) {
            await NoshiAuth.api(`/api/incoming-orders/${encodeURIComponent(incomingDraft.externalRequestId)}/accept`, { method: 'POST' });
          }
        } catch (e) {
          if (!(e?.status === 409 && e?.data?.error === 'ORDER_ALREADY_DECIDED')) throw e;
        }
        await NoshiDB.remove("incomingOrderDraft");
        showMessage("✅ هذا الطلب محفوظ مسبقًا ولم يتم تكراره");
        setTimeout(() => { window.location.href = `order.html#order-${existingExternal.order.id}`; }, 700);
        return;
      }
    }

    const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;

    if (!salesData[monthKey]) {
      salesData[monthKey] = [];
    }

    // ✅ التحقق إذا كنا نعدل فاتورة قديمة
    if (editingOrder) {
      const oldMonthKey = editingOrder.monthKey;
      const orderIndex = editingOrder.orderIndex;

      // حافظ على نفس رقم الفاتورة القديم
      orderData.id = editingOrder.order.id || orderData.id;

      if (!salesData[oldMonthKey]) {
        salesData[oldMonthKey] = [];
      }

      // استبدال الطلب القديم بالجديد
      salesData[oldMonthKey][orderIndex] = orderData;

      // حذف وضع التعديل من IndexedDB فقط
      await NoshiDB.remove("editingOrder");
    } else {
      // إنشاء طلب جديد
      salesData[monthKey].push(orderData);
    }

    await NoshiDB.set("salesData", salesData);

// صفحة المناديب تعتمد على salesData مباشرة؛ لا نكرر نفس الطلب في mandoubOrders.
// إزالة النسخة المكررة تقلل حجم الكتابة وتمنع حالة نجاح salesData وفشل النسخة الثانية.

    if (!editingOrder && incomingDraft && incomingDraft.externalRequestId) {
      try {
        if (NoshiAuth.enabled()) {
          await NoshiAuth.api(`/api/incoming-orders/${encodeURIComponent(incomingDraft.externalRequestId)}/accept`, { method: 'POST' });
        }
        await NoshiDB.remove("incomingOrderDraft");
      } catch (externalError) {
        // الطلب الداخلي محفوظ بالفعل. نبقي الـdraft محليًا حتى تعيد المحاولة؛
        // فحص externalRequestId أدناه يمنع إنشاء نسخة داخلية ثانية.
        console.error("تم حفظ الطلب داخليًا وتعذر إغلاق الطلب الخارجي:", externalError);
        showMessage("⚠️ تم حفظ الطلب، لكن تعذر تحديث حالة طلب الموقع. أعد المحاولة عند توفر الاتصال.");
      }
    }

    approveSound.currentTime = 0;
    approveSound.play();

    resetSystem();

    showMessage("تم حفظ الطلب بنجاح ✅");

    setTimeout(() => {
      window.location.href = `order.html#order-${orderData.id}`;
    }, 1000);

  } catch (error) {
    console.error("فشل حفظ الطلب في IndexedDB:", error);
    alert("❌ حدث خطأ أثناء حفظ الطلب. لم يتم حذف بيانات LocalStorage القديمة.");
  }
}

// دالة لصق الملاحظة من الحافظة
async function pasteGlobalNote() {
  try {
    const text = await navigator.clipboard.readText();
    if (text && text.trim() !== "") {
      document.getElementById("globalNoteInput").value = text.trim();
      showMessage("تم لصق الملاحظة 📋");
      
      // صوت تأكيد
      const sound = new Audio('add.mp3');
      sound.play().catch(e => console.log("Error playing sound:", e));
    } else {
      showMessage("الحافظة فارغة أو لا تحتوي على نص");
    }
  } catch (err) {
    console.error("فشل قراءة الحافظة:", err);
    // بديل يدوي للمتصفحات التي لا تدعم Clipboard API
    const text = await NoshiUI.prompt("الرجاء لصق الملاحظة هنا:", { title: "لصق الملاحظة", multiline: true, placeholder: "الصق الملاحظة هنا" });
    if (text && text.trim() !== "") {
      document.getElementById("globalNoteInput").value = text.trim();
      showMessage("تم لصق الملاحظة 📋");
    }
  }
}
function applyGlobalNote() {
  const input = document.getElementById("globalNoteInput");
  const val = (input.value || "").trim();
  globalNote = val;

  applyGlobalNoteToCart();

  showMessage(val ? "تم تطبيق الملاحظة ✅" : "الملاحظة فارغة");
  
  // تشغيل صوت التأكيد
  if (noteSound) {
    noteSound.currentTime = 0;
    noteSound.play().catch(e => console.log("Error playing note sound:", e));
  }
}

function clearGlobalNote() {
  document.getElementById("globalNoteInput").value = "";
  globalNote = "";

  // نحذفها من المنتجات اللي كانت ماخذتها من الملاحظة العامة فقط
  // ما عدا "مندوب" و "صحن تقديم"
  cart.forEach(item => {
    if (
      item.originalName !== "مندوب" && 
      item.originalName !== "صحن تقديم" &&
      item.originalName !== "شريط عبارة" &&
      !item.notesLocked && 
      item.notes === lastGlobalNoteApplied
    ) {
      item.notes = "";
    }
  });

  lastGlobalNoteApplied = "";
  updateCart();
  showMessage("تم مسح الملاحظة ✅");
  
  // تشغيل صوت المسح
  if (removeSound) {
    removeSound.currentTime = 0;
    removeSound.play().catch(e => console.log("Error playing remove sound:", e));
  }
}

function applyGlobalNoteToCart() {
  // نطبقها على كل المنتجات ما عدا "مندوب" و "صحن تقديم"
  cart.forEach(item => {
    if (item.originalName === "مندوب" || item.originalName === "صحن تقديم" || item.originalName === "شريط عبارة") return;

    // إذا المنتج عليه ملاحظة خاصة (من التعديل اليدوي) ما نلمسه
    if (item.notesLocked) return;

    // نحدث الملاحظة
    item.notes = globalNote;
  });

  lastGlobalNoteApplied = globalNote;
  updateCart();
}



function cartDeliverySignature() {
  return JSON.stringify(cart.map((item, index) => ({
    index,
    name: item.originalName || item.name || "",
    qty: Number(item.qty || 0),
    price: Number(item.price || 0),
    discount: Number(item.discount || 0),
    notes: String(item.notes || ""),
    customName: String(item.customName || "")
  })));
}

function splitEligibleIndexes() {
  const out = [];
  cart.forEach((item, index) => {
    const name = String(item.originalName || item.name || "").trim();
    if (name !== "مندوب" && Number(item.qty || 0) > 0) out.push(index);
  });
  return out;
}

function expandDeliveryUnits() {
  const units = [];
  splitEligibleIndexes().forEach(itemIndex => {
    const item = cart[itemIndex];
    const qty = Math.max(0, Math.floor(Number(item.qty || 0)));
    for (let unitNo = 1; unitNo <= qty; unitNo++) {
      const knownProduct = [...cakes, ...sweets, ...extras].find(p => p.name === (item.originalName || item.name));
      units.push({
        key: `i${itemIndex}-u${unitNo}`,
        itemIndex,
        unitNo,
        label: String(item.customName || item.name || "منتج"),
        image: String(item.img || knownProduct?.img || "")
      });
    }
  });
  return units;
}

function currentDeliveryFeeTotal() {
  const item = cart.find(i => String(i.originalName || i.name || "").trim() === "مندوب");
  if (!item) return 0;
  return Math.max(0, Number(item.price || 0) * Math.max(1, Number(item.qty || 1)));
}

function currentDeliveryFeeUnit() {
  const item = cart.find(i => String(i.originalName || i.name || "").trim() === "مندوب");
  if (!item) return 0;
  return Math.max(0, Number(item.price || 0));
}

// يوزع إجمالي التوصيل على الخانات التلقائية فقط. أي خانة عدّلها المستخدم يدويًا تبقى كما هي.
function smartDistributeDeliveryFees(plan, sourceTotal = currentDeliveryFeeTotal()) {
  const slots = Array.isArray(plan) ? plan : [];
  if (!slots.length) return slots;
  const manual = slots.filter(s => s.feeManual);
  const automatic = slots.filter(s => !s.feeManual);
  if (!automatic.length) return slots;

  const manualTotal = manual.reduce((sum, s) => sum + Math.max(0, Number(s.deliveryFee || 0)), 0);
  const remaining = Math.max(0, Math.round((Number(sourceTotal || 0) - manualTotal) * 100));
  const base = Math.floor(remaining / automatic.length);
  let remainder = remaining - (base * automatic.length);
  automatic.forEach(slot => {
    const cents = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    slot.deliveryFee = cents / 100;
  });
  return slots;
}

// توزيع المنتجات بالتساوي على مواعيد التسليم مع الحفاظ على كل قطعة مرة واحدة فقط.
function smartDistributeDeliveryUnits(plan) {
  const slots = Array.isArray(plan) ? plan : [];
  const keys = expandDeliveryUnits().map(u => u.key);
  if (!slots.length) return slots;
  slots.forEach(s => { s.unitKeys = []; });
  keys.forEach((key, index) => slots[index % slots.length].unitKeys.push(key));
  return slots;
}

function normalizePlanForCurrentCart(existing) {
  const units = expandDeliveryUnits();
  const allKeys = new Set(units.map(u => u.key));
  const firstDate = document.getElementById('deliveryDateInput')?.value || '';
  const firstMandoub = selectedMandoub || '__UNASSIGNED__';
  const baseFee = currentDeliveryFeeUnit();
  const plan = Array.isArray(existing) ? existing.map((slot, idx) => ({
    id: String(slot.id || `slot-${Date.now()}-${idx}`),
    deliveryDate: String(slot.deliveryDate || '').replace(' ', 'T'),
    mandoub: slot.mandoub || slot.deliveryPerson || '__UNASSIGNED__',
    deliveryFee: Math.max(0, Number(slot.deliveryFee || 0)),
    feeManual: !!slot.feeManual,
    unitKeys: Array.isArray(slot.unitKeys) ? slot.unitKeys.filter(k => allKeys.has(k)) : []
  })) : [];

  if (!plan.length) {
    plan.push({
      id: `slot-${Date.now()}-0`,
      deliveryDate: firstDate,
      mandoub: firstMandoub,
      deliveryFee: currentDeliveryFeeTotal(),
      feeManual: false,
      unitKeys: units.map(u => u.key)
    });
  }

  const assigned = new Set(plan.flatMap(s => s.unitKeys));
  const missing = units.map(u => u.key).filter(k => !assigned.has(k));
  plan[0].unitKeys.push(...missing);
  return plan;
}

function deliveryPlanToSavedSlots(plan) {
  const units = expandDeliveryUnits();
  const unitMap = new Map(units.map(u => [u.key, u]));
  return plan.map((slot, slotIndex) => {
    const grouped = new Map();
    (slot.unitKeys || []).forEach(key => {
      const unit = unitMap.get(key);
      if (!unit) return;
      grouped.set(unit.itemIndex, (grouped.get(unit.itemIndex) || 0) + 1);
    });
    const items = [...grouped.entries()].map(([itemIndex, qty]) => ({
      ...cart[itemIndex],
      qty
    }));
    return {
      id: slot.id || `delivery-${slotIndex + 1}`,
      deliveryDate: String(slot.deliveryDate || '').replace('T', ' '),
      mandoub: slot.mandoub === '__UNASSIGNED__' ? null : slot.mandoub,
      deliveryPerson: slot.mandoub === '__UNASSIGNED__' ? null : slot.mandoub,
      deliveryFee: Math.max(0, Number(slot.deliveryFee || 0)),
      items,
      delivered: !!slot.delivered,
      deliveryPaid: !!slot.deliveryPaid
    };
  });
}

function updateDeliveryFeeItemFromPlan(plan) {
  const totalFee = plan.reduce((sum, slot) => sum + Math.max(0, Number(slot.deliveryFee || 0)), 0);
  const idx = cart.findIndex(i => String(i.originalName || i.name || '').trim() === 'مندوب');
  if (idx >= 0) {
    cart[idx].qty = 1;
    cart[idx].price = totalFee;
    cart[idx].originalPrice = totalFee;
  } else if (totalFee > 0) {
    cart.push({
      name: 'مندوب', originalName: 'مندوب', price: totalFee, originalPrice: totalFee,
      qty: 1, discount: 0, notes: '', customName: ''
    });
  }
  updateCart();
}

function hasValidDeliveryPlan() {
  return Array.isArray(deliveryPlan) && deliveryPlan.length > 1 && deliveryPlanSignature === cartDeliverySignature();
}

function updateSplitDeliverySummary() {
  const el = document.getElementById('splitDeliverySummary');
  const btn = document.getElementById('splitDeliveryBtn');
  if (!el || !btn) return;
  if (!hasValidDeliveryPlan()) {
    el.style.display = 'none';
    btn.textContent = '🧩 تقسيم الطلب على أكثر من موعد / مندوب';
    return;
  }
  const pieces = deliveryPlan.reduce((n, s) => n + (s.unitKeys?.length || 0), 0);
  el.style.display = 'block';
  el.textContent = `✅ مقسّم على ${deliveryPlan.length} مواعيد — ${pieces} قطعة موزعة`;
  btn.textContent = '🧩 تعديل تقسيم التسليم';
}

function openSplitDeliveryPlanner() {
  const units = expandDeliveryUnits();
  if (!units.length) {
    NoshiUI.alert('أضف منتجات للسلة أولًا.', { title: 'تقسيم التسليم' });
    return;
  }

  let working = normalizePlanForCurrentCart(hasValidDeliveryPlan() ? deliveryPlan : null);
  document.getElementById('splitDeliveryPlanner')?.remove();
  document.getElementById('splitPlannerStyles')?.remove();

  const style = document.createElement('style');
  style.id = 'splitPlannerStyles';
  style.textContent = `
    #splitDeliveryPlanner{position:fixed;inset:0;z-index:1000000;background:rgba(20,20,24,.58);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;direction:rtl}
    #splitDeliveryPlanner *{box-sizing:border-box}
    #splitDeliveryPlanner .sp-panel{width:min(96vw,840px);max-height:94dvh;overflow:auto;background:#f7f7f9;border-radius:24px;box-shadow:0 24px 70px rgba(0,0,0,.30);padding:14px;-webkit-overflow-scrolling:touch}
    #splitDeliveryPlanner .sp-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;position:sticky;top:-14px;z-index:20;background:#f7f7f9;padding:12px 2px 10px}
    #splitDeliveryPlanner .sp-title{font-size:20px;font-weight:950;color:#241f2b}.sp-help{font-size:12px;color:#706978;margin-top:4px;line-height:1.55}
    #splitDeliveryPlanner .sp-close{width:44px;height:44px;min-width:44px;border:0;border-radius:13px;background:#fff;color:#d63031;font-size:24px;box-shadow:0 2px 10px rgba(0,0,0,.08);cursor:pointer}
    #splitDeliveryPlanner .sp-slot{background:#fff;border:1px solid #e5e1ea;border-radius:18px;padding:12px;margin:10px 0;box-shadow:0 3px 14px rgba(31,25,39,.045)}
    #splitDeliveryPlanner .sp-slot-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}.sp-slot-title{font-size:16px;font-weight:950;color:#332b3d}.sp-count{font-size:12px;color:#777;background:#f2f0f4;padding:5px 8px;border-radius:999px}
    #splitDeliveryPlanner .sp-remove{border:0;background:#fff0ee;color:#c0392b;border-radius:10px;padding:8px 10px;font-weight:850;cursor:pointer}
    #splitDeliveryPlanner .sp-fields{display:grid;grid-template-columns:1.35fr 1fr .72fr;gap:8px}.sp-field{font-size:12px;font-weight:850;color:#514b58}.sp-field input,.sp-field select{display:block;width:100%;height:46px;margin-top:5px;border:1px solid #ddd8e2;border-radius:11px;background:#fff;padding:7px 9px;font:inherit;color:#27232c;outline:none}.sp-field input:focus,.sp-field select:focus{border-color:#8b78e6;box-shadow:0 0 0 3px rgba(139,120,230,.12)}
    #splitDeliveryPlanner .sp-drop{min-height:124px;margin-top:11px;padding:9px;border:2px dashed #d8d1e8;border-radius:14px;background:#fbfaff;transition:.15s}.sp-drop.drag-over{border-color:#6c5ce7;background:#f0edff;transform:scale(.998)}
    #splitDeliveryPlanner .sp-drop-label{font-size:11px;color:#80788b;margin:0 2px 8px}.sp-empty{display:grid;place-items:center;min-height:82px;color:#aaa;font-size:13px}
    #splitDeliveryPlanner .sp-products{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;align-items:start}
    #splitDeliveryPlanner .sp-unit{position:relative;min-width:0;background:#fff;border:1px solid #e3dfe7;border-radius:13px;padding:6px;box-shadow:0 2px 8px rgba(0,0,0,.055);cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;-webkit-touch-callout:none}.sp-unit:active{cursor:grabbing}.sp-unit img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:9px;background:#f1f1f1;pointer-events:none}.sp-unit-name{font-size:11px;font-weight:900;color:#332c38;text-align:center;line-height:1.3;margin-top:6px;min-height:29px;display:flex;align-items:center;justify-content:center;pointer-events:none}.sp-unit-no{position:absolute;top:3px;right:3px;min-width:24px;height:24px;padding:0 5px;border-radius:999px;background:rgba(32,27,38,.86);color:#fff;font-size:11px;font-weight:900;display:grid;place-items:center;pointer-events:none}
    #splitDeliveryPlanner .sp-mode-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#ece9f2;padding:4px;border-radius:13px;margin:4px 0 10px}.sp-mode-tab{height:42px;border:0;border-radius:10px;background:transparent;color:#625a6c;font-weight:950;font-size:13px;cursor:pointer}.sp-mode-tab.active{background:#fff;color:#5746b3;box-shadow:0 2px 8px rgba(0,0,0,.07)}
    #splitDeliveryPlanner .sp-add{width:100%;min-height:50px;border:1.5px dashed #8170d4;border-radius:14px;background:#f0edff;color:#5746b3;font-weight:950;font-size:14px;margin:7px 0;cursor:pointer}
    #splitDeliveryPlanner .sp-actions{display:flex;gap:8px;position:sticky;bottom:-14px;z-index:20;background:#f7f7f9;padding:10px 0 3px}.sp-cancel,.sp-save{min-height:50px;border:0;border-radius:14px;font-weight:950;font-size:15px;cursor:pointer}.sp-cancel{flex:1;background:#e9e7eb;color:#514b58}.sp-save{flex:1.5;background:#27ae60;color:#fff}
    #splitDragGhost{position:fixed;z-index:2147483646;width:104px;pointer-events:none;opacity:.94;transform:translate(-52px,-60px) rotate(-2deg);box-shadow:0 16px 35px rgba(0,0,0,.28);border-radius:13px}
    @media(max-width:640px){#splitDeliveryPlanner{padding:0;align-items:flex-end}#splitDeliveryPlanner .sp-panel{width:100%;max-width:none;max-height:96dvh;border-radius:24px 24px 0 0;padding:12px 10px max(12px,env(safe-area-inset-bottom))}.sp-fields{grid-template-columns:1fr!important}.sp-products{grid-template-columns:repeat(3,minmax(0,1fr))!important}.sp-unit-name{font-size:10.5px!important}.sp-drop{min-height:116px!important}}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'splitDeliveryPlanner';
  const panel = document.createElement('div');
  panel.className = 'sp-panel';
  panel.innerHTML = `
    <div class="sp-top">
      <div><div class="sp-title">تقسيم التسليم</div><div class="sp-help">اسحب كرت المنتج إلى موعد التسليم المطلوب. كل كرت = قطعة واحدة.</div></div>
      <button type="button" class="sp-close" data-close aria-label="إغلاق">×</button>
    </div>
    <div class="sp-mode-tabs" role="tablist" aria-label="طريقة توزيع الطلب">
      <button type="button" class="sp-mode-tab" id="plannerSmartTab">⚡ توزيع ذكي</button>
      <button type="button" class="sp-mode-tab active" id="plannerDragTab">✋ Drag & Drop</button>
    </div>
    <div id="plannerSlots"></div>
    <button type="button" id="plannerAddSlot" class="sp-add">＋ إضافة موعد تسليم</button>
    <div class="sp-actions"><button type="button" id="plannerCancel" class="sp-cancel">إلغاء</button><button type="button" id="plannerSave" class="sp-save">حفظ التقسيم</button></div>`;
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  const slotsEl = panel.querySelector('#plannerSlots');
  const unitMap = new Map(units.map(u => [u.key, u]));
  const mandoubOptions = ['ماهر','اياد','عماد','عبد الملك','عبدالرحمن','__UNASSIGNED__'];

  function moveUnit(key, targetId) {
    if (!unitMap.has(key)) return;
    const source = working.find(slot => (slot.unitKeys || []).includes(key));
    const target = working.find(slot => slot.id === targetId);
    if (!target || source === target) return;
    working.forEach(slot => { slot.unitKeys = (slot.unitKeys || []).filter(k => k !== key); });
    target.unitKeys.push(key);
    render();
  }

  function makeUnitCard(key) {
    const u = unitMap.get(key);
    if (!u) return null;
    const card = document.createElement('div');
    card.className = 'sp-unit';
    card.dataset.unit = key;
    card.draggable = true;
    card.setAttribute('aria-label', `اسحب ${u.label} القطعة ${u.unitNo}`);

    if (u.image) {
      const img = document.createElement('img');
      img.src = u.image;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      card.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.style.cssText = 'width:100%;aspect-ratio:1/1;border-radius:9px;background:#f3f1f5;display:grid;place-items:center;font-size:28px;pointer-events:none';
      placeholder.textContent = '🍰';
      card.appendChild(placeholder);
    }
    const no = document.createElement('span');
    no.className = 'sp-unit-no';
    no.textContent = String(u.unitNo);
    const name = document.createElement('div');
    name.className = 'sp-unit-name';
    name.textContent = u.label;
    card.append(no, name);

    card.addEventListener('dragstart', e => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', key);
    });

    // Safari/iPhone: Pointer Events تعطي Drag حقيقي بدون أسلوب الضغط ثم اختيار الموعد.
    let pointer = null;
    card.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, ghost: null };
      card.setPointerCapture?.(e.pointerId);
    });
    card.addEventListener('pointermove', e => {
      if (!pointer || pointer.id !== e.pointerId) return;
      const distance = Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y);
      if (!pointer.ghost && distance < 6) return;
      e.preventDefault();
      if (!pointer.ghost) {
        const ghost = card.cloneNode(true);
        ghost.id = 'splitDragGhost';
        ghost.removeAttribute('draggable');
        document.body.appendChild(ghost);
        pointer.ghost = ghost;
      }
      pointer.ghost.style.left = `${e.clientX}px`;
      pointer.ghost.style.top = `${e.clientY}px`;
      document.querySelectorAll('#splitDeliveryPlanner .sp-drop').forEach(el => el.classList.remove('drag-over'));
      document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-drop-slot]')?.classList.add('drag-over');
    }, { passive: false });
    const finishPointer = e => {
      if (!pointer || pointer.id !== e.pointerId) return;
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-drop-slot]');
      pointer.ghost?.remove();
      document.querySelectorAll('#splitDeliveryPlanner .sp-drop').forEach(el => el.classList.remove('drag-over'));
      pointer = null;
      if (target) moveUnit(key, target.dataset.dropSlot);
    };
    card.addEventListener('pointerup', finishPointer);
    card.addEventListener('pointercancel', e => {
      if (!pointer || pointer.id !== e.pointerId) return;
      pointer.ghost?.remove();
      document.querySelectorAll('#splitDeliveryPlanner .sp-drop').forEach(el => el.classList.remove('drag-over'));
      pointer = null;
    });
    return card;
  }

  function render() {
    slotsEl.innerHTML = '';
    working.forEach((slot, idx) => {
      const section = document.createElement('section');
      section.className = 'sp-slot';
      section.dataset.slotId = slot.id;

      const head = document.createElement('div');
      head.className = 'sp-slot-head';
      const headInfo = document.createElement('div');
      headInfo.style.cssText = 'display:flex;align-items:center;gap:7px;min-width:0';
      const title = document.createElement('strong');
      title.className = 'sp-slot-title';
      title.textContent = `التسليم ${idx + 1}`;
      const count = document.createElement('span');
      count.className = 'sp-count';
      count.textContent = `${(slot.unitKeys || []).length} قطعة`;
      headInfo.append(title, count);
      head.appendChild(headInfo);
      if (working.length > 1) {
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'sp-remove';
        remove.textContent = 'حذف';
        remove.addEventListener('click', () => {
          const removed = working.splice(idx, 1)[0];
          if (working[0]) working[0].unitKeys.push(...(removed.unitKeys || []));
          smartDistributeDeliveryFees(working);
          render();
        });
        head.appendChild(remove);
      }
      section.appendChild(head);

      const fields = document.createElement('div');
      fields.className = 'sp-fields';
      const dateLabel = document.createElement('label');
      dateLabel.className = 'sp-field';
      dateLabel.textContent = 'التاريخ والوقت';
      const dateInput = document.createElement('input');
      dateInput.type = 'datetime-local';
      dateInput.value = slot.deliveryDate || '';
      dateInput.addEventListener('change', () => { slot.deliveryDate = dateInput.value; });
      dateLabel.appendChild(dateInput);

      const mandoubLabel = document.createElement('label');
      mandoubLabel.className = 'sp-field';
      mandoubLabel.textContent = 'المندوب';
      const mandoubSelect = document.createElement('select');
      mandoubOptions.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m === '__UNASSIGNED__' ? 'لم يتم تحديد المندوب' : m;
        opt.selected = slot.mandoub === m;
        mandoubSelect.appendChild(opt);
      });
      mandoubSelect.addEventListener('change', () => { slot.mandoub = mandoubSelect.value; });
      mandoubLabel.appendChild(mandoubSelect);

      const feeLabel = document.createElement('label');
      feeLabel.className = 'sp-field';
      feeLabel.textContent = 'التوصيل';
      const feeInput = document.createElement('input');
      feeInput.type = 'number'; feeInput.min = '0'; feeInput.step = '0.5'; feeInput.inputMode = 'decimal';
      feeInput.value = String(Number(slot.deliveryFee || 0));
      feeInput.addEventListener('input', () => { slot.deliveryFee = Math.max(0, Number(feeInput.value || 0)); slot.feeManual = true; });
      feeLabel.appendChild(feeInput);
      fields.append(dateLabel, mandoubLabel, feeLabel);
      section.appendChild(fields);

      const drop = document.createElement('div');
      drop.className = 'sp-drop';
      drop.dataset.dropSlot = slot.id;
      const label = document.createElement('div');
      label.className = 'sp-drop-label';
      label.textContent = 'اسحب المنتجات إلى هذا الموعد';
      drop.appendChild(label);
      const productGrid = document.createElement('div');
      productGrid.className = 'sp-products';
      (slot.unitKeys || []).forEach(key => {
        const unitCard = makeUnitCard(key);
        if (unitCard) productGrid.appendChild(unitCard);
      });
      if (!productGrid.children.length) {
        const empty = document.createElement('div');
        empty.className = 'sp-empty';
        empty.textContent = 'اسحب منتجًا هنا';
        drop.appendChild(empty);
      } else {
        drop.appendChild(productGrid);
      }
      drop.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; drop.classList.add('drag-over'); });
      drop.addEventListener('dragleave', e => { if (!drop.contains(e.relatedTarget)) drop.classList.remove('drag-over'); });
      drop.addEventListener('drop', e => {
        e.preventDefault(); drop.classList.remove('drag-over');
        moveUnit(e.dataTransfer.getData('text/plain'), slot.id);
      });
      section.appendChild(drop);
      slotsEl.appendChild(section);
    });
  }

  panel.querySelector('#plannerAddSlot').addEventListener('click', () => {
    const first = working[0] || {};
    working.push({
      id: `slot-${Date.now()}-${working.length}`,
      deliveryDate: first.deliveryDate || document.getElementById('deliveryDateInput')?.value || '',
      mandoub: first.mandoub || selectedMandoub || '__UNASSIGNED__',
      deliveryFee: 0,
      feeManual: false,
      unitKeys: []
    });
    smartDistributeDeliveryFees(working);
    render();
    panel.scrollTo({ top: panel.scrollHeight, behavior: 'smooth' });
  });

  panel.querySelector('#plannerSmartTab').addEventListener('click', () => {
    smartDistributeDeliveryUnits(working);
    // عند طلب التوزيع الذكي نعيد خانات التوصيل غير المعدلة يدويًا إلى توزيع متوازن.
    smartDistributeDeliveryFees(working);
    render();
    panel.querySelector('#plannerSmartTab').classList.add('active');
    panel.querySelector('#plannerDragTab').classList.remove('active');
  });
  panel.querySelector('#plannerDragTab').addEventListener('click', () => {
    panel.querySelector('#plannerDragTab').classList.add('active');
    panel.querySelector('#plannerSmartTab').classList.remove('active');
  });

  const close = () => { overlay.remove(); style.remove(); document.getElementById('splitDragGhost')?.remove(); };
  panel.querySelector('[data-close]').addEventListener('click', close);
  panel.querySelector('#plannerCancel').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  panel.querySelector('#plannerSave').addEventListener('click', async () => {
    const all = expandDeliveryUnits().map(u => u.key);
    const assigned = working.flatMap(s => s.unitKeys || []);
    if (working.length < 2) {
      await NoshiUI.alert('أضف موعدًا ثانيًا على الأقل لاستخدام التقسيم.', { title: 'تقسيم التسليم' }); return;
    }
    if (working.some(s => !s.deliveryDate || !s.mandoub || !(s.unitKeys || []).length)) {
      await NoshiUI.alert('كل موعد يجب أن يحتوي تاريخًا ومندوبًا ومنتجًا واحدًا على الأقل.', { title: 'تقسيم التسليم' }); return;
    }
    if (assigned.length !== all.length || new Set(assigned).size !== all.length) {
      await NoshiUI.alert('يجب توزيع كل قطعة مرة واحدة فقط.', { title: 'تقسيم التسليم' }); return;
    }
    deliveryPlan = working.map(s => ({ ...s, unitKeys: [...(s.unitKeys || [])] }));
    updateDeliveryFeeItemFromPlan(deliveryPlan);
    deliveryPlanSignature = cartDeliverySignature();
    const first = deliveryPlan[0];
    const input = document.getElementById('deliveryDateInput');
    if (input) input.value = first.deliveryDate;
    selectedMandoub = first.mandoub;
    document.getElementById('selectMandoubBtn').textContent = first.mandoub === '__UNASSIGNED__' ? '⏳ لم يتم تحديد المندوب' : '🚚 ' + first.mandoub;
    updateSplitDeliverySummary();
    updateApproveButtonState();
    close();
  });
  render();
}

document.getElementById('splitDeliveryBtn')?.addEventListener('click', openSplitDeliveryPlanner);
function formatArabicDeliveryDate(value) {
  if (!value) return '📅 تاريخ تسليم الطلب';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '📅 تاريخ تسليم الطلب';
  return '📅 ' + new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
    day:'numeric', month:'short', year:'numeric', hour:'numeric', minute:'2-digit'
  }).format(d);
}
function syncDeliveryDateButton() {
  const input = document.getElementById('deliveryDateInput');
  const btn = document.getElementById('deliveryDatePickerBtn');
  if (input && btn) btn.textContent = formatArabicDeliveryDate(input.value);
}
document.getElementById('deliveryDatePickerBtn')?.addEventListener('click', () => {
  const input = document.getElementById('deliveryDateInput');
  if (!input) return;
  try { input.showPicker?.(); } catch (_) { input.focus(); input.click(); }
});
document.getElementById('deliveryDateInput')?.addEventListener('change', syncDeliveryDateButton);
document.getElementById('deliveryDateInput')?.addEventListener('input', syncDeliveryDateButton);
setTimeout(syncDeliveryDateButton, 0);


function validateBeforeApprove() {
    document.getElementById("paymentError").style.display = "none";
    document.getElementById("clientSelectError").style.display = "none";
    document.getElementById("mandoubSelectError").style.display = "none";
    
    if (cart.length === 0) {
        alert("❗ السلة فارغة! يرجى إضافة منتجات أولاً");
        return false;
    }
    
const chosenClient = clientSelect.value.trim();

if (!chosenClient || !clients.some(c => (c.name || "").trim() === chosenClient)) {
  document.getElementById("clientSelectError").style.display = "block";
  clientSelect.focus();
  return false;
}

    if (!hasValidDeliveryPlan() && !selectedMandoub) {
        document.getElementById("mandoubSelectError").style.display = "block";
        return false;
    }
    
if (paymentMethod === null) {
    document.getElementById("paymentError").style.display = "block";
    return false;
}
    
    return true;
}

function calculateOriginalTotal() {
    let sum = 0;
    cart.forEach(item => {
        sum += item.price * item.qty;
    });
    return sum; // تأكد من إرجاع رقم (Number) وليس نصًا (String)
}

function resetSystem() {
    cart = [];
    generalDiscount = 0;
    paymentMethod = null;
    selectedMandoub = null;
    deliveryPlan = null;
    deliveryPlanSignature = "";
    updateSplitDeliverySummary();
    
    discountInput.value = "";
    clientSelect.value = "";
    document.getElementById('selectMandoubBtn').textContent = '-- اختر المندوب --';
    
    document.querySelectorAll('.payment-method-btn').forEach(b => {
        b.style.background = '#f0f0f0';
        b.style.color = '#333';
    });

    updateCart();
}

function updateApproveButtonState() {
  const approveBtn = document.getElementById("approveOrderBtn");

  const hasItems = cart.length > 0;

  const chosenClient = (clientSelect.value || "").trim();
  const hasClient =
    chosenClient !== "" &&
    clients.some(c => (c.name || "").trim() === chosenClient);

  const planValid = hasValidDeliveryPlan();
  const hasMandoub = planValid || selectedMandoub !== null;
  const hasPaymentMethod = paymentMethod !== null;

  const deliveryInput = document.getElementById("deliveryDateInput");
  const hasDeliveryDate = planValid || (deliveryInput && deliveryInput.value !== "");

  approveBtn.disabled = !(hasItems && hasClient && hasMandoub && hasPaymentMethod && hasDeliveryDate);
}


// إضافة المستمع لوقت التسليم
document.getElementById("deliveryDateInput").addEventListener("change", function() {
  document.getElementById("deliveryDateError").style.display = "none";
  updateApproveButtonState();
});


const productImageMap = (() => {
  const map = {};
  [...cakes, ...sweets, ...extras].forEach(p => {
    map[p.name] = p.img;
  });
  return map;
})();


function isGeneralDiscountExcluded(item) {
  const name = String(item?.originalName || item?.name || "").trim();
  return name === "مندوب" || name === "صحن تقديم" || name === "شريط عبارة";
}

function clampDiscountPercent(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function calculateItemFinancials(item) {
  const qty = Math.max(0, Number(item.qty || 0));
  const unitHalalas = Math.round(Number(item.price || 0) * 100);
  const before = unitHalalas * qty;

  const individualBp = Math.round(clampDiscountPercent(item.discount) * 100);
  const individualDiscount = Math.round(before * individualBp / 10000);
  const afterIndividual = before - individualDiscount;

  const generalBp = isGeneralDiscountExcluded(item)
    ? 0
    : Math.round(clampDiscountPercent(generalDiscount) * 100);

  const generalDiscountAmount = Math.round(afterIndividual * generalBp / 10000);
  const finalHalalas = afterIndividual - generalDiscountAmount;

  return {
    before,
    individualDiscount,
    generalDiscountAmount,
    finalHalalas
  };
}

function calculateCartFinancials() {
  return cart.reduce((sum, item) => {
    const x = calculateItemFinancials(item);
    sum.before += x.before;
    sum.individualDiscount += x.individualDiscount;
    sum.generalDiscount += x.generalDiscountAmount;
    sum.final += x.finalHalalas;
    return sum;
  }, { before: 0, individualDiscount: 0, generalDiscount: 0, final: 0 });
}

function updateCart() {
  cartList.innerHTML = "";
  total = 0;
  let originalTotal = 0;
  let totalDiscountAmount = 0;

  cart.forEach((item, index) => {
    const originalPrice = Number(item.price || 0);
    const qty = Number(item.qty || 0);
    const financials = calculateItemFinancials(item);
    const subtotalBeforeDiscount = financials.before / 100;
    const subtotalAfterDiscount = financials.finalHalalas / 100;

    // تجميع الإجماليات
    total += subtotalAfterDiscount;
    originalTotal += subtotalBeforeDiscount;

    // حساب الخصومات
    if (subtotalAfterDiscount < subtotalBeforeDiscount) {
      totalDiscountAmount += subtotalBeforeDiscount - subtotalAfterDiscount;
    }

    // النص بجانب كل منتج
    let discountText = "";
    if (subtotalAfterDiscount < subtotalBeforeDiscount) {
      const appliedDiscountPercent = (
        (1 - subtotalAfterDiscount / subtotalBeforeDiscount) * 100
      ).toFixed(0);
      discountText = `بعد الخصم ${appliedDiscountPercent}٪ ← ${subtotalAfterDiscount.toFixed(2)} ريال`;
    }

    // بناء العنصر
    let li = document.createElement("li");
const imgSrc =
  productImageMap[item.originalName] ||
  productImageMap[item.name] ||
  "images/thumbs/extra.webp";


li.innerHTML = `
  <div class="cart-row">

    <!-- الصورة (يمين) -->
    <img class="cart-thumb" src="${imgSrc}" alt="${item.name}" loading="lazy" decoding="async">

    <!-- الخط الفاصل -->
    <div class="cart-divider"></div>

<div class="cart-mid">
  <div class="cart-title">${item.name}</div>

  <div class="cart-line">
    ${qty} × ${originalPrice.toFixed(2)} = ${subtotalBeforeDiscount.toFixed(2)} ريال
  </div>

  ${discountText ? `<div class="cart-sub">${discountText}</div>` : ``}
</div>


    <!-- الأزرار (يسار) -->
    <div class="cart-actions-vert">
      <button class="edit-btn" onclick="openEditModal(${index})">✏️</button>
      <button class="remove-btn" onclick="removeFromCart(${index})">❌</button>
    </div>

  </div>
`;


    cartList.appendChild(li);
  });

  // تحديث الإجمالي
  totalElAmount.textContent = total.toFixed(2);

  // تفاصيل الخصم
  const discountDetailsEl = document.getElementById("discountDetails");
  if (totalDiscountAmount > 0) {
    discountDetailsEl.style.display = "block";
    discountDetailsEl.innerHTML = `
      تم تطبيق خصم: ${totalDiscountAmount.toFixed(2)} ريال.<br>
      السعر قبل الخصم: ${originalTotal.toFixed(2)} ريال.<br>
      السعر بعد الخصم: ${total.toFixed(2)} ريال.
    `;
  } else {
    discountDetailsEl.style.display = "none";
  }

  updateApproveButtonState();
  updateProductButtons();
}


const deliveryInput = document.getElementById("deliveryDateInput");
const countdownDiv = document.getElementById("deliveryCountdown");
let countdownInterval;

deliveryInput.addEventListener("change", () => {
  if (countdownInterval) clearInterval(countdownInterval);
  updateCountdown();
  // نحدّث العد التنازلي كل دقيقة
  countdownInterval = setInterval(updateCountdown, 60000);
});

function updateCountdown() {
  const val = deliveryInput.value;
  if (!val) {
    countdownDiv.textContent = "";
    return;
  }

  const deliveryTime = new Date(val);
  const now = new Date();
  const diff = deliveryTime - now;

  if (diff <= 0) {
    countdownDiv.textContent = "⏰ انتهى وقت التسليم";
    countdownDiv.style.color = "red";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let result = "متبقي: ";
  if (days > 0) result += `${days} يوم `;
  if (hours > 0) result += `${hours} ساعة `;
  result += `${minutes} دقيقة`;

  countdownDiv.textContent = result;
  countdownDiv.style.color = "#27ae60"; // أخضر
}

function fillReceipt() {
  if (!window.NoshiInvoice) throw new Error("invoice.js لم يتم تحميله");
  NoshiInvoice.render(document.getElementById("receipt"), {
    date: new Date().toISOString().split("T")[0],
    items: cart,
    generalDiscount: Number(document.getElementById("discountInput")?.value || 0),
    totalBefore: calculateCartFinancials().before / 100,
    totalAfter: calculateCartFinancials().final / 100
  });
}

let preparedInvoiceBlob = null;

function invoiceShareFile(blob) {
  return new File([blob], 'طلب.png', { type: 'image/png' });
}

function canShareInvoiceFile(file) {
  return !!(navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] })));
}

async function shareInvoiceBlob(blob) {
  const file = invoiceShareFile(blob);
  if (!canShareInvoiceFile(file)) {
    throw new Error('FILE_SHARE_UNSUPPORTED');
  }
  await navigator.share({
    title: 'طلب من نوشي بيكري',
    text: 'تفاصيل الطلب 💕',
    files: [file]
  });
}

function closeInvoiceShareReady() {
  document.getElementById('invoiceShareReady')?.remove();
}

function showInvoiceShareReady(blob) {
  closeInvoiceShareReady();
  const overlay = document.createElement('div');
  overlay.id = 'invoiceShareReady';
  overlay.dir = 'rtl';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(28,20,24,.62);display:grid;place-items:center;padding:18px;box-sizing:border-box';

  const box = document.createElement('div');
  box.style.cssText = 'width:min(92vw,360px);background:#fff;border-radius:22px;padding:18px;box-shadow:0 18px 45px rgba(0,0,0,.28);text-align:center';
  box.innerHTML = '<div style="font-size:40px;margin-bottom:8px">📤</div><strong style="display:block;font-size:18px;color:#3b2730;margin-bottom:6px">الفاتورة جاهزة للمشاركة</strong><div style="font-size:13px;color:#786a70;margin-bottom:14px">لن يتم حفظ الصورة في الجهاز.</div>';

  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.textContent = 'مشاركة الآن';
  shareBtn.style.cssText = 'width:100%;min-height:52px;border:0;border-radius:14px;background:#3498db;color:white;font-size:17px;font-weight:900;cursor:pointer';
  shareBtn.addEventListener('click', async () => {
    try {
      await shareInvoiceBlob(blob);
      closeInvoiceShareReady();
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.error('Invoice share failed:', error);
      await NoshiUI.alert('تعذر فتح نافذة المشاركة على هذا المتصفح.', { title: 'مشاركة الفاتورة' });
    }
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'إلغاء';
  cancelBtn.style.cssText = 'width:100%;min-height:46px;margin-top:8px;border:0;border-radius:14px;background:#eee;color:#555;font-size:15px;font-weight:800;cursor:pointer';
  cancelBtn.addEventListener('click', closeInvoiceShareReady);
  box.append(shareBtn, cancelBtn);
  overlay.appendChild(box);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeInvoiceShareReady(); });
  document.body.appendChild(overlay);
}

async function buildInvoiceBlob() {
  fillReceipt();
  const receipt = document.getElementById('receipt');
  receipt.style.display = 'block';
  const productStrikeLine = receipt.querySelector('.invoice-old-total [aria-hidden="true"]');
  if (productStrikeLine) productStrikeLine.style.background = '#ef9a9a';
  try {
    const canvas = await html2canvas(receipt, {
      scale: Math.min(2, window.devicePixelRatio || 1.5),
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null
    });
    return await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  } finally {
    receipt.style.display = 'none';
  }
}

document.getElementById('shareBtn').addEventListener('click', async function() {
  const btn = this;
  if (btn.disabled) return;
  btn.disabled = true;
  const oldText = btn.textContent;
  btn.textContent = 'جاري تجهيز الفاتورة…';
  try {
    const blob = preparedInvoiceBlob || await buildInvoiceBlob();
    preparedInvoiceBlob = null;
    if (!blob) throw new Error('BLOB_FAILED');
    try {
      // المحاولة الأولى مباشرة: لا معاينة ولا حفظ ولا تنزيل.
      await shareInvoiceBlob(blob);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      // بعض إصدارات Safari تفقد صلاحية المشاركة أثناء إنشاء الصورة async.
      // نعرض زر مشاركة وسطي فقط؛ الضغطة التالية تفتح Share Sheet مباشرة.
      showInvoiceShareReady(blob);
    }
  } catch (error) {
    console.error('Error generating receipt image:', error);
    await NoshiUI.alert('حدث خطأ أثناء إنشاء صورة الفاتورة.', { title: 'مشاركة الفاتورة' });
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
  }
});

/* تحويل الأرقام العربية إلى إنجليزية (لجميع الحقول الرقمية) */
document.addEventListener("input", e => {
  const el = e.target;

  // أضف #discountInput هنا عشان يشتغل مع الخصم العام
  if (el.matches("#editQty, #editPrice, #editDiscount, #discountInput")) {
    let val = el.value;
    
    // تحويل الأرقام العربية
    val = val.replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]);
    
    // تحويل الأرقام الفارسية/الهندية (إذا وجدت)
    val = val.replace(/[۰-۹]/g, d => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)]);
    
    // السماح بالأرقام + النقطة فقط
    val = val.replace(/[^0-9.]/g, "");
    
    // منع أكثر من نقطة
    val = val.replace(/(\..*)\./g, "$1");
    
    el.value = val;
  }
});

// ========== زر الإعدادات ونسخ البيانات ==========
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const backupDataBtn = document.getElementById('backupDataBtn');

// فتح المودال
if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
  });
}

// إغلاق المودال
function closeSettingsModal() {
  settingsModal.style.display = 'none';
}

if (closeSettingsBtn) {
  closeSettingsBtn.addEventListener('click', closeSettingsModal);
}

// إغلاق المودال عند الضغط خارج المحتوى
if (settingsModal) {
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettingsModal();
  });
}

// دالة النسخ الاحتياطي والمشاركة - نسخة 100% مثل الكود المستقل
async function downloadAndShareAllData() {
  try {
    const allData = await NoshiDB.exportAll();
    // لا ننشئ ملفًا صامتًا أو ناقصًا: تحقق بنيوي قبل التنزيل.
    const backupSummary = NoshiDB.verifyBackup ? NoshiDB.verifyBackup(allData) : null;
    if (!allData.salesData || typeof allData.salesData !== "object") {
      throw new Error("النسخة الاحتياطية لا تحتوي salesData");
    }

    const text = JSON.stringify(allData, null, 2);
    // تحقق ثانٍ بعد التسلسل لضمان أن الملف الذي سينزل قابل للقراءة فعلًا.
    const parsedBack = JSON.parse(text);
    if (NoshiDB.verifyBackup) NoshiDB.verifyBackup(parsedBack);
    const blob = new Blob([text], { type: "application/json" });
    const fileName = "all_data.json";

    // تحميل الملف أولاً
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // محاولة فتح قائمة المشاركة
    try {
      const file = new File([blob], fileName, { type: "application/json" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          title: "نسخة احتياطية للبيانات",
          text: backupSummary ? `نسخة نوشي الكاملة — ${backupSummary.orders} طلب` : "نسخة نوشي الكاملة",
          files: [file],
        }).then(() => {
          showMessage("✅ تم فتح نافذة المشاركة");
        }).catch(() => {
          showMessage("✅ تم تحميل الملف! يمكنك مشاركته لاحقاً");
        });
      } else {
        showMessage("✅ تم تحميل الملف!");
      }
    } catch (err) {
      showMessage("✅ تم تحميل الملف!");
    }

  } catch (error) {
    console.error("فشل إنشاء النسخة الاحتياطية من IndexedDB:", error);
    alert("❌ حدث خطأ أثناء إنشاء النسخة الاحتياطية");
  }
}

function downloadBackup(blob, fileName) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

if (backupDataBtn) {
  backupDataBtn.addEventListener('click', () => {
    downloadAndShareAllData();
  });
}

// ----------------------------------------------
// مودال إلزامي لإدخال رقم الجوال للعميل القديم
// ----------------------------------------------

let clientPhoneModal = null;
let pendingClientName = null;
let pendingClientIndex = null;

function createClientPhoneModal() {
  const existingModal = document.getElementById("clientPhoneModal");
  if (existingModal) existingModal.remove();

  const modalDiv = document.createElement("div");
  modalDiv.id = "clientPhoneModal";
  modalDiv.style.cssText = `
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    z-index: 1000000;
    align-items: center;
    justify-content: center;
    font-family: 'Cairo', sans-serif;
  `;
  modalDiv.innerHTML = `
    <div style="background: white; width: 90%; max-width: 350px; border-radius: 20px; padding: 20px; text-align: center; direction: rtl;">
      <h3 style="color: #d35400; margin-bottom: 15px;">📞 إضافة رقم الجوال</h3>
      <p style="margin-bottom: 15px; font-size: 0.95rem;">العميل <strong id="modalClientName"></strong> ليس لديه رقم جوال مسجل.</p>
      <label style="display: block; text-align: right; margin-bottom: 5px; font-weight: bold;">رقم الجوال (واتساب):</label>
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <input type="tel" id="modalClientPhone" placeholder="مثال: 05xxxxxxxx" style="flex: 3; padding: 10px; border-radius: 12px; border: 2px solid #e67e22; font-size: 16px;" />
        <button id="pastePhoneBtn" style="flex: 1; background: #8e44ad; color: white; border: none; border-radius: 12px; padding: 10px; font-weight: bold; cursor: pointer; font-size: 0.9rem;">📋 لصق</button>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="saveClientPhoneBtn" style="flex: 1; background: #27ae60; color: white; border: none; border-radius: 12px; padding: 10px; font-weight: bold; cursor: pointer;">💾 حفظ</button>
        <button id="cancelClientPhoneBtn" style="flex: 1; background: #e74c3c; color: white; border: none; border-radius: 12px; padding: 10px; font-weight: bold; cursor: pointer;">إلغاء</button>
      </div>
    </div>
  `;
  document.body.appendChild(modalDiv);

  // زر لصق
  document.getElementById("pastePhoneBtn").onclick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        document.getElementById("modalClientPhone").value = text.trim();
        showMessage("📋 تم لصق رقم الجوال");
      } else {
        showMessage("الحافظة فارغة");
      }
    } catch (err) {
      const text = await NoshiUI.prompt("الرجاء لصق رقم الجوال هنا:", { title: "رقم الجوال", type: "tel", inputMode: "tel", placeholder: "05xxxxxxxx" });
      if (text && text.trim()) {
        document.getElementById("modalClientPhone").value = text.trim();
        showMessage("📋 تم لصق رقم الجوال");
      }
    }
  };

  // زر حفظ
  document.getElementById("saveClientPhoneBtn").onclick = async () => {
    let phone = document.getElementById("modalClientPhone").value.trim();
    const formattedPhone = formatSaudiPhone(phone);
    if (formattedPhone === null) {
      alert("رقم الجوال غير صحيح. استخدم رقم سعودي مثل 0501234567");
      return;
    }
    phone = formattedPhone;
    if (!phone) {
      alert("يرجى إدخال رقم الجوال");
      return;
    }
    if (pendingClientIndex !== null && clients[pendingClientIndex]) {
      clients[pendingClientIndex].phone = phone;
      try {
  await NoshiDB.set("clients", clients);
} catch (error) {
  console.error("فشل حفظ رقم جوال العميل في IndexedDB:", error);
  alert("حدث خطأ أثناء حفظ رقم الجوال");
  return;
}
      loadClientsToSelect();
      document.getElementById("clientSelectError").style.display = "none";
      clientSelect.value = pendingClientName;
      showMessage(`✅ تم حفظ رقم الجوال للعميل ${pendingClientName}`);
    }
    modalDiv.style.display = "none";
    pendingClientName = null;
    pendingClientIndex = null;
    updateApproveButtonState();
  };

  // زر إلغاء
  document.getElementById("cancelClientPhoneBtn").onclick = () => {
    modalDiv.style.display = "none";
    pendingClientName = null;
    pendingClientIndex = null;
    clientSelect.value = "";
    showMessage("❌ لم يتم إدخال رقم الجوال، يرجى اختيار عميل آخر");
    updateApproveButtonState();
  };

  return modalDiv;
}

function showClientPhoneModal(clientName, clientIndex) {
  if (!clientPhoneModal) {
    clientPhoneModal = createClientPhoneModal();
  }
  pendingClientName = clientName;
  pendingClientIndex = clientIndex;
  document.getElementById("modalClientName").textContent = clientName;
  document.getElementById("modalClientPhone").value = "";
  clientPhoneModal.style.display = "flex";
}

function checkClientPhone() {
  const selectedName = clientSelect.value.trim();
  if (!selectedName) return;

  const clientIndex = clients.findIndex(c => (c.name || "").trim() === selectedName);
  if (clientIndex === -1) return;

  const client = clients[clientIndex];
  if (!client.phone || client.phone.trim() === "") {
    showClientPhoneModal(client.name, clientIndex);
  } else {
    document.getElementById("clientSelectError").style.display = "none";
  }
}
async function pasteQuickClientName() {
  try {
    const text = await navigator.clipboard.readText();
    document.getElementById("quickClientName").value = text;
  } catch {
    alert("تعذر الوصول للحافظة");
  }
}

async function pasteQuickClientPhone() {
  try {
    const text = await navigator.clipboard.readText();
    document.getElementById("quickClientPhone").value = text;
  } catch {
    alert("تعذر الوصول للحافظة");
  }
}
