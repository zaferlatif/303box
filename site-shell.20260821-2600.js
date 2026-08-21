(() => {
  'use strict';

  const SITE_VERSION='2026.08.21.2';
  const COPY={
    en:{
      brandTag:'Acid pattern laboratory',primaryNavigation:'Primary navigation',rhythm:'Rhythm',guide:'Guide',history:'History',faq:'FAQ',openSequencer:'Open sequencer',changeLanguage:'Change language',
      footerCredit:'303box is an independent music tool built by Z3Z.',footerDisclaimer:'Disclaimer',footerShortcuts:'Shortcuts',footerPrivacy:'Privacy',versionLabel:'Site version'
    },
    tr:{
      brandTag:'Acid pattern laboratuvarı',primaryNavigation:'Ana navigasyon',rhythm:'Ritim',guide:'Rehber',history:'Tarihçe',faq:'SSS',openSequencer:'Sequencer’ı aç',changeLanguage:'Dili değiştir',
      footerCredit:'303box, Z3Z tarafından geliştirilen bağımsız bir müzik aracıdır.',footerDisclaimer:'Sorumluluk',footerShortcuts:'Kısayollar',footerPrivacy:'Gizlilik',versionLabel:'Site sürümü'
    }
  };

  const language=()=>document.documentElement.lang==='tr'?'tr':'en';
  const text=(key,lang=language())=>COPY[lang][key]??COPY.en[key]??key;

  function render(){
    const lang=language();
    document.querySelectorAll('[data-shell-i18n]').forEach(element=>{
      const key=element.dataset.shellI18n;
      if(key)element.textContent=text(key,lang);
    });
    document.querySelectorAll('[data-shell-i18n-attr]').forEach(element=>{
      const key=element.dataset.shellI18nAttr;
      if(key)element.setAttribute('aria-label',text(key,lang));
    });
    document.querySelectorAll('[data-language-switch]').forEach(button=>button.setAttribute('aria-label',text('changeLanguage',lang)));
    document.querySelectorAll('[data-language-current]').forEach(element=>{element.textContent=lang.toUpperCase()});
    document.querySelectorAll('[data-language-next]').forEach(element=>{element.textContent=lang==='en'?'TR':'EN'});
    document.querySelectorAll('[data-site-version]').forEach(element=>{
      element.textContent=`v${SITE_VERSION}`;
      element.setAttribute('aria-label',`${text('versionLabel',lang)} ${SITE_VERSION}`);
      element.title=`${text('versionLabel',lang)} ${SITE_VERSION}`;
    });
    document.querySelectorAll('.footer-links a[href="/privacy.html"]').forEach(link=>{
      if(document.body?.dataset.page==='privacy')link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
  }

  document.addEventListener('303box:languagechange',render);
  document.addEventListener('303box:content-refresh',render);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
  window.__303boxSiteShell={version:SITE_VERSION,render,text,get language(){return language()}};
})();
