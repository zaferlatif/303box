(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const tr=()=>document.documentElement.lang==='tr';
  const say=(en,trText)=>tr()?trText:en;
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  const TD3_PREFIX=[0xF0,0x00,0x20,0x32,0x00,0x01,0x0A];
  const TD3_PRODUCT=[...TD3_PREFIX,0x06,0xF7];
  const TD3_FIRMWARE=[...TD3_PREFIX,0x08,0x00,0xF7];
  const TD3_BACKUP='303box-td3-last-pattern-backup-v2';
  const TD3_PATTERN_BYTES=123;
  const TD3_PATTERN_TIMEOUT=3200;
  const TD3_WRITE_SETTLE=850;
  const TD3_VERIFY_RETRIES=4;
  const TD3_VERIFY_RETRY_DELAY=500;
  const TD3_WRITE_CONFIRM_WINDOW=15000;
  const NOTE={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
  const td3={access:null,input:null,output:null,product:'',firmware:'',verified:false,sysexEnabled:false,busy:false,stateListener:null,pendingWrite:null,pendingTimer:0};

  const samePrefix=a=>TD3_PREFIX.every((v,i)=>a[i]===v);
  const portName=p=>`${p?.manufacturer||''} ${p?.name||''}`.replace(/\s+/g,' ').trim();
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  const isTd3Name=s=>/\btd\s*-?\s*3\b/i.test(String(s||''))&&!/\bmo\b/i.test(String(s||''));
  const portIsConnected=p=>!!p&&p.state==='connected';

  function td3Error(code,cause){const err=new Error(code);err.td3Code=code;if(cause)err.cause=cause;return err}
  function errorText(err){
    const code=err?.td3Code||err?.name||String(err?.message||'unknown');
    const map={
      'permission-denied':['MIDI/SysEx permission was denied.','MIDI/SysEx izni reddedildi.'],
      'sysex-unsupported':['This browser did not grant SysEx access.','Tarayıcı SysEx erişimi vermedi.'],
      'usb-port':['A matching TD-3 USB MIDI input/output pair was not found.','Eşleşen TD-3 USB MIDI giriş/çıkış çifti bulunamadı.'],
      'ambiguous-output':['More than one TD-3 output is connected. Disconnect the extra unit and retry.','Birden fazla TD-3 çıkışı bağlı. Diğer cihazı ayırıp tekrar deneyin.'],
      'ambiguous-input':['More than one TD-3 input is connected. Disconnect the extra unit and retry.','Birden fazla TD-3 girişi bağlı. Diğer cihazı ayırıp tekrar deneyin.'],
      'identity':['The connected device did not identify as a Behringer TD-3. TD-3-MO is intentionally not supported.','Bağlı cihaz Behringer TD-3 olarak doğrulanmadı. TD-3-MO özellikle desteklenmiyor.'],
      'pattern-timeout':['TD-3 did not return the requested pattern in time. Check USB mode/cable and retry.','TD-3 istenen pattern’i zamanında döndürmedi. USB modu/kabloyu kontrol edip tekrar deneyin.'],
      'semantic-readback-mismatch':['Read-back did not match the visible notes, gates, accents and slides. The write is not accepted as verified.','Geri okuma ekrandaki nota, gate, accent ve slide ile eşleşmedi. Yazma doğrulanmış kabul edilmedi.'],
      'pattern-changed':['The visible pattern changed after backup. Start the write again.','Yedekten sonra ekrandaki pattern değişti. Yazmayı yeniden başlatın.'],
      'target-changed':['The TD-3 target changed after backup. Start the write again.','Yedekten sonra TD-3 hedefi değişti. Yazmayı yeniden başlatın.'],
      'port-disconnected':['TD-3 disconnected during the operation.','İşlem sırasında TD-3 bağlantısı kesildi.']
    };
    return (map[code]||[String(code),String(code)])[tr()?1:0];
  }

  function scopeHardware(){
    const dialog=$('#hardwareGuideDialog');if(!dialog)return;
    $$('.hardware-device-card',dialog).forEach(card=>{
      const ids=(card.dataset.device||'').split(/\s+/).filter(Boolean);
      if(ids.includes('t8')){card.dataset.device='t8';return}
      if(ids.includes('td3')){
        card.dataset.device='td3';card.classList.add('primary');
        card.innerHTML=`<div class="hardware-device-title"><h3>Behringer TD-3</h3><small>PRIMARY / BASS</small></div><div class="hardware-capabilities"><div class="hardware-capability"><span>LIVE MIDI</span><strong class="good">Notes, accent velocity, slide overlap</strong></div><div class="hardware-capability"><span>DIRECT SYSEX</span><strong class="warn">Read → backup → write → read-back verify</strong></div><div class="hardware-capability"><span>TRANSPORT</span><strong>Live notes never start the stored sequencer</strong></div><div class="hardware-capability"><span>SLIDE</span><strong>Overlapping note transition; TD-3 Slide Mode must be enabled</strong></div></div>`;
        return;
      }
      card.remove();
    });
    const title=$('#hardwareGuideTitle');if(title)title.innerHTML='<span class="lang-en">T-8 and TD-3 hardware transfer</span><span class="lang-tr">T-8 ve TD-3 donanım aktarımı</span>';
  }

  function injectStyle(){
    if($('#td3DirectStyle'))return;
    const s=document.createElement('style');s.id='td3DirectStyle';s.textContent=`
      .td3-direct-box{margin-top:14px;padding:13px;border:1px solid #5f4f20;border-radius:10px;background:#15130d}.td3-direct-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px}.td3-direct-head strong{color:#ddff37;font:850 .56rem/1 JetBrains Mono,monospace;letter-spacing:.07em}.td3-direct-head small{color:#ffc765;font:800 .43rem/1 JetBrains Mono,monospace;letter-spacing:.055em}.td3-direct-target{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.td3-direct-target label{display:grid;gap:5px;min-width:0;color:#888891;font:800 .42rem/1 JetBrains Mono,monospace;letter-spacing:.055em}.td3-direct-target select{width:100%;min-width:0;height:36px;padding:0 8px;border:1px solid #34343a;border-radius:7px;background:#101013;color:#e5e5e8}.td3-direct-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px}.td3-direct-actions button{min-width:0;min-height:38px;padding:6px 8px;border:1px solid #3b3b42;border-radius:7px;background:#17171b;color:#c9c9ce;font:850 .47rem/1.2 JetBrains Mono,monospace;cursor:pointer}.td3-direct-actions button.primary{border-color:#61731b;background:#192009;color:#ddff37}.td3-direct-actions button.primary.armed{border-color:#ddff37;background:#29340b;box-shadow:0 0 0 2px rgba(221,255,55,.12)}.td3-direct-actions button.danger{border-color:#653833;background:#1d1111;color:#ff8a82}.td3-direct-actions button:disabled{opacity:.38;cursor:not-allowed}.td3-direct-status{min-height:42px;margin:9px 0;padding:9px 10px;border:1px solid #303038;border-radius:7px;background:#101013;color:#b8b8bf;font-size:.57rem;line-height:1.5}.td3-direct-status.good{color:#ddff37}.td3-direct-status.warn{color:#ffc765}.td3-direct-status.bad{color:#ff8179}.td3-direct-warning{margin:8px 0 0;color:#898991;font-size:.55rem;line-height:1.5}
      @media(max-width:560px){.td3-direct-target,.td3-direct-actions{grid-template-columns:1fr}.td3-direct-head{align-items:flex-start;flex-direction:column}.td3-direct-actions button{width:100%}}
    `;document.head.appendChild(s);
  }

  function target(){
    const group=Math.max(0,Math.min(3,Number($('#td3WriteGroup')?.value||0)|0));
    const section=$('#td3WriteSection')?.value==='B'?'B':'A';
    const number=Math.max(1,Math.min(8,Number($('#td3WriteNumber')?.value||1)|0));
    const requestSlot=(section==='B'?8:0)+(number-1);
    return{group,section,number,requestSlot,label:`${['I','II','III','IV'][group]} / ${section}${number}`};
  }
  function validTarget(tg){return !!tg&&Number.isInteger(tg.group)&&tg.group>=0&&tg.group<=3&&Number.isInteger(tg.requestSlot)&&tg.requestSlot>=0&&tg.requestSlot<=15}
  function targetFromAddress(group,requestSlot){if(!validTarget({group,requestSlot}))return null;const section=requestSlot>=8?'B':'A',number=(requestSlot%8)+1;return{group,requestSlot,section,number,label:`${['I','II','III','IV'][group]} / ${section}${number}`}}

  function patternSteps(){
    const notes=$$('#patternSheet .note-input'),oct=$$('#patternSheet .octave-cell'),expr=$$('#patternSheet .accentSlide-cell'),gate=$$('#patternSheet .gate-cell');
    return Array.from({length:16},(_,i)=>({note:notes[i]?.value?.trim().toUpperCase()||'',baseOct:Number(notes[i]?.dataset?.baseOctave||0)?1:0,oct:oct[i]?.textContent.trim().toUpperCase()||'',expr:expr[i]?.textContent.trim().toUpperCase().replace(/\s+/g,'')||'',gate:gate[i]?.textContent.trim()||''}));
  }
  function patternSignature(){return JSON.stringify(patternSteps())}

  function pair(v){v=Math.max(0,Math.min(255,Math.round(v)));return[(v>>4)&0x0F,v&0x0F]}
  function writePair(a,index,v){const p=pair(v);a[index]=p[0];a[index+1]=p[1]}
  function boolPair(a,index,v){a[index]=0;a[index+1]=v?1:0}
  function packByRests(values,rests,off){const packed=[];for(let i=0;i<16;i++)if(!rests[i])packed.push(values[i]);while(packed.length<16)packed.push(off);return packed.slice(0,16)}
  function mask16(flags){const b=[0,0,0,0];flags.forEach((on,step)=>{if(!on)return;let bi,bit;if(step<4){bi=1;bit=step}else if(step<8){bi=0;bit=step-4}else if(step<12){bi=3;bit=step-8}else{bi=2;bit=step-12}b[bi]|=1<<bit});return b}
  function unpackMask16(bytes){const out=Array(16).fill(false);for(let step=0;step<16;step++){let bi,bit;if(step<4){bi=1;bit=step}else if(step<8){bi=0;bit=step-4}else if(step<12){bi=3;bit=step-8}else{bi=2;bit=step-12}out[step]=!!(bytes[bi]&(1<<bit))}return out}
  function td3Pitch(s){
    let p=0x18+(NOTE[s?.note]??0)+(s?.baseOct?12:0);if(s?.oct==='D')p-=12;if(s?.oct==='U')p+=12;p=Math.max(0x0C,Math.min(0x2F,p));return p===0x24?0xA4:p;
  }
  const logicalPitch=v=>v===0xA4?0x24:v;
  function patternSemantics(steps=patternSteps()){
    return Array.from({length:16},(_,i)=>{const s=steps[i]||{},rest=!s.note||s.gate==='-'||!s.gate;if(rest)return{gate:'rest',pitch:null,accent:false,slide:false};return{gate:s.gate==='○'?'tie':'note',pitch:logicalPitch(td3Pitch(s)),accent:String(s.expr||'').includes('A'),slide:String(s.expr||'').includes('S')}});
  }
  function decodePatternSemantics(packet){
    if(!Array.isArray(packet)||packet.length!==TD3_PATTERN_BYTES)throw td3Error('short-pattern');
    const rests=unpackMask16(packet.slice(0x76,0x7A)),triggers=unpackMask16(packet.slice(0x72,0x76));
    const packedPitch=Array.from({length:16},(_,i)=>logicalPitch((packet[0x0C+i*2]<<4)|packet[0x0D+i*2]));
    const packedAccent=Array.from({length:16},(_,i)=>!!packet[0x2D+i*2]);
    const packedSlide=Array.from({length:16},(_,i)=>!!packet[0x4D+i*2]);
    let p=0;return Array.from({length:16},(_,i)=>{if(rests[i])return{gate:'rest',pitch:null,accent:false,slide:false};const value={gate:triggers[i]?'note':'tie',pitch:packedPitch[p],accent:packedAccent[p],slide:packedSlide[p]};p++;return value});
  }
  function samePatternSemantics(a,b){return JSON.stringify(a)===JSON.stringify(b)}
  function encodePattern(backup,steps=patternSteps()){
    if(!Array.isArray(backup)||backup.length!==TD3_PATTERN_BYTES)throw td3Error('short-pattern');
    const out=backup.slice(),triggers=[],rests=[],pitches=Array(16).fill(0x18),accents=Array(16).fill(false),slides=Array(16).fill(false);
    for(let i=0;i<16;i++){
      const s=steps[i]||{},isRest=!s.note||s.gate==='-'||!s.gate,isTie=!isRest&&s.gate==='○';rests[i]=isRest;triggers[i]=!isTie;
      if(!isRest){pitches[i]=td3Pitch(s);accents[i]=String(s.expr||'').includes('A');slides[i]=String(s.expr||'').includes('S')}
    }
    const packedPitches=packByRests(pitches,rests,0x18),packedAccents=packByRests(accents,rests,false),packedSlides=packByRests(slides,rests,false);
    for(let i=0;i<16;i++){writePair(out,0x0C+i*2,packedPitches[i]);boolPair(out,0x2C+i*2,packedAccents[i]);boolPair(out,0x4C+i*2,packedSlides[i])}
    out[0x6E]=1;out[0x6F]=0;const tieMask=mask16(triggers),restMask=mask16(rests);for(let i=0;i<4;i++){out[0x72+i]=tieMask[i];out[0x76+i]=restMask[i]}return out;
  }

  function validPattern(a,tg){
    if(!Array.isArray(a)||a.length!==TD3_PATTERN_BYTES||!validTarget(tg)||!samePrefix(a)||a[7]!==0x78||a[8]!==tg.group||a[9]!==tg.requestSlot||a[122]!==0xF7)return false;
    for(let i=1;i<a.length-1;i++)if(a[i]<0||a[i]>0x7F)return false;return true;
  }
  function comparable(a,b){
    if(!Array.isArray(a)||!Array.isArray(b)||a.length!==TD3_PATTERN_BYTES||b.length!==TD3_PATTERN_BYTES)return false;
    if(a[7]!==b[7]||a[8]!==b[8]||a[9]!==b[9])return false;
    for(const [start,end] of [[0x0C,0x6C],[0x6E,0x70],[0x72,0x7A]])for(let i=start;i<end;i++)if(a[i]!==b[i])return false;return true;
  }

  function findPorts(access){
    const outputs=[...access.outputs.values()].filter(p=>p.state==='connected'&&isTd3Name(portName(p))),inputs=[...access.inputs.values()].filter(p=>p.state==='connected'&&isTd3Name(portName(p)));
    const routerName=window.__303boxMidiRouter?.state?.outputName||'';
    let output=routerName?outputs.find(p=>norm(portName(p))===norm(routerName)):null;
    if(!output&&outputs.length===1)output=outputs[0];if(!output)return{error:outputs.length?'ambiguous-output':'usb-port'};
    let input=inputs.find(p=>norm(portName(p))===norm(portName(output)))||null;
    if(!input&&inputs.length===1)input=inputs[0];if(!input)return{output,error:inputs.length?'ambiguous-input':'usb-port'};return{input,output};
  }
  function transact(message,test,timeout=1500,label='request'){
    return new Promise((resolve,reject)=>{
      const input=td3.input,output=td3.output;if(!portIsConnected(input)||!portIsConnected(output)){reject(td3Error('port-disconnected'));return}
      let timer=0;const done=()=>{clearTimeout(timer);input.removeEventListener('midimessage',onMsg)};
      const onMsg=e=>{const a=[...e.data];try{if(test(a)){done();resolve(a)}}catch(err){done();reject(err)}};
      input.addEventListener('midimessage',onMsg);timer=setTimeout(()=>{done();reject(td3Error(`${label}-timeout`))},timeout);
      try{output.send(message)}catch(cause){done();reject(td3Error('send-failed',cause))}
    });
  }
  function asciiFrom(a,start){return String.fromCharCode(...a.slice(start,-1).filter(v=>v>0&&v<128)).trim()}
  function connectionIsReady(){return td3.verified&&td3.sysexEnabled&&portIsConnected(td3.input)&&portIsConnected(td3.output)&&/^TD-3(?:\s|$)/i.test(td3.product)&&!/-MO/i.test(td3.product)}
  function clearVerification(){td3.verified=false;td3.product='';td3.firmware=''}
  function watchAccess(access){
    if(td3.stateListener)access.removeEventListener?.('statechange',td3.stateListener);
    td3.stateListener=e=>{if((e?.port?.id===td3.input?.id||e?.port?.id===td3.output?.id)&&e.port.state!=='connected'){clearVerification();td3Status(say('TD-3 disconnected. Re-verify USB/SysEx.','TD-3 bağlantısı kesildi. USB/SysEx doğrulamasını yenileyin.'),'bad')}};access.addEventListener?.('statechange',td3.stateListener);
  }
  async function verifyTd3(show=true,tg=target()){
    try{
      const access=await navigator.requestMIDIAccess({sysex:true});if(access?.sysexEnabled!==true)throw td3Error('sysex-unsupported');td3.access=access;td3.sysexEnabled=true;
      const {input,output,error}=findPorts(access);if(error)throw td3Error(error);await Promise.all([input.open(),output.open()]);td3.input=input;td3.output=output;watchAccess(access);
      const prod=await transact(TD3_PRODUCT,a=>samePrefix(a)&&a[7]===0x07,2200,'product');td3.product=asciiFrom(prod,8);
      if(!/^TD-3(?:\s|$)/i.test(td3.product)||/-MO/i.test(td3.product))throw td3Error('identity');
      try{const fw=await transact(TD3_FIRMWARE,a=>samePrefix(a)&&a[7]===0x09,1200,'firmware');td3.firmware=asciiFrom(fw,8)}catch(_){td3.firmware=''}
      const probe=await readPattern(tg,TD3_PATTERN_TIMEOUT);if(!validPattern(probe,tg))throw td3Error('pattern-timeout');td3.verified=true;
      if(show)td3Status(`${td3.product}${td3.firmware?` ${td3.firmware}`:''} — ${tg.label} ${say('read verified. Direct write is armed safely.','okuma doğrulandı. Doğrudan yazma güvenli biçimde hazır.')}`,'good');return true;
    }catch(err){clearVerification();if(show)td3Status(errorText(err),'bad');throw err}
  }
  async function ensureTd3(tg){if(connectionIsReady())return true;clearVerification();return verifyTd3(false,tg)}
  function readPattern(tg,timeout=TD3_PATTERN_TIMEOUT){if(!validTarget(tg))return Promise.reject(td3Error('invalid-target'));return transact([...TD3_PREFIX,0x77,tg.group,tg.requestSlot,0xF7],a=>validPattern(a,tg),timeout,'pattern')}
  async function verifyReadBack(expected,tg){
    let last=null;for(let attempt=0;attempt<TD3_VERIFY_RETRIES;attempt++){
      if(attempt===0)await sleep(TD3_WRITE_SETTLE);else await sleep(TD3_VERIFY_RETRY_DELAY*(attempt+1));
      try{const actual=await readPattern(tg,TD3_PATTERN_TIMEOUT);last=actual;if(comparable(expected,actual)&&samePatternSemantics(decodePatternSemantics(expected),decodePatternSemantics(actual)))return actual}catch(err){last=err}
    }
    if(last instanceof Error)throw last;throw td3Error('semantic-readback-mismatch');
  }

  function saveBackup(bytes,tg){localStorage.setItem(TD3_BACKUP,JSON.stringify({bytes,target:{...tg},product:td3.product,created:Date.now()}))}
  function loadBackup(){try{const x=JSON.parse(localStorage.getItem(TD3_BACKUP)||'null');if(!x||!Array.isArray(x.bytes)||x.bytes.length!==TD3_PATTERN_BYTES)return null;const target=targetFromAddress(Number(x.target?.group),Number(x.target?.requestSlot));return target?{...x,target}:null}catch(_){return null}}
  function td3Status(msg,kind=''){const el=$('#td3DirectStatus');if(el){el.textContent=msg;el.className=`td3-direct-status ${kind}`.trim()}}
  function clearPendingWrite(){if(td3.pendingTimer)clearTimeout(td3.pendingTimer);td3.pendingTimer=0;td3.pendingWrite=null;setWriteButton()}
  function setWriteButton(mode='default',tg=null){const b=$('#td3WritePattern');if(!b)return;b.classList.toggle('armed',mode==='confirm');b.textContent=mode==='confirm'?say(`CONFIRM WRITE ${tg?.label||''}`,`${tg?.label||''} YAZMAYI ONAYLA`):mode==='working'?say('WORKING…','İŞLENİYOR…'):say('BACKUP + WRITE','YEDEKLE + YAZ')}
  function armPendingWrite(packet,tg,semantics){clearPendingWrite();td3.pendingWrite={packet:packet.slice(),semantics:semantics.map(x=>({...x})),tg:{...tg},signature:patternSignature(),product:td3.product,expires:Date.now()+TD3_WRITE_CONFIRM_WINDOW};setWriteButton('confirm',tg);const p=td3.pendingWrite;td3.pendingTimer=setTimeout(()=>{if(td3.pendingWrite!==p)return;clearPendingWrite();td3Status(say('Write confirmation expired. Nothing was written.','Yazma onayı zaman aşımına uğradı. Hiçbir şey yazılmadı.'),'warn')},TD3_WRITE_CONFIRM_WINDOW)}
  function targetChanged(){clearPendingWrite();td3Status(`${target().label} — ${say('target selected. Nothing has been written.','hedef seçildi. Henüz hiçbir şey yazılmadı.')}`,'warn')}
  function setTd3Busy(busy){td3.busy=busy;const box=$('#td3DirectBox');if(box){box.setAttribute('aria-busy',busy?'true':'false');$$('button,select',box).forEach(el=>el.disabled=busy)}if(busy)setWriteButton('working');else if(td3.pendingWrite)setWriteButton('confirm',td3.pendingWrite.tg);else setWriteButton()}
  async function runTd3Operation(operation){
    if(td3.busy){td3Status(say('Another TD-3 operation is still running.','Başka bir TD-3 işlemi hâlâ sürüyor.'),'warn');return false}
    setTd3Busy(true);const release=window.__303boxMidiRouter?.beginExclusive?.('td3-sysex')||(()=>{});try{window.__303boxUnifiedEngine?.stopAll?.();return await operation()}catch(err){td3Status(errorText(err),'bad');return false}finally{release();setTd3Busy(false)}
  }

  async function armTd3(){return runTd3Operation(async()=>{const tg=target();await verifyTd3(false,tg);td3Status(`${td3.product} ${tg.label} — ${say('USB/SysEx and pattern read verified.','USB/SysEx ve pattern okuması doğrulandı.')}`,'good');return true})}
  async function readOnly(){return runTd3Operation(async()=>{const tg=target();await ensureTd3(tg);const bytes=await readPattern(tg);td3Status(`${td3.product} ${tg.label} — ${say(`read OK (${bytes.length} bytes). Nothing was written.`,`okuma tamam (${bytes.length} bayt). Hiçbir şey yazılmadı.`)}`,'good');return true})}
  async function prepareWrite(){
    const tg=target();await ensureTd3(tg);const backup=await readPattern(tg);saveBackup(backup,tg);const intended=patternSemantics(),packet=encodePattern(backup);if(!samePatternSemantics(intended,decodePatternSemantics(packet)))throw td3Error('semantic-readback-mismatch');armPendingWrite(packet,tg,intended);td3Status(`${td3.product} ${tg.label} — ${say('backup saved. Review the target, then press CONFIRM WRITE.','yedek kaydedildi. Hedefi kontrol edip YAZMAYI ONAYLA düğmesine basın.')}`,'warn');return true;
  }
  async function commitPendingWrite(pending){
    if(!pending||Date.now()>pending.expires){clearPendingWrite();throw td3Error('confirmation-expired')}
    if(patternSignature()!==pending.signature){clearPendingWrite();throw td3Error('pattern-changed')}
    const tg=target();if(tg.group!==pending.tg.group||tg.requestSlot!==pending.tg.requestSlot){clearPendingWrite();throw td3Error('target-changed')}
    await ensureTd3(tg);if(td3.product!==pending.product){clearPendingWrite();throw td3Error('identity')}
    td3Status(`${tg.label} — ${say('WRITE sent. Waiting for memory commit, then reading back…','YAZMA gönderildi. Hafıza işlemi beklenip geri okunuyor…')}`,'warn');td3.output.send(pending.packet);const actual=await verifyReadBack(pending.packet,tg);
    if(!samePatternSemantics(pending.semantics,decodePatternSemantics(actual)))throw td3Error('semantic-readback-mismatch');clearPendingWrite();td3Status(`${td3.product} ${tg.label} — ${say('WRITE VERIFIED. Notes, gates, accents and slides match 303box.','YAZMA DOĞRULANDI. Nota, gate, accent ve slide 303box ile eşleşiyor.')}`,'good');return true;
  }
  function writeTd3(){return runTd3Operation(async()=>td3.pendingWrite?commitPendingWrite(td3.pendingWrite):prepareWrite())}
  function restoreTd3(){return runTd3Operation(async()=>{const backup=loadBackup();if(!backup)throw td3Error('no-backup');const tg=backup.target;await ensureTd3(tg);td3.output.send(backup.bytes);await verifyReadBack(backup.bytes,tg);td3Status(`${tg.label} — ${say('backup restored and verified.','yedek geri yüklendi ve doğrulandı.')}`,'good');return true})}

  function injectTd3Writer(){
    const card=$('.hardware-device-card[data-device="td3"]');if(!card||$('#td3DirectBox'))return;
    const box=document.createElement('div');box.id='td3DirectBox';box.className='td3-direct-box';box.innerHTML=`<div class="td3-direct-head"><strong>TD-3 DIRECT WRITE</strong><small>USB / SYSEX / VERIFIED READ-BACK</small></div><div class="td3-direct-target"><label><span>GROUP</span><select id="td3WriteGroup"><option value="0">I</option><option value="1">II</option><option value="2">III</option><option value="3">IV</option></select></label><label><span>SECTION</span><select id="td3WriteSection"><option value="A">A</option><option value="B">B</option></select></label><label><span>PATTERN</span><select id="td3WriteNumber">${Array.from({length:8},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></label></div><p id="td3DirectStatus" class="td3-direct-status" role="status" aria-live="polite" aria-atomic="true"></p><div class="td3-direct-actions"><button id="td3ArmSysex" type="button">VERIFY USB / SYSEX</button><button id="td3WritePattern" class="primary" type="button">BACKUP + WRITE</button><button id="td3RestorePattern" class="danger" type="button">RESTORE LAST BACKUP</button><button id="td3ReadPattern" type="button">TEST READ (NO WRITE)</button></div><p class="td3-direct-warning"><span class="lang-en">Safety flow: stop live MIDI → identify TD-3 → read exact target → save browser backup → confirm write → wait for memory commit → read back and compare. TD-3-MO and other devices are rejected.</span><span class="lang-tr">Güvenlik akışı: canlı MIDI’yi durdur → TD-3 kimliğini doğrula → tam hedefi oku → tarayıcı yedeği al → yazmayı onayla → hafıza işlemini bekle → geri okuyup karşılaştır. TD-3-MO ve diğer cihazlar reddedilir.</span></p>`;
    card.appendChild(box);$('#td3ArmSysex',box)?.addEventListener('click',armTd3);$('#td3ReadPattern',box)?.addEventListener('click',readOnly);$('#td3WritePattern',box)?.addEventListener('click',writeTd3);$('#td3RestorePattern',box)?.addEventListener('click',restoreTd3);$$('select',box).forEach(select=>select.addEventListener('change',targetChanged));targetChanged();
  }
  function openGuide(){const d=$('#hardwareGuideDialog');if(!d)return;scopeHardware();injectTd3Writer();if(typeof d.showModal==='function'&&!d.open)d.showModal();else d.setAttribute('open','')}
  function closeGuide(){const d=$('#hardwareGuideDialog');if(!d)return;if(typeof d.close==='function'&&d.open)d.close();else d.removeAttribute('open')}
  function init(){scopeHardware();injectStyle();injectTd3Writer();$('#midiHardwareGuide')?.addEventListener('click',openGuide);$('#hardwareGuideClose')?.addEventListener('click',closeGuide);document.addEventListener('303box:languagechange',()=>{scopeHardware();injectTd3Writer()});window.__303boxHardwareGuide={version:'2401',open:openGuide,readOnly,writeTd3}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
