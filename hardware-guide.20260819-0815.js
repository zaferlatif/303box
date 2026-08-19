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
  const NOTE={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};

  const td3={access:null,input:null,output:null,product:'',firmware:'',verified:false};

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
      .td3-direct-actions button.danger{border-color:#653833;background:#1d1111;color:#ff8a82}
      .td3-direct-actions button:disabled{opacity:.38;cursor:not-allowed}
      .td3-direct-status{min-height:18px;margin:9px 0 0;color:#8d8d95;font-size:.57rem;line-height:1.5}
      .td3-direct-status.good{color:#ddff37}.td3-direct-status.warn{color:#ffc765}.td3-direct-status.bad{color:#ff8179}
      .td3-direct-warning{margin:8px 0 0;color:#77777f;font-size:.55rem;line-height:1.5}
      @media(max-width:560px){.td3-direct-target{grid-template-columns:1fr 1fr}.td3-direct-target label:last-child{grid-column:1/-1}.td3-direct-actions{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function injectTd3Writer(){
    const card=$('[data-device="td3 td3mo"]');if(!card||$('#td3DirectBox'))return;
    const box=document.createElement('div');box.id='td3DirectBox';box.className='td3-direct-box';
    box.innerHTML=`
      <div class="td3-direct-head"><strong>TD-3 DIRECT WRITE</strong><small>EXPERIMENTAL / USB ONLY</small></div>
      <div class="td3-direct-target">
        <label><span>GROUP</span><select id="td3WriteGroup"><option value="0">I</option><option value="1">II</option><option value="2">III</option><option value="3">IV</option></select></label>
        <label><span>SECTION</span><select id="td3WriteSection"><option value="A">A</option><option value="B">B</option></select></label>
        <label><span>PATTERN</span><select id="td3WritePattern">${Array.from({length:8},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></label>
      </div>
      <div class="td3-direct-actions">
        <button id="td3ArmSysex" type="button">VERIFY USB / SYSEX</button>
        <button id="td3WritePattern" class="primary" type="button">BACKUP + WRITE</button>
        <button id="td3RestorePattern" class="danger" type="button">RESTORE LAST BACKUP</button>
        <button id="td3ReadPattern" type="button">READ TARGET ONLY</button>
      </div>
      <p id="td3DirectStatus" class="td3-direct-status"></p>
      <p class="td3-direct-warning"><span class="lang-en">Safety flow: identify the TD-3 over USB → read the target slot → save a browser backup → write → read it again and compare. Use a disposable pattern slot first.</span><span class="lang-tr">Güvenlik akışı: TD-3’ü USB üzerinden doğrula → hedef slotu oku → tarayıcıya yedekle → yaz → tekrar okuyup karşılaştır. İlk denemede önemsiz bir pattern slotu kullan.</span></p>`;
    card.appendChild(box);
    $('#td3ArmSysex')?.addEventListener('click',()=>armTd3(true));
    $('#td3ReadPattern')?.addEventListener('click',readOnly);
    $('#td3WritePattern')?.addEventListener('click',writeTd3);
    $('#td3RestorePattern')?.addEventListener('click',restoreTd3);
  }

  function td3Status(msg,kind=''){
    const el=$('#td3DirectStatus');if(!el)return;el.textContent=msg;el.className=`td3-direct-status ${kind}`.trim();
  }

  function target(){
    const group=Number($('#td3WriteGroup')?.value||0);
    const section=$('#td3WriteSection')?.value==='B'?'B':'A';
    const number=Math.max(1,Math.min(8,Number($('#td3WritePattern')?.value||1)));
    // Reverse-engineered TD-3 request uses raw slots 0..15: A1..A8, B1..B8.
    const requestSlot=(section==='B'?8:0)+(number-1);
    return{group,section,number,requestSlot,label:`${['I','II','III','IV'][group]} / ${section}${number}`};
  }

  const portName=p=>`${p?.manufacturer||''} ${p?.name||''}`.replace(/\s+/g,' ').trim();
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  const isTd3Name=s=>/td\s*-?\s*3/i.test(String(s||''));
  const samePrefix=a=>TD3_PREFIX.every((v,i)=>a[i]===v);

  function pickPorts(access){
    const router=window.__303boxMidiRouter?.state||{};
    const outputs=[...access.outputs.values()].filter(p=>p.state==='connected'&&isTd3Name(portName(p)));
    const inputs=[...access.inputs.values()].filter(p=>p.state==='connected'&&isTd3Name(portName(p)));
    let output=outputs.find(p=>p.id===router.outputId);
    if(!output&&router.outputName)output=outputs.find(p=>norm(portName(p))===norm(router.outputName));
    if(!output)output=outputs[0];
    if(!output)return{};
    const outKey=norm(portName(output));
    let input=inputs.find(p=>norm(portName(p))===outKey)||inputs.find(p=>norm(p.name)===norm(output.name))||inputs[0];
    return{input,output};
  }

  function waitMessage(input,test,timeout=1500){
    return new Promise((resolve,reject)=>{
      let timer=0;
      const done=()=>{clearTimeout(timer);input.removeEventListener('midimessage',onMsg)};
      const onMsg=e=>{const a=[...e.data];if(test(a)){done();resolve(a)}};
      input.addEventListener('midimessage',onMsg);
      timer=setTimeout(()=>{done();reject(new Error('timeout'))},timeout);
    });
  }

  async function transact(message,test,timeout=1500){
    const pending=waitMessage(td3.input,test,timeout);
    td3.output.send(message);
    return pending;
  }

  function asciiFrom(a,start){return String.fromCharCode(...a.slice(start,-1).filter(v=>v>0&&v<128)).trim()}

  async function armTd3(verbose=false){
    const device=selectedDevice();
    if(device!=='td3'&&device!=='td3mo'){
      td3Status(say('Select Behringer TD-3 or TD-3-MO in DEVICE first.','Önce CİHAZ bölümünden Behringer TD-3 veya TD-3-MO seç.'),'warn');
      return false;
    }
    if(!navigator.requestMIDIAccess){td3Status(say('Web MIDI is not available in this browser.','Bu tarayıcıda Web MIDI yok.'),'bad');return false}
    try{
      td3Status(say('Requesting SysEx permission…','SysEx izni isteniyor…'));
      const access=await navigator.requestMIDIAccess({sysex:true});
      const {input,output}=pickPorts(access);
      if(!input||!output)throw new Error('usb-port');
      await Promise.all([input.open(),output.open()]);
      td3.access=access;td3.input=input;td3.output=output;td3.verified=false;

      const prod=await transact(TD3_PRODUCT,a=>samePrefix(a)&&a[7]===0x07,1800);
      td3.product=asciiFrom(prod,8);
      if(!/^TD-3(?:-MO)?/i.test(td3.product))throw new Error('identity');

      try{
        const fw=await transact(TD3_FIRMWARE,a=>samePrefix(a)&&a[7]===0x09,900);
        td3.firmware=[fw[9],fw[10],fw[11]].filter(Number.isFinite).join('.');
      }catch(_){td3.firmware=''}

      // Non-destructive compatibility probe: a valid pattern response must arrive before WRITE is ever enabled.
      const tg=target();
      const raw=await requestPattern(tg);
      if(!validPattern(raw,tg.group))throw new Error('pattern-probe');
      td3.verified=true;
      const mo=/MO/i.test(td3.product);
      td3Status(`${td3.product}${td3.firmware?` v${td3.firmware}`:''} — ${tg.label} ${say('read OK','okundu')} ${mo?' / MO COMPATIBLE PROBE OK':''}`,'good');
      if(verbose)markCurrent();
      return true;
    }catch(err){
      td3.verified=false;
      const code=err?.message||'';
      const msg=code==='usb-port'
        ? say('TD-3 USB MIDI input + output were not found. Direct SysEx does not work through a generic DIN adapter.','TD-3 USB MIDI giriş + çıkışı bulunamadı. Direct SysEx genel DIN adaptörü üzerinden çalışmaz.')
        : code==='identity'
          ? say('The connected SysEx device did not identify itself as TD-3 / TD-3-MO. Aborted.','Bağlı SysEx cihazı kendini TD-3 / TD-3-MO olarak tanıtmadı. İşlem iptal edildi.')
          : code==='pattern-probe'
            ? say('Product detected, but the TD-3 pattern read protocol did not match. WRITE remains disabled.','Ürün bulundu ancak TD-3 pattern okuma protokolü eşleşmedi. WRITE kapalı kalıyor.')
            : say('Could not verify TD-3 SysEx. Check USB connection and browser SysEx permission.','TD-3 SysEx doğrulanamadı. USB bağlantısını ve tarayıcı SysEx iznini kontrol et.');
      td3Status(msg,'bad');return false;
    }
  }

  function validPattern(a,group){return Array.isArray(a)&&a.length>=123&&samePrefix(a)&&a[7]===0x78&&a[8]===group&&a[a.length-1]===0xF7}

  async function requestPattern(tg,timeout=1800){
    const req=[...TD3_PREFIX,0x77,tg.group,tg.requestSlot,0xF7];
    return transact(req,a=>validPattern(a,tg.group),timeout);
  }

  function patternSteps(){
    const notes=$$('#patternSheet .note-input');
    const octs=$$('#patternSheet .octave-cell');
    const exprs=$$('#patternSheet .accentSlide-cell');
    const gates=$$('#patternSheet .gate-cell');
    return Array.from({length:16},(_,i)=>({
      note:(notes[i]?.value||'').trim().toUpperCase(),
      oct:(octs[i]?.textContent||'').trim().toUpperCase(),
      expr:(exprs[i]?.textContent||'').trim().toUpperCase(),
      gate:(gates[i]?.textContent||'').trim()
    }));
  }

  function pair(v){v=Math.max(0,Math.min(127,Math.round(v)));return[(v>>4)&0x0F,v&0x0F]}
  function writePair(a,index,v){const p=pair(v);a[index]=p[0];a[index+1]=p[1]}
  function boolPair(a,index,v){a[index]=0;a[index+1]=v?1:0}
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

  function encodePattern(backup){
    const out=backup.slice();
    if(out.length<123)throw new Error('short-pattern');
    const steps=patternSteps();
    const ties=[],rests=[];
    for(let i=0;i<16;i++){
      const s=steps[i],isRest=!s.note||s.gate==='-'||!s.gate,isTie=!isRest&&s.gate==='○';
      rests[i]=isRest;ties[i]=isTie;
      let stored=0x18; // canonical inactive / base C value used by the reverse-engineered format.
      if(!isRest&&!isTie){
        const semitone=NOTE[s.note];
        if(semitone==null)throw new Error(`bad-note-${i+1}`);
        // TD-3 pattern pitch bytes are one octave below standard MIDI numbering.
        // Map the sheet's neutral octave to TD-3 C, then honor visible D/U only.
        stored=0x18+semitone+(s.oct==='D'?-12:s.oct==='U'?12:0);
        if(stored<0||stored>0x2F)throw new Error(`pitch-range-${i+1}`);
      }
      writePair(out,0x0C+i*2,stored);
      boolPair(out,0x2C+i*2,!isRest&&!isTie&&s.expr.includes('A'));
      boolPair(out,0x4C+i*2,!isRest&&!isTie&&s.expr.includes('S'));
    }
    out[0x6C]=0;out[0x6D]=0;       // straight 16th mode
    out[0x6E]=1;out[0x6F]=0;       // 0x10 = 16 steps, nibble-pair encoded
    const tieMask=mask16(ties),restMask=mask16(rests);
    tieMask.forEach((v,i)=>out[0x72+i]=v);
    restMask.forEach((v,i)=>out[0x76+i]=v);
    out[out.length-1]=0xF7;
    return out;
  }

  function comparable(a,b){
    if(!a||!b||a.length<123||b.length<123)return false;
    const ranges=[[0x0C,0x70],[0x72,0x7A]];
    return ranges.every(([from,to])=>{for(let i=from;i<to;i++)if(a[i]!==b[i])return false;return true});
  }

  function saveBackup(bytes,tg){
    try{localStorage.setItem(TD3_BACKUP,JSON.stringify({time:Date.now(),product:td3.product,firmware:td3.firmware,requestGroup:tg.group,requestSlot:tg.requestSlot,label:tg.label,bytes}))}catch(_){}
  }
  function loadBackup(){try{return JSON.parse(localStorage.getItem(TD3_BACKUP)||'null')}catch(_){return null}}

  async function readOnly(){
    if(!td3.verified&&!(await armTd3(false)))return;
    try{const tg=target(),raw=await requestPattern(tg);td3Status(`${tg.label} — ${raw.length} bytes ${say('read successfully. No write was performed.','başarıyla okundu. Yazma yapılmadı.')}`,'good')}
    catch(_){td3Status(say('Pattern read failed. Nothing was written.','Pattern okuma başarısız. Hiçbir şey yazılmadı.'),'bad')}
  }

  async function writeTd3(){
    const device=selectedDevice();
    if(device!=='td3'&&device!=='td3mo'){td3Status(say('Select TD-3 / TD-3-MO first.','Önce TD-3 / TD-3-MO seç.'),'warn');return}
    if(!td3.verified&&!(await armTd3(false)))return;
    try{
      window.__303boxMidiRouter?.panic?.();
      window.__303boxUnifiedEngine?.stopAll?.();
      const tg=target();
      td3Status(`${tg.label} — ${say('reading backup…','yedek okunuyor…')}`);
      const backup=await requestPattern(tg);
      saveBackup(backup,tg);
      const packet=encodePattern(backup);
      const warning=say(
        `${td3.product} ${tg.label} will be overwritten. A raw backup has been saved in this browser first. This protocol is reverse-engineered and experimental. Continue?`,
        `${td3.product} ${tg.label} üzerine yazılacak. Önce ham yedek bu tarayıcıya kaydedildi. Bu protokol tersine mühendislik ve deneyseldir. Devam edilsin mi?`);
      if(!window.confirm(warning)){td3Status(say('Cancelled. Backup kept; nothing written.','İptal edildi. Yedek saklandı; hiçbir şey yazılmadı.'),'warn');return}
      td3.output.send(packet);
      td3Status(`${tg.label} — ${say('written; verifying read-back…','yazıldı; geri okuma doğrulanıyor…')}`);
      await new Promise(r=>setTimeout(r,260));
      const verify=await requestPattern(tg,2200);
      if(!comparable(packet,verify))throw new Error('verify');
      td3Status(`${td3.product} ${tg.label} — ${say('DIRECT WRITE VERIFIED. Pattern memory matches the 303box sheet.','DIRECT WRITE DOĞRULANDI. Pattern hafızası 303box sayfasıyla eşleşiyor.')}`,'good');
    }catch(err){
      const m=String(err?.message||'');
      const msg=m.startsWith('pitch-range-')
        ? say(`Step ${m.split('-').pop()} is outside the conservative TD-3 pitch range. Adjust D/U and try again.`,`Adım ${m.split('-').pop()} güvenli TD-3 perde aralığının dışında. D/U ayarını değiştirip tekrar dene.`)
        : m==='verify'
          ? say('WRITE was sent, but read-back did not match. Do not trust this slot; use RESTORE LAST BACKUP.','WRITE gönderildi ancak geri okuma eşleşmedi. Bu slota güvenme; RESTORE LAST BACKUP kullan.')
          : say('TD-3 direct write failed. The last pre-write backup was kept when available.','TD-3 direct write başarısız. Varsa yazma öncesi son yedek korundu.');
      td3Status(msg,'bad');
    }
  }

  async function restoreTd3(){
    const backup=loadBackup();
    if(!backup?.bytes?.length){td3Status(say('No TD-3 backup is stored in this browser yet.','Bu tarayıcıda henüz TD-3 yedeği yok.'),'warn');return}
    if(!td3.verified&&!(await armTd3(false)))return;
    const label=backup.label||`G${backup.requestGroup} / P${backup.requestSlot}`;
    if(!window.confirm(say(`Restore the saved backup to ${label}?`,`Kayıtlı yedek ${label} slotuna geri yüklensin mi?`)))return;
    try{
      window.__303boxMidiRouter?.panic?.();
      td3.output.send(backup.bytes);
      await new Promise(r=>setTimeout(r,260));
      const tg={group:backup.requestGroup,requestSlot:backup.requestSlot,label};
      const verify=await requestPattern(tg,2200);
      if(!comparable(backup.bytes,verify))throw new Error('verify');
      td3Status(`${label} — ${say('backup restored and verified.','yedek geri yüklendi ve doğrulandı.')}`,'good');
    }catch(_){td3Status(say('Backup restore could not be verified.','Yedek geri yükleme doğrulanamadı.'),'bad')}
  }

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
    $('#midiDeviceProfile')?.addEventListener('change',()=>{td3.verified=false;markCurrent()});
    window.__303boxHardwareGuide={version:'0830',open:openGuide,close:closeGuide,armTd3,writeTd3,restoreTd3,get td3(){return{product:td3.product,firmware:td3.firmware,verified:td3.verified}}};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
