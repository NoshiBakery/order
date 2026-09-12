/* =========================================================
   FILE: js/login.js
   SOURCE PAGE: login.html
   PURPOSE: Page-specific JavaScript extracted from the HTML.
   DATA SAFETY: This is a structural refactor only; field names,
   storage keys, save ordering, and business rules must remain compatible.
   MAINTENANCE RULE: Shared services stay in their existing shared files.
========================================================= */


/* ---- Extracted inline script block 1 (original order preserved) ---- */
const f=document.getElementById('loginForm'),err=document.getElementById('error'),btn=document.getElementById('submitBtn');if(!NoshiAuth.enabled()){cloudNote.hidden=false}f.addEventListener('submit',async e=>{e.preventDefault();err.textContent='';if(!NoshiAuth.enabled()){err.textContent='لم يتم تفعيل الاتصال السحابي بعد.';return}btn.disabled=true;try{await NoshiAuth.api('/api/auth/login',{method:'POST',body:JSON.stringify({username:username.value.trim(),password:password.value})});location.replace('dashboard.html')}catch(x){err.textContent=x.message==='TOO_MANY_ATTEMPTS'?'محاولات كثيرة. حاول لاحقًا.':'اسم المستخدم أو كلمة المرور غير صحيحة'}finally{btn.disabled=false}});
