(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  function init(){
    const picks = $$('.note-picker');
    const sources = $$('.note-input');
    const octaves = $$('.octave-cell');
    picks.forEach((select, i) => {
      const last = select.options[select.options.length - 1];
      if (!last) return;
      last.textContent = 'C';
      let topSelected = false;
      select.addEventListener('change', () => {
        const isTop = select.selectedIndex === select.options.length - 1;
        if (isTop) {
          topSelected = true;
          if (octaves[i]) octaves[i].textContent = 'U';
          if (sources[i]) { sources[i].value = 'C'; sources[i].dispatchEvent(new Event('input', {bubbles:true})); }
        } else if (topSelected && select.value === 'C') {
          topSelected = false;
          if (octaves[i]?.textContent.trim() === 'U') octaves[i].textContent = '';
          if (sources[i]) sources[i].dispatchEvent(new Event('input', {bubbles:true}));
        }
      });
      const follow = () => {
        if (topSelected && octaves[i]?.textContent.trim() !== 'U') {
          topSelected = false;
          const firstC = [...select.options].findIndex(o => o.value === 'C');
          if (firstC >= 0) select.selectedIndex = firstC;
        }
        requestAnimationFrame(follow);
      };
      requestAnimationFrame(follow);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0), {once:true});
  else setTimeout(init, 0);
})();
