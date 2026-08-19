(() => {
  'use strict';

  const lang=()=>document.documentElement.lang==='tr'?'tr':'en';
  const COPY={
    en:{kicker:'Z3Z / CREATOR',title:'Like 303box? Follow Z3Z.',body:'New patches, hardware experiments and project updates.',ig:'Instagram',yt:'YouTube',close:'Close'},
    tr:{kicker:'Z3Z / PROJE',title:'303box hoşuna gittiyse Z3Z’yi takip et.',body:'Yeni patch’ler, donanım denemeleri ve proje güncellemeleri.',ig:'Instagram',yt:'YouTube',close:'Kapat'}
  };

  let card=null,timer=null,started=false;

  function render(){
    if(!card)return;
    const c=COPY[lang()];
    card.querySelector('[data-copy="kicker"]').textContent=c.kicker;
    card.querySelector('[data-copy="title"]').textContent=c.title;
    card.querySelector('[data-copy="body"]').textContent=c.body;
    card.querySelector('[data-copy="ig"]').textContent=c.ig;
    card.querySelector('[data-copy="yt"]').textContent=c.yt;
    card.querySelector('.creator-close').setAttribute('aria-label',c.close);
  }

  function mount(){
    if(card||document.querySelector('#creatorFollow'))return;
    card=document.createElement('aside');
    card.id='creatorFollow';
    card.className='creator-nudge creator-follow';
    card.setAttribute('aria-live','polite');
    card.innerHTML=`
      <button class="creator-close" type="button" aria-label="Close">×</button>
      <span class="creator-kicker" data-copy="kicker"></span>
      <strong data-copy="title"></strong>
      <p data-copy="body"></p>
      <div class="creator-links">
        <a href="https://instagram.com/zafer.pro" target="_blank" rel="noopener" data-social-platform="instagram" data-social-placement="popup"><span data-copy="ig"></span><b>@zafer.pro</b></a>
        <a href="https://youtube.com/@zaferlatif" target="_blank" rel="noopener" data-social-platform="youtube" data-social-placement="popup"><span data-copy="yt"></span><b>@zaferlatif</b></a>
      </div>`;
    document.body.appendChild(card);
    card.querySelector('.creator-close').addEventListener('click',()=>{card.classList.remove('is-visible');setTimeout(()=>card?.remove(),260);card=null});
    render();
    try{window.__303boxSocialTracking?.decorate?.()}catch(_){}
  }

  function reveal(){
    if(document.documentElement.classList.contains('consent-pending')){
      timer=setTimeout(reveal,1200);
      return;
    }
    mount();
    if(!card)return;
    if(document.hidden){
      const onVisible=()=>{if(!document.hidden){document.removeEventListener('visibilitychange',onVisible);requestAnimationFrame(()=>card?.classList.add('is-visible'))}};
      document.addEventListener('visibilitychange',onVisible);
      return;
    }
    requestAnimationFrame(()=>requestAnimationFrame(()=>card?.classList.add('is-visible')));
  }

  function start(){
    if(started)return;started=true;
    clearTimeout(timer);
    timer=setTimeout(reveal,5200);
  }

  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  document.addEventListener('303box:ready',start,{once:true});
  if(document.documentElement.classList.contains('app-ready'))start();

  window.__303boxUiRefresh={version:'2100',apply:()=>{},mountCreator:mount};
})();
