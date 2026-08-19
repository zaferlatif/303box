(() => {
  'use strict';
  const version='20260819-1950';

  const HERO={
    en:{
      kicker:'PATTERN SKETCHPAD / HARDWARE WORKFLOW',
      title:'Sketch the pattern here. Perform it on your hardware.',
      lead:'303box is a faster way to write down, edit and audition 16-step ideas before taking them to real hardware. It does not make music for you: you choose the notes, keep or reject the random starting points, move the controls and perform the final result.',
      primary:'Build a pattern',secondary:'What this tool is'
    },
    tr:{
      kicker:'PATTERN DEFTERİ / DONANIM AKIŞI',
      title:'Pattern’i burada tasarla. Donanımında performe et.',
      lead:'303box, 16 adımlı fikirleri gerçek donanıma taşımadan önce daha hızlı yazmak, düzenlemek ve dinlemek için bir çalışma alanıdır. Müziği senin yerine yapmaz: notaları sen seçersin, rastgele başlangıçları tutar veya reddedersin, kontrolleri sen hareket ettirir ve son performansı sen yaparsın.',
      primary:'Pattern oluştur',secondary:'Bu araç nedir?'
    }
  };

  function lockHero(){
    const hero=document.querySelector('.hero');if(!hero)return;
    const lang=document.documentElement.lang==='tr'?'tr':'en',c=HERO[lang];
    const kicker=hero.querySelector('.hero-kicker b'),title=hero.querySelector('#heroTitle'),lead=hero.querySelector('.hero-lead'),primary=hero.querySelector('.primary-cta'),secondary=hero.querySelector('.secondary-cta');
    [kicker,title,primary].forEach(el=>el?.removeAttribute('data-i18n'));
    if(kicker)kicker.textContent=c.kicker;if(title)title.textContent=c.title;if(lead)lead.textContent=c.lead;if(primary)primary.textContent=c.primary;if(secondary)secondary.textContent=c.secondary;
  }
  lockHero();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',lockHero,{once:true});
  new MutationObserver(lockHero).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

  const addCss=(key,href)=>{if(document.querySelector(`link[data-303box-${key}]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=`${href}?v=${version}`;link.dataset[`303box${key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())}`]='true';document.head.appendChild(link)};
  addCss('audio-ui','./ui-audio.20260818-1240.css');
  addCss('final-polish','./ui-polish.20260818-1255.css');
  addCss('seo-content','./seo.20260818-1315.css');
  addCss('unified-actions','./unified-actions.20260818-1450.css');
  addCss('workstation-ui','./workstation-ui.20260818-1680.css');
  addCss('unified-playhead','./playhead-unified.20260818-1720.css');
  addCss('positioning','./positioning.20260818-1740.css');
  addCss('ui-refresh','./ui-refresh.20260819-1750.css');
  addCss('compact-controls','./compact-controls.20260819-1910.css');
  addCss('ui-fixes','./ui-fixes.20260819-1920.css');
  addCss('compact-sequencer','./layout-compact.20260819-1940.css');

  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=`${src}?v=${version}`;s.async=false;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  load('./cache-reset.20260818-1740.js')
    .then(()=>load('./seo.20260818-1740.js'))
    .then(()=>load('./transport-fuse.20260819-1750.js'))
    .then(()=>load('./audio-mode-gate.20260818-1530.js'))
    .then(()=>load('./stable-audio-timer.20260818-1600.js'))
    .then(()=>load('./master-reverb.20260818-1510.js'))
    .then(()=>load('./drum-level-fix.20260818-1420.js'))
    .then(()=>load('./acid-console.20260818-1340.js'))
    .then(()=>load('./acid-console-guard.20260818-1343.js'))
    .then(()=>load('./ui-audio.20260818-1240.js'))
    .then(()=>load('./ui-polish.20260818-1255.js'))
    .then(()=>load('./drum-hat-grid.20260818-1530.js'))
    .then(()=>load('./generator-router.20260818-1650.js'))
    .then(()=>load('./ui-refresh.20260819-1750.js'))
    .then(()=>load('./social-tracking.20260819-1940.js'))
    .then(()=>load('./scope-live.20260819-1830.js'))
    .then(()=>load('./t8-rhythm-rec-status.20260819-1830.js'))
    .then(()=>load('./midi-connection-state.20260819-1910.js'))
    .then(()=>load('./behavior-fixes.20260819-1920.js'))
    .catch(error=>console.error('303box production loader',error));
})();