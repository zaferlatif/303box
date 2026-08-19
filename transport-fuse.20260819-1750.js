(() => {
  'use strict';

  const NativeAudioContext = window.AudioContext;
  const NativeWebkitAudioContext = window.webkitAudioContext;
  const AudioNodeProto = window.AudioNode?.prototype;
  const nativeConnect = AudioNodeProto?.connect;
  const legacyContexts = new Set();
  const unifiedContexts = new Set();
  const silentSinks = new WeakMap();
  let actionLocked = false;

  const LEGACY = ['/app.js','studio.20260818-0912.js','rhythm-exact.20260818-1030.js'];
  const UNIFIED = ['acid-console.20260818-1340.js'];
  const stack = () => String(new Error().stack || '');
  const has = (list, value) => list.some(name => value.includes(name));

  function mark(ctx){
    if(!ctx) return ctx;
    const s = stack();
    if(has(LEGACY,s)){
      try{Object.defineProperty(ctx,'__303boxLegacyMuted',{value:true})}catch(_){ctx.__303boxLegacyMuted=true}
      legacyContexts.add(ctx);
    }
    if(has(UNIFIED,s)){
      try{Object.defineProperty(ctx,'__303boxUnifiedContext',{value:true})}catch(_){ctx.__303boxUnifiedContext=true}
      unifiedContexts.add(ctx);
    }
    ctx.addEventListener?.('statechange',()=>{
      if(ctx.state==='closed'){legacyContexts.delete(ctx);unifiedContexts.delete(ctx)}
    });
    return ctx;
  }

  function wrap(Native){
    if(!Native) return Native;
    return class AudioContext303Transport extends Native { constructor(...args){ super(...args); mark(this); } };
  }

  if(NativeAudioContext) window.AudioContext = wrap(NativeAudioContext);
  if(NativeWebkitAudioContext && NativeWebkitAudioContext !== NativeAudioContext) window.webkitAudioContext = wrap(NativeWebkitAudioContext);
  else if(window.AudioContext) window.webkitAudioContext = window.AudioContext;

  if(AudioNodeProto && nativeConnect){
    AudioNodeProto.connect = function(dest,...args){
      const ctx=this?.context;
      if(ctx?.__303boxLegacyMuted && dest===ctx.destination){
        let sink=silentSinks.get(ctx);
        if(!sink){
          sink=ctx.createGain(); sink.gain.value=0; silentSinks.set(ctx,sink);
          try{nativeConnect.call(sink,dest)}catch(_){}
        }
        return nativeConnect.call(this,sink,...args);
      }
      return nativeConnect.call(this,dest,...args);
    };
  }

  function closeSet(set){
    set.forEach(ctx=>{
      if(!ctx || ctx.state==='closed'){set.delete(ctx);return}
      try{const p=ctx.close();p?.catch?.(()=>{try{ctx.suspend()}catch(_){}})}catch(_){try{ctx.suspend()}catch(__){}}
    });
  }
  function closeLegacy(){closeSet(legacyContexts)}
  function closeUnified(){closeSet(unifiedContexts)}
  const engine=()=>window.__303boxUnifiedEngine;

  function unlockSoon(){setTimeout(()=>{actionLocked=false},110)}
  function run(action){
    if(actionLocked) return;
    actionLocked=true;
    closeLegacy();
    const e=engine();
    if(!e){unlockSoon();return}

    const startSolo = part => {
      const isBass = part==='bass';
      const active = isBass ? e.bassOn : e.drumsOn;
      if(active){
        isBass ? e.toggleBass?.() : e.toggleDrums?.();
        return;
      }
      // Dedicated section buttons are deliberately exclusive. This avoids hidden
      // cross-part states; use the Acid Console master button to run both.
      if(e.state!=='stopped') e.stopAll?.();
      setTimeout(()=>{
        const fresh=engine();
        if(!fresh) return;
        isBass ? fresh.toggleBass?.() : fresh.toggleDrums?.();
      },0);
    };

    if(action==='bass') startSolo('bass');
    else if(action==='drums') startSolo('drums');
    else if(action==='all'){
      if(e.state!=='stopped') e.stopAll?.();
      else e.toggleAll?.();
    }
    else if(action==='panic') e.stopAll?.();
    unlockSoon();
  }

  function typing(){
    const el=document.activeElement;
    return !!el && (['INPUT','TEXTAREA','SELECT'].includes(el.tagName)||el.isContentEditable);
  }

  function neutralizeLegacySync(){
    const sync=document.querySelector('#drumSync');
    if(sync){sync.checked=false;sync.disabled=true;sync.closest('label,.drum-switch')?.setAttribute('hidden','')}
  }

  window.addEventListener('click',event=>{
    const target=event.target;
    if(!target?.closest) return;
    let action='';
    if(target.closest('#acidPlayAll')) action='all';
    else if(target.closest('#playButton')) action='bass';
    else if(target.closest('#drumPlay')) action='drums';
    if(!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    run(action);
  },true);

  window.addEventListener('keydown',event=>{
    if(event.code!=='Space'||typing()||event.ctrlKey||event.metaKey||event.altKey||event.repeat) return;
    event.preventDefault();event.stopImmediatePropagation();run('all');
  },true);

  window.addEventListener('click',event=>{
    if(event.target?.closest?.('#generateButton,#drumRandom')) closeLegacy();
  },true);

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',neutralizeLegacySync,{once:true});
  else neutralizeLegacySync();
  window.addEventListener('load',neutralizeLegacySync,{once:true});
  window.addEventListener('pagehide',()=>{closeLegacy();closeUnified()});

  window.__303boxTransportFuse={version:'1750',run,closeLegacy,closeUnified};
})();
