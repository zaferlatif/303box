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
    $$('.hardware-device-card').forEach(card=>{
      const ids=(card.dataset.device||'').split(/\s+/).filter(Boolean);
      card.classList.toggle('current',ids.includes(id));
    });
  }

  function setCopy(selector,en,tr){
    const root=$(selector);if(!root)return;
    const a=$('.lang-en',root),b=$('.lang-tr',root);
    if(a)a.textContent=en;if(b)b.textContent=tr;
  }

  function refineCapabilityCopy(){
    setCopy('[data-device="td3 td3mo"] .hardware-capability:nth-child(5) strong',
      'Device capability: MIDI-controllable filter on TD-3-MO; not mapped by 303box yet',
      'Cihaz yeteneği: TD-3-MO MIDI kontrollü filtre sunar; 303box henüz bunu eşlemiyor');
    setCopy('[data-device="volcabass"] .hardware-capability:first-child strong',
      '303box now: notes + velocity + clock. Device also documents synthesis CCs for future mapping',
      '303box bugün: nota + velocity + clock. Cihaz ayrıca ileride eşlenebilecek synth CC’leri belgeliyor');
    setCopy('[data-device="volcanubass"] .hardware-capability:first-child strong',
      '303box now: notes + velocity + clock. Device also documents parameter CCs for future mapping',
      '303box bugün: nota + velocity + clock. Cihaz ayrıca ileride eşlenebilecek parametre CC’leri belgeliyor');
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
    refineCapabilityCopy();
    $('#midiHardwareGuide')?.addEventListener('click',openGuide);
    $('#hardwareGuideClose')?.addEventListener('click',closeGuide);
    $('#hardwareGuideDialog')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeGuide()});
    $('#midiDeviceProfile')?.addEventListener('change',markCurrent);
    window.__303boxHardwareGuide={version:'0815',open:openGuide,close:closeGuide};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
