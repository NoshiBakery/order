(function(){
  "use strict";
  const cfg = () => window.NOSHI_CONFIG || {};
  const enabled = () => cfg().CLOUD_ENABLED === true;
  const base = () => String(cfg().INTERNAL_API_BASE || "").replace(/\/$/, "");
  const TOKEN_KEY = "noshi_session_token";
  let guardInFlight = null;

  function getToken(){
    try { return sessionStorage.getItem(TOKEN_KEY) || ""; } catch(_) { return ""; }
  }
  function setToken(token){
    try { if(token) sessionStorage.setItem(TOKEN_KEY, token); else sessionStorage.removeItem(TOKEN_KEY); } catch(_) {}
  }

  async function api(path, options={}){
    if(!enabled()) throw new Error("cloud_not_enabled");
    const headers = new Headers(options.headers || {});
    if(options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const token = getToken();
    if(token && !headers.has("Authorization")) headers.set("Authorization", "Bearer " + token);

    const r = await fetch(base()+path, Object.assign({}, options, {
      credentials:"include",
      headers,
      cache:"no-store"
    }));
    const data = await r.json().catch(()=>({}));
    if(r.ok && path === "/api/auth/login" && data && data.token) setToken(data.token);
    if(r.status === 401) {
      if(path !== "/api/auth/login") setToken("");
      const err = new Error("unauthorized"); err.status=401; err.data=data; throw err;
    }
    if(!r.ok){
      const err = new Error(data.error || "request_failed"); err.status=r.status; err.data=data; throw err;
    }
    return data;
  }

  async function me(){
    if(!enabled()) return {localMode:true, displayName:"الوضع المحلي"};
    return api('/api/auth/me');
  }

  function revealProtectedPage(){
    const cloak = document.getElementById("noshi-auth-cloak");
    if(cloak) cloak.remove();
  }

  async function guard(){
    if(!enabled()) { revealProtectedPage(); return {localMode:true}; }
    if(guardInFlight) return guardInFlight;
    guardInFlight = (async()=>{
      try {
        const user = await me();
        revealProtectedPage();
        return user;
      } catch(e){
        if(e.status===401 || e.message==='unauthorized') { location.replace('login.html'); throw e; }
        revealProtectedPage();
        throw e;
      } finally {
        guardInFlight = null;
      }
    })();
    return guardInFlight;
  }

  async function logout(){
    if(!enabled()){ location.replace('login.html'); return; }
    try { await api('/api/auth/logout',{method:'POST'}); } catch(_) {}
    setToken("");
    location.replace('login.html');
  }

  window.NoshiAuth = Object.freeze({enabled, api, me, guard, logout});
})();
