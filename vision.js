(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Vision=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const finite=Number.isFinite;
function color(d,i){const r=d[i],g=d[i+1],b=d[i+2];if(d[i+3]<150)return 0;if(g>75&&g-r>28&&g>b*.91)return 1;if(r>100&&r-g>35&&r-b>18)return -1;return 0;}
function median(a){if(!a.length)return NaN;const s=a.slice().sort((a,b)=>a-b),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}
function detect(image,region){
 const {data:d,width:w,height:h}=image,{x0,x1,y0,y1}=region;if(x1-x0<180||y1-y0<90)throw Error('Selectează un panou de preț mai mare, fără RSI, MACD sau volum.');
 const xStart=Math.max(0,Math.ceil(x0)),xEnd=Math.min(w-1,Math.floor(x1)),yStart=Math.max(0,Math.ceil(y0)),yEnd=Math.min(h-1,Math.floor(y1)),active=[];
 for(let x=xStart;x<=xEnd;x++){let run=0,maxRun=0,prev=0;for(let y=yStart;y<=yEnd;y++){const c=color(d,(y*w+x)*4);run=c&&c===prev?run+1:c?1:0;prev=c;maxRun=Math.max(run,maxRun);}if(maxRun>=4)active.push(x);}
 const groups=[];for(const x of active){const last=groups.at(-1);if(last&&x-last.at(-1)<=1)last.push(x);else groups.push([x]);}
 let raw=[];for(const g of groups){if(g.length<2||g.length>Math.max(38,(xEnd-xStart)/22))continue;const rows=[],cnt={1:0,'-1':0};for(let y=yStart;y<=yEnd;y++){let p=0,n=0;for(let x=g[0];x<=g.at(-1);x++){const c=color(d,(y*w+x)*4);if(c===1)p++;if(c===-1)n++;}rows.push({y,p,n});cnt[1]+=p;cnt[-1]+=n;}
  const sign=cnt[1]>=cnt[-1]?1:-1,key=sign===1?'p':'n',total=cnt[sign];if(total<12||total/(cnt[1]+cnt[-1])<.83)continue;const peak=Math.max(...rows.map(r=>r[key])),body=rows.filter(r=>r[key]>=Math.max(2,peak*.65));if(body.length<3||body.at(-1).y-body[0].y>body.length*1.4)continue;
  const fill=body.reduce((s,r)=>s+r[key],0)/(body.length*g.length);if(fill<.58)continue;
  const center=Math.round((g[0]+g.at(-1))/2),top=body[0].y,bottom=body.at(-1).y,at=(x,y)=>{const i=(y*w+Math.max(0,Math.min(w-1,x)))*4;return [d[i],d[i+1],d[i+2]];},dist=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i]))),wick=(from,step)=>{let end=from,miss=0;for(let y=from+step;y>=yStart&&y<=yEnd;y+=step){const mid=at(center,y),left=at(center-g.length-4,y),right=at(center+g.length+4,y),colored=color(d,(y*w+center)*4)===sign,neutral=dist(mid,left)>48&&dist(mid,right)>48;if(colored||neutral){end=y;miss=0;}else if(++miss>=2)break;}return end;};
  raw.push({x:center,openY:sign===1?bottom:top,closeY:sign===1?top:bottom,highY:wick(top,-1),lowY:wick(bottom,1),width:g.length});
 }
 raw.sort((a,b)=>a.x-b.x);
 // Remove isolated detections at either edge; chart candles have a stable horizontal rhythm.
 let changed=true;while(raw.length>36&&changed){changed=false;const gaps=raw.slice(1).map((r,i)=>r.x-raw[i].x),g=median(gaps);if(gaps[0]>g*1.7||gaps[0]<g*.48){raw.shift();changed=true;}else if(gaps.at(-1)>g*1.7||gaps.at(-1)<g*.48){raw.pop();changed=true;}}
 if(raw.length<36)throw Error('Am delimitat doar '+raw.length+' lumânări. Sunt necesare cel puțin 36 lizibile când ultima este exclusă. Mărește graficul sau importă CSV.');
 const widths=raw.map(r=>r.width),spacing=raw.slice(1).map((r,i)=>r.x-raw[i].x),gap=median(spacing);if(median(widths)<2||gap<3)throw Error('Rezoluția lumânărilor este insuficientă.');
 const bad=spacing.filter(x=>x>gap*1.68||x<gap*.48);if(bad.length>Math.max(2,spacing.length*.06))throw Error('Spațiere neuniformă: par să lipsească lumânări sau să fie incluse etichete. Restrânge panoul ori folosește CSV.');
 const bottoms=new Map();raw.forEach(r=>{const k=Math.round(r.lowY/3);bottoms.set(k,(bottoms.get(k)||0)+1);});if(Math.max(...bottoms.values())>raw.length*.45)throw Error('Selecția pare să conțină bare de volum. Selectează doar panoul cu lumânări.');
 return {candles:raw,count:raw.length,medianWidth:median(widths),medianSpacing:gap,warnings:bad.length?['Există neregularități de spațiere; verifică fiecare marcaj.']:[]};
}
function parseLabel(s){s=String(s).replace(/\s/g,'').replace(/[^\d.,-]/g,'');if(!s)return NaN;if(s.includes(',')&&s.includes('.')){const comma=s.lastIndexOf(',')>s.lastIndexOf('.');s=comma?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');}else s=s.replace(',','.');const n=Number(s);return finite(n)&&n>0?n:NaN;}
function fitAxis(labels,log=false){
 const pts=labels.filter(p=>finite(p.price)&&p.price>0&&finite(p.y)).sort((a,b)=>a.y-b.y);let best=null;
 for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const a=pts[i],b=pts[j];if(b.y-a.y<30||a.price<=b.price)continue;const v=p=>log?Math.log(p.price):p.price,slope=(v(b)-v(a))/(b.y-a.y),intercept=v(a)-slope*a.y,inliers=pts.filter(p=>Math.abs(p.y-(v(p)-intercept)/slope)<7);if(inliers.length<3)continue;const span=inliers.at(-1).y-inliers[0].y;if(!best||inliers.length>best.n||(inliers.length===best.n&&span>best.span))best={a:inliers[0],b:inliers.at(-1),n:inliers.length,span,points:inliers};}
 if(!best)throw Error('Nu am identificat trei prețuri coerente pe axă. Folosește reperele A și B.');return best;
}
function words(data){const out=[];for(const block of data?.blocks||[])for(const para of block.paragraphs||[])for(const line of para.lines||[])for(const word of line.words||[])out.push({text:word.text,confidence:word.confidence??0,x:(word.bbox.x0+word.bbox.x1)/2,y:(word.bbox.y0+word.bbox.y1)/2,bbox:word.bbox});return out;}
function findAxis(input,width,height,log=false){
 const all=Array.isArray(input)?input:words(input),candidates=all.filter(w=>w.x>width*.52&&w.confidence>=35&&/^[~≈]?\s*\d{1,6}(?:[.,]\d{1,4})?$/.test(w.text.trim())).map(w=>({...w,price:parseLabel(w.text)})).filter(w=>finite(w.price));let best=null,tol=Math.max(20,width*.035);
 for(const seed of candidates){const group=candidates.filter(w=>Math.abs(w.x-seed.x)<=tol);try{const fit=fitAxis(group,log),x=median(fit.points.map(p=>p.x)),score=fit.n*100+fit.span/height*70+x/width*10;if(!best||score>best.score)best={...fit,x,score};}catch(_){}}
 if(!best)throw Error('Axa prețului nu a putut fi citită automat.');return best;
}
function inferRegion(axis,width,height){const padY=Math.max(45,axis.span*.28);return {x0:Math.max(0,width*.015),x1:Math.max(width*.35,axis.x-width*.035),y0:Math.max(0,axis.a.y-padY),y1:Math.min(height,axis.b.y+padY)};}
function normalize(text){return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[−–—]/g,'-').replace(/[≈~]/g,'=').replace(/\u00a0/g,' ').replace(/[ \t]+/g,' ').replace(/\r/g,'');}
function number(s){if(s==null)return null;let v=String(s).trim().replace(/\s/g,'');if(v.includes(',')&&v.includes('.'))v=v.lastIndexOf(',')>v.lastIndexOf('.')?v.replace(/\./g,'').replace(',','.'):v.replace(/,/g,'');else v=v.replace(',','.');const n=Number(v);return finite(n)?n:null;}
function one(t,re,group=1){const m=t.match(re);return m?number(m[group]):null;}
function parseXtb(text){
 const t=normalize(text),low=t.toLowerCase(),data={raw:t};
 const sm=t.match(/\b([A-Z][A-Z0-9]{1,11})\s*(?:CFD|[·.\-]\s*(?:M?\d+)?\s*[·.\-]\s*XTB)/i);data.symbol=sm?sm[1].toUpperCase():null;if(!data.symbol){const alt=t.match(/\b([A-Z][A-Z0-9]{1,11})\s*[:·]\s*M?\d+\s*[-·]\s*XTB/i);if(alt)data.symbol=alt[1].toUpperCase();}
 const tf=t.match(/\b(M1|M5|M15|M30|H1|H4|D1|W1)\b/i);data.timeframe=tf?tf[1].toUpperCase():null;if(!data.timeframe){const h=t.match(/\b[A-Z][A-Z0-9]{1,11}\s*[-·:]\s*(1|5|15|30|60|240|1440)\s*[-·]\s*XTB\b/i),map={1:'M1',5:'M5',15:'M15',30:'M30',60:'H1',240:'H4',1440:'D1'};if(h)data.timeframe=map[h[1]]||null;}
 const clock=t.match(/\b([0-2]?\d:[0-5]\d)(?::[0-5]\d)?\b/);data.time=clock?clock[1]:null;
 const currentMatch=t.match(/(\d{1,6}(?:[.,]\d{1,8}))\s*USD\b/i);data.current=currentMatch?number(currentMatch[1]):null;data.priceDecimals=currentMatch&&/[.,]/.test(currentMatch[1])?currentMatch[1].split(/[.,]/).at(-1).length:null;data.changePct=one(low,/astazi[\s\S]{0,30}?([+-]?\d+(?:[.,]\d+)?)\s*%/i);
 data.volume=one(low,/volum[\s\S]{0,55}?(\d+(?:[.,]\d{2,8}))/i);data.marginRon=one(low,/marja[\s\S]{0,80}?(\d[\d .]*[.,]\d{2})\s*ron/i);
 data.freeMarginRon=one(low,/fonduri\s+libere\s*:?\s*(\d[\d .]*[.,]\d{2})\s*ron/i);
 let q=t.match(/\bsell\s+buy\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)/i);if(q){data.sell=number(q[1]);data.buy=number(q[2]);}
 if(data.sell==null)data.sell=one(t,/\b(?:sell|vanzare)\s*:?\s*(\d+(?:[.,]\d+)?)/i);if(data.buy==null)data.buy=one(t,/\b(?:buy|cumparare)\s*:?\s*(\d+(?:[.,]\d+)?)/i);for(const m of t.matchAll(/\b(?:sell|buy|vanzare|cumparare)\s*:?\s*(\d+[.,](\d+))/ig))data.priceDecimals=Math.max(data.priceDecimals||0,m[2].length);
 data.spreadRon=one(low,/spread\s*:?\s*(\d+(?:[.,]\d+)?)\s*ron/i);data.spreadPrice=one(low,/spread[\s\S]{0,50}?\/\s*(\d+(?:[.,]\d+)?)\s*pips?/i);if(data.spreadPrice==null)data.spreadPrice=one(low,/spread\s*:?\s*(\d+(?:[.,]\d+)?)\s*pips?/i);
 data.commissionRon=one(low,/comi(?:s|ss)ion\s*:?\s*(\d+(?:[.,]\d+)?)\s*ron/i);
 q=t.match(/valoare\s+contract[\s\S]{0,70}?=?\s*(\d[\d .]*[.,]\d{2})\s*usd\s*\/\s*=?\s*(\d[\d .]*[.,]\d{2})\s*ron/i);data.contractUsd=q?number(q[1]):null;data.contractRon=q?number(q[2]):null;
 data.swapSellRon=one(low,/swap\s+zilnic[\s\S]{0,60}?sell\s*(-?\d+(?:[.,]\d+)?)\s*ron/i);data.swapBuyRon=one(low,/swap\s+zilnic[\s\S]{0,100}?buy\s*(-?\d+(?:[.,]\d+)?)\s*ron/i);
 data.pipValueRon=one(low,/valoare\s+pip[\s\S]{0,25}?=?\s*(\d+(?:[.,]\d+)?)\s*ron/i);data.market=/faza\s+pietei[\s\S]{0,40}?deschis/i.test(low)?'open':/faza\s+pietei[\s\S]{0,40}?(inchis|closed)/i.test(low)?'closed':null;
 q=t.match(/(-\s*0[.,]\d{3,})\s+(?:-\s*\d+(?:[.,]\d+)?\s*ron\s+)?(\d{2,6}(?:[.,]\d+))/i);data.positionVolume=q?number(q[1].replace(/\s/g,'')):null;data.positionLevel=q?number(q[2]):null;
 data.role=[data.timeframe||data.current?'grafic':null,data.sell!=null||data.volume!=null?'ordin':null,data.swapSellRon!=null||data.pipValueRon!=null?'detalii':null].filter(Boolean);
 return data;
}
const numeric=['current','changePct','volume','marginRon','freeMarginRon','sell','buy','spreadRon','spreadPrice','commissionRon','contractUsd','contractRon','swapSellRon','swapBuyRon','pipValueRon','positionVolume','positionLevel'];
const tolerance={current:.12,changePct:.1,volume:.00001,marginRon:1,freeMarginRon:2,sell:.12,buy:.12,spreadRon:.1,spreadPrice:.011,commissionRon:.01,contractUsd:1,contractRon:5,swapSellRon:.02,swapBuyRon:.02,pipValueRon:.2,positionVolume:.00001,positionLevel:.12};
function reconcile(scans){
 const result={fields:{},conflicts:[],severe:[],derived:{},score:0};for(const key of numeric){const arr=scans.map((s,i)=>({value:s[key],source:i+1})).filter(x=>finite(x.value));if(!arr.length)continue;const vals=arr.map(x=>x.value),min=Math.min(...vals),max=Math.max(...vals),chosen=key==='freeMarginRon'?min:median(vals),conflict=max-min>(tolerance[key]??0);result.fields[key]={value:chosen,min,max,sources:arr.map(x=>x.source),conflict};if(conflict)result.conflicts.push(key);}
 for(const key of ['symbol','timeframe','market']){const arr=scans.map((s,i)=>({value:s[key],source:i+1})).filter(x=>x.value),unique=[...new Set(arr.map(x=>x.value))];if(arr.length){result.fields[key]={value:key==='market'&&unique.includes('closed')?'closed':unique[0],values:unique,sources:arr.map(x=>x.source),conflict:unique.length>1};if(unique.length>1){result.conflicts.push(key);result.severe.push(key);}}}
 const f=result.fields,v=f.volume?.value;if(v>0&&f.marginRon)result.derived.marginPerLot=f.marginRon.value/v;if(v>0&&f.pipValueRon)result.derived.valuePerLot=f.pipValueRon.value/v;if(f.contractUsd?.value>0&&f.contractRon)result.derived.fxRon=f.contractRon.value/f.contractUsd.value;
 result.derived.times=scans.map((s,i)=>s.time?{source:i+1,value:s.time}:null).filter(Boolean);const decimals=scans.map(s=>s.priceDecimals).filter(finite);if(decimals.length)result.derived.tickSuggested=10**-Math.max(...decimals);
 const equities=scans.filter(s=>finite(s.freeMarginRon)&&finite(s.marginRon)).map(s=>s.freeMarginRon+s.marginRon);if(equities.length)result.derived.equityEstimate={min:Math.min(...equities),max:Math.max(...equities)};
 if(f.buy&&f.sell){const quoted=f.buy.value-f.sell.value;if(f.spreadPrice&&Math.abs(quoted-f.spreadPrice.value)>.015){result.conflicts.push('spread_vs_quotes');result.severe.push('spread_vs_quotes');}result.derived.quotedSpread=quoted;}
 if(f.positionVolume?.value<0)result.derived.position='SHORT';else if(f.positionVolume?.value>0)result.derived.position='LONG';if(result.derived.position==='SHORT'&&f.positionLevel&&f.current&&f.positionLevel.value<f.current.value){result.severe.push('nivel poziție sub piață, incompatibil cu SL pentru SHORT');}if(result.derived.position==='LONG'&&f.positionLevel&&f.current&&f.positionLevel.value>f.current.value){result.severe.push('nivel poziție peste piață, incompatibil cu SL pentru LONG');}
 const expected=['symbol','timeframe','current','volume','marginRon','freeMarginRon','spreadPrice','commissionRon','contractUsd','contractRon','market'];const found=expected.filter(k=>f[k]).length;result.score=Math.max(0,Math.round(found/expected.length*100-result.conflicts.length*4));return result;
}
return {detect,fitAxis,findAxis,inferRegion,parseLabel,parseXtb,reconcile,words,normalize,median,color};
});