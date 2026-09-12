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

  function combineDeliveryDate(order){
    if(order.deliveryDateTime) return String(order.deliveryDateTime).replace('T',' ').slice(0,16);
    if(order.deliveryDate && order.deliveryTime) return `${order.deliveryDate} ${order.deliveryTime}`;
    if(order.deliveryDate) return String(order.deliveryDate).replace('T',' ').slice(0,16);
    return "";
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
      price:Number(i.price||0), originalPrice:Number(i.price||0), qty:Math.max(1,Number(i.qty||i.quantity||1)),
      discount:0, notes:String(i.notes||""), notesLocked:false, customName:""
    }));
    items.push({name:"مندوب",originalName:"مندوب",price:fee,originalPrice:fee,qty:1,discount:0,notes:deliveryAreaLabel(order.deliveryArea),notesLocked:false,customName:""});
    return {
      externalRequestId:String(order.id || order.orderNumber || ""),
      externalOrderNumber:String(order.orderNumber || order.id || ""),
      phone:normalizeSaudiPhone(order.phone).formatted,
      clientId:client.id,
      clientName:client.name,
      deliveryDate:combineDeliveryDate(order),
      deliveryArea:deliveryAreaLabel(order.deliveryArea),
      deliveryFee:fee,
      globalNote:String(order.notes || order.note || ""),
      items
    };
  }

  window.NoshiIncoming=Object.freeze({normalizeSaudiPhone,deliveryFee,deliveryAreaLabel,combineDeliveryDate,findClientByPhone,makeClient,toInternalDraft});
})();
