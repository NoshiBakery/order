(function(){
  "use strict";
  const LAST_USER_KEY="noshi_theme_last_user";
  const keyFor=u=>`noshi_theme_${String(u||"guest").trim().toLowerCase()}`;
  let currentUser="";
  function readUser(){try{return currentUser||localStorage.getItem(LAST_USER_KEY)||"guest";}catch(_){return currentUser||"guest";}}
  function readTheme(user){try{return localStorage.getItem(keyFor(user))==="dark"?"dark":"light";}catch(_){return "light";}}
  function apply(theme){
    const value=theme==="dark"?"dark":"light";
    document.documentElement.dataset.theme=value;
    document.documentElement.style.colorScheme=value;
    window.dispatchEvent(new CustomEvent("noshi:themechange",{detail:{theme:value}}));
    return value;
  }
  function applyForUser(user){
    const username=String(user?.username||user?.user||user||"").trim().toLowerCase();
    if(username){currentUser=username;try{localStorage.setItem(LAST_USER_KEY,username);}catch(_){}}
    return apply(readTheme(readUser()));
  }
  function set(theme){const user=readUser();const value=theme==="dark"?"dark":"light";try{localStorage.setItem(keyFor(user),value);}catch(_){}return apply(value);}
  function toggle(){return set((document.documentElement.dataset.theme||readTheme(readUser()))==="dark"?"light":"dark");}
  apply(readTheme(readUser()));
  window.NoshiTheme=Object.freeze({applyForUser,toggle,set,current:()=>document.documentElement.dataset.theme||"light"});
})();
