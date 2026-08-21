(() => {
  'use strict';

  const KEY='303box-consent-v1';
  const VERSION=1;
  const MAX_AGE=180*24*60*60*1000;
  const GA_ID='G-P89YNLFKQX';
  const ADS_CLIENT='ca-pub-0419155924861622';
  const isTR=()=>document.documentElement.lang==='tr';
  const gpc=()=>navigator.globalPrivacyControl===true;
  let state=null,banner=null,analyticsLoaded=false,adsLoaded=false;

  const COPY={
    en:{
      kicker:'PRIVACY CHOICES',title:'Choose optional storage',
      intro:'303box uses local storage for the tool itself. Analytics and advertising storage stay off until you choose otherwise. Advertising consent enables non-personalized AdSense only.',
      analytics:'Analytics',analyticsText:'Google Analytics usage and performance measurement.',
      ads:'Advertising',adsText:'Non-personalized AdSense, frequency capping and aggregated reporting.',
      reject:'REJECT OPTIONAL',save:'SAVE CHOICES',accept:'ACCEPT BOTH',
      foot:'You can change this later from Cookie settings in the footer. Personalized advertising is not enabled by this control.',
      privacy:'Privacy policy',close:'Close privacy choices',settings:'Cookie settings',gpc:'Global Privacy Control is active; advertising storage stays off.'
    },
    tr:{
      kicker:'GİZLİLİK TERCİHLERİ',title:'İsteğe bağlı depolamayı seç',
      intro:'303box aracın çalışması için yerel depolama kullanır. Analiz ve reklam depolaması siz seçim yapana kadar kapalı kalır. Reklam izni yalnız kişiselleştirilmemiş AdSense’i etkinleştirir.',
      analytics:'Analiz',analyticsText:'Google Analytics ile kullanım ve performans ölçümü.',
      ads:'Reklam',adsText:'Kişiselleştirilmemiş AdSense, frekans sınırlama ve toplu raporlama.',
      reject:'İSTEĞE BAĞLIYI REDDET',save:'SEÇİMLERİ KAYDET',accept:'İKİSİNİ KABUL ET',
      foot:'Bu seçimi daha sonra altbilgideki Çerez ayarları bağlantısından değiştirebilirsiniz. Bu kontrol kişiselleştirilmiş reklamı açmaz.',
      privacy:'Gizlilik politikası',close:'Gizlilik tercihlerini kapat',settings:'Çerez ayarları',gpc:'Global Privacy Control etkin; reklam depolaması kapalı kalacak.'
    }
  };
  const t=k=>COPY[isTR()?'tr':'en'][k]||COPY.en[k]||k;

  function read(){
    try{
      const x=JSON.parse(localStorage.getItem(KEY)||'null');
      if(!x||x.version!==VERSION||!Number.isFinite(x.savedAt)||Date.now()-x.savedAt>MAX_AGE)return null;
      return{version:VERSION,savedAt:x.savedAt,analytics:!!x.analytics,ads:!!x.ads&&!gpc()};
    }catch(_){return null}
  }
  function persist(next){
    state={version:VERSION,savedAt:Date.now(),analytics:!!next.analytics,ads:!!next.ads&&!gpc()};
    try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}
  }

  function updateGoogle(){
    if(typeof window.gtag!=='function')return;
    window.gtag('consent','update',{
      analytics_storage:state?.analytics?'granted':'denied',
      ad_storage:state?.ads?'granted':'denied',
      ad_user_data:'denied',
      ad_personalization:'denied'
    });
    window.gtag('set','ads_data_redaction',true);
  }

  function loadAnalytics(){
    if(analyticsLoaded||!state?.analytics)return;
    analyticsLoaded=true;
    window.dataLayer=window.dataLayer||[];
    if(typeof window.gtag!=='function')window.gtag=function(){window.dataLayer.push(arguments)};
    const s=document.createElement('script');s.async=true;s.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;s.dataset.consentGoogle='analytics';document.head.appendChild(s);
    window.gtag('js',new Date());
    window.gtag('config',GA_ID,{send_page_view:true});
  }

  function loadAds(){
    if(adsLoaded||!state?.ads||document.body?.dataset?.consentNoAds==='true')return;
    adsLoaded=true;
    window.adsbygoogle=window.adsbygoogle||[];
    window.adsbygoogle.requestNonPersonalizedAds=1;
    const s=document.createElement('script');s.async=true;s.crossOrigin='anonymous';s.src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADS_CLIENT)}`;s.dataset.consentGoogle='adsense';document.head.appendChild(s);
  }

  function activate(){updateGoogle();loadAnalytics();loadAds()}

  function currentDraft(){
    const a=banner?.querySelector('#consentAnalytics'),d=banner?.querySelector('#consentAds');
    return{analytics:!!a?.checked,ads:!!d?.checked&&!gpc()};
  }

  function build(){
    if(banner)return banner;
    banner=document.createElement('aside');
    banner.id='consentBanner';banner.className='consent-banner';banner.setAttribute('role','dialog');banner.setAttribute('aria-labelledby','consentTitle');
    banner.innerHTML=`
      <div class="consent-banner-head"><div><span class="consent-kicker" data-consent-copy="kicker"></span><h2 id="consentTitle" data-consent-copy="title"></h2></div><button class="consent-close" type="button" aria-label="Close">×</button></div>
      <p class="consent-intro"><span data-consent-copy="intro"></span> <a href="/privacy.html" data-consent-copy="privacy"></a></p>
      <div class="consent-purposes">
        <div class="consent-purpose"><div><strong data-consent-copy="analytics"></strong><small data-consent-copy="analyticsText"></small></div><label class="consent-switch"><input id="consentAnalytics" type="checkbox"><span aria-hidden="true"></span></label></div>
        <div class="consent-purpose"><div><strong data-consent-copy="ads"></strong><small data-consent-copy="adsText"></small></div><label class="consent-switch"><input id="consentAds" type="checkbox"><span aria-hidden="true"></span></label></div>
      </div>
      <div class="consent-actions"><button class="consent-reject" type="button" data-consent-copy="reject"></button><button class="consent-save" type="button" data-consent-copy="save"></button><button class="consent-accept" type="button" data-consent-copy="accept"></button></div>
      <p class="consent-foot"><span data-consent-copy="foot"></span><span id="consentGpc"></span></p>`;
    document.body.appendChild(banner);
    banner.querySelector('.consent-close')?.addEventListener('click',hide);
    banner.querySelector('.consent-reject')?.addEventListener('click',()=>commit({analytics:false,ads:false}));
    banner.querySelector('.consent-save')?.addEventListener('click',()=>commit(currentDraft()));
    banner.querySelector('.consent-accept')?.addEventListener('click',()=>commit({analytics:true,ads:!gpc()}));
    render();return banner;
  }

  function render(){
    if(!banner)return;
    banner.querySelectorAll('[data-consent-copy]').forEach(el=>{const key=el.dataset.consentCopy;el.textContent=t(key)});
    banner.querySelector('.consent-close')?.setAttribute('aria-label',t('close'));
    const a=banner.querySelector('#consentAnalytics'),d=banner.querySelector('#consentAds');
    if(a)a.checked=!!state?.analytics;
    if(d){d.checked=!!state?.ads&&!gpc();d.disabled=gpc()}
    const gp=banner.querySelector('#consentGpc');if(gp)gp.textContent=gpc()?` ${t('gpc')}`:'';
    banner.classList.toggle('has-choice',!!state);
  }

  function show(){
    build();render();
    document.documentElement.classList.add('consent-pending');
    requestAnimationFrame(()=>requestAnimationFrame(()=>banner?.classList.add('is-visible')));
  }
  function hide(){
    banner?.classList.remove('is-visible');document.documentElement.classList.remove('consent-pending');
  }

  function commit(next){
    const prev=state?{analytics:!!state.analytics,ads:!!state.ads}:null;
    persist(next);activate();hide();render();
    document.dispatchEvent(new CustomEvent('303box:consent-changed',{detail:{analytics:state.analytics,ads:state.ads}}));
    const revoked=!!prev&&((prev.analytics&&!state.analytics)||(prev.ads&&!state.ads));
    if(revoked)setTimeout(()=>location.reload(),90);
  }

  function installSettingsLink(){
    document.querySelectorAll('.footer-links').forEach(links=>{
      let a=links.querySelector('[data-cookie-settings]');
      if(!a){
        a=document.createElement('a');a.href='#cookie-settings';a.dataset.cookieSettings='true';a.className='cookie-settings-link';
        a.addEventListener('click',e=>{e.preventDefault();show()});links.prepend(a);
      }
      a.textContent=t('settings');
    });
  }

  function init(){
    state=read();
    if(state)activate();
    build();installSettingsLink();
    if(!state)show();else hide();
  }

  const onReady=()=>{init();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',onReady,{once:true});else onReady();
  document.addEventListener('303box:ready',installSettingsLink);
  document.addEventListener('303box:languagechange',()=>queueMicrotask(()=>{render();installSettingsLink()}));

  window.__303boxConsent={
    version:'2100',show,
    get analytics(){return!!state?.analytics},
    get ads(){return!!state?.ads},
    get choice(){return state?{analytics:!!state.analytics,ads:!!state.ads}:null}
  };
})();
