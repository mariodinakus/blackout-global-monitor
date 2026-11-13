'use strict';
const {respond,finite}=require('./_shared');
const S={
 europe:{name:'EUROPE EUROENERGY',url:'https://euroenergy.live/api/v1/europe/latest',source:'Transmission system operators / EuroEnergy aggregation',cadenceSeconds:60},
 australia:{name:'AUSTRALIA AEMO NEM',url:'https://visualisations.aemo.com.au/aemo/apps/api/report/ELEC_NEM_SUMMARY',source:'Australian Energy Market Operator (AEMO)',cadenceSeconds:300}
};
const numeric=v=>finite(v);
const iso=v=>{if(typeof v!=='string')return null;const d=Date.parse(v);return Number.isFinite(d)?new Date(d).toISOString():null};
async function download(url,timeout=9000){const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'BLACKOUT Global infrastructure observatory / public-source data viewer'},signal:AbortSignal.timeout(timeout)});if(!r.ok)throw Error('Upstream HTTP '+r.status);return r.json()}
function aemoTimestamp(s){if(typeof s!=='string')return null;const m=s.match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)/);if(!m)return iso(s);const approx=Date.parse(s+'Z');const parts=new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',timeZoneName:'shortOffset',hour:'2-digit'}).formatToParts(new Date(approx));const off=parts.find(x=>x.type==='timeZoneName')?.value||'GMT+10';const tz=off.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);const h=tz?Number(tz[2]):10,min=tz?Number(tz[3]||0):0,sign=tz?.[1]==='-'?'-':'+';return iso(s+sign+String(h).padStart(2,'0')+':'+String(min).padStart(2,'0'));}
function aemoNormal(d){
 const rows=Array.isArray(d?.ELEC_NEM_SUMMARY)?d.ELEC_NEM_SUMMARY:[];
 const regions=rows.filter(x=>['NSW1','QLD1','SA1','TAS1','VIC1'].includes(x.REGIONID)).map(x=>{
 const at=aemoTimestamp(x.SETTLEMENTDATE);
 return {id:x.REGIONID,region:({NSW1:'New South Wales',QLD1:'Queensland',SA1:'South Australia',TAS1:'Tasmania',VIC1:'Victoria'})[x.REGIONID],at,localMarketTime:String(x.SETTLEMENTDATE||''),demandMw:numeric(x.TOTALDEMAND),scheduledMw:numeric(x.SCHEDULEDGENERATION),semiScheduledMw:numeric(x.SEMISCHEDULEDGENERATION),priceAudMwh:numeric(x.PRICE),netInterchangeMw:numeric(x.NETINTERCHANGE),marketSuspended:x.MARKETSUSPENDEDFLAG===1||x.MARKETSUSPENDEDFLAG===true,stale:!(at&&Date.now()-Date.parse(at)<3600000&&Date.now()>=Date.parse(at)-600000)};
 }).sort((a,b)=>a.id.localeCompare(b.id));
 const notices=(Array.isArray(d?.ELEC_NEM_SUMMARY_MARKET_NOTICE)?d.ELEC_NEM_SUMMARY_MARKET_NOTICE:[]).map(x=>({type:String(x.TYPEID||'Market notice'),at:aemoTimestamp(x.EFFECTIVEDATE),reference:String(x.EXTERNALREFERENCE||'').slice(0,240)})).filter(x=>/LOR|reserve|market suspend|system security|load shed|intervention|directions|constraint/i.test(x.type+' '+x.reference)).slice(0,8);
 return {ok:regions.length>0,regionCount:regions.length,regions,notices,totalDemandMw:regions.some(x=>!x.stale&&x.demandMw!==null)?regions.filter(x=>!x.stale&&x.demandMw!==null).reduce((a,x)=>a+x.demandMw,0):null,source:S.australia.source,sourceUrl:S.australia.url,expectedCadenceSeconds:300,coverage:'Five Australian NEM market regions, not all of Australia',note:'Demand and spot prices are five-minute AEMO measurements, not transmission-line loading or blackout probability; market notices may be historical.'}
}
const iso2=v=>typeof v==='string'&&/^[a-zA-Z]{2}$/.test(v)?v.toUpperCase():null;
function euroNormal(d){
 const raw=Array.isArray(d)?d:Array.isArray(d?.countries)?d.countries:Array.isArray(d?.data?.countries)?d.data.countries:Array.isArray(d?.data)?d.data:Array.isArray(d?.country_snapshots)?d.country_snapshots:[];
 const countries=raw.map(v=>{
 const cc=iso2(v.iso2||v.iso||v.country_code||v.countryCode||v.code);
 const sources= v.generation_by_source || v.generation?.by_source || v.generation?.sources || v.generation_mix || v.production_by_source || null;
 const at=iso(v.timestamp||v.updated_at||v.observed_at||v.measured_at||v.data_time||v.as_of);
 const nrm=v.data||v.latest||v; 
 return{code:cc,name:String(v.name||v.country_name||v.country||cc||''),at:at||iso(nrm.timestamp||nrm.measured_at||nrm.updated_at),demandMw:numeric(nrm.demand_mw??nrm.demand?.mw??nrm.demand??nrm.load_mw),generationMw:numeric(nrm.generation_mw??nrm.generation?.total_mw??(typeof nrm.generation==='number'?nrm.generation:null)),crossBorderMw:numeric(nrm.net_import_mw??nrm.balance_mw??nrm.cross_border_balance_mw),fuelBreakdown:sources&&typeof sources==='object'&&!Array.isArray(sources)?Object.fromEntries(Object.entries(sources).slice(0,16).map(([k,v])=>[k,numeric(v?.mw??v)])):null,operator:String(v.operator||v.source||v.data_source||'Transmission operator'),freshnessSeconds:numeric(v.freshness_seconds??v.age_seconds),sourceTimestampPresent:!!(at||iso(nrm.timestamp||nrm.measured_at||nrm.updated_at))};
 }).filter(x=>x.code);
 const header=d?.totals||d?.summary||d?.data?.totals||{};
 return {ok:countries.length>0,countries,coverageCount:countries.length,aggregate:{demandMw:numeric(header.demand_mw??header.demand),generationMw:numeric(header.generation_mw??header.generation)},source:S.europe.source,sourceUrl:S.europe.url,expectedCadenceSeconds:60,note:'Values are published by national operators at their own interval; aggregator rechecks each minute. No numeric data without upstream timestamps should be treated as live.',rawFormat:raw.length?'country-array':'unknown',topLevelKeys:Object.keys(d||{}).slice(0,20)}
}
async function one(key){const cfg=S[key];try{const d=await download(cfg.url,key==='europe'?9000:11000);return key==='europe'?euroNormal(d):aemoNormal(d)}catch(e){return{ok:false,countries:[],regions:[],reason:'Public source unavailable',source:cfg.source,sourceUrl:cfg.url,expectedCadenceSeconds:cfg.cadenceSeconds}}}
module.exports=async(req,res)=>{if(req.method!=='GET')return respond(res,{error:'Method not allowed'},405);const [europe,australia]=await Promise.all([one('europe'),one('australia')]);respond(res,{fetchedAt:new Date().toISOString(),europe,australia,refreshSeconds:60,disclaimer:'The globe covers available source measurements only. Polling is not equivalent to having newly observed global electricity data each minute. Null means unknown, not zero.'},200,60);};
module.exports._test={aemoNormal,euroNormal,aemoTimestamp};