(() => {
  'use strict';
  const STORE='303box-hat-overlay-v1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  let overlay=null;

  function read(){
    const out={ch:Array(16).fill(false),oh:Array(16).fill(false)};
    ['ch','oh'].forEach(id=>{
      $$(`#drums [data-drum="${id}"]`).forEach(el=>{
        const i=Number(el.dataset.step);
        if(Number.isInteger(i)&&i>=0&&i<16) out[id][i]=el.classList.contains('on');
      });
    });
    return out;
  }
  function load(){
    if(overlay)return overlay;
    try{overlay=JSON.parse(localStorage.getItem(STORE)||'null')}catch(_){overlay=null}
    return overlay;
  }
  function persist(){if(!overlay)return;try{localStorage.setItem(STORE,JSON.stringify(overlay))}catch(_){}}
  function capture(){overlay=read();persist()}
  function setButton(el,on){el.classList.toggle('on',!!on);el.setAttribute('aria-pressed',String(!!on))}
  function applySaved(){
    const saved=load();if(!saved)return;
    ['ch','oh'].forEach(id=>{
      if(!Array.isArray(saved[id]))return;
      saved[id].forEach((on,i)=>{const el=$(`#drums [data-drum="${id}"][data-step="${i}"]`);if(el)setButton(el,on)})
    });
  }

  window.addEventListener('click',e=>{
    const hat=e.target.closest?.('#drums .drum-step[data-drum="ch"], #drums .drum-step[data-drum="oh"]');
    if(hat){
      e.preventDefault();e.stopImmediatePropagation();
      setButton(hat,!hat.classList.contains('on'));
      overlay=read();persist();
      return;
    }
    if(e.target.closest?.('#drumRandom,#drumClear')){
      overlay=null;
      setTimeout(capture,140);
      return;
    }
    if(e.target.closest?.('#drums .drum-step')) setTimeout(applySaved,0);
  },true);

  function settle(){[120,360,900,1600].forEach(ms=>setTimeout(applySaved,ms))}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settle,{once:true});else settle();
  window.addEventListener('load',settle,{once:true});

  window.__303boxHatGrid={version:'1531',capture,applySaved};
})();