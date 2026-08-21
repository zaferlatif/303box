(() => {
  'use strict';
  const root=location.pathname==='/'||location.pathname.endsWith('/index.html');
  if(!root)return;
  const tr=()=>document.documentElement.lang==='tr';
  const COPY={
    en:{title:'303box — 303 Pattern Sketchpad for Hardware',desc:'A browser sketchpad for writing, previewing and transferring 303 and rhythm patterns to hardware. Rule-based random starts, not AI composition and not a replacement for live performance.'},
    tr:{title:'303box — Donanım için 303 Pattern Çalışma Alanı',desc:'303 ve ritim pattern’lerini tarayıcıda yazmak, önizlemek ve donanıma taşımak için çalışma alanı. Rastgele başlangıçlar kural tabanlıdır; yapay zekâ bestecisi veya canlı performansın yerine geçen bir araç değildir.'}
  };

  function meta(selector,attr,value){
    let el=document.head.querySelector(selector);
    if(!el){el=document.createElement('meta');const m=selector.match(/meta\[([^=]+)="([^"]+)"\]/);if(m)el.setAttribute(m[1],m[2]);document.head.appendChild(el)}
    el.setAttribute(attr,value);
  }
  function canonical(){let el=document.head.querySelector('link[rel="canonical"]');if(!el){el=document.createElement('link');el.rel='canonical';document.head.appendChild(el)}el.href='https://303box.com/'}
  function alternates(){
    document.head.querySelectorAll('link[rel="alternate"][data-303box-seo]').forEach(x=>x.remove());
    [['en','https://303box.com/'],['tr','https://303box.com/tr/'],['x-default','https://303box.com/']].forEach(([hreflang,href])=>{const el=document.createElement('link');el.rel='alternate';el.hreflang=hreflang;el.href=href;el.dataset['303boxSeo']='1';document.head.appendChild(el)});
  }
  function schema(c){
    document.querySelector('#seoSchema')?.remove();
    const s=document.createElement('script');s.id='seoSchema';s.type='application/ld+json';s.textContent=JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'WebSite','@id':'https://303box.com/#website',url:'https://303box.com/',name:'303box',inLanguage:['en','tr']},{'@type':'SoftwareApplication','@id':'https://303box.com/#software',name:'303box',url:'https://303box.com/',applicationCategory:'MultimediaApplication',operatingSystem:'Any modern web browser',isAccessibleForFree:true,description:c.desc,featureList:['16-step 303 pattern editing','Rule-based random starting patterns','Accent and slide editing','Synchronized rhythm sketching','Web Audio preview','Browser MIDI output','Hardware workflow','Pattern image export']} ]});document.head.appendChild(s);
  }
  function apply(){
    const c=COPY[tr()?'tr':'en'];document.title=c.title;
    meta('meta[name="description"]','content',c.desc);meta('meta[property="og:title"]','content',c.title);meta('meta[property="og:description"]','content',c.desc);meta('meta[name="twitter:title"]','content',c.title);meta('meta[name="twitter:description"]','content',c.desc);
    canonical();alternates();schema(c);
  }
  let queued=false;function queue(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply()})}
  document.addEventListener('303box:languagechange',queue);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  window.__303boxSeo={version:'2000',apply};
})();
