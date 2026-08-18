(() => {
  'use strict';

  // 303box transport fuse
  // The project has several historical playback layers. The current Acid Console
  // is the only layer allowed to own audible transport. This fuse guarantees
  // that legacy listeners can never create a second audible engine.

  const NativeAudioContext = window.AudioContext;
  const NativeWebkitAudioContext = window.webkitAudioContext;
  const AudioNodeProto = window.AudioNode?.prototype;
  const previousConnect = AudioNodeProto?.connect;
  const legacyContexts = new Set();
  const silentSinks = new WeakMap();

  const LEGACY_STACK = [
    '/app.js',
    'enhance.20260818-0845.js',
    'studio.20260818-0912.js',
    'rhythm-exact.20260818-1030.js',
    'sequencer-engine.20260818-1240.js',
    'sequencer-engine.20260818-1300.js'
  ];

  function isLegacyConstruction() {
    const stack = String(new Error().stack || '');
    return LEGACY_STACK.some(name => stack.includes(name));
  }

  function markContext(ctx) {
    if (!ctx || !isLegacyConstruction()) return ctx;
    try { Object.defineProperty(ctx, '__303boxLegacyMuted', { value:true, configurable:false }); }
    catch (_) { try { ctx.__303boxLegacyMuted = true; } catch (_) {} }
    legacyContexts.add(ctx);
    ctx.addEventListener?.('statechange', () => {
      if (ctx.state === 'closed') legacyContexts.delete(ctx);
    });
    return ctx;
  }

  function wrapContext(Native) {
    if (!Native) return Native;
    return class AudioContext303Fuse extends Native {
      constructor(...args) {
        super(...args);
        markContext(this);
      }
    };
  }

  if (NativeAudioContext) window.AudioContext = wrapContext(NativeAudioContext);
  if (NativeWebkitAudioContext && NativeWebkitAudioContext !== NativeAudioContext) {
    window.webkitAudioContext = wrapContext(NativeWebkitAudioContext);
  } else if (window.AudioContext) {
    window.webkitAudioContext = window.AudioContext;
  }

  // Even if a historical engine is accidentally started, its final connection
  // to the hardware destination is routed through a zero-gain sink.
  if (AudioNodeProto && previousConnect) {
    AudioNodeProto.connect = function(dest, ...args) {
      const ctx = this?.context;
      if (ctx?.__303boxLegacyMuted && dest === ctx.destination) {
        let sink = silentSinks.get(ctx);
        if (!sink) {
          sink = ctx.createGain();
          sink.gain.value = 0;
          silentSinks.set(ctx, sink);
          try { previousConnect.call(sink, dest); } catch (_) {}
        }
        return previousConnect.call(this, sink, ...args);
      }
      return previousConnect.call(this, dest, ...args);
    };
  }

  function closeLegacyContexts() {
    legacyContexts.forEach(ctx => {
      if (!ctx || ctx.state === 'closed') { legacyContexts.delete(ctx); return; }
      try { ctx.close(); } catch (_) {
        try { ctx.suspend(); } catch (_) {}
      }
    });
  }

  function engine() { return window.__303boxUnifiedEngine; }
  function typingTarget() {
    const el = document.activeElement;
    return !!el && (['INPUT','TEXTAREA','SELECT'].includes(el.tagName) || el.isContentEditable);
  }

  // One and only one keyboard transport owner.
  window.addEventListener('keydown', event => {
    if (event.code !== 'Space') return;
    if (typingTarget() || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.repeat) return;
    closeLegacyContexts();
    if (event.shiftKey) engine()?.toggleDrums?.();
    else engine()?.toggleAll?.();
  }, true);

  // One and only one click transport owner. Capture runs before old target/document
  // listeners, including listeners that survive a Generate DOM rebuild.
  window.addEventListener('click', event => {
    const target = event.target;
    if (!target?.closest) return;
    if (target.closest('#acidPlayAll')) {
      event.preventDefault(); event.stopImmediatePropagation();
      closeLegacyContexts(); engine()?.toggleAll?.(); return;
    }
    if (target.closest('#playButton')) {
      event.preventDefault(); event.stopImmediatePropagation();
      closeLegacyContexts(); engine()?.toggleBass?.(); return;
    }
    if (target.closest('#drumPlay')) {
      event.preventDefault(); event.stopImmediatePropagation();
      closeLegacyContexts(); engine()?.toggleDrums?.();
    }
  }, true);

  // Generate must never leave a historical transport alive in the background.
  window.addEventListener('click', event => {
    if (!event.target?.closest?.('#generateButton, #drumRandom')) return;
    closeLegacyContexts();
  }, true);

  window.__303boxTransportFuse = {
    version:'1400',
    closeLegacyContexts,
    get legacyContextCount(){ return legacyContexts.size; }
  };
})();
