(() => {
  'use strict';

  let busy=false;
  const isTR=()=>document.documentElement.lang==='tr';
  const button=()=>document.querySelector('#midiRecRhythm');
  const readyForT8=()=>{
    const state=window.__303boxMidiRouter?.state;
    const badge=document.querySelector('#midiRouterBadge');
    return !!(state?.enabled&&!state?.blocked&&state?.effective==='t8'&&badge?.classList.contains('ready'));
  };

  function apply(){
    const b=button();if(!b)return;
    const ready=readyForT8();
    const label=busy?(isTR()?'RİTİM PRM…':'RHYTHM PRM…'):(isTR()?'RİTİM → PRM':'RHYTHM → PRM');
    if(b.textContent!==label)b.textContent=label;
    const disabled=busy||!ready;
    if(b.disabled!==disabled)b.disabled=disabled;
    b.dataset.transferMode='t8-prm';
    b.removeAttribute('data-hardware-test');
    b.title=isTR()
      ? 'T-8 ritim patterni harici MIDI REC ile güvenilir biçimde yazılmadığı için bu düğme mevcut ritmi T-8 PRM aktarım formatına yazar/indirir.'
      : 'T-8 rhythm patterns are not reliably written by external MIDI REC, so this button writes/downloads the current rhythm in the T-8 PRM transfer format.';
  }

  async function transfer(){
    const b=button();if(!b||busy||!readyForT8())return;
    const api=window.__303boxT8Prm;
    if(!api){b.textContent=isTR()?'PRM HAZIR DEĞİL':'PRM NOT READY';setTimeout(apply,1200);return}
    busy=true;apply();
    try{
      if(typeof window.showSaveFilePicker==='function'||typeof window.showDirectoryPicker==='function'){
        await api.writeRhythmPrm('RHYTHM_PTN01_01.PRM');
        b.textContent=isTR()?'PRM YAZILDI':'PRM WRITTEN';
      }else{
        api.downloadRhythmPrm('RHYTHM_PTN01_01.PRM');
        b.textContent=isTR()?'PRM İNDİRİLDİ':'PRM DOWNLOADED';
      }
    }catch(err){
      if(err?.name!=='AbortError'){
        console.warn('[303box] T-8 rhythm PRM transfer failed',err);
        b.textContent=isTR()?'PRM BAŞARISIZ':'PRM FAILED';
      }
    }finally{
      setTimeout(()=>{busy=false;apply()},1300);
    }
  }

  function init(){
    apply();
    const root=document.querySelector('#midiRouter');
    if(root)new MutationObserver(apply).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','class']});
    document.addEventListener('303box:languagechange',apply);
    document.addEventListener('303box:ready',apply);
    window.addEventListener('303box:playback-state',apply);
    window.addEventListener('click',event=>{
      if(!event.target?.closest?.('#midiRecRhythm'))return;
      event.preventDefault();event.stopImmediatePropagation();transfer();
    },true);
    window.__303boxT8RhythmTransfer={version:'2840',apply,transfer};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
