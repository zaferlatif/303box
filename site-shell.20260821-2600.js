(() => {
  'use strict';

  const SITE_VERSION='2026.08.24.2';
  const COPY={
    en:{brandTag:'Acid pattern laboratory',primaryNavigation:'Primary navigation',rhythm:'Rhythm',guide:'Guide',history:'History',faq:'FAQ',openSequencer:'Open sequencer',changeLanguage:'Change language',footerCredit:'303box is an independent music tool built by Z3Z.',footerDisclaimer:'Disclaimer',footerShortcuts:'Shortcuts',footerPrivacy:'Privacy',versionLabel:'Site version'},
    tr:{brandTag:'Acid pattern laboratuvarı',primaryNavigation:'Ana navigasyon',rhythm:'Ritim',guide:'Rehber',history:'Tarihçe',faq:'SSS',openSequencer:'Sequencer’ı aç',changeLanguage:'Dili değiştir',footerCredit:'303box, Z3Z tarafından geliştirilen bağımsız bir müzik aracıdır.',footerDisclaimer:'Sorumluluk',footerShortcuts:'Kısayollar',footerPrivacy:'Gizlilik',versionLabel:'Site sürümü'}
  };
  const language=()=>document.documentElement.lang==='tr'?'tr':'en';
  const text=(key,lang=language())=>COPY[lang][key]??COPY.en[key]??key;

  function installSharedLayout(){
    const existing=document.getElementById('siteShellLayout2401');
    if(existing){document.head.appendChild(existing);return}
    const style=document.createElement('style');style.id='siteShellLayout2401';style.textContent=`
      html body .site-footer .footer-inner{width:min(calc(100% - 40px),var(--shell,1180px))!important;max-width:var(--shell,1180px)!important;margin-inline:auto!important;min-height:150px!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:30px!important;text-align:left!important}
      html body .site-footer .z3z-credit{width:auto!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;gap:7px!important;text-align:left!important}
      html body .site-footer .footer-links{width:auto!important;display:flex!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important;gap:22px!important;text-align:left!important}

      html body .machine-suite #midiRouter,html body .machine-suite #midiRouter *{box-sizing:border-box!important}
      html body .machine-suite #midiRouter .midi-router-primary>*,html body .machine-suite #midiRouter .midi-router-secondary>*,html body .machine-suite #midiRouter .midi-field,html body .machine-suite #midiRouter .midi-playback{min-width:0!important;max-width:100%!important}
      html body .machine-suite #midiRouter select,html body .machine-suite #midiRouter button,html body .machine-suite #midiRouter .midi-toggle{box-sizing:border-box!important;min-width:0!important;max-width:100%!important;width:100%!important}
      html body .machine-suite #midiRouter select{overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}

      @media(max-width:1024px){
        html body .machine-suite #midiRouter .midi-router-primary{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-template-rows:auto auto auto!important;gap:8px!important;width:100%!important;max-width:100%!important;min-width:0!important;overflow:hidden!important}
        html body .machine-suite #midiRouter .midi-connect{grid-column:1!important;grid-row:1!important;width:100%!important;min-width:0!important;max-width:100%!important}
        html body .machine-suite #midiRouter .midi-playback{grid-column:2!important;grid-row:1!important;width:100%!important;min-width:0!important;max-width:100%!important;overflow:hidden!important}
        html body .machine-suite #midiRouter .midi-output{grid-column:1/-1!important;grid-row:2!important;width:100%!important;min-width:0!important;max-width:100%!important}
        html body .machine-suite #midiRouter .midi-profile{grid-column:1/-1!important;grid-row:3!important;width:100%!important;min-width:0!important;max-width:100%!important}
        html body .machine-suite #midiRouter .midi-playback select{width:100%!important;min-width:0!important;max-width:100%!important;padding-right:34px!important;font-size:.64rem!important;letter-spacing:.02em!important}

        html body .machine-suite #midiRouter .midi-router-secondary{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-template-rows:auto auto auto!important;gap:8px!important;width:100%!important;max-width:100%!important;min-width:0!important;overflow:hidden!important}
        html body .machine-suite #midiRouter .midi-router-secondary>:nth-child(1){grid-column:1!important;grid-row:1!important}
        html body .machine-suite #midiRouter .midi-router-secondary>:nth-child(2){grid-column:2!important;grid-row:1!important}
        html body .machine-suite #midiRouter .midi-router-secondary>:nth-child(3){grid-column:1!important;grid-row:2!important}
        html body .machine-suite #midiRouter .midi-router-secondary>:nth-child(4){grid-column:2!important;grid-row:2!important}
        html body .machine-suite #midiRouter .midi-router-secondary>:nth-child(5){grid-column:1/-1!important;grid-row:3!important;width:100%!important;min-width:0!important;max-width:100%!important}
        html body .machine-suite #midiRouter #midiPanic{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;margin:0!important;overflow:hidden!important}
      }

      @media(max-width:760px){
        html body .site-footer .footer-inner{width:min(calc(100% - 40px),var(--shell,1180px))!important;min-height:0!important;padding:34px 0!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:20px!important;text-align:center!important}
        html body .site-footer .z3z-credit{width:100%!important;align-items:center!important;text-align:center!important}
        html body .site-footer .footer-links{width:100%!important;justify-content:center!important;align-items:center!important;gap:12px 20px!important;text-align:center!important}

        html body .machine-suite #midiRouter .midi-router-primary{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto!important;gap:8px!important;overflow:hidden!important}
        html body .machine-suite #midiRouter .midi-router-primary .midi-connect,html body .machine-suite #midiRouter .midi-router-primary .midi-playback,html body .machine-suite #midiRouter .midi-router-primary .midi-output,html body .machine-suite #midiRouter .midi-router-primary .midi-profile{grid-column:1!important;grid-row:auto!important;width:100%!important;min-width:0!important;max-width:100%!important}
        html body .machine-suite #midiRouter .midi-router-secondary{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto!important;gap:8px!important;overflow:hidden!important}
        html body .machine-suite #midiRouter .midi-router-secondary>:nth-child(1),html body .machine-suite #midiRouter .midi-router-secondary>:nth-child(2),html body .machine-suite #midiRouter .midi-router-secondary>:nth-child(3),html body .machine-suite #midiRouter .midi-router-secondary>:nth-child(4),html body .machine-suite #midiRouter .midi-router-secondary>:nth-child(5){grid-column:1!important;grid-row:auto!important;width:100%!important;min-width:0!important;max-width:100%!important}
      }
      @media(max-width:430px){html body .site-footer .footer-inner{width:calc(100% - 28px)!important}html body .site-footer .footer-links{gap:10px 16px!important}html body .machine-suite #midiRouter .midi-playback select{font-size:.6rem!important}}
    `;document.head.appendChild(style);
  }

  function render(){
    installSharedLayout();const lang=language();
    document.querySelectorAll('[data-shell-i18n]').forEach(element=>{const key=element.dataset.shellI18n;if(key)element.textContent=text(key,lang)});
    document.querySelectorAll('[data-shell-i18n-attr]').forEach(element=>{const key=element.dataset.shellI18nAttr;if(key)element.setAttribute('aria-label',text(key,lang))});
    document.querySelectorAll('[data-language-switch]').forEach(button=>button.setAttribute('aria-label',text('changeLanguage',lang)));
    document.querySelectorAll('[data-language-current]').forEach(element=>{element.textContent=lang.toUpperCase()});
    document.querySelectorAll('[data-language-next]').forEach(element=>{element.textContent=lang==='en'?'TR':'EN'});
    document.querySelectorAll('[data-site-version]').forEach(element=>{element.textContent=`v${SITE_VERSION}`;element.setAttribute('aria-label',`${text('versionLabel',lang)} ${SITE_VERSION}`);element.title=`${text('versionLabel',lang)} ${SITE_VERSION}`});
    document.querySelectorAll('.footer-links a[href="/privacy.html"]').forEach(link=>link.removeAttribute('aria-current'));
  }
  document.addEventListener('303box:languagechange',render);document.addEventListener('303box:content-refresh',render);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
  window.__303boxSiteShell={version:SITE_VERSION,render,text,get language(){return language()}};
})();