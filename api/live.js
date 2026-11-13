'use strict';
const {respond,getJson,list,finite,dateOf}=require('./_shared');
const BASE='https://data.elexon.co.uk/bmrs/api/v1';
const n=val=>finite(val);
const rows=v=>list(v);
function observed(v){return dateOf(v?.startTime||v?.publishTime||v?.timestamp||v?.time||v?.datetime||v?.measurementTime);}
async function gbFrequency(){
 const end=new Date(),start=new Date(Date.now()-30*60000);
 const q=new URLSearchParams({from:start.toISOString(),to:end.toISOString()});
 const data=await getJson(BASE+'/system/frequency?'+q,9000);
 const series=rows(data).map(x=>({at:observed(x),hz:n(x.frequency??x.frequencyHz??x.systemFrequency??x.value)})).filter(x=>x.at&&x.hz>45&&x.hz<55).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
 if(!series.length)throw Error('GB frequency not returned');
 return {ok:true,region:'Great Britain',latest:series.at(-1),series:series.slice(-70),source:'https://bmrs.elexon.co.uk/',sampling:'Elexon FREQ observations',freshSeconds:Math.max(0,Math.round((Date.now()-Date.parse(series.at(-1).at))/1000))};
}
async function euFrequency(){
 const end=new Date(Date.now()-60000),start=new Date(Date.now()-16*60000);
 const q=new URLSearchParams({region:'DE-Freiburg',start:start.toISOString(),end:end.toISOString()});
 const data=await getJson('https://api.energy-charts.info/v2/frequency?'+q,9500);
 const listData=rows(data);
 const series=listData.map(row=>{
 let vals=row.values??row.value??row.frequency;
 const v=typeof vals==='object'&&vals!==null?(Array.isArray(vals)?vals[0]:Object.values(vals)[0]):vals;
 return {at:observed(row),hz:n(v)};
 }).filter(x=>x.at&&x.hz>45&&x.hz<55).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
 if(!series.length)throw Error('EU frequency not returned');
 return{ok:true,region:'Continental Europe (Freiburg sensor)',latest:series.at(-1),series:series.slice(-150),source:'https://www.energy-charts.info/',sampling:'1-second source measurements; published with delay',freshSeconds:Math.max(0,Math.round((Date.now()-Date.parse(series.at(-1).at))/1000))};
}
async function gbGeneration(){
 const data=await getJson(BASE+'/generation/outturn/current?format=json',9500);
 const fuels=rows(data).filter(x=>n(x.currentUsage)!==null&&x.fuelType).map(x=>({fuel:String(x.fuelType),mw:n(x.currentUsage)}));
 if(!fuels.length)throw Error('GB fuel mix not returned');
 const end=new Date(),start=new Date(Date.now()-100*60000);
 let demand=null,measuredAt=null;
 try{const q=new URLSearchParams({from:start.toISOString(),to:end.toISOString()});
 const r=rows(await getJson(BASE+'/generation/outturn?'+q,9000))
 .filter(x=>n(x.demand)!==null&&observed(x)).sort((a,b)=>Date.parse(observed(a))-Date.parse(observed(b)));
 const last=r.at(-1);if(last){demand=n(last.demand);measuredAt=observed(last)}}
 catch{}
 return{ok:true,region:'Great Britain',fuels,demandMw:demand,measuredAt,source:'https://bmrs.elexon.co.uk/',sampling:'FUELINST 5-minute rolling snapshots',note:'Demand is generation-based proxy, not line loading or available reserves; source can lag.'};
}
async function warnings(){
 const end=new Date(),start=new Date(Date.now()-24*3600000);
 const q=new URLSearchParams({publishDateTimeFrom:start.toISOString(),publishDateTimeTo:end.toISOString()});
 const data=await getJson(BASE+'/datasets/SYSWARN/stream?'+q,8500);
 return {ok:true,items:rows(data).map(x=>({publishedAt:observed(x),type:String(x.warningType||'System notice'),text:String(x.warningText||'').slice(0,500)})).filter(x=>x.publishedAt).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,12),source:'https://bmrs.elexon.co.uk/',note:'Published notices within 24 hours, not necessarily active.'};
}
module.exports=async(req,res)=>{
 if(req.method!=='GET')return respond(res,{error:'Method not allowed'},405);
 const tasks={gbFrequency,euFrequency,gbGeneration,warnings};
 const pairs=await Promise.all(Object.entries(tasks).map(async([k,fn])=>{try{return[k,await fn()]}catch(e){return[k,{ok:false,reason:'Unavailable from official source'}]}}));
 const out=Object.fromEntries(pairs);
 return respond(res,{fetchedAt:new Date().toISOString(),refreshRecommendationSeconds:60,feeds:out,coverage:'GB and Continental Europe sensor; no global SCADA',risk:{probability:null,reason:'No validated model or globally comparable real-time capacity/line data'},notice:'Refresh every minute checks for NEW source data; measurements may update at 1-second, 5-minute or slower rates. Never infer outage from stale data.'},200,55);
};
module.exports._test={observed};