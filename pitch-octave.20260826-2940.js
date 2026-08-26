(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const isTR=()=>document.documentElement.lang==='tr';
  const STORE='303box-base-octave-v1';
  const NOTE_PC={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
  const OCTAVES=[1,2,3,4,5];
  let baseOctave=2,normalizing=false,t8RecBusy=false,absoluteSendDepth=0;
  let pitchContext=null,bassVoiceExpected=false,markNextBassOsc=false;
  const bassOscillators=new WeakSet(),patchedOutputs=new WeakSet(),noteMap=new Map();

  function detectInitialBase(){
    const saved=Number(localStorage.getItem(STORE));if(OCTAVES.includes(saved))return saved;
    return $$('#patternSheet .note-input').some(x=>x.value?.trim())?4:2;
  }
  function persistBase(){try{localStorage.setItem(STORE,String(baseOctave))}catch(_){}}
  function noteData(step){
    const input=$$('#patternSheet .note-input')[step],cell=$$('#patternSheet .octave-cell')[step],expr=$$('#patternSheet .accentSlide-cell')[step],gate=$$('#patternSheet .gate-cell')[step];
    const note=input?.value?.trim().toUpperCase()||'',oct=Number(cell?.textContent?.trim());
    return{note,oct:Number.isInteger(oct)?oct:baseOctave,expr:expr?.textContent?.trim().toUpperCase()||'',gate:gate?.textContent?.trim()||''};
  }
  const playable=x=>!!x?.note&&x.gate!=='-';
  const connects=(a,b)=>playable(a)&&playable(b)&&(a.gate==='○'||a.expr.includes('S'));
  function midiFor(step){const x=typeof step==='number'?noteData(step):step,pc=NOTE_PC[x?.note];if(pc==null)return null;return clamp((Number(x.oct)+1)*12+pc,0,127)}
  function tune(){const v=Number($('#tuneKnobControl')?.getAttribute('aria-valuenow'));return clamp(Number.isFinite(v)?v:Number(localStorage.getItem('303box-tune-semitones-v1'))||0,-12,12)}
  function frequencyFor(step){const m=midiFor(step);return m==null?0:440*Math.pow(2,((m+tune())-69)/12)}

  function setText(el,value){if(el&&el.textContent!==value)el.textContent=value}
  function setAttr(el,name,value){if(el&&el.getAttribute(name)!==String(value))el.setAttribute(name,String(value))}
  function normalizePickers(){
    $$('#patternSheet .note-input').forEach((input,i)=>{
      if(input.dataset.baseOctave!=='0')input.dataset.baseOctave='0';
      const sibling=input.nextElementSibling,picker=sibling?.matches?.('.note-picker-v2,.note-picker,[data-note-picker]')?sibling:$(`[data-note-picker="${i}"]`);
      if(picker?.options){[...picker.options].filter(o=>o.value==='C+').forEach(o=>o.remove());if(picker.value!==input.value)picker.value=input.value||''}
    });
  }
  function legacyToAbsolute(text,input){
    const n=Number(text);if(Number.isInteger(n)&&n>=1&&n<=5)return n;
    let oct=baseOctave;if(text==='D')oct--;else if(text==='U')oct++;if(Number(input?.dataset?.baseOctave||0))oct++;
    return clamp(oct,1,5);
  }
  function refreshTitles(){
    $$('#patternSheet .octave-cell').forEach((cell,i)=>{const x=noteData(i),m=midiFor(x),value=x.note?`${x.note}${x.oct} · MIDI ${m}`:`${isTR()?'Oktav':'Octave'} ${x.oct}`;if(cell.title!==value)cell.title=value});
  }
  function normalizeCells(){
    if(normalizing)return false;const cells=$$('#patternSheet .octave-cell'),inputs=$$('#patternSheet .note-input');if(cells.length!==16||inputs.length!==16)return false;
    normalizing=true;
    try{
      cells.forEach((cell,i)=>{const value=legacyToAbsolute(cell.textContent.trim().toUpperCase(),inputs[i]),text=String(value),values=JSON.stringify(OCTAVES.map(String));setText(cell,text);if(cell.dataset.value!==text)cell.dataset.value=text;if(cell.dataset.values!==values)cell.dataset.values=values;setAttr(cell,'aria-label',`${isTR()?'Oktav':'Octave'} ${i+1}: ${value}`);if(inputs[i].dataset.baseOctave!=='0')inputs[i].dataset.baseOctave='0'});
      normalizePickers();refreshTitles();
    }finally{normalizing=false}
    return true;
  }

  function shiftPattern(next){
    next=clamp(Number(next)||baseOctave,1,5);const delta=next-baseOctave;baseOctave=next;persistBase();
    if(delta)$$('#patternSheet .octave-cell').forEach(cell=>{const n=Number(cell.textContent),value=String(clamp((Number.isFinite(n)?n:baseOctave-delta)+delta,1,5));setText(cell,value)});
    normalizeCells();renderGlobal();document.dispatchEvent(new CustomEvent('303box:pitchchange',{detail:{baseOctave}}));
  }
  function renderGlobal(){
    const select=$('#baseOctaveSelect');if(select&&select.value!==String(baseOctave))select.value=String(baseOctave);
    const row=$('#patternPitchControls');if(row){setText(row.querySelector('strong'),isTR()?'TEMEL OKTAV':'BASE OCTAVE');setText(row.querySelector('small'),isTR()?'Her step OCTAVE satırından ayrıca ayarlanır.':'Each step can override it in the OCTAVE row.')}
    setText($('#patternSheet [data-i18n="octave"]'),isTR()?'OKTAV':'OCTAVE');
  }
  function mountGlobal(){
    const host=$('.pattern-control-panel')||$('.pattern-card-wrap')?.parentElement;if(!host)return false;
    let row=$('#patternPitchControls');if(!row){row=document.createElement('div');row.id='patternPitchControls';row.className='pattern-pitch-controls';row.innerHTML=`<strong>BASE OCTAVE</strong><label><span>OCT</span><select id="baseOctaveSelect">${OCTAVES.map(v=>`<option value="${v}">${v}</option>`).join('')}</select></label><small></small>`;host.prepend(row);row.querySelector('select')?.addEventListener('change',e=>shiftPattern(e.target.value))}
    renderGlobal();return true;
  }
  function installStyle(){
    if($('#pitchOctaveStyle2940'))return;const style=document.createElement('style');style.id='pitchOctaveStyle2940';style.textContent=`
      #patternPitchControls{display:grid;grid-template-columns:auto 104px minmax(0,1fr);gap:10px;align-items:center;padding:10px 12px;margin:0 0 8px;border:1px solid #34363d;border-radius:9px;background:#15171b;box-sizing:border-box}#patternPitchControls strong{color:#ddff37;font:850 .5rem/1 'JetBrains Mono',monospace;letter-spacing:.08em}#patternPitchControls label{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:7px;color:#8f929a;font:800 .42rem/1 'JetBrains Mono',monospace;letter-spacing:.06em}#patternPitchControls select{width:100%;height:32px;padding:0 28px 0 10px;border:1px solid #444750;border-radius:7px;background:#1c1e23;color:#f1f1f3;font:850 .58rem/1 'JetBrains Mono',monospace}#patternPitchControls small{min-width:0;color:#858891;font:.54rem/1.35 'JetBrains Mono',monospace}.octave-cell{font-weight:900!important;color:#e9e9ec!important}.octave-cell::before{content:'O';margin-right:2px;color:#70747d;font-size:.68em}@media(max-width:620px){#patternPitchControls{grid-template-columns:1fr 92px}#patternPitchControls small{grid-column:1/-1}}
    `;document.head.appendChild(style);
  }

  function installAudioPitchBridge(){
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;let proto=AC.prototype;
    while(proto&&!Object.prototype.hasOwnProperty.call(proto,'createOscillator'))proto=Object.getPrototypeOf(proto);if(!proto||proto.__303boxPitchCreatePatched)return;
    const nativeCreate=proto.createOscillator;Object.defineProperty(proto,'__303boxPitchCreatePatched',{value:true,configurable:true});
    proto.createOscillator=function(){
      const osc=nativeCreate.call(this);if(markNextBassOsc){markNextBassOsc=false;bassOscillators.add(osc);const p=osc.frequency,nSet=p.setValueAtTime.bind(p),nRamp=p.exponentialRampToValueAtTime.bind(p);p.setValueAtTime=function(value,time){if(bassOscillators.has(osc)&&pitchContext){const step=pitchContext.incomingSlide?pitchContext.previous:pitchContext.step,value2=frequencyFor(step);return nSet(value2||value,time)}return nSet(value,time)};p.exponentialRampToValueAtTime=function(value,time){if(bassOscillators.has(osc)&&pitchContext){const value2=frequencyFor(pitchContext.step);return nRamp(value2||value,time)}return nRamp(value,time)}}return osc;
    };
    window.addEventListener('303box:playback-step',event=>{
      const d=event.detail||{},step=((Number(d.step)%16)+16)%16;if(!d.bassOn){bassVoiceExpected=false;pitchContext=null;markNextBassOsc=false;return}
      const current=noteData(step),previous=noteData((step+15)%16),next=noteData((step+1)%16),incoming=bassVoiceExpected&&connects(previous,current);
      pitchContext={step,previous:(step+15)%16,incomingSlide:incoming&&previous.expr.includes('S')};markNextBassOsc=playable(current)&&!incoming;bassVoiceExpected=playable(current)&&connects(current,next);
    });
    ['303box:playback-stop','303box:playback-resync'].forEach(type=>window.addEventListener(type,()=>{bassVoiceExpected=false;markNextBassOsc=false;pitchContext=null}));
  }

  function patchOutput(output){
    if(!output||patchedOutputs.has(output)||typeof output.send!=='function')return;const nativeSend=output.send.bind(output);
    try{output.send=function(data,timestamp){
      const msg=Array.from(data||[]);if(!absoluteSendDepth){const st=window.__303boxMidiRouter?.state,status=(msg[0]||0)&0xF0,ch=((msg[0]||0)&15)+1;
        if(st&&ch===st.bass&&(status===0x80||status===0x90)&&msg.length>=3){
          const key=`${ch}:${msg[1]}`;
          if(status===0x90&&msg[2]>0&&pitchContext){const mapped=midiFor(pitchContext.step);if(mapped!=null){const token=Symbol();noteMap.set(key,{mapped,token});msg[1]=mapped}}
          else if(status===0x80||msg[2]===0){const current=noteMap.get(key);if(current){msg[1]=current.mapped;const token=current.token,delay=Math.max(0,(Number(timestamp)||performance.now())-performance.now()+20);setTimeout(()=>{if(noteMap.get(key)?.token===token)noteMap.delete(key)},delay)}}
        }
      }
      return timestamp==null?nativeSend(msg):nativeSend(msg,timestamp);
    };patchedOutputs.add(output)}catch(_){}
  }
  function installMidiPitchBridge(){
    if(window.__303boxAbsoluteMidiPitchInstalled)return;window.__303boxAbsoluteMidiPitchInstalled=true;
    const proto=Object.getPrototypeOf(navigator),native=proto?.requestMIDIAccess;if(typeof native!=='function')return;
    const wrapped=function(options){return native.call(this,options).then(access=>{access?.outputs?.forEach?.(patchOutput);access?.addEventListener?.('statechange',e=>{if(e?.port?.type==='output')patchOutput(e.port)});return access})};
    try{Object.defineProperty(proto,'requestMIDIAccess',{value:wrapped,configurable:true,writable:true})}catch(_){try{navigator.requestMIDIAccess=wrapped.bind(navigator)}catch(__){}}
  }

  function schedule(output,msg,at){try{output.send(msg,Math.max(performance.now(),at))}catch(_){}}
  async function runT8BassRec(button){
    if(t8RecBusy)return;const state=window.__303boxMidiRouter?.state,output=state?.access?.outputs?.get?.(state.outputId);if(!state?.enabled||state?.blocked||state?.effective!=='t8'||!output||output.state!=='connected')return;
    t8RecBusy=true;button.disabled=true;const status=$('#midiRouterStatus'),old=button.textContent;button.textContent=isTR()?'BASS KAYIT…':'BASS REC…';if(status)status.textContent=isTR()?'T-8 bass kaydı: mutlak oktavlar gönderiliyor…':'T-8 bass REC: sending absolute octaves…';
    const bpm=clamp(Number($('[data-knob-id="bpm"]')?.getAttribute('aria-valuenow'))||140,50,250),d=60000/bpm/4,now=performance.now(),lock=now+120,start=lock+2*d,ch=clamp(Number(state.bass)||2,1,16);
    absoluteSendDepth++;
    try{
      for(let i=0;i<2;i++)for(let c=0;c<6;c++)schedule(output,[0xF8],lock+i*d+c*d/6);schedule(output,[0xFA],start-12);
      for(let s=0;s<16;s++){
        const at=start+s*d,x=noteData(s),n=midiFor(x);for(let c=0;c<6;c++)schedule(output,[0xF8],at+c*d/6);if(n==null||!playable(x))continue;
        const leg=x.gate==='○'||x.expr.includes('S'),vel=x.expr.includes('A')?127:64;schedule(output,[0x90+ch-1,n,vel],at+10);schedule(output,[0x80+ch-1,n,0],at+(leg?d*1.10:d*.68));
      }
    }finally{absoluteSendDepth--}
    const end=start+16*d;setTimeout(()=>{try{output.send([0xFC]);output.send([0xB0+ch-1,123,0])}catch(_){}t8RecBusy=false;button.disabled=false;button.textContent=old||'BASS → REC';if(status)status.textContent=isTR()?'Bass REC bitti. T-8 patternini kontrol edip WRITE yap.':'Bass REC finished. Check the T-8 pattern, then WRITE on the device.'},Math.max(300,end-performance.now()+180));
  }
  function installT8RecCapture(){window.addEventListener('click',event=>{const b=event.target?.closest?.('#midiRecBass');if(!b)return;event.preventDefault();event.stopImmediatePropagation();runT8BassRec(b)},true)}

  function settle(){installStyle();mountGlobal();normalizeCells();renderGlobal();refreshTitles()}
  function init(){
    baseOctave=detectInitialBase();persistBase();installAudioPitchBridge();installMidiPitchBridge();installT8RecCapture();settle();
    window.addEventListener('click',e=>{if(e.target?.closest?.('#generateButton,#clearButton'))setTimeout(()=>{normalizeCells();refreshTitles()},0)},true);
    document.addEventListener('change',e=>{if(e.target?.matches?.('.note-picker-v2,[data-note-picker]'))setTimeout(refreshTitles,0)},true);
    document.addEventListener('303box:languagechange',()=>{renderGlobal();normalizeCells()});document.addEventListener('303box:ready',settle);document.addEventListener('303box:content-refresh',settle);
    window.__303boxPitchModel={version:'20260826-2940',midiForStep:midiFor,frequencyForStep:frequencyFor,get baseOctave(){return baseOctave},setBaseOctave:shiftPattern};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();