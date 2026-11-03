import {chromium,devices} from 'playwright';
const url=process.argv[2]||'http://localhost:8123/';const out=process.argv[3]||'screenshot3.png';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const ctx=await b.newContext({...devices['iPhone 13']});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(url);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(1500);
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
const y0=await p.evaluate(()=>__dbg.P.obj.position.y);await p.tap('#jump');await p.waitForTimeout(250);const y1=await p.evaluate(()=>__dbg.P.obj.position.y);
await p.waitForTimeout(1200);const y2=await p.evaluate(()=>__dbg.P.obj.position.y);ok(y1>y0+0.5&&Math.abs(y2-y0)<.05,`jump ${y0.toFixed(2)}->${y1.toFixed(2)}->${y2.toFixed(2)}`);
// walk forward via joystick
const j=await p.locator('#joy').boundingBox();await p.mouse.move(j.x+60,j.y+60);await p.mouse.down();await p.mouse.move(j.x+60,j.y+10,{steps:4});await p.waitForTimeout(800);await p.mouse.up();
// place: tap ground top at a spot near player
const c0=await p.evaluate(()=>__dbg.count());
const pos=await p.evaluate(()=>{const P=__dbg.P.obj.position;const x=Math.floor(P.x)+2,z=Math.floor(P.z);let y=19;while(y>0&&!__dbg.get(x+22,y,z+22))y--;return {x,y,z,s:__dbg.screen(x+.5,y+1,z+.5)}});
await p.touchscreen.tap(pos.s[0],pos.s[1]);await p.waitForTimeout(300);
const c1=await p.evaluate(()=>__dbg.count());const placed=await p.evaluate(q=>__dbg.get(q.x+22,q.y+1,q.z+22),pos);ok(c1===c0+1&&placed===8,`place ${c0}->${c1} block=${placed}`);
await p.waitForTimeout(500);
await p.reload();await p.waitForTimeout(1500);const c2=await p.evaluate(()=>__dbg.count());ok(c2===c1,`persist after reload ${c2}`);
await p.tap('#mode');const s2=await p.evaluate(q=>__dbg.screen(q.x+.5,q.y+2,q.z+.5),pos);await p.touchscreen.tap(s2[0],s2[1]);await p.waitForTimeout(300);
const c3=await p.evaluate(()=>__dbg.count());ok(c3===c1-1,`remove ${c1}->${c3}`);
console.log(JSON.stringify(await p.evaluate(()=>__dbg.calls())),errs);ok(!errs.length,'no errors');
await p.tap('#mode');for(let i=0;i<3;i++){const s=await p.evaluate(([q,i])=>__dbg.screen(q.x+.5,q.y+1+i,q.z+.5),[pos,i]);await p.touchscreen.tap(s[0],s[1]);await p.waitForTimeout(200)}
await p.waitForTimeout(500);await p.screenshot({path:out});await b.close();
