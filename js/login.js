/* =========================================================
   FILE: js/login.js
   SOURCE: inline script #1 from login.html
   REFACTOR RULE: extracted in the SAME parser position.
   No business logic, storage key, or execution order changed.
========================================================= */
const f=document.getElementById('loginForm'),err=document.getElementById('error'),btn=document.getElementById('submitBtn');if(!NoshiAuth.enabled()){cloudNote.hidden=false}f.addEventListener('submit',async e=>{e.preventDefault();err.textContent='';if(!NoshiAuth.enabled()){err.textContent='لم يتم تفعيل الاتصال السحابي بعد.';return}btn.disabled=true;try{await NoshiAuth.api('/api/auth/login',{method:'POST',body:JSON.stringify({username:username.value.trim(),password:password.value})});location.replace('dashboard.html')}catch(x){err.textContent=x.message==='TOO_MANY_ATTEMPTS'?'محاولات كثيرة. حاول لاحقًا.':'اسم المستخدم أو كلمة المرور غير صحيحة'}finally{btn.disabled=false}});
