'use strict';
function respond(res,body,status=200,cache=120){res.setHeader('Cache-Control','public, s-maxage='+cache+', stale-while-revalidate=180');res.setHeader('X-Content-Type-Options','nosniff');return res.status(status).json(body)}
async function getJson(url,ms=9000){const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'BLACKOUT-Global/2.0 public-monitor'},signal:AbortSignal.timeout(ms)});if(!r.ok)throw Error('Upstream '+r.status);return r.json()}
function list(v){if(Array.isArray(v))return v;for(const a of [v?.data,v?.events,v?.data?.events,v?.results,v?.articles])if(Array.isArray(a))return a;return []}
function finite(v){return v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null}
function dateOf(v){let d=new Date(v);return Number.isFinite(+d)?d.toISOString():null}
async function settledJobs(work){let entries=await Promise.all(Object.entries(work).map(async([k,fn])=>{try{return[k,{ok:true,value:await fn()}]}catch{return[k,{ok:false,error:'Source unavailable'}]}}));return Object.fromEntries(entries)}
module.exports={respond,getJson,list,finite,dateOf,settledJobs};
