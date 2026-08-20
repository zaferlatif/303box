(() => {
  'use strict';

  const IDS=['clearButton','drumClear'];
  const BASE={
    'border':'1px solid #6e302c',
    'background':'#211213',
    'background-image':'none',
    'color':'#ff746e',
    'box-shadow':'none',
    'filter':'none',
    'opacity':'1',
    'appearance':'none',
    '-webkit-appearance':'none',
    'text-shadow':'none'
  };
  const HOVER={
    'border-color':'#82403a',
    'background':'#291617',
    'color':'#ff817b'
  };

  function setImportant(el, map){
    Object.entries(map).forEach(([key,value])=>el.style.setProperty(key,value,'important'));
  }

  function lock(el){
    if(!el)return false;
    setImportant(el,BASE);
    if(el.dataset.clearStyleLock==='2204')return true;
    el.dataset.clearStyleLock='2204';
    el.addEventListener('pointerenter',()=>setImportant(el,HOVER));
    el.addEventListener('pointerleave',()=>setImportant(el,BASE));
    el.addEventListener('blur',()=>setImportant(el,BASE));
    return true;
  }

  function apply(){
    return IDS.map(id=>lock(document.getElementById(id))).every(Boolean);
  }

  function settle(){
    [0,60,180,420,900,1600,2800].forEach(ms=>setTimeout(apply,ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settle,{once:true});
  else settle();
  window.addEventListener('load',settle,{once:true});

  new MutationObserver(mutations=>{
    if(mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(IDS.includes(n.id)||IDS.some(id=>n.querySelector?.(`#${id}`)))))){
      requestAnimationFrame(apply);
    }
  }).observe(document.documentElement,{childList:true,subtree:true});

  window.__303boxActionStyleLock={version:'2204',apply};
})();
