(() => {
  'use strict';

  const COPY = {
    en: {
      kicker: 'Free browser acid sequencer',
      title: 'Turn sixteen steps into a living acid line.',
      lead: 'Program notes, rests, ties, accents and slides. Shape the filter, build a synchronized rhythm, hear the result instantly and route the pattern to MIDI hardware.',
      secondary: 'How it works'
    },
    tr: {
      kicker: 'Ücretsiz tarayıcı acid sequencer',
      title: 'On altı adımı yaşayan bir acid line’a dönüştür.',
      lead: 'Nota, es, bağ, vurgu ve kaydırmaları programla. Filtreyi şekillendir, senkron ritim kur, sonucu anında dinle ve istersen pattern’i MIDI donanımına gönder.',
      secondary: 'Nasıl çalışır?'
    }
  };

  let applying = false;

  function lang(){
    return document.documentElement.lang === 'tr' ? 'tr' : 'en';
  }

  function setText(el, value){
    if (el && el.textContent !== value) el.textContent = value;
  }

  function apply(){
    if (applying) return;
    applying = true;
    try {
      const c = COPY[lang()];
      setText(document.querySelector('.hero-kicker b'), c.kicker);
      setText(document.querySelector('#heroTitle'), c.title);
      setText(document.querySelector('.hero-lead'), c.lead);
      setText(document.querySelector('.hero-actions .secondary-cta'), c.secondary);
    } finally {
      applying = false;
    }
  }

  function observeHero(){
    const hero = document.querySelector('.hero');
    if (!hero || hero.dataset.stableHero) return;
    hero.dataset.stableHero = '1';
    new MutationObserver(() => queueMicrotask(apply)).observe(hero, {
      childList:true,
      characterData:true,
      subtree:true
    });
  }

  function settle(){
    apply();
    observeHero();
    [40,120,260,760,1400].forEach(ms => setTimeout(() => { apply(); observeHero(); }, ms));
  }

  new MutationObserver(() => queueMicrotask(apply)).observe(document.documentElement, {
    attributes:true,
    attributeFilter:['lang']
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', settle, {once:true});
  else settle();
  window.addEventListener('load', settle, {once:true});

  window.__303boxHeroStability = { version:'1500', apply };
})();