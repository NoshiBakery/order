/* =========================================================
   FILE: js/client-history.js
   SOURCE PAGE: client-history.html
   PURPOSE: Page-specific JavaScript extracted from the HTML.
   DATA SAFETY: This is a structural refactor only; field names,
   storage keys, save ordering, and business rules must remain compatible.
   MAINTENANCE RULE: Shared services stay in their existing shared files.
========================================================= */


/* ---- Extracted inline script block 1 (original order preserved) ---- */
const PRODUCT_IMAGES = {
      "كيكة ليمون":"images/thumbs/lemon.webp","كيكة سينابون":"images/thumbs/cinnamon1.webp","كيكة برتقال":"images/thumbs/orange.webp","كيكة رمل":"images/thumbs/sand.webp","كيكة كوكيز":"images/thumbs/cookies.webp","كيكة ماربل":"images/thumbs/marble.webp","كيكة دايجستف":"images/thumbs/digestive.webp","كيك دايجستف ميني":"images/thumbs/digestive.webp","كيكة تمر":"images/thumbs/dates.webp","قرص عقيلي":"images/thumbs/aqeeli.webp","كيكة شوكليت":"images/thumbs/choco.webp","ميني كيك ليمون":"images/thumbs/minilemon.webp","كيكة الكيري":"images/thumbs/kiri.webp","خلية قرفة":"images/thumbs/honey1.webp","خلية سمسم":"images/thumbs/honey2.webp","خلية سميد":"images/thumbs/honey3.webp","تاوة نوشي":"images/thumbs/tawa.webp","تاوة نوشي ميني":"images/thumbs/tawamini.webp","سينابون":"images/thumbs/cinnabon.webp","كرات الشعيرية":"images/thumbs/shariya.webp","فطيرة حلزونية":"images/thumbs/spiral.webp","تارت تفاح":"images/thumbs/tart.webp","تارت تشيز التمر":"images/thumbs/tartdate.webp","بوب كيك ليمون":"images/thumbs/popcakelemon.webp","بوب كيك شوكليت":"images/thumbs/popcakechoco.webp","بسبوسة":"images/thumbs/basbousa.webp","تشيز القشد":"images/thumbs/chesedate.webp","فطيرة المربى":"images/thumbs/jam.webp","وردات الشوكولاتة":"images/thumbs/rose.webp","تارت البيكان":"images/thumbs/bekan.webp","صحن تقديم":"images/thumbs/plate.webp","مندوب":"images/thumbs/delivery.webp","تكلفة إضافية":"images/thumbs/extra.webp"
    };
    let clients=[], salesData={}, currentClient=null, currentOrders=[];
    const $ = id => document.getElementById(id);
    const money = n => `${safe(n).toFixed(2)} ريال`;
    const safe = v => { const n=parseFloat(v); return isNaN(n)?0:n; };
    const esc = v => String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
    const params = new URLSearchParams(location.search);

    document.addEventListener("DOMContentLoaded", boot);

    async function readData(){
      let dbOk=false;
      try{
        if(window.NoshiDB){
          const live = await NoshiDB.getMany(["clients", "salesData"], { clients: [], salesData: {} });
          clients = live.clients;
          salesData = live.salesData;
          dbOk = true;
        }
      }catch(e){ console.warn("IndexedDB read failed", e); }
      if(!Array.isArray(clients)) clients = [];
      if(!salesData || typeof salesData !== "object" || Array.isArray(salesData)) salesData = {};
      return dbOk;
    }

    async function boot(){
      try{
        await readData();
        const id = params.get("id");
        currentClient = clients.find(c => String(c.id) === String(id));
        if(!currentClient){ showPicker(); return; }
        currentOrders = getClientOrders(currentClient);
        renderAll();
        $("loading").classList.add("hide");
        $("app").classList.remove("hide");
      }catch(e){
        console.error(e);
        $("loading").textContent = "❌ حدث خطأ أثناء تحميل بيانات العميل. افتح Console وأرسل الخطأ.";
      }
    }

    function showPicker(){
      $("loading").classList.add("hide");
      const box = $("clientPicker");
      if(!clients.length){ box.innerHTML = `<div class="fatal">لا توجد بيانات عملاء. استورد النسخة أولًا.</div>`; }
      else{
        box.innerHTML = clients.map(c => `<button class="client-pick" onclick="location.href='client-history-v2.html?id=${encodeURIComponent(c.id)}'">👤 ${esc(c.name)}<span>${esc(c.phone || 'بدون رقم')} • ${esc(c.date || 'بدون تاريخ')}</span></button>`).join("");
      }
      $("picker").classList.remove("hide");
    }

    function getAllOrders(){
      let arr=[];
      Object.values(salesData || {}).forEach(monthOrders => { if(Array.isArray(monthOrders)) arr = arr.concat(monthOrders); });
      return arr;
    }
    function getClientOrders(client){
      return getAllOrders().filter(o => String(o.clientId || "") === String(client.id || "") || (!o.clientId && o.client === client.name))
        .sort((a,b)=> new Date(b.date || 0) - new Date(a.date || 0));
    }
    function orderItems(order){ return Array.isArray(order.items) ? order.items : []; }
    function isDelivery(item){ return (item.originalName || item.name) === "مندوب"; }
    function itemBefore(item){ return safe(item.price) * safe(item.qty); }
    function itemAfter(item, order){
      let total = itemBefore(item);
      if(safe(item.discount)>0) total *= (1 - safe(item.discount)/100);
      const name = item.originalName || item.name;
      if(safe(order.generalDiscount)>0 && name !== "مندوب" && name !== "صحن تقديم") total *= (1 - safe(order.generalDiscount)/100);
      return total;
    }
    function orderBefore(order){ const calc=orderItems(order).reduce((s,i)=>s+itemBefore(i),0); return safe(order.totalBefore)||calc; }
    function orderAfter(order){ const calc=orderItems(order).reduce((s,i)=>s+itemAfter(i,order),0); return safe(order.totalAfter)||calc; }
    function orderQty(order){ return orderItems(order).filter(i=>!isDelivery(i)).reduce((s,i)=>s+safe(i.qty),0); }
    function deliveryTotal(order){ return orderItems(order).filter(isDelivery).reduce((s,i)=>s+itemBefore(i),0); }
