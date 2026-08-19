(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function selectedDevice(){
    const v=$('#midiDeviceProfile')?.value||'auto';
    if(v!=='auto')return v;
    const state=window.__303boxMidiRouter?.state;
    return state?.effective||'t8';
  }

  function markCurrent(){
    const id=selectedDevice();
    $$('.hardware-device-card').forEach(card=>card.classList.toggle('current',card.dataset.device===id));
  }

  function openGuide(){
    const d=$('#hardwareGuideDialog');
    if(!d)return;
    markCurrent();
    if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
  }

  function closeGuide(){
    const d=$('#hardwareGuideDialog');
    if(!d)return;
    if(typeof d.close==='function')d.close();else d.removeAttribute('open');
  }

  function init(){
    $('#midiHardwareGuide')?.addEventListener('click',openGuide);
    $('#hardwareGuideClose')?.addEventListener('click',closeGuide);
    $('#hardwareGuideDialog')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeGuide()});
    $('#midiDeviceProfile')?.addEventListener('change',markCurrent);
    window.__303boxHardwareGuide={version:'0815',open:openGuide,close:closeGuide};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
