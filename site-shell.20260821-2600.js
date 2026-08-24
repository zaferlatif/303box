(() => {
  'use strict';

  const SITE_VERSION='2026.08.24.11';
  const MIDI_LAYOUT_HREF='./midi-layout.20260824-2800.css?v=20260824-2870';
  const CONSOLE_POLISH_HREF='./console-polish.20260824-2840.css?v=20260824-2870';
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

  function installSharedLayout(){
    ['siteShellLayout2401','siteShellLayout2404','siteShellLayout2405','siteShellLayout2406','siteShellLayout2407','siteShellLayout2408','siteShellLayout2409','siteShellLayout2410'].forEach(id=>document.getElementById(id)?.remove());
    const existing=document.getElementById('siteShellLayout2411');
    if(existing){document.head.appendChild(existing);return}
    const style=document.createElement('style');style.id='siteShellLayout2411';style.textContent=`
      html body .site-footer .footer-inner{width:min(calc(100% - 40px),var(--shell,1180px))!important;max-width:var(--shell,1180px)!important;margin-inline:auto!important;min-height:150px!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:30px!important;text-align:left!important}
      html body .site-footer .z3z-credit{width:auto!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;gap:7px!important;text-align:left!important}
      html body .site-footer .footer-links{width:auto!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important;gap:22px!important;text-align:left!important}
      @media(max-width:760px){
        html body .site-footer .footer-inner{width:min(calc(100% - 40px),var(--shell,1180px))!important;min-height:0!important;padding:34px 0!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:20px!important;text-align:center!important}
        html body .site-footer .z3z-credit{width:100%!important;align-items:center!important;text-align:center!important}
        html body .site-footer .footer-links{width:100%!important;justify-content:center!important;align-items:center!important;gap:12px 20px!important;text-align:center!important}
      }
      @media(max-width:430px){html body .site-footer .footer-inner{width:calc(100% - 28px)!important}html body .site-footer .footer-links{gap:10px 16px!important}}
    `;document.head.appendChild(style);
  }

  function installReleaseStyles(){
    document.querySelectorAll('link[data-midi-layout-release],link[data-console-polish-release]').forEach(link=>link.remove());
    const midi=document.createElement('link');midi.rel='stylesheet';midi.href=MIDI_LAYOUT_HREF;midi.dataset.midiLayoutRelease='2870';document.head.appendChild(midi);
    const polish=document.createElement('link');polish.rel='stylesheet';polish.href=CONSOLE_POLISH_HREF;polish.dataset.consolePolishRelease='2870';document.head.appendChild(polish);
  }

  function installMidiActionRow(){
    const router=document.getElementById('midiRouter');
    const secondary=router?.querySelector('.midi-router-secondary');
    const guide=document.getElementById('midiHardwareGuide');
    const panic=document.getElementById('midiPanic');
    const badge=document.getElementById('midiRouterBadge');
    if(!router||!secondary||!guide||!panic)return;
    badge?.setAttribute('aria-hidden','true');
    let row=router.querySelector('.midi-router-actions');
    if(!row){row=document.createElement('div');row.className='midi-router-actions';secondary.insertAdjacentElement('afterend',row)}
    if(guide.parentElement!==row)row.appendChild(guide);
    if(panic.parentElement!==row)row.appendChild(panic);
  }

  function t8Ready(){
    const state=window.__303boxMidiRouter?.state;
    const badge=document.getElementById('midiRouterBadge');
    return !!(state?.enabled&&!state?.blocked&&state?.effective==='t8'&&badge?.classList.contains('ready'));
  }

  async function runRhythmPrm(button){
    if(rhythmTransferBusy||!t8Ready())return;
    const api=window.__303boxT8Prm;
    if(!api){button.textContent=language()==='tr'?'PRM HAZIR DEĞİL':'PRM NOT READY';setTimeout(syncRhythmTransferButton,1200);return}
    rhythmTransferBusy=true;syncRhythmTransferButton();
    try{
      if(typeof window.showSaveFilePicker==='function'||typeof window.showDirectoryPicker==='function'){
        await api.writeRhythmPrm('RHYTHM_PTN01_01.PRM');
        button.textContent=language()==='tr'?'PRM YAZILDI':'PRM WRITTEN';
      }else{
        api.downloadRhythmPrm('RHYTHM_PTN01_01.PRM');
        button.textContent=language()==='tr'?'PRM İNDİRİLDİ':'PRM DOWNLOADED';
      }
    }catch(err){
      if(err?.name!=='AbortError'){console.warn('[303box] T-8 rhythm PRM transfer failed',err);button.textContent=language()==='tr'?'PRM BAŞARISIZ':'PRM FAILED'}
    }finally{setTimeout(()=>{rhythmTransferBusy=false;syncRhythmTransferButton()},1300)}
  }

  function syncRhythmTransferButton(){
    const router=document.getElementById('midiRouter');
    const assist=document.getElementById('midiRecAssist');
    if(!router||!assist)return;
    const legacy=document.getElementById('midiRecRhythm');
    if(legacy){if(!legacy.hidden)legacy.hidden=true;if(legacy.getAttribute('aria-hidden')!=='true')legacy.setAttribute('aria-hidden','true')}
    let button=document.getElementById('midiRhythmPrm');
    if(!button){
      button=document.createElement('button');button.id='midiRhythmPrm';button.type='button';button.className='midi-rec-button';assist.appendChild(button);
      button.addEventListener('click',()=>runRhythmPrm(button));
    }
    const label=rhythmTransferBusy?(language()==='tr'?'RİTİM PRM…':'RHYTHM PRM…'):(language()==='tr'?'RİTİM → PRM':'RHYTHM → PRM');
    if(button.textContent!==label)button.textContent=label;
    const disabled=rhythmTransferBusy||!t8Ready();if(button.disabled!==disabled)button.disabled=disabled;
    button.title=language()==='tr'?'T-8 ritim patternini PRM aktarım dosyasına yaz/indir.':'Write/download the current T-8 rhythm pattern as a PRM transfer file.';
    if(!midiTransferObserver){
      midiTransferObserver=new MutationObserver(syncRhythmTransferButton);
      midiTransferObserver.observe(router,{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled','hidden']});
    }
  }

  function applyScopePolish(panel){
    const controls=panel.querySelector('#scopeSourceControls');
    const tabs=panel.querySelector('.mini-tabs');
    if(controls&&tabs&&tabs.parentElement!==controls)controls.prepend(tabs);
    tabs?.classList.add('scope-control-grid');
    const head=panel.querySelector('.mini-analyzer-head');
    const status=document.getElementById('scopeInputStatus');
    if(head&&status){status.classList.add('scope-hardware-status');if(status.parentElement!==head)head.appendChild(status)}
  }

  function installScopePolish(){
    const panel=document.querySelector('#acidConsole .scope-panel');
    if(!panel)return;
    applyScopePolish(panel);
    if(!scopePolishObserver){
      scopePolishObserver=new MutationObserver(()=>applyScopePolish(panel));
      scopePolishObserver.observe(panel,{childList:true,subtree:true});
    }
  }

  function render(){
    installSharedLayout();installReleaseStyles();installMidiActionRow();syncRhythmTransferButton();installScopePolish();const lang=language();
    document.querySelectorAll('[data-shell-i18n]').forEach(element=>{const key=element.dataset.shellI18n;if(key)element.textContent=text(key,lang)});
    document.querySelectorAll('[data-shell-i18n-attr]').forEach(element=>{const key=element.dataset.shellI18nAttr;if(key)element.setAttribute('aria-label',text(key,lang))});
    document.querySelectorAll('[data-language-switch]').forEach(button=>button.setAttribute('aria-label',text('changeLanguage',lang)));
    document.querySelectorAll('[data-language-current]').forEach(element=>{element.textContent=lang.toUpperCase()});
    document.querySelectorAll('[data-language-next]').forEach(element=>{element.textContent=lang==='en'?'TR':'EN'});
    document.querySelectorAll('[data-site-version]').forEach(element=>{element.textContent=`v${SITE_VERSION}`;element.setAttribute('aria-label',`${text('versionLabel',lang)} ${SITE_VERSION}`);element.title=`${text('versionLabel',lang)} ${SITE_VERSION}`});
    document.querySelectorAll('.footer-links a[href="/privacy.html"]').forEach(link=>link.removeAttribute('aria-current'));
  }

  installBackgroundPlaybackPolicy();
  document.addEventListener('303box:languagechange',render);document.addEventListener('303box:content-refresh',render);document.addEventListener('303box:ready',render);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
  window.__303boxSiteShell={version:SITE_VERSION,render,text,get language(){return language()}};
})();