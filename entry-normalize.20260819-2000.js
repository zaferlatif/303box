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

  function normalizeSelect(el,fallback){
    if(!el||el.dataset.channelsReady==='1')return;
    const current=Number(el.value);
    const keep=Number.isInteger(current)&&current>=1&&current<=16?current:fallback;
    const validOptions=[...el.options].filter(o=>/^\d+$/.test(String(o.value)));
    if(validOptions.length!==16){
      el.replaceChildren(channelOptions(keep));
    }
    el.value=String(keep);
    el.dataset.channelsReady='1';
  }

  function apply(){
    normalizeSelect(document.querySelector('#midiBassCh'),2);
    normalizeSelect(document.querySelector('#midiRhythmCh'),10);
  }

  apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  window.__303boxEntryNormalize={version:'2000',apply};
})();
