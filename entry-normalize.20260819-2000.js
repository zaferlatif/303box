(() => {
  'use strict';
  function channelOptions(selected){
    const frag=document.createDocumentFragment();
    for(let i=1;i<=16;i++){const o=document.createElement('option');o.value=String(i);o.textContent=String(i);o.selected=i===selected;frag.appendChild(o)}
    return frag;
  }
  function apply(){
    const bass=document.querySelector('#midiBassCh'),rhythm=document.querySelector('#midiRhythmCh');
    if(bass){bass.replaceChildren(channelOptions(2));bass.value='2'}
    if(rhythm){rhythm.replaceChildren(channelOptions(10));rhythm.value='10'}
  }
  apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  window.__303boxEntryNormalize={version:'2000',apply};
})();
