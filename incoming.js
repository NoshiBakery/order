(function(){
  "use strict";

  function normalizeSaudiPhone(phone){
    let digits=String(phone||"").replace(/\D/g,"");
    if(digits.startsWith("00966")) digits=digits.slice(2);
    if(digits.startsWith("966")) digits=digits.slice(3);
    if(digits.startsWith("0")) digits=digits.slice(1);
    if(!/^5\d{8}$/.test(digits)) return {valid:false, normalized:"", formatted:""};
    return {valid:true, normalized:"966"+digits, formatted:`+966 ${digits.slice(0,2)} ${digits.slice(2,5)} ${digits.slice(5)}`};
  }

  function deliveryFee(area){
    const v=String(area||"").toLowerCase();
    return ["inside","inside_mithnab","mithnab","داخل","داخل المذنب"].includes(v) ? 10 : 25;
  }

  function deliveryAreaLabel(area){ return deliveryFee(area)===10 ? "داخل المذنب" : "خارج المذنب"; }

  /* =========================================================
     TIME DISPLAY CONTRACT — NOSHI
     All user-facing times in the internal system MUST use 12-hour
     format (ص / م). Stored values remain unchanged as local
     YYYY-MM-DD HH:mm / datetime-local compatible strings.
  ========================================================= */
  function combineDeliveryDate(order){
    if(order.deliveryDateTime) return String(order.deliveryDateTime).replace('T',' ').slice(0,16);
    if(order.deliveryDate && order.deliveryTime) return `${order.deliveryDate} ${order.deliveryTime}`;
    if(order.deliveryDate) return String(order.deliveryDate).replace('T',' ').slice(0,16);
    return "";
  }

  function parseLocalDateTime(value){
    const raw=String(value||"").trim();
    const m=raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
    if(!m) return null;
    const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),Number(m[4]||0),Number(m[5]||0));
    return Number.isNaN(d.getTime())?null:d;
  }

  function formatDeliveryDateTime12(orderOrValue){
    const raw=typeof orderOrValue==='object' && orderOrValue!==null ? combineDeliveryDate(orderOrValue) : String(orderOrValue||'');
    const d=parseLocalDateTime(raw);
    if(!d) return 'غير محدد';
    const y=d.getFullYear(), mo=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
    const weekday=d.toLocaleDateString('ar-SA-u-ca-gregory',{weekday:'long'});
    const h24=d.getHours(), h12=h24%12||12, mins=String(d.getMinutes()).padStart(2,'0'), period=h24>=12?'م':'ص';
    return `${y}-${mo}-${day} (${weekday}) · ${h12}:${mins} ${period}`;
  }

  function findClientByPhone(clients, phone){
    const n=normalizeSaudiPhone(phone);
    if(!n.valid) return null;
    return (Array.isArray(clients)?clients:[]).find(c=>normalizeSaudiPhone(c.phone).normalized===n.normalized) || null;
  }

  function makeClient(name, phone, date){
    const n=normalizeSaudiPhone(phone);
    if(!n.valid) throw new Error("رقم الجوال القادم غير صالح");
    const cleanName=String(name||"").trim();
    if(!cleanName) throw new Error("اكتب اسم العميلة");
    return {id:Date.now().toString(), name:cleanName, phone:n.formatted, date:date || new Date().toISOString().slice(0,10)};
  }

  function toInternalDraft(order, client){
    const fee=deliveryFee(order.deliveryArea);
    const items=(Array.isArray(order.items)?order.items:[]).map(i=>({
      productId:i.productId || i.id || null,
      name:String(i.name||i.productName||"منتج"),
      originalName:String(i.name||i.productName||"منتج"),
      price:Number(
        i.originalUnitPrice ?? i.originalPrice ?? i.original_unit_price ?? i.price ?? i.unitPrice ?? i.unit_price ?? 0
      ),
      originalPrice:Number(
        i.originalUnitPrice ?? i.originalPrice ?? i.original_unit_price ?? i.price ?? i.unitPrice ?? i.unit_price ?? 0
      ),
      qty:Math.max(1,Number(i.qty||i.quantity||1)),
      discount:Math.max(0,Math.min(100,Number(i.discountPercent ?? i.discount ?? i.discount_percent ?? 0))),
      notes:"", notesLocked:false, customName:""
    }));
    items.push({name:"مندوب",originalName:"مندوب",price:fee,originalPrice:fee,qty:1,discount:0,notes:"",notesLocked:false,customName:""});
    return {
      externalRequestId:String(order.id || order.orderNumber || ""),
      externalOrderNumber:String(order.orderNumber || order.id || ""),
      phone:normalizeSaudiPhone(order.phone).formatted,
      clientId:client.id,
      clientName:client.name,
      deliveryDate:combineDeliveryDate(order),
      deliveryArea:deliveryAreaLabel(order.deliveryArea),
      deliveryFee:fee,
      globalNote:"",
      items
    };
  }

  window.NoshiIncoming=Object.freeze({normalizeSaudiPhone,deliveryFee,deliveryAreaLabel,combineDeliveryDate,formatDeliveryDateTime12,findClientByPhone,makeClient,toInternalDraft});
})();
