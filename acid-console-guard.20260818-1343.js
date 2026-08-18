(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const clamp = (v,a,b) => Math.min(b,Math.max(a,v));

  function parts(kind){
    return kind === 'bass'
      ? { input:$('#consoleBass'), button:$('#consoleBassMute') }
      : { input:$('#consoleRhythm'), button:$('#consoleRhythmMute') };
  }

  function renderMute(kind){
    const {input,button}=parts(kind); if(!input||!button)return;
    const muted=(Number(input.value)||0)<=0;
    button.setAttribute('aria-pressed',String(muted));
    if(!muted&&!button.dataset.restore)button.dataset.restore=String(clamp(Number(input.value)||80,1,100));
  }

  function toggleLevelMute(kind){
    const {input,button}=parts(kind); if(!input||!button)return;
    const muted=(Number(input.value)||0)<=0 || button.getAttribute('aria-pressed')==='true';
    if(!muted){
      const current=clamp(Number(input.value)||80,1,100);
      button.dataset.restore=String(current);
      input.value='0';
    }else input.value=String(clamp(Number(button.dataset.restore)||80,1,100));
    input.dispatchEvent(new Event('input',{bubbles:true}));
    renderMute(kind);
  }

  window.addEventListener('click',event=>{
    const play=event.target.closest?.('#acidPlayAll');
    if(play){event.preventDefault();event.stopImmediatePropagation();window.__303boxUnifiedEngine?.toggleAll?.();return;}
    if(event.target.closest?.('#consoleBassMute')){event.preventDefault();event.stopImmediatePropagation();toggleLevelMute('bass');return;}
    if(event.target.closest?.('#consoleRhythmMute')){event.preventDefault();event.stopImmediatePropagation();toggleLevelMute('rhythm');}
  },true);

  const settle=()=>{renderMute('bass');renderMute('rhythm')};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(settle,250),{once:true});else setTimeout(settle,250);
  window.addEventListener('load',()=>setTimeout(settle,800));
})();
