(() => {
  'use strict';
  const root=location.pathname==='/'||location.pathname.endsWith('/index.html');
  const tr=()=>document.documentElement.lang==='tr';
  function link(rel,href,attrs={}){let el=document.head.querySelector(`link[rel="${rel}"][href="${href}"]`);if(!el){el=document.createElement('link');el.rel=rel;el.href=href;document.head.appendChild(el)}Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el}
  function meta(selector,attr,value){let el=document.head.querySelector(selector);if(!el){el=document.createElement('meta');const m=selector.match(/meta\[([^=]+)="([^"]+)"\]/);if(m)el.setAttribute(m[1],m[2]);document.head.appendChild(el)}el.setAttribute(attr,value)}

  const COPY={
    en:{
      title:'303box — 303 Pattern Sketchpad for Hardware',
      desc:'A browser sketchpad for writing, previewing and transferring 303 and rhythm patterns to hardware. Rule-based random starts, not AI composition and not a replacement for live performance.',
      kicker:'PATTERN SKETCHPAD / HARDWARE WORKFLOW',
      hero:'Sketch the pattern here. Perform it on your hardware.',
      lead:'303box is a faster way to write down, edit and audition 16-step ideas before taking them to real hardware. It does not make music for you: you choose the notes, keep or reject the random starting points, move the controls and perform the final result.',
      intentKicker:'WHAT 303BOX IS',
      intentTitle:'A notebook with sound — not a replacement for the musician.',
      intentLead:'The random buttons use simple musical rules to create a starting point; they are not an AI composition model. 303box exists to make tiny-step editing easier, let you hear the sketch, and help you move that idea onto hardware. The musical decisions and the performance remain yours.',
      cards:[
        ['01','Sketch faster','Type and edit a 16-step idea on a large screen instead of entering every step through a small hardware interface.'],
        ['02','Preview, do not outsource','Hear the pattern, change it, reject it, rebuild it. The preview is a workspace for decisions, not a finished performance.'],
        ['03','Finish on hardware','Send or record the pattern into supported gear, then shape, perform and save it on the device itself.']
      ],
      band:[['Write the idea faster','Use the browser as a readable pattern notebook.'],['Audition the sketch','Listen before committing the pattern to hardware.'],['Take it to the machine','Transfer the useful idea, then perform and save it on the device.']],
      seqTitle:'Write the pattern clearly. Then take it to the instrument.',
      seqIntro:'The grid is a practical notation and audition surface for 16-step ideas. Random is only a rule-based starting point; every musical decision can be edited by hand.',
      learnTitle:'A browser pattern notebook for real hardware workflow.',
      learnLead:'303box combines a readable 16-step editor, synchronized rhythm sketching, Web Audio preview, MIDI routing and pattern export. Its purpose is convenience: write and test an idea faster, then continue the real performance on your hardware.',
      faq:[
        ['What is 303box?','A browser-based 16-step pattern sketchpad for writing, previewing and transferring acid bass and rhythm ideas to hardware.'],
        ['Does 303box make music for me?','No. Random generation is rule-based and only supplies a starting point. You decide what to keep, edit the pattern, shape the sound and perform the result.'],
        ['Does it replace live performance?','No. The browser preview is a scratchpad. Live knob movement, arrangement, timing decisions, recording and the final performance still belong to the musician and the hardware.'],
        ['Can I use it with hardware?','Yes. You can use the visible pattern as a programming reference and, on supported browsers/devices, route MIDI or use the T-8 REC helper. Final WRITE/save stays on the hardware.']
      ]
    },
    tr:{
      title:'303box — Donanım için 303 Pattern Çalışma Alanı',
      desc:'303 ve ritim patternlerini daha kolay yazmak, dinlemek ve donanıma aktarmak için tarayıcı çalışma alanı. AI beste aracı değildir ve canlı performansın yerini almaz.',
      kicker:'PATTERN ÇALIŞMA ALANI / DONANIM AKIŞI',
      hero:'Pattern’i burada taslakla. Performansı cihazında yap.',
      lead:'303box, 16 adımlı fikirleri küçük donanım ekranında tek tek girmek yerine daha hızlı yazmak, düzenlemek ve denemek için oluşturuldu. Senin yerine müzik yapmaz: notaları sen seçersin, random sonucu sen kabul eder ya da değiştirirsin, kontrolleri ve final performansı yine sen yaparsın.',
      intentKicker:'303BOX NEDİR?',
      intentTitle:'Ses veren bir not defteri — müzisyenin yerine geçen bir sistem değil.',
      intentLead:'Random düğmeleri yalnızca basit müzikal kurallarla bir başlangıç taslağı oluşturur; AI beste modeli değildir. 303box küçük step girişini kolaylaştırmak, fikri hızlıca duymak ve işe yarayan pattern’i donanıma taşımak için vardır. Müzikal kararlar ve performans sende kalır.',
      cards:[
        ['01','Daha hızlı yaz','Her step’i küçük cihaz arayüzünden girmek yerine 16 adımlı fikri büyük ve okunaklı bir ekranda düzenle.'],
        ['02','Taslağı dinle, işi devretme','Pattern’i duy, değiştir, sil, yeniden kur. Tarayıcı önizlemesi bitmiş performans değil; karar verme alanıdır.'],
        ['03','Cihazda bitir','İşe yarayan fikri desteklenen donanıma gönder veya kaydet; tınıyı, canlı hareketi ve final WRITE işlemini cihazında yap.']
      ],
      band:[['Fikri daha hızlı yaz','Tarayıcıyı okunaklı bir pattern not defteri gibi kullan.'],['Taslağı dinle','Donanıma geçmeden önce pattern’i duy ve düzelt.'],['Cihaza taşı','İşe yarayan fikri aktar; performansı ve kaydı cihazda tamamla.']],
      seqTitle:'Pattern’i açıkça yaz. Sonra enstrümana taşı.',
      seqIntro:'Grid, 16 adımlı fikirleri yazmak ve dinlemek için pratik bir yüzeydir. Random yalnızca kurallı bir başlangıç taslağı verir; her müzikal karar elle değiştirilebilir.',
      learnTitle:'Gerçek donanım akışı için tarayıcı pattern not defteri.',
      learnLead:'303box; okunaklı 16-step editör, ritim taslağı, Web Audio önizleme, MIDI yönlendirme ve pattern çıktısını tek yerde toplar. Amacı kolaylık sağlamaktır: fikri daha hızlı yaz, test et, sonra gerçek performansa donanımda devam et.',
      faq:[
        ['303box nedir?','Acid bass ve ritim fikirlerini yazmak, önizlemek ve donanıma taşımak için tarayıcıda çalışan 16 adımlı pattern çalışma alanıdır.'],
        ['303box benim yerime müzik mi yapıyor?','Hayır. Random üretim basit kurallarla yalnızca başlangıç taslağı verir. Neyi tutacağına, neyi değiştireceğine, sound ve performansa sen karar verirsin.'],
        ['Canlı performansın yerini alıyor mu?','Hayır. Tarayıcıdaki ses bir taslak önizlemesidir. Canlı knob hareketleri, düzenleme kararları, kayıt ve final performans müzisyene ve donanıma aittir.'],
        ['Donanımla kullanabilir miyim?','Evet. Görünen pattern’i elle programlama referansı olarak kullanabilir; desteklenen tarayıcı ve cihazlarda MIDI veya T-8 REC yardımcısını kullanabilirsin. Final WRITE/save işlemi cihazda kalır.']
      ]
    }
  };

  function headSeo(){if(!root)return;const c=COPY[tr()?'tr':'en'];document.title=c.title;meta('meta[name="description"]','content',c.desc);meta('meta[property="og:title"]','content',c.title);meta('meta[property="og:description"]','content',c.desc);meta('meta[name="twitter:title"]','content',c.title);meta('meta[name="twitter:description"]','content',c.desc);link('canonical','https://303box.com/');document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(x=>x.remove());link('alternate','https://303box.com/',{hreflang:'en'});link('alternate','https://303box.com/tr/',{hreflang:'tr'});link('alternate','https://303box.com/',{hreflang:'x-default'})}

  function heroAndCore(){if(!root)return;const c=COPY[tr()?'tr':'en'];const h=document.querySelector('#heroTitle'),kick=document.querySelector('.hero-kicker b'),lead=document.querySelector('.hero-lead');if(h)h.textContent=c.hero;if(kick)kick.textContent=c.kicker;if(lead)lead.textContent=c.lead;
    const band=[...document.querySelectorAll('.product-band article')];band.forEach((a,i)=>{if(!c.band[i])return;const strong=a.querySelector('strong'),p=a.querySelector('p');if(strong)strong.textContent=c.band[i][0];if(p)p.textContent=c.band[i][1]});
    const seqTitle=document.querySelector('#sequencerHeading'),seqIntro=document.querySelector('.sequencer-section .section-intro>p');if(seqTitle)seqTitle.textContent=c.seqTitle;if(seqIntro)seqIntro.textContent=c.seqIntro;
  }

  function intent(){if(!root)return;const c=COPY[tr()?'tr':'en'];let sec=document.querySelector('#intent');if(!sec){sec=document.createElement('section');sec.id='intent';sec.className='intent-band';document.querySelector('.product-band')?.insertAdjacentElement('afterend',sec)}if(!sec)return;sec.innerHTML=`<div class="shell intent-inner"><p class="intent-kicker">${c.intentKicker}</p><h2 class="intent-title">${c.intentTitle}</h2><p class="intent-lead">${c.intentLead}</p><div class="intent-grid">${c.cards.map(x=>`<article><span>${x[0]}</span><b>${x[1]}</b><p>${x[2]}</p></article>`).join('')}</div></div>`}

  function learn(){if(!root)return;const c=COPY[tr()?'tr':'en'];let sec=document.querySelector('#seoLearn');if(!sec){sec=document.createElement('section');sec.id='seoLearn';sec.className='seo-learn';const faq=document.querySelector('#faq');(faq||document.querySelector('footer'))?.insertAdjacentElement('beforebegin',sec)}sec.innerHTML=`<div class="seo-shell"><p class="seo-kicker">${tr()?'303 ÇALIŞMA NOTLARI':'303 WORKFLOW NOTES'}</p><h2>${c.learnTitle}</h2><p class="seo-lead">${c.learnLead}</p><div class="seo-grid"><article class="seo-card"><h3>${tr()?'Random ne yapıyor?':'What does Random do?'}</h3><p>${tr()?'Random, acid müzik için belirlenmiş nota, gate, accent, slide ve tempo kurallarından bir başlangıç kombinasyonu çıkarır. Bir AI modelinin beste ettiği bitmiş müzik değildir; düzenlenmesi için bir taslaktır.':'Random combines note, gate, accent, slide and tempo rules into a starting pattern. It is not finished music composed by an AI model; it is a sketch intended to be edited.'}</p></article><article class="seo-card"><h3>${tr()?'Neden tarayıcı?':'Why the browser?'}</h3><p>${tr()?'Küçük donanım üzerindeki step girişini daha okunaklı ve hızlı hale getirir. Pattern’i yaz, dinle, düzelt ve sonra gerçek cihazına taşı.':'It makes step entry easier to read and faster than working only through a small hardware interface. Write, audition, edit, then take the useful version to the real device.'}</p></article><article class="seo-card"><h3>${tr()?'Performans nerede?':'Where is the performance?'}</h3><p>${tr()?'Final sound, knob hareketleri, zamanlama, kayıt ve sahne performansı burada otomatikleştirilmez. Bunlar hâlâ müzisyenin ve donanımın alanıdır.':'Final sound shaping, knob movement, timing choices, recording and stage performance are not automated here. Those remain the musician’s and the hardware’s job.'}</p></article></div><div class="seo-faq">${c.faq.map(x=>`<details><summary>${x[0]}</summary><p>${x[1]}</p></details>`).join('')}</div></div>`}
  }

  function faq(){if(!root)return;const c=COPY[tr()?'tr':'en'],items=[...document.querySelectorAll('#faq .faq-grid details')];items.forEach((d,i)=>{if(!c.faq[i])return;const s=d.querySelector('summary'),p=d.querySelector('p');if(s)s.textContent=c.faq[i][0];if(p)p.textContent=c.faq[i][1]})}

  function schema(){if(!root)return;document.querySelector('#seoSchema')?.remove();const c=COPY[tr()?'tr':'en'],s=document.createElement('script');s.id='seoSchema';s.type='application/ld+json';s.textContent=JSON.stringify({'@context':'https://schema.org','@graph':[{'@type':'WebSite','@id':'https://303box.com/#website',url:'https://303box.com/',name:'303box',inLanguage:['en','tr']},{'@type':'SoftwareApplication','@id':'https://303box.com/#software',name:'303box',url:'https://303box.com/',applicationCategory:'MultimediaApplication',operatingSystem:'Any modern web browser',isAccessibleForFree:true,description:c.desc,featureList:['16-step pattern sketchpad','Rule-based random starting patterns','Accent and slide editing','Synchronized rhythm sketching','Web Audio preview','Browser MIDI output','T-8 REC helper','Pattern image export']} ]});document.head.appendChild(s)}

  function apply(){headSeo();heroAndCore();intent();learn();faq();schema()}
  if(root){window.addEventListener('DOMContentLoaded',()=>setTimeout(apply,80));window.addEventListener('load',()=>setTimeout(apply,350));new MutationObserver(()=>setTimeout(apply,10)).observe(document.documentElement,{attributes:true,attributeFilter:['lang']})}
})();
