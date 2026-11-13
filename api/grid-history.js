'use strict';
const {respond,finite}=require('../shared.cjs');
const ROOT='https://worldpowermonitor.com/api/v1';
const csv=s=>String(s||'').slice(0,90);
const good=v=>typeof v==='string'&&/^[a-z0-9-]{2,48}$/.test(v);
async function get(url){const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(11500)});if(!r.ok)throw Error('Source HTTP '+r.status);return r.json();}
const n=v=>finite(v);
const series=(labels,values,unit)=>Array.isArray(labels)&&Array.isArray(values)?labels.map((label,i)=>({at:String(label),value:n(values[i])})).filter(x=>x.value!==null).slice(-500):[];
function fuelLast(block,axis){const last=Array.isArray(block?.[axis])?block[axis].length-1:-1;if(last<0)return[];const obj=block?.generation_twh||{};return Object.entries(obj).map(([key,arr])=>({fuel:key,twh:Array.isArray(arr)?n(arr[last]):null})).filter(x=>x.twh!==null).sort((a,b)=>b.twh-a.twh)}
async function country(id){
 const d=await get(ROOT+'/countries/'+id+'.json');
 const a=d.annual,m=d.monthly;
 const annual=series(a?.years,a?.total_generation_twh,'TWh'),demandAnnual=series(a?.years,a?.demand_twh,'TWh'),monthly=series(m?.months,m?.demand_twh,'TWh');
 // Monthly generation only available as per-fuel series; sum reported non-null sources.
 const monthlyGeneration=(Array.isArray(m?.months)?m.months:[]).map((month,i)=>{let total=0,count=0;for(const values of Object.values(m.generation_twh||{})){if(Array.isArray(values)&&n(values[i])!==null){total+=n(values[i]);count++}}return{at:month,value:count?Math.round(total*1000)/1000:null}}).filter(x=>x.value!==null).slice(-240);
 return {ok:true,scope:'country',id,name:d.name,iso3:d.iso3,annual:{generation:annual,demand:demandAnnual,mix:fuelLast(a,'years')},monthly:{generation:monthlyGeneration,demand:monthly,mix:fuelLast(m,'months')},asOf:{annual:a?.as_of||null,monthly:m?.as_of||null},source:'Ember via World Power Monitor',sourceUrl:ROOT+'/countries/'+id+'.json',attribution:d.attribution||[],licence:'CC BY 4.0',note:'Historical national annual/monthly electricity; no real-time inference. Missing observations stay null.'};
}
async function region(id){const d=await get(ROOT+'/regions/'+id+'.json');return{ok:true,scope:'us-region',id,name:d.name,asOf:d.as_of,unit:'MWh/day',series:{demand:series(d.dates,d.demand_mwh,'MWh'),generation:series(d.dates,d.net_generation_mwh,'MWh'),interchange:series(d.dates,d.interchange_mwh,'MWh')},source:'US Energy Information Administration (EIA) via World Power Monitor',sourceUrl:ROOT+'/regions/'+id+'.json',attribution:d.attribution||[],note:'Daily electricity history, not 1-minute readings; EIA may publish revisions.'};}
async function realtime(country,hours){
 const end=new Date(),start=new Date(Date.now()-hours*3600000);
 const params=new URLSearchParams({country,start:start.toISOString(),end:end.toISOString()});
 const r=await get('https://api.energy-charts.info/v2/public_power?'+params);
 if(!Array.isArray(r?.data))throw Error('No time series data');
 const exclude=/share|percentage|forecast|price|demand|carbon|co2|import|export|load|total|net_|balance|consumption/i;
 const series=r.data.map(row=>{const vals=row?.values||{};const sources=Object.entries(vals).filter(([k,v])=>!exclude.test(k)&&n(v)!==null&&n(v)>0);return{at:row.timestamp,mw:sources.length?sources.reduce((sum,[,v])=>sum+n(v),0):null,values:Object.fromEntries(sources.slice(0,25))}}).filter(x=>Number.isFinite(Date.parse(x.at))&&x.mw!==null).slice(-1500);
 return{ok:series.length>0,scope:'recent-country',country,hours,unit:'MW (generation aggregate, subject to per-fuel source definitions)',series,source:'Fraunhofer ISE Energy-Charts',sourceUrl:'https://api.energy-charts.info/',licence:'CC BY 4.0',cadenceMinutes:n(r.interval_minutes),note:'Recent generation records only. Not overall demand, line loading, outages or full national grid health.'};
}
module.exports=async(req,res)=>{
 if(req.method!=='GET')return respond(res,{error:'Method not allowed'},405);
 const kind=String(req.query?.kind||'country');
 const id=String(req.query?.id||'');
 if(!good(id))return respond(res,{ok:false,error:'Valid source-specific id required'},400);
 try{
  let data;
  if(kind==='country')data=await country(id);
  else if(kind==='us-region'&&id.startsWith('eia-'))data=await region(id);
  else if(kind==='recent-country'&&'gr de fr it es pt nl pl ro se fi no ch at be bg hu cz dk ie uk gb eu all'.split(' ').includes(id)){const hours=Math.min(168,Math.max(6,Number(req.query?.hours)||24));data=await realtime(id,hours)}
  else return respond(res,{ok:false,error:'Unsupported history scope or country'},400);
  respond(res,{...data,fetchedAt:new Date().toISOString()},data.ok?200:503,kind==='recent-country'?900:3600)
 }catch(e){respond(res,{ok:false,scope:kind,id,reason:'Historical source currently unavailable; no imputed data'},503,300)}
};
module.exports._test={series};