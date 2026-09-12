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
        <div class="head"><div><div class="orderno">طلب #${esc(o.orderNumber||o.id)}</div><div class="phone">${esc(p.valid?p.formatted:o.phone)}</div></div><span class="badge ${c?'known':'new'}">${c?'✓ '+esc(c.name):'عميلة جديدة'}</span></div>
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
    const c=match(o), items=Array.isArray(o.items)?o.items:[], subtotal=items.reduce((s,i)=>s+Number(i.price||0)*Number(i.qty||i.quantity||1),0), fee=NoshiIncoming.deliveryFee(o.deliveryArea), grand=Number(o.total||subtotal+fee);
    detailsBody.innerHTML=`
      <div class="invoice-hero"><div><div class="invoice-number">فاتورة #${esc(o.orderNumber||o.id)}</div><div class="phone">${esc(NoshiIncoming.normalizeSaudiPhone(o.phone).formatted||o.phone)}</div></div><span class="invoice-status ${c?'known':'new'}">${c?esc(c.name):'عميلة جديدة'}</span></div>
      <div class="invoice-meta-grid">
        <div class="invoice-meta-box"><small>موعد التسليم</small><b>${esc(deliveryDT(o))}</b></div>
        <div class="invoice-meta-box"><small>منطقة التوصيل</small><b>${NoshiIncoming.deliveryAreaLabel(o.deliveryArea)}</b></div>
      </div>
      <div class="items">${items.map(i=>`<div class="item"><b>${esc(i.name||i.productName||'منتج')}</b><span>× ${esc(i.qty||i.quantity||1)}</span><span class="item-price">${money(Number(i.price||0)*Number(i.qty||i.quantity||1))}</span>${i.notes?`<small style="grid-column:1/-1;color:#806c62">${esc(i.notes)}</small>`:''}</div>`).join('')}</div>
      ${o.notes||o.note?`<div class="notes"><b>📝 ملاحظات الطلب</b><br>${esc(o.notes||o.note)}</div>`:''}
      <div class="invoice-totals"><div class="row"><span>المنتجات</span><b>${money(subtotal)}</b></div><div class="row"><span>التوصيل</span><b>${money(fee)}</b></div><div class="row grand"><span>الإجمالي</span><b>${money(grand)}</b></div></div>
      <div class="decision">${c?'<button class="accept" id="detailAccept">✓ قبول الطلب</button>':'<button class="create" id="detailCreate">＋ إنشاء العميلة أولًا</button>'}<button class="reject" id="detailReject">رفض</button></div>`;
    openSheet('detailsSheet');
    const a=document.getElementById('detailAccept'); if(a)a.onclick=()=>acceptOrder(o);
    const cr=document.getElementById('detailCreate'); if(cr)cr.onclick=()=>{closeSheet('detailsSheet');showCreate(o)};
    document.getElementById('detailReject').onclick=()=>rejectOrder(o);
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
