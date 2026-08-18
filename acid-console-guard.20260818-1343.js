(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const clamp = (v,a,b) => Math.min(b,Math.max(a,v));

  function toggleLevelMute(kind){
    const input = $(kind === 'bass' ? '#consoleBass' : '#consoleRhythm');
    const button = $(kind === 'bass' ? '#consoleBassMute' : '#consoleRhythmMute');
    if(!input || !button) return;
    const muted = button.getAttribute('aria-pressed') === 'true';
    if(!muted){
      const current = clamp(Number(input.value)||0,0,100);
      if(current > 0) button.dataset.restore = String(current);
      input.value = '0';
      button.setAttribute('aria-pressed','true');
    }else{
      input.value = String(clamp(Number(button.dataset.restore)||80,1,100));
      button.setAttribute('aria-pressed','false');
    }
    input.dispatchEvent(new Event('input',{bubbles:true}));
  }

  window.addEventListener('click', event => {
    const play = event.target.closest?.('#acidPlayAll');
    if(play){
      event.preventDefault();
      event.stopImmediatePropagation();
      window.__303boxUnifiedEngine?.toggleAll?.();
      return;
    }
    const bassMute = event.target.closest?.('#consoleBassMute');
    if(bassMute){
      event.preventDefault();
      event.stopImmediatePropagation();
      toggleLevelMute('bass');
      return;
    }
    const rhythmMute = event.target.closest?.('#consoleRhythmMute');
    if(rhythmMute){
      event.preventDefault();
      event.stopImmediatePropagation();
      toggleLevelMute('rhythm');
    }
  }, true);
})();
