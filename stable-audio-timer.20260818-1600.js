(() => {
  'use strict';
  const nativeSet=window.setTimeout.bind(window),nativeClear=window.clearTimeout.bind(window);
  let worker=null,nextId=910000000;const jobs=new Map();
  function ensureWorker(){
    if(worker)return worker;
    try{
      const src=`const jobs=new Map();onmessage=e=>{const m=e.data||{};if(m.t==='set'){const h=setTimeout(()=>{jobs.delete(m.id);postMessage(m.id)},m.delay);jobs.set(m.id,h)}else if(m.t==='clear'){const h=jobs.get(m.id);if(h)clearTimeout(h);jobs.delete(m.id)}}`;
      worker=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
      worker.onmessage=e=>{const id=e.data,j=jobs.get(id);if(!j)return;jobs.delete(id);try{j.fn(...j.args)}catch(err){setTimeout(()=>{throw err},0)}};
      return worker;
    }catch(_){return null}
  }
  function fromAcidConsole(){
    try{return String(new Error().stack||'').includes('acid-console.20260818-1340.js')}catch(_){return false}
  }
  window.setTimeout=function(fn,delay=0,...args){
    const d=Number(delay)||0;
    if(typeof fn==='function'&&d<=35&&fromAcidConsole()){
      const w=ensureWorker();if(w){const id=nextId++;jobs.set(id,{fn,args});w.postMessage({t:'set',id,delay:Math.max(0,d)});return id}
    }
    return nativeSet(fn,d,...args);
  };
  window.clearTimeout=function(id){
    if(jobs.has(id)){jobs.delete(id);try{worker?.postMessage({t:'clear',id})}catch(_){};return}
    nativeClear(id);
  };
  window.__303boxStableAudioTimer={version:'1600',get pending(){return jobs.size}};
})();