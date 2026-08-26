(() => {
  'use strict';

  const VERSION='20260826-2980';
  const FAMILY='TD-3 / TD-3-MO';
  const $=(s,r=document)=>r.querySelector(s);
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  const words=s=>String(s||'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).filter(x=>!['midi','usb','input','output','in','out','port'].includes(x));
  const portName=p=>`${p?.manufacturer||''} ${p?.name||''}`.replace(/\s+/g,' ').trim();
  const isTd3=p=>{const n=norm(typeof p==='string'?p:portName(p));return n.includes('td3')||n.includes('td3mo')};
  const connected=p=>!!p&&p.state==='connected';

  function pairScore(input,output){
    const a=new Set(words(portName(input))),b=new Set(words(portName(output)));
    let score=0;for(const token of a)if(b.has(token))score+=token==='td3'||token==='td3mo'?8:2;
    if(norm(input?.manufacturer)===norm(output?.manufacturer))score+=3;
    if(norm(portName(input))===norm(portName(output)))score+=20;
    return score;
  }

  function chooseTd3Pair(access){
    if(!access)return null;
    const outputs=[...access.outputs.values()].filter(p=>connected(p)&&isTd3(p));
    const inputs=[...access.inputs.values()].filter(p=>connected(p)&&isTd3(p));
    if(!outputs.length||!inputs.length)return null;
    const router=window.__303boxMidiRouter?.state||{};
    let output=outputs.find(p=>p.id===router.outputId)||outputs.find(p=>norm(portName(p))===norm(router.outputName));
    if(!output&&outputs.length===1)output=outputs[0];
    if(!output){
      const ranked=outputs.map(o=>({o,score:Math.max(...inputs.map(i=>pairScore(i,o)))})).sort((a,b)=>b.score-a.score);
      if(ranked[0]&&(!ranked[1]||ranked[0].score>ranked[1].score))output=ranked[0].o;
    }
    if(!output)return null;
    let input=inputs.find(i=>norm(portName(i))===norm(portName(output)));
    if(!input&&inputs.length===1)input=inputs[0];
    if(!input){
      const ranked=inputs.map(i=>({i,score:pairScore(i,output)})).sort((a,b)=>b.score-a.score);
      if(ranked[0]&&(!ranked[1]||ranked[0].score>ranked[1].score))input=ranked[0].i;
    }
    return input?{input,output}:null;
  }

  function filteredAccess(access,pair){
    if(!pair)return access;
    const inputs=new Map([[pair.input.id,pair.input]]),outputs=new Map([[pair.output.id,pair.output]]);
    return new Proxy(access,{get(target,prop){
      if(prop==='inputs')return inputs;
      if(prop==='outputs')return outputs;
      const value=Reflect.get(target,prop,target);
      return typeof value==='function'?value.bind(target):value;
    }});
  }

  function installSysexPairing(){
    const proto=Object.getPrototypeOf(navigator);
    if(!proto||proto.__303boxTd3PortRecovery)return;
    const native=proto.requestMIDIAccess;
    if(typeof native!=='function')return;
    try{Object.defineProperty(proto,'__303boxTd3PortRecovery',{value:true,configurable:true})}catch(_){return}
    const wrapped=function(options){
      return native.call(this,options).then(access=>{
        if(!options?.sysex)return access;
        const pair=chooseTd3Pair(access);
        return pair?filteredAccess(access,pair):access;
      });
    };
    try{Object.defineProperty(proto,'requestMIDIAccess',{value:wrapped,configurable:true,writable:true})}
    catch(_){try{navigator.requestMIDIAccess=wrapped.bind(navigator)}catch(__){}}
  }

  function ensureOption(select,port){
    if(!select||!port)return;
    let option=[...select.options].find(o=>o.value===port.id);
    if(!option){option=new Option(portName(port),port.id);select.appendChild(option)}
    else if(option.textContent!==portName(port))option.textContent=portName(port);
  }

  function recoverRouter(){
    const api=window.__303boxMidiRouter,st=api?.state,access=st?.access;
    if(!st?.enabled||!access)return false;
    const outputs=[...access.outputs.values()].filter(connected),td3=outputs.filter(isTd3);
    if(!td3.length)return false;
    const current=outputs.find(p=>p.id===st.outputId);
    let chosen=current&&isTd3(current)?current:null;
    if(!chosen&&td3.length===1)chosen=td3[0];
    if(!chosen&&st.outputName)chosen=td3.find(p=>norm(portName(p))===norm(st.outputName))||null;
    if(!chosen)return false;

    const out=$('#midiRouterOut');
    ensureOption(out,chosen);
    if(out&&st.outputId!==chosen.id){out.disabled=false;out.value=chosen.id;out.dispatchEvent(new Event('change',{bubbles:true}))}

    setTimeout(()=>{
      const now=window.__303boxMidiRouter?.state||{},profile=$('#midiDeviceProfile');
      if(profile&&(now.outputId===chosen.id)&&(now.effective!=='td3'||now.choice==='auto')){
        profile.value='td3';profile.dispatchEvent(new Event('change',{bubbles:true}));
      }
      const option=profile?[...profile.options].find(o=>o.value==='td3'):null;
      if(option)option.textContent=FAMILY;
    },0);
    return true;
  }

  function armRecovery(){[80,220,500,1000,1800].forEach(ms=>setTimeout(recoverRouter,ms))}
  window.addEventListener('click',e=>{if(e.target?.closest?.('#midiRouterConnect'))armRecovery()},true);
  document.addEventListener('change',e=>{if(e.target?.matches?.('#midiRouterOut,#midiDeviceProfile'))setTimeout(recoverRouter,0)},true);
  document.addEventListener('303box:ready',armRecovery);
  document.addEventListener('303box:content-refresh',armRecovery);
  window.addEventListener('load',armRecovery,{once:true});

  installSysexPairing();
  armRecovery();
  window.__303boxTd3PortRecovery={version:VERSION,recover:recoverRouter,choosePair:chooseTd3Pair,isTd3};
})();