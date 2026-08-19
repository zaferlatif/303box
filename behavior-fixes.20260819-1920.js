(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const isTR=()=>document.documentElement.lang==='tr';

  function stopBassIfNeeded(){
    const play=$('#playButton');
    if(play?.getAttribute('aria-pressed')==='true') play.click();
  }

  function blankPicker(picker){
    if(!picker)return;
    if(picker.tagName==='SELECT'){
      if(![...picker.options].some(o=>o.value==='')){
        const opt=document.createElement('option');opt.value='';opt.textContent='—';picker.insertBefore(opt,picker.firstChild);
      }
      picker.value='';
      if(picker.value!=='')picker.selectedIndex=-1;
      picker.dispatchEvent(new Event('change',{bubbles:true}));
    }else{
      picker.value='';picker.dispatchEvent(new Event('input',{bubbles:true}));
    }
  }

  function persistBlankPattern(){
    const blank=Array.from({length:16},()=>({note:'',octave:'',accentSlide:'',gate:''}));
    try{
      const raw=localStorage.getItem('303box-session');
      const data=raw?JSON.parse(raw):{};
      data.pattern=blank;data.notes='';
      localStorage.setItem('303box-session',JSON.stringify(data));
      localStorage.removeItem('303-session');
    }catch(_){}
  }

  function clearBass(){
    stopBassIfNeeded();
    const notes=$$('.note-input');
    notes.forEach((input,i)=>{
      input.value='';input.dataset.baseOctave='0';input.dispatchEvent(new Event('input',{bubbles:true}));
      blankPicker(document.querySelector(`[data-note-picker="${i}"]`)||$$('.note-picker-v2')[i]||$$('.note-picker')[i]);
    });
    $$('.octave-cell,.accentSlide-cell,.gate-cell').forEach(el=>{el.textContent=''});
    const notesArea=$('#notesArea');if(notesArea){notesArea.value='';notesArea.dispatchEvent(new Event('input',{bubbles:true}))}
    $$('[data-playing="true"]').forEach(el=>el.removeAttribute('data-playing'));
    persistBlankPattern();
    window.dispatchEvent(new CustomEvent('303box:bass-cleared'));
    const toast=$('#toast');if(toast){toast.textContent=isTR()?'Pattern temizlendi.':'Pattern cleared.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1600)}
    setTimeout(()=>{
      notes.forEach((input,i)=>{input.value='';blankPicker(document.querySelector(`[data-note-picker="${i}"]`)||$$('.note-picker-v2')[i]||$$('.note-picker')[i])});
      $$('.octave-cell,.accentSlide-cell,.gate-cell').forEach(el=>{el.textContent=''});
      persistBlankPattern();
    },40);
  }

  function normalizeMidiHeader(){
    const head=$('#midiRouter .midi-compact-head');if(!head)return;
    const title=head.querySelector('strong'),guide=$('#midiHardwareGuide'),badge=$('#midiRouterBadge');
    if(title&&guide&&badge)head.append(title,guide,badge);
  }

  function normalizeRecRow(){
    const row=$('#midiRecAssist');if(!row)return;
    const title=$('#midiRecTitle');if(title&&row.firstElementChild!==title)row.prepend(title);
  }

  function apply(){normalizeMidiHeader();normalizeRecRow()}

  document.addEventListener('click',e=>{
    if(!e.target.closest?.('#clearButton'))return;
    e.preventDefault();e.stopImmediatePropagation();clearBass();
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  window.addEventListener('load',()=>setTimeout(apply,120),{once:true});
  new MutationObserver(apply).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.__303boxBehaviorFixes={version:'1920',clearBass,apply};
})();