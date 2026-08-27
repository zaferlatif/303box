(() => {
  'use strict';

  const SITE_VERSION='2026.08.27.2';
  const RELEASE_EPOCH='20260827-3140';
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
    ['siteShellLayout2401','siteShellLayout2404','siteShellLayout2405','siteShellLayout2406','siteShellLayout2407','siteShellLayout2408','siteShellLayout2409','siteShellLayout2410','siteShellLayout2411','siteShellLayout2601','siteShellLayout2602','siteShellLayout2603','siteShellLayout2604'].forEach(id=>document.getElementById(id)?.remove());
    const existing=document.getElementById('siteShellLayout2702');if(existing){document.head.appendChild(existing);return}
    const style=document.createElement('style');style.id='siteShellLayout2702';style.textContent=`
      html body .site-header{border-bottom:1px solid rgba(255,255,255,.09)!important;background:#070809!important}
      html body .site-header .header-inner{width:min(calc(100% - 40px),var(--shell,1180px))!important;max-width:var(--shell,1180px)!important;margin-inline:auto!important;min-height:92px!important;padding:0!important;display:grid!important;grid-template-columns:auto minmax(0,1fr) auto!important;align-items:center!important;gap:28px!important}
      html body .site-header .brand{display:flex!important;align-items:center!important;gap:13px!important;min-width:max-content!important;text-decoration:none!important}
      html body .site-header .brand-glyph{width:52px!important;height:52px!important;display:grid!important;place-items:center!important;border:1px solid #333741!important;border-radius:12px!important;background:#121419!important;color:#d8ff16!important;font:700 14px/1 ui-monospace,SFMono-Regular,Menlo,monospace!important;letter-spacing:.04em!important}
      html body .site-header .brand-copy{display:flex!important;flex-direction:column!important;gap:2px!important}
      html body .site-header .brand-copy strong{color:#f3f3f5!important;font-size:18px!important;line-height:1.1!important}
      html body .site-header .brand-copy small{color:#777984!important;font-size:11px!important;font-weight:800!important;letter-spacing:.11em!important;text-transform:uppercase!important}
      html body .site-header .nav{min-width:0!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:26px!important;flex-wrap:wrap!important}
      html body .site-header .nav a{color:#a5a6af!important;text-decoration:none!important;font-weight:750!important;font-size:14px!important;white-space:nowrap!important}
      html body .site-header .nav a:hover,html body .site-header .nav a[aria-current="page"]{color:#d8ff16!important}
      html body .site-header .nav .language-link{padding-left:16px!important;border-left:1px solid #31343b!important;color:#d8ff16!important}
      html body .site-header .header-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important}
      html body .site-header .mini-cta{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:46px!important;padding:0 20px!important;border-radius:11px!important;background:#d8ff16!important;color:#090b05!important;text-decoration:none!important;font-weight:900!important;white-space:nowrap!important}
      html body .site-footer{border-top:1px solid rgba(255,255,255,.09)!important;background:#070809!important}
      html body .site-footer .footer-inner{width:min(calc(100% - 40px),var(--shell,1180px))!important;max-width:var(--shell,1180px)!important;margin-inline:auto!important;min-height:150px!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:30px!important;text-align:left!important}
      html body .site-footer .z3z-credit{width:auto!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;gap:7px!important;text-align:left!important}
      html body .site-footer .footer-links{width:auto!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important;gap:12px 22px!important;text-align:left!important}
      html body .site-footer .footer-links a{white-space:nowrap!important}
      @media(max-width:1040px){html body .site-header .header-inner{grid-template-columns:auto auto!important;grid-template-areas:"brand action" "nav nav"!important;min-height:0!important;padding:20px 0!important;gap:18px 24px!important}html body .site-header .brand{grid-area:brand!important}html body .site-header .nav{grid-area:nav!important;justify-content:flex-start!important;gap:12px 22px!important}html body .site-header .header-actions{grid-area:action!important}}
      @media(max-width:760px){html body .site-header .header-inner{width:min(calc(100% - 32px),var(--shell,1180px))!important;grid-template-columns:1fr auto!important;gap:16px!important}html body .site-header .brand-glyph{width:46px!important;height:46px!important}html body .site-header .brand-copy small{display:none!important}html body .site-header .nav{overflow-x:auto!important;flex-wrap:nowrap!important;padding-bottom:3px!important;justify-content:flex-start!important;scrollbar-width:none!important}html body .site-header .nav::-webkit-scrollbar{display:none!important}html body .site-header .mini-cta{min-height:42px!important;padding:0 14px!important;font-size:13px!important}html body .site-footer .footer-inner{width:min(calc(100% - 40px),var(--shell,1180px))!important;min-height:0!important;padding:34px 0!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:20px!important;text-align:center!important}html body .site-footer .z3z-credit{width:100%!important;align-items:center!important;text-align:center!important}html body .site-footer .footer-links{width:100%!important;justify-content:center!important;align-items:center!important;gap:12px 18px!important;text-align:center!important}}
      @media(max-width:430px){html body .site-header .header-inner{width:calc(100% - 24px)!important}html body .site-header .brand-copy strong{font-size:16px!important}html body .site-header .mini-cta{padding:0 11px!important}html body .site-footer .footer-inner{width:calc(100% - 28px)!important}html body .site-footer .footer-links{gap:10px 16px!important}}
    `;document.head.appendChild(style);
  }

  function installReleaseStyles(){
    document.querySelectorAll('link[data-midi-layout-release],link[data-console-polish-release]').forEach(link=>link.remove());
    const midi=document.createElement('link');midi.rel='stylesheet';midi.href=MIDI_LAYOUT_HREF;midi.dataset.midiLayoutRelease=RELEASE_EPOCH;document.head.appendChild(midi);
    const polish=document.createElement('link');polish.rel='stylesheet';polish.href=CONSOLE_POLISH_HREF;polish.dataset.consolePolishRelease=RELEASE_EPOCH;document.head.appendChild(polish);
  }

  const contentNav={
    en:[['/guides.html','Articles'],['/303-pattern-guide.html','Pattern Guide'],['/midi-hardware-guide.html','MIDI & Hardware'],['/303-pattern-examples.html','Examples'],['/about.html','About']],
    tr:[['/tr/rehberler.html','Yazılar'],['/tr/303-pattern-rehberi.html','Pattern Rehberi'],['/tr/midi-donanim-rehberi.html','MIDI & Donanım'],['/tr/303-pattern-ornekleri.html','Örnekler'],['/tr/hakkinda.html','Hakkında']]
  };
  function normalizedPath(path=location.pathname){return path==='/'||path==='/tr/'?path:path.replace(/\/+$/,'')}
  function alternateHref(targetLang){
    const direct=document.querySelector(`link[rel="alternate"][hreflang="${targetLang}"]`)?.href;
    if(direct)return new URL(direct,location.href).pathname+new URL(direct,location.href).search+new URL(direct,location.href).hash;
    const map={
      '/':'/tr/','/tr/':'/','/guides.html':'/tr/rehberler.html','/tr/rehberler.html':'/guides.html','/about.html':'/tr/hakkinda.html','/tr/hakkinda.html':'/about.html','/303-pattern-guide.html':'/tr/303-pattern-rehberi.html','/tr/303-pattern-rehberi.html':'/303-pattern-guide.html','/acid-house-guide.html':'/tr/acid-house-rehberi.html','/tr/acid-house-rehberi.html':'/acid-house-guide.html','/midi-hardware-guide.html':'/tr/midi-donanim-rehberi.html','/tr/midi-donanim-rehberi.html':'/midi-hardware-guide.html','/303-pattern-examples.html':'/tr/303-pattern-ornekleri.html','/tr/303-pattern-ornekleri.html':'/303-pattern-examples.html'
    };
    return map[normalizedPath()]||(targetLang==='tr'?'/tr/':'/');
  }
  function installSharedChrome(){
    const lang=language(),tr=lang==='tr',home=tr?'/tr/':'/',cta=tr?'/tr/#sequencer':'/#sequencer',otherLang=tr?'en':'tr',otherLabel=tr?'EN':'TR',otherHref=alternateHref(otherLang),current=normalizedPath();
    const header=document.querySelector('.site-header');
    if(header){
      header.innerHTML=`<div class="shell header-inner"><a class="brand" href="${home}"><span class="brand-glyph">303</span><span class="brand-copy"><strong>303box</strong><small>${tr?'Acid pattern laboratuvarı':'Acid pattern laboratory'}</small></span></a><nav class="nav" aria-label="${tr?'Ana navigasyon':'Primary navigation'}">${contentNav[lang].map(([href,label])=>`<a href="${href}"${normalizedPath(href)===current?' aria-current="page"':''}>${label}</a>`).join('')}<a class="language-link" href="${otherHref}" aria-label="${tr?'Switch to English':'Türkçeye geç'}">${otherLabel}</a></nav><div class="header-actions"><a class="mini-cta" href="${cta}">${tr?'Sequencer’ı aç':'Open sequencer'}</a></div></div>`;
      header.querySelector('.mini-cta')?.addEventListener('click',()=>{try{localStorage.setItem('303-lang',lang)}catch(_){}});
      header.querySelector('.language-link')?.addEventListener('click',()=>{try{localStorage.setItem('303-lang',otherLang)}catch(_){}});
    }
    let footer=document.querySelector('.site-footer');
    if(!footer){footer=document.createElement('footer');footer.className='site-footer';document.body.appendChild(footer)}
    const privacy='/privacy.html',disclaimer=tr?'/tr/#disclaimer':'/#disclaimer',shortcuts=tr?'/tr/#shortcuts':'/#shortcuts';
    footer.innerHTML=`<div class="shell footer-inner"><div class="z3z-credit"><span>${tr?'303box, Z3Z tarafından geliştirilen bağımsız bir müzik aracıdır.':'303box is an independent music tool built by Z3Z.'}</span><a href="https://instagram.com/zafer.pro" target="_blank" rel="me noopener">Z3Z / @zafer.pro</a><small class="site-version" data-site-version>v${SITE_VERSION}</small></div><div class="footer-links">${contentNav[lang].map(([href,label])=>`<a href="${href}">${label}</a>`).join('')}<a href="${disclaimer}">${tr?'Sorumluluk':'Disclaimer'}</a><a href="${shortcuts}">${tr?'Kısayollar':'Shortcuts'}</a><a href="${privacy}">${tr?'Gizlilik':'Privacy'}</a><a href="https://instagram.com/zafer.pro" rel="me noopener" target="_blank">Instagram</a><a href="https://youtube.com/@zaferlatif" rel="noopener" target="_blank">YouTube</a></div></div>`;
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