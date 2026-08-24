(() => {
  'use strict';

  const SITE_VERSION='2026.08.24.7';
  const MIDI_LAYOUT_HREF='./midi-layout.20260824-2800.css?v=20260824-2830';
  const COPY={
    en:{brandTag:'Acid pattern laboratory',primaryNavigation:'Primary navigation',rhythm:'Rhythm',guide:'Guide',history:'History',faq:'FAQ',openSequencer:'Open sequencer',changeLanguage:'Change language',footerCredit:'303box is an independent music tool built by Z3Z.',footerDisclaimer:'Disclaimer',footerShortcuts:'Shortcuts',footerPrivacy:'Privacy',versionLabel:'Site version'},
    tr:{brandTag:'Acid pattern laboratuvarı',primaryNavigation:'Ana navigasyon',rhythm:'Ritim',guide:'Rehber',history:'Tarihçe',faq:'SSS',openSequencer:'Sequencer’ı aç',changeLanguage:'Dili değiştir',footerCredit:'303box, Z3Z tarafından geliştirilen bağımsız bir müzik aracıdır.',footerDisclaimer:'Sorumluluk',footerShortcuts:'Kısayollar',footerPrivacy:'Gizlilik',versionLabel:'Site sürümü'}
  };
  const language=()=>document.documentElement.lang==='tr'?'tr':'en';
  const text=(key,lang=language())=>COPY[lang][key]??COPY.en[key]??key;

  function installBackgroundPlaybackPolicy(){
    if(window.__303boxBackgroundPlaybackPolicyInstalled)return;
    window.__303boxBackgroundPlaybackPolicyInstalled=true;
    document.addEventListener('visibilitychange',event=>{
      // Keep the shared Web Audio + worker-clock transport running when another tab
      // becomes active. Older MIDI/audio modules intentionally stopped on hidden.
      // pagehide handlers remain untouched for real navigation/close safety.
      if(document.hidden)event.stopImmediatePropagation();
    },true);
  }

  function installSharedLayout(){
    ['siteShellLayout2401','siteShellLayout2404','siteShellLayout2405','siteShellLayout2406'].forEach(id=>document.getElementById(id)?.remove());
    const existing=document.getElementById('siteShellLayout2407');
    if(existing){document.head.appendChild(existing);return}
    const style=document.createElement('style');style.id='siteShellLayout2407';style.textContent=`
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

  function installMidiLayoutRelease(){
    document.querySelectorAll('link[data-midi-layout-release]').forEach(link=>link.remove());
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=MIDI_LAYOUT_HREF;
    link.dataset.midiLayoutRelease='2830';
    document.head.appendChild(link);
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
    if(!row){
      row=document.createElement('div');
      row.className='midi-router-actions';
      secondary.insertAdjacentElement('afterend',row);
    }
    if(guide.parentElement!==row)row.appendChild(guide);
    if(panic.parentElement!==row)row.appendChild(panic);
  }

  function render(){
    installSharedLayout();installMidiLayoutRelease();installMidiActionRow();const lang=language();
    document.querySelectorAll('[data-shell-i18n]').forEach(element=>{const key=element.dataset.shellI18n;if(key)element.textContent=text(key,lang)});
    document.querySelectorAll('[data-shell-i18n-attr]').forEach(element=>{const key=element.dataset.shellI18nAttr;if(key)element.setAttribute('aria-label',text(key,lang))});
    document.querySelectorAll('[data-language-switch]').forEach(button=>button.setAttribute('aria-label',text('changeLanguage',lang)));
    document.querySelectorAll('[data-language-current]').forEach(element=>{element.textContent=lang.toUpperCase()});
    document.querySelectorAll('[data-language-next]').forEach(element=>{element.textContent=lang==='en'?'TR':'EN'});
    document.querySelectorAll('[data-site-version]').forEach(element=>{element.textContent=`v${SITE_VERSION}`;element.setAttribute('aria-label',`${text('versionLabel',lang)} ${SITE_VERSION}`);element.title=`${text('versionLabel',lang)} ${SITE_VERSION}`});
    document.querySelectorAll('.footer-links a[href="/privacy.html"]').forEach(link=>link.removeAttribute('aria-current'));
  }

  installBackgroundPlaybackPolicy();
  document.addEventListener('303box:languagechange',render);document.addEventListener('303box:content-refresh',render);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
  window.__303boxSiteShell={version:SITE_VERSION,render,text,get language(){return language()}};
})();