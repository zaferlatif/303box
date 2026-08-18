(() => {
  'use strict';
  const root = location.pathname === '/' || location.pathname.endsWith('/index.html');
  const tr = () => document.documentElement.lang === 'tr';

  function link(rel, href, attrs={}) {
    let el = document.head.querySelector(`link[rel="${rel}"][href="${href}"]`);
    if (!el) { el=document.createElement('link'); el.rel=rel; el.href=href; document.head.appendChild(el); }
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
    return el;
  }
  function meta(selector, attr, value) {
    let el=document.head.querySelector(selector);
    if(!el){el=document.createElement('meta'); const m=selector.match(/meta\[([^=]+)="([^"]+)"\]/); if(m)el.setAttribute(m[1],m[2]); document.head.appendChild(el)}
    el.setAttribute(attr,value);
  }

  function headSeo(){
    if(!root) return;
    const isTr=tr();
    const title=isTr?'Ücretsiz Online 303 Acid Sequencer ve Pattern Oluşturucu | 303box':'Free Online 303 Acid Sequencer & Acid House Maker | 303box';
    const desc=isTr?'Tarayıcıda ücretsiz 16 adımlı 303 acid pattern oluştur, accent ve slide programla, ritim ekle, MIDI ile donanıma gönder ve pattern görselini indir.':'Create 16-step 303 acid patterns online for free. Program accent, slide, octave and rhythm, hear the line instantly, send browser MIDI and export your pattern.';
    document.title=title;
    meta('meta[name="description"]','content',desc);
    meta('meta[property="og:title"]','content',title);
    meta('meta[property="og:description"]','content',desc);
    meta('meta[name="twitter:title"]','content',title);
    meta('meta[name="twitter:description"]','content',desc);
    link('canonical','https://303box.com/');
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(x=>x.remove());
    link('alternate','https://303box.com/',{hreflang:'en'});
    link('alternate','https://303box.com/tr/',{hreflang:'tr'});
    link('alternate','https://303box.com/',{hreflang:'x-default'});
  }

  const COPY={
    en:{
      kicker:'303 KNOWLEDGE BASE',
      h2:'A free online 303 acid sequencer built for real acid-house workflow.',
      lead:'303box combines a 16-step acid bassline sequencer, synchronized rhythm machine, live Web Audio preview, browser MIDI and image export. It is free, works directly in a modern browser and requires no account or installation.',
      facts:[['16','steps'],['FREE','no account'],['MIDI','browser output'],['JPG','pattern export']],
      cards:[
        ['How to make an acid bassline','Start with a small note set and a strong rhythm. Use rests to create bounce, accents to create pressure and slides only where one pitch should flow into the next. The classic acid effect comes from repeating the pattern while moving cutoff, resonance, envelope modulation and decay.'],
        ['Accent, slide and octave','Accent changes the energy of a step; slide keeps the line connected as pitch moves toward the next note; U and D move a step one octave up or down. These three controls create more character than simply adding more notes.'],
        ['What BPM works for acid house?','Classic acid house often lives around 118–135 BPM, while harder acid techno and rave patterns commonly move faster. 303box can generate musically related bass and rhythm ideas across several acid-oriented tempo ranges.'],
        ['Browser MIDI + hardware','When Web MIDI is supported, the pattern can be routed to a connected MIDI output while the browser preview remains available. This makes 303box useful both as a standalone idea generator and as a front end for external acid hardware.']
      ],
      steps:['Choose a waveform and set a tempo.','Program notes, rests and ties across 16 steps.','Add U/D octave moves, Accent and Slide for movement.','Shape cutoff, resonance, envelope modulation, decay, tune, delay and distortion.','Add a synchronized rhythm, then play in the browser or route the pattern through MIDI.'],
      faq:[
        ['Is 303box a free online 303 sequencer?','Yes. The sequencer runs in the browser with no account, plugin or software installation required.'],
        ['Does it work on phones and tablets?','Yes. The interface is responsive and the step grids can be edited on touch devices. Web MIDI availability depends on the browser and operating system.'],
        ['What makes a 303 pattern sound like acid?','Rhythmic note placement, rests, octave jumps, accent, slide and resonant filter movement matter more than complex melodies.'],
        ['Can I use it with hardware?','Yes, on browsers that expose Web MIDI and when a real MIDI output is connected. You can also export the visible pattern as an image for hardware programming.']
      ],
      guide:'Read the acid house guide', pattern:'Learn 303 pattern programming', turkish:'Türkçe 303box'
    },
    tr:{
      kicker:'303 BİLGİ MERKEZİ',
      h2:'Gerçek acid house akışı için ücretsiz online 303 sequencer.',
      lead:'303box; 16 adımlı acid bass sequencer, senkron ritim makinesi, canlı Web Audio önizleme, tarayıcı MIDI çıkışı ve pattern görseli dışa aktarma özelliklerini tek yerde toplar. Ücretsizdir, modern tarayıcıda çalışır ve hesap ya da kurulum istemez.',
      facts:[['16','adım'],['ÜCRETSİZ','hesap yok'],['MIDI','tarayıcı çıkışı'],['JPG','pattern çıktısı']],
      cards:[
        ['Acid bassline nasıl yapılır?','Az sayıda nota ve güçlü ritimle başla. Groove için es kullan, baskı noktalarında accent ekle ve yalnızca bir perdenin diğerine akmasını istediğin yerde slide kullan. Pattern dönerken cutoff, resonance, envelope modulation ve decay hareketi acid karakterini oluşturur.'],
        ['Accent, slide ve oktav','Accent adımın enerjisini yükseltir; slide sesi kesmeden bir sonraki perdeye taşır; U ve D adımı bir oktav yukarı veya aşağı alır. Daha fazla nota eklemek yerine bu üç kontrolü doğru kullanmak çoğu zaman daha etkilidir.'],
        ['Acid house kaç BPM olur?','Klasik acid house çoğunlukla 118–135 BPM çevresindedir; daha sert acid techno ve rave patternleri daha hızlı olabilir. 303box farklı acid profillerine uygun tempo aralıklarında ilişkili bass ve ritim fikirleri üretebilir.'],
        ['Tarayıcı MIDI + donanım','Web MIDI desteklenen tarayıcılarda pattern bağlı bir MIDI çıkışına yönlendirilebilir. Böylece 303box hem bağımsız fikir üreticisi hem de harici acid donanımı için tarayıcı tabanlı bir ön yüz olarak kullanılabilir.']
      ],
      steps:['Dalga formunu seç ve tempoyu ayarla.','16 adım boyunca nota, es ve bağları programla.','Hareket için U/D oktav, Accent ve Slide ekle.','Cutoff, resonance, env mod, decay, tune, delay ve distortion ayarlarını şekillendir.','Senkron ritim ekle; tarayıcıda dinle veya MIDI ile donanıma gönder.'],
      faq:[
        ['303box ücretsiz online 303 sequencer mı?','Evet. Hesap, eklenti veya yazılım kurulumu gerekmeden doğrudan tarayıcıda çalışır.'],
        ['Telefonda ve tablette çalışır mı?','Evet. Arayüz responsive tasarlanmıştır ve step gridleri dokunmatik cihazlarda düzenlenebilir. Web MIDI desteği tarayıcı ve işletim sistemine bağlıdır.'],
        ['Bir 303 patternini acid yapan nedir?','Karmaşık melodiden çok ritmik nota yerleşimi, esler, oktav sıçramaları, accent, slide ve rezonanslı filtre hareketi belirleyicidir.'],
        ['Donanımla kullanabilir miyim?','Web MIDI destekleyen tarayıcı ve gerçek bir MIDI çıkışı varsa evet. Ayrıca pattern görselini indirerek donanıma elle programlamak için kullanabilirsin.']
      ],
      guide:'Acid house rehberini oku', pattern:'303 pattern programlamayı öğren', turkish:'English 303box'
    }
  };

  function hero(){
    if(!root) return;
    const isTr=tr();
    const h=document.querySelector('#heroTitle');
    const kick=document.querySelector('.hero-kicker b');
    const lead=document.querySelector('.hero-lead');
    if(h) h.textContent=isTr?'Ücretsiz online 303 sequencer ile acid house pattern oluştur.':'Build acid house with a free online 303 sequencer.';
    if(kick) kick.textContent=isTr?'Ücretsiz online acid house pattern oluşturucu':'Free online acid house pattern maker';
    if(lead) lead.textContent=isTr?'16 adımlı 303 pattern yaz, accent ve slide ekle, senkron ritim oluştur, sesi tarayıcıda dinle ve istersen MIDI donanımına gönder.':'Program a 16-step 303 pattern, add accent and slide, build synchronized rhythm, hear it live in the browser and send it to MIDI hardware when you want.';
  }

  function learn(){
    if(!root) return;
    const c=COPY[tr()?'tr':'en'];
    let sec=document.querySelector('#seoLearn');
    if(!sec){sec=document.createElement('section');sec.id='seoLearn';sec.className='seo-learn';const faq=document.querySelector('#faq');(faq||document.querySelector('footer'))?.insertAdjacentElement('beforebegin',sec)}
    sec.innerHTML=`<div class="seo-shell"><p class="seo-kicker">${c.kicker}</p><h2>${c.h2}</h2><p class="seo-lead">${c.lead}</p><div class="seo-facts">${c.facts.map(x=>`<div class="seo-fact"><strong>${x[0]}</strong><span>${x[1]}</span></div>`).join('')}</div><div class="seo-grid">${c.cards.map(x=>`<article class="seo-card"><h3>${x[0]}</h3><p>${x[1]}</p></article>`).join('')}<article class="seo-card"><h3>${tr()?'303 pattern: hızlı başlangıç':'303 pattern: quick start'}</h3><ol>${c.steps.map(x=>`<li>${x}</li>`).join('')}</ol></article><article class="seo-card"><h3>${tr()?'Neden tarayıcıda?':'Why use a browser sequencer?'}</h3><p>${tr()?'Fikir ile ses arasındaki mesafeyi kısaltır: kurulum yok, proje açma yok. Patterni yazıp anında dinleyebilir, görsel olarak saklayabilir veya MIDI üzerinden başka bir cihaza gönderebilirsin.':'It reduces the distance between an idea and sound: no installation and no project setup. Write a pattern, hear it immediately, save a visual reference or route it to another device over MIDI.'}</p></article></div><div class="seo-links"><a class="seo-link" href="${tr()?'/tr/acid-house-rehberi.html':'/acid-house-guide.html'}"><small>ACID HOUSE</small><strong>${c.guide}</strong></a><a class="seo-link" href="${tr()?'/tr/303-pattern-rehberi.html':'/303-pattern-guide.html'}"><small>303 PATTERN</small><strong>${c.pattern}</strong></a></div><div class="seo-faq">${c.faq.map(x=>`<details><summary>${x[0]}</summary><p>${x[1]}</p></details>`).join('')}</div></div>`;
  }

  function schema(){
    if(!root) return;
    document.querySelector('#seoSchema')?.remove();
    const s=document.createElement('script');s.id='seoSchema';s.type='application/ld+json';s.textContent=JSON.stringify({
      '@context':'https://schema.org','@graph':[
        {'@type':'WebSite','@id':'https://303box.com/#website',url:'https://303box.com/',name:'303box',inLanguage:['en','tr']},
        {'@type':'SoftwareApplication','@id':'https://303box.com/#software',name:'303box',url:'https://303box.com/',applicationCategory:'MultimediaApplication',operatingSystem:'Any modern web browser',isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'},description:'Free browser-based 16-step 303 acid sequencer and synchronized rhythm machine with Web Audio preview, MIDI output and pattern export.',featureList:['16-step 303 pattern sequencer','Accent and slide','Octave up and down','Synchronized rhythm machine','Web Audio preview','Browser MIDI output','Live scope and FFT','Pattern image export']}
      ]
    });document.head.appendChild(s);
  }

  function apply(){headSeo();hero();learn();schema()}
  if(root){
    window.addEventListener('DOMContentLoaded',()=>setTimeout(apply,160));
    window.addEventListener('load',()=>setTimeout(apply,700));
    new MutationObserver(()=>setTimeout(apply,20)).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  }
})();