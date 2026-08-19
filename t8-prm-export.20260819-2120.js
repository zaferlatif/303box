(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const PART_TO_FIELD={bd:'BD',sd:'SD',tm:'LT',cp:'HT',ch:'CH',oh:'OH'};
  const FIELD_ORDER=['AC','BD','SD','LT','HT','CY','CH','OH'];
  const OFF='00000',ON='170AA';

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

  function downloadRhythmPrm(filename='T8_RHYTHM_PTN01_01.PRM'){
    const text=buildRhythmPrm();
    const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
    return text;
  }

  async function writeRhythmPrm(filename='T8_RHYTHM_PTN01_01.PRM'){
    if(typeof window.showDirectoryPicker!=='function')throw new Error('File System Access API unavailable');
    const dir=await window.showDirectoryPicker({mode:'readwrite'});
    if(!dir)return false;
    const permission=await dir.requestPermission?.({mode:'readwrite'});
    if(permission&&permission!=='granted')throw new Error('Write permission denied');
    const handle=await dir.getFileHandle(filename,{create:true}),writable=await handle.createWritable();
    await writable.write(buildRhythmPrm());await writable.close();return true;
  }

  function installTestAction(){
    const dialog=$('#hardwareGuideDialog');if(!dialog||$('#t8PrmExportAction'))return;
    const host=dialog.querySelector('.hardware-guide-body,.hardware-guide-content,.guide-body')||dialog;
    const box=document.createElement('section');box.id='t8PrmExportAction';box.className='t8-prm-export-action';
    box.innerHTML=`<strong>T-8 RHYTHM PRM</strong><p>Export the current 16-step rhythm using the decoded T-8 backup format.</p><div><button type="button" data-prm-download>DOWNLOAD PRM</button><button type="button" data-prm-write>WRITE TO FOLDER</button></div><small>First restore test targets a copied PTN01-01 rhythm slot. Back up the device before restoring.</small>`;
    box.querySelector('[data-prm-download]').addEventListener('click',()=>downloadRhythmPrm());
    const write=box.querySelector('[data-prm-write]');
    if(typeof window.showDirectoryPicker!=='function')write.hidden=true;
    else write.addEventListener('click',async()=>{write.disabled=true;try{await writeRhythmPrm();write.textContent='WRITTEN'}catch(err){console.warn('[303box] PRM write failed',err);write.textContent='WRITE FAILED'}finally{setTimeout(()=>{write.disabled=false;write.textContent='WRITE TO FOLDER'},1400)}});
    host.appendChild(box);

    const style=document.createElement('style');style.textContent=`
      .t8-prm-export-action{margin:18px 0 0;padding:14px;border:1px solid #41444d;border-radius:10px;background:#181a1e;color:#ededf0}
      .t8-prm-export-action>strong{display:block;color:#ddff37;font:850 .58rem/1 'JetBrains Mono',monospace;letter-spacing:.08em}
      .t8-prm-export-action>p,.t8-prm-export-action>small{display:block;margin:8px 0;color:#93969e;font-size:.7rem;line-height:1.45}
      .t8-prm-export-action>div{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .t8-prm-export-action button{min-height:42px;border:1px solid #59651c;border-radius:8px;background:#182008;color:#ddff37;font:800 .52rem/1 'JetBrains Mono',monospace}
      @media(max-width:520px){.t8-prm-export-action>div{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
  }

  document.addEventListener('303box:ready',installTestAction);
  if(document.readyState!=='loading')queueMicrotask(installTestAction);
  window.__303boxT8Prm={version:'2120',mapping:{...PART_TO_FIELD},readRhythm,buildRhythmPrm,downloadRhythmPrm,writeRhythmPrm};
})();