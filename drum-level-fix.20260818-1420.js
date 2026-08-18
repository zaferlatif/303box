(() => {
  'use strict';

  const selector = '#drums input[type="range"][data-level]';
  const EPSILON = 0.0001;

  function normalize(input) {
    if (!input?.matches?.(selector)) return;
    const raw = Number(input.value);
    if (!Number.isFinite(raw)) return;

    // Historical playback code uses `Number(value) || 80`, which incorrectly
    // turns a legitimate zero into 80. An inaudible positive epsilon keeps the
    // range thumb at the hard-left position while surviving that fallback.
    if (raw <= 0) input.value = String(EPSILON);

    const audible = raw <= 0 ? 0 : Math.max(0, Math.min(100, raw));
    input.dataset.audibleLevel = String(audible);
    input.setAttribute('aria-valuenow', String(audible));
    input.setAttribute('aria-valuetext', `${Math.round(audible)}%`);
    input.title = `${Math.round(audible)}%`;
  }

  function normalizeAll() {
    document.querySelectorAll(selector).forEach(normalize);
  }

  // Capture first so every playback layer reads the corrected value.
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

  // Drum UI is remounted by a few historical layers, so re-apply after those
  // mounts without creating additional audio/event ownership.
  const observer = new MutationObserver(() => normalizeAll());
  const start = () => {
    normalizeAll();
    observer.observe(document.body, { childList:true, subtree:true });
    [80, 220, 600, 1200, 2200].forEach(ms => setTimeout(normalizeAll, ms));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once:true });
  } else start();

  window.__303boxDrumLevelFix = { version:'1420', normalizeAll };
})();
