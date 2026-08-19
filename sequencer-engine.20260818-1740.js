(() => {
  'use strict';

  const VERSION='20260819-2000';
  let revealed=false;
  const root=document.documentElement;
  root.classList.add('app-booting');
  root.classList.remove('app-ready');

  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const raf=()=>new Promise(resolve=>requestAnimationFrame(resolve));

  function withVersion(path){
    const sep=path.includes('?')?'&':'?';
    return `${path}${sep}v=${VERSION}`;
  }

  function loadStyle(path){
    return new Promise(resolve=>{
      const clean=path.split('?')[0];
      const existing=[...document.querySelectorAll('link[rel="stylesheet"]')].find(x=>(x.getAttribute('href')||'').split('?')[0]===clean && x.dataset.runtimeFinal==='2000');
      if(existing){resolve();return}
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.href=withVersion(path);
      link.dataset.runtimeFinal='2000';
      link.addEventListener('load',()=>resolve(),{once:true});
      link.addEventListener('error',()=>{console.warn('[303box] stylesheet failed',path);resolve()},{once:true});
      document.head.appendChild(link);
    });
  }

  function loadScript(path){
    return new Promise(resolve=>{
      const clean=path.split('?')[0];
      const found=[...document.scripts].find(x=>(x.getAttribute('src')||'').split('?')[0]===clean && x.dataset.runtimeFinal==='2000');
      if(found){resolve();return}
      const s=document.createElement('script');
      s.src=withVersion(path);
      s.async=false;
      s.dataset.runtimeFinal='2000';
      s.addEventListener('load',()=>resolve(),{once:true});
      s.addEventListener('error',()=>{console.warn('[303box] module failed',path);resolve()},{once:true});
      document.head.appendChild(s);
    });
  }

  async function domReady(){
    if(document.readyState!=='loading')return;
    await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
  }

  async function waitForFinalControls(timeout=1800){
    const start=performance.now();
    while(performance.now()-start<timeout){
      const knobs=document.querySelectorAll('#knobGrid .knob').length;
      const scope=document.querySelector('#bassLiveScope,#bassOnlyScope');
      const drumSteps=document.querySelectorAll('#drums .drum-step').length;
      if(knobs>=9 && scope && drumSteps>=16)return true;
      await wait(40);
    }
    return false;
  }

  async function waitFonts(){
    if(!document.fonts?.ready)return;
    await Promise.race([document.fonts.ready,wait(1200)]).catch(()=>{});
  }

  function applyFinalState(){
    try{window.__303boxBehaviorFixes?.apply?.()}catch(_){}
    try{window.__303boxContentStable?.apply?.()}catch(_){}
    try{window.__303boxMidiConnectionState?.apply?.()}catch(_){}
  }

  async function reveal(reason='complete'){
    if(revealed)return;
    revealed=true;
    applyFinalState();
    await raf();
    applyFinalState();
    await raf();
    root.classList.remove('app-booting');
    root.classList.add('app-ready');
    document.dispatchEvent(new CustomEvent('303box:ready',{detail:{version:VERSION,reason}}));
    window.dispatchEvent(new Event('resize'));
  }

  // Safety valve: an optional integration must never leave the site hidden.
  const watchdog=setTimeout(()=>reveal('watchdog'),6500);

  const CSS=[
    './ui-audio.20260818-1240.css',
    './ui-polish.20260818-1255.css',
    './seo.20260818-1315.css',
    './unified-actions.20260818-1450.css',
    './workstation-ui.20260818-1680.css',
    './playhead-unified.20260818-1720.css',
    './positioning.20260818-1740.css',
    './ui-refresh.20260819-1750.css',
    './compact-controls.20260819-1910.css',
    './layout-compact.20260819-1940.css',
    // Final authority is intentionally last in the cascade.
    './ui-fixes.20260819-1920.css'
  ];

  const JS=[
    './cache-reset.20260818-1740.js',
    './seo.20260818-1740.js',
    './transport-fuse.20260819-1750.js',
    './audio-mode-gate.20260818-1530.js',
    './stable-audio-timer.20260818-1600.js',
    './master-reverb.20260818-1510.js',
    './drum-level-fix.20260818-1420.js',
    './acid-console.20260818-1340.js',
    './acid-console-guard.20260818-1343.js',
    './ui-audio.20260818-1240.js',
    './ui-polish.20260818-1255.js',
    './drum-hat-grid.20260818-1530.js',
    './generator-router.20260818-1650.js',
    './scope-live.20260819-1830.js',
    './t8-rhythm-rec-status.20260819-1830.js',
    './midi-connection-state.20260819-1910.js',
    './behavior-fixes.20260819-1920.js',
    './ui-refresh.20260819-1750.js',
    './social-tracking.20260819-1940.js',
    './content-stable.20260819-2000.js'
  ];

  (async()=>{
    try{
      // Insert all CSS in final cascade order, then wait for every sheet.
      await Promise.all(CSS.map(loadStyle));
      // Modules remain sequential because several intentionally extend globals
      // created by the module immediately before them.
      for(const src of JS)await loadScript(src);
      await domReady();

      // generator-router creates the fresh startup pattern 70 ms after it sees
      // the finished grid. Keep that mutation inside the hidden boot phase.
      await wait(180);
      await waitForFinalControls();
      applyFinalState();
      await waitFonts();
      clearTimeout(watchdog);
      await reveal('complete');
    }catch(err){
      console.error('[303box] boot error',err);
      clearTimeout(watchdog);
      await reveal('error');
    }
  })();

  window.__303boxRuntime={version:VERSION,reveal};
})();
