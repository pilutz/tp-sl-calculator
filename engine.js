/* TP/SL Studio v2 — pure calculations, no orders or market feed. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TP=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function num(v){if(v===null||v===undefined||String(v).trim()==='')return NaN;return Number(String(v).trim().replace(/\s/g,'').replace(',','.'));}
function round(n,d=6){return Number(n.toFixed(d));}
function validate(bars){
 if(!Array.isArray(bars)||bars.length<60)return 'Sunt necesare minimum 60 de lumânări închise, consecutive.';
 for(let i=0;i<bars.length;i++){const b=bars[i];if(!['open','high','low','close'].every(k=>finite(b[k])&&b[k]>0))return 'OHLC conține prețuri lipsă sau invalide.';
 if(b.high<Math.max(b.open,b.close,b.low)||b.low>Math.min(b.open,b.close,b.high))return 'O lumânare are high/low incompatibile cu open/close.';}
 return null;
}
function ema(values,n){const out=Array(values.length).fill(null);if(values.length<n)return out;let v=values.slice(0,n).reduce((a,b)=>a+b,0)/n;out[n-1]=v;for(let i=n;i<values.length;i++){v+=(values[i]-v)*2/(n+1);out[i]=v;}return out;}
function atr(bars,n=14){const tr=bars.map((b,i)=>i?Math.max(b.high-b.low,Math.abs(b.high-bars[i-1].close),Math.abs(b.low-bars[i-1].close)):b.high-b.low);const out=Array(bars.length).fill(null);if(tr.length<n)return out;let v=tr.slice(0,n).reduce((a,b)=>a+b,0)/n;out[n-1]=v;for(let i=n;i<tr.length;i++){v=(v*(n-1)+tr[i])/n;out[i]=v;}return out;}
function rsi(values,n=14){const out=Array(values.length).fill(null);if(values.length<=n)return out;let up=0,dn=0;const calc=()=>up===0&&dn===0?50:dn===0?100:100-100/(1+up/dn);for(let i=1;i<=n;i++){const d=values[i]-values[i-1];up+=Math.max(d,0)/n;dn+=Math.max(-d,0)/n;}out[n]=calc();for(let i=n+1;i<values.length;i++){const d=values[i]-values[i-1];up=(up*(n-1)+Math.max(d,0))/n;dn=(dn*(n-1)+Math.max(-d,0))/n;out[i]=calc();}return out;}
function pivots(bars,r=2){const highs=[],lows=[];for(let i=r;i<bars.length-r;i++){let hi=true,lo=true;for(let j=i-r;j<=i+r;j++){if(j===i)continue;if(bars[j].high>=bars[i].high)hi=false;if(bars[j].low<=bars[i].low)lo=false;}if(hi)highs.push({i,price:bars[i].high});if(lo)lows.push({i,price:bars[i].low});}return {highs,lows};}
function indicators(bars){const c=bars.map(b=>b.close),e20=ema(c,20),e50=ema(c,50),a=atr(bars),r=rsi(c);const e12=ema(c,12),e26=ema(c,26),m=c.map((_,i)=>e26[i]===null?null:e12[i]-e26[i]);const signal=ema(m.slice(25),9),last=bars.length-1;return {ema20:e20[last],ema50:e50[last],slope20:e20[last]-e20[last-5],atr14:a[last],rsi14:r[last],macd:m[last],macdSignal:signal.at(-1)};}
function snap(v,t,up){return round((up?Math.ceil(v/t-1e-9):Math.floor(v/t+1e-9))*t,10);}
function analyze(input,opts={}){
 const bars=opts.excludeLast?input.slice(0,-1):input.slice(),error=validate(bars);
 if(error)return {direction:'NONE',error,reasons:[error],bars,plan:null};
 const ind=indicators(bars),ps=pivots(bars),h=ps.highs.slice(-2),l=ps.lows.slice(-2),last=bars.at(-1);
 const base={bars,ind,pivots:ps,plan:null,direction:'NONE',reasons:[]};
 if(h.length<2||l.length<2){base.reasons=['Nu sunt două maxime și două minime locale confirmate.'];return base;}
 const tol=ind.atr14*.06;
 const hh=h[1].price>h[0].price+tol,hl=l[1].price>l[0].price+tol,lh=h[1].price<h[0].price-tol,ll=l[1].price<l[0].price-tol;
 const bull=hh&&hl&&ind.ema20>ind.ema50&&ind.slope20>0&&last.close>ind.ema20;
 const bear=lh&&ll&&ind.ema20<ind.ema50&&ind.slope20<0&&last.close<ind.ema20;
 if(!bull&&!bear){base.reasons=['Structura swing-urilor și EMA20/EMA50 nu confirmă aceeași direcție.'];return base;}
 base.direction=bull?'LONG':'SHORT';base.reasons=[bull?'Ultimele două maxime și minime locale sunt în urcare.':'Ultimele două maxime și minime locale sunt în coborâre.',bull?'Prețul este peste EMA20; EMA20 este peste EMA50 și urcă.':'Prețul este sub EMA20; EMA20 este sub EMA50 și coboară.','Pivoturile sunt confirmate numai după două lumânări ulterioare.'];
 if(!finite(opts.tick)||opts.tick<=0){base.reasons.push('Introdu pasul de preț verificat pentru calculul intrării, SL și TP.');return base;}
 const tick=opts.tick,pad=Math.max(2*tick,ind.atr14*.25),dir=bull?1:-1;
 const level=bull?Math.max(h[1].price,...bars.slice(-3).map(b=>b.high)):Math.min(l[1].price,...bars.slice(-3).map(b=>b.low));
 const entry=snap(level+dir*tick,tick,bull);
 const sl=snap((bull?l[1].price:h[1].price)-dir*pad,tick,!bull);
 const risk=dir*(entry-sl);
 if(risk<=0){base.direction='NONE';base.reasons=['Structura nu permite un stop coerent.'];return base;}
 const levels=(bull?ps.highs:ps.lows).map(p=>p.price).filter(p=>dir*(p-entry)>2*tick).sort((a,b)=>dir*(a-b));
 const tp=levels.length?snap(levels[0]-dir*tick,tick,!bull):null;
 const lo=Math.min(l[1].price,h[1].price),hi=Math.max(l[1].price,h[1].price);
 const fib=[.236,.382,.5,.618,.786,1].map(p=>({percent:p*100,price:round(bull?hi-(hi-lo)*p:lo+(hi-lo)*p)}));
 base.plan={entry,sl,tp,riskDistance:risk,pad,trigger:level,rrGross:tp?dir*(tp-entry)/risk:null,projection1618:round(bull?hi+.618*(hi-lo):lo-.618*(hi-lo)),fib,swingLow:lo,swingHigh:hi,tick,sourceTarget:tp?'pivot':'missing'};
 if(!tp)base.reasons.push('Aucun suport/rezistență istoric din captură dincolo de intrare: TP tehnic neconfirmat.'.replace('Aucun','Niciun'));
 if(Math.abs(last.close-ind.ema20)>2*ind.atr14)base.reasons.push('Prețul este extins la peste 2 ATR față de EMA20: așteaptă o consolidare.');
 return base;
}
function evaluate(plan,direction,opts){
 if(!plan||!['LONG','SHORT'].includes(direction))return {error:'Lipsește un scenariu tehnic complet.'};
 const {entry,sl}=plan,tp=opts.target??plan.tp,sign=direction==='LONG'?1:-1;
 if(![entry,sl].every(finite)||sign*(entry-sl)<=0)return {error:'SL trebuie să fie la invalidare, în partea opusă TP.'};
 if(tp!==null&&tp!==undefined&&(!finite(tp)||tp<=0||sign*(tp-entry)<=0))return {error:'TP este pe partea greșită a intrării.'};
 const required=['value','spread','slippage','commission','equity','freeMargin','marginPerLot','minLot','lotStep','dailyUsed'];
 if(!required.every(k=>finite(opts[k])))return {error:'Completează costurile, capitalul și specificațiile verificate; câmpurile goale nu înseamnă zero.'};
 if(opts.value<=0||opts.equity<=0||opts.marginPerLot<=0||opts.minLot<=0||opts.lotStep<=0||['spread','slippage','commission','freeMargin','dailyUsed'].some(k=>opts[k]<0))return {error:'Capitalul și specificațiile trebuie să fie pozitive, costurile cel puțin zero.'};
 const riskDist=sign*(entry-sl),costPrice=(opts.priceBasis==='executable'?0:opts.spread)+opts.slippage+opts.commission/opts.value;
 const riskLot=(riskDist+costPrice)*opts.value,rewardLot=tp==null?null:(sign*(tp-entry)-costPrice)*opts.value;
 const rr=rewardLot===null?null:rewardLot/riskLot,rrGoal=2;
 const requiredTP=entry+sign*(rrGoal*riskDist+(rrGoal+1)*costPrice);
 const dailyRemaining=Math.max(0,opts.equity*.2-opts.dailyUsed);
 const sizes=[2,20].map(pct=>{const budget=Math.min(opts.equity*pct/100,dailyRemaining),maxLots=Math.min(budget/riskLot,opts.freeMargin/opts.marginPerLot);
 // Valid volume grid starts at the verified minimum.
 const lots=maxLots+1e-10<opts.minLot?0:round(opts.minLot+Math.floor((maxLots-opts.minLot)/opts.lotStep+1e-9)*opts.lotStep,8);
 return {pct,budget,lots,loss:lots*riskLot,profit:rewardLot===null?null:lots*rewardLot,margin:lots*opts.marginPerLot,executionVolume:0};});
 return {riskLot,rewardLot,rr,costPrice,requiredTP,sizes,tp,riskDistance:riskDist,rewardDistance:tp==null?null:sign*(tp-entry),dailyRemaining};
}
function mapPrice(y,a,b,log=false){if(!a||!b||![a.y,a.price,b.y,b.price,y].every(finite)||a.price<=0||b.price<=0||Math.abs(a.y-b.y)<8||a.price===b.price)throw Error('Repere A/B invalide: două niveluri separate, cu prețuri diferite.');
 if((a.y-b.y)*(a.price-b.price)>=0)throw Error('Pe grafic, prețul mai mare trebuie să fie mai sus.');
 const p=log?Math.exp(Math.log(a.price)+(y-a.y)*(Math.log(b.price)-Math.log(a.price))/(b.y-a.y)):a.price+(y-a.y)*(b.price-a.price)/(b.y-a.y);
 if(!finite(p)||p<=0)throw Error('Calibrarea produce un preț invalid.');return p;}
function calibrate(raw,a,b,log=false){return raw.map(v=>({open:mapPrice(v.openY,a,b,log),high:mapPrice(v.highY,a,b,log),low:mapPrice(v.lowY,a,b,log),close:mapPrice(v.closeY,a,b,log),x:v.x}));}
function parseCSV(text){
 const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/).filter(s=>s.trim());if(lines.length<2)throw Error('CSV gol.');
 const sep=lines[0].includes(';')?';':',',split=s=>s.split(sep).map(v=>v.trim().replace(/^"|"$/g,''));
 const heads=split(lines[0]).map(s=>s.toLowerCase()),keys=['open','high','low','close'],ix=keys.map(k=>heads.indexOf(k));
 if(ix.some(i=>i<0))throw Error('CSV necesită coloanele open, high, low, close. Ordine cronologică vechi → nou.');
 const timeI=heads.findIndex(h=>['time','date','timestamp'].includes(h));let previous=-Infinity;
 return lines.slice(1).map(line=>{const cells=split(line),b={};keys.forEach((k,j)=>b[k]=num(cells[ix[j]]));if(timeI>=0){const s=cells[timeI],t=/^\d+$/.test(s)?Number(s):Date.parse(s);if(!finite(t)||t<=previous)throw Error('Timestampurile trebuie să fie valide, unice și crescătoare.');previous=t;b.time=s;}return b;});
}
function demo(kind='LONG'){
 // Synthetic, reproducible teaching data. Not prices from an instrument.
 const bars=[];for(let i=0;i<140;i++){const base=100+(kind==='LONG'?i*.11:kind==='SHORT'?-i*.11:0)+Math.sin(i*.43)*1.15;const open=base+Math.sin(i*1.7)*.12,close=base+Math.cos(i*1.3)*.17;bars.push({open,close,high:Math.max(open,close)+.28,low:Math.min(open,close)-.28});}return bars;}
return {num,round,validate,ema,atr,rsi,pivots,indicators,analyze,evaluate,mapPrice,calibrate,parseCSV,demo};
});