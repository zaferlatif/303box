(() => {
  'use strict';
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function clearPattern(){
    const inputs=$$('.note-input');
    const pickers=$$('[data-note-picker],.note-picker-v2,.note-picker');
    inputs.forEach(input=>{
      input.value='';
      input.dataset.baseOctave='0';
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
    });
    pickers.forEach(picker=>{
      if('value' in picker)picker.value='';
      picker.dispatchEvent(new Event('change',{bubbles:true}));
    });
    $$('.octave-cell').forEach(cell=>{cell.textContent='';cell.dataset.value=''});
    $$('.accentSlide-cell').forEach(cell=>{cell.textContent='';cell.dataset.value=''});
    $$('.gate-cell').forEach(cell=>{cell.textContent='-';cell.dataset.value='-'});
    const notes=document.querySelector('#notesArea');
    if(notes){notes.value='';notes.dispatchEvent(new Event('input',{bubbles:true}))}
    try{
      localStorage.removeItem('303-session');
      localStorage.removeItem('303box-session');
    }catch(_){}
    document.dispatchEvent(new CustomEvent('303box:pattern-cleared'));
  }

  function installClear(){
    if(window.__303boxClearInstalled)return;
    window.__303boxClearInstalled=true;
    window.addEventListener('click',event=>{
      if(!event.target?.closest?.('#clearButton'))return;
      event.preventDefault();
      event.stopImmediatePropagation();
      clearPattern();
    },true);
  }

  function apply(){installClear()}
  apply();
  window.__303boxBehaviorFixes={version:'2000',apply,clearPattern};
})();
