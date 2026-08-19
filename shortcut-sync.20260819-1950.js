(() => {
  'use strict';
  const tr=()=>document.documentElement.lang==='tr';
  function sync(){
    const space=document.querySelector('#shortcutSpace');
    const shift=document.querySelector('#shortcutShiftSpace');
    if(space) space.textContent=tr()?'303 + ritim birlikte çal / durdur':'Play / stop bass + rhythm together';
    if(shift) shift.textContent=tr()?'Yalnız ritmi çal / durdur':'Play / stop rhythm only';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.__303boxShortcutSync={version:'1950',sync};
})();