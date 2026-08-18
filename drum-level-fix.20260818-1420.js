(() => {
  'use strict';

  const selector = '#drums input[type="range"][data-level]';
  const EPSILON = '0.000000001';
  const nativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  const patched = new WeakSet();

  function nativeGet(input) {
    try { return nativeValue?.get ? nativeValue.get.call(input) : input.getAttribute('value'); }
    catch (_) { return input.getAttribute('value') || '0'; }
  }

  function patchValue(input) {
    if (!input?.matches?.(selector) || patched.has(input) || !nativeValue?.get || !nativeValue?.set) return;

    // Both historical drum engines use `Number(input.value) || 80`, which turns
    // a legitimate zero into 80%. Keep the browser's real range value at zero
    // (so the thumb is visually hard-left) while exposing an inaudible positive
    // value only to JavaScript readers. This fixes both engines without changing
    // their transport/audio ownership.
    try {
      Object.defineProperty(input, 'value', {
        configurable: true,
        enumerable: true,
        get() {
          const raw = nativeValue.get.call(this);
          const n = Number(raw);
          return Number.isFinite(n) && n <= 0 ? EPSILON : raw;
        },
        set(v) { nativeValue.set.call(this, v); }
      });
      patched.add(input);
    } catch (_) {}
  }

  function normalize(input) {
    if (!input?.matches?.(selector)) return;
    patchValue(input);
    const raw = Number(nativeGet(input));
    if (!Number.isFinite(raw)) return;
    const audible = Math.max(0, Math.min(100, raw));
    input.dataset.audibleLevel = String(audible);
    input.setAttribute('aria-valuenow', String(audible));
    input.setAttribute('aria-valuetext', `${Math.round(audible)}%`);
    input.title = `${Math.round(audible)}%`;
  }

  function normalizeAll() {
    document.querySelectorAll(selector).forEach(normalize);
  }

  document.addEventListener('input', event => {
    const input = event.target;
    if (!input?.matches?.(selector)) return;
    normalize(input);
  }, true);

  document.addEventListener('change', event => {
    const input = event.target;
    if (!input?.matches?.(selector)) return;
    normalize(input);
  }, true);

  const observer = new MutationObserver(() => normalizeAll());
  const start = () => {
    normalizeAll();
    observer.observe(document.body, { childList:true, subtree:true });
    [80,220,600,1200,2200].forEach(ms => setTimeout(normalizeAll, ms));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();

  window.__303boxDrumLevelFix = { version:'1440', normalizeAll };
})();