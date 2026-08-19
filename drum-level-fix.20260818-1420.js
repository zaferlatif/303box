(() => {
  'use strict';
  const selector='#drums input[type="range"][data-level]';
  const EPSILON='0.000000001';
  const nativeValue=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
  const patched=new WeakSet();

  function nativeGet(input){try{return nativeValue?.get?nativeValue.get.call(input):input.getAttribute('value')}catch(_){return input.getAttribute('value')||'0'}}
  function patchValue(input){
    if(!input?.matches?.(selector)||patched.has(input)||!nativeValue?.get||!nativeValue?.set)return;
    try{
      Object.defineProperty(input,'value',{configurable:true,enumerable:true,get(){const raw=nativeValue.get.call(this),n=Number(raw);return Number.isFinite(n)&&n<=0?EPSILON:raw},set(v){nativeValue.set.call(this,v)}});
      patched.add(input);
    }catch(_){}
  }
  function normalize(input){
    if(!input?.matches?.(selector))return;patchValue(input);
    const raw=Number(nativeGet(input));if(!Number.isFinite(raw))return;const audible=Math.max(0,Math.min(100,raw));
    input.dataset.audibleLevel=String(audible);input.setAttribute('aria-valuenow',String(audible));input.setAttribute('aria-valuetext',`${Math.round(audible)}%`);input.title=`${Math.round(audible)}%`;
  }
  function normalizeAll(){document.querySelectorAll(selector).forEach(normalize)}
  document.addEventListener('input',e=>normalize(e.target),true);document.addEventListener('change',e=>normalize(e.target),true);
  function start(){
    normalizeAll();
    const body=document.body;if(!body)return;
    new MutationObserver(records=>{for(const r of records){for(const node of r.addedNodes){if(node.nodeType!==1)continue;if(node.matches?.(selector))normalize(node);node.querySelectorAll?.(selector).forEach(normalize)}}}).observe(body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.__303boxDrumLevelFix={version:'2000',normalizeAll};
})();
