'use strict';
/** Region summary: observed signals only; no invented grid data. */
const regions={
 americas:{name:'Αμερική',codes:'US CA MX BR AR CL CO PE UY PY BO EC VE CR PA GT HN NI SV DO CU JM TT'.split(' ')},
 europe:{name:'Ευρώπη',codes:'GR DE FR IT ES PT NL BE AT PL CZ RO BG HU HR SI SK SE NO FI DK IE GB CH EE LV LT RS BA ME MK AL TR UA MD IS LU MT CY'.split(' ')},
 asia:{name:'Ασία',codes:'CN IN JP KR TW ID MY SG TH VN PH PK BD LK NP KZ UZ GE AZ AM IL JO SA AE QA KW OM BH'.split(' ')}
};
const cache=new Map();async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(9500)});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
module.exports=async(req,res)=>{
res.setHeader('Cache-Control','s-maxage=120, stale-while-revalidate=120');
const key='regions';const cached=cache.get(key);if(cached&&Date.now()-cached.at<120000)return res.status(200).json(cached.data);
const [out,pulse]=await Promise.allSettled([get('https://blackout-global-monitor.vercel.app/api/outages'),get('https://blackout-global-monitor.vercel.app/api/pulse')]);
const o=out.status==='fulfilled'?out.value:null,p=pulse.status==='fulfilled'?pulse.value:null;
const events=Array.isArray(o?.internet?.countries)?o.internet.countries:[];
const result=Object.fromEntries(Object.entries(regions).map(([id,r])=>{
const relevant=events.filter(e=>r.codes.includes(String(e.code||'').toUpperCase()));
return [id,{name:r.name,monitoredCountries:r.codes.length,reportedInternetCountries:relevant.length,ongoingInternetCountries:relevant.filter(e=>e.ongoing).length,internetEvents:relevant.slice(0,25),internetSource:o?'IODA':'unavailable',gridSource:p?'Grid pulse':'unavailable',gridSystems:[],note:'Τα Internet events δεν αποτελούν τεκμήριο διακοπής ρεύματος. Χωρίς ζωντανές μετρήσεις δεν υπολογίζεται κίνδυνος.'}]
}));
const data={at:new Date().toISOString(),regions:result,feeds:{internet:!!o,grid:!!p},sources:['IODA','Grid pulse']};cache.set(key,{at:Date.now(),data});return res.status(200).json(data);
};