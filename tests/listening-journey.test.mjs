import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import test from 'node:test';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const {examples}=createRequire(import.meta.url)('../learning-examples.20260928.js');
const manifest=JSON.parse(read('assets/listening/manifest.json'));

test('A/B recordings isolate the advertised decision and preserve the original teaching patterns',()=>{
  const expected={'sparse-a':[6],'one-note':[13],'slide-tension':[3,14],offbeat:[1,2],'accent-map':[1,5,9,14]};
  for(const [key,{a,b,changed}]of Object.entries(manifest.examples)){
    assert.deepEqual(changed,expected[key]);
    assert.deepEqual(a.map((s,i)=>JSON.stringify(s)===JSON.stringify(b[i])?null:i+1).filter(Boolean),expected[key]);
    assert.deepEqual(['slide-tension','accent-map'].includes(key)?b:a,examples[key].steps);
  }
  assert.equal(manifest.bpm,120);assert.equal(manifest.loops,2);
});

test('all ten MP3s decode to equal-length audible, unclipped and distinct pairs',()=>{
  for(const key of Object.keys(manifest.examples)){
    const pcm=['a','b'].map(v=>execFileSync('ffmpeg',['-v','error','-i',new URL(`assets/listening/${key}-${v}.mp3`,root).pathname,'-f','s16le','-ac','1','-ar','22050','pipe:1']));
    assert.equal(pcm[0].length,pcm[1].length);assert.ok(pcm[0].length>180000);assert.notDeepEqual(pcm[0],pcm[1]);
    for(const data of pcm){let peak=0,energy=0;for(let i=0;i<data.length;i+=2){const value=data.readInt16LE(i);peak=Math.max(peak,Math.abs(value));energy+=value*value;}assert.ok(peak>1000&&peak<32767);assert.ok(Math.sqrt(energy/(data.length/2))>500);}
  }
});

test('both languages expose five comparisons, ten labelled native players and changed-step tables in HTML',()=>{
  for(const p of ['303-pattern-examples.html','tr/303-pattern-ornekleri.html']){
    const s=read(p);assert.equal((s.match(/class="ab-comparison"/g)||[]).length,5);assert.equal((s.match(/data-comparison-audio controls preload="none"/g)||[]).length,10);
    for(const key of Object.keys(manifest.examples))for(const v of ['a','b'])assert.ok(s.includes(`id="${key}-${v}"`));
    assert.equal((s.match(/<caption>/g)||[]).length,5);assert.ok(s.includes('data-changed="true"'));
  }
});

test('starting a comparison stops and resets other players; leaving stops all audio',()=>{
  const make=()=>({currentTime:2,paused:false,handlers:{},addEventListener(type,fn){this.handlers[type]=fn;},pause(){this.paused=true;}});
  const players=[make(),make(),make()],events={};
  vm.runInNewContext(read('listening-comparisons.20261005.js'),{document:{querySelectorAll:()=>players},window:{addEventListener:(type,fn)=>events[type]=fn}});
  players[1].handlers.play();assert.equal(players[0].paused,true);assert.equal(players[2].currentTime,0);assert.equal(players[1].paused,false);
  events.pagehide();assert.ok(players.every(p=>p.paused));
});

test('every public header and footer has usable learning links before JavaScript',()=>{
  const paths=[...readdirSync(root).filter(p=>p.endsWith('.html')),...readdirSync(new URL('tr/',root)).filter(p=>p.endsWith('.html')).map(p=>'tr/'+p)];
  for(const path of paths){const s=read(path),tr=path.startsWith('tr/');
    for(const tag of ['header','footer']){const block=s.match(new RegExp(`<${tag} class="site-${tag}">([\\s\\S]*?)</${tag}>`))?.[1];assert.ok(block,path);
      for(const dest of tr?['/tr/rehberler.html','/tr/303-pattern-ornekleri.html','/tr/midi-donanim-rehberi.html','/tr/hakkinda.html']:['/guides.html','/303-pattern-examples.html','/midi-hardware-guide.html','/about.html'])assert.ok(block.includes(`href="${dest}"`),`${path}: ${tag} must expose ${dest}`);
    }
  }
});

test('runtime navigation updates all primary links and footer destinations when language changes',()=>{
  const s=read('site-shell.20260821-2600.js'),start=s.indexOf('  function installSharedChrome(){'),end=s.indexOf('\n  function installMidiActionRow',start);
  const node=()=>({setAttribute(){},toggleAttribute(){}}),nav=Array.from({length:5},node),mobile=Array.from({length:5},node),secondary=Array.from({length:5},node),footerNav=Array.from({length:5},node);
  const release=s.match(/const RELEASE_EPOCH='([^']+)'/)[1];let lang='en';
  const header={dataset:{shellChrome:release},querySelector:()=>null,querySelectorAll(sel){if(sel==='.nav a')return nav;if(sel==='.mobile-menu-grid')return [{querySelectorAll:()=>mobile},{querySelectorAll:()=>secondary}];return [];}};
  const footer={dataset:{shellChrome:release},querySelector:()=>null,querySelectorAll:()=>footerNav};
  const context={language:()=>lang,text:key=>key,alternateHref:()=>'/tr/',normalizedPath:()=>'/about.html',RELEASE_EPOCH:release,document:{body:{dataset:{page:'home'}},querySelector:sel=>sel==='.site-header'?header:footer},window:{}};
  vm.createContext(context);vm.runInContext(s.slice(start,end)+';this.run=installSharedChrome;',context);
  context.run();assert.equal(nav[1].href,'/guides.html');assert.equal(footerNav[4].href,'/about.html');
  lang='tr';context.run();assert.equal(nav[1].textContent,'Öğren');assert.equal(nav[2].href,'/tr/303-pattern-ornekleri.html');assert.equal(mobile[3].href,'/tr/midi-donanim-rehberi.html');assert.equal(footerNav[4].href,'/tr/hakkinda.html');
});

test('late homepage translation cannot overwrite the shared navigation or restore the old dropdown',()=>{
  const labels=['Sequencer','Learn','Examples','MIDI & Hardware','About'];
  const links=labels.map(textContent=>({textContent}));
  const document={documentElement:{lang:'en'},body:null,readyState:'complete',title:'',querySelector:()=>null,querySelectorAll:s=>s==='.site-header .nav a'?links:[],addEventListener(){}};
  const window={};
  vm.runInNewContext(read('content-stable.20260819-2000.js'),{window,document,queueMicrotask,MutationObserver:class{observe(){}},Node:{ELEMENT_NODE:1}});
  window.__303boxContentStable.apply();assert.deepEqual(links.map(x=>x.textContent),labels);
  assert.doesNotMatch(read('console-polish.20260824-2840.css'),/mobile-menu-toggle|#mobileMenu/);
});
