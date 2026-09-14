'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),TP=require('../engine.js');
(async()=>{
const root=path.resolve(__dirname,'..'),allowed=new Set(['index.html','styles.css','engine.js','vision.js','app.js']);
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.split('?')[0]).replace(/^\//,'')||'index.html';if(!allowed.has(name)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'application/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(root,name)));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1365,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let count=0;const pass=s=>{count++;console.log('PASS '+s);};
try{
 await page.goto(url);assert.match(await page.title(),/Analiză automată/);await page.click('#demoBtn');assert.match(await page.locator('#signal').innerText(),/BUY LONG/);assert.match(await page.locator('#sourceBadge').innerText(),/DEMO/);assert.match(await page.locator('#tpKind').innerText(),/neconfirmată/);pass('Demo has explicit synthetic provenance, automated direction and projected target');
 const costs={value:'10',spread:'.1',slippage:'.1',commission:'2',equity:'1000',freeMargin:'1000',marginPerLot:'100',minLot:'.1',lotStep:'.1',dailyUsed:'0'};
 for(const [k,v] of Object.entries(costs))await page.fill('#'+k,v);
 await page.check('#specsConfirmed');assert.doesNotMatch(await page.locator('#sizes').innerText(),/insuficiente/);assert.match(await page.locator('#blockers').innerText(),/fără CFD nou/);
 await page.fill('#equity','2000');assert.equal(await page.isChecked('#specsConfirmed'),false);assert.match(await page.locator('#sizes').innerText(),/insuficiente/);pass('Sizing requires reconfirmation after changing financial inputs');
 await page.fill('#symbol','MODIFICAT');assert.equal(await page.locator('#signal').innerText(),'FĂRĂ SETUP');assert.equal(await page.isChecked('#dataConfirmed'),false);pass('Changing source metadata immediately invalidates old recommendation');
 const csv=b=>'time,open,high,low,close\n'+b.map((v,i)=>[i+1,v.open,v.high,v.low,v.close].join(',')).join('\n');
 await page.setInputFiles('#csvInput',{name:'range.csv',mimeType:'text/csv',buffer:Buffer.from(csv(TP.demo('RANGE')))});
 await page.waitForFunction(()=>document.querySelector('#sourceStatus').textContent.includes('140 rânduri'));await page.check('#dataConfirmed');await page.click('#analyzeBtn');assert.equal(await page.locator('#signal').innerText(),'FĂRĂ SETUP');pass('Sideways data gives no fabricated trade');
 await page.setInputFiles('#csvInput',{name:'short.csv',mimeType:'text/csv',buffer:Buffer.from(csv(TP.demo('SHORT')))});
 await page.waitForFunction(()=>document.querySelector('#sourceStatus').textContent.startsWith('short.csv'));await page.check('#dataConfirmed');await page.click('#analyzeBtn');assert.match(await page.locator('#signal').innerText(),/SELL SHORT/);pass('CSV automatically generates short without manual direction selector');
 const fixture=await page.evaluate(bars=>{const c=document.createElement('canvas');c.width=1180;c.height=450;const ctx=c.getContext('2d'),hi=Math.max(...bars.map(b=>b.high))+1,lo=Math.min(...bars.map(b=>b.low))-1,py=p=>Math.round(20+(hi-p)/(hi-lo)*400);ctx.fillStyle='#0b1423';ctx.fillRect(0,0,c.width,c.height);bars.forEach((b,i)=>{const x=20+i*8,t=Math.min(py(b.open),py(b.close)),bottom=Math.max(py(b.open),py(b.close));ctx.fillStyle=b.close>=b.open?'rgb(40,210,160)':'rgb(225,65,75)';ctx.fillRect(x,py(b.high),1,py(b.low)-py(b.high)+1);ctx.fillRect(x-2,t,5,Math.max(bottom-t+1,4));});return {url:c.toDataURL(),hi,lo};},TP.demo('LONG'));
 await page.setInputFiles('#imageInput',{name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from(fixture.url.split(',')[1],'base64')});
 await page.waitForFunction(()=>document.querySelector('#sourceStatus').textContent.includes('imagine locală'));
 const clickCanvas=async(x,y)=>{await page.locator('#chart').scrollIntoViewIfNeeded();const box=await page.locator('#chart').boundingBox();await page.mouse.click(box.x+x/1180*box.width,box.y+y/450*box.height);};
 await page.click('#regionBtn');await clickCanvas(10,10);await clickCanvas(1140,430);
 await page.click('#markA');await clickCanvas(1170,20);await page.fill('#priceA',String(fixture.hi));
 await page.click('#markB');await clickCanvas(1170,420);await page.fill('#priceB',String(fixture.lo));
 await page.click('#detectBtn');assert.match(await page.locator('#dataPreview').innerText(),/140 lumânări/);
 await page.fill('#symbol','FOTO DEMO');await page.selectOption('#timeframe','H1');await page.fill('#tick','.01');await page.check('#dataConfirmed');await page.click('#analyzeBtn');assert.match(await page.locator('#signal').innerText(),/BUY LONG/);assert.match(await page.locator('#sourceBadge').innerText(),/aproximativ/);pass('Complete screenshot crop → calibration → detection → automatic LONG');
 const download=page.waitForEvent('download');await page.click('#exportBtn');const dl=await download;const file=await dl.path();const exported=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(exported.executionVolume,0);assert.equal(exported.ordersSent,false);assert.equal(exported.source.approximate,true);assert.equal(exported.analysis.direction,'LONG');pass('Export includes provenance, calibration and zero automatic execution');
 // Mock tests OCR integration, not real recognition accuracy.
 await page.evaluate(({hi,lo})=>{window.Tesseract={createWorker:async()=>({setParameters:async()=>{},terminate:async()=>{},recognize:async()=>({data:{blocks:[{paragraphs:[{lines:[{words:[{text:String(hi),confidence:99,bbox:{x0:0,x1:60,y0:25,y1:35}},{text:String((hi+lo)/2),confidence:99,bbox:{x0:0,x1:60,y0:625,y1:635}},{text:String(lo),confidence:99,bbox:{x0:0,x1:60,y0:1225,y1:1235}}]}]}]}]}})})};},fixture);
 await page.click('#ocrBtn');await page.waitForFunction(()=>document.querySelector('#chartStatus').textContent.includes('Axa citită'));
 assert.equal(await page.isChecked('#dataConfirmed'),false);assert.equal(await page.locator('#signal').innerText(),'FĂRĂ SETUP');pass('OCR proposals invalidate prior confirmation and never silently approve prices');
 await page.setViewportSize({width:390,height:844});await page.click('#demoBtn');await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'qa-mobile.png',fullPage:true});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'mobile horizontal overflow');
 await page.locator('#analyzeBtn').scrollIntoViewIfNeeded();assert.ok(await page.locator('#analyzeBtn').isVisible());pass('Mobile layout at 390px has no horizontal overflow');
 await page.setInputFiles('#imageInput',{name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not an image')});await page.waitForFunction(()=>document.querySelector('#sourceStatus').textContent.includes('nu poate'));assert.equal(await page.locator('#signal').innerText(),'FĂRĂ SETUP');pass('Invalid new image clears stale trading levels');
 assert.deepEqual(errors,[]);pass('No uncaught browser errors');console.log(count+' browser tests passed');
}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});