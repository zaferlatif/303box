import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const i18nSource=read('content-stable.20260819-2000.js');

// Load the real dictionary without a browser. Empty selector results are enough
// because this part of the test validates translation ownership and coverage.
const document={
  documentElement:{lang:'en'},body:null,title:'',readyState:'complete',
  querySelector:()=>null,querySelectorAll:()=>[],addEventListener:()=>{}
};
const window={};
vm.runInNewContext(i18nSource,{
  document,window,console,queueMicrotask,
  MutationObserver:class{observe(){}},Node:{ELEMENT_NODE:1}
},{filename:'content-stable.20260819-2000.js'});

const copy=window.__303boxContentStable?.copy;
assert.ok(copy?.en&&copy?.tr,'the final i18n authority must expose EN and TR copy');
const enKeys=Object.keys(copy.en).sort();
const trKeys=Object.keys(copy.tr).sort();
assert.deepEqual(trKeys,enKeys,'EN and TR dictionaries must have identical keys');

const markupOwners=[
  'index.html','studio.20260818-0912.js','hardware-guide.20260819-0815.js',
  'scope-live.20260819-1830.js','t8-prm-export.20260819-2120.js'
];
const referencedKeys=new Set();
for(const file of markupOwners){
  const source=read(file);
  for(const match of source.matchAll(/data-i18n(?:-placeholder|-aria-label)?=["']([^"']+)["']/g))referencedKeys.add(match[1]);
}
for(const key of referencedKeys){
  assert.ok(Object.hasOwn(copy.en,key),`missing English copy for data-i18n key: ${key}`);
  assert.ok(Object.hasOwn(copy.tr,key),`missing Turkish copy for data-i18n key: ${key}`);
}

const controlsThatMustChange=[
  'changeLanguage','heroTitle','generate','download','clear','play','stop','level',
  'midiEnable','midiOutput','midiDevice','midiPlayback','midiPanic','midiAuto',
  'midiHardwareGuide','td3DirectTitle','td3Verify','td3BackupWrite','td3Restore',
  'td3ReadOnly','t8PrmLead','t8PrmDownload','t8PrmWrite','hardwareTitle'
];
for(const key of controlsThatMustChange){
  assert.ok(copy.en[key]&&copy.tr[key],`missing visible control copy: ${key}`);
  assert.notEqual(copy.en[key],copy.tr[key],`visible control must differ between EN/TR: ${key}`);
}

// IDs declared in static and dynamically injected markup share one document.
const ids=[];
for(const file of markupOwners){
  for(const match of read(file).matchAll(/\bid=["']([A-Za-z][\w:-]*)["']/g))ids.push({id:match[1],file});
}
const duplicateIds=[...new Set(ids.filter((entry,index)=>ids.findIndex(x=>x.id===entry.id)!==index).map(x=>x.id))];
assert.deepEqual(duplicateIds,[],`duplicate markup IDs: ${duplicateIds.join(', ')}`);

const appSource=read('app.js');
assert.match(appSource,/CustomEvent\('303box:languagechange'/,'app.js must publish the single language-change event');
assert.match(i18nSource,/addEventListener\('303box:languagechange',queueApply\)/,'final translation pass must consume the language-change event');
assert.match(i18nSource,/addedNodes[\s\S]*ELEMENT_NODE/,'late injected components must trigger the final pass via element additions');

console.log(`i18n audit OK: ${enKeys.length} paired keys, ${referencedKeys.size} markup keys, ${ids.length} unique markup IDs`);
