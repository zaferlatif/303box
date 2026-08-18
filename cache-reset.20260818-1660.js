(() => {
  'use strict';
  const EPOCH='20260818-1660';
  const KEY=`303box-cache-reset-${EPOCH}`;
  if(sessionStorage.getItem(KEY))return;
  sessionStorage.setItem(KEY,'1');
  if('caches' in window){caches.keys().then(keys=>Promise.all(keys.map(key=>caches.delete(key)))).catch(()=>{});}
  if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(regs=>Promise.all(regs.map(reg=>reg.unregister()))).catch(()=>{});}
  window.__303boxCacheEpoch=EPOCH;
})();