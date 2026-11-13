'use strict';
const {respond,finite}=require('./_shared');
const ROOT='https://worldpowermonitor.com/api/v1';
async function grab(path,timeout=11000){const r=await fetch(ROOT+path,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(timeout)});if(!r.ok)throw Error('Upstream HTTP '+r.status);return r.json()}
function entries(a){return Array.isArray(a)?a:[]}
module.exports=async(req,res)=>{if(req.method!=='GET')return respond(res,{error:'Method not allowed'},405);
 try{
  const [countryRequest,regionRequest]=await Promise.allSettled([grab('/countries.json'),grab('/regions.json')]);
  const countries=countryRequest.status==='fulfilled'?entries(countryRequest.value.countries).filter(x=>x.iso3&&/^[A-Z]{3}$/.test(x.iso3)).map(x=>({id:x.id,iso3:x.iso3,name:x.name,annualYear:x.latest_annual_year||null,month:x.latest_month||null})):[]; 
  const regions=regionRequest.status==='fulfilled'?entries(regionRequest.value.regions).map(x=>({id:x.id,name:x.name,firstDay:x.first_day,lastDay:x.last_day})):[];
  if(!countries.length&&!regions.length)throw Error('Catalog unavailable');
  respond(res,{ok:true,fetchedAt:new Date().toISOString(),countries,regions,annualCountries:countries.length,monthlyCountries:countries.filter(x=>x.month).length,regionCount:regions.length,attribution:['Source: Ember (ember-energy.org), licensed under CC BY 4.0.','Source: U.S. Energy Information Administration (EIA), public domain.'],sourceUrl:ROOT+'/index.json',note:'Annual, monthly and daily historical records; not real-time grid telemetry. Country coverage changes as datasets update.'},200,3600)
 }catch{respond(res,{ok:false,countries:[],regions:[],reason:'Public historical catalog unavailable'},503,180)}
};