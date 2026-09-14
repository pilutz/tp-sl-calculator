(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Vision=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function color(d,i){const r=d[i],g=d[i+1],b=d[i+2];if(d[i+3]<150)return 0;if(g>75&&g-r>28&&g>b*.91)return 1;if(r>100&&r-g>35&&r-b>18)return -1;return 0;}
function median(a){if(!a.length)return 0;const s=a.slice().sort((a,b)=>a-b);return s[Math.floor(s.length/2)];}
function detect(image,region){
 const {data:d,width:w,height:h}=image,{x0,x1,y0,y1}=region;
 if(x1-x0<180||y1-y0<90)throw Error('Selectează un panou de preț mai mare, fără RSI, MACD sau volum.');
 const xStart=Math.max(0,Math.ceil(x0)),xEnd=Math.min(w-1,Math.floor(x1)),yStart=Math.max(0,Math.ceil(y0)),yEnd=Math.min(h-1,Math.floor(y1));
 const active=[];for(let x=xStart;x<=xEnd;x++){let run=0,maxRun=0,prev=0;for(let y=yStart;y<=yEnd;y++){const c=color(d,(y*w+x)*4);run=c&&c===prev?run+1:c?1:0;prev=c;maxRun=Math.max(run,maxRun);}if(maxRun>=4)active.push(x);}
 const groups=[];for(const x of active){const last=groups.at(-1);if(last&&x-last.at(-1)<=1)last.push(x);else groups.push([x]);}
 const raw=[];for(const g of groups){if(g.length<2||g.length>Math.max(24,(xEnd-xStart)/28))continue;const rows=[],cnt={1:0,'-1':0};for(let y=yStart;y<=yEnd;y++){let p=0,n=0;for(let x=g[0];x<=g.at(-1);x++){const c=color(d,(y*w+x)*4);if(c===1)p++;if(c===-1)n++;}rows.push({y,p,n});cnt[1]+=p;cnt[-1]+=n;}
 const sign=cnt[1]>=cnt[-1]?1:-1,key=sign===1?'p':'n',total=cnt[sign];if(total<12||total/(cnt[1]+cnt[-1])<.83)continue;
 const peak=Math.max(...rows.map(r=>r[key])),body=rows.filter(r=>r[key]>=Math.max(2,peak*.65));if(body.length<3)continue;
 // A single dense contiguous body; disconnected annotations are rejected.
 if(body.at(-1).y-body[0].y>body.length*1.4)continue;
 const center=Math.round((g[0]+g.at(-1))/2),top=body[0].y,bottom=body.at(-1).y;
 const at=(x,y)=>{const i=(y*w+Math.max(0,Math.min(w-1,x)))*4;return [d[i],d[i+1],d[i+2]];};
 const dist=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
 const wick=(from,step)=>{let end=from,miss=0;for(let y=from+step;y>=yStart&&y<=yEnd;y+=step){const mid=at(center,y),left=at(center-g.length-4,y),right=at(center+g.length+4,y);
 // Wick differs from both neighboring background pixels, so horizontal grid lines do not extend a wick.
 const colored=color(d,(y*w+center)*4)===sign,neutral=dist(mid,left)>48&&dist(mid,right)>48;
 if(colored||neutral){end=y;miss=0;}else if(++miss>=2)break;}return end;};
 const highY=wick(top,-1),lowY=wick(bottom,1);
 raw.push({x:center,openY:sign===1?bottom:top,closeY:sign===1?top:bottom,highY,lowY,width:g.length});
 }
 raw.sort((a,b)=>a.x-b.x);
 if(raw.length<61)throw Error('Am delimitat doar '+raw.length+' lumânări. Pentru analiză sunt necesare cel puțin 61 lizibile (ultima este exclusă implicit). Mărește graficul sau importă CSV.');
 const widths=raw.map(r=>r.width),spacing=raw.slice(1).map((r,i)=>r.x-raw[i].x),gap=median(spacing);
 if(median(widths)<2||gap<3)throw Error('Rezoluția lumânărilor este insuficientă.');
 const bad=spacing.filter(x=>x>gap*1.65||x<gap*.52);
 if(bad.length>Math.max(1,spacing.length*.035))throw Error('Spațiere neuniformă: par să lipsească lumânări sau să fie incluse etichete. Restrânge panoul, schimbă culorile ori folosește CSV.');
 const bottoms=new Map();raw.forEach(r=>{const k=Math.round(r.lowY/3);bottoms.set(k,(bottoms.get(k)||0)+1);});
 if(Math.max(...bottoms.values())>raw.length*.45)throw Error('Selecția pare să conțină bare de volum. Selectează doar panoul cu lumânări.');
 return {candles:raw,count:raw.length,medianWidth:median(widths),medianSpacing:gap,warnings:bad.length?['Există o neregularitate de spațiere. Verifică fiecare lumânare marcată.']:[]};
}
function parseLabel(s){
 s=s.replace(/\s/g,'').replace(/[^\d.,-]/g,'');if(!s)return NaN;
 if(s.includes(',')&&s.includes('.')){const comma=s.lastIndexOf(',')>s.lastIndexOf('.');s=comma?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'');}
 else s=s.replace(',','.');
 const n=Number(s);return Number.isFinite(n)&&n>0?n:NaN;
}
function fitAxis(labels,log=false){
 const pts=labels.filter(p=>Number.isFinite(p.price)&&p.price>0&&Number.isFinite(p.y)).sort((a,b)=>a.y-b.y);
 let best=null;for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const a=pts[i],b=pts[j];if(b.y-a.y<30||a.price<=b.price)continue;const v=p=>log?Math.log(p.price):p.price,slope=(v(b)-v(a))/(b.y-a.y),intercept=v(a)-slope*a.y;
 const inliers=pts.filter(p=>Math.abs(p.y-(v(p)-intercept)/slope)<4);
 if(inliers.length<3)continue;const span=inliers.at(-1).y-inliers[0].y;if(!best||inliers.length>best.n||(inliers.length===best.n&&span>best.span))best={a:inliers[0],b:inliers.at(-1),n:inliers.length,span};}
 if(!best)throw Error('Nu am identificat trei prețuri coerente pe axă. Folosește reperele A și B.');
 return best;
}
return {detect,fitAxis,parseLabel,median,color};
});