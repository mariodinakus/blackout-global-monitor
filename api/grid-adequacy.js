'use strict';
const {respond,finite}=require('../shared.cjs');
const BASE='https://data.elexon.co.uk/bmrs/api/v1';
const date=x=>{if(typeof x!=='string')return null;const d=new Date(x.replace(' ','T'));return Number.isFinite(+d)?d.toISOString():null};
const num=finite;
async function get(url){const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10500)});if(!r.ok)throw Error('Upstream '+r.status);return r.json()}
module.exports=async(req,res)=>{
 if(req.method!=='GET')return respond(res,{error:'Method not allowed'},405);
 try{
  const now=Date.now(),params=new URLSearchParams({publishDateTimeFrom:new Date(now-6*3600000).toISOString(),publishDateTimeTo:new Date(now).toISOString()});
  const response=await get(BASE+'/datasets/LOLPDRM/stream?'+params);
  const rows=(Array.isArray(response)?response:[]).map(v=>({at:date(v.startTime),publishedAt:date(v.publishTime),horizon:numericH(v.forecastHorizon),probability:num(v.lossOfLoadProbability),marginMw:num(v.deratedMargin)})).filter(x=>x.at&&x.publishedAt&&Date.parse(x.at)>=now-30*60000&&Date.parse(x.at)<=now+16*3600000&&Date.parse(x.publishedAt)>now-8*3600000);
  rows.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)||Date.parse(b.publishedAt)-Date.parse(a.publishedAt)||((a.horizon??99)-(b.horizon??99)));
  const byTime=new Set(),forecast=[];
  for(const row of rows){if(byTime.has(row.at))continue;byTime.add(row.at);forecast.push(row);if(forecast.length>=16)break}
  const latest=forecast[0]||null;
  return respond(res,{ok:!!latest,region:'Great Britain',latest,forecast,source:'Elexon / NESO LOLPDRM official forecast',sourceUrl:'https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/LOLPDRM/stream',publicationCadenceMinutes:30,meaning:'Probability of loss of load (supply adequacy shortfall) for a specific settlement period; not the probability of a customer blackout, transmission failure or global outage.',unit:'fraction between 0 and 1 when available',note:latest?'Values are forecasts and can be revised. Examine settlement-period timestamp and publication time.':'No current operator forecast was returned.'},200,120);
 }catch{return respond(res,{ok:false,region:'Great Britain',latest:null,forecast:[],source:'Elexon / NESO LOLPDRM',note:'Source unavailable; risk is unknown, not zero'},200,120)}
};
function numericH(v){const x=finite(v);return x!==null&&x>=0&&x<=48?x:null}
module.exports._test={date,numericH};
