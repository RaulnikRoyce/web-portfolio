import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function env() {
  const events = {}; const media = {}; const frames = []; const props = {};
  const window = { innerWidth: 1000, innerHeight: 1000, devicePixelRatio: 1,
    matchMedia(query) { return media[query] ??= { matches: false, listeners: [], addEventListener(_,fn){this.listeners.push(fn);}, change(value){ this.matches=value;this.listeners.forEach(f=>f({matches:value})); } }; },
    addEventListener(name, fn) { events[name]=fn; } };
  const context={window, document:{documentElement:{style:{setProperty(k,v){props[k]=v;}}},querySelector(){return null;},querySelectorAll(){return[];}},requestAnimationFrame(fn){frames.push(fn);return frames.length;}, performance:{now:()=>0}};
  return {context,events,media,frames,props,step(t){const next=frames.splice(0);next.forEach(fn=>fn(t));}};
}
let main=readFileSync(new URL('../assets/js/main.js',import.meta.url),'utf8');
let kit=readFileSync(new URL('../assets/js/kit.js',import.meta.url),'utf8');
test('background stops following the pointer when reduced motion is enabled during the session',()=>{
 const e=env();vm.runInNewContext(main,e.context);
 e.events.pointermove({clientX:100,clientY:200});e.step(0);
 const before={...e.props};e.media['(prefers-reduced-motion: reduce)'].change(true);
 e.events.pointermove({clientX:900,clientY:800});e.step(16);
 assert.deepEqual(e.props,before);
});
test('spiral stops idle rotation when reduced motion is enabled during the session',async()=>{
 const e=env();let points=[];const ctx={setTransform(){},clearRect(){points=[];},save(){},restore(){},drawImage(...p){points.push(p.slice(1));}};
 const canvas={clientWidth:720,clientHeight:430,getContext(){return ctx;},addEventListener(){}};
 e.context.document.querySelectorAll=()=>[{getAttribute:()=> 'stack',querySelector:()=>canvas}];
 e.context.Image=class {set src(_){this.onload();}};
 vm.runInNewContext(kit,e.context);await new Promise(r=>setImmediate(r));
 e.step(0);e.step(100);e.media['(prefers-reduced-motion: reduce)'].change(true);
 const before=JSON.stringify(points);e.step(200);assert.equal(JSON.stringify(points),before);
});

test('background keeps following the pointer with motion enabled',()=>{
 const e=env();vm.runInNewContext(main,e.context);e.events.pointermove({clientX:750,clientY:250});e.step(16);assert.equal(e.props['--spot-x'],'75%');assert.equal(e.props['--spot-y'],'25%');
});
test('pending animation frame does not bypass reduced motion',()=>{
 const e=env();vm.runInNewContext(main,e.context);const before={...e.props};e.events.pointermove({clientX:900,clientY:900});e.media['(prefers-reduced-motion: reduce)'].change(true);e.step(16);assert.deepEqual(e.props,before);
});
test('Escape closes an open menu and restores focus; links also close it',()=>{
 const e=env();const handlers={};const attrs={'aria-expanded':'false'};const classes=new Set();let focused=false;let onLink;
 const toggle={getAttribute:k=>attrs[k],setAttribute:(k,v)=>attrs[k]=v,addEventListener:(n,f)=>handlers[n]=f,focus(){focused=true;}};
 const menu={classList:{toggle(k,on){on?classes.add(k):classes.delete(k);},contains:k=>classes.has(k)},querySelectorAll:()=>[{addEventListener:(_,f)=>onLink=f}]};
 e.context.document.querySelector=s=>s==='[data-menu-toggle]'?toggle:s==='[data-menu]'?menu:null;
 e.context.document.addEventListener=(n,f)=>handlers[n]=f;vm.runInNewContext(main,e.context);
 handlers.click();assert.equal(attrs['aria-expanded'],'true');handlers.keydown({key:'Escape'});assert.equal(attrs['aria-expanded'],'false');assert.equal(focused,true);handlers.click();onLink();assert.equal(attrs['aria-expanded'],'false');
});

test('one failed logo does not prevent drawing the remaining spiral',async()=>{
 const e=env();let draws=0;const errors=[];const ctx={setTransform(){},clearRect(){},save(){},restore(){},drawImage(){draws++;}};
 const canvas={clientWidth:720,clientHeight:430,getContext:()=>ctx,addEventListener(){}};
 e.context.document.querySelectorAll=()=>[{getAttribute:()=> 'stack',querySelector:()=>canvas}];
 e.context.Image=class {set src(src){src.endsWith('/vue.png')?this.onerror(new Error('404')):this.onload();}};
 e.context.Promise=class extends Promise {static all(values){return Promise.all(values).catch(err=>{errors.push(err);return[];});}};
 vm.runInNewContext(kit,e.context);await new Promise(r=>setImmediate(r));assert.equal(errors.length,0);assert.ok(draws>0);
});

