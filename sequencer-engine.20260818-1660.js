(() => {
  'use strict';
  const version='20260818-1660';
  const addCss=(key,href)=>{if(document.querySelector(`link[data-303box-${key}]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=`${href}?v=${version}`;link.dataset[`303box${key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())}`]='true';document.head.appendChild(link)};
  addCss('audio-ui','./ui-audio.20260818-1240.css');
  addCss('final-polish','./ui-polish.20260818-1255.css');
  addCss('acid-console','./acid-console.20260818-1340.css');
  addCss('seo-content','./seo.20260818-1315.css');
  addCss('compact-workstation','./compact-workstation.20260818-1430.css');
  addCss('console-io','./console-io.20260818-1440.css');
  addCss('unified-actions','./unified-actions.20260818-1450.css');
  addCss('midi-router','./midi-router.20260818-1660.css');
  addCss('workstation-layout','./workstation-layout.20260818-1520.css');
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=`${src}?v=${version}`;s.async=false;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  load('./cache-reset.20260818-1660.js')
    .then(()=>load('./transport-fuse.20260818-1530.js'))
    .then(()=>load('./audio-mode-gate.20260818-1530.js'))
    .then(()=>load('./stable-audio-timer.20260818-1600.js'))
    .then(()=>load('./master-reverb.20260818-1510.js'))
    .then(()=>load('./drum-level-fix.20260818-1420.js'))
    .then(()=>load('./acid-console.20260818-1340.js'))
    .then(()=>load('./acid-console-guard.20260818-1343.js'))
    .then(()=>load('./ui-audio.20260818-1240.js'))
    .then(()=>load('./ui-polish.20260818-1255.js'))
    .then(()=>load('./compact-workstation.20260818-1430.js'))
    .then(()=>load('./drum-hat-grid.20260818-1530.js'))
    .then(()=>load('./midi-router.20260818-1660.js'))
    .then(()=>load('./bass-scope.20260818-1600.js'))
    .then(()=>load('./hero-stability.20260818-1500.js'))
    .then(()=>load('./seo.20260818-1315.js'))
    .then(()=>load('./workstation-layout.20260818-1520.js'))
    .then(()=>load('./generator-router.20260818-1650.js'))
    .catch(error=>console.error('303box production loader',error));
})();