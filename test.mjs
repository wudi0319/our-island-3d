import {chromium,devices} from 'playwright';
const url=process.argv[2]||'http://localhost:8123/';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const p=await b.newPage({...devices['iPhone 13']});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(url);await p.waitForTimeout(1500);
const j=await p.locator('#joy').boundingBox();await p.mouse.move(j.x+60,j.y+60);await p.mouse.down();await p.mouse.move(j.x+60,j.y+10,{steps:5});await p.waitForTimeout(1000);await p.mouse.up();
await p.waitForTimeout(500);console.log(JSON.stringify(await p.evaluate(()=>window.__info())),errs);
await p.screenshot({path:'screenshot.png'});await b.close();