function spiralHarness({reduced=false}={}) {
 const e=env();const handlers={};let draws=0;let points=[];let resizeCallback;let visibilityCallback;
 e.context.ResizeObserver=class {constructor(cb){resizeCallback=cb;}observe(){}};
 e.context.IntersectionObserver=class {constructor(cb){visibilityCallback=cb;}observe(){}};
 const ctx={setTransform(){},clearRect(){points=[];},save(){},restore(){},drawImage(...p){draws++;points.push(p.slice(1));}};
 const canvas={clientWidth:720,clientHeight:430,getContext:()=>ctx,addEventListener(n,f){handlers[n]=f;},setPointerCapture(){},releasePointerCapture(){}};
 e.context.document.querySelectorAll=()=>[{getAttribute:()=> 'stack',querySelector:()=>canvas}];
 e.context.Image=class {set src(_){this.onload();}};
 e.context.window.matchMedia('(prefers-reduced-motion: reduce)').matches=reduced;
 vm.runInNewContext(kit,e.context);
 return {...e,handlers,canvas,resize:()=>resizeCallback(),visibility:value=>visibilityCallback([{isIntersecting:value}]),get draws(){return draws;},snapshot:()=>JSON.stringify(points)};
}
test('idle spiral remains visually static with reduced motion',async()=>{
 const e=spiralHarness({reduced:true});await new Promise(r=>setImmediate(r));e.step(0);const before=e.snapshot();for(let i=1;i<=120;i++)e.step(i*16);assert.equal(e.snapshot(),before);
});
test('P3: static reduced-motion spiral should not repaint at every animation frame',async()=>{
 const e=spiralHarness({reduced:true});await new Promise(r=>setImmediate(r));e.step(0);const before=e.draws;for(let i=1;i<=120;i++)e.step(i*16);assert.equal(e.draws,before,'A static canvas was redrawn unnecessarily');
});
test('P2: reduced motion should stop inertial rotation after a gesture',async()=>{
 const e=spiralHarness();await new Promise(r=>setImmediate(r));e.step(0);
 e.handlers.pointerdown({clientX:0,pointerId:1});e.handlers.pointermove({clientX:100,pointerId:1});e.handlers.pointerup({pointerId:1});
 e.media['(prefers-reduced-motion: reduce)'].change(true);e.step(16);const before=e.snapshot();e.step(32);assert.equal(e.snapshot(),before);
});

test('reduced motion keeps drag, wheel and resize responsive without an idle loop',async()=>{
 const e=spiralHarness({reduced:true});await new Promise(r=>setImmediate(r));
 const initial=e.snapshot();e.handlers.pointerdown({clientX:0,pointerId:1});e.handlers.pointermove({clientX:20,pointerId:1});assert.notEqual(e.snapshot(),initial);
 e.handlers.pointerup({pointerId:1});const dragged=e.snapshot();e.handlers.wheel({deltaX:0,deltaY:100});assert.notEqual(e.snapshot(),dragged);
 const wheeled=e.snapshot();e.canvas.clientWidth=360;e.resize();assert.notEqual(e.snapshot(),wheeled);assert.equal(e.frames.length,0);
});
test('idle rotation resumes when reduced motion is turned off and pauses out of view',async()=>{
 const e=spiralHarness({reduced:true});await new Promise(r=>setImmediate(r));assert.equal(e.frames.length,0);
 e.media['(prefers-reduced-motion: reduce)'].change(false);e.step(0);const before=e.snapshot();e.step(100);assert.notEqual(e.snapshot(),before);
 e.visibility(false);e.step(200);assert.equal(e.frames.length,0);e.visibility(true);assert.equal(e.frames.length,1);e.step(300);const resumed=e.snapshot();e.step(400);assert.notEqual(e.snapshot(),resumed);
});
test('enabling reduced motion stops an already queued inertial frame',async()=>{
 const e=spiralHarness();await new Promise(r=>setImmediate(r));e.step(0);
 e.handlers.pointerdown({clientX:0,pointerId:1});e.handlers.pointermove({clientX:100,pointerId:1});e.handlers.pointerup({pointerId:1});const before=e.snapshot();
 e.media['(prefers-reduced-motion: reduce)'].change(true);e.step(100);e.step(200);assert.equal(e.snapshot(),before);assert.equal(e.frames.length,0);
});
