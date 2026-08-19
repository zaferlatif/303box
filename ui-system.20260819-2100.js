(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const isTR=()=>document.documentElement.lang==='tr';
  let panicBound=false,scopeBound=false,suiteObserver=null,repairing=false;

  function installMidiGridAuthority(){
    let style=$('#midiGridAuthority2110');
    if(style)return;
    style=document.createElement('style');
    style.id='midiGridAuthority2110';
    style.textContent=`
      /* MIDI layout authority 2110: primary + secondary share the same 8-column grid. */
      .machine-suite #midiRouter{
        min-width:0!important;width:100%!important;max-width:100%!important;
        overflow:hidden!important;box-sizing:border-box!important;
      }
      .machine-suite #midiRouter,.machine-suite #midiRouter *{box-sizing:border-box!important}
      .machine-suite #midiRouter .midi-compact-head,
      .machine-suite #midiRouter .midi-router-primary,
      .machine-suite #midiRouter .midi-router-secondary{
        display:grid!important;
        grid-template-columns:repeat(8,minmax(0,1fr))!important;
        width:100%!important;max-width:100%!important;min-width:0!important;
        column-gap:8px!important;
      }
      .machine-suite #midiRouter .midi-compact-head{
        align-items:center!important;row-gap:0!important;margin:0 0 11px!important;
      }
      .machine-suite #midiRouter .midi-compact-head>strong{grid-column:1/5!important;min-width:0!important;margin:0!important}
      .machine-suite #midiHardwareGuide{grid-column:5/8!important;width:100%!important;min-width:0!important;max-width:100%!important}
      .machine-suite #midiRouter .midi-badge{grid-column:8/9!important;width:100%!important;min-width:0!important;max-width:100%!important}

      .machine-suite #midiRouter .midi-router-primary{
        align-items:end!important;row-gap:0!important;margin:0!important;
      }
      .machine-suite #midiRouter .midi-connect{grid-column:1/3!important;grid-row:1!important}
      .machine-suite #midiRouter .midi-output{grid-column:3/5!important;grid-row:1!important}
      .machine-suite #midiRouter .midi-profile{grid-column:5/7!important;grid-row:1!important}
      .machine-suite #midiRouter .midi-playback{grid-column:7/9!important;grid-row:1!important}

      .machine-suite #midiRouter .midi-router-secondary{
        align-items:end!important;row-gap:0!important;margin:8px 0 0!important;
      }
      .machine-suite #midiRouter .midi-router-secondary>:nth-child(1){grid-column:1/2!important;grid-row:1!important}
      .machine-suite #midiRouter .midi-router-secondary>:nth-child(2){grid-column:2/3!important;grid-row:1!important}
      .machine-suite #midiRouter .midi-router-secondary>:nth-child(3){grid-column:3/5!important;grid-row:1!important}
      .machine-suite #midiRouter .midi-router-secondary>:nth-child(4){grid-column:5/7!important;grid-row:1!important}
      .machine-suite #midiRouter .midi-router-secondary>:nth-child(5){grid-column:7/9!important;grid-row:1!important}

      .machine-suite #midiRouter .midi-router-primary>*,
      .machine-suite #midiRouter .midi-router-secondary>*{
        min-width:0!important;max-width:100%!important;width:100%!important;margin:0!important;
      }
      .machine-suite #midiRouter .midi-field{min-width:0!important;max-width:100%!important;width:100%!important}
      .machine-suite #midiRouter select,
      .machine-suite #midiRouter .midi-connect,
      .machine-suite #midiRouter .midi-toggle,
      .machine-suite #midiRouter .midi-panic{
        min-width:0!important;max-width:100%!important;width:100%!important;
        overflow:hidden!important;
      }
      .machine-suite #midiRouter select{
        text-overflow:ellipsis!important;white-space:nowrap!important;
      }
      .machine-suite #midiRouter .midi-playback select{
        font-size:.52rem!important;padding-left:10px!important;padding-right:28px!important;
      }
      .machine-suite #midiRouter .midi-panic{
        justify-self:stretch!important;align-self:end!important;
      }

      @media(max-width:820px){
        .machine-suite #midiRouter .midi-compact-head{
          grid-template-columns:repeat(4,minmax(0,1fr))!important;
        }
        .machine-suite #midiRouter .midi-compact-head>strong{grid-column:1/3!important}
        .machine-suite #midiHardwareGuide{grid-column:3/4!important}
        .machine-suite #midiRouter .midi-badge{grid-column:4/5!important}

        .machine-suite #midiRouter .midi-router-primary,
        .machine-suite #midiRouter .midi-router-secondary{
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
          column-gap:7px!important;row-gap:7px!important;
        }
        .machine-suite #midiRouter .midi-connect{grid-column:1!important;grid-row:1!important}
        .machine-suite #midiRouter .midi-playback{grid-column:2!important;grid-row:1!important}
        .machine-suite #midiRouter .midi-output{grid-column:1/-1!important;grid-row:2!important}
        .machine-suite #midiRouter .midi-profile{grid-column:1/-1!important;grid-row:3!important}

        .machine-suite #midiRouter .midi-router-secondary>:nth-child(1){grid-column:1!important;grid-row:1!important}
        .machine-suite #midiRouter .midi-router-secondary>:nth-child(2){grid-column:2!important;grid-row:1!important}
        .machine-suite #midiRouter .midi-router-secondary>:nth-child(3){grid-column:1!important;grid-row:2!important}
        .machine-suite #midiRouter .midi-router-secondary>:nth-child(4){grid-column:2!important;grid-row:2!important}
        .machine-suite #midiRouter .midi-router-secondary>:nth-child(5){grid-column:1/-1!important;grid-row:3!important}
      }

      @media(max-width:430px){
        .machine-suite #midiRouter .midi-compact-head{
          grid-template-columns:minmax(0,1fr) auto!important;
          row-gap:7px!important;
        }
        .machine-suite #midiRouter .midi-compact-head>strong{grid-column:1!important;grid-row:1!important}
        .machine-suite #midiRouter .midi-badge{grid-column:2!important;grid-row:1!important;width:auto!important;min-width:46px!important}
        .machine-suite #midiHardwareGuide{grid-column:1/-1!important;grid-row:2!important;width:100%!important}
      }
    `;
    document.head.appendChild(style);
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

  new MutationObserver(syncLanguage).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.addEventListener('303box:ready',apply);
  window.__303boxUiSystem={version:'2110',apply,syncScope};
})();
