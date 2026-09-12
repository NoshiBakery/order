/* =========================================================
   FILE: js/migration.js
   SOURCE: inline script #1 from migration.html
   REFACTOR RULE: extracted in the SAME parser position.
   No business logic, storage key, or execution order changed.
========================================================= */
(function(){
    "use strict";
    const fileInput=document.getElementById("fileInput");
    const importBtn=document.getElementById("importBtn");
    const cloudStatus=document.getElementById("cloudStatus");
    const optimizeBtn=document.getElementById("optimizeBtn");
    const summary=document.getElementById("summary");
    const progressWrap=document.getElementById("progressWrap");
    const bar=document.getElementById("bar");
    const progressText=document.getElementById("progressText");
    let parsed=null;
    let cloudEmpty=false;

    function setStatus(text,type){cloudStatus.className="status"+(type?" "+type:"");cloudStatus.textContent=text}
    function countOrders(salesData){return Object.values(salesData||{}).reduce((n,v)=>n+(Array.isArray(v)?v.length:0),0)}
    function countExpenses(expensesData){return Object.values(expensesData||{}).reduce((n,v)=>n+(Array.isArray(v)?v.length:0),0)}
    function updateButton(){importBtn.disabled=!(parsed&&cloudEmpty)}

    async function checkCloud(){
      try{
        const s=await NoshiDB.status();
        cloudEmpty=Number(s.count||0)===0;
        if(cloudEmpty) setStatus("✅ القاعدة السحابية فارغة وجاهزة للاستيراد الأول.","ok");
        else setStatus(`⚠️ يوجد ${s.count} مفاتيح بيانات في السحابة. الاستيراد الأول مقفول لحماية البيانات الموجودة.`,"warn");
      }catch(e){cloudEmpty=false;setStatus("تعذر فحص السحابة: "+(e.message||e),"err")}
      updateButton();
    }

    fileInput.addEventListener("change",async()=>{
      parsed=null;summary.classList.add("hidden");updateButton();
      const file=fileInput.files&&fileInput.files[0];if(!file)return;
      try{
        parsed=JSON.parse(await file.text());
        if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("ملف JSON غير صحيح");
        document.getElementById("clientsCount").textContent=Array.isArray(parsed.clients)?parsed.clients.length:0;
        document.getElementById("salesMonths").textContent=parsed.salesData&&typeof parsed.salesData==="object"?Object.keys(parsed.salesData).length:0;
        document.getElementById("salesOrders").textContent=countOrders(parsed.salesData);
        document.getElementById("expensesCount").textContent=countExpenses(parsed.expensesData);
        summary.classList.remove("hidden");
      }catch(e){parsed=null;setStatus("ملف النسخة غير صالح: "+(e.message||e),"err")}
      updateButton();
    });

    importBtn.addEventListener("click",async()=>{
      if(!parsed||!cloudEmpty)return;
      importBtn.disabled=true;fileInput.disabled=true;progressWrap.classList.remove("hidden");bar.style.width="8%";progressText.textContent="جاري رفع البيانات… لا تغلق الصفحة.";
      try{
        const result=await NoshiDB.importAll(parsed,{initialOnly:true});
        bar.style.width="90%";progressText.textContent="جاري التحقق من البيانات السحابية…";
        const s=await NoshiDB.status();
        if(result.cloudStoredCount!=null && Number(s.count||0)!==Number(result.cloudStoredCount||0))throw new Error("عدد المفاتيح بعد النقل لا يطابق نتيجة الاستيراد");
        bar.style.width="100%";
        progressText.textContent=`تم نقل ${result.importedCount} مفاتيح بيانات بنجاح.`;
        setStatus("✅ اكتمل النقل للسحابة. الآن جهازك وجهاز الوالدة سيقرآن نفس بيانات النظام.","ok");
        cloudEmpty=false;
      }catch(e){
        setStatus("فشل النقل: "+(e.message||e),"err");
        progressText.textContent="لم يكتمل النقل. لم يتم تشغيل استبدال تلقائي للبيانات.";
        fileInput.disabled=false;
        await checkCloud();
      }
    });

    optimizeBtn.addEventListener("click",async()=>{
      optimizeBtn.disabled=true;progressWrap.classList.remove("hidden");bar.style.width="12%";
      progressText.textContent="جاري إنشاء النسخ الشهرية بدون حذف salesData الأصلية…";
      try{
        if(!NoshiDB.migrateSalesDataToMonthly) throw new Error("حدّث db.js وWorker أولًا");
        const before=await NoshiDB.exportAll();
        const beforeSummary=NoshiDB.verifyBackup(before);
        const result=await NoshiDB.migrateSalesDataToMonthly();
        bar.style.width="82%";progressText.textContent="جاري التحقق من التطابق…";
        const after=await NoshiDB.exportAll();
        const afterSummary=NoshiDB.verifyBackup(after);
        if(beforeSummary.orders!==afterSummary.orders||beforeSummary.months!==afterSummary.months){
          throw new Error("فشل التحقق: عدد الطلبات أو الأشهر تغير");
        }
        bar.style.width="100%";
        progressText.textContent=`تم تقسيم ${result.months} شهر / ${result.orders} طلب والتحقق منها.`;
        setStatus("✅ تم إنشاء التقسيم الشهري بنجاح. لم يتم حذف salesData الأصلية.","ok");
      }catch(e){setStatus("فشل التقسيم: "+(e.message||e),"err");progressText.textContent="لم يتم حذف البيانات الأصلية."}
      finally{optimizeBtn.disabled=false}
    });

    document.getElementById("backBtn").addEventListener("click",()=>location.href="index.html");

    (async()=>{
      try{await NoshiAuth.guard();await checkCloud()}
      catch(e){if(e.status!==401)setStatus("تعذر التحقق من تسجيل الدخول.","err")}
    })();
  })();
