(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const isTR=()=>document.documentElement.lang==='tr';
  const say=(en,tr)=>isTR()?tr:en;
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  const RELEASE='20260826-2900';
  const TD3_PREFIX=[0xF0,0x00,0x20,0x32,0x00,0x01,0x0A];
  const TD3_PRODUCT=[...TD3_PREFIX,0x06,0xF7];
  const TD3_FIRMWARE=[...TD3_PREFIX,0x08,0x00,0xF7];
  const TD3_CONFIG=[...TD3_PREFIX,0x75,0xF7];
  const TD3_PATTERN_BYTES=123;
  const TD3_PATTERN_TIMEOUT=3200;
  const TD3_WRITE_SETTLE=900;
  const TD3_READ_RETRIES=4;
  const TD3_WRITE_ATTEMPTS=3;
  const TD3_CONFIRM_MS=15000;
  const BACKUP_KEY='303box-td3-last-pattern-backup-v3';
  const NOTE={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
  const patchedOutputs=new WeakSet();
  const td3={access:null,input:null,output:null,product:'',firmware:'',config:null,verified:false,busy:false,pending:null,pendingTimer:0};

  const samePrefix=a=>TD3_PREFIX.every((v,i)=>a[i]===v);
  const portName=p=>`${p?.manufacturer||''} ${p?.name||''}`.replace(/\s+/g,' ').trim();
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  const isTd3Name=s=>/\btd\s*-?\s*3(?:\s*-?\s*mo)?\b/i.test(String(s||''));
  const isTd3Product=s=>/^TD-3(?:-MO)?(?:\s|$)/i.test(String(s||''));
  const connected=p=>!!p&&p.state==='connected';

  function patchMidiOutput(output){
    if(!output||patchedOutputs.has(output)||typeof output.send!=='function')return;
    const nativeSend=output.send.bind(output);
    try{
      output.send=function(data,timestamp){
        let message=Array.from(data||[]);
        const st=window.__303boxMidiRouter?.state;
        const status=(message[0]||0)&0xF0,channel=((message[0]||0)&0x0F)+1;
        if(st&&(st.effective==='t8'||st.effective==='td3')&&(status===0x80||status===0x90)&&channel===st.bass&&message.length>=3){
          message[1]=clamp((Number(message[1])||0)-24,0,127);
          if(st.effective==='t8'&&status===0x90&&message[2]>0)message[2]=message[2]>=120?127:64;
        }
        return timestamp==null?nativeSend(message):nativeSend(message,timestamp);
      };
      patchedOutputs.add(output);
    }catch(_){}
  }

  function installMidiRegisterFix(){
    if(window.__303boxMidiRegisterFixInstalled)return;
    window.__303boxMidiRegisterFixInstalled=true;
    const proto=Object.getPrototypeOf(navigator),nativeRequest=proto?.requestMIDIAccess;
    if(typeof nativeRequest!=='function')return;
    const wrapped=function(options){
      return nativeRequest.call(this,options).then(access=>{
        access?.outputs?.forEach?.(patchMidiOutput);
        access?.addEventListener?.('statechange',event=>{if(event?.port?.type==='output')patchMidiOutput(event.port)});
        return access;
      });
    };
    try{Object.defineProperty(proto,'requestMIDIAccess',{value:wrapped,configurable:true,writable:true})}
    catch(_){try{navigator.requestMIDIAccess=wrapped.bind(navigator)}catch(__){}}
  }

  function pair(v){v=clamp(Math.round(v),0,255);return[(v>>4)&0x0F,v&0x0F]}
  function writePair(a,index,v){const p=pair(v);a[index]=p[0];a[index+1]=p[1]}
  function boolPair(a,index,v){a[index]=0;a[index+1]=v?1:0}
  function readPair(a,index){return ((a[index]||0)<<4)|(a[index+1]||0)}
  function mask16(flags){const b=[0,0,0,0];flags.forEach((on,step)=>{if(!on)return;let bi,bit;if(step<4){bi=1;bit=step}else if(step<8){bi=0;bit=step-4}else if(step<12){bi=3;bit=step-8}else{bi=2;bit=step-12}b[bi]|=1<<bit});return b}
  function unpackMask16(bytes){const out=Array(16).fill(false);for(let step=0;step<16;step++){let bi,bit;if(step<4){bi=1;bit=step}else if(step<8){bi=0;bit=step-4}else if(step<12){bi=3;bit=step-8}else{bi=2;bit=step-12}out[step]=!!((bytes[bi]||0)&(1<<bit))}return out}

  function patternSteps(){
    const notes=$$('#patternSheet .note-input'),oct=$$('#patternSheet .octave-cell'),expr=$$('#patternSheet .accentSlide-cell'),gate=$$('#patternSheet .gate-cell');
    return Array.from({length:16},(_,i)=>({note:notes[i]?.value?.trim().toUpperCase()||'',baseOct:Number(notes[i]?.dataset?.baseOctave||0)?1:0,oct:oct[i]?.textContent.trim().toUpperCase()||'',expr:expr[i]?.textContent.trim().toUpperCase().replace(/\s+/g,'')||'',gate:gate[i]?.textContent.trim()||''}));
  }
  function td3Pitch(step){
    let p=0x18+(NOTE[step?.note]??0)+(step?.baseOct?12:0);if(step?.oct==='D')p-=12;if(step?.oct==='U')p+=12;
    return clamp(p,0x0C,0x2F)&0x7F;
  }
  function semantics(steps=patternSteps()){
    return Array.from({length:16},(_,i)=>{const s=steps[i]||{},rest=!s.note||s.gate==='-'||!s.gate;if(rest)return{gate:'rest',pitch:null,accent:false,slide:false};return{gate:s.gate==='○'?'tie':'note',pitch:td3Pitch(s),accent:String(s.expr||'').includes('A'),slide:String(s.expr||'').includes('S')}});
  }
  function decodeSemantics(packet){
    const rests=unpackMask16(packet.slice(0x76,0x7A)),normal=unpackMask16(packet.slice(0x72,0x76));
    return Array.from({length:16},(_,i)=>rests[i]?{gate:'rest',pitch:null,accent:false,slide:false}:{gate:normal[i]?'note':'tie',pitch:readPair(packet,0x0C+i*2)&0x7F,accent:!!packet[0x2D+i*2],slide:!!packet[0x4D+i*2]});
  }
  const sameSemantics=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

  function encodePattern(backup,steps=patternSteps()){
    if(!Array.isArray(backup)||backup.length!==TD3_PATTERN_BYTES)throw error('short-pattern');
    const out=backup.slice(),normal=[],rests=[];
    for(let i=0;i<16;i++){
      const s=steps[i]||{},rest=!s.note||s.gate==='-'||!s.gate,tie=!rest&&s.gate==='○';
      rests[i]=rest;normal[i]=!tie;
      writePair(out,0x0C+i*2,rest?0x18:td3Pitch(s));
      boolPair(out,0x2C+i*2,!rest&&String(s.expr||'').includes('A'));
      boolPair(out,0x4C+i*2,!rest&&String(s.expr||'').includes('S'));
    }
    out[0x6E]=1;out[0x6F]=0;
    const normalMask=mask16(normal),restMask=mask16(rests);
    for(let i=0;i<4;i++){out[0x72+i]=normalMask[i];out[0x76+i]=restMask[i]}
    return out;
  }

  function target(){
    const group=clamp(Number($('#td3WriteGroup')?.value||0)|0,0,3),section=$('#td3WriteSection')?.value==='B'?'B':'A',number=clamp(Number($('#td3WriteNumber')?.value||1)|0,1,8),requestSlot=(section==='B'?8:0)+(number-1);
    return{group,section,number,requestSlot,label:`${['I','II','III','IV'][group]} / ${section}${number}`};
  }
  function validPattern(a,tg){
    if(!Array.isArray(a)||a.length!==TD3_PATTERN_BYTES||!samePrefix(a)||a[7]!==0x78||a[8]!==tg.group||a[9]!==tg.requestSlot||a[122]!==0xF7)return false;
    for(let i=1;i<a.length-1;i++)if(a[i]<0||a[i]>0x7F)return false;return true;
  }
  function comparable(a,b){
    if(!Array.isArray(a)||!Array.isArray(b)||a.length!==TD3_PATTERN_BYTES||b.length!==TD3_PATTERN_BYTES)return false;
    for(const [start,end] of [[0x0C,0x6C],[0x6E,0x70],[0x72,0x7A]])for(let i=start;i<end;i++)if(a[i]!==b[i])return false;
    return a[8]===b[8]&&a[9]===b[9];
  }

  function error(code,cause){const e=new Error(code);e.code=code;if(cause)e.cause=cause;return e}
  function errorText(err){
    const code=err?.code||err?.name||String(err?.message||'unknown');
    const map={
      'sysex':['USB SysEx access was not granted.','USB SysEx erişimi verilmedi.'],
      'port':['TD-3 / TD-3-MO USB MIDI input/output pair was not found.','TD-3 / TD-3-MO USB MIDI giriş/çıkış çifti bulunamadı.'],
      'identity':['Connected hardware did not identify as TD-3 / TD-3-MO.','Bağlı donanım TD-3 / TD-3-MO olarak doğrulanmadı.'],
      'pattern-timeout':['Pattern read timed out. Use USB MIDI, then retry.','Pattern okuması zaman aşımına uğradı. USB MIDI kullanıp tekrar deneyin.'],
      'verify':['Read-back did not match notes, accents, slides and timing. Nothing is accepted as verified.','Geri okuma nota, accent, slide ve zamanlamayla eşleşmedi. Yazma doğrulanmış sayılmadı.'],
      'changed':['Pattern or target changed after backup. Start again.','Yedekten sonra pattern veya hedef değişti. Baştan başlayın.'],
      'disconnected':['TD-3 / TD-3-MO disconnected during transfer.','Aktarım sırasında TD-3 / TD-3-MO bağlantısı kesildi.']
    };
    return (map[code]||[String(code),String(code)])[isTR()?1:0];
  }

  function transact(message,test,timeout=1800,label='request'){
    return new Promise((resolve,reject)=>{
      if(!connected(td3.input)||!connected(td3.output)){reject(error('disconnected'));return}
      let timer=0;
      const done=()=>{clearTimeout(timer);td3.input.removeEventListener('midimessage',onMessage)};
      const onMessage=event=>{const data=[...event.data];try{if(test(data)){done();resolve(data)}}catch(e){done();reject(e)}};
      td3.input.addEventListener('midimessage',onMessage);
      timer=setTimeout(()=>{done();reject(error(label==='pattern'?'pattern-timeout':label))},timeout);
      try{td3.output.send(message)}catch(e){done();reject(error('send',e))}
    });
  }
  function ascii(a,start){return String.fromCharCode(...a.slice(start,-1).filter(v=>v>0&&v<128)).replace(/\0/g,'').trim()}
  function firmware(a){return a?.length>11?`${Number(a[9])}.${Number(a[10])}.${Number(a[11])}`:''}
  function decodeConfig(a){return{midiOut:(a[8]??0)+1,midiIn:(a[9]??0)+1,transpose:(a[10]??12)-12,multiTrigger:!!a[13],clockSource:a[16]??0,accentThreshold:a[17]??96}}
  function firmwareNumber(s){const [a=0,b=0,c=0]=String(s||'').split('.').map(Number);return a*10000+b*100+c}
  function diagnostics(){
    const c=td3.config;if(!c)return'';
    const parts=[`MIDI IN TRANSPOSE ${c.transpose>0?'+':''}${c.transpose}`,`ACCENT > ${c.accentThreshold}`,c.multiTrigger?'MULTI TRIGGER ON':'SLIDE MODE'];
    if(td3.firmware&&firmwareNumber(td3.firmware)<10206)parts.push('FW < 1.2.6: LIVE SLIDE UPDATE NEEDED');
    return parts.join(' · ');
  }
  function configWarning(){const c=td3.config;return !!(c&&(c.transpose!==0||c.multiTrigger)||(td3.firmware&&firmwareNumber(td3.firmware)<10206))}

  function findPorts(access){
    const outputs=[...access.outputs.values()].filter(p=>p.state==='connected'&&isTd3Name(portName(p))),inputs=[...access.inputs.values()].filter(p=>p.state==='connected'&&isTd3Name(portName(p)));
    const routerName=window.__303boxMidiRouter?.state?.outputName||'';
    let output=routerName?outputs.find(p=>norm(portName(p))===norm(routerName)):null;if(!output&&outputs.length===1)output=outputs[0];if(!output)return null;
    let input=inputs.find(p=>norm(portName(p))===norm(portName(output)))||null;if(!input&&inputs.length===1)input=inputs[0];return input?{input,output}:null;
  }
  function readPattern(tg){return transact([...TD3_PREFIX,0x77,tg.group,tg.requestSlot,0xF7],a=>validPattern(a,tg),TD3_PATTERN_TIMEOUT,'pattern')}

  async function verify(tg=target(),show=true){
    try{
      const access=await navigator.requestMIDIAccess({sysex:true});if(access?.sysexEnabled!==true)throw error('sysex');td3.access=access;
      const ports=findPorts(access);if(!ports)throw error('port');td3.input=ports.input;td3.output=ports.output;await Promise.all([td3.input.open(),td3.output.open()]);
      const prod=await transact(TD3_PRODUCT,a=>samePrefix(a)&&a[7]===0x07,2200,'identity');td3.product=ascii(prod,8);if(!isTd3Product(td3.product))throw error('identity');
      try{const fw=await transact(TD3_FIRMWARE,a=>samePrefix(a)&&a[7]===0x09,1400,'firmware');td3.firmware=firmware(fw)}catch(_){td3.firmware=''}
      try{const cfg=await transact(TD3_CONFIG,a=>samePrefix(a)&&a[7]===0x76,1400,'config');td3.config=decodeConfig(cfg)}catch(_){td3.config=null}
      const probe=await readPattern(tg);if(!validPattern(probe,tg))throw error('pattern-timeout');td3.verified=true;
      if(show){const extra=diagnostics();status(`${td3.product}${td3.firmware?` ${td3.firmware}`:''} — ${tg.label} — ${say('READ VERIFIED','OKUMA DOĞRULANDI')}${extra?` · ${extra}`:''}`,configWarning()?'warn':'good')}
      return true;
    }catch(e){td3.verified=false;if(show)status(errorText(e),'bad');throw e}
  }
  async function ensure(tg){if(td3.verified&&connected(td3.input)&&connected(td3.output)&&isTd3Product(td3.product))return true;return verify(tg,false)}

  async function verifyReadBack(expected,tg){
    let last=null;
    for(let i=0;i<TD3_READ_RETRIES;i++){
      await sleep(i===0?TD3_WRITE_SETTLE:400*(i+1));
      try{const actual=await readPattern(tg);last=actual;if(comparable(expected,actual)&&sameSemantics(decodeSemantics(expected),decodeSemantics(actual)))return actual}catch(e){last=e}
    }
    throw last instanceof Error?last:error('verify');
  }
  async function writeAndVerify(packet,tg){
    let last=null;
    for(let attempt=1;attempt<=TD3_WRITE_ATTEMPTS;attempt++){
      status(`${tg.label} — ${say(`WRITE ${attempt}/${TD3_WRITE_ATTEMPTS} sent; reading back…`,`YAZMA ${attempt}/${TD3_WRITE_ATTEMPTS} gönderildi; geri okunuyor…`)}`,'warn');
      td3.output.send(packet);
      try{return await verifyReadBack(packet,tg)}catch(e){last=e;if(attempt<TD3_WRITE_ATTEMPTS)await sleep(350*attempt)}
    }
    throw last||error('verify');
  }

  function status(text,kind=''){const el=$('#td3DirectStatus');if(el){el.textContent=text;el.className=`td3-direct-status ${kind}`.trim()}}
  function signature(){return JSON.stringify(patternSteps())}
  function saveBackup(bytes,tg){localStorage.setItem(BACKUP_KEY,JSON.stringify({bytes,target:tg,product:td3.product,created:Date.now()}))}
  function loadBackup(){try{return JSON.parse(localStorage.getItem(BACKUP_KEY)||'null')}catch(_){return null}}
  function setBusy(on){td3.busy=on;const box=$('#td3DirectBox');if(box){box.setAttribute('aria-busy',String(on));$$('button,select',box).forEach(el=>el.disabled=on)}}
  function clearPending(){if(td3.pendingTimer)clearTimeout(td3.pendingTimer);td3.pendingTimer=0;td3.pending=null;const b=$('#td3WritePattern');if(b){b.classList.remove('armed');b.textContent=say('BACKUP + WRITE','YEDEKLE + YAZ')}}
  function armPending(packet,tg){clearPending();td3.pending={packet:packet.slice(),tg:{...tg},signature:signature(),product:td3.product,expires:Date.now()+TD3_CONFIRM_MS};const b=$('#td3WritePattern');if(b){b.classList.add('armed');b.textContent=say(`CONFIRM WRITE ${tg.label}`,`${tg.label} YAZMAYI ONAYLA`)}const p=td3.pending;td3.pendingTimer=setTimeout(()=>{if(td3.pending===p){clearPending();status(say('Write confirmation expired.','Yazma onayı zaman aşımına uğradı.'),'warn')}},TD3_CONFIRM_MS)}

  async function operation(fn){
    if(td3.busy)return;setBusy(true);const release=window.__303boxMidiRouter?.beginExclusive?.('td3-fidelity')||(()=>{});
    try{window.__303boxUnifiedEngine?.stopAll?.();await fn()}catch(e){status(errorText(e),'bad')}finally{release();setBusy(false);if(td3.pending){const b=$('#td3WritePattern');if(b){b.disabled=false;b.classList.add('armed');b.textContent=say(`CONFIRM WRITE ${td3.pending.tg.label}`,`${td3.pending.tg.label} YAZMAYI ONAYLA`)}}}
  }
  async function prepareWrite(){const tg=target();await ensure(tg);const backup=await readPattern(tg);saveBackup(backup,tg);const packet=encodePattern(backup),wanted=semantics();if(!sameSemantics(wanted,decodeSemantics(packet)))throw error('verify');armPending(packet,tg);status(`${td3.product} ${tg.label} — ${say('backup saved. Confirm target and write.','yedek alındı. Hedefi kontrol edip yazmayı onaylayın.')} · ${diagnostics()}`,'warn')}
  async function commitWrite(){const p=td3.pending;if(!p||Date.now()>p.expires)throw error('changed');if(p.signature!==signature()||p.product!==td3.product)throw error('changed');const tg=target();if(tg.group!==p.tg.group||tg.requestSlot!==p.tg.requestSlot)throw error('changed');await ensure(tg);const actual=await writeAndVerify(p.packet,tg);if(!sameSemantics(semantics(),decodeSemantics(actual)))throw error('verify');clearPending();status(`${td3.product} ${tg.label} — ${say('WRITE VERIFIED: notes, accents, slides and timing match.','YAZMA DOĞRULANDI: nota, accent, slide ve zamanlama eşleşiyor.')} · ${diagnostics()}`,configWarning()?'warn':'good')}
  async function restore(){const b=loadBackup();if(!b?.bytes||!b?.target)throw error('changed');const tg=b.target;await ensure(tg);await writeAndVerify(b.bytes,tg);clearPending();status(`${td3.product} ${tg.label} — ${say('backup restored and verified.','yedek geri yüklendi ve doğrulandı.')}`,'good')}

  function setText(el,value){if(el&&el.textContent!==value)el.textContent=value}
  function setHtml(el,value){if(el&&el.innerHTML!==value)el.innerHTML=value}
  function patchLabels(){
    const profile=$('#midiDeviceProfile');if(profile){const auto=[...profile.options].find(o=>o.value==='auto'),td=[...profile.options].find(o=>o.value==='td3');setText(auto,'AUTO — T-8 / TD-3 / TD-3-MO');setText(td,'Behringer TD-3 / TD-3-MO')}
    const card=$('.hardware-device-card[data-device="td3"]');if(card)setText(card.querySelector('.hardware-device-title h3'),'Behringer TD-3 / TD-3-MO');
    setHtml($('#hardwareGuideTitle'),'<span class="lang-en">T-8 and TD-3 / TD-3-MO hardware transfer</span><span class="lang-tr">T-8 ve TD-3 / TD-3-MO donanım aktarımı</span>');
    setText($('#td3DirectBox .td3-direct-head strong'),'TD-3 / TD-3-MO DIRECT WRITE');
    setHtml($('#td3DirectBox .td3-direct-warning'),'<span class="lang-en">USB/SysEx is verified by product identity + exact pattern read-back. TD-3 and TD-3-MO share the pattern protocol. For T-8 → TD-3 live chains keep TD-3 MIDI IN TRANSPOSE at 0, Multi Trigger off/Slide, and check the accent threshold.</span><span class="lang-tr">USB/SysEx ürün kimliği + birebir pattern geri okumasıyla doğrulanır. TD-3 ve TD-3-MO aynı pattern protokolünü kullanır. T-8 → TD-3 canlı zincirinde TD-3 MIDI IN TRANSPOSE değerini 0, Multi Trigger ayarını off/Slide tutun ve accent threshold değerini kontrol edin.</span>');
  }
  const schedulePatch=()=>setTimeout(patchLabels,0);

  function installCapture(){
    window.addEventListener('click',event=>{
      const b=event.target?.closest?.('#td3ArmSysex,#td3ReadPattern,#td3WritePattern,#td3RestorePattern');if(!b)return;
      event.preventDefault();event.stopImmediatePropagation();
      if(b.id==='td3ArmSysex')operation(()=>verify(target(),true));
      else if(b.id==='td3ReadPattern')operation(async()=>{const tg=target();await ensure(tg);const bytes=await readPattern(tg);status(`${td3.product} ${tg.label} — ${say(`read OK (${bytes.length} bytes).`,`okuma tamam (${bytes.length} bayt).`)} · ${diagnostics()}`,configWarning()?'warn':'good')});
      else if(b.id==='td3WritePattern')operation(()=>td3.pending?commitWrite():prepareWrite());
      else if(b.id==='td3RestorePattern')operation(restore);
    },true);
  }

  function init(){
    installMidiRegisterFix();installCapture();patchLabels();
    document.addEventListener('303box:languagechange',schedulePatch);
    document.addEventListener('303box:ready',schedulePatch);
    document.addEventListener('303box:content-refresh',schedulePatch);
    document.addEventListener('click',event=>{if(event.target?.closest?.('#midiHardwareGuide,[data-hardware-guide-open]'))schedulePatch()},true);
    document.addEventListener('change',event=>{if(event.target?.closest?.('#midiRouter'))schedulePatch()},true);
    window.__303boxHardwareFidelity={version:RELEASE,encodePattern,decodeSemantics,verify,diagnostics};
  }

  init();
})();
