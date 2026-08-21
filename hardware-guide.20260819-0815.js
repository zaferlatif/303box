(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const tr=()=>document.documentElement.lang==='tr';
  const say=(en,trText)=>tr()?trText:en;

  const TD3_PREFIX=[0xF0,0x00,0x20,0x32,0x00,0x01,0x0A];
  const TD3_PRODUCT=[...TD3_PREFIX,0x06,0xF7];
  const TD3_FIRMWARE=[...TD3_PREFIX,0x08,0x00,0xF7];
  const TD3_BACKUP='303box-td3-last-pattern-backup-v1';
  const TD3_PATTERN_BYTES=123;
  const TD3_PATTERN_TIMEOUT=2200;
  const TD3_WRITE_SETTLE=500;
  const TD3_VERIFY_RETRIES=3;
  const TD3_VERIFY_RETRY_DELAY=450;
  const TD3_WRITE_CONFIRM_WINDOW=15000;
  const NOTE={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};

  const td3={access:null,input:null,output:null,product:'',firmware:'',profile:'',verified:false,sysexEnabled:false,busy:false,stateListener:null,pendingWrite:null,pendingTimer:0};

  function selectedDevice(){
    const v=$('#midiDeviceProfile')?.value||'auto';
    if(v!=='auto')return v;
    const state=window.__303boxMidiRouter?.state;
    return state?.effective||'t8';
  }

  function markCurrent(){
    const id=selectedDevice();
    $$('.hardware-device-card').forEach(card=>{
      const ids=(card.dataset.device||'').split(/\s+/).filter(Boolean);
      card.classList.toggle('current',ids.includes(id));
    });
  }

  function setCopy(selector,en,trText){
    const root=$(selector);if(!root)return;
    const a=$('.lang-en',root),b=$('.lang-tr',root);
    if(a)a.textContent=en;if(b)b.textContent=trText;
  }

  function refineCapabilityCopy(){
    setCopy('[data-device="td3 td3mo"] .hardware-capability:nth-child(3) strong',
      'TD-3: EXPERIMENTAL direct pattern write over USB SysEx. TD-3-MO: only after a compatible read probe succeeds.',
      'TD-3: USB SysEx ile DENEYSEL doğrudan pattern write. TD-3-MO: yalnız uyumlu okuma testi başarılı olursa.');
    setCopy('[data-device="td3 td3mo"] .hardware-capability:nth-child(4) strong',
      '303box can read-back, back up, write and verify a TD-3 pattern slot over USB. The protocol is reverse-engineered, not manufacturer-published.',
      '303box USB üzerinden TD-3 pattern slotunu okuyabilir, yedekleyebilir, yazabilir ve tekrar okuyarak doğrulayabilir. Protokol tersine mühendisliktir; üretici tarafından yayımlanmamıştır.');
    setCopy('[data-device="td3 td3mo"] .hardware-capability:nth-child(5) strong',
      'TD-3-MO also has a MIDI-controllable filter; 303box does not map that CC yet.',
      'TD-3-MO ayrıca MIDI kontrollü filtre sunar; 303box bu CC’yi henüz eşlemiyor.');
    setCopy('[data-device="volcabass"] .hardware-capability:first-child strong',
      '303box now: notes + velocity + clock. Device also documents synthesis CCs for future mapping.',
      '303box bugün: nota + velocity + clock. Cihaz ayrıca ileride eşlenebilecek synth CC’leri belgeliyor.');
    setCopy('[data-device="volcanubass"] .hardware-capability:first-child strong',
      '303box now: notes + velocity + clock. Device also documents parameter CCs for future mapping.',
      '303box bugün: nota + velocity + clock. Cihaz ayrıca ileride eşlenebilecek parametre CC’leri belgeliyor.');
  }

  function injectStyle(){
    if($('#td3DirectStyle'))return;
    const s=document.createElement('style');s.id='td3DirectStyle';s.textContent=`
      .hardware-device-card.current{border-color:#7a9022;box-shadow:0 0 0 1px rgba(221,255,55,.08),0 0 26px rgba(221,255,55,.04)}
      .td3-direct-box{margin-top:14px;padding:13px;border:1px solid #5f4f20;border-radius:10px;background:#15130d}
      .td3-direct-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px}
      .td3-direct-head strong{color:#ddff37;font:850 .56rem/1 JetBrains Mono,monospace;letter-spacing:.07em}
      .td3-direct-head small{color:#ffc765;font:800 .43rem/1 JetBrains Mono,monospace;letter-spacing:.055em}
      .td3-direct-target{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px}
      .td3-direct-target label{display:grid;gap:5px;color:#707078;font:800 .42rem/1 JetBrains Mono,monospace;letter-spacing:.055em}
      .td3-direct-target select{width:100%;height:34px;padding:0 8px;border:1px solid #34343a;border-radius:7px;background:#101013;color:#e5e5e8;font:750 .58rem/1 JetBrains Mono,monospace}
      .td3-direct-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}
      .td3-direct-actions button{min-height:36px;padding:0 8px;border:1px solid #3b3b42;border-radius:7px;background:#17171b;color:#c9c9ce;font:850 .48rem/1.15 JetBrains Mono,monospace;letter-spacing:.045em;cursor:pointer}
      .td3-direct-actions button.primary{border-color:#61731b;background:#192009;color:#ddff37}
      .td3-direct-actions button.primary.armed{border-color:#ddff37;background:#29340b;box-shadow:0 0 0 2px rgba(221,255,55,.12),0 0 18px rgba(221,255,55,.1)}
      .td3-direct-actions button.danger{border-color:#653833;background:#1d1111;color:#ff8a82}
      .td3-direct-actions button:disabled{opacity:.38;cursor:not-allowed}
      .td3-direct-status{min-height:40px;margin:9px 0;padding:9px 10px;border:1px solid #303038;border-radius:7px;background:#101013;color:#b8b8bf;font-size:.57rem;line-height:1.5}
      .td3-direct-status.good{color:#ddff37}.td3-direct-status.warn{color:#ffc765}.td3-direct-status.bad{color:#ff8179}
      .td3-direct-box[aria-busy="true"] .td3-direct-status{border-color:#65751e;box-shadow:0 0 0 2px rgba(221,255,55,.06)}
      .td3-direct-warning{margin:8px 0 0;color:#77777f;font-size:.55rem;line-height:1.5}
      @media(max-width:560px){.td3-direct-target{grid-template-columns:1fr 1fr}.td3-direct-target label:last-child{grid-column:1/-1}.td3-direct-actions{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function injectTd3Writer(){
    const card=$('[data-device="td3 td3mo"]');if(!card||$('#td3DirectBox'))return;
    const box=document.createElement('div');box.id='td3DirectBox';box.className='td3-direct-box';
    box.innerHTML=`
      <div class="td3-direct-head"><strong data-i18n="td3DirectTitle">TD-3 DIRECT WRITE</strong><small data-i18n="td3DirectUsbOnly">EXPERIMENTAL / USB ONLY</small></div>
      <div class="td3-direct-target">
        <label><span data-i18n="td3Group">GROUP</span><select id="td3WriteGroup"><option value="0">I</option><option value="1">II</option><option value="2">III</option><option value="3">IV</option></select></label>
        <label><span data-i18n="td3Section">SECTION</span><select id="td3WriteSection"><option value="A">A</option><option value="B">B</option></select></label>
        <label><span data-i18n="td3Pattern">PATTERN</span><select id="td3WriteNumber">${Array.from({length:8},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></label>
      </div>
      <p id="td3DirectStatus" class="td3-direct-status" role="status" aria-live="polite" aria-atomic="true"></p>
      <div class="td3-direct-actions">
        <button id="td3ArmSysex" data-i18n="td3Verify" type="button">VERIFY USB / SYSEX</button>
        <button id="td3WritePattern" data-i18n="td3BackupWrite" class="primary" type="button">BACKUP + WRITE</button>
        <button id="td3RestorePattern" data-i18n="td3Restore" class="danger" type="button">RESTORE LAST BACKUP</button>
        <button id="td3ReadPattern" data-i18n="td3ReadOnly" type="button">TEST READ (NO WRITE)</button>
      </div>
      <p class="td3-direct-warning"><span class="lang-en">Safety flow: identify the TD-3 over USB → read the target slot → save a browser backup → write → read it again and compare. Use a disposable pattern slot first.</span><span class="lang-tr">Güvenlik akışı: TD-3’ü USB üzerinden doğrula → hedef slotu oku → tarayıcıya yedekle → yaz → tekrar okuyup karşılaştır. İlk denemede önemsiz bir pattern slotu kullan.</span></p>`;
    card.appendChild(box);
    $('#td3ArmSysex',box)?.addEventListener('click',()=>armTd3(true));
    $('#td3ReadPattern',box)?.addEventListener('click',readOnly);
    $('#td3WritePattern',box)?.addEventListener('click',writeTd3);
    $('#td3RestorePattern',box)?.addEventListener('click',restoreTd3);
    $$('select',box).forEach(select=>select.addEventListener('change',targetChanged));
    targetChanged();
  }

  function td3Status(msg,kind=''){
    const el=$('#td3DirectStatus');if(!el)return;el.textContent=msg;el.className=`td3-direct-status ${kind}`.trim();
  }

  function patternSignature(){return JSON.stringify(patternSteps())}
  function setWriteButton(mode='default',tg=null){
    const button=$('#td3WritePattern');if(!button)return;
    const dynamic=mode!=='default';
    button.dataset.dynamicCopy=dynamic?'true':'false';
    button.classList.toggle('armed',mode==='confirm');
    button.textContent=mode==='confirm'
      ? say(`CONFIRM WRITE ${tg?.label||''}`,`${tg?.label||''} YAZMAYI ONAYLA`)
      : mode==='working'
        ? say('WORKING…','İŞLENİYOR…')
        : say('BACKUP + WRITE','YEDEKLE + YAZ');
  }

  function clearPendingWrite(){
    if(td3.pendingTimer)clearTimeout(td3.pendingTimer);
    td3.pendingTimer=0;td3.pendingWrite=null;setWriteButton();
  }

  function targetChanged(){
    clearPendingWrite();
    const tg=target();
    td3Status(`${tg.label} — ${say('target selected. Nothing has been written.','hedef seçildi. Henüz hiçbir şey yazılmadı.')}`,'warn');
  }

  function armPendingWrite(packet,tg,semantics){
    clearPendingWrite();
    td3.pendingWrite={
      packet:packet.slice(),
      semantics:semantics.map(step=>({...step})),
      tg:{...tg},
      signature:patternSignature(),
      product:td3.product,
      expires:Date.now()+TD3_WRITE_CONFIRM_WINDOW
    };
    setWriteButton('confirm',tg);
    const pending=td3.pendingWrite;
    td3.pendingTimer=setTimeout(()=>{
      if(td3.pendingWrite!==pending)return;
      clearPendingWrite();
      td3Status(`${tg.label} — ${say('write confirmation expired. Nothing was written.','yazma onayı zaman aşımına uğradı. Hiçbir şey yazılmadı.')}`,'warn');
    },TD3_WRITE_CONFIRM_WINDOW);
  }

  function setTd3Busy(busy){
    td3.busy=busy;
    const box=$('#td3DirectBox');
    if(!box)return;
    box.setAttribute('aria-busy',busy?'true':'false');
    $$('button, select',box).forEach(el=>{el.disabled=busy});
    if(busy)setWriteButton('working');
    else if(td3.pendingWrite)setWriteButton('confirm',td3.pendingWrite.tg);
    else setWriteButton();
  }

  async function runTd3Operation(operation){
    if(td3.busy){
      td3Status(say('Another TD-3 operation is still running.','Başka bir TD-3 işlemi hâlâ sürüyor.'),'warn');
      return false;
    }
    setTd3Busy(true);
    try{return await operation()}
    catch(_){
      td3Status(say('The TD-3 operation stopped unexpectedly. Nothing else was sent.','TD-3 işlemi beklenmedik biçimde durdu. Başka veri gönderilmedi.'),'bad');
      return false;
    }finally{setTd3Busy(false)}
  }

  function target(){
    const rawGroup=Number($('#td3WriteGroup')?.value||0);
    const group=Number.isInteger(rawGroup)&&rawGroup>=0&&rawGroup<=3?rawGroup:0;
    const section=$('#td3WriteSection')?.value==='B'?'B':'A';
    const rawNumber=Number($('#td3WriteNumber')?.value||1);
    const number=Number.isInteger(rawNumber)&&rawNumber>=1&&rawNumber<=8?rawNumber:1;
    // Reverse-engineered TD-3 request uses raw slots 0..15: A1..A8, B1..B8.
    const requestSlot=(section==='B'?8:0)+(number-1);
    return{group,section,number,requestSlot,label:`${['I','II','III','IV'][group]} / ${section}${number}`};
  }

  const portName=p=>`${p?.manufacturer||''} ${p?.name||''}`.replace(/\s+/g,' ').trim();
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  const isTd3Name=s=>/td\s*-?\s*3/i.test(String(s||''));
  const samePrefix=a=>TD3_PREFIX.every((v,i)=>a[i]===v);
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function td3Error(code,cause){
    const err=new Error(code);err.td3Code=code;
    if(cause)err.cause=cause;
    return err;
  }

  function td3ErrorCode(err){
    if(err?.td3Code)return err.td3Code;
    if(err?.name==='NotAllowedError')return 'permission-denied';
    if(err?.name==='SecurityError')return 'security-error';
    if(err?.name==='NotSupportedError')return 'sysex-unsupported';
    if(err?.name==='InvalidAccessError')return 'sysex-send-denied';
    if(err?.name==='InvalidStateError')return 'port-disconnected';
    return String(err?.message||'unknown');
  }

  function portIsConnected(port){return !!port&&port.state==='connected'}
  function connectionIsReady(){
    return td3.verified&&td3.sysexEnabled&&td3.access?.sysexEnabled===true&&
      portIsConnected(td3.input)&&portIsConnected(td3.output)&&
      td3.input.connection==='open'&&td3.output.connection==='open'&&
      td3.profile===selectedDevice();
  }

  function clearVerification(){
    td3.verified=false;td3.sysexEnabled=false;td3.profile='';
  }

  function pickPorts(access){
    const router=window.__303boxMidiRouter?.state||{};
    const outputs=[...access.outputs.values()].filter(p=>p.state==='connected'&&isTd3Name(portName(p)));
    const inputs=[...access.inputs.values()].filter(p=>p.state==='connected'&&isTd3Name(portName(p)));
    let output=outputs.find(p=>p.id===router.outputId);
    if(!output&&router.outputName)output=outputs.find(p=>norm(portName(p))===norm(router.outputName));
    if(!output&&outputs.length===1)output=outputs[0];
    if(!output)return{error:outputs.length?'ambiguous-output':'usb-port'};
    const outKey=norm(portName(output));
    const exactInputs=inputs.filter(p=>norm(portName(p))===outKey||norm(p.name)===norm(output.name));
    let input=exactInputs.length===1?exactInputs[0]:null;
    if(!input&&inputs.length===1)input=inputs[0];
    if(!input)return{output,error:inputs.length?'ambiguous-input':'usb-port'};
    return{input,output};
  }

  function transact(message,test,timeout=1500,label='request'){
    return new Promise((resolve,reject)=>{
      let timer=0;
      const input=td3.input,output=td3.output;
      if(!portIsConnected(input)||!portIsConnected(output)){reject(td3Error('port-disconnected'));return}
      const done=()=>{clearTimeout(timer);input.removeEventListener('midimessage',onMsg)};
      const onMsg=e=>{
        const a=[...e.data];
        try{if(test(a)){done();resolve(a)}}catch(err){done();reject(err)}
      };
      input.addEventListener('midimessage',onMsg);
      timer=setTimeout(()=>{done();reject(td3Error(`${label}-timeout`))},timeout);
      try{output.send(message)}catch(cause){done();reject(td3Error('send-failed',cause))}
    });
  }

  function asciiFrom(a,start){return String.fromCharCode(...a.slice(start,-1).filter(v=>v>0&&v<128)).trim()}

  function armFailureMessage(err){
    const code=td3ErrorCode(err);
    if(code==='usb-port')return say('A connected TD-3 USB MIDI input + output pair was not found. Generic DIN adapters cannot perform direct SysEx writes.','Bağlı bir TD-3 USB MIDI giriş + çıkış çifti bulunamadı. Genel DIN adaptörleri doğrudan SysEx yazamaz.');
    if(code==='ambiguous-output'||code==='ambiguous-input')return say('More than one TD-3 USB endpoint is connected and the correct pair could not be selected safely. Select the intended TD-3 MIDI output, disconnect the other unit, then retry.','Birden fazla TD-3 USB uç noktası bağlı ve doğru çift güvenle seçilemedi. İstenen TD-3 MIDI çıkışını seç, diğer cihazı çıkar ve yeniden dene.');
    if(code==='permission-denied')return say('The browser did not grant MIDI SysEx permission. Allow MIDI device access (including SysEx) in the site permissions, then retry.','Tarayıcı MIDI SysEx izni vermedi. Site izinlerinden MIDI cihazı erişimine (SysEx dâhil) izin verip yeniden dene.');
    if(code==='security-error')return say('The browser blocked SysEx for this page. Open 303box from HTTPS in a supported desktop browser and retry from a button click.','Tarayıcı bu sayfada SysEx erişimini engelledi. 303box’ı desteklenen bir masaüstü tarayıcıda HTTPS üzerinden açıp düğmeye yeniden bas.');
    if(code==='sysex-disabled'||code==='sysex-unsupported')return say('Web MIDI opened without SysEx capability. Direct write is unavailable in this browser/session.','Web MIDI, SysEx yetkisi olmadan açıldı. Bu tarayıcı/oturumda doğrudan yazma kullanılamaz.');
    if(code==='identity')return say('The connected SysEx device did not identify itself as TD-3 / TD-3-MO. Aborted.','Bağlı SysEx cihazı kendini TD-3 / TD-3-MO olarak tanıtmadı. İşlem iptal edildi.');
    if(code==='port-open')return say('The TD-3 USB MIDI ports are present but could not be opened. Close other MIDI software, reconnect the TD-3, and retry.','TD-3 USB MIDI portları görünüyor ancak açılamadı. Diğer MIDI yazılımlarını kapat, TD-3’ü yeniden bağla ve tekrar dene.');
    if(code==='product-timeout')return say('The TD-3 USB ports opened, but the device did not answer the product SysEx request. Close other MIDI software and check the direct USB connection.','TD-3 USB portları açıldı ancak cihaz ürün SysEx sorgusuna yanıt vermedi. Diğer MIDI yazılımlarını kapatıp doğrudan USB bağlantısını kontrol et.');
    if(code==='pattern-timeout'||code==='pattern-probe')return say('The TD-3 was identified, but the selected pattern slot did not return a matching SysEx response. WRITE remains blocked.','TD-3 tanındı ancak seçilen pattern slotundan eşleşen SysEx yanıtı gelmedi. WRITE engellenmiş durumda.');
    if(code==='port-disconnected'||code==='send-failed')return say('The TD-3 USB MIDI connection was interrupted. Reconnect it and verify USB / SysEx again.','TD-3 USB MIDI bağlantısı kesildi. Yeniden bağlayıp USB / SysEx doğrulamasını tekrarla.');
    return say(`Could not verify TD-3 SysEx (${code}). Check the direct USB connection and browser permissions.`,`TD-3 SysEx doğrulanamadı (${code}). Doğrudan USB bağlantısını ve tarayıcı izinlerini kontrol et.`);
  }

  function watchAccess(access){
    if(td3.access&&td3.stateListener)td3.access.removeEventListener?.('statechange',td3.stateListener);
    td3.access=access;
    td3.stateListener=()=>{
      if(portIsConnected(td3.input)&&portIsConnected(td3.output))return;
      clearVerification();
      if(!td3.busy)td3Status(say('TD-3 USB connection changed. Verify USB / SysEx again.','TD-3 USB bağlantısı değişti. USB / SysEx doğrulamasını yeniden yap.'),'warn');
    };
    access.addEventListener?.('statechange',td3.stateListener);
  }

  async function verifyTd3(verbose=false,probeTarget=target()){
    const device=selectedDevice();
    if(device!=='td3'&&device!=='td3mo'){
      td3Status(say('Select Behringer TD-3 or TD-3-MO in DEVICE first.','Önce CİHAZ bölümünden Behringer TD-3 veya TD-3-MO seç.'),'warn');
      return false;
    }
    if(!navigator.requestMIDIAccess){td3Status(say('Web MIDI is not available in this browser.','Bu tarayıcıda Web MIDI yok.'),'bad');return false}
    try{
      td3Status(say('Requesting SysEx permission…','SysEx izni isteniyor…'));
      const access=await navigator.requestMIDIAccess({sysex:true});
      if(access?.sysexEnabled!==true)throw td3Error('sysex-disabled');
      const {input,output,error}=pickPorts(access);
      if(error)throw td3Error(error);
      try{await Promise.all([input.open(),output.open()])}catch(cause){throw td3Error('port-open',cause)}
      td3.input=input;td3.output=output;td3.verified=false;td3.sysexEnabled=true;td3.profile=device;
      watchAccess(access);

      const prod=await transact(TD3_PRODUCT,a=>samePrefix(a)&&a[7]===0x07,1800,'product');
      td3.product=asciiFrom(prod,8);
      if(!/^TD-3(?:-MO)?/i.test(td3.product))throw td3Error('identity');

      try{
        const fw=await transact(TD3_FIRMWARE,a=>samePrefix(a)&&a[7]===0x09,900,'firmware');
        td3.firmware=[fw[9],fw[10],fw[11]].filter(Number.isFinite).join('.');
      }catch(_){td3.firmware=''}

      // Non-destructive compatibility probe: a valid response must arrive before any WRITE packet is sent.
      const raw=await requestPattern(probeTarget);
      if(!validPattern(raw,probeTarget))throw td3Error('pattern-probe');
      td3.verified=true;
      const mo=/MO/i.test(td3.product);
      td3Status(`${td3.product}${td3.firmware?` v${td3.firmware}`:''} — ${probeTarget.label} ${say('read OK','okundu')} ${mo?' / MO COMPATIBLE PROBE OK':''}`,'good');
      if(verbose)markCurrent();
      return true;
    }catch(err){
      clearVerification();
      td3Status(armFailureMessage(err),'bad');return false;
    }
  }

  function armTd3(verbose=false){return runTd3Operation(()=>verifyTd3(verbose,target()))}

  function validTarget(tg){return Number.isInteger(tg?.group)&&tg.group>=0&&tg.group<=3&&Number.isInteger(tg?.requestSlot)&&tg.requestSlot>=0&&tg.requestSlot<=15}

  function validPattern(a,tg){
    return Array.isArray(a)&&a.length===TD3_PATTERN_BYTES&&validTarget(tg)&&samePrefix(a)&&
      a[7]===0x78&&a[8]===tg.group&&a[9]===tg.requestSlot&&a[a.length-1]===0xF7&&
      a.slice(1,-1).every(v=>Number.isInteger(v)&&v>=0&&v<0x80);
  }

  async function requestPattern(tg,timeout=TD3_PATTERN_TIMEOUT){
    if(!validTarget(tg))throw td3Error('invalid-target');
    const req=[...TD3_PREFIX,0x77,tg.group,tg.requestSlot,0xF7];
    return transact(req,a=>validPattern(a,tg),timeout,'pattern');
  }

  async function ensureTd3(tg){
    if(connectionIsReady())return true;
    clearVerification();
    return verifyTd3(false,tg);
  }

  function patternSteps(){
    const notes=$$('#patternSheet .note-input');
    const octs=$$('#patternSheet .octave-cell');
    const exprs=$$('#patternSheet .accentSlide-cell');
    const gates=$$('#patternSheet .gate-cell');
    return Array.from({length:16},(_,i)=>({
      note:(notes[i]?.value||'').trim().toUpperCase(),
      baseOct:Number(notes[i]?.dataset?.baseOctave||0)?1:0,
      oct:(octs[i]?.textContent||'').trim().toUpperCase(),
      expr:(exprs[i]?.textContent||'').trim().toUpperCase(),
      gate:(gates[i]?.textContent||'').trim()
    }));
  }

  // TD-3 stores a logical 8-bit value as two 4-bit SysEx bytes. Values above
  // 0x7f are valid here: the hardware uses bit 7 to distinguish its upper C.
  function pair(v){v=Math.max(0,Math.min(255,Math.round(v)));return[(v>>4)&0x0F,v&0x0F]}
  function writePair(a,index,v){const p=pair(v);a[index]=p[0];a[index+1]=p[1]}
  function boolPair(a,index,v){a[index]=0;a[index+1]=v?1:0}
  function packByRests(values,rests,off){
    const packed=[];
    for(let i=0;i<16;i++)if(!rests[i])packed.push(values[i]);
    while(packed.length<16)packed.push(off);
    return packed;
  }
  function mask16(flags){
    const b=[0,0,0,0];
    flags.forEach((on,step)=>{
      if(!on)return;
      let bi,bit;
      if(step<4){bi=1;bit=step}
      else if(step<8){bi=0;bit=step-4}
      else if(step<12){bi=3;bit=step-8}
      else{bi=2;bit=step-12}
      b[bi]|=(1<<bit);
    });
    return b;
  }

  function unpackMask16(a,index){
    const b=a.slice(index,index+4);
    return Array.from({length:16},(_,step)=>{
      let bi,bit;
      if(step<4){bi=1;bit=step}
      else if(step<8){bi=0;bit=step-4}
      else if(step<12){bi=3;bit=step-8}
      else{bi=2;bit=step-12}
      return Boolean(b[bi]&(1<<bit));
    });
  }

  function td3Pitch(s,index){
    const semitone=NOTE[s.note];
    if(semitone==null)throw new Error(`bad-note-${index+1}`);
    if(s.baseOct&&semitone!==0)throw new Error(`upper-c-only-${index+1}`);
    const sounding=0x18+semitone+(s.baseOct?12:0)+(s.oct==='D'?-12:s.oct==='U'?12:0);
    if(sounding<0x0C||sounding>0x30)throw new Error(`pitch-range-${index+1}`);
    return sounding|(s.baseOct?0x80:0);
  }

  function patternSemantics(steps=patternSteps()){
    return steps.map((s,i)=>{
      const rest=!s.note||s.gate==='-'||!s.gate;
      if(rest)return{gate:'rest'};
      return{
        gate:s.gate==='○'?'tie':'note',
        pitch:td3Pitch(s,i)&0x7F,
        accent:s.expr.includes('A'),
        slide:s.expr.includes('S')
      };
    });
  }

  function decodePatternSemantics(packet){
    if(!Array.isArray(packet)||packet.length!==TD3_PATTERN_BYTES)throw td3Error('short-pattern');
    const triggers=unpackMask16(packet,0x72),rests=unpackMask16(packet,0x76);
    let packed=0;
    return rests.map((rest,step)=>{
      if(rest)return{gate:'rest'};
      const offset=packed++*2;
      return{
        gate:triggers[step]?'note':'tie',
        pitch:((packet[0x0C+offset]<<4)|packet[0x0D+offset])&0x7F,
        accent:Boolean((packet[0x2C+offset]<<4)|packet[0x2D+offset]),
        slide:Boolean((packet[0x4C+offset]<<4)|packet[0x4D+offset])
      };
    });
  }

  function samePatternSemantics(a,b){return JSON.stringify(a)===JSON.stringify(b)}

  function encodePattern(backup,steps=patternSteps()){
    if(!Array.isArray(backup)||backup.length!==TD3_PATTERN_BYTES)throw td3Error('short-pattern');
    const out=backup.slice();
    const triggers=[],rests=[],pitches=Array(16).fill(0x18),accents=Array(16).fill(false),slides=Array(16).fill(false);
    for(let i=0;i<16;i++){
      const s=steps[i],isRest=!s.note||s.gate==='-'||!s.gate,isTie=!isRest&&s.gate==='○';
      rests[i]=isRest;
      // Despite the reverse-engineered field name "Tie", TD-3 stores 1 for a
      // freshly triggered note and 0 for a tie. A canonical rest has both the
      // trigger and rest bits set. Sending the visual tie value directly here
      // inverts the rhythm and makes the written melody sound unrelated.
      triggers[i]=isRest||!isTie;
      if(!isRest){
        // The TD-3 consumes pitch/accent/slide entries sequentially for every
        // non-rest timing step. They are packed at the front of the dump rather
        // than stored at the matching visual step offset.
        pitches[i]=td3Pitch(s,i);
        accents[i]=s.expr.includes('A');
        slides[i]=s.expr.includes('S');
      }
    }
    const packedPitches=packByRests(pitches,rests,0x18);
    const packedAccents=packByRests(accents,rests,false);
    const packedSlides=packByRests(slides,rests,false);
    for(let i=0;i<16;i++){
      writePair(out,0x0C+i*2,packedPitches[i]);
      boolPair(out,0x2C+i*2,packedAccents[i]);
      boolPair(out,0x4C+i*2,packedSlides[i]);
    }
    out[0x6C]=0;out[0x6D]=0;       // straight 16th mode
    out[0x6E]=1;out[0x6F]=0;       // 0x10 = 16 steps, nibble-pair encoded
    const triggerMask=mask16(triggers),restMask=mask16(rests);
    triggerMask.forEach((v,i)=>out[0x72+i]=v);
    restMask.forEach((v,i)=>out[0x76+i]=v);
    out[out.length-1]=0xF7;
    return out;
  }

  function comparable(a,b){
    if(!a||!b||a.length!==TD3_PATTERN_BYTES||b.length!==TD3_PATTERN_BYTES||a[8]!==b[8]||a[9]!==b[9])return false;
    const ranges=[[0x0C,0x70],[0x72,0x7A]];
    return ranges.every(([from,to])=>{for(let i=from;i<to;i++)if(a[i]!==b[i])return false;return true});
  }

  function sameBytes(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i])}

  function targetFromAddress(group,requestSlot){
    const tg={group:Number(group),requestSlot:Number(requestSlot)};
    if(!validTarget(tg))return null;
    tg.section=tg.requestSlot>=8?'B':'A';
    tg.number=(tg.requestSlot%8)+1;
    tg.label=`${['I','II','III','IV'][tg.group]} / ${tg.section}${tg.number}`;
    return tg;
  }

  function normalizeBackup(value){
    if(!value||typeof value!=='object'||!Array.isArray(value.bytes))return null;
    const tg=targetFromAddress(value.requestGroup,value.requestSlot);
    if(!tg||!validPattern(value.bytes,tg))return null;
    return{...value,bytes:value.bytes.slice(),product:String(value.product||''),target:tg};
  }

  function saveBackup(bytes,tg){
    if(!validPattern(bytes,tg))throw td3Error('backup-invalid');
    const record={version:1,time:Date.now(),product:td3.product,firmware:td3.firmware,requestGroup:tg.group,requestSlot:tg.requestSlot,label:tg.label,bytes:bytes.slice()};
    try{
      localStorage.setItem(TD3_BACKUP,JSON.stringify(record));
      const saved=loadBackup();
      if(saved.reason||!sameBytes(saved.backup.bytes,record.bytes))throw td3Error('backup-save');
      return saved.backup;
    }catch(cause){
      if(td3ErrorCode(cause)==='backup-save')throw cause;
      throw td3Error('backup-save',cause);
    }
  }

  function loadBackup(){
    try{
      const raw=localStorage.getItem(TD3_BACKUP);
      if(!raw)return{backup:null,reason:'missing'};
      const backup=normalizeBackup(JSON.parse(raw));
      return backup?{backup,reason:''}:{backup:null,reason:'invalid'};
    }catch(_){return{backup:null,reason:'storage'}}
  }

  async function verifyReadBack(expected,tg){
    await sleep(TD3_WRITE_SETTLE);
    let lastError=null,sawMismatch=false;
    for(let attempt=1;attempt<=TD3_VERIFY_RETRIES;attempt++){
      try{
        const actual=await requestPattern(tg,TD3_PATTERN_TIMEOUT);
        if(comparable(expected,actual))return actual;
        sawMismatch=true;lastError=td3Error('verify-mismatch');
      }catch(err){
        lastError=err;
        if(!['pattern-timeout'].includes(td3ErrorCode(err)))throw err;
      }
      if(attempt<TD3_VERIFY_RETRIES){
        td3Status(`${tg.label} — ${say(`read-back retry ${attempt+1}/${TD3_VERIFY_RETRIES}…`,`geri okuma yeniden deneniyor ${attempt+1}/${TD3_VERIFY_RETRIES}…`)}`,'warn');
        await sleep(TD3_VERIFY_RETRY_DELAY);
      }
    }
    throw sawMismatch?td3Error('verify-mismatch'):(lastError||td3Error('verify-mismatch'));
  }

  function readOnly(){return runTd3Operation(async()=>{
    const tg=target();
    clearPendingWrite();
    td3Status(`${tg.label} — ${say('test read started. This action cannot write to the TD-3.','test okuma başladı. Bu işlem TD-3’e yazamaz.')}`,'warn');
    if(!(await ensureTd3(tg)))return false;
    try{
      const raw=await requestPattern(tg);
      td3Status(`${tg.label} — ${say(`READ OK (${raw.length} bytes). The connection and slot are readable; no pattern was changed.`,`OKUMA TAMAM (${raw.length} bayt). Bağlantı ve slot okunabiliyor; hiçbir pattern değiştirilmedi.`)}`,'good');
      return true;
    }catch(err){
      if(['port-disconnected','send-failed'].includes(td3ErrorCode(err)))clearVerification();
      td3Status(say(`Pattern read failed (${td3ErrorCode(err)}). Nothing was written.`,`Pattern okuma başarısız (${td3ErrorCode(err)}). Hiçbir şey yazılmadı.`),'bad');
      return false;
    }
  })}

  function writeFailureMessage(err,writeSent){
    const code=td3ErrorCode(err);
    if(code.startsWith('pitch-range-'))return say(`Step ${code.split('-').pop()} is outside the conservative TD-3 pitch range. Adjust D/U and try again.`,`Adım ${code.split('-').pop()} güvenli TD-3 perde aralığının dışında. D/U ayarını değiştirip tekrar dene.`);
    if(code.startsWith('upper-c-only-'))return say(`Step ${code.split('-').pop()} has an invalid upper-C flag. Re-select its note and try again.`,`Adım ${code.split('-').pop()} geçersiz bir üst-C işareti taşıyor. Notayı yeniden seçip tekrar dene.`);
    if(code.startsWith('bad-note-'))return say(`Step ${code.split('-').pop()} contains a note the TD-3 writer cannot encode. Correct it and retry.`,`Adım ${code.split('-').pop()} TD-3 yazıcısının kodlayamadığı bir nota içeriyor. Düzeltip yeniden dene.`);
    if(code==='backup-save')return say('The target was read, but its safety backup could not be saved and verified in this browser. WRITE was not sent. Check site storage permissions.','Hedef okundu ancak güvenlik yedeği bu tarayıcıya kaydedilip doğrulanamadı. WRITE gönderilmedi. Site depolama izinlerini kontrol et.');
    if(code==='backup-invalid'||code==='encoded-packet-invalid'||code==='short-pattern')return say('The target data did not form a safe TD-3 pattern packet. WRITE was blocked before anything was sent.','Hedef verisi güvenli bir TD-3 pattern paketi oluşturmadı. Herhangi bir veri gönderilmeden WRITE engellendi.');
    if(code==='semantic-encode-mismatch')return say('The TD-3 packet did not decode back to the visible pattern. WRITE was blocked before anything was sent.','TD-3 paketi ekrandaki pattern ile aynı biçimde çözülemedi. Herhangi bir veri gönderilmeden YAZMA engellendi.');
    if(code==='semantic-readback-mismatch')return say('WRITE was sent, but the stored TD-3 notes/gates do not match the visible pattern. Use RESTORE LAST BACKUP.','YAZMA gönderildi ancak TD-3’e kaydedilen nota/gate değerleri ekrandaki pattern ile eşleşmiyor. SON YEDEĞİ GERİ YÜKLE kullan.');
    if(code==='verify-mismatch')return say('WRITE was sent, but three read-back checks did not match. Do not trust this slot; use RESTORE LAST BACKUP.','WRITE gönderildi ancak üç geri okuma kontrolü eşleşmedi. Bu slota güvenme; RESTORE LAST BACKUP kullan.');
    if(code==='pattern-timeout'&&!writeSent)return say('The target slot did not answer the safety-backup read. WRITE was not sent. Verify USB / SysEx and retry.','Hedef slot güvenlik yedeği okumasına yanıt vermedi. WRITE gönderilmedi. USB / SysEx doğrulamasını yapıp yeniden dene.');
    if(code==='pattern-timeout')return say('WRITE was sent, but the TD-3 did not answer the read-back checks. Do not trust this slot; use RESTORE LAST BACKUP after reconnecting.','WRITE gönderildi ancak TD-3 geri okuma kontrollerine yanıt vermedi. Bu slota güvenme; yeniden bağlandıktan sonra RESTORE LAST BACKUP kullan.');
    if(code==='port-disconnected'||code==='send-failed')return say('The TD-3 USB connection was interrupted. The last pre-write backup is still stored when available. Reconnect and verify before restoring.','TD-3 USB bağlantısı kesildi. Varsa yazma öncesi son yedek hâlâ saklanıyor. Geri yüklemeden önce yeniden bağlanıp doğrula.');
    return say(`TD-3 direct write failed (${code}). The last pre-write backup was kept when available.`,`TD-3 doğrudan yazma başarısız (${code}). Varsa yazma öncesi son yedek korundu.`);
  }

  function prepareWrite(){return runTd3Operation(async()=>{
    const device=selectedDevice();
    if(device!=='td3'&&device!=='td3mo'){td3Status(say('Select TD-3 / TD-3-MO first.','Önce TD-3 / TD-3-MO seç.'),'warn');return false}
    const tg=target();
    td3Status(`${tg.label} — ${say('Backup + Write started. Verifying the device and reading the safety backup…','Yedekle + Yaz başlatıldı. Cihaz doğrulanıyor ve güvenlik yedeği okunuyor…')}`,'warn');
    if(!(await ensureTd3(tg)))return false;
    try{
      window.__303boxMidiRouter?.panic?.();
      window.__303boxUnifiedEngine?.stopAll?.();
      td3Status(`${tg.label} — ${say('reading backup…','yedek okunuyor…')}`);
      const backup=await requestPattern(tg);
      saveBackup(backup,tg);
      const steps=patternSteps(),intended=patternSemantics(steps);
      const packet=encodePattern(backup,steps);
      if(!validPattern(packet,tg))throw td3Error('encoded-packet-invalid');
      if(!samePatternSemantics(intended,decodePatternSemantics(packet)))throw td3Error('semantic-encode-mismatch');
      armPendingWrite(packet,tg,intended);
      td3Status(`${tg.label} — ${say('backup saved; nothing written yet. Press CONFIRM WRITE within 15 seconds.','yedek kaydedildi; henüz yazılmadı. 15 saniye içinde YAZMAYI ONAYLA düğmesine bas.')}`,'warn');
      return false;
    }catch(err){
      if(['port-disconnected','send-failed'].includes(td3ErrorCode(err)))clearVerification();
      clearPendingWrite();
      td3Status(writeFailureMessage(err,false),'bad');
      return false;
    }
  })}

  function commitPendingWrite(pending){return runTd3Operation(async()=>{
    const tg=target();
    if(!pending||Date.now()>pending.expires){
      clearPendingWrite();
      td3Status(say('Write confirmation expired. Start Backup + Write again.','Yazma onayı zaman aşımına uğradı. Yedekle + Yaz işlemini yeniden başlat.'),'warn');
      return false;
    }
    if(tg.group!==pending.tg.group||tg.requestSlot!==pending.tg.requestSlot){
      clearPendingWrite();
      td3Status(say('The target changed. Nothing was written. Start Backup + Write again.','Hedef değişti. Hiçbir şey yazılmadı. Yedekle + Yaz işlemini yeniden başlat.'),'warn');
      return false;
    }
    if(patternSignature()!==pending.signature){
      clearPendingWrite();
      td3Status(say('The 303box pattern changed after the backup. Nothing was written. Start again to use the current sheet.','303box pattern’i yedekten sonra değişti. Hiçbir şey yazılmadı. Güncel sayfayı kullanmak için yeniden başlat.'),'warn');
      return false;
    }
    if(!(await ensureTd3(tg)))return false;
    if(pending.product&&norm(pending.product)!==norm(td3.product)){
      clearPendingWrite();
      td3Status(say('The connected TD-3 changed. Nothing was written.','Bağlı TD-3 değişti. Hiçbir şey yazılmadı.'),'bad');
      return false;
    }
    clearPendingWrite();
    let writeSent=false;
    try{
      window.__303boxMidiRouter?.panic?.();
      window.__303boxUnifiedEngine?.stopAll?.();
      td3Status(`${tg.label} — ${say('WRITE sent. Reading the slot back for verification…','YAZMA gönderildi. Doğrulama için slot geri okunuyor…')}`,'warn');
      try{td3.output.send(pending.packet);writeSent=true}catch(cause){throw td3Error('send-failed',cause)}
      const actual=await verifyReadBack(pending.packet,tg);
      if(!samePatternSemantics(pending.semantics,decodePatternSemantics(actual)))throw td3Error('semantic-readback-mismatch');
      td3Status(`${td3.product} ${tg.label} — ${say('WRITE VERIFIED. The TD-3 memory matches the visible 303box pattern.','YAZMA DOĞRULANDI. TD-3 hafızası ekrandaki 303box pattern’iyle eşleşiyor.')}`,'good');
      return true;
    }catch(err){
      if(['port-disconnected','send-failed'].includes(td3ErrorCode(err)))clearVerification();
      td3Status(writeFailureMessage(err,writeSent),'bad');
      return false;
    }
  })}

  function writeTd3(){
    const pending=td3.pendingWrite;
    return pending?commitPendingWrite(pending):prepareWrite();
  }

  function restoreTd3(){return runTd3Operation(async()=>{
    const stored=loadBackup();
    if(stored.reason){
      const msg=stored.reason==='missing'
        ? say('No TD-3 backup is stored in this browser yet.','Bu tarayıcıda henüz TD-3 yedeği yok.')
        : say('The stored TD-3 backup is unavailable or invalid. It will not be sent.','Kayıtlı TD-3 yedeği kullanılamıyor veya geçersiz. Cihaza gönderilmeyecek.');
      td3Status(msg,stored.reason==='missing'?'warn':'bad');return false;
    }
    const backup=stored.backup,tg=backup.target,label=tg.label;
    if(!(await ensureTd3(tg)))return false;
    if(backup.product&&norm(backup.product)!==norm(td3.product)){
      td3Status(say(`This backup belongs to ${backup.product}, but the connected device reports ${td3.product}. Restore was blocked.`,`Bu yedek ${backup.product} cihazına ait; bağlı cihaz kendini ${td3.product} olarak tanıtıyor. Geri yükleme engellendi.`),'bad');
      return false;
    }
    if(!window.confirm(say(`Restore the saved backup to ${td3.product} ${label}? The backup's original slot address will be used.`,`Kayıtlı yedek ${td3.product} ${label} slotuna geri yüklensin mi? Yedeğin özgün slot adresi kullanılacak.`)))return false;
    try{
      window.__303boxMidiRouter?.panic?.();
      window.__303boxUnifiedEngine?.stopAll?.();
      try{td3.output.send(backup.bytes)}catch(cause){throw td3Error('send-failed',cause)}
      td3Status(`${label} — ${say('restoring; verifying read-back…','geri yükleniyor; geri okuma doğrulanıyor…')}`);
      await verifyReadBack(backup.bytes,tg);
      td3Status(`${label} — ${say('backup restored and verified.','yedek geri yüklendi ve doğrulandı.')}`,'good');
      return true;
    }catch(err){
      if(['port-disconnected','send-failed'].includes(td3ErrorCode(err)))clearVerification();
      const code=td3ErrorCode(err);
      const msg=code==='verify-mismatch'
        ? say('The backup was sent, but three read-back checks did not match. Stop using this slot and recheck the USB connection.','Yedek gönderildi ancak üç geri okuma kontrolü eşleşmedi. Bu slotu kullanmayı bırakıp USB bağlantısını yeniden kontrol et.')
        : say(`Backup restore could not be verified (${code}).`,`Yedek geri yükleme doğrulanamadı (${code}).`);
      td3Status(msg,'bad');return false;
    }
  })}

  function openGuide(){
    const d=$('#hardwareGuideDialog');
    if(!d)return;
    markCurrent();
    if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
  }

  function closeGuide(){
    const d=$('#hardwareGuideDialog');
    if(!d)return;
    if(typeof d.close==='function')d.close();else d.removeAttribute('open');
  }

  function init(){
    injectStyle();refineCapabilityCopy();injectTd3Writer();markCurrent();
    $('#midiHardwareGuide')?.addEventListener('click',openGuide);
    $('#hardwareGuideClose')?.addEventListener('click',closeGuide);
    $('#hardwareGuideDialog')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeGuide()});
    $('#midiDeviceProfile')?.addEventListener('change',()=>{clearVerification();clearPendingWrite();markCurrent();targetChanged()});
    document.addEventListener('303box:languagechange',()=>{if(!td3.busy)targetChanged();markCurrent()});
    window.__303boxHardwareGuide={version:'1100',open:openGuide,close:closeGuide,armTd3,writeTd3,restoreTd3,get td3(){return{product:td3.product,firmware:td3.firmware,profile:td3.profile,verified:td3.verified,sysexEnabled:td3.sysexEnabled,busy:td3.busy,pendingWrite:!!td3.pendingWrite,input:portName(td3.input),output:portName(td3.output)}}};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
