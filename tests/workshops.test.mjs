import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const {examples}=createRequire(import.meta.url)('../learning-examples.20260928.js');
const manifest=JSON.parse(read('assets/listening/manifest.json'));
const paths=['303-pattern-guide.html','acid-house-guide.html','midi-hardware-guide.html','guides.html','tr/303-pattern-rehberi.html','tr/acid-house-rehberi.html','tr/midi-donanim-rehberi.html','tr/rehberler.html'];

test('workshops have valid section destinations, unique IDs and loadable lesson links',()=>{
 for(const file of paths){const s=read(file),ids=[...s.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,file);
  for(const m of s.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),`${file}: missing ${m[1]}`);
  for(const m of s.matchAll(/data-learning-example="([^"]+)" href="([^"]+)"/g)){
   assert.ok(Object.hasOwn(examples,m[1]),`${file}: unknown pattern`);
   const url=new URL(m[2].replaceAll('&amp;','&'),'https://303box.com');
   assert.equal(url.searchParams.get('example'),m[1]);assert.equal(url.searchParams.get('lang'),file.startsWith('tr/')?'tr':'en');
  }
 }
});
test('every A/B loading link corresponds to the steps in its recording, in both languages',()=>{
 for(const file of ['303-pattern-examples.html','tr/303-pattern-ornekleri.html']){
  const s=read(file);
  for(const [key,pair]of Object.entries(manifest.examples)){
   const block=s.match(new RegExp(`<!-- comparison:${key} -->([\\s\\S]*?)<!-- /comparison:${key} -->`))[1];
   const links=[...block.matchAll(/data-learning-example="([^"]+)"/g)].map(m=>m[1]);assert.equal(links.length,2);
   assert.deepEqual(examples[links[0]].steps,pair.a);assert.deepEqual(examples[links[1]].steps,pair.b);
  }
 }
});
test('pattern workshop table encodes the real original example in both languages',()=>{
 for(const file of ['303-pattern-guide.html','tr/303-pattern-rehberi.html']){
  const table=read(file).match(/<table class="workshop-table">([\s\S]*?)<\/table>/)[1];
  const rows=[...table.matchAll(/<tr><th scope="row">(\d+)<\/th><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><\/tr>/g)];assert.equal(rows.length,16);
  rows.forEach((row,i)=>{const step=examples['sparse-a'].steps[i];assert.equal(+row[1],i+1);assert.equal(row[2],step.note||'—');if(step.note)assert.equal(row[3],step.octave);assert.equal(row[4],step.note?'●':'—');assert.equal(row[5],step.accentSlide||'—');});
 }
});
test('first visit does not open shortcuts, but an explicit shortcuts destination still does',()=>{
 const src=read('pattern-shell.20260818-1045.js');
 const handler=src.match(/document\.addEventListener\('303box:ready',\(\)=>\{([\s\S]*?)\},\{once:true\}\);/)[1];
 for(const hash of ['','#top','#sequencer','#shortcuts']){let opens=0;const timers=[];
  vm.runInNewContext(handler,{location:{hash},openShortcuts:()=>opens++,localStorage:{getItem:()=>null},setTimeout:fn=>timers.push(fn)});
  timers.forEach(fn=>fn());assert.equal(opens,hash==='#shortcuts'?1:0);
 }
});
test('the legacy refresh hook cannot inject a timed promotional overlay',()=>{
 let mounted=0;const callbacks=[];const window={};
 vm.runInNewContext(read('ui-refresh.20260819-1750.js'),{window,document:{documentElement:{classList:{contains:()=>true}},addEventListener:(_,fn)=>callbacks.push(fn),createElement:()=>{mounted++;return{};}},setTimeout:fn=>callbacks.push(fn)});
 callbacks.forEach(fn=>fn());window.__303boxUiRefresh.apply();window.__303boxUiRefresh.mountCreator();assert.equal(mounted,0);
});
test('hardware guide offers a blank test record without inventing a physical result',()=>{
 assert.ok(existsSync(new URL('assets/td3-test-record.txt',root)));
 for(const file of ['td3-usb-transfer-lab.html','tr/td3-usb-aktarim-laboratuvari.html'])assert.match(read(file),/download href="\/assets\/td3-test-record.txt"/);
 assert.match(read('assets/td3-test-record.txt'),/NOT TESTED/);
});
