/* TP/SL Studio v3.3 — bilateral LONG/SHORT comparison; no orders or market feed. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TP=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function num(v){if(v===null||v===undefined||String(v).trim()==='')return NaN;return Number(String(v).trim().replace(/\s/g,'').replace(',','.'));}
function round(n,d=6){return Number(n.toFixed(d));}
function validate(bars,min=35){
 if(!Array.isArray(bars)||bars.length<min)return 'Sunt necesare minimum '+min+' de lumânări închise, consecutive.';
 for(let i=0;i<bars.length;i++){const b=bars[i];if(!['open','high','low','close'].every(k=>finite(b[k])&&b[k]>0))return 'OHLC conține prețuri lipsă sau invalide.';
 if(b.high<Math.max(b.open,b.close,b.low)||b.low>Math.min(b.open,b.close,b.high))return 'O lumânare are high/low incompatibile cu open/close.';}
 return null;
}
function ema(values,n){const out=Array(values.length).fill(null);if(values.length<n)return out;let v=values.slice(0,n).reduce((a,b)=>a+b,0)/n;out[n-1]=v;for(let i=n;i<values.length;i++){v+=(values[i]-v)*2/(n+1);out[i]=v;}return out;}
function atr(bars,n=14){const tr=bars.map((b,i)=>i?Math.max(b.high-b.low,Math.abs(b.high-bars[i-1].close),Math.abs(b.low-bars[i-1].close)):b.high-b.low);const out=Array(bars.length).fill(null);if(tr.length<n)return out;let v=tr.slice(0,n).reduce((a,b)=>a+b,0)/n;out[n-1]=v;for(let i=n;i<tr.length;i++){v=(v*(n-1)+tr[i])/n;out[i]=v;}return out;}
function rsi(values,n=14){const out=Array(values.length).fill(null);if(values.length<=n)return out;let up=0,dn=0;const calc=()=>up===0&&dn===0?50:dn===0?100:100-100/(1+up/dn);for(let i=1;i<=n;i++){const d=values[i]-values[i-1];up+=Math.max(d,0)/n;dn+=Math.max(-d,0)/n;}out[n]=calc();for(let i=n+1;i<values.length;i++){const d=values[i]-values[i-1];up=(up*(n-1)+Math.max(d,0))/n;dn=(dn*(n-1)+Math.max(-d,0))/n;out[i]=calc();}return out;}
function pivots(bars,r=2){const highs=[],lows=[];for(let i=r;i<bars.length-r;i++){let hi=true,lo=true;for(let j=i-r;j<=i+r;j++){if(j===i)continue;if(bars[j].high>=bars[i].high)hi=false;if(bars[j].low<=bars[i].low)lo=false;}if(hi)highs.push({i,price:bars[i].high});if(lo)lows.push({i,price:bars[i].low});}return {highs,lows};}
function indicators(bars){const c=bars.map(b=>b.close),e20=ema(c,20),e50=ema(c,50),a=atr(bars),r=rsi(c),e12=ema(c,12),e26=ema(c,26),m=c.map((_,i)=>e26[i]===null?null:e12[i]-e26[i]),validMacd=m.filter(finite),signal=ema(validMacd,9),last=bars.length-1;return {ema20:e20[last],ema50:e50[last],slope20:e20[last]-e20[last-5],atr14:a[last],rsi14:r[last],macd:m[last],macdSignal:signal.at(-1)??null};}
function snap(v,t,up){return round((up?Math.ceil(v/t-1e-9):Math.floor(v/t+1e-9))*t,10);}
function trendEvidence(direction,highs,lows,ind,last){
 const sign=direction==='LONG'?1:-1,tol=ind.atr14*.06,full=finite(ind.ema50),checks=[
  {key:'highs',label:direction==='LONG'?'maxime locale în urcare':'maxime locale în coborâre',available:highs.length>=2,pass:highs.length>=2&&sign*(highs.at(-1).price-highs.at(-2).price)>tol,weight:22},
  {key:'lows',label:direction==='LONG'?'minime locale în urcare':'minime locale în coborâre',available:lows.length>=2,pass:lows.length>=2&&sign*(lows.at(-1).price-lows.at(-2).price)>tol,weight:22},
  {key:'priceEma20',label:direction==='LONG'?'preț peste EMA20':'preț sub EMA20',available:finite(ind.ema20),pass:finite(ind.ema20)&&sign*(last.close-ind.ema20)>0,weight:18},
  {key:'slopeEma20',label:direction==='LONG'?'EMA20 în urcare':'EMA20 în coborâre',available:finite(ind.slope20),pass:finite(ind.slope20)&&sign*ind.slope20>0,weight:18},
  {key:'emaStack',label:direction==='LONG'?'EMA20 peste EMA50':'EMA20 sub EMA50',available:full,pass:full&&sign*(ind.ema20-ind.ema50)>0,weight:20}
 ];
 const available=checks.filter(x=>x.available),passed=available.filter(x=>x.pass),total=available.reduce((s,x)=>s+x.weight,0),earned=passed.reduce((s,x)=>s+x.weight,0),enough=checks.slice(0,4).every(x=>x.available)&&(!full||checks[4].available),aligned=enough&&available.every(x=>x.pass);
 return {direction,aligned,score:total?Math.round(earned/total*100):0,passed:passed.length,total:available.length,checks};
}
function directionalPlan(direction,bars,ind,ps,tick){
 const bull=direction==='LONG',sign=bull?1:-1,high=ps.highs.at(-1),low=ps.lows.at(-1);
 if(!high||!low)return {plan:null,error:'Lipsește cel puțin un swing high sau swing low confirmat.'};
 if(!finite(tick)||tick<=0)return {plan:null,error:'Lipsește pasul minim de preț verificat.'};
 const pad=Math.max(2*tick,ind.atr14*.25),level=bull?Math.max(high.price,...bars.slice(-3).map(b=>b.high)):Math.min(low.price,...bars.slice(-3).map(b=>b.low)),entry=snap(level+sign*tick,tick,bull),sl=snap((bull?low.price:high.price)-sign*pad,tick,!bull),risk=sign*(entry-sl);
 if(risk<=0)return {plan:null,error:'Structura nu permite un stop coerent pentru '+direction+'.'};
 const levels=(bull?ps.highs:ps.lows).map(p=>p.price).filter(p=>sign*(p-entry)>2*tick).sort((a,b)=>sign*(a-b)),tp=levels.length?snap(levels[0]-sign*tick,tick,!bull):null,lo=Math.min(low.price,high.price),hi=Math.max(low.price,high.price),fib=[.236,.382,.5,.618,.786,1].map(p=>({percent:p*100,price:round(bull?hi-(hi-lo)*p:lo+(hi-lo)*p)}));
 const rawProjection=round(bull?hi+.618*(hi-lo):lo-.618*(hi-lo)),projection1618=sign*(rawProjection-entry)>0?rawProjection:null;
 const plan={entry,sl,tp,riskDistance:risk,pad,trigger:level,rrGross:tp!==null?sign*(tp-entry)/risk:null,projection1618,fib,swingLow:lo,swingHigh:hi,tick,sourceTarget:tp!==null?'pivot':'missing',projectionRejected:projection1618===null};
 return {plan,error:null};
}
function analyze(input,opts={}){
 const bars=opts.excludeLast?input.slice(0,-1):input.slice(),error=validate(bars,35);
 if(error)return {direction:'NONE',error,reasons:[error],bars,plan:null,quality:0};
 const ind=indicators(bars),ps=pivots(bars),h=ps.highs.slice(-2),l=ps.lows.slice(-2),last=bars.at(-1);
 const evidence={LONG:trendEvidence('LONG',ps.highs,ps.lows,ind,last),SHORT:trendEvidence('SHORT',ps.highs,ps.lows,ind,last)},candidates={};
 for(const direction of ['LONG','SHORT']){const built=directionalPlan(direction,bars,ind,ps,opts.tick);candidates[direction]={direction,...evidence[direction],...built,targetConfirmed:built.plan?.tp!==null};}
 const base={bars,ind,pivots:ps,candidates,plan:null,direction:'NONE',reasons:[],quality:Math.min(25,8+(bars.length-35)*.35)};
 if(h.length<2||l.length<2){base.reasons=['Nu sunt două maxime și două minime locale confirmate. Ambele sensuri rămân nevalidate.'];return base;}
 const tol=ind.atr14*.06,hh=h[1].price>h[0].price+tol,hl=l[1].price>l[0].price+tol,lh=h[1].price<h[0].price-tol,ll=l[1].price<l[0].price-tol,full=finite(ind.ema50);
 const bull=evidence.LONG.aligned,bear=evidence.SHORT.aligned;
 if(!bull&&!bear){base.reasons=['Structura swing-urilor și filtrul de trend nu confirmă aceeași direcție.'];return base;}
 base.direction=bull?'LONG':'SHORT';base.quality+=25+(full?25:10)+(ind.rsi14>=25&&ind.rsi14<=75?10:5);
 base.reasons=[bull?'Ultimele două maxime și minime locale sunt în urcare.':'Ultimele două maxime și minime locale sunt în coborâre.',full?(bull?'Prețul este peste EMA20; EMA20 este peste EMA50 și urcă.':'Prețul este sub EMA20; EMA20 este sub EMA50 și coboară.'):(bull?'EMA20 urcă și prețul este peste ea; EMA50 nu are încă 50 de bare.':'EMA20 coboară și prețul este sub ea; EMA50 nu are încă 50 de bare.'),'Pivoturile sunt confirmate numai după două lumânări ulterioare.'];
 if(!finite(opts.tick)||opts.tick<=0){base.reasons.push('Introdu pasul de preț verificat pentru calculul intrării, SL și TP.');return base;}
 const chosen=candidates[base.direction];if(!chosen.plan){base.reasons.push(chosen.error);return base;}const tp=chosen.plan.tp;
 if(tp!==null)base.quality+=15;
 base.quality=Math.min(100,Math.round(base.quality));
 base.plan=chosen.plan;
 if(tp===null)base.reasons.push('Niciun suport/rezistență istoric din captură dincolo de intrare: TP tehnic neconfirmat.');
 if(Math.abs(last.close-ind.ema20)>2*ind.atr14)base.reasons.push('Prețul este extins la peste 2 ATR față de EMA20: așteaptă o consolidare.');
 return base;
}
function payoff(plan,direction,opts={}){
 if(!plan||!['LONG','SHORT'].includes(direction))return {error:'Lipsește un scenariu tehnic complet.'};
 const target=opts.target??plan.tp,sign=direction==='LONG'?1:-1,{entry,sl}=plan;
 if(![entry,sl].every(finite)||sign*(entry-sl)<=0)return {error:'SL trebuie să fie la invalidare, în partea opusă TP.'};
 if(!finite(target)||target<=0||sign*(target-entry)<=0)return {error:'Lipsește o țintă tehnică validă pe partea corectă a intrării.'};
 const riskDistance=sign*(entry-sl),rewardDistance=sign*(target-entry),grossRR=rewardDistance/riskDistance,fields=['value','spread','slippage','commission'],hasCosts=fields.every(k=>finite(opts[k]))&&opts.value>0&&opts.spread>=0&&opts.slippage>=0&&opts.commission>=0;
 if(!hasCosts)return {riskDistance,rewardDistance,grossRR,netAvailable:false,target};
 const costPrice=(opts.priceBasis==='executable'?0:opts.spread)+opts.slippage+opts.commission/opts.value,netRiskDistance=riskDistance+costPrice,netRewardDistance=rewardDistance-costPrice,rr=netRewardDistance/netRiskDistance;
 return {riskDistance,rewardDistance,grossRR,costPrice,netRiskDistance,netRewardDistance,rr,netAvailable:true,target};
}
function evaluate(plan,direction,opts){
 if(!plan||!['LONG','SHORT'].includes(direction))return {error:'Lipsește un scenariu tehnic complet.'};
 const {entry,sl}=plan,tp=opts.target??plan.tp,sign=direction==='LONG'?1:-1;
 if(![entry,sl].every(finite)||sign*(entry-sl)<=0)return {error:'SL trebuie să fie la invalidare, în partea opusă TP.'};
 if(tp!==null&&tp!==undefined&&(!finite(tp)||tp<=0||sign*(tp-entry)<=0))return {error:'TP este pe partea greșită a intrării.'};
 const required=['value','spread','slippage','commission','equity','freeMargin','marginPerLot','minLot','lotStep','dailyUsed'];
 if(!required.every(k=>finite(opts[k])))return {error:'Completează costurile, capitalul și specificațiile verificate; câmpurile goale nu înseamnă zero.'};
 if(opts.value<=0||opts.equity<=0||opts.marginPerLot<=0||opts.minLot<=0||opts.lotStep<=0||['spread','slippage','commission','freeMargin','dailyUsed'].some(k=>opts[k]<0))return {error:'Capitalul și specificațiile trebuie să fie pozitive, costurile cel puțin zero.'};
 const p=payoff(plan,direction,{...opts,target:tp});if(p.error)return p;const riskDist=p.riskDistance,costPrice=p.costPrice,riskLot=p.netRiskDistance*opts.value,rewardLot=p.netRewardDistance*opts.value,rr=p.rr,rrGoal=2,requiredTP=entry+sign*(rrGoal*riskDist+(rrGoal+1)*costPrice),dailyRemaining=Math.max(0,opts.equity*.2-opts.dailyUsed);
 const sizes=[2,20].map(pct=>{const budget=Math.min(opts.equity*pct/100,dailyRemaining),maxLots=Math.min(budget/riskLot,opts.freeMargin/opts.marginPerLot),lots=maxLots+1e-10<opts.minLot?0:round(opts.minLot+Math.floor((maxLots-opts.minLot)/opts.lotStep+1e-9)*opts.lotStep,8);return {pct,budget,lots,loss:lots*riskLot,profit:rewardLot===null?null:lots*rewardLot,margin:lots*opts.marginPerLot,executionVolume:0};});
 return {riskLot,rewardLot,rr,costPrice,requiredTP,sizes,tp,riskDistance:riskDist,rewardDistance:tp==null?null:sign*(tp-entry),dailyRemaining};
}
function wilson(success,total,z=1.95996398454){if(!Number.isInteger(success)||!Number.isInteger(total)||total<=0||success<0||success>total)return null;const p=success/total,z2=z*z,den=1+z2/total,center=(p+z2/(2*total))/den,margin=z*Math.sqrt((p*(1-p)+z2/(4*total))/total)/den;return {low:Math.max(0,center-margin),high:Math.min(1,center+margin)};}
function backtest(input,opts={}){
 const tick=opts.tick,horizon=Math.max(1,Math.floor(opts.horizon||12)),wanted=opts.direction;
 if(!finite(tick)||tick<=0)return {sufficient:false,reason:'Lipsește tick-ul verificat.'};
 if(!['LONG','SHORT'].includes(wanted))return {sufficient:false,reason:'Nu există direcție curentă de evaluat.'};
 const valid=validate(input,1200);if(valid)return {sufficient:false,reason:'Sunt necesare minimum 1.200 de lumânări OHLC pentru statistica istorică.'};
 const bars=input.slice(-5000),start=Math.max(300,Math.floor(bars.length*.5)),result={wins:0,losses:0,expiries:0,notActivated:0,trades:0,sumR:0,horizon,direction:wanted,holdoutBars:bars.length-start,sourceBars:bars.length},observations=[];
 for(let t=start;t<bars.length-horizon-3;t++){
  const a=analyze(bars.slice(Math.max(0,t-299),t+1),{tick});if(a.direction!==wanted||!a.plan)continue;const p=a.plan,sign=wanted==='LONG'?1:-1,target=p.entry+sign*2*p.riskDistance;let active=-1;
  for(let j=t+1;j<=Math.min(t+3,bars.length-1);j++){if((wanted==='LONG'?bars[j].high>=p.entry:bars[j].low<=p.entry)){active=j;break;}}
  if(active<0){result.notActivated++;continue;}let exit=-1,outcome='',rValue=0,end=Math.min(active+horizon-1,bars.length-1);
  for(let j=active;j<=end;j++){const stop=wanted==='LONG'?bars[j].low<=p.sl:bars[j].high>=p.sl,win=wanted==='LONG'?bars[j].high>=target:bars[j].low<=target;
   if(stop){outcome='loss';rValue=-1;exit=j;break;}if(win){outcome='win';rValue=2;exit=j;break;}}
  if(!outcome){outcome='expiry';rValue=Math.max(-1,Math.min(2,sign*(bars[end].close-p.entry)/p.riskDistance));exit=end;}
  result.trades++;result.sumR+=rValue;result[outcome==='win'?'wins':outcome==='loss'?'losses':'expiries']++;observations.push({at:t,outcome,r:rValue});t=exit;
 }
 result.hitRate=result.trades?result.wins/result.trades:null;result.lossRate=result.trades?result.losses/result.trades:null;result.expiryRate=result.trades?result.expiries/result.trades:null;result.meanR=result.trades?result.sumR/result.trades:null;result.activationRate=(result.trades+result.notActivated)?result.trades/(result.trades+result.notActivated):null;result.interval=wilson(result.wins,result.trades);
 let grossGain=0,grossLoss=0,curve=0,peak=0,maxDrawdown=0;for(const o of observations){if(o.r>0)grossGain+=o.r;else grossLoss-=o.r;curve+=o.r;peak=Math.max(peak,curve);maxDrawdown=Math.max(maxDrawdown,peak-curve);}result.profitFactor=grossLoss>0?grossGain/grossLoss:null;result.maxDrawdownR=maxDrawdown;
 result.segments=Array.from({length:4},(_,i)=>{const from=start+(bars.length-start)*i/4,to=start+(bars.length-start)*(i+1)/4,x=observations.filter(o=>o.at>=from&&o.at<to),wins=x.filter(o=>o.outcome==='win').length;return {part:i+1,trades:x.length,hitRate:x.length?wins/x.length:null,meanR:x.length?x.reduce((s,o)=>s+o.r,0)/x.length:null};});const stable=result.segments.filter(x=>x.trades>=5&&finite(x.hitRate));result.stabilityRange=stable.length>=2?{low:Math.min(...stable.map(x=>x.hitRate)),high:Math.max(...stable.map(x=>x.hitRate)),segments:stable.length}:null;
 result.sufficient=result.trades>=30;result.reason=result.sufficient?'Estimare descriptivă pe segmentul cronologic final; nu garantează rezultatul următor.':'Doar '+result.trades+' tranzacții activate în segmentul final; sunt necesare minimum 30.';return result;
}
function mapPrice(y,a,b,log=false){if(!a||!b||![a.y,a.price,b.y,b.price,y].every(finite)||a.price<=0||b.price<=0||Math.abs(a.y-b.y)<8||a.price===b.price)throw Error('Repere A/B invalide: două niveluri separate, cu prețuri diferite.');if((a.y-b.y)*(a.price-b.price)>=0)throw Error('Pe grafic, prețul mai mare trebuie să fie mai sus.');const p=log?Math.exp(Math.log(a.price)+(y-a.y)*(Math.log(b.price)-Math.log(a.price))/(b.y-a.y)):a.price+(y-a.y)*(b.price-a.price)/(b.y-a.y);if(!finite(p)||p<=0)throw Error('Calibrarea produce un preț invalid.');return p;}
function calibrate(raw,a,b,log=false){return raw.map(v=>({open:mapPrice(v.openY,a,b,log),high:mapPrice(v.highY,a,b,log),low:mapPrice(v.lowY,a,b,log),close:mapPrice(v.closeY,a,b,log),x:v.x}));}
function parseCSV(text){const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/).filter(s=>s.trim());if(lines.length<2)throw Error('CSV gol.');const sep=lines[0].includes(';')?';':',',split=s=>s.split(sep).map(v=>v.trim().replace(/^"|"$/g,'')),heads=split(lines[0]).map(s=>s.toLowerCase()),keys=['open','high','low','close'],ix=keys.map(k=>heads.indexOf(k));if(ix.some(i=>i<0))throw Error('CSV necesită coloanele open, high, low, close. Ordine cronologică vechi → nou.');const timeI=heads.findIndex(h=>['time','date','timestamp'].includes(h));let previous=-Infinity;return lines.slice(1).map(line=>{const cells=split(line),b={};keys.forEach((k,j)=>b[k]=num(cells[ix[j]]));if(timeI>=0){const s=cells[timeI],t=/^\d+$/.test(s)?Number(s):Date.parse(s);if(!finite(t)||t<=previous)throw Error('Timestampurile trebuie să fie valide, unice și crescătoare.');previous=t;b.time=s;}return b;});}
function demo(kind='LONG',length=140){const bars=[];for(let i=0;i<length;i++){const base=100+(kind==='LONG'?i*.11:kind==='SHORT'?-i*.11:0)+Math.sin(i*.43)*1.15,open=base+Math.sin(i*1.7)*.12,close=base+Math.cos(i*1.3)*.17;bars.push({open,close,high:Math.max(open,close)+.28,low:Math.min(open,close)-.28});}return bars;}
return {num,round,validate,ema,atr,rsi,pivots,indicators,trendEvidence,directionalPlan,analyze,payoff,evaluate,wilson,backtest,mapPrice,calibrate,parseCSV,demo};
});
