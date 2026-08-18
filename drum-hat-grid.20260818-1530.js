(() => {
  'use strict';
  const STORE='303box-hat-overlay-v1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

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
  function save(){ try{localStorage.setItem(STORE,JSON.stringify(read()))}catch(_){} }
  function setButton(el,on){
    el.classList.toggle('on',!!on);
    el.setAttribute('aria-pressed',String(!!on));
  }
  function applySaved(){
    let saved=null; try{saved=JSON.parse(localStorage.getItem(STORE)||'null')}catch(_){}
    if(!saved)return;
    ['ch','oh'].forEach(id=>{
      if(!Array.isArray(saved[id]))return;
      saved[id].forEach((on,i)=>{
        const el=$(`#drums [data-drum="${id}"][data-step="${i}"]`);
        if(el)setButton(el,on);
      });
    });
  }

  window.addEventListener('click',e=>{
    const el=e.target.closest?.('#drums .drum-step[data-drum="ch"], #drums .drum-step[data-drum="oh"]');
    if(el){
      e.preventDefault();
      e.stopImmediatePropagation();
      setButton(el,!el.classList.contains('on'));
      save();
      return;
    }
    if(e.target.closest?.('#drumRandom,#drumClear')) setTimeout(save,120);
  },true);

  function settle(){[120,360,900,1600].forEach(ms=>setTimeout(applySaved,ms));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settle,{once:true});else settle();
  window.addEventListener('load',settle,{once:true});

  window.__303boxHatGrid={version:'1530',save,applySaved};
})();