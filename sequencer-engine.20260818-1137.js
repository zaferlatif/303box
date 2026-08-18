(() => {
  'use strict';
  const version = '20260818-1452';

  const addCss = (key, href) => {
    if (document.querySelector(`link[data-303box-${key}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${href}?v=${version}`;
    link.dataset[`303box${key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`] = 'true';
    document.head.appendChild(link);
  };

  addCss('audio-ui', './ui-audio.20260818-1240.css');
  addCss('final-polish', './ui-polish.20260818-1255.css');
  addCss('acid-console', './acid-console.20260818-1340.css');
  addCss('seo-content', './seo.20260818-1315.css');
  addCss('compact-workstation', './compact-workstation.20260818-1430.css');
  addCss('console-io', './console-io.20260818-1440.css');
  addCss('unified-actions', './unified-actions.20260818-1450.css');

  const load = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${src}?v=${version}`;
    script.async = false;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  load('./transport-fuse.20260818-1410.js')
    .then(() => load('./drum-level-fix.20260818-1420.js'))
    .then(() => load('./acid-console.20260818-1340.js'))
    .then(() => load('./acid-console-guard.20260818-1343.js'))
    .then(() => load('./ui-audio.20260818-1240.js'))
    .then(() => load('./ui-polish.20260818-1255.js'))
    .then(() => load('./compact-workstation.20260818-1430.js'))
    .then(() => load('./bass-scope.20260818-1410.js'))
    .then(() => load('./seo.20260818-1315.js'))
    .catch(error => console.error('303box production loader', error));
})();