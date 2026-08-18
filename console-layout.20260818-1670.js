(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  let raf=0;

  function place(){
    raf=0;
    const consoleEl=$('#acidConsole');
    const grid=consoleEl?.querySelector('.acid-console-grid');
    const io=consoleEl?.querySelector('.sheet-io.acid-console-io')||$('.sheet-io.acid-console-io');
    const analyzer=consoleEl?.querySelector('.mini-analyzer')||$('.mini-analyzer');
    const midi=consoleEl?.querySelector('.midi-compact')||$('.midi-compact');
    if(!consoleEl||!grid||!io||!analyzer||!midi)return false;

    const mobile=window.matchMedia('(max-width:760px)').matches;
    if(mobile){
      let cell=grid.querySelector('.acid-console-scope-cell');
      if(!cell){
        cell=document.createElement('div');
        cell.className='acid-console-cell acid-console-scope-cell';
        grid.appendChild(cell);
      }
      if(analyzer.parentElement!==cell)cell.appendChild(analyzer);
      analyzer.classList.add('scope-in-console-grid');
      io.classList.add('midi-only-io');
      if(midi.parentElement!==io)io.appendChild(midi);
    }else{
      analyzer.classList.remove('scope-in-console-grid');
      io.classList.remove('midi-only-io');
      if(analyzer.parentElement!==io)io.insertBefore(analyzer,midi);
      grid.querySelector('.acid-console-scope-cell')?.remove();
    }
    io.classList.add('io-layout-ready');
    consoleEl.classList.add('console-layout-ready');
    return true;
  }

  function queue(){if(raf)return;raf=requestAnimationFrame(place)}
  const settle=()=>[0,60,180,420,900,1600].forEach(ms=>setTimeout(place,ms));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settle,{once:true});else settle();
  window.addEventListener('load',settle,{once:true});
  window.addEventListener('resize',queue,{passive:true});
  new MutationObserver(m=>{
    if(m.some(x=>x.type==='childList'&&x.addedNodes.length))queue();
  }).observe(document.documentElement,{childList:true,subtree:true});
  window.__303boxConsoleLayout={version:'1670',place};
})();