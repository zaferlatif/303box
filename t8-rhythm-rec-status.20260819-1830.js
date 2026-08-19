(() => {
  'use strict';
  const apply=()=>{
    const b=document.querySelector('#midiRecRhythm');if(!b)return;
    const tr=document.documentElement.lang==='tr';
    const text=tr?'RİTİM REC — N/A':'RHYTHM REC — N/A';
    if(b.textContent!==text)b.textContent=text;
    if(!b.disabled)b.disabled=true;
    b.dataset.hardwareTest='0-of-16';
    b.title=tr?'T-8 gerçek-zaman ritim REC, gelen MIDI davul notalarını pattern’e yazmıyor. PRM restore yolu araştırılıyor.':'T-8 real-time rhythm REC does not write incoming MIDI drum notes into the pattern. PRM restore path is being developed.';
  };
  const init=()=>{apply();const root=document.querySelector('#midiRouter');if(root)new MutationObserver(apply).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});new MutationObserver(apply).observe(document.documentElement,{attributes:true,attributeFilter:['lang']})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
