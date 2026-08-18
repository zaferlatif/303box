(() => {
  'use strict';

  const proto = window.AudioNode?.prototype;
  const previousConnect = proto?.connect;
  const gates = [];
  let requestedMode = 'browser';

  function audibleMode(){ return requestedMode === 'midi' ? 0 : 1; }

  function createGate(ctx, dest){
    const gain = ctx.createGain();
    gain.gain.value = audibleMode();
    try { previousConnect.call(gain, dest); } catch (_) {}
    const item = {ctx, gain, dest};
    gates.push(item);
    ctx.addEventListener?.('statechange', () => {
      if (ctx.state === 'closed') {
        const i = gates.indexOf(item);
        if (i >= 0) gates.splice(i, 1);
      }
    });
    return item;
  }

  if (proto && previousConnect) {
    proto.connect = function(dest, ...args){
      const ctx = this?.context;
      if (ctx?.__303boxUnifiedContext && dest === ctx.destination && !this.__303boxModeGate) {
        let item = gates.find(x => x.ctx === ctx && x.dest === dest);
        if (!item) item = createGate(ctx, dest);
        return previousConnect.call(this, item.gain, ...args);
      }
      return previousConnect.call(this, dest, ...args);
    };
  }

  function setMode(mode){
    requestedMode = ['browser','both','midi'].includes(mode) ? mode : 'browser';
    const target = audibleMode();
    gates.forEach(({ctx,gain}) => {
      if (!ctx || ctx.state === 'closed') return;
      try { gain.gain.setTargetAtTime(target, ctx.currentTime, .012); }
      catch (_) { gain.gain.value = target; }
    });
    document.documentElement.dataset.audioRoute = requestedMode;
  }

  window.__303boxBrowserOutputMode = {
    version:'1530',
    setMode,
    get mode(){ return requestedMode; }
  };
})();