(() => {
  'use strict';
  const version = '20260818-1255';

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

  const load = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${src}?v=${version}`;
    script.async = false;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  load('./sequencer-engine.20260818-1240.js')
    .then(() => load('./ui-audio.20260818-1240.js'))
    .then(() => load('./ui-polish.20260818-1255.js'))
    .catch(error => console.error('303box audio loader', error));
})();