function payment(order){
  // حالة تشيك بوكس السداد للكاش
  const cashPaid =
    order.paidByEmad === true ||
    order.checkboxStatus === true ||
    order.cashReceived === true;

  if(order.paymentMethod === "cash") {
    return {
      method: "نقد",
      methodClass: "b-purple",
      status: cashPaid ? "مدفوع" : "بانتظار الدفع",
      paid: cashPaid
    };
  }

  if(order.paymentMethod === "transfer") {
    return {
      method: "تحويل",
      methodClass: "b-blue",
      status: order.transferred ? "تم التحويل" : "بانتظار التحويل",
      paid: !!order.transferred
    };
  }

  return {
    method: "غير محدد",
    methodClass: "b-gray",
    status: "غير محدد",
    paid: false
  };
}
    function imgFor(name){ return PRODUCT_IMAGES[name] || PRODUCT_IMAGES[String(name||"").replace(/\s+\d+$/,'')] || "images/thumbs/extra.webp"; }
    function fmtDate(v){ return v ? String(v).replace("T"," ").slice(0,16) : "—"; }

    function renderAll(){
      const name = currentClient.name || "عميل";
      $("clientName").textContent = name;
      $("avatar").textContent = name.trim().slice(0,1) || "ع";
      $("clientMeta").textContent = `📞 ${currentClient.phone || 'بدون رقم'} • 📅 انضم: ${currentClient.date || 'غير محدد'}`;
      renderStats(); renderCircles(); renderSmart(); renderProducts(); renderOrders();
      ["searchInput","statusFilter","sortFilter"].forEach(id => $(id).addEventListener("input", renderOrders));
      $("statusFilter").addEventListener("change", renderOrders); $("sortFilter").addEventListener("change", renderOrders);
    }
    function computeStats(){
      const before=currentOrders.reduce((s,o)=>s+orderBefore(o),0), after=currentOrders.reduce((s,o)=>s+orderAfter(o),0), del=currentOrders.reduce((s,o)=>s+deliveryTotal(o),0);
      const paid=currentOrders.filter(o=>payment(o).paid).length;
      const qty=currentOrders.reduce((s,o)=>s+orderQty(o),0);
      const highest=Math.max(0,...currentOrders.map(orderAfter));
      const avg=currentOrders.length? after/currentOrders.length:0;
      return {orders:currentOrders.length,before,after,discount:Math.max(before-after,0),del,paid,unpaid:currentOrders.length-paid,qty,highest,avg,first:currentOrders.at(-1)?.date,last:currentOrders[0]?.date};
    }
    function tier(s){
      if(s.after >= 3000 || s.orders >= 25) return "👑 VIP ذهبي";
      if(s.after >= 1200 || s.orders >= 12) return "⭐ عميل مميز";
      if(s.orders >= 4) return "🌱 عميل واعد";
      return "🧁 عميل جديد";
    }
    function renderStats(){
      const s=computeStats(); $("clientTier").textContent = tier(s);
      const rows=[
        ["📦","عدد الطلبات",s.orders,"accent-purple"],["🧁","إجمالي المنتجات",s.qty,"accent-cyan"],["💰","قبل الخصم",money(s.before),""],["🏷️","إجمالي الخصم",money(s.discount),"accent-red"],["✅","الصافي",money(s.after),"accent-green"],["💎","أعلى فاتورة",money(s.highest),"accent-blue"],["📊","متوسط الطلب",money(s.avg),"accent-gold"],["🚚","مدفوع للمندوب",money(s.del),"accent-purple"],["🟢","طلبات مدفوعة",s.paid,"accent-green"],["🔴","طلبات معلقة",s.unpaid,"accent-red"],["🕒","أول طلب",fmtDate(s.first),"accent-blue"],["🆕","آخر طلب",fmtDate(s.last),"accent-cyan"]
      ];
      $("statsGrid").innerHTML = rows.map(r=>`<div class="card stat ${r[3]}"><div class="icon">${r[0]}</div><div class="label">${r[1]}</div><div class="value">${r[2]}</div></div>`).join("");
    }
    function productStats(){
      const map={};
      currentOrders.forEach(o=>orderItems(o).forEach(i=>{
        const name=i.originalName || i.name || "منتج"; if(isDelivery(i)) return;
        if(!map[name]) map[name]={name,qty:0,times:0,before:0,after:0};
        map[name].qty+=safe(i.qty); map[name].times+=1; map[name].before+=itemBefore(i); map[name].after+=itemAfter(i,o);
      }));
      return Object.values(map).sort((a,b)=>b.qty-a.qty || b.after-a.after);
    }
	
    function renderCircles(){
      const s=computeStats(), ps=productStats();
      const paidPct=s.orders?Math.round(s.paid/s.orders*100):0, discountPct=s.before?Math.round(s.discount/s.before*100):0, favPct=s.qty&&ps[0]?Math.round(ps[0].qty/s.qty*100):0;
      const data=[[paidPct,"#27ae60","نسبة السداد"],[discountPct,"#e74c3c","نسبة الخصم"],[favPct,"#8e44ad","سيطرة المنتج المفضل"]];
      $("circleGrid").innerHTML=data.map(d=>`<div class="card circle-card"><div class="ring" style="--p:${d[0]};--c:${d[1]}"><strong>${d[0]}%</strong></div><div class="circle-label">${d[2]}</div></div>`).join("");
    }
