/* =========================================================
   FILE: js/dashboard.js
   SOURCE: inline script #1 from dashboard.html
   REFACTOR RULE: extracted in the SAME parser position.
   No business logic, storage key, or execution order changed.
========================================================= */
(function(){
  'use strict';
  let orders=[], clients=[], selected=null;
  const list=document.getElementById('list'), cloudState=document.getElementById('cloudState');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>Number(n||0).toFixed(2)+' ر.س';
  const today=()=>new Date().toISOString().slice(0,10);
  function openSheet(id){const el=document.getElementById(id);el.classList.add('show');el.setAttribute('aria-hidden','false')}
  function closeSheet(id){const el=document.getElementById(id);el.classList.remove('show');el.setAttribute('aria-hidden','true')}
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeSheet(b.dataset.close)));
  document.querySelectorAll('.sheet').forEach(s=>s.addEventListener('click',e=>{if(e.target===s)closeSheet(s.id)}));
  logoutBtn.addEventListener('click',()=>NoshiAuth.logout());
  refreshBtn.addEventListener('click',load);

  async function getClients(){
    clients=await NoshiDB.get('clients',[]); if(!Array.isArray(clients)) clients=[];
  }
  function match(order){return NoshiIncoming.findClientByPhone(clients,order.phone)}
  function deliveryDT(o){return NoshiIncoming.combineDeliveryDate(o)||'غير محدد'}
  function render(){
    if(!orders.length){list.innerHTML='<div class="state empty">لا توجد طلبات جديدة تحتاج قرارًا حاليًا.</div>';return}
    list.innerHTML=orders.map(o=>{
      const c=match(o), p=NoshiIncoming.normalizeSaudiPhone(o.phone);
      const items=Array.isArray(o.items)?o.items:[];
      const qty=items.reduce((n,i)=>n+Number(i.qty||i.quantity||1),0);
      const subtotal=items.reduce((n,i)=>n+(Number(i.price||0)*Number(i.qty||i.quantity||1)),0);
      const fee=NoshiIncoming.deliveryFee(o.deliveryArea);
      const grand=Number(o.total||subtotal+fee);
      return `<article class="card" data-id="${esc(o.id)}">
        <div class="head"><div class="customer-block"><div class="customer-label">العميلة</div><div class="customer-name">${c?esc(c.name):'عميلة جديدة'}</div><div class="phone">${esc(p.valid?p.formatted:o.phone)}</div></div><div class="order-side"><div class="orderno">طلب #${esc(o.orderNumber||o.id)}</div><span class="badge ${c?'known':'new'}">${c?'مسجلة':'جديدة'}</span></div></div>
        <div class="order-summary">
          <div class="summary-line"><span>🕒 موعد التسليم</span><b>${esc(deliveryDT(o))}</b></div>
          <div class="summary-line"><span>🚚 التوصيل</span><b>${NoshiIncoming.deliveryAreaLabel(o.deliveryArea)} · ${money(fee)}</b></div>
          <div class="summary-line"><span>🧁 محتوى الطلب</span><b>${qty} قطعة · ${items.length} صنف</b></div>
        </div>
        <div class="order-total-chip"><span>إجمالي الطلب</span><b>${money(grand)}</b></div>
        <div class="actions"><button class="details" data-action="details">🧾 عرض الفاتورة</button>${c?'<button class="accept" data-action="accept">✓ قبول</button>':'<button class="create" data-action="create">＋ إنشاء العميلة</button>'}<button class="reject" data-action="reject">رفض</button></div>
      </article>`
    }).join('');
  }
  list.addEventListener('click',async e=>{const b=e.target.closest('button[data-action]');if(!b)return;const card=b.closest('[data-id]');const o=orders.find(x=>String(x.id)===String(card.dataset.id));if(!o)return;selected=o; if(b.dataset.action==='details')showDetails(o); if(b.dataset.action==='create')showCreate(o); if(b.dataset.action==='accept')await acceptOrder(o); if(b.dataset.action==='reject')await rejectOrder(o)});

  function showDetails(o){
    if (!window.NoshiInvoice) {
      NoshiUI.alert('تعذر تحميل الفاتورة الموحدة invoice.js', { title: 'الفاتورة' });
      return;
    }
    const c = match(o);
    const items = Array.isArray(o.items) ? o.items.map(i => ({
      ...i,
      name: i.name || i.productName || 'منتج',
      qty: Number(i.qty || i.quantity || 1),
      price: Number(i.price || 0)
    })) : [];
    const subtotal = items.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.qty || 0), 0);
    const fee = NoshiIncoming.deliveryFee(o.deliveryArea);
    const grand = Number(o.total || subtotal + fee);
    const invoiceItems = items.slice();
    if (fee > 0) invoiceItems.push({ name:'مندوب', originalName:'مندوب', qty:1, price:fee, discount:0 });
    const invoiceOrder = {
      date: o.date || o.createdAt || today(),
      deliveryDate: NoshiIncoming.combineDeliveryDate(o) || '',
      client: c?.name || 'عميلة جديدة',
      items: invoiceItems,
      generalDiscount: 0,
      totalBefore: grand,
      totalAfter: grand,
      notes: o.notes || o.note || ''
    };
    NoshiInvoice.open(invoiceOrder, { showDeliveryInfo: true });
  }

  function showCreate(o){const p=NoshiIncoming.normalizeSaudiPhone(o.phone);newPhone.value=p.formatted||o.phone;newName.value='';joinDate.value=today();clientMsg.textContent='';openSheet('clientSheet');setTimeout(()=>newName.focus(),80)}
  createClientBtn.addEventListener('click',async()=>{if(!selected)return;clientMsg.textContent='';try{const c=NoshiIncoming.makeClient(newName.value,selected.phone,joinDate.value);if(clients.some(x=>(x.name||'').trim()===c.name))throw new Error('هذا الاسم موجود مسبقًا');if(NoshiIncoming.findClientByPhone(clients,c.phone))throw new Error('هذا الرقم أصبح مرتبطًا بعميلة موجودة');clients.push(c);await NoshiDB.set('clients',clients);closeSheet('clientSheet');render();showDetails(selected)}catch(e){clientMsg.textContent=e.message}});

  async function acceptOrder(o){
    const c=match(o); if(!c){showCreate(o);return}
    const draft=NoshiIncoming.toInternalDraft(o,c);
    try{
      // لا نغلق الطلب الخارجي هنا. يبقى New حتى يتم حفظه فعليًا داخل الطلبات.
      // بهذا لو خرج المستخدم من صفحة الطلب أو تعطل الحفظ، لا يختفي الطلب من لوحة الموقع.
      await NoshiDB.set('incomingOrderDraft',draft);
      location.href='index.html?incoming='+encodeURIComponent(o.id);
    }catch(e){alert('تعذر تجهيز الطلب: '+(e.message||e))}
  }
  async function rejectOrder(o){
    const yes=await NoshiUI.confirm('هل تريد رفض الطلب #'+(o.orderNumber||o.id)+'؟',{title:'رفض الطلب',confirmText:'رفض',cancelText:'إلغاء'}); if(!yes)return;
    try{if(NoshiAuth.enabled()) await NoshiAuth.api(`/api/incoming-orders/${encodeURIComponent(o.id)}/reject`,{method:'POST'});orders=orders.filter(x=>String(x.id)!==String(o.id));closeSheet('detailsSheet');render()}catch(e){alert('تعذر رفض الطلب: '+(e.message||e))}
  }
  async function load(){
    list.innerHTML='<div class="state">جاري تحميل الطلبات…</div>';
    try{
      const me=await NoshiAuth.guard(); if(me&&me.displayName)who.textContent='مرحبًا '+me.displayName+' — راجع الطلب قبل القبول أو الرفض';
      if(!NoshiAuth.enabled()){
        await getClients();
        cloudState.classList.remove('hidden');cloudState.textContent='الواجهة جاهزة. الطلبات الخارجية ستظهر هنا فور تفعيل Cloudflare في config.js وربط الـWorker.';orders=[];render();return;
      }
      cloudState.classList.add('hidden');
      const [clientRows,data]=await Promise.all([NoshiDB.get('clients',[]),NoshiAuth.api('/api/incoming-orders')]);
      clients=Array.isArray(clientRows)?clientRows:[];
      orders=Array.isArray(data)?data:(data.orders||[]);render();
    }catch(e){list.innerHTML='<div class="state">تعذر تحميل الطلبات. '+esc(e.message||e)+'</div>'}
  }
  load();
})();
