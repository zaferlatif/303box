(() => {
  'use strict';
  const version = '20260818-1248';
  if (!document.querySelector('link[data-303box-audio-ui]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `./ui-audio.20260818-1240.css?v=${version}`;
    link.dataset['303boxAudioUi'] = 'true';
    document.head.appendChild(link);
  }
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
    .catch(error => console.error('303box audio loader', error));
})();