const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs/promises');
const {existsSync}=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

const ROOT=path.resolve(__dirname,'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
async function server(){
  const instance=http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;const relative=pathname==='/'?'index.html':decodeURIComponent(pathname.slice(1));const file=path.resolve(ROOT,relative);if(!file.startsWith(`${ROOT}${path.sep}`)&&file!==path.join(ROOT,'index.html'))throw new Error('outside root');const body=await fs.readFile(file);res.writeHead(200,{'content-type':TYPES[path.extname(file)]||'application/octet-stream'});res.end(body)}catch(_){res.writeHead(404);res.end('not found')}});await new Promise(resolve=>instance.listen(0,'127.0.0.1',resolve));return instance;
}

async function launch(t){
  const systemChrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(existsSync(systemChrome)?systemChrome:undefined);
  const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});t.after(()=>browser.close());return browser;
}

async function instrumentPage(page){
  await page.route('https://**/*',route=>route.abort());
  await page.addInitScript(()=>{
    window.__midiLog={messages:[],clearCount:0};window.__stepLog=[];window.__slideRamps=[];
    window.addEventListener('303box:playback-step',event=>window.__stepLog.push({...event.detail}));
    const output={id:'td3-test',name:'TD-3',manufacturer:'Behringer',state:'connected',connection:'open',send(data,at=performance.now()){window.__midiLog.messages.push({data:Array.from(data),at,cancelled:false})},clear(){window.__midiLog.clearCount++;const now=performance.now();window.__midiLog.messages.forEach(m=>{if(m.at>now)m.cancelled=true})}};
    const access={outputs:new Map([[output.id,output]]),inputs:new Map(),onstatechange:null};
    Object.defineProperty(Navigator.prototype,'requestMIDIAccess',{configurable:true,value:async()=>access});
    const proto=window.AudioContext?.prototype,create=proto?.createOscillator;
    if(create)proto.createOscillator=function(...args){const osc=create.apply(this,args);try{const param=osc.frequency,original=param.exponentialRampToValueAtTime.bind(param);param.exponentialRampToValueAtTime=(value,time)=>{window.__slideRamps.push({value,time});return original(value,time)}}catch(_){}return osc};
  });
}

test('mobile MIDI UI cannot overflow and only T-8 / TD-3 remain',{timeout:60000},async t=>{
  const web=await server();t.after(()=>{web.closeAllConnections?.();return new Promise(resolve=>web.close(resolve))});const browser=await launch(t);const page=await browser.newPage({viewport:{width:390,height:844}});await instrumentPage(page);
  await page.goto(`http://127.0.0.1:${web.address().port}/`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__303boxMidiRouter?.version==='2401'&&window.__303boxSiteShell?.version==='2026.08.24.1');
  const result=await page.evaluate(()=>({profiles:[...document.querySelectorAll('#midiDeviceProfile option')].map(x=>x.value),devices:[...document.querySelectorAll('.hardware-device-card')].map(x=>x.dataset.device),playback:(()=>{const r=document.querySelector('.midi-playback').getBoundingClientRect();return{x:r.x,right:r.right,width:r.width,viewport:innerWidth,scroll:document.documentElement.scrollWidth}})()}));
  assert.deepEqual(result.profiles,['auto','t8','td3']);assert.deepEqual(result.devices.sort(),['t8','td3']);assert.ok(result.playback.x>=0);assert.ok(result.playback.right<=result.playback.viewport+.5);assert.ok(result.playback.scroll<=result.playback.viewport);
});

test('TD-3 live playback uses accent velocity and real overlapping slide',{timeout:60000},async t=>{
  const web=await server();t.after(()=>{web.closeAllConnections?.();return new Promise(resolve=>web.close(resolve))});const browser=await launch(t);const page=await browser.newPage();await instrumentPage(page);
  await page.goto(`http://127.0.0.1:${web.address().port}/`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__303boxUnifiedEngine&&window.__303boxMidiRouter?.version==='2401');
  await page.click('#midiRouterConnect');await page.waitForFunction(()=>window.__303boxMidiRouter?.state?.enabled===true);await page.selectOption('#midiDeviceProfile','td3');await page.selectOption('#midiRouterMode','both');
  await page.evaluate(()=>{const notes=[...document.querySelectorAll('.note-input')],expr=[...document.querySelectorAll('.accentSlide-cell')],gate=[...document.querySelectorAll('.gate-cell')],oct=[...document.querySelectorAll('.octave-cell')];for(let i=0;i<16;i++){notes[i].value='';notes[i].dataset.baseOctave='0';expr[i].textContent='';gate[i].textContent='-';oct[i].textContent=''}notes[0].value='C';gate[0].textContent='●';expr[0].textContent='S';notes[1].value='G';gate[1].textContent='●';expr[1].textContent='A'});
  await page.click('#playButton',{force:true});await page.waitForFunction(()=>window.__midiLog.messages.filter(x=>(x.data[0]&0xF0)===0x90).length>=2);await page.waitForTimeout(50);
  const result=await page.evaluate(()=>({messages:window.__midiLog.messages,ramps:window.__slideRamps}));
  assert.equal(result.messages.some(x=>x.data[0]===0xFA),false,'TD-3 live notes must not start the stored sequencer');
  const ons=result.messages.filter(x=>(x.data[0]&0xF0)===0x90);const cOn=ons.find(x=>x.data[1]===60),gOn=ons.find(x=>x.data[1]===67),cOff=result.messages.find(x=>(x.data[0]&0xF0)===0x80&&x.data[1]===60&&x.at>=gOn.at);
  assert.ok(cOn&&gOn&&cOff,'C -> G slide needs both Note Ons and the old-note Note Off');assert.equal(gOn.data[2],112,'TD-3 accent must use its accented velocity');assert.ok(cOff.at>gOn.at,'new slide target Note On must precede old-note Note Off');assert.ok(cOff.at-gOn.at>=8&&cOff.at-gOn.at<=20,'slide overlap must remain deliberate and short');assert.ok(result.ramps.some(x=>x.value>380&&x.value<405),'browser audio must schedule a pitch ramp for the same slide');
  await page.evaluate(()=>window.__303boxUnifiedEngine.stopAll());
});

test('home and privacy render the same responsive footer shell',{timeout:60000},async t=>{
  const web=await server();t.after(()=>{web.closeAllConnections?.();return new Promise(resolve=>web.close(resolve))});const browser=await launch(t);const page=await browser.newPage({viewport:{width:390,height:844}});await page.route('https://**/*',route=>route.abort());
  const inspect=async url=>{await page.goto(`http://127.0.0.1:${web.address().port}${url}`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__303boxSiteShell?.version==='2026.08.24.1');return page.evaluate(()=>{const footer=document.querySelector('.site-footer .footer-inner'),style=getComputedStyle(footer),r=footer.getBoundingClientRect();return{html:document.querySelector('.site-footer').innerHTML.replace(/v2026\.08\.\d+\.\d+/g,'VERSION'),direction:style.flexDirection,align:style.alignItems,width:Math.round(r.width),viewport:innerWidth}})};
  const home=await inspect('/'),privacy=await inspect('/privacy.html');assert.equal(home.html,privacy.html);assert.equal(home.direction,'column');assert.equal(privacy.direction,'column');assert.equal(home.align,'center');assert.equal(privacy.align,'center');assert.equal(home.width,privacy.width);assert.ok(home.width<=home.viewport-28);
});
