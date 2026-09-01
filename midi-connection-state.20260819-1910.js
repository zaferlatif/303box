(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  let headObserver=null;

  function removeLegacyGrid(){
    document.getElementById('midiGridAuthority2110')?.remove();
  }

  function ensureLayoutRepair(){
    removeLegacyGrid();
    const href='./midi-layout-fix.20260819-2150.css?v=20260820-2202';
    const existing=[...document.querySelectorAll('link[rel="stylesheet"]')].find(x=>(x.getAttribute('href')||'').includes('midi-layout-fix.20260819-2150.css'));
    if(existing){
      if(!(existing.getAttribute('href')||'').includes('20260820-2202'))existing.href=href;
      existing.dataset.midiLayoutAuthority='2202';
      return;
    }
    const link=document.createElement('link');
    link.rel='stylesheet';link.href=href;link.dataset.midiLayoutAuthority='2202';
    document.head.appendChild(link);
  }

  function watchLegacyGrid(){
    if(headObserver||!document.head)return;
    headObserver=new MutationObserver(()=>{
      if(document.getElementById('midiGridAuthority2110')){
        removeLegacyGrid();
        ensureLayoutRepair();
      }
    });
    headObserver.observe(document.head,{childList:true});
  }

  function routerState(){
    try{return window.__303boxMidiRouter?.state||null}catch(_){return null}
  }
  function isReady(){return !!$('#midiRouterBadge')?.classList.contains('ready')}

  function updateRecVisibility(){
    const row=$('#midiRecAssist');if(!row)return;
    const st=routerState();
    const realT8=!!(isReady()&&st?.effective==='t8');
    row.hidden=!realT8;
    row.setAttribute('aria-hidden',String(!realT8));
  }

  // Connection state may hide actions that require a live T-8, but it must
  // never rewrite the user's OUTPUT or DEVICE selection. Readiness depends on
  // those selections, so clearing them while disconnected creates a circular
  // state where a user cannot complete the connection.
  function syncConnectionUi(){updateRecVisibility()}

  function init(){
    ensureLayoutRepair();
    watchLegacyGrid();
    const root=$('#midiRouter');if(!root)return;
    syncConnectionUi();
    const badge=$('#midiRouterBadge');
    if(badge){const observer=new MutationObserver(syncConnectionUi);observer.observe(badge,{attributes:true,attributeFilter:['class']})}
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){ensureLayoutRepair();syncConnectionUi()}});
    window.__303boxMidiConnectionState={version:'3200',refresh(){ensureLayoutRepair();syncConnectionUi()}};
  }

  ensureLayoutRepair();
  watchLegacyGrid();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
