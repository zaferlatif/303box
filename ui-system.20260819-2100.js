(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const isTR=()=>document.documentElement.lang==='tr';
  let panicBound=false,scopeBound=false,suiteObserver=null,repairing=false;

  /*
   * Runtime 2201: MIDI geometry is CSS-owned.
   * Older builds injected an 8-column !important grid here after all stylesheets
   * had loaded. That late style tag overrode the responsive 2200 layout on phones.
   * Never inject MIDI geometry from JavaScript again.
   */
  function installMidiGridAuthority(){
    $('#midiGridAuthority2110')?.remove();
  }

  function mountMachineSuite(){
    const workspace=$('.workspace.shell'),acid=$('#acidConsole'),card=$('.pattern-card-wrap'),controls=$('.pattern-control-panel'),drums=$('#drums');
    if(!workspace||!acid||!card||!controls||!drums)return false;

    let suite=$('#machineSuite');
    if(!suite){
      suite=document.createElement('section');
      suite.id='machineSuite';
      suite.className='machine-suite';
      suite.setAttribute('aria-label','303box workstation');
      acid.insertAdjacentElement('beforebegin',suite);
    }

    acid.classList.add('machine-module','module-console');
    let pattern=$('#patternModule');
    if(!pattern){
      pattern=document.createElement('section');
      pattern.id='patternModule';
      pattern.className='module-pattern';
    }
    drums.classList.add('machine-module','module-rhythm');

    if(card.parentElement!==pattern)pattern.appendChild(card);
    if(controls.parentElement!==pattern)pattern.appendChild(controls);
    if(acid.parentElement!==suite)suite.appendChild(acid);
    if(pattern.parentElement!==suite)suite.appendChild(pattern);
    if(drums.parentElement!==suite)suite.appendChild(drums);

    workspace.classList.add('machine-suite-ready');
    return true;
  }

  function installSuiteGuard(){
    if(suiteObserver)return;
    const workspace=$('.workspace.shell');if(!workspace)return;
    suiteObserver=new MutationObserver(()=>{
      if(repairing)return;
      const suite=$('#machineSuite'),acid=$('#acidConsole'),pattern=$('#patternModule'),drums=$('#drums');
      if(!suite||!acid||!pattern||!drums)return;
      if(acid.parentElement===suite&&pattern.parentElement===suite&&drums.parentElement===suite)return;
      repairing=true;
      queueMicrotask(()=>{try{mountMachineSuite()}finally{repairing=false}});
    });
    suiteObserver.observe(workspace,{childList:true});
  }

  function normalizeHeads(){
    const acidHead=$('#acidConsole .acid-console-head');
    const sheetHead=$('#patternSheet .sheet-header');
    const rhythmHead=$('#drums .integrated-rhythm-label');
    acidHead?.classList.add('machine-module-head');
    sheetHead?.classList.add('machine-module-head');
    rhythmHead?.classList.add('machine-module-head');

    const acidTitle=acidHead?.querySelector(':scope>span');
    if(acidTitle)acidTitle.textContent='ACID CONSOLE';
    const patternTitle=sheetHead?.querySelector('h2');
    if(patternTitle)patternTitle.textContent='303 PATTERN';
    const rhythmTitle=rhythmHead?.querySelector('strong');
    if(rhythmTitle)rhythmTitle.textContent=isTR()?'RİTİM':'RHYTHM';
  }

  function normalizeActions(){
    const pattern=$('.pattern-action-grid');
    const rhythm=$('#drums .drum-actions');
    pattern?.classList.add('unified-action-row');
    rhythm?.classList.add('unified-action-row');
    ['generateButton','playButton','downloadButton','clearButton','drumRandom','drumPlay','drumDownload','drumClear'].forEach(id=>{
      const el=$(`#${id}`);if(el)el.classList.add('unified-action-button');
    });
  }

  function syncScope(){
    const panel=$('.scope-panel');if(!panel)return;
    panel.classList.add('scope-panel-unified');
    const source=$('#scopeSourceState');if(source){source.hidden=true;source.setAttribute('aria-hidden','true')}
    const usb=window.__303boxLiveScope?.source==='usb'||$('.scope-source-button[data-source="usb"]')?.classList.contains('active');
    panel.classList.toggle('usb-source-active',!!usb);
  }

  function bindScope(){
    if(scopeBound)return;scopeBound=true;
    document.addEventListener('click',e=>{
      if(!e.target.closest?.('.scope-panel .analyzer-tab,.scope-panel .scope-source-button'))return;
      queueMicrotask(syncScope);
    },true);
    document.addEventListener('change',e=>{if(e.target?.id==='scopeAudioInput')queueMicrotask(syncScope)},true);
  }

  function panicFeedback(button){
    const router=window.__303boxMidiRouter;
    const connected=!!router?.state?.enabled;
    const status=$('#midiRouterStatus');
    const normal=button.dataset.normalText||button.textContent||'PANIC';
    button.dataset.normalText=normal;
    button.classList.add('panic-fired');
    button.textContent=isTR()?'TÜM NOTALAR KAPATILDI':'ALL NOTES OFF';
    if(status)status.textContent=connected
      ? (isTR()?'PANIC gönderildi; MIDI kuyruğu ve 303box transport durduruldu.':'PANIC sent; MIDI queue and 303box transport stopped.')
      : (isTR()?'303box transport durduruldu. Bağlı MIDI çıkışı yok.':'303box transport stopped. No MIDI output is connected.');
    setTimeout(()=>{button.classList.remove('panic-fired');button.textContent=normal},1150);
  }

  function bindPanic(){
    if(panicBound)return;panicBound=true;
    document.addEventListener('click',e=>{
      const button=e.target.closest?.('#midiPanic');if(!button)return;
      e.preventDefault();e.stopImmediatePropagation();
      try{window.__303boxMidiRouter?.panic?.()}catch(_){}
      try{window.__303boxUnifiedEngine?.stopAll?.()}catch(_){}
      panicFeedback(button);
    },true);
  }

  function normalizeMidi(){
    const router=$('#midiRouter');if(!router)return;
    installMidiGridAuthority();
    router.classList.add('midi-router-unified');
    const status=$('#midiRouterStatus');if(status){status.setAttribute('aria-live','polite');status.setAttribute('role','status')}
  }

  function installFooterDisclaimerLink(){
    const links=$('.footer-links');if(!links)return;
    let a=links.querySelector('[data-disclaimer-link]');
    if(!a){a=document.createElement('a');a.href='#disclaimer';a.dataset.disclaimerLink='true';links.prepend(a)}
    a.textContent=isTR()?'Sorumluluk':'Disclaimer';
  }

  function syncLanguage(){normalizeHeads();installFooterDisclaimerLink()}

  function apply(){
    installMidiGridAuthority();
    const ready=mountMachineSuite();
    installSuiteGuard();normalizeHeads();normalizeActions();normalizeMidi();syncScope();bindScope();bindPanic();installFooterDisclaimerLink();
    return ready;
  }

  document.addEventListener('303box:languagechange',syncLanguage);
  document.addEventListener('303box:ready',apply);
  window.__303boxUiSystem={version:'2201',apply,syncScope};
})();