// أضف هذي الدالة
function getTopProductDisplay() {
  const allStats = productStats();
  if (!allStats || allStats.length === 0) return "—";
  
  const tray = allStats.find(p => p.name === "صحن تقديم");
  const topProduct = allStats[0];
  
  // إذا صحن التقديم هو الأول أو متساوي مع الأول
  if (tray && (tray === topProduct || (topProduct && tray.qty === topProduct.qty))) {
    const secondProduct = allStats.find(p => p.name !== "صحن تقديم");
    return secondProduct ? `صحن تقديم، ${secondProduct.name}` : "صحن تقديم";
  }
  
  return topProduct?.name || "—";
}

// وعدل هذي
function renderSmart(){
  const ps=productStats(), s=computeStats();
  const dayMap={}; 
  currentOrders.forEach(o=>{ 
    const d=new Date(o.date||""); 
    if(!isNaN(d)) dayMap[d.getDay()] = (dayMap[d.getDay()]||0)+1; 
  });
  const days=["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
  const bestDay=Object.entries(dayMap).sort((a,b)=>b[1]-a[1])[0];
  const methods={}; 
  currentOrders.forEach(o=>{ 
    const m=payment(o).method; 
    methods[m]=(methods[m]||0)+1; 
  });
  const bestMethod=Object.entries(methods).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—";
  const msg = s.unpaid>0 ? `لديه ${s.unpaid} طلب معلق` : s.orders?"كل الطلبات مسددة" : "لا توجد طلبات";
  
  // 🆕 استخدم الدالة الجديدة
  const topDisplay = getTopProductDisplay();
  
  const items=[
    ["🏆","المنتج الأكثر مبيعاً", topDisplay],
    ["📅","اليوم الأكثر طلبًا",bestDay?days[bestDay[0]]:"—"],
    ["💳","طريقة الدفع الغالبة",bestMethod],
    ["💡","اقتراح متابعة",msg]
  ];
  $("smartGrid").innerHTML=items.map(i=>`<div class="card smart"><span>${i[0]} ${i[1]}</span><b>${esc(i[2])}</b></div>`).join("");
}
    function renderProducts(){
      const ps=productStats();
      if(!ps.length){ $("productsGrid").innerHTML=`<div class="card empty">لا توجد منتجات لهذا العميل</div>`; return; }
      $("productsGrid").innerHTML=ps.map((p,i)=>{
        const r=i===0?'one':i===1?'two':i===2?'three':'';
        return `<div class="card product-card"><div class="thumb"><img src="${imgFor(p.name)}" alt="${esc(p.name)}" loading="lazy" decoding="async" onerror="this.remove();this.parentElement.classList.add('no-image')"></div><div><div class="pname"><span class="rank ${r}">${i<3?['🥇','🥈','🥉'][i]:'#'+(i+1)}</span>${esc(p.name)}</div><div class="mini-stats"><div class="mini"><small>الكمية</small><b>${p.qty}</b></div><div class="mini"><small>مرات الطلب</small><b>${p.times}</b></div><div class="mini"><small>الصافي</small><b>${money(p.after)}</b></div></div></div></div>`;
      }).join("");
    }
    function renderOrders(){
      const q=($("searchInput")?.value||"").trim().toLowerCase(), status=$("statusFilter")?.value||"all", sort=$("sortFilter")?.value||"newest";
      let list=currentOrders.filter(o=>{
        const pay=payment(o);
        const statusOk=status==='all'||(status==='paid'&&pay.paid)||(status==='unpaid'&&!pay.paid)||(status==='cash'&&o.paymentMethod==='cash')||(status==='transfer'&&o.paymentMethod==='transfer');
        const text=[o.date,o.deliveryDate,o.deliveryPerson,o.mandoub,o.globalNote,...orderItems(o).map(i=>i.name)].join(' ').toLowerCase();
        return statusOk && (!q || text.includes(q));
      });
      list.sort((a,b)=> sort==='oldest'?new Date(a.date||0)-new Date(b.date||0):sort==='highest'?orderAfter(b)-orderAfter(a):sort==='products'?orderQty(b)-orderQty(a):new Date(b.date||0)-new Date(a.date||0));
      if(!list.length){ $("ordersList").innerHTML=`<div class="card empty">لا توجد طلبات مطابقة</div>`; return; }
      $("ordersList").innerHTML=list.map((o,i)=>orderCard(o,i)).join("");
    }
    function orderCard(o,i){
      const pay=payment(o), before=orderBefore(o), after=orderAfter(o), disc=Math.max(before-after,0), paidClass=pay.paid?'paid':'unpaid';
      const items=orderItems(o).map(it=>{
        const name=it.originalName||it.name||"منتج", qty=safe(it.qty), price=safe(it.price), total=itemAfter(it,o);
        return `<div class="line"><div class="thumb"><img src="${imgFor(name)}" alt="${esc(name)}" loading="lazy" decoding="async" onerror="this.remove();this.parentElement.classList.add('no-image')"></div><div><div class="line-name">${esc(name)}</div><div class="line-meta">الكمية: ${qty} • السعر: ${money(price)}${safe(it.discount)?` • خصم المنتج: ${safe(it.discount)}%`:''}</div></div><div class="line-total">${money(total)}</div></div>`;
      }).join("");
      return `<article class="card order ${paidClass}"><div class="order-head"><div class="order-num">طلب #${i+1}</div><div style="font-weight:900;color:#555">${fmtDate(o.date)}</div></div><div><span class="badge ${pay.methodClass}">💳 ${pay.method}</span><span class="badge ${pay.paid?'b-green':'b-red'}">${pay.paid?'✅':'⏳'} ${pay.status}</span><span class="badge b-gray">🚚 ${esc(o.deliveryPerson||o.mandoub||'غير محدد')}</span>${o.deliveryDate?`<span class="badge b-blue">🕒 ${esc(o.deliveryDate)}</span>`:''}</div><div class="order-products">${items || '<div class="empty">لا توجد منتجات محفوظة</div>'}</div><div class="order-total"><div class="total-box"><small>قبل الخصم</small><b>${money(before)}</b></div><div class="total-box"><small>الخصم</small><b>${money(disc)}</b></div><div class="total-box"><small>الصافي</small><b>${money(after)}</b></div><div class="total-box"><small>المندوب</small><b>${money(deliveryTotal(o))}</b></div></div>${o.globalNote?`<div class="note">📝 ${esc(o.globalNote)}</div>`:''}</article>`;
    }


/* ---- Extracted inline script block 2 (original order preserved) ---- */
NoshiAuth.guard().catch(()=>{});
