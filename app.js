/* UI v2.0.0 */
'use strict';
const $=id=>document.getElementById(id);
const state={kind:null,image:null,pixels:null,region:null,a:null,b:null,raw:null,bars:null,result:null,evaluation:null,mode:null,corner:null,rev:0,filename:'',demo:false,ocrBusy:false};
const fmt=(n,d=4)=>Number.isFinite(n)?n.toLocaleString('ro-RO',{maximumFractionDigits:d}):'—';
const money=n=>Number.isFinite(n)?n.toLocaleString('ro-RO',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
const ctx=$('chart').getContext('2d',{willReadFrequently:true});
function status(id,s,error=false){$(id).textContent=s;$(id).classList.toggle('error',error);}
function clearReport(msg='Datele au fost schimbate. Verifică sursa și generează din nou analiza.'){
 state.result=null;state.evaluation=null;$('signal').textContent='FĂRĂ SETUP';$('signal').className='';$('signalDetail').textContent=msg;
 ['entryOut','slOut','tpOut','rrOut'].forEach(id=>$(id).textContent='—');$('tpKind').textContent='—';$('reasons').replaceChildren();$('indicators').replaceChildren();$('fibo').replaceChildren();$('activation').textContent='Nicio intrare imediată presupusă.';$('blockers').textContent='Analiza nu a fost confirmată.';$('requiredTarget').textContent='Ținta 2R se calculează separat de ținta tehnică.';resetSizes();
}
function resetSizes(){const body=$('sizes');body.replaceChildren();for(const p of [2,20]){const tr=document.createElement('tr'),td=document.createElement('td'),note=document.createElement('td');td.textContent=p+'%';note.colSpan=4;note.textContent='Date insuficiente';tr.append(td,note);body.append(tr);}}
function invalidate(data=true){state.rev++;if(data)$('dataConfirmed').checked=false;clearReport();draw();}
function resetSource(kind,filename=''){
 state.rev++;state.kind=kind;state.filename=filename;state.image=null;state.pixels=null;state.region=null;state.a=null;state.b=null;state.raw=null;state.bars=null;state.mode=null;state.corner=null;state.demo=kind==='demo';$('dataConfirmed').checked=false;$('specsConfirmed').checked=false;$('targetConfirmed').checked=false;$('target').value='';$('priceA').value='';$('priceB').value='';$('asOf').value='';$('dataPreview').textContent='';$('sourceBadge').textContent=kind==='demo'?'DEMO · date sintetice':kind==='csv'?'CSV · verificare necesară':'FOTO · estimări din pixeli';clearReport();$('photoControls').hidden=kind!=='photo';draw();
}
function draw(){
 const c=$('chart');if(state.image){if(c.width!==state.image.width||c.height!==state.image.height){c.width=state.image.width;c.height=state.image.height;}ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(state.image,0,0);
 const r=state.region;if(r){ctx.save();ctx.strokeStyle='#20bed4';ctx.lineWidth=2;ctx.strokeRect(r.x0,r.y0,r.x1-r.x0,r.y1-r.y0);ctx.restore();}
 if(state.raw){ctx.save();state.raw.forEach((b,i)=>{ctx.strokeStyle=i===state.raw.length-1&&$('excludeLast').checked?'#ffc857':'#548cff';ctx.lineWidth=1.3;ctx.strokeRect(b.x-b.width/2-1,b.highY,b.width+2,Math.max(2,b.lowY-b.highY));});ctx.restore();}
 for(const [p,name,id] of [[state.a,'A','priceA'],[state.b,'B','priceB']]){if(!p)continue;ctx.save();ctx.strokeStyle=name==='A'?'#32c6e8':'#fcaf55';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.moveTo(0,p.y);ctx.lineTo(c.width,p.y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#07111e';ctx.fillRect(7,p.y-22,160,23);ctx.fillStyle=name==='A'?'#32c6e8':'#fcaf55';ctx.font='bold 14px system-ui';ctx.fillText(name+' · '+($(id).value||'preț?'),12,p.y-6);ctx.restore();}
 }else{c.width=900;c.height=420;ctx.fillStyle='#0b1526';ctx.fillRect(0,0,900,420);ctx.fillStyle='#8197b8';ctx.font='22px system-ui';ctx.textAlign='center';ctx.fillText('Încarcă un grafic cu lumânări',450,204);ctx.font='15px system-ui';ctx.fillText('Axa prețurilor trebuie să fie vizibilă.',450,238);ctx.textAlign='left';}
 ['regionBtn','markA','markB'].forEach(id=>$(id).classList.toggle('active',state.mode===id));
}
function setMode(id){if(!state.image){status('chartStatus','Încarcă mai întâi o poză.',true);return;}state.mode=id;state.corner=null;status('chartStatus',id==='regionBtn'?'Atinge colțul stânga-sus al panoului de preț.':'Atinge înălțimea unui preț de pe axă, apoi introdu valoarea pentru '+(id==='markA'?'A.':'B.'));draw();}
$('regionBtn').onclick=()=>setMode('regionBtn');$('markA').onclick=()=>setMode('markA');$('markB').onclick=()=>setMode('markB');
$('chart').addEventListener('click',e=>{
 if(!state.image||!state.mode)return;const rect=$('chart').getBoundingClientRect(),p={x:(e.clientX-rect.left)*$('chart').width/rect.width,y:(e.clientY-rect.top)*$('chart').height/rect.height};
 if(state.mode==='regionBtn'){if(!state.corner){state.corner=p;status('chartStatus','Acum atinge colțul dreapta-jos, înaintea cifrelor axei.');return;}
 const a=state.corner;state.region={x0:Math.min(a.x,p.x),x1:Math.max(a.x,p.x),y0:Math.min(a.y,p.y),y1:Math.max(a.y,p.y)};state.raw=null;state.corner=null;status('chartStatus','Panou selectat. Citește axa automat sau indică A și B.');}
 else{const a=state.mode==='markA';state[a?'a':'b']={y:p.y};$(a?'priceA':'priceB').focus();status('chartStatus','Reper marcat. Introdu prețul afișat la această înălțime.');}
 state.mode=null;invalidate();
});
$('clearBtn').onclick=()=>{state.region=null;state.a=null;state.b=null;state.raw=null;$('priceA').value='';$('priceB').value='';invalidate();status('chartStatus','Selectează din nou panoul și reperele A/B.');};
$('imageInput').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;resetSource('photo',file.name);const rev=state.rev;
 if(file.size>15*1024*1024){status('sourceStatus','Imagine prea mare. Limita este 15 MB.',true);return;}
 try{const url=URL.createObjectURL(file),img=new Image();try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Imaginea nu poate fi deschisă. Folosește PNG, JPG sau WebP.'));img.src=url;});}finally{URL.revokeObjectURL(url);}if(rev!==state.rev)return;
 const ratio=Math.min(1,1800/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(img.naturalWidth*ratio);c.height=Math.round(img.naturalHeight*ratio);const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,c.width,c.height);state.image=c;state.pixels=x.getImageData(0,0,c.width,c.height);draw();status('sourceStatus',file.name+' · imagine locală. Selectează panoul și calibrarea.');
 }catch(err){if(rev===state.rev)status('sourceStatus',err.message,true);}
});
$('csvInput').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;resetSource('csv',file.name);const rev=state.rev;
 try{if(file.size>5*1024*1024)throw Error('CSV prea mare (maximum 5 MB).');const bars=TP.parseCSV(await file.text());if(rev!==state.rev)return;
 const err=TP.validate($('excludeLast').checked?bars.slice(0,-1):bars);if(err)throw Error(err);state.bars=bars;status('sourceStatus',file.name+' · '+bars.length+' rânduri OHLC. Nu am verificat calendarul sau proveniența datelor.');preview(bars);
 }catch(err){if(rev===state.rev)status('sourceStatus',err.message,true);}
});
$('demoBtn').onclick=()=>{resetSource('demo');state.bars=TP.demo('LONG');$('symbol').value='DEMO — fictiv';$('timeframe').value='H1';$('tick').value='0.01';$('dataConfirmed').checked=true;status('sourceStatus','DEMONSTRAȚIE: 140 lumânări sintetice ascendente. Nu sunt cotații de piață.');preview(state.bars);analyze();};
function preview(bars){const b=bars.at(-1);$('dataPreview').textContent=bars.length+' lumânări · ultima extrasă: O '+fmt(b.open)+' / H '+fmt(b.high)+' / L '+fmt(b.low)+' / C '+fmt(b.close)+'. '+(state.kind==='photo'?'Compară cu platforma și verifică marcajele albastre.':'Verifică ordinea cronologică.');}
function makeBars(){if(state.kind!=='photo')return state.bars;return TP.calibrate(state.raw||[],state.a&&{y:state.a.y,price:TP.num($('priceA').value)},state.b&&{y:state.b.y,price:TP.num($('priceB').value)},$('scale').value==='log');}
$('detectBtn').onclick=()=>{
 try{if(!state.image||!state.region)throw Error('Încarcă poza și selectează panoul cu lumânări.');
 // Validate calibration before segmentation; no invented scale.
 TP.mapPrice(state.region.y0,state.a&&{y:state.a.y,price:TP.num($('priceA').value)},state.b&&{y:state.b.y,price:TP.num($('priceB').value)},$('scale').value==='log');
 invalidate();const found=Vision.detect(state.pixels,state.region);state.raw=found.candles;const bars=makeBars();preview(bars);status('chartStatus','Am delimitat '+found.count+' lumânări. Albastru = extrase; galben = ultima exclusă. Confirmă umbrele și că nu lipsește nicio lumânare. '+found.warnings.join(' '));draw();
 }catch(err){state.raw=null;invalidate();status('chartStatus',err.message,true);}
};
let tesseractPromise=null;
function loadOCR(){
 if(window.Tesseract)return Promise.resolve(window.Tesseract);
 if(tesseractPromise)return tesseractPromise;
 tesseractPromise=new Promise((resolve,reject)=>{const s=document.createElement('script'),timer=setTimeout(()=>reject(Error('OCR nu s-a încărcat. Poți calibra manual cu A/B.')),25000);s.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';s.onload=()=>{clearTimeout(timer);window.Tesseract?resolve(window.Tesseract):reject(Error('OCR indisponibil.'));};s.onerror=()=>{clearTimeout(timer);reject(Error('Rețeaua a blocat OCR. Calibrează manual A/B.'));};document.head.append(s);}).catch(e=>{tesseractPromise=null;throw e;});return tesseractPromise;
}
$('ocrBtn').onclick=async()=>{
 if(!state.image||!state.region){status('chartStatus','Selectează mai întâi panoul. Cifrele axei trebuie să rămână în dreapta lui.',true);return;}
 if(state.ocrBusy)return;state.ocrBusy=true;$('ocrBtn').disabled=true;const rev=state.rev;let worker,timer;
 try{status('chartStatus','Citesc cifrele local. Prima utilizare descarcă motorul OCR…');const T=await loadOCR();if(rev!==state.rev)return;
 const r=state.region,x=Math.ceil(r.x1),y=Math.floor(r.y0),w=state.image.width-x,h=Math.ceil(r.y1-r.y0);if(w<20)throw Error('Nu există spațiu pentru axă în dreapta panoului. Restrânge selecția.');
 const zoom=3,c=document.createElement('canvas');c.width=w*zoom;c.height=h*zoom;c.getContext('2d').drawImage(state.image,x,y,w,h,0,0,c.width,c.height);
 worker=await T.createWorker('eng',1,{logger:m=>{if(rev===state.rev&&m.status==='recognizing text')status('chartStatus','Citire axă: '+Math.round(m.progress*100)+'%.');}});
 if(rev!==state.rev)return;await worker.setParameters({tessedit_pageseg_mode:'11',tessedit_char_whitelist:'0123456789.,',user_defined_dpi:'300'});
 const result=await Promise.race([worker.recognize(c,{}, {blocks:true}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Citirea a durat prea mult. Folosește reperele A/B.')),45000);})]);
 if(rev!==state.rev)return;const labels=[];for(const block of result.data.blocks||[])for(const para of block.paragraphs||[])for(const line of para.lines||[])for(const word of line.words||[]){const p=Vision.parseLabel(word.text);if(Number.isFinite(p)&&word.confidence>=45)labels.push({price:p,y:y+(word.bbox.y0+word.bbox.y1)/2/zoom});}
 const fit=Vision.fitAxis(labels,$('scale').value==='log');state.a={y:fit.a.y};state.b={y:fit.b.y};$('priceA').value=String(fit.a.price);$('priceB').value=String(fit.b.price);invalidate();status('chartStatus','Axa citită din '+fit.n+' etichete. Verifică A='+fmt(fit.a.price)+' și B='+fmt(fit.b.price)+' cu cifrele originale; apoi detectează lumânările.');
 }catch(err){if(rev===state.rev)status('chartStatus',err.message,true);}
 finally{clearTimeout(timer);if(worker)await worker.terminate().catch(()=>{});state.ocrBusy=false;$('ocrBtn').disabled=false;draw();}
};
function analyze(){
 clearReport();try{if(!$('dataConfirmed').checked)throw Error('Verifică și bifează confirmarea datelor înainte de analiză.');if(!$('symbol').value.trim()||!$('timeframe').value)throw Error('Completează instrumentul și intervalul lumânărilor.');
 const bars=makeBars();if(!bars||!bars.length)throw Error('Încarcă CSV sau detectează lumânările din poză.');
 const result=TP.analyze(bars,{excludeLast:$('excludeLast').checked,tick:TP.num($('tick').value)});state.result=result;render();status('actionStatus','Analiză recalculată din datele încărcate.');
 }catch(err){clearReport(err.message);status('actionStatus',err.message,true);}
}
$('analyzeBtn').onclick=analyze;
function getCosts(){const o={priceBasis:'reference'};['value','spread','slippage','commission','equity','freeMargin','marginPerLot','minLot','lotStep','dailyUsed'].forEach(k=>o[k]=TP.num($(k).value));return o;}
function selectedTarget(p){if($('target').value.trim())return {value:TP.num($('target').value),kind:$('targetConfirmed').checked?'Nivel introdus și confirmat':'Nivel introdus · neconfirmat',confirmed:$('targetConfirmed').checked};if(p.tp!==null)return {value:p.tp,kind:'Pivot istoric observat',confirmed:true};const v=p.projection1618;return {value:v>0?v:null,kind:'Proiecție Fibonacci 161,8% · neconfirmată',confirmed:false};}
function render(){
 const r=state.result;if(!r)return;state.evaluation=null;resetSizes();$('rrOut').textContent='—';
 $('signal').textContent=r.direction==='LONG'?'BUY LONG condiționat':r.direction==='SHORT'?'SELL SHORT condiționat':'FĂRĂ SETUP';
 $('signal').className=r.direction==='LONG'?'long':r.direction==='SHORT'?'short':'';
 $('sourceBadge').textContent=state.demo?'DEMO · NU TRANZACȚIONA':state.kind==='photo'?'FOTO · aproximativ':'CSV · sursă importată';
 $('signalDetail').textContent=$('symbol').value+' · '+$('timeframe').value+' · '+r.bars.length+' lumânări închise · '+(state.demo?'exemplu sintetic':$('asOf').value?'data sursei: '+$('asOf').value.replace('T',' '):'data sursei neconfirmată');
 $('reasons').replaceChildren();r.reasons.forEach(s=>{const li=document.createElement('li');li.textContent=s;$('reasons').append(li);});
 $('indicators').replaceChildren();if(r.ind)for(const [key,name] of [['ema20','EMA20'],['ema50','EMA50'],['atr14','ATR14'],['rsi14','RSI14'],['macd','MACD'],['macdSignal','Semnal MACD']]){const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=fmt(r.ind[key]);div.append(dt,dd);$('indicators').append(div);}
 if(!r.plan){$('blockers').textContent=r.error||'DE URMĂRIT. '+r.reasons.join(' ');return;}
 const p=r.plan,target=selectedTarget(p);$('entryOut').textContent=fmt(p.entry,8);$('slOut').textContent=fmt(p.sl,8);$('tpOut').textContent=fmt(target.value,8);$('tpKind').textContent=target.kind;
 const side=r.direction==='LONG'?'peste':'sub';
 $('activation').textContent='Observă o lumânare închisă '+side+' '+fmt(p.trigger)+', apoi un retest menținut. Intrare de referință '+fmt(p.entry)+'. Recalculează dacă intrarea disponibilă diferă; nu este ordin la piață. SL: '+fmt(p.sl)+'; tampon '+fmt(p.pad)+' (maxim dintre 2 ticks și 0,25 ATR).';
 const blocks=[];if(state.demo)blocks.push('Exemplu sintetic.');if(!target.confirmed)blocks.push('TP este o proiecție sau un nivel neconfirmat.');
 if(state.kind==='photo')blocks.push('OHLC și indicatorii sunt estimări din pixeli; verifică în platformă.');
 if(!$('asOf').value&&!state.demo)blocks.push('Data sursei nu este confirmată.');
 if($('position').value!=='no')blocks.push('Poziție existentă sau statut necunoscut: fără CFD nou.');
 if($('event').value!=='no')blocks.push('Calendar/eveniment major neverificat ori risc activ.');
 if($('market').value!=='open')blocks.push('Piața/produsul nu sunt confirmate disponibile.');
 if(!$('specsConfirmed').checked)blocks.push('Costurile și specificațiile nu sunt confirmate.');
 const costs=getCosts();costs.target=target.value;let ev=TP.evaluate(p,r.direction,costs);if(ev.error)blocks.push(ev.error);else{
 if(!$('specsConfirmed').checked){blocks.push('Lotajul rămâne necalculat până la confirmarea specificațiilor.');}else{
 state.evaluation=ev;const body=$('sizes');body.replaceChildren();ev.sizes.forEach(s=>{const tr=document.createElement('tr');[s.pct+'%',fmt(s.lots,8),money(s.loss),money(s.profit),money(s.margin)].forEach(t=>{const td=document.createElement('td');td.textContent=t;tr.append(td);});body.append(tr);});}
 $('rrOut').textContent=Number.isFinite(ev.rr)?fmt(ev.rr,2)+' : 1':'—';if(ev.rr===null||ev.rr<2)blocks.push('Raportul recompensă/risc net nu atinge 2:1.');
 $('requiredTarget').textContent='Pentru 2R net ar fi necesar '+fmt(ev.requiredTP,8)+'. Este doar prag aritmetic, nu o țintă tehnică. Distanță SL '+fmt(ev.riskDistance)+'; distanță TP '+fmt(ev.rewardDistance)+'; cost estimat '+fmt(ev.costPrice)+' unități de preț.';
 }
 $('blockers').textContent='DE URMĂRIT · '+blocks.join(' ')+' Probabilitatea nu este calibrată; niciun ordin selectat.';
 $('fibo').replaceChildren();const intro=document.createElement('p');intro.className='hint';intro.textContent='Extreme folosite: low '+fmt(p.swingLow)+' / high '+fmt(p.swingHigh)+'. Retrageri măsurate de la '+(r.direction==='LONG'?'maxim în jos.':'minim în sus.');$('fibo').append(intro);const table=document.createElement('table');p.fib.forEach(v=>{const tr=document.createElement('tr'),label=document.createElement('td'),value=document.createElement('td');label.textContent=fmt(v.percent,1)+'%';value.textContent=fmt(v.price);tr.append(label,value);table.append(tr);});$('fibo').append(table);
}
$('costBtn').onclick=()=>{if(!state.result){status('actionStatus','Generează întâi analiza tehnică.',true);return;}render();status('actionStatus','Costurile și simularea au fost actualizate.');};
['priceA','priceB','tick','symbol','asOf'].forEach(id=>$(id).addEventListener('input',()=>invalidate()));
['scale','timeframe','excludeLast'].forEach(id=>$(id).addEventListener('change',()=>invalidate()));
$('dataConfirmed').addEventListener('change',()=>{state.rev++;clearReport();});
['value','spread','slippage','commission','equity','freeMargin','marginPerLot','minLot','lotStep','dailyUsed'].forEach(id=>$(id).addEventListener('input',()=>{$('specsConfirmed').checked=false;if(state.result)render();}));
['position','event','market','specsConfirmed','targetConfirmed'].forEach(id=>$(id).addEventListener('change',()=>{if(state.result)render();}));
$('target').addEventListener('input',()=>{$('targetConfirmed').checked=false;if(state.result)render();});
$('exportBtn').onclick=()=>{if(!state.result){status('actionStatus','Nu există analiză de exportat.',true);return;}const payload={version:'2.0.0',exportedAt:new Date().toISOString(),symbol:$('symbol').value,timeframe:$('timeframe').value,source:{kind:state.kind,filename:state.filename,asOf:$('asOf').value||null,synthetic:state.demo,approximate:state.kind==='photo',confirmed:$('dataConfirmed').checked,excludeLast:$('excludeLast').checked,scale:$('scale').value,calibration:state.kind==='photo'?{a:state.a&&{...state.a,price:TP.num($('priceA').value)},b:state.b&&{...state.b,price:TP.num($('priceB').value)}}:null},analysis:state.result,target:state.result.plan?selectedTarget(state.result.plan):null,costs:getCosts(),simulation:state.evaluation,checks:{specs:$('specsConfirmed').checked,position:$('position').value,market:$('market').value,event:$('event').value},executionVolume:0,probability:null,ordersSent:false};const b=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='analiza-tp-sl.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('actionStatus','Analiza a fost exportată local.');};
$('printBtn').onclick=()=>window.print();
draw();
