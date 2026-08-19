(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const isTR=()=>document.documentElement.lang==='tr';

  const ICONS={
    instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.4-3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z"/></svg>',
    youtube:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.7V8.3L16 12l-6.4 3.7Z"/></svg>'
  };

  function copy(){
    return isTR()
      ? {title:'303box hoşuna gittiyse Z3Z’yi takip et.',sub:'Yeni denemeler, donanım ve acid çalışmalarını Instagram ve YouTube’da paylaşıyorum.',close:'Kapat'}
      : {title:'Like 303box? Follow Z3Z.',sub:'I share new experiments, hardware and acid work on Instagram and YouTube.',close:'Close'};
  }

  function renderCreator(){
    const dock=$('#creatorFollow');
    if(!dock)return;
    const c=copy();
    const strong=dock.querySelector('.creator-follow-copy strong');
    const sub=dock.querySelector('.creator-follow-copy span');
    const close=dock.querySelector('.creator-follow-close');
    if(strong)strong.textContent=c.title;
    if(sub)sub.textContent=c.sub;
    if(close)close.setAttribute('aria-label',c.close);
  }

  function mountCreator(){
    if($('#creatorFollow'))return renderCreator();
    try{if(sessionStorage.getItem('303box-creator-follow-hidden')==='1')return}catch(_){}
    const dock=document.createElement('aside');
    dock.id='creatorFollow';
    dock.className='creator-follow';
    dock.setAttribute('aria-label','Z3Z social links');
    dock.innerHTML=`<div class="creator-follow-copy"><div><strong></strong><span></span></div><button class="creator-follow-close" type="button" aria-label="Close">×</button></div><div class="creator-follow-links"><a href="https://instagram.com/zafer.pro" target="_blank" rel="me noopener">${ICONS.instagram}<span>Instagram</span></a><a href="https://youtube.com/@zaferlatif" target="_blank" rel="noopener">${ICONS.youtube}<span>YouTube</span></a></div>`;
    const footer=$('.site-footer');
    if(footer)footer.before(dock);else document.body.appendChild(dock);
    dock.querySelector('.creator-follow-close')?.addEventListener('click',()=>{
      try{sessionStorage.setItem('303box-creator-follow-hidden','1')}catch(_){}
      dock.remove();
    });
    renderCreator();
  }

  function normalizeKnobs(){
    const grid=$('#knobGrid');if(!grid)return;
    ['tune','cutoff','resonance','envMod','decay','accent','delay','distortion','reverb'].forEach(id=>{
      const node=grid.querySelector(`[data-knob="${id}"]`) || grid.querySelector(`[data-knob-id="${id}"]`)?.closest('.knob');
      if(node)grid.appendChild(node);
    });
  }

  function apply(){mountCreator();normalizeKnobs()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  window.addEventListener('load',()=>setTimeout(apply,80),{once:true});
  new MutationObserver(()=>{renderCreator();normalizeKnobs()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.__303boxUiRefresh={version:'1750',apply};
})();
