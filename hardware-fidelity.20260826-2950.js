(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const isTR=()=>document.documentElement.lang==='tr';
  const say=(en,tr)=>isTR()?tr:en;
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>resolve()));

  const RELEASE='20260826-2950';
  const FAMILY='TD-3 / TD-3-MO';
  const TD3_PREFIX=[0xF0,0x00,0x20,0x32,0x00,0x01,0x0A];
  const TD3_PRODUCT=[...TD3_PREFIX,0x06,0xF7];
  const TD3_FIRMWARE=[...TD3_PREFIX,0x08,0x00,0xF7];
  const TD3_CONFIG=[...TD3_PREFIX,0x75,0xF7];
  const TD3_PATTERN_BYTES=123;
  const TD3_PATTERN_TIMEOUT=2300;
  const TD3_WRITE_SETTLE=850;
  const TD3_READ_RETRIES=2;
  const TD3_WRITE_ATTEMPTS=2;
  const TD3_CONFIRM_MS=20000;
  const BACKUP_KEY='303box-td3-last-pattern-backup-v5';
  const NOTE={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
  const td3={access:null,input:null,output:null,product:'',firmware:'',config:null,verified:false,busy:false,pending:null,pendingTimer:0,op:0,labelObserver:null};

  const samePrefix=a=>TD3_PREFIX.every((v,i)=>a[i]===v);
  const portName=p=>`${p?.manufacturer||''} ${p?.name||''}`.replace(/\s+/g,' ').trim();
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  const isTd3Name=s=>/\btd\s*-?\s*3(?:\s*-?\s*mo)?\b/i.test(String(s||''));
  const isTd3Product=s=>/^TD-3(?:-MO)?(?:\s|$)/i.test(String(s||''));
  const connected=p=>!!p&&p.state==='connected';

  function error(code,cause){const e=new Error(code);e.code=code;if(cause)e.cause=cause;return e}
  function withTimeout(promise,ms,code){
    let timer=0;
    return Promise.race([
      Promise.resolve(promise).finally(()=>clearTimeout(timer)),
      new Promise((_,reject)=>{timer=setTimeout(()=>reject(error(code)),ms)})
    ]);
  }
  function errorText(err){
    const code=err?.code||err?.name||String(err?.message||'unknown');
    const map={
      sysex:[`${FAMILY} USB SysEx permission was not granted.`,`${FAMILY} USB SysEx izni verilmedi.`],
      permission:['USB/SysEx permission did not complete. Retry and accept the browser permission prompt.','USB/SysEx izni tamamlanmadı. Tekrar deneyip tarayıcı izin penceresini onaylayın.'],
      port:[`${FAMILY} USB MIDI input/output pair was not found.`,`${FAMILY} USB MIDI giriş/çıkış çifti bulunamadı.`],
      open:[`${FAMILY} USB MIDI port did not open in time. Reconnect USB and retry.`,`${FAMILY} USB MIDI portu zamanında açılamadı. USB bağlantısını yenileyip tekrar deneyin.`],
      identity:[`Connected hardware did not identify as ${FAMILY}.`,`Bağlı donanım ${FAMILY} olarak doğrulanmadı.`],
      'pattern-timeout':['Pattern read timed out. Keep the device connected by USB and retry.','Pattern okuması zaman aşımına uğradı. Cihaz USB bağlıyken tekrar deneyin.'],
      verify:['Read-back did not match notes, accents, slides and timing.','Geri okuma nota, accent, slide ve zamanlamayla eşleşmedi.'],
      changed:['Pattern or target changed after backup. Start again.','Yedekten sonra pattern veya hedef değişti. Baştan başlayın.'],
      disconnected:[`${FAMILY} disconnected during transfer.`,`Aktarım sırasında ${FAMILY} bağlantısı kesildi.`],
      'operation-timeout':['The hardware operation timed out and was safely released. Retry once; if it repeats, reconnect USB.','Donanım işlemi zaman aşımına uğradı ve güvenli biçimde serbest bırakıldı. Bir kez daha deneyin; tekrarlarsa USB bağlantısını yenileyin.']
    };
    return (map[code]||[String(code),String(code)])[isTR()?1:0];
  }

  function target(){
    const group=clamp(Number($('#td3WriteGroup')?.value||0)|0,0,3);
    const section=$('#td3WriteSection')?.value==='B'?'B':'A';
    const number=clamp(Number($('#td3WriteNumber')?.value||1)|0,1,8);
    const requestSlot=(section==='B'?8:0)+(number-1);
    return{group,section,number,requestSlot,label:`${['I','II','III','IV'][group]} / ${section}${number}`};
  }
  function validPattern(a,tg){
    if(!Array.isArray(a)||a.length!==TD3_PATTERN_BYTES||!samePrefix(a)||a[7]!==0x78||a[8]!==tg.group||a[9]!==tg.requestSlot||a[122]!==0xF7)return false;
    for(let i=1;i<a.length-1;i++)if(a[i]<0||a[i]>0x7F)return false;
    return true;
  }
  function pair(v){v=clamp(Math.round(v),0,255);return[(v>>4)&0x0F,v&0x0F]}
  function writePair(a,index,v){const p=pair(v);a[index]=p[0];a[index+1]=p[1]}
  function boolPair(a,index,v){a[index]=0;a[index+1]=v?1:0}
  function readPair(a,index){return((a[index]||0)<<4)|(a[index+1]||0)}
  function mask16(flags){
    const b=[0,0,0,0];
    flags.forEach((on,step)=>{
      if(!on)return;
      let bi,bit;
      if(step<4){bi=1;bit=step}
      else if(step<8){bi=0;bit=step-4}
      else if(step<12){bi=3;bit=step-8}
      else{bi=2;bit=step-12}
      b[bi]|=1<<bit;
    });
    return b;
  }
  function unpackMask16(bytes){
    const out=Array(16).fill(false);
    for(let step=0;step<16;step++){
      let bi,bit;
      if(step<4){bi=1;bit=step}
      else if(step<8){bi=0;bit=step-4}
      else if(step<12){bi=3;bit=step-8}
      else{bi=2;bit=step-12}
      out[step]=!!((bytes[bi]||0)&(1<<bit));
    }
    return out;
  }

  function patternSteps(){
    const notes=$$('#patternSheet .note-input'),oct=$$('#patternSheet .octave-cell'),expr=$$('#patternSheet .accentSlide-cell'),gate=$$('#patternSheet .gate-cell');
    return Array.from({length:16},(_,i)=>({
      note:notes[i]?.value?.trim().toUpperCase()||'',
      baseOct:Number(notes[i]?.dataset?.baseOctave||0)?1:0,
      oct:oct[i]?.textContent.trim().toUpperCase()||'',
      expr:expr[i]?.textContent.trim().toUpperCase().replace(/\s+/g,'')||'',
      gate:gate[i]?.textContent.trim()||''
    }));
  }
  function td3Pitch(step){
    const absolute=Number(step?.oct);
    if(Number.isInteger(absolute)&&absolute>=0&&absolute<=8)return clamp(0x18+(NOTE[step?.note]??0)+(absolute-2)*12,0x0C,0x2F)&0x7F;
    let p=0x18+(NOTE[step?.note]??0)+(step?.baseOct?12:0);
    if(step?.oct==='D')p-=12;
    if(step?.oct==='U')p+=12;
    return clamp(p,0x0C,0x2F)&0x7F;
  }
  function semantics(steps=patternSteps()){
    return Array.from({length:16},(_,i)=>{
      const s=steps[i]||{},rest=!s.note||s.gate==='-'||!s.gate;
      if(rest)return{gate:'rest',pitch:null,accent:false,slide:false};
      return{gate:s.gate==='○'?'tie':'note',pitch:td3Pitch(s),accent:String(s.expr||'').includes('A'),slide:String(s.expr||'').includes('S')};
    });
  }
  function decodeSemantics(packet){
    const rests=unpackMask16(packet.slice(0x76,0x7A)),normal=unpackMask16(packet.slice(0x72,0x76));
    return Array.from({length:16},(_,i)=>rests[i]
      ?{gate:'rest',pitch:null,accent:false,slide:false}
      :{gate:normal[i]?'note':'tie',pitch:readPair(packet,0x0C+i*2)&0x7F,accent:!!packet[0x2D+i*2],slide:!!packet[0x4D+i*2]}
    );
  }
  const sameSemantics=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  function encodePattern(backup,steps=patternSteps()){
    if(!Array.isArray(backup)||backup.length!==TD3_PATTERN_BYTES)throw error('verify');
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
  function comparable(a,b){
    if(!Array.isArray(a)||!Array.isArray(b)||a.length!==TD3_PATTERN_BYTES||b.length!==TD3_PATTERN_BYTES)return false;
    for(const[start,end]of[[0x0C,0x6C],[0x6E,0x70],[0x72,0x7A]])for(let i=start;i<end;i++)if(a[i]!==b[i])return false;
    return a[8]===b[8]&&a[9]===b[9];
  }

  function status(text,kind=''){
    const el=$('#td3DirectStatus');
    if(el){el.textContent=text;el.className=`td3-direct-status ${kind}`.trim()}
  }
  function setBusy(on,activeId=''){
    td3.busy=on;
    const box=$('#td3DirectBox');
    if(!box)return;
    box.setAttribute('aria-busy',String(on));
    $$('#td3DirectBox .td3-direct-actions button').forEach(el=>{
      el.disabled=on;
      el.dataset.busy=on&&el.id===activeId?'true':'false';
    });
    $$('#td3DirectBox .td3-direct-target select').forEach(el=>el.disabled=on);
  }
  function findPorts(access){
    const outputs=[...access.outputs.values()].filter(p=>p.state==='connected'&&isTd3Name(portName(p)));
    const inputs=[...access.inputs.values()].filter(p=>p.state==='connected'&&isTd3Name(portName(p)));
    const routerName=window.__303boxMidiRouter?.state?.outputName||'';
    let output=routerName?outputs.find(p=>norm(portName(p))===norm(routerName)):null;
    if(!output&&outputs.length===1)output=outputs[0];
    if(!output)return null;
    let input=inputs.find(p=>norm(portName(p))===norm(portName(output)))||null;
    if(!input&&inputs.length===1)input=inputs[0];
    return input?{input,output}:null;
  }
  function transact(message,test,timeout=1600,label='request'){
    return new Promise((resolve,reject)=>{
      if(!connected(td3.input)||!connected(td3.output)){reject(error('disconnected'));return}
      let timer=0;
      const done=()=>{clearTimeout(timer);td3.input.removeEventListener('midimessage',onMessage)};
      const onMessage=event=>{
        const data=[...event.data];
        try{if(test(data)){done();resolve(data)}}catch(e){done();reject(e)}
      };
      td3.input.addEventListener('midimessage',onMessage);
      timer=setTimeout(()=>{done();reject(error(label==='pattern'?'pattern-timeout':label))},timeout);
      try{td3.output.send(message)}catch(e){done();reject(error('disconnected',e))}
    });
  }
  function ascii(a,start){return String.fromCharCode(...a.slice(start,-1).filter(v=>v>0&&v<128)).replace(/\0/g,'').trim()}
  function firmware(a){return a?.length>11?`${Number(a[9])}.${Number(a[10])}.${Number(a[11])}`:''}
  function decodeConfig(a){return{midiOut:(a[8]??0)+1,midiIn:(a[9]??0)+1,transpose:(a[10]??12)-12,multiTrigger:!!a[13],clockSource:a[16]??0,accentThreshold:a[17]??96}}
  function routerChannel(){return Number(window.__303boxMidiRouter?.state?.bass)||0}
  function diagnostics(){
    const parts=[],c=td3.config,ch=routerChannel();
    if(ch)parts.push(`303BOX CH ${ch}`);
    if(c)parts.push(`DEVICE IN ${c.midiIn}`,`TRANSPOSE ${c.transpose>0?'+':''}${c.transpose}`,`ACCENT > ${c.accentThreshold}`,c.multiTrigger?'MULTI TRIGGER ON':'SLIDE MODE');
    return parts.join(' · ');
  }
  function configWarning(){
    const c=td3.config,ch=routerChannel();
    return!!(c&&(c.transpose!==0||c.multiTrigger||(ch&&c.midiIn!==ch)));
  }
  function detectedLabel(){
    const actual=td3.product?` · ${td3.product}${td3.firmware?` ${td3.firmware}`:''}`:'';
    return `${FAMILY}${actual}`;
  }
  function readPattern(tg){
    return transact([...TD3_PREFIX,0x77,tg.group,tg.requestSlot,0xF7],a=>validPattern(a,tg),TD3_PATTERN_TIMEOUT,'pattern');
  }

  async function refreshOptionalDiagnostics(op){
    const jobs=[
      transact(TD3_FIRMWARE,a=>samePrefix(a)&&a[7]===0x09,1100,'firmware').then(x=>{td3.firmware=firmware(x)}).catch(()=>{}),
      transact(TD3_CONFIG,a=>samePrefix(a)&&a[7]===0x76,1100,'config').then(x=>{td3.config=decodeConfig(x)}).catch(()=>{})
    ];
    await Promise.allSettled(jobs);
    if(op!==td3.op||!td3.verified)return;
    const extra=diagnostics();
    status(`${detectedLabel()} — ${say('USB/SYSEX VERIFIED','USB/SYSEX DOĞRULANDI')}${extra?` · ${extra}`:''}`,configWarning()?'warn':'good');
  }
  async function verify(tg=target(),show=true){
    const op=++td3.op;
    td3.verified=false;td3.firmware='';td3.config=null;
    if(show){status(say(`VERIFYING ${FAMILY} USB / SYSEX… browser remains usable.`,`${FAMILY} USB / SYSEX DOĞRULANIYOR… site kullanılabilir kalır.`),'warn');await nextFrame()}
    try{
      const access=await withTimeout(navigator.requestMIDIAccess({sysex:true}),12000,'permission');
      if(access?.sysexEnabled!==true)throw error('sysex');
      td3.access=access;
      const ports=findPorts(access);
      if(!ports)throw error('port');
      td3.input=ports.input;td3.output=ports.output;
      await Promise.all([withTimeout(td3.input.open(),1300,'open'),withTimeout(td3.output.open(),1300,'open')]);
      if(op!==td3.op)throw error('changed');
      const prod=await transact(TD3_PRODUCT,a=>samePrefix(a)&&a[7]===0x07,1600,'identity');
      td3.product=ascii(prod,8);
      if(!isTd3Product(td3.product))throw error('identity');
      if(show){status(`${FAMILY} — ${say('identity OK; reading target…','kimlik tamam; hedef okunuyor…')}`,'warn');await nextFrame()}
      const probe=await readPattern(tg);
      if(!validPattern(probe,tg))throw error('pattern-timeout');
      td3.verified=true;
      if(show)status(`${detectedLabel()} — ${tg.label} — ${say('USB/SYSEX VERIFIED','USB/SYSEX DOĞRULANDI')}`,'good');
      void refreshOptionalDiagnostics(op);
      return true;
    }catch(e){
      if(op===td3.op)td3.verified=false;
      if(show)status(errorText(e),'bad');
      throw e;
    }
  }
  async function ensure(tg){
    if(td3.verified&&connected(td3.input)&&connected(td3.output)&&isTd3Product(td3.product))return true;
    return verify(tg,false);
  }

  async function verifyReadBack(expected,tg){
    let last=null;
    for(let i=0;i<TD3_READ_RETRIES;i++){
      status(`${FAMILY} ${tg.label} — ${say(`memory settle ${i+1}/${TD3_READ_RETRIES}; reading back…`,`hafıza bekleniyor ${i+1}/${TD3_READ_RETRIES}; geri okunuyor…`)}`,'warn');
      await nextFrame();
      await sleep(i===0?TD3_WRITE_SETTLE:450);
      try{
        const actual=await readPattern(tg);
        last=actual;
        if(comparable(expected,actual)&&sameSemantics(decodeSemantics(expected),decodeSemantics(actual)))return actual;
      }catch(e){last=e}
    }
    throw last instanceof Error?last:error('verify');
  }
  async function writeAndVerify(packet,tg){
    let last=null;
    for(let attempt=1;attempt<=TD3_WRITE_ATTEMPTS;attempt++){
      status(`${FAMILY} ${tg.label} — ${say(`WRITE ${attempt}/${TD3_WRITE_ATTEMPTS} sent; waiting for commit…`,`YAZMA ${attempt}/${TD3_WRITE_ATTEMPTS} gönderildi; hafıza işlemi bekleniyor…`)}`,'warn');
      await nextFrame();
      td3.output.send(packet);
      try{return await verifyReadBack(packet,tg)}
      catch(e){
        last=e;
        if(attempt<TD3_WRITE_ATTEMPTS){status(`${FAMILY} ${tg.label} — ${say('read-back did not match; retrying once…','geri okuma eşleşmedi; bir kez daha deneniyor…')}`,'warn');await nextFrame();await sleep(350)}
      }
    }
    throw last||error('verify');
  }

  function signature(){return JSON.stringify(patternSteps())}
  function saveBackup(bytes,tg){localStorage.setItem(BACKUP_KEY,JSON.stringify({bytes,target:tg,product:td3.product,created:Date.now()}))}
  function loadBackup(){try{return JSON.parse(localStorage.getItem(BACKUP_KEY)||'null')}catch(_){return null}}
  function clearPending(){
    if(td3.pendingTimer)clearTimeout(td3.pendingTimer);
    td3.pendingTimer=0;td3.pending=null;
    const b=$('#td3WritePattern');
    if(b){b.classList.remove('armed');b.textContent=say('BACKUP + WRITE','YEDEKLE + YAZ')}
  }
  function armPending(packet,tg){
    clearPending();
    td3.pending={packet:packet.slice(),tg:{...tg},signature:signature(),product:td3.product,expires:Date.now()+TD3_CONFIRM_MS};
    const b=$('#td3WritePattern');
    if(b){b.classList.add('armed');b.textContent=say(`CONFIRM WRITE ${tg.label}`,`${tg.label} YAZMAYI ONAYLA`)}
    const p=td3.pending;
    td3.pendingTimer=setTimeout(()=>{
      if(td3.pending===p){
        clearPending();
        status(say('Write confirmation expired. Nothing was written.','Yazma onayı zaman aşımına uğradı. Hiçbir şey yazılmadı.'),'warn');
      }
    },TD3_CONFIRM_MS);
  }

  async function operation(fn,{activeId='',exclusive=false,stopAudio=false,timeout=7000}={}){
    if(td3.busy){
      status(say('Another hardware operation is still running.','Başka bir donanım işlemi hâlâ sürüyor.'),'warn');
      return;
    }
    setBusy(true,activeId);
    const release=exclusive?(window.__303boxMidiRouter?.beginExclusive?.('td3-family-write')||(()=>{})):(()=>{});
    try{
      if(stopAudio)window.__303boxUnifiedEngine?.stopAll?.();
      await nextFrame();
      await withTimeout(fn(),timeout,'operation-timeout');
    }catch(e){
      status(errorText(e),'bad');
    }finally{
      release();
      setBusy(false);
      if(td3.pending){
        const b=$('#td3WritePattern');
        if(b){b.disabled=false;b.classList.add('armed');b.textContent=say(`CONFIRM WRITE ${td3.pending.tg.label}`,`${td3.pending.tg.label} YAZMAYI ONAYLA`)}
      }
    }
  }

  async function prepareWrite(){
    const tg=target();
    status(`${FAMILY} ${tg.label} — ${say('reading exact target for browser backup…','tarayıcı yedeği için tam hedef okunuyor…')}`,'warn');
    await nextFrame();
    await ensure(tg);
    const backup=await readPattern(tg);
    saveBackup(backup,tg);
    status(`${FAMILY} ${tg.label} — ${say('backup saved; building pattern packet…','yedek kaydedildi; pattern paketi hazırlanıyor…')}`,'warn');
    await nextFrame();
    const packet=encodePattern(backup),wanted=semantics();
    if(!sameSemantics(wanted,decodeSemantics(packet)))throw error('verify');
    armPending(packet,tg);
    status(`${detectedLabel()} ${tg.label} — ${say('backup saved. Nothing written yet. Confirm the target, then press CONFIRM WRITE.','yedek alındı. Henüz hiçbir şey yazılmadı. Hedefi kontrol edip YAZMAYI ONAYLA düğmesine basın.')} · ${diagnostics()}`,'warn');
  }
  async function commitWrite(){
    const p=td3.pending;
    if(!p||Date.now()>p.expires)throw error('changed');
    if(p.signature!==signature()||p.product!==td3.product)throw error('changed');
    const tg=target();
    if(tg.group!==p.tg.group||tg.requestSlot!==p.tg.requestSlot)throw error('changed');
    await ensure(tg);
    const actual=await writeAndVerify(p.packet,tg);
    if(!sameSemantics(semantics(),decodeSemantics(actual)))throw error('verify');
    clearPending();
    status(`${detectedLabel()} ${tg.label} — ${say('WRITE VERIFIED: notes, accents and slides match.','YAZMA DOĞRULANDI: nota, accent ve slide eşleşiyor.')} · ${diagnostics()}`,configWarning()?'warn':'good');
  }
  async function restore(){
    const b=loadBackup();
    if(!b?.bytes||!b?.target)throw error('changed');
    await ensure(b.target);
    const actual=await writeAndVerify(b.bytes,b.target);
    if(!comparable(b.bytes,actual))throw error('verify');
    clearPending();
    status(`${detectedLabel()} ${b.target.label} — ${say('backup restored and verified.','yedek geri yüklendi ve doğrulandı.')}`,'good');
  }
  async function readOnly(){
    const tg=target();
    status(`${FAMILY} ${tg.label} — ${say('reading only; no write will be sent…','yalnızca okunuyor; yazma gönderilmeyecek…')}`,'warn');
    await nextFrame();
    await ensure(tg);
    const bytes=await readPattern(tg);
    status(`${detectedLabel()} ${tg.label} — ${say(`read OK (${bytes.length} bytes). Nothing was written.`,`okuma tamam (${bytes.length} bayt). Hiçbir şey yazılmadı.`)} · ${diagnostics()}`,configWarning()?'warn':'good');
  }

  function patchLabels(){
    const profile=$('#midiDeviceProfile');
    if(profile){
      const auto=[...profile.options].find(o=>o.value==='auto');
      const td=[...profile.options].find(o=>o.value==='td3');
      if(auto&&auto.textContent!=='AUTO — T-8 / TD-3 / TD-3-MO')auto.textContent='AUTO — T-8 / TD-3 / TD-3-MO';
      if(td&&td.textContent!==FAMILY)td.textContent=FAMILY;
    }
    $$('.hardware-device-card').forEach(card=>{
      const ids=(card.dataset.device||'').split(/\s+/);
      if(ids.includes('td3')||ids.includes('td3mo')){
        const h=card.querySelector('.hardware-device-title h3');
        if(h&&h.textContent!==FAMILY)h.textContent=FAMILY;
        card.dataset.device='td3 td3mo';
      }
    });
    const title=$('#hardwareGuideTitle');
    if(title&&!title.textContent.includes(FAMILY))title.innerHTML=`<span class="lang-en">T-8 and ${FAMILY} hardware transfer</span><span class="lang-tr">T-8 ve ${FAMILY} donanım aktarımı</span>`;
    const head=$('#td3DirectBox .td3-direct-head strong');
    if(head&&head.textContent!==`${FAMILY} DIRECT WRITE`)head.textContent=`${FAMILY} DIRECT WRITE`;
    const warning=$('#td3DirectBox .td3-direct-warning');
    if(warning){
      const en=warning.querySelector('.lang-en'),tr=warning.querySelector('.lang-tr');
      const enText=`Safety flow: identify ${FAMILY} → read exact target → save browser backup → confirm write → short exclusive write → read back and compare. Other devices are rejected.`;
      const trText=`Güvenlik akışı: ${FAMILY} kimliğini doğrula → tam hedefi oku → tarayıcı yedeği al → yazmayı onayla → kısa exclusive yazma → geri okuyup karşılaştır. Diğer cihazlar reddedilir.`;
      if(en&&en.textContent!==enText)en.textContent=enText;
      if(tr&&tr.textContent!==trText)tr.textContent=trText;
    }
  }
  function installLabelObserver(){
    if(td3.labelObserver)return;
    td3.labelObserver=new MutationObserver(()=>patchLabels());
    td3.labelObserver.observe(document.documentElement,{childList:true,subtree:true});
    patchLabels();
  }

  function installCapture(){
    window.addEventListener('click',event=>{
      const b=event.target?.closest?.('#td3ArmSysex,#td3ReadPattern,#td3WritePattern,#td3RestorePattern');
      if(!b)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if(b.id==='td3ArmSysex')operation(()=>verify(target(),true),{activeId:b.id,timeout:16000});
      else if(b.id==='td3ReadPattern')operation(readOnly,{activeId:b.id,timeout:6500});
      else if(b.id==='td3WritePattern'){
        if(td3.pending)operation(commitWrite,{activeId:b.id,exclusive:true,stopAudio:true,timeout:18000});
        else operation(prepareWrite,{activeId:b.id,exclusive:false,stopAudio:false,timeout:7000});
      }else if(b.id==='td3RestorePattern')operation(restore,{activeId:b.id,exclusive:true,stopAudio:true,timeout:18000});
    },true);
  }

  function init(){
    installCapture();
    installLabelObserver();
    document.addEventListener('303box:languagechange',patchLabels);
    document.addEventListener('303box:ready',patchLabels);
    document.addEventListener('303box:content-refresh',patchLabels);
    document.addEventListener('click',e=>{if(e.target?.closest?.('#midiHardwareGuide,[data-hardware-guide-open]'))setTimeout(patchLabels,20)},true);
    window.__303boxHardwareFidelity={
      version:RELEASE,
      encodePattern,
      decodeSemantics,
      verify,
      diagnostics,
      get state(){return{product:td3.product,firmware:td3.firmware,config:td3.config,verified:td3.verified,busy:td3.busy}}
    };
  }
  init();
})();