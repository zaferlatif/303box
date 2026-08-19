(() => {
  'use strict';

  function channelOptions(selected){
    const frag=document.createDocumentFragment();
    for(let i=1;i<=16;i++){
      const o=document.createElement('option');
      o.value=String(i);
      o.textContent=String(i);
      o.selected=i===selected;
      frag.appendChild(o);
    }
    return frag;
  }

  function validChannel(value,fallback){
    const n=Number(value);
    return Number.isInteger(n)&&n>=1&&n<=16?n:fallback;
  }

  function normalizeSelect(el,fallback){
    if(!el||el.dataset.channelsReady==='1')return;
    const current=validChannel(el.value,0);
    const keep=current||validChannel(fallback,1);
    const validOptions=[...el.options].filter(o=>/^\d+$/.test(String(o.value)));
    if(validOptions.length!==16)el.replaceChildren(channelOptions(keep));
    el.value=String(keep);
    el.dataset.channelsReady='1';
  }

  function apply(){
    let router=null;
    try{router=window.__303boxMidiRouter?.state||null}catch(_){}
    normalizeSelect(document.querySelector('#midiBassCh'),router?.bass||2);
    normalizeSelect(document.querySelector('#midiRhythmCh'),router?.rhythm||10);
  }

  apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  window.__303boxEntryNormalize={version:'2000',apply};
})();
