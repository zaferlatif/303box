(() => {
  'use strict';

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const isTR=()=>document.documentElement.lang==='tr';
  const say=(en,tr)=>isTR()?tr:en;
  const VERSION='20260901-3200';
  const FAMILY='TD-3 / TD-3-MO';

  function injectStyle(){
    if($('#td3DirectStyle3200'))return;
    document.getElementById('td3DirectStyle')?.remove();
    const style=document.createElement('style');
    style.id='td3DirectStyle3200';
    style.textContent=`
      .td3-direct-box{margin-top:14px;padding:13px;border:1px solid #5f4f20;border-radius:10px;background:#15130d}
      .td3-direct-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px}
      .td3-direct-head strong{color:#ddff37;font:850 .56rem/1 JetBrains Mono,monospace;letter-spacing:.07em}
      .td3-direct-head small{color:#ffc765;font:800 .43rem/1 JetBrains Mono,monospace;letter-spacing:.055em}
      .td3-direct-target{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
      .td3-direct-target label{display:grid;gap:5px;min-width:0;color:#888891;font:800 .42rem/1 JetBrains Mono,monospace;letter-spacing:.055em}
      .td3-direct-target select{width:100%;min-width:0;height:36px;padding:0 34px 0 8px;border:1px solid #34343a;border-radius:7px;background:#101013;color:#e5e5e8}
      .td3-direct-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:9px}
      .td3-direct-actions button{min-width:0;min-height:38px;padding:6px 8px;border:1px solid #3b3b42;border-radius:7px;background:#17171b;color:#c9c9ce;font:850 .47rem/1.2 JetBrains Mono,monospace;cursor:pointer}
      .td3-direct-actions button.primary{border-color:#61731b;background:#192009;color:#ddff37}
      .td3-direct-actions button.primary.armed{border-color:#ddff37;background:#29340b;box-shadow:0 0 0 2px rgba(221,255,55,.12)}
      .td3-direct-actions button.danger{border-color:#653833;background:#1d1111;color:#ff8a82}
      .td3-direct-actions button:disabled{opacity:.45;cursor:not-allowed}
      .td3-direct-status{min-height:42px;margin:9px 0;padding:9px 10px;border:1px solid #303038;border-radius:7px;background:#101013;color:#b8b8bf;font-size:.57rem;line-height:1.5}
      .td3-direct-status.good{color:#ddff37}.td3-direct-status.warn{color:#ffc765}.td3-direct-status.bad{color:#ff8179}
      .td3-direct-warning{margin:8px 0 0;color:#898991;font-size:.55rem;line-height:1.5}
      @media(max-width:560px){.td3-direct-target,.td3-direct-actions{grid-template-columns:1fr}.td3-direct-head{align-items:flex-start;flex-direction:column}.td3-direct-actions button{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function cleanCards(){
    const dialog=$('#hardwareGuideDialog');if(!dialog)return;
    $$('.hardware-device-card',dialog).forEach(card=>{
      const ids=(card.dataset.device||'').split(/\s+/).filter(Boolean);
      if(ids.includes('t8')){card.dataset.device='t8';return}
      if(ids.includes('td3')||ids.includes('td3mo')){card.dataset.device='td3';card.classList.add('primary');return}
      card.remove();
    });
  }

  function familyCard(){
    const card=$('.hardware-device-card[data-device="td3"]');
    if(!card)return null;
    const heading=$('.hardware-device-title h3',card);if(heading)heading.textContent=`Behringer ${FAMILY}`;
    return card;
  }

  function targetLabel(){
    const group=Math.max(0,Math.min(3,Number($('#td3WriteGroup')?.value||0)|0));
    const section=$('#td3WriteSection')?.value==='B'?'B':'A';
    const number=Math.max(1,Math.min(8,Number($('#td3WriteNumber')?.value||1)|0));
    return `${['I','II','III','IV'][group]} / ${section}${number}`;
  }

  function injectWriter(){
    const card=familyCard();if(!card)return false;
    let box=$('#td3DirectBox');
    if(!box){
      box=document.createElement('div');box.id='td3DirectBox';box.className='td3-direct-box';
      box.innerHTML=`<div class="td3-direct-head"><strong>${FAMILY} DIRECT WRITE</strong><small>EXPERIMENTAL / USB ONLY</small></div>
        <div class="td3-direct-target">
          <label><span>GROUP</span><select id="td3WriteGroup"><option value="0">I</option><option value="1">II</option><option value="2">III</option><option value="3">IV</option></select></label>
          <label><span>SECTION</span><select id="td3WriteSection"><option value="A">A</option><option value="B">B</option></select></label>
          <label><span>PATTERN</span><select id="td3WriteNumber">${Array.from({length:8},(_,index)=>`<option value="${index+1}">${index+1}</option>`).join('')}</select></label>
        </div>
        <p id="td3DirectStatus" class="td3-direct-status warn" role="status" aria-live="polite" aria-atomic="true"></p>
        <div class="td3-direct-actions">
          <button id="td3ArmSysex" type="button">VERIFY USB / SYSEX</button>
          <button id="td3WritePattern" class="primary" type="button">BACKUP + WRITE</button>
          <button id="td3RestorePattern" class="danger" type="button">RESTORE LAST BACKUP</button>
          <button id="td3ReadPattern" type="button">TEST READ (NO WRITE)</button>
        </div>
        <p class="td3-direct-warning"><span class="lang-en">Safety flow: identify ${FAMILY} → read exact target → save browser backup → confirm write → short exclusive write → read back and compare. Other devices are rejected.</span><span class="lang-tr">Güvenlik akışı: ${FAMILY} kimliğini doğrula → tam hedefi oku → tarayıcı yedeği al → yazmayı onayla → kısa exclusive yazma → geri okuyup karşılaştır. Diğer cihazlar reddedilir.</span></p>`;
      card.appendChild(box);
    }else if(box.parentElement!==card)card.appendChild(box);
    const status=$('#td3DirectStatus',box);
    if(status&&(!status.textContent.trim()||status.dataset.idle==='true')){
      status.textContent=`${targetLabel()} — ${say('target selected. Nothing has been written.','hedef seçildi. Henüz hiçbir şey yazılmadı.')}`;
      status.dataset.idle='true';
    }
    return true;
  }

  function refresh(){
    injectStyle();cleanCards();
    const title=$('#hardwareGuideTitle');
    if(title)title.innerHTML=`<span class="lang-en">T-8 and ${FAMILY} hardware transfer</span><span class="lang-tr">T-8 ve ${FAMILY} donanım aktarımı</span>`;
    injectWriter();
  }

  function openGuide(){
    const dialog=$('#hardwareGuideDialog');if(!dialog)return;
    refresh();
    if(typeof dialog.showModal==='function'&&!dialog.open)dialog.showModal();else dialog.setAttribute('open','');
  }
  function closeGuide(){
    const dialog=$('#hardwareGuideDialog');if(!dialog)return;
    if(typeof dialog.close==='function'&&dialog.open)dialog.close();else dialog.removeAttribute('open');
  }

  function init(){
    refresh();
    document.addEventListener('click',event=>{
      if(event.target?.closest?.('#midiHardwareGuide,[data-hardware-guide-open]')){openGuide();return}
      if(event.target?.closest?.('#hardwareGuideClose'))closeGuide();
    },true);
    $('#hardwareGuideDialog')?.addEventListener('click',event=>{if(event.target===event.currentTarget)closeGuide()});
    document.addEventListener('303box:languagechange',refresh);
    document.addEventListener('303box:content-refresh',refresh);
    document.addEventListener('303box:ready',refresh);
    window.__303boxHardwareGuide={version:VERSION,open:openGuide,close:closeGuide,refresh};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
