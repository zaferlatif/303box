(() => {
  'use strict';

  const SITE_VERSION='2026.08.27.3';
  const RELEASE_EPOCH='20260827-3150';
  const MIDI_LAYOUT_HREF=`./midi-layout.20260824-2800.css?v=${RELEASE_EPOCH}`;
  const CONSOLE_POLISH_HREF=`./console-polish.20260824-2840.css?v=${RELEASE_EPOCH}`;
  const PITCH_MODEL_SRC=`./pitch-octave.20260826-2940.js?v=${RELEASE_EPOCH}`;
  const HARDWARE_FIDELITY_SRC=`./hardware-fidelity.20260826-2930.js?v=${RELEASE_EPOCH}`;
  const COPY={
    en:{brandTag:'Acid pattern laboratory',primaryNavigation:'Primary navigation',rhythm:'Rhythm',guide:'Guide',history:'History',faq:'FAQ',openSequencer:'Open sequencer',changeLanguage:'Change language',footerCredit:'303box is an independent music tool built by Z3Z.',footerDisclaimer:'Disclaimer',footerShortcuts:'Shortcuts',footerPrivacy:'Privacy',versionLabel:'Site version'},
    tr:{brandTag:'Acid pattern laboratuvarı',primaryNavigation:'Ana navigasyon',rhythm:'Ritim',guide:'Rehber',history:'Tarihçe',faq:'SSS',openSequencer:'Sequencer’ı aç',changeLanguage:'Dili değiştir',footerCredit:'303box, Z3Z tarafından geliştirilen bağımsız bir müzik aracıdır.',footerDisclaimer:'Sorumluluk',footerShortcuts:'Kısayollar',footerPrivacy:'Gizlilik',versionLabel:'Site sürümü'}
  };
  const language=()=>document.documentElement.lang==='tr'?'tr':'en';
  const text=(key,lang=language())=>COPY[lang][key]??COPY.en[key]??key;
  let scopePolishObserver=null,midiTransferObserver=null,rhythmTransferBusy=false;

  function installBackgroundPlaybackPolicy(){
    if(window.__303boxBackgroundPlaybackPolicyInstalled)return;
    window.__303boxBackgroundPlaybackPolicyInstalled=true;
    document.addEventListener('visibilitychange',event=>{if(document.hidden)event.stopImmediatePropagation()},true);
  }
  function installPitchModel(){
    if(window.__303boxPitchModel?.version==='20260826-2940'||document.querySelector('script[data-pitch-model-release="20260826-2940"]'))return;
    const script=document.createElement('script');script.src=PITCH_MODEL_SRC;script.async=false;script.dataset.pitchModelRelease='20260826-2940';document.head.appendChild(script);
  }
  function installHardwareFidelity(){
    if(window.__303boxHardwareFidelity?.version==='20260826-2930'||document.querySelector('script[data-hardware-fidelity-release="20260826-2930"]'))return;
    const script=document.createElement('script');script.src=HARDWARE_FIDELITY_SRC;script.async=false;script.dataset.hardwareFidelityRelease='20260826-2930';document.head.appendChild(script);
  }

  function installSharedLayout(){
    ['siteShellLayout2401','siteShellLayout2404','siteShellLayout2405','siteShellLayout2406','siteShellLayout2407','siteShellLayout2408','siteShellLayout2409','siteShellLayout2410','siteShellLayout2411','siteShellLayout2601','siteShellLayout2602','siteShellLayout2603','siteShellLayout2604','siteShellLayout2702'].forEach(id=>document.getElementById(id)?.remove());
  }

  function installReleaseStyles(){
    document.querySelectorAll('link[data-midi-layout-release],link[data-console-polish-release]').forEach(link=>link.remove());
    const midi=document.createElement('link');midi.rel='stylesheet';midi.href=MIDI_LAYOUT_HREF;midi.dataset.midiLayoutRelease=RELEASE_EPOCH;document.head.appendChild(midi);
    const polish=document.createElement('link');polish.rel='stylesheet';polish.href=CONSOLE_POLISH_HREF;polish.dataset.consolePolishRelease=RELEASE_EPOCH;document.head.appendChild(polish);
  }

  function normalizedPath(path=location.pathname){return path==='/'||path==='/tr/'?path:path.replace(/\/+$/,'')}
  function alternateHref(targetLang){
    const direct=document.querySelector(`link[rel="alternate"][hreflang="${targetLang}"]`)?.href;
    if(direct){const url=new URL(direct,location.href);return url.pathname+url.search+url.hash}
    const map={
      '/':'/tr/','/tr/':'/','/guides.html':'/tr/rehberler.html','/tr/rehberler.html':'/guides.html','/about.html':'/tr/hakkinda.html','/tr/hakkinda.html':'/about.html','/303-pattern-guide.html':'/tr/303-pattern-rehberi.html','/tr/303-pattern-rehberi.html':'/303-pattern-guide.html','/acid-house-guide.html':'/tr/acid-house-rehberi.html','/tr/acid-house-rehberi.html':'/acid-house-guide.html','/midi-hardware-guide.html':'/tr/midi-donanim-rehberi.html','/tr/midi-donanim-rehberi.html':'/midi-hardware-guide.html','/303-pattern-examples.html':'/tr/303-pattern-ornekleri.html','/tr/303-pattern-ornekleri.html':'/303-pattern-examples.html'
    };
    return map[normalizedPath()]||(targetLang==='tr'?'/tr/':'/');
  }
  function installSharedChrome(){
    const lang=language(),tr=lang==='tr',home=tr?'/tr/':'/',prefix=tr?'/tr/':'/',otherLang=tr?'en':'tr',otherHref=alternateHref(otherLang);
    const header=document.querySelector('.site-header');
    if(header){
      header.innerHTML=`<div class="shell header-inner">
        <a class="brand" href="${home}#top" aria-label="303box home"><span class="brand-glyph" aria-hidden="true">303</span><span class="brand-copy"><strong>303box</strong><small data-shell-i18n="brandTag">${text('brandTag',lang)}</small></span></a>
        <nav class="nav" aria-label="${text('primaryNavigation',lang)}" data-shell-i18n-attr="primaryNavigation"><a href="${prefix}#sequencer">303</a><a href="${prefix}#drums" data-shell-i18n="rhythm">${text('rhythm',lang)}</a><a href="${prefix}#guide" data-shell-i18n="guide">${text('guide',lang)}</a><a href="${prefix}#history" data-shell-i18n="history">${text('history',lang)}</a><a href="${prefix}#faq" data-shell-i18n="faq">${text('faq',lang)}</a></nav>
        <div class="header-actions"><button class="language-switch" id="languageButton" data-language-switch type="button" aria-label="${text('changeLanguage',lang)}"><span id="languageCurrent" data-language-current>${lang.toUpperCase()}</span><span class="language-separator">/</span><span id="languageNext" data-language-next>${tr?'EN':'TR'}</span></button><a class="mini-cta" href="${prefix}#sequencer" data-shell-i18n="openSequencer">${text('openSequencer',lang)}</a></div>
      </div>`;
      const languageButton=header.querySelector('#languageButton');
      if(languageButton&&!document.body?.dataset?.page){languageButton.addEventListener('click',()=>{try{localStorage.setItem('303-lang',otherLang)}catch(_){}location.href=otherHref})}
      header.querySelector('.mini-cta')?.addEventListener('click',()=>{try{localStorage.setItem('303-lang',lang)}catch(_){}});
    }
    let footer=document.querySelector('.site-footer');
    if(!footer){footer=document.createElement('footer');footer.className='site-footer';document.body.appendChild(footer)}
    const disclaimer=tr?'/tr/#disclaimer':'/#disclaimer',shortcuts=tr?'/tr/#shortcuts':'/#shortcuts';
    footer.innerHTML=`<div class="shell footer-inner"><div class="z3z-credit"><span data-shell-i18n="footerCredit">${text('footerCredit',lang)}</span><a href="https://instagram.com/zafer.pro" target="_blank" rel="me noopener" data-social-platform="instagram" data-social-placement="footer">Z3Z / @zafer.pro</a><small class="site-version" data-site-version>v${SITE_VERSION}</small></div><div class="footer-links"><a href="${disclaimer}" data-disclaimer-link="true" data-shell-i18n="footerDisclaimer">${text('footerDisclaimer',lang)}</a><a href="${shortcuts}" data-shortcuts-link="true" data-shell-i18n="footerShortcuts">${text('footerShortcuts',lang)}</a><a href="/privacy.html" data-shell-i18n="footerPrivacy">${text('footerPrivacy',lang)}</a><a href="https://instagram.com/zafer.pro" rel="me noopener" target="_blank" data-social-platform="instagram" data-social-placement="footer">Instagram</a><a href="https://youtube.com/@zaferlatif" rel="noopener" target="_blank" data-social-platform="youtube" data-social-placement="footer">YouTube</a></div></div>`;
  }

  function installMidiActionRow(){
    const router=document.getElementById('midiRouter'),secondary=router?.querySelector('.midi-router-secondary'),guide=document.getElementById('midiHardwareGuide'),panic=document.getElementById('midiPanic'),badge=document.getElementById('midiRouterBadge');
    if(!router||!secondary||!guide||!panic)return;badge?.setAttribute('aria-hidden','true');
    let row=router.querySelector('.midi-router-actions');if(!row){row=document.createElement('div');row.className='midi-router-actions';secondary.insertAdjacentElement('afterend',row)}
    if(guide.parentElement!==row)row.appendChild(guide);if(panic.parentElement!==row)row.appendChild(panic);
  }

  function t8Ready(){const state=window.__303boxMidiRouter?.state,badge=document.getElementById('midiRouterBadge');return!!(state?.enabled&&!state?.blocked&&state?.effective==='t8'&&badge?.classList.contains('ready'))}
  async function runRhythmPrm(button){
    if(rhythmTransferBusy||!t8Ready())return;const api=window.__303boxT8Prm;
    if(!api){button.textContent=language()==='tr'?'PRM HAZIR DEĞİL':'PRM NOT READY';setTimeout(syncRhythmTransferButton,1200);return}
    rhythmTransferBusy=true;syncRhythmTransferButton();
    try{if(typeof window.showSaveFilePicker==='function'||typeof window.showDirectoryPicker==='function'){await api.writeRhythmPrm('RHYTHM_PTN01_01.PRM');button.textContent=language()==='tr'?'PRM YAZILDI':'PRM WRITTEN'}else{api.downloadRhythmPrm('RHYTHM_PTN01_01.PRM');button.textContent=language()==='tr'?'PRM İNDİRİLDİ':'PRM DOWNLOADED'}}
    catch(err){if(err?.name!=='AbortError'){console.warn('[303box] T-8 rhythm PRM transfer failed',err);button.textContent=language()==='tr'?'PRM BAŞARISIZ':'PRM FAILED'}}
    finally{setTimeout(()=>{rhythmTransferBusy=false;syncRhythmTransferButton()},1300)}
  }
  function syncRhythmTransferButton(){
    const router=document.getElementById('midiRouter'),assist=document.getElementById('midiRecAssist');if(!router||!assist)return;
    const legacy=document.getElementById('midiRecRhythm');if(legacy){if(!legacy.hidden)legacy.hidden=true;if(legacy.getAttribute('aria-hidden')!=='true')legacy.setAttribute('aria-hidden','true')}
    let button=document.getElementById('midiRhythmPrm');if(!button){button=document.createElement('button');button.id='midiRhythmPrm';button.type='button';button.className='midi-rec-button';assist.appendChild(button);button.addEventListener('click',()=>runRhythmPrm(button))}
    const label=rhythmTransferBusy?(language()==='tr'?'RİTİM PRM…':'RHYTHM PRM…'):(language()==='tr'?'RİTİM → PRM':'RHYTHM → PRM');if(button.textContent!==label)button.textContent=label;
    const disabled=rhythmTransferBusy||!t8Ready();if(button.disabled!==disabled)button.disabled=disabled;button.title=language()==='tr'?'T-8 ritim patternini PRM aktarım dosyasına yaz/indir.':'Write/download the current T-8 rhythm pattern as a PRM transfer file.';
    if(!midiTransferObserver){midiTransferObserver=new MutationObserver(syncRhythmTransferButton);midiTransferObserver.observe(router,{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled','hidden']})}
  }

  function applyScopePolish(panel){
    const controls=panel.querySelector('#scopeSourceControls'),tabs=panel.querySelector('.mini-tabs');if(controls&&tabs&&tabs.parentElement!==controls)controls.prepend(tabs);tabs?.classList.add('scope-control-grid');
    const head=panel.querySelector('.mini-analyzer-head'),status=document.getElementById('scopeInputStatus');if(head&&status){status.classList.add('scope-hardware-status');if(status.parentElement!==head)head.appendChild(status)}
  }
  function installScopePolish(){const panel=document.querySelector('#acidConsole .scope-panel');if(!panel)return;applyScopePolish(panel);if(!scopePolishObserver){scopePolishObserver=new MutationObserver(()=>applyScopePolish(panel));scopePolishObserver.observe(panel,{childList:true,subtree:true})}}

  function render(){
    installSharedLayout();installReleaseStyles();installPitchModel();installHardwareFidelity();installSharedChrome();installMidiActionRow();syncRhythmTransferButton();installScopePolish();const lang=language();
    document.querySelectorAll('[data-shell-i18n]').forEach(element=>{const key=element.dataset.shellI18n;if(key)element.textContent=text(key,lang)});
    document.querySelectorAll('[data-shell-i18n-attr]').forEach(element=>{const key=element.dataset.shellI18nAttr;if(key)element.setAttribute('aria-label',text(key,lang))});
    document.querySelectorAll('[data-language-switch]').forEach(button=>button.setAttribute('aria-label',text('changeLanguage',lang)));
    document.querySelectorAll('[data-language-current]').forEach(element=>{element.textContent=lang.toUpperCase()});
    document.querySelectorAll('[data-language-next]').forEach(element=>{element.textContent=lang==='en'?'TR':'EN'});
    document.querySelectorAll('[data-site-version]').forEach(element=>{element.textContent=`v${SITE_VERSION}`;element.setAttribute('aria-label',`${text('versionLabel',lang)} ${SITE_VERSION}`);element.title=`${text('versionLabel',lang)} ${SITE_VERSION}`});
  }

  installBackgroundPlaybackPolicy();installPitchModel();installHardwareFidelity();
  document.addEventListener('303box:languagechange',render);document.addEventListener('303box:content-refresh',render);document.addEventListener('303box:ready',render);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
  window.__303boxSiteShell={version:SITE_VERSION,render,text,get language(){return language()}};
})();