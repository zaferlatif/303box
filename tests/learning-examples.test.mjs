import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {examples,valid}=require('../learning-examples.20260928.js');
const source=readFileSync(new URL('../learning-examples.20260928.js',import.meta.url),'utf8');
const SESSION='303box-session',BACKUP='303box-learning-backup-v1';
const clone=value=>JSON.parse(JSON.stringify(value));

class Element extends EventTarget {
  constructor(value=''){super();this.value=value;this.textContent=value;this.dataset={};this.hidden=false;this.disabled=false;this.attributes=new Set();}
  removeAttribute(key){this.attributes.delete(key)}
  scrollIntoView(){}
  focus(){}
  click(){this.dispatchEvent(new Event('click'))}
}
function harness({id='sparse-a',ready=true,store=new Map(),blockedKey=null,language='en'}={}){
  const original={pattern:clone(examples['one-note'].steps),title:'My unfinished idea',bpm:137,knobs:{cutoff:43},author:'Owner',notes:'Keep this',waveform:'square'};
  if(!store.has(SESSION))store.set(SESSION,JSON.stringify(original));
  const session=JSON.parse(store.get(SESSION));
  const elements=new Map();
  for(const id of ['sequencer','sequencerLoadStatus','sequencerLoadMessage','sequencerReload','sequencerGuide','exampleLoader','exampleHeading','exampleDescription','exampleLoad','exampleCancel','exampleUndo','exampleMessage','titleInput'])elements.set('#'+id,new Element());
  elements.get('#sequencer').attributes.add('inert');elements.get('#titleInput').value=session.title;
  const groups={};
  for(const [prop,cls] of [['note','note-input'],['octave','octave-cell'],['accentSlide','accentSlide-cell'],['gate','gate-cell']])groups['#patternSheet .'+cls]=session.pattern.map(s=>new Element(s[prop]));
  groups['#patternSheet .note-input'].forEach((input,i)=>{
    elements.set(`[data-note-picker="${i}"]`,new Element(input.value));
    input.addEventListener('input',()=>{
      const current=JSON.parse(store.get(SESSION));
      store.set(SESSION,JSON.stringify({...current,pattern:readSteps(),title:elements.get('#titleInput').value}));
    });
  });
  function readSteps(){return Array.from({length:16},(_,i)=>({note:groups['#patternSheet .note-input'][i].value,octave:groups['#patternSheet .octave-cell'][i].textContent,accentSlide:groups['#patternSheet .accentSlide-cell'][i].textContent,gate:groups['#patternSheet .gate-cell'][i].textContent}))}
  const document=new EventTarget();document.readyState='complete';document.documentElement={lang:language,classList:{contains:()=>ready}};
  document.querySelector=s=>elements.get(s)||groups[s]?.[0]||null;document.querySelectorAll=s=>groups[s]||[];
  const calls=[];
  const pitch={baseOctave:Number(store.get('303box-base-octave-v1')||2),setBaseOctave(v){this.baseOctave=v;store.set('303box-base-octave-v1',String(v));}};
  const window=ready?{__303boxPitchModel:pitch,__303boxUnifiedEngine:{},__303boxContentStable:{},__303boxTransportFuse:{run:action=>calls.push(action)}}:{};
  const timers=[];let href=`https://303box.com/?example=${id}&lang=${language}#sequencer`;
  const localStorage={getItem:key=>store.get(key)??null,setItem(key,value){if(key===blockedKey)throw new Error('Storage unavailable');store.set(key,value)},removeItem:key=>store.delete(key)};
  vm.runInNewContext(source,{document,window,localStorage,URL,Event,Object,location:{get href(){return href},reload(){}},history:{state:null,replaceState(_,__,value){href='https://303box.com'+value}},setTimeout:fn=>timers.push(fn)});
  return {store,original,readSteps,document,window,calls,timers,button:id=>elements.get('#'+id),href:()=>href};
}

test('all teaching patterns contain 16 encodable steps; article note lists match the loaded notes',()=>{
  for(const example of Object.values(examples))assert.ok(valid({baseOctave:2,title:example.en,steps:example.steps}));
  for(const filename of ['303-pattern-examples.html','tr/303-pattern-ornekleri.html']){
    const html=readFileSync(new URL('../'+filename,import.meta.url),'utf8');
    const lists=[...html.matchAll(/<strong>Steps? 01–16:<\/strong> ([^<]+)/g)];
    assert.equal(lists.length,5);
    ['sparse-a','one-note','slide-tension','offbeat','accent-map'].forEach((id,i)=>{
      const notes=lists[i][1].split(' · ').map(s=>s.replace(/^\d+ /,'').replace('—',''));
      assert.deepEqual(examples[id].steps.map(s=>s.note),notes);
      assert.ok(html.includes(`data-learning-example="${id}"`));
    });
  }
});
test('opening or cancelling a link preserves the current pattern without starting playback',()=>{
  const h=harness();assert.deepEqual(h.readSteps(),h.original.pattern);assert.equal(h.button('exampleLoad').hidden,false);
  h.button('exampleCancel').click();assert.deepEqual(h.readSteps(),h.original.pattern);assert.equal(h.calls.length,0);assert.equal(h.store.has(BACKUP),false);
  assert.ok(!h.href().includes('example='));
});
test('confirmed load preserves tempo and patch; undo survives reload and restores the previous title and steps',()=>{
  const h=harness();h.button('exampleLoad').click();
  assert.deepEqual(h.readSteps(),examples['sparse-a'].steps);assert.deepEqual(h.calls,['panic']);
  const saved=JSON.parse(h.store.get(SESSION));assert.equal(saved.bpm,137);assert.deepEqual(saved.knobs,{cutoff:43});assert.equal(saved.author,'Owner');assert.equal(saved.notes,'Keep this');
  const reloaded=harness({id:'',store:h.store});assert.deepEqual(reloaded.readSteps(),examples['sparse-a'].steps);assert.equal(reloaded.button('exampleUndo').hidden,false);
  reloaded.button('exampleUndo').click();assert.deepEqual(reloaded.readSteps(),h.original.pattern);assert.equal(reloaded.button('titleInput').value,'My unfinished idea');assert.equal(h.store.has(BACKUP),false);
});
test('unavailable storage cannot replace the existing pattern',()=>{
  for(const key of [BACKUP,SESSION]){const h=harness({blockedKey:key});h.button('exampleLoad').click();assert.deepEqual(h.readSteps(),h.original.pattern);assert.equal(h.calls.length,0);assert.match(h.button('exampleMessage').textContent,/could not be saved safely/);}
});
test('unknown and inherited URL keys cannot load patterns',()=>{
  for(const id of ['missing','__proto__','constructor']){const h=harness({id});assert.equal(h.button('exampleLoad').hidden,true);h.button('exampleLoad').click();assert.deepEqual(h.readSteps(),h.original.pattern);}
});
test('a failed runtime leaves a visible guide route and does not allow loading into an incomplete grid',()=>{
  const h=harness({ready:false,language:'tr'});h.timers.forEach(fn=>fn());assert.equal(h.button('sequencerLoadStatus').hidden,false);assert.equal(h.button('exampleLoad').disabled,true);assert.equal(h.button('sequencerGuide').href,'/tr/303-pattern-rehberi.html');assert.match(h.button('sequencerLoadMessage').textContent,/yüklenemedi/);
  h.button('exampleLoad').click();assert.deepEqual(h.readSteps(),h.original.pattern);
});
test('language switching updates an open load prompt',()=>{
  const h=harness();h.document.documentElement.lang='tr';h.document.dispatchEvent(new Event('303box:languagechange'));assert.equal(h.button('exampleLoad').textContent,'Bu pattern’i yükle');assert.match(h.button('exampleHeading').textContent,/Seyrek A/);
});
