(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const PART_TO_FIELD={bd:'BD',sd:'SD',tm:'LT',cp:'HT',ch:'CH',oh:'OH'};
  const FIELD_ORDER=['AC','BD','SD','LT','HT','CY','CH','OH'];
  const OFF='00000',ON='170AA';
  let mountObserver=null;

  function isOn(part,step){
    const el=$(`#drums .drum-step[data-drum="${part}"][data-step="${step}"]`);
    return !!el&&(el.classList.contains('on')||el.getAttribute('aria-pressed')==='true');
  }

  function readRhythm(){
    return Array.from({length:16},(_,step)=>{
      const row={};Object.keys(PART_TO_FIELD).forEach(part=>row[part]=isOn(part,step));return row;
    });
  }

  function buildRhythmPrm(pattern=readRhythm()){
    const lines=['LENGTH\t= 16','SCALE\t= 1','SHUFFLE\t= 0','FLAM\t= 36'];
    for(let step=1;step<=32;step++){
      const values=Object.fromEntries(FIELD_ORDER.map(k=>[k,OFF]));
      if(step<=16){
        const row=pattern[step-1]||{};
        Object.entries(PART_TO_FIELD).forEach(([part,field])=>{if(row[part])values[field]=ON});
      }
      lines.push(`STEP ${step}\t= ${FIELD_ORDER.map(k=>`${k}=${values[k]}`).join(' ')}`);
    }
    return lines.join('\n')+'\n';
  }

  function downloadRhythmPrm(filename='RHYTHM_PTN01_01.PRM'){
    const text=buildRhythmPrm();
    const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
    return text;
  }

  async function writeRhythmPrm(filename='RHYTHM_PTN01_01.PRM'){
    const text=buildRhythmPrm();
    if(typeof window.showSaveFilePicker==='function'){
      const handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'T-8 rhythm pattern',accept:{'text/plain':['.PRM','.prm']}}]});
      const writable=await handle.createWritable();await writable.write(text);await writable.close();return true;
    }
    if(typeof window.showDirectoryPicker!=='function')throw new Error('File System Access API unavailable');
    const dir=await window.showDirectoryPicker({mode:'readwrite'});if(!dir)return false;
    const permission=await dir.requestPermission?.({mode:'readwrite'});if(permission&&permission!=='granted')throw new Error('Write permission denied');
    const handle=await dir.getFileHandle(filename,{create:true}),writable=await handle.createWritable();
    await writable.write(text);await writable.close();return true;
  }

  function installStyle(){
    if($('#t8PrmStyle2120'))return;
    const style=document.createElement('style');style.id='t8PrmStyle2120';style.textContent=`
      .t8-prm-export-action{margin:18px 0 0;padding:14px;border:1px solid #41444d;border-radius:10px;background:#181a1e;color:#ededf0}
      .t8-prm-export-action>strong{display:block;color:#ddff37;font:850 .58rem/1 'JetBrains Mono',monospace;letter-spacing:.08em}
      .t8-prm-export-action>p,.t8-prm-export-action>small{display:block;margin:8px 0;color:#93969e;font-size:.7rem;line-height:1.45}
      .t8-prm-export-action>div{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .t8-prm-export-action button{min-height:42px;border:1px solid #59651c;border-radius:8px;background:#182008;color:#ddff37;font:800 .52rem/1 'JetBrains Mono',monospace;cursor:pointer}
      .t8-prm-export-action button:disabled{opacity:.45;cursor:wait}
      @media(max-width:520px){.t8-prm-export-action>div{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
  }

  function installTestAction(){
    const dialog=$('#hardwareGuideDialog');if(!dialog)return false;
    if($('#t8PrmExportAction'))return true;
    installStyle();
    const t8Card=dialog.querySelector('[data-device="t8"]');
    const host=t8Card||dialog.querySelector('.hardware-guide-body,.hardware-guide-content,.guide-body')||dialog;
    const box=document.createElement('section');box.id='t8PrmExportAction';box.className='t8-prm-export-action';
    box.innerHTML=`<strong>T-8 RHYTHM PRM</strong><p>Current 16-step rhythm → decoded T-8 backup/restore format.</p><div><button type="button" data-prm-download>DOWNLOAD PRM</button><button type="button" data-prm-write>WRITE / REPLACE PRM</button></div><small>Test only on a disposable copied rhythm slot. Make a T-8 backup first.</small>`;
    box.querySelector('[data-prm-download]').addEventListener('click',()=>downloadRhythmPrm());
    const write=box.querySelector('[data-prm-write]');
    if(typeof window.showSaveFilePicker!=='function'&&typeof window.showDirectoryPicker!=='function')write.hidden=true;
    else write.addEventListener('click',async()=>{const original=write.textContent;write.disabled=true;try{await writeRhythmPrm();write.textContent='WRITTEN'}catch(err){if(err?.name!=='AbortError'){console.warn('[303box] PRM write failed',err);write.textContent='WRITE FAILED'}}finally{setTimeout(()=>{write.disabled=false;write.textContent=original},1400)}});
    host.appendChild(box);return true;
  }

  function ensureMount(){
    if(installTestAction()){mountObserver?.disconnect();mountObserver=null;return}
    if(mountObserver)return;
    mountObserver=new MutationObserver(()=>{if(installTestAction()){mountObserver.disconnect();mountObserver=null}});
    mountObserver.observe(document.documentElement,{childList:true,subtree:true});
  }

  document.addEventListener('303box:ready',ensureMount);
  document.addEventListener('click',e=>{if(e.target.closest?.('#midiHardwareGuide,[data-hardware-guide-open]'))setTimeout(ensureMount,0)},true);
  if(document.readyState!=='loading')queueMicrotask(ensureMount);else document.addEventListener('DOMContentLoaded',ensureMount,{once:true});
  window.__303boxT8Prm={version:'2120',mapping:{...PART_TO_FIELD},readRhythm,buildRhythmPrm,downloadRhythmPrm,writeRhythmPrm};
})();