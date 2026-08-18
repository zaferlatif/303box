(() => {
  'use strict';

  const NativeAudioContext = window.AudioContext;
  const NativeWebkitAudioContext = window.webkitAudioContext;
  const AudioNodeProto = window.AudioNode?.prototype;
  const previousConnect = AudioNodeProto?.connect;

  const legacyContexts = new Set();
  const unifiedContexts = new Set();
  const silentSinks = new WeakMap();
  let lockUntil = 0;

  const LEGACY_STACK = [
    '/app.js',
    'enhance.20260818-0845.js',
    'studio.20260818-0912.js',
    'rhythm-exact.20260818-1030.js',
    'sequencer-engine.20260818-1240.js',
    'sequencer-engine.20260818-1300.js'
  ];
  const UNIFIED_STACK = ['acid-console.20260818-1340.js'];

  function stackText(){ return String(new Error().stack || ''); }
  function stackHas(names, stack){ return names.some(name => stack.includes(name)); }

  function markContext(ctx){
    if (!ctx) return ctx;
    const stack = stackText();
    if (stackHas(LEGACY_STACK, stack)) {
      try { Object.defineProperty(ctx,'__303boxLegacyMuted',{value:true,configurable:false}); }
      catch (_) { try { ctx.__303boxLegacyMuted = true; } catch (_) {} }
      legacyContexts.add(ctx);
    }
    if (stackHas(UNIFIED_STACK, stack)) {
      try { Object.defineProperty(ctx,'__303boxUnifiedContext',{value:true,configurable:false}); }
      catch (_) { try { ctx.__303boxUnifiedContext = true; } catch (_) {} }
      unifiedContexts.add(ctx);
    }
    ctx.addEventListener?.('statechange',()=>{
      if (ctx.state === 'closed') { legacyContexts.delete(ctx); unifiedContexts.delete(ctx); }
    });
    return ctx;
  }

  function wrapContext(Native){
    if (!Native) return Native;
    return class AudioContext303Fuse extends Native {
      constructor(...args){ super(...args); markContext(this); }
    };
  }

  if (NativeAudioContext) window.AudioContext = wrapContext(NativeAudioContext);
  if (NativeWebkitAudioContext && NativeWebkitAudioContext !== NativeAudioContext) window.webkitAudioContext = wrapContext(NativeWebkitAudioContext);
  else if (window.AudioContext) window.webkitAudioContext = window.AudioContext;

  if (AudioNodeProto && previousConnect) {
    AudioNodeProto.connect = function(dest, ...args){
      const ctx = this?.context;
      if (ctx?.__303boxLegacyMuted && dest === ctx.destination) {
        let sink = silentSinks.get(ctx);
        if (!sink) {
          sink = ctx.createGain(); sink.gain.value = 0; silentSinks.set(ctx,sink);
          try { previousConnect.call(sink,dest); } catch (_) {}
        }
        return previousConnect.call(this,sink,...args);
      }
      return previousConnect.call(this,dest,...args);
    };
  }

  function closeSet(set){
    set.forEach(ctx=>{
      if (!ctx || ctx.state === 'closed') { set.delete(ctx); return; }
      try {
        const p = ctx.close();
        if (p?.catch) p.catch(()=>{ try { ctx.suspend(); } catch (_) {} });
      } catch (_) { try { ctx.suspend(); } catch (_) {} }
    });
  }
  function closeLegacyContexts(){ closeSet(legacyContexts); }
  function closeUnifiedContexts(){ closeSet(unifiedContexts); }
  function engine(){ return window.__303boxUnifiedEngine; }

  function typingTarget(){
    const el = document.activeElement;
    return !!el && (['INPUT','TEXTAREA','SELECT'].includes(el.tagName) || el.isContentEditable);
  }

  function finalizeStop(){
    setTimeout(()=>{ if (engine()?.state === 'stopped') closeUnifiedContexts(); },70);
  }

  function invoke(method){
    const now = performance.now();
    if (now < lockUntil) return;
    lockUntil = now + 80;
    closeLegacyContexts();
    const e = engine();
    if (!e || typeof e[method] !== 'function') return;
    if (e.state === 'starting') {
      e.stopAll?.();
      finalizeStop();
      return;
    }
    e[method]();
    finalizeStop();
  }

  window.addEventListener('keydown',event=>{
    if (event.code !== 'Space') return;
    if (typingTarget() || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.repeat) return;
    invoke(event.shiftKey ? 'toggleDrums' : 'toggleAll');
  },true);

  window.addEventListener('click',event=>{
    const target = event.target;
    if (!target?.closest) return;
    let method = '';
    if (target.closest('#acidPlayAll')) method = 'toggleAll';
    else if (target.closest('#playButton')) method = 'toggleBass';
    else if (target.closest('#drumPlay')) method = 'toggleDrums';
    if (!method) return;
    event.preventDefault(); event.stopImmediatePropagation();
    invoke(method);
  },true);

  window.addEventListener('click',event=>{
    if (!event.target?.closest?.('#generateButton, #drumRandom')) return;
    closeLegacyContexts();
  },true);

  window.addEventListener('pagehide',()=>{ closeLegacyContexts(); closeUnifiedContexts(); });

  window.__303boxTransportFuse = {
    version:'1530', invoke, closeLegacyContexts, closeUnifiedContexts,
    get legacyContextCount(){ return legacyContexts.size; },
    get unifiedContextCount(){ return unifiedContexts.size; }
  };
})();