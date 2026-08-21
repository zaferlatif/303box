const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const { existsSync } = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const TYPES = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};

async function server(){
  const instance=http.createServer(async(req,res)=>{
    try{
      const pathname=new URL(req.url,'http://localhost').pathname;
      const relative=pathname==='/'?'index.html':decodeURIComponent(pathname.slice(1));
      const file=path.resolve(ROOT,relative);
      if(!file.startsWith(`${ROOT}${path.sep}`)&&file!==path.join(ROOT,'index.html'))throw new Error('outside root');
      const body=await fs.readFile(file);res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});res.end(body);
    }catch(_){res.writeHead(404);res.end('not found')}
  });
  await new Promise(resolve=>instance.listen(0,'127.0.0.1',resolve));
  return instance;
}

test('shared playback timeline survives BPM changes and keeps TD-3 transport safe', {timeout:60000}, async t=>{
  const mark=value=>console.log(`[playback-test] ${value}`);
  const web=await server();t.after(()=>{web.closeAllConnections?.();return new Promise(resolve=>web.close(resolve))});
  const systemChrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(existsSync(systemChrome)?systemChrome:undefined);
  const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});t.after(()=>browser.close());
  mark('browser');
  const page=await browser.newPage();
  await page.route('https://**/*',route=>route.abort());
  await page.addInitScript(()=>{
    window.__midiLog={messages:[],clearCount:0};window.__stepLog=[];window.__audioStops=[];
    window.addEventListener('303box:playback-step',event=>window.__stepLog.push({...event.detail}));
    const output={id:'td3-test',name:'TD-3',manufacturer:'Behringer',state:'connected',connection:'open',
      send(data,at=performance.now()){window.__midiLog.messages.push({data:Array.from(data),at,cancelled:false})},
      clear(){window.__midiLog.clearCount++;const now=performance.now();window.__midiLog.messages.forEach(message=>{if(message.at>now)message.cancelled=true})}
    };
    const access={outputs:new Map([[output.id,output]]),inputs:new Map(),onstatechange:null};
    Object.defineProperty(Navigator.prototype,'requestMIDIAccess',{configurable:true,value:async()=>access});
    const proto=window.AudioContext?.prototype;
    const create=proto?.createOscillator;
    if(create)proto.createOscillator=function(...args){
      const ctx=this,osc=create.apply(ctx,args),stop=osc.stop.bind(osc);
      osc.stop=(when)=>{window.__audioStops.push({scheduled:when??null,observedAt:ctx.currentTime});return when==null?stop():stop(when)};
      return osc;
    };
  });

  const port=web.address().port;
  await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
  mark('dom');
  await page.waitForFunction(()=>window.__303boxUnifiedEngine?.version==='2205'&&window.__303boxMidiRouter?.version==='2205');
  mark('engines');
  await page.click('#midiRouterConnect');
  await page.waitForFunction(()=>window.__303boxMidiRouter?.state?.enabled===true);
  mark('midi');
  await page.selectOption('#midiDeviceProfile','td3');
  await page.selectOption('#midiRouterMode','midi');
  await page.evaluate(()=>{
    const transport=document.querySelector('#midiRouterTransport');transport.checked=true;transport.dispatchEvent(new Event('change',{bubbles:true}));
    const clock=document.querySelector('#midiRouterClock');clock.checked=true;clock.dispatchEvent(new Event('change',{bubbles:true}));
    const notes=[...document.querySelectorAll('.note-input')],oct=[...document.querySelectorAll('.octave-cell')],expr=[...document.querySelectorAll('.accentSlide-cell')],gate=[...document.querySelectorAll('.gate-cell')];
    for(let i=0;i<16;i++){notes[i].value='C';notes[i].dataset.baseOctave='0';oct[i].textContent='';expr[i].textContent='S';gate[i].textContent='○'}
  });

  // A fully tied pattern used to queue a complete 16-step oscillator segment at
  // the old tempo. The incremental engine must not schedule a multi-second stop.
  await page.click('#playButton',{force:true});
  await page.waitForFunction(()=>window.__stepLog.length>=1);
  mark('first-step');
  await page.waitForTimeout(35);
  const stale=await page.evaluate(()=>window.__audioStops.filter(x=>x.scheduled!=null&&x.scheduled-x.observedAt>.5));
  assert.equal(stale.length,0,'no long old-tempo Web Audio segment may be pre-scheduled');
  const firstRun=await page.evaluate(()=>window.__midiLog.messages.slice());
  assert.equal(firstRun.some(x=>x.data[0]===0xFA),false,'TD-3 live-note playback must not start its stored sequencer');
  assert.equal(firstRun.filter(x=>(x.data[0]&0xF0)===0x90).length,1,'a same-note tie begins with one Note On');
  await page.click('#playButton',{force:true});
  await page.waitForFunction(()=>window.__303boxUnifiedEngine.state==='stopped');
  mark('first-stop');

  await page.evaluate(()=>{window.__midiLog.messages=[];window.__stepLog=[]});
  await page.evaluate(()=>window.__303boxUnifiedEngine.toggleDrums());
  await page.waitForFunction(()=>window.__stepLog.length>=1);
  const td3RhythmOnly=await page.evaluate(()=>window.__midiLog.messages.slice());
  assert.equal(td3RhythmOnly.some(x=>x.data[0]===0xFA),false,'TD-3 must not start its stored sequencer during any live-note session');
  await page.evaluate(()=>window.__303boxUnifiedEngine.stopAll());
  await page.waitForFunction(()=>window.__303boxUnifiedEngine.state==='stopped');
  mark('td3-transport-safe');

  // A real second click is a legitimate emergency stop even when it arrives less
  // than the old 90 ms transport lock window after start.
  await page.click('#playButton',{force:true});
  await page.click('#playButton',{force:true});
  await page.waitForFunction(()=>window.__303boxUnifiedEngine.state==='stopped');
  mark('fast-stop');

  await page.evaluate(()=>{
    window.__midiLog.messages=[];window.__stepLog=[];
    const notes=[...document.querySelectorAll('.note-input')],expr=[...document.querySelectorAll('.accentSlide-cell')],gate=[...document.querySelectorAll('.gate-cell')];
    for(let i=0;i<16;i++){notes[i].value=i%2?'D':'C';expr[i].textContent='';gate[i].textContent='●'}
    const swing=document.querySelector('#consoleSwing');swing.value='60';swing.dispatchEvent(new Event('input',{bubbles:true}));
    const tempo=document.querySelector('[data-knob-id="bpm"]');
    tempo.dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true,cancelable:true}));
    for(let i=0;i<90;i++)tempo.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
  });
  assert.equal(await page.getAttribute('[data-knob-id="bpm"]','aria-valuenow'),'140');
  const clearsBefore=await page.evaluate(()=>window.__midiLog.clearCount);
  await page.click('#playButton',{force:true});
  await page.waitForFunction(()=>window.__midiLog.messages.filter(x=>(x.data[0]&0xF0)===0x90).length>=2);
  mark('second-notes');
  await page.evaluate(()=>document.querySelector('[data-knob-id="bpm"]').dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true,cancelable:true})));
  await page.waitForFunction(()=>document.querySelector('[data-knob-id="bpm"]').getAttribute('aria-valuenow')==='250');
  await page.waitForFunction(()=>window.__stepLog.some(x=>x.bpm===250));
  mark('tempo');
  await page.waitForTimeout(90);

  const result=await page.evaluate(()=>({clearCount:window.__midiLog.clearCount,messages:window.__midiLog.messages,steps:window.__stepLog}));
  assert.equal(result.clearCount,clearsBefore,'a BPM change must not clear the MIDI queue (and its Note Offs)');
  assert.equal(result.messages.some(x=>(x.data[0]&0xF0)===0x80&&x.cancelled),false,'scheduled Note Offs remain valid across a BPM change');
  assert.ok(result.steps.some(x=>x.bpm<250&&x.durationMs>100),'the old tempo existed before the change');
  assert.ok(result.steps.some(x=>x.bpm===250&&x.durationMs<75),'the next unscheduled step adopts the new tempo');
  const fastStart=result.steps.find(x=>x.bpm===250).performanceTime;
  const clocks=result.messages.filter(x=>x.data[0]===0xF8&&!x.cancelled).map(x=>x.at).sort((a,b)=>a-b);
  const oldClocks=clocks.filter(x=>x<fastStart-.1),fastClocks=clocks.filter(x=>x>=fastStart-.1);
  const deltas=a=>a.slice(1).map((x,i)=>x-a[i]);
  assert.ok(deltas(oldClocks).some(x=>Math.abs(x-(60000/140/24))<.05),'swing does not modulate the 140 BPM MIDI Clock period');
  assert.ok(deltas(fastClocks).some(x=>Math.abs(x-10)<.05),'the new fixed MIDI Clock period begins without clearing the queue');

  await page.evaluate(()=>window.__303boxUnifiedEngine.stopAll());
  await page.waitForFunction(()=>window.__303boxUnifiedEngine.state==='stopped');
  mark('done');
  const stopped=await page.evaluate(()=>({clears:window.__midiLog.clearCount,messages:window.__midiLog.messages}));
  assert.ok(stopped.clears>clearsBefore,'explicit stop clears future MIDI messages');
  assert.ok(stopped.messages.some(x=>(x.data[0]&0xF0)===0x80),'explicit stop emits Note Off safety messages');
});
