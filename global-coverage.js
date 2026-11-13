/* BLACKOUT Global / 215-country archive + live feed coverage */
(()=>{'use strict';
const $=id=>document.getElementById(id),safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),n=x=>Number.isFinite(Number(x))&&x!==null&&x!==undefined?Number(x):null,fmt=(x,d=1)=>n(x)===null?'—':n(x).toLocaleString('el-GR',{maximumFractionDigits:d});
const store={catalog:[],regions:[],grid:null,id:'greece',region:'eia-texas',country:null,recent:null,us:null,period:'24h',request:0,locations:new Map(),search:'',polling:false,lastObserved:null};
const supported='gr de fr it es pt nl pl ro se fi no ch at be bg hu cz dk ie uk gb'.split(' ');
const iso3To2={GRC:'gr',DEU:'de',FRA:'fr',ITA:'it',ESP:'es',PRT:'pt',NLD:'nl',POL:'pl',ROU:'ro',SWE:'se',FIN:'fi',NOR:'no',CHE:'ch',AUT:'at',BEL:'be',BGR:'bg',HUN:'hu',CZE:'cz',DNK:'dk',IRL:'ie',GBR:'uk'};
const root=[
'<section class="archive" id="world-archive"><div class="archive-head"><div><span class="archive-overline">02 / WORLD ELECTRICITY ATLAS</span><h2>Every country. <em>Every available signal.</em></h2><p>Παγκόσμια ηλεκτρική ενέργεια ανά χώρα — μετρήσεις όπου δημοσιεύονται συχνά, πρόσφατες αναφορές και πραγματικές ιστορικές σειρές. Κάθε τιμή συνοδεύεται από την περίοδό της.</p></div><div class="archive-symbol">W<span>Ø</span>RLD</div></div>',
'<div class="archive-kpis"><div><small>COUNTRY ARCHIVE</small><b id="ar-countries">—</b><span>Ετήσια παραγωγή / Ember</span></div><div><small>MONTHLY DATA</small><b id="ar-monthly">—</b><span>Χώρες με μηνιαία στοιχεία</span></div><div><small>US GRID REGIONS</small><b id="ar-regions">—</b><span>Ημερήσια ιστορία / EIA</span></div><div><small>DATA REFRESH</small><b>60s</b><span>Ερωτήματα προς live πηγές</span></div></div>',
'<div class="archive-grid"><div class="archive-card ar-data"><div class="ar-card-head"><div><span class="ar-index">01 / COUNTRY EXPLORER</span><h3>Energy over time</h3></div><div class="ar-chartlegend">● REAL OBSERVATIONS</div></div><div class="ar-search"><label for="ar-country">Χώρα</label><select id="ar-country"><option>Loading 215 countries…</option></select><button id="ar-reload">↻</button></div>',
'<div class="ar-modes" role="group" aria-label="Time range"><button class="active" data-ar-period="24h">24 HOURS</button><button data-ar-period="168h">7 DAYS</button><button data-ar-period="monthly">MONTHLY</button><button data-ar-period="annual">ANNUAL</button></div>',
'<div class="ar-chart-header"><div><div class="ar-chart-title" id="ar-title">Loading country data…</div><div class="ar-chart-sub" id="ar-sub">Waiting for source</div></div><div class="ar-latest" id="ar-latest">—</div></div>',
'<div class="ar-chart" id="ar-chart"><div class="ar-unavailable">Σύνδεση με ιστορικές χρονοσειρές…</div></div><div class="ar-chart-footer"><span id="ar-samples">— OBSERVATIONS</span><span id="ar-source">SOURCE: —</span></div><div class="ar-fuels" id="ar-fuels"></div></div>',
'<div class="archive-card ar-status"><div class="ar-card-head"><div><span class="ar-index">02 / REGIONAL LIVE COVERAGE</span><h3>Where the grid is measured</h3></div><span class="ar-pulse">● CHECK EVERY MINUTE</span></div>',
'<div class="ar-feed" id="ar-feed"><div class="ar-unavailable">Connecting to regional networks…</div></div>',
'<div class="ar-note"><b>GLOBAL BLACKOUT RISK:</b> Δεν υπάρχει τεκμηριωμένη πιθανότητα για ταυτόχρονη παγκόσμια διακοπή. Παρακολουθούμε ξεχωριστά τεχνικούς δείκτες, επίσημα συμβάντα και διαθεσιμότητα δεδομένων.</div></div></div>',
'<div class="ar-us"><div class="ar-us-head"><div><span class="ar-index">03 / NORTH AMERICAN GRID HISTORY</span><h3>US grid regions / daily demand</h3></div><select id="ar-usselect"><option>Loading EIA regions…</option></select></div><div class="ar-us-content"><div id="ar-us-chart" class="ar-us-chart"><div class="ar-unavailable">Data loading…</div></div><div class="ar-us-stats"><b id="ar-usvalue">—</b><span id="ar-usdate">Επίσημα ημερήσια στοιχεία από την EIA, όχι μέτρηση ανά λεπτό.</span><a href="https://www.eia.gov/electricity/gridmonitor/" target="_blank" rel="noopener noreferrer">EIA HOURLY GRID MONITOR ↗</a></div></div></div>',
'<div class="ar-foot"><span>GLOBAL COVERAGE ≠ GLOBAL LIVE TELEMETRY</span><span id="ar-updated">ARCHIVE: LOADING</span><span>EMBER · EIA · ENTSO-E · AEMO · CAIDA</span></div></section>'
].join('');
async function json(url){const res=await fetch(url,{cache:'default'});if(!res.ok)throw Error('HTTP '+res.status);return res.json();}
function svgChart(data,unit='TWh',small=false){
const all=data.filter(x=>x&&n(x.value)!==null);const every=Math.max(1,Math.ceil(all.length/420));const pts=all.filter((x,i)=>i%every===0||i===all.length-1);if(pts.length===0)return '<div class="ar-unavailable">Η πηγή δεν επέστρεψε παρατηρήσεις για την επιλεγμένη περίοδο. Η απουσία δεδομένων δεν σημαίνει μηδενική παραγωγή.</div>';
let lo=Math.min(...pts.map(x=>n(x.value))),hi=Math.max(...pts.map(x=>n(x.value)));if(hi===lo){lo=Math.max(0,lo-1);hi+=1;}else{const pad=(hi-lo)*.1;lo=Math.max(0,lo-pad);hi+=pad}
const W=820,H=small?170:275,L=57,R=14,T=20,B=small?28:41;
const sx=i=>L+i/Math.max(1,pts.length-1)*(W-L-R),sy=v=>T+(hi-v)/(hi-lo)*(H-T-B);
const shape=pts.map((x,i)=>(i?'L':'M')+sx(i).toFixed(2)+','+sy(n(x.value)).toFixed(2)).join(' ');
const fill=shape+' L'+sx(pts.length-1).toFixed(2)+','+(H-B)+' L'+L+','+(H-B)+' Z';
const labels=[0,.25,.5,.75,1].map(t=>{const y=T+t*(H-T-B),v=hi-t*(hi-lo);return '<g><line x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'" stroke="#283b5233" stroke-dasharray="4 4"/><text x="'+(L-11)+'" y="'+(y+4)+'" text-anchor="end" font-size="12" fill="#59687a">'+fmt(v,1)+'</text></g>'}).join('');
const ticks=pts.filter((x,i)=>i===0||i===pts.length-1||i===Math.floor((pts.length-1)/2)).map(x=>{const i=pts.indexOf(x);return '<text x="'+sx(i)+'" y="'+(H-9)+'" font-size="11" fill="#667787" text-anchor="'+(i===0?'start':i===pts.length-1?'end':'middle')+'">'+safe(x.at.slice(0,13))+'</text>'}).join('');
const dots=pts.length<=110?pts.map((x,i)=>'<circle cx="'+sx(i).toFixed(2)+'" cy="'+sy(n(x.value)).toFixed(2)+'" r="3" fill="#3b62cb"><title>'+safe(x.at)+' · '+fmt(x.value,2)+' '+safe(unit)+'</title></circle>').join(''):'<circle cx="'+sx(pts.length-1)+'" cy="'+sy(n(pts.at(-1).value))+'" r="4" fill="#3b62cb"><title>'+safe(pts.at(-1).at)+'</title></circle>';
return '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" role="img" aria-label="'+pts.length+' real measurements over time"><defs><linearGradient id="'+(small?'arBlueUS':'arBlue')+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#829bec" stop-opacity=".33"/><stop offset="100%" stop-color="#829bec" stop-opacity="0"/></linearGradient></defs>'+labels+'<path d="'+fill+'" fill="url(#'+(small?'arBlueUS':'arBlue')+')"/><path d="'+shape+'" fill="none" stroke="#3b62cb" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>'+dots+ticks+'</svg>';
}
function modeAvailable(){const c=store.catalog.find(x=>x.id===store.id),iso=iso3To2[c?.iso3];return !!(iso&&supported.includes(iso))}
async function chooseCountry(id){const idx=++store.request;store.id=id;store.country=null;store.recent=null;$('ar-chart').innerHTML='<div class="ar-unavailable">Ανάκτηση επαληθευμένων μετρήσεων…</div>';$('ar-fuels').innerHTML='';
const c=store.catalog.find(x=>x.id===id);if(!c)return;
if(!modeAvailable()&&['24h','168h'].includes(store.period)){store.period=c.month?'monthly':'annual';document.querySelectorAll('[data-ar-period]').forEach(x=>x.classList.toggle('active',x.dataset.arPeriod===store.period));}
const tasks=[json('/api/grid-history?kind=country&id='+encodeURIComponent(id))];
if(modeAvailable()&&['24h','168h'].includes(store.period)){const hours=store.period==='168h'?168:24;tasks.push(json('/api/grid-history?kind=recent-country&id='+iso3To2[c.iso3]+'&hours='+hours));}
const settled=await Promise.allSettled(tasks);if(idx!==store.request)return;
store.country=settled[0].status==='fulfilled'&&settled[0].value.ok?settled[0].value:null;store.recent=settled[1]?.status==='fulfilled'&&settled[1].value.ok?settled[1].value:null;
showCountry();}
function showCountry(){const c=store.catalog.find(x=>x.id===store.id);if(!c)return;const hist=store.country,mode=store.period,recent=store.recent;
const data=mode==='24h'||mode==='168h'?(recent?.series||[]).map(x=>({at:x.at,value:x.mw})):mode==='monthly'?hist?.monthly?.generation||[]:hist?.annual?.generation||[];
const unit=mode==='24h'||mode==='168h'?'MW':'TWh';
const source=(mode==='24h'||mode==='168h'?'Energy-Charts / recent generation':'Ember / historical generation');
$('ar-title').textContent=c.name+' · '+({ '24h':'Last 24 hours','168h':'Last 7 days','monthly':'Monthly history','annual':'Annual history'})[mode];
$('ar-sub').textContent=mode==='24h'||mode==='168h'?'Latest available observations; cadence depends on source':mode==='monthly'?'Monthly national statistics (may lag 1–2 months)':'Historical annual totals (not live)';
$('ar-chart').innerHTML=svgChart(data,unit);
$('ar-latest').innerHTML=data.length?fmt(data.at(-1).value,mode==='24h'||mode==='168h'?0:1)+' <small>'+unit+'</small>':'N/A';
$('ar-samples').textContent=data.length+' SOURCE OBSERVATIONS';
$('ar-source').textContent=source+(data.length?' · '+data.at(-1).at:'');
const fuel=(mode==='monthly'?hist?.monthly?.mix:hist?.annual?.mix)||[];
const total=fuel.reduce((a,x)=>a+n(x.twh),0);
$('ar-fuels').innerHTML=fuel.length?'<div class="ar-fuel-title">GENERATION MIX · '+(mode==='monthly'?'LATEST MONTH':'LATEST ANNUAL')+'</div><div class="ar-fuelbars">'+fuel.slice(0,9).map((x,i)=>'<div class="ar-fuel-item"><label>'+safe(x.fuel.toUpperCase())+'</label><div><span style="width:'+Math.min(100,100*(n(x.twh)||0)/Math.max(1,total)).toFixed(1)+'%;background:'+['#b6e976','#768ae6','#ffc58e','#d6a6dd','#54bfab','#ed7c7d','#a8c7f4'][i%7]+'"></span></div><b>'+fmt(x.twh,1)+' TWh</b></div>').join('')+'</div>':'<div class="ar-fuel-title">Fuel history not available for this country.</div>';
}
function eventRender(){const grid=store.grid,eu=grid?.europe,au=grid?.australia;let rows=[];
rows.push({title:'Continental Europe',tag:'OPERATOR FEED',status:eu?.ok?eu.coverageCount+' country records':'SOURCE NOT RESPONDING',good:eu?.ok,desc:'Aggregated TSO data as published; refresh request every 60s',source:'https://euroenergy.live/en/api'});
if(eu?.ok)for(const v of eu.countries.slice(0,10)){let fresh=v.at&&Date.now()-Date.parse(v.at)<3*3600000;rows.push({title:v.name+' / '+v.code,tag:'OPERATOR REPORT',status:fresh?fmt(v.demandMw,0)+' MW demand':'SOURCE TIMESTAMP MISSING/STALE',good:fresh&&v.demandMw!==null,desc:v.at||'Timestamp unknown',source:'https://euroenergy.live/en/api'})}
rows.push({title:'Australia / NEM',tag:'AEMO 5-MINUTE',status:au?.ok?fmt(au.totalDemandMw,0)+' MW total market demand':'SOURCE NOT RESPONDING',good:au?.ok&&au.totalDemandMw!==null,desc:au?.ok?au.regionCount+' NEM regions · not all Australia':'Official dashboard is available separately; API may block external calls',source:'https://www.aemo.com.au/energy-systems/electricity/national-electricity-market-nem/data-nem/data-dashboard-nem'});
if(au?.ok)for(const v of au.regions){rows.push({title:v.region,tag:'AEMO REGION',status:v.stale?'STALE':fmt(v.demandMw,0)+' MW',good:!v.stale&&v.demandMw!==null,desc:v.at||'Measurement time not available',source:'https://www.aemo.com.au/energy-systems/electricity/national-electricity-market-nem/data-nem/data-dashboard-nem'})}
rows.push({title:'Great Britain',tag:'ELEXON TELEMETRY',status:'SEE LIVE PANEL ABOVE',good:true,desc:'Grid frequency, fuel mix and demand independently polled every minute',source:'https://bmrs.elexon.co.uk/'});
rows.push({title:'United States',tag:'EIA HISTORICAL',status:'DAILY DATA / 14 GRID REGIONS',good:null,desc:'No public minute-level national API configured. Daily archive shown below.',source:'https://www.eia.gov/electricity/gridmonitor/'});
$('ar-feed').innerHTML=rows.map(r=>'<a href="'+safe(r.source)+'" class="ar-feedrow" target="_blank" rel="noopener noreferrer"><div class="ar-feedtop"><span>'+safe(r.tag)+'</span><i class="'+(r.good===true?'fresh':r.good===false?'missing':'historical')+'"></i></div><h4>'+safe(r.title)+'</h4><strong>'+safe(r.status)+'</strong><small>'+safe(r.desc)+'</small></a>').join('');
$('ar-updated').textContent='LAST SOURCE CHECK '+(grid?.fetchedAt?new Date(grid.fetchedAt).toLocaleTimeString('en-GB',{timeZone:'UTC'}):'—')+' UTC';}
async function updateGrid(){try{store.grid=await json('/api/global-grid');eventRender();window.dispatchEvent(new CustomEvent('blackout:grid',{detail:store.grid}))}catch{$('ar-feed').innerHTML='<div class="ar-unavailable">Οι ζωντανές διεθνείς πηγές δεν ανταποκρίνονται αυτή τη στιγμή. Τα ιστορικά παραμένουν ανεξάρτητα.</div>'}}
async function updateUS(){const id=store.region;const el=$('ar-us-chart');el.innerHTML='<div class="ar-unavailable">Loading EIA daily history…</div>';
try{const d=await json('/api/grid-history?kind=us-region&id='+encodeURIComponent(id));if(id!==store.region)return;const data=d.series?.demand||[];el.innerHTML=svgChart(data.slice(-100),'MWh/day',true);$('ar-usvalue').innerHTML=data.length?fmt(data.at(-1).value,0)+' <small>MWh/day</small>':'N/A';$('ar-usdate').textContent=data.length?'Last reported day: '+data.at(-1).at+' · EIA / public domain':'US regional history not available'}
catch{el.innerHTML='<div class="ar-unavailable">EIA archive unavailable; no estimated values.</div>';}}
async function init(){const page=$('page-overview');if(!page)return;const anchor=page.querySelector('.live-board');if(anchor)anchor.insertAdjacentHTML('afterend',root);else page.insertAdjacentHTML('afterbegin',root);
document.querySelectorAll('[data-ar-period]').forEach(b=>b.addEventListener('click',()=>{store.period=b.dataset.arPeriod;document.querySelectorAll('[data-ar-period]').forEach(x=>x.classList.toggle('active',x===b));chooseCountry(store.id)}));
$('ar-country').onchange=e=>chooseCountry(e.target.value);$('ar-usselect').onchange=e=>{store.region=e.target.value;updateUS()};$('ar-reload').onclick=()=>chooseCountry(store.id);
window.addEventListener('blackout:select-country',e=>{const id=e.detail?.id;if(id&&store.catalog.some(x=>x.id===id)){$('ar-country').value=id;chooseCountry(id);document.getElementById('world-archive')?.scrollIntoView({behavior:'smooth',block:'start'})}});
const catalog=await json('/api/global-catalog').catch(()=>null);
if(catalog?.ok){store.catalog=catalog.countries;store.regions=catalog.regions;window.dispatchEvent(new CustomEvent('blackout:catalog',{detail:catalog}));$('ar-countries').textContent=catalog.annualCountries;$('ar-monthly').textContent=catalog.monthlyCountries;$('ar-regions').textContent=catalog.regionCount;
$('ar-country').innerHTML=store.catalog.map(c=>'<option value="'+safe(c.id)+'">'+safe(c.name)+(c.month?' · monthly':'')+'</option>').join('');$('ar-country').value=store.id; 
$('ar-usselect').innerHTML=store.regions.map(c=>'<option value="'+safe(c.id)+'">'+safe(c.name)+'</option>').join('');$('ar-usselect').value=store.region;
chooseCountry(store.id);updateUS();
}else{$('ar-countries').textContent='N/A';$('ar-monthly').textContent='N/A';$('ar-regions').textContent='N/A';$('ar-chart').innerHTML='<div class="ar-unavailable">Global archive unavailable from upstream provider.</div>'}
updateGrid();setInterval(updateGrid,60000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();