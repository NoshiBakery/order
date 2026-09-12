(function(){
  "use strict";
  const LAST_USER_KEY="noshi_theme_last_user";
  const keyFor=u=>`noshi_theme_${String(u||"guest").toLowerCase()}`;
  let currentUser="";
  function readUser(){
    try{return currentUser||localStorage.getItem(LAST_USER_KEY)||"guest";}catch(_){return currentUser||"guest";}
  }
  function readTheme(user){
    try{return localStorage.getItem(keyFor(user))==="dark"?"dark":"light";}catch(_){return "light";}
  }
  function apply(theme){
    const value=theme==="dark"?"dark":"light";
    document.documentElement.dataset.theme=value;
    document.documentElement.style.colorScheme=value;
    const b=document.getElementById("noshiThemeToggle");
    if(b){b.textContent=value==="dark"?"☀️":"🌙";b.title=value==="dark"?"تفعيل النمط النهاري":"تفعيل النمط الليلي";b.setAttribute("aria-label",b.title);}
    return value;
  }
  function applyForUser(user){
    const username=String(user?.username||user||"").trim().toLowerCase();
    if(username){currentUser=username;try{localStorage.setItem(LAST_USER_KEY,username);}catch(_){}}
    return apply(readTheme(readUser()));
  }
  function toggle(){
    const user=readUser();
    const next=document.documentElement.dataset.theme==="dark"?"light":"dark";
    try{localStorage.setItem(keyFor(user),next);}catch(_){}
    apply(next);
  }
  function mount(){
    if(document.getElementById("noshiThemeToggle"))return;
    const b=document.createElement("button");
    b.type="button";b.id="noshiThemeToggle";b.className="noshi-theme-toggle";
    b.addEventListener("click",toggle);
    document.body.appendChild(b);apply(document.documentElement.dataset.theme||readTheme(readUser()));
  }
  apply(readTheme(readUser()));
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
  window.NoshiTheme=Object.freeze({applyForUser,toggle,current:()=>document.documentElement.dataset.theme||"light"});
})();
