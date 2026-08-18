(() => {
  'use strict';
  const EPOCH='20260818-1680';
  const KEY=`303box-cache-reset-${EPOCH}`;
  if(sessionStorage.getItem(KEY))return;
  sessionStorage.setItem(KEY,'1');
  if('caches' in window)caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).catch(()=>{});
  if('serviceWorker' in navigator)navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister()))).catch(()=>{});
  window.__303boxCacheEpoch=EPOCH;
})();
