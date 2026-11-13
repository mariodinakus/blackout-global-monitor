
'use strict';
const $=id=>document.getElementById(id);
const s={overview:null,energy:null,news:null,cyber:null,map:null,groups:null,layer:'all',topic:'energy',country:'gr',refreshing:false};
const countryNames={gr:'GREECE',de:'GERMANY',fr:'FRANCE',it:'ITALY',es:'SPAIN',pt:'PORTUGAL',nl:'NETHERLANDS',pl:'POLAND',ro:'ROMANIA',se:'SWEDEN',fi:'FINLAND',uk:'UNITED KINGDOM'};
const sites=[['Itaipu',-25.408,-54.589,'Hydro'],['Three Gorges',30.823,111.004,'Hydro'],['Baihetan',27.219,102.893,'Hydro'],['Olkiluoto',61.237,21.442,'Nuclear'],['Koeberg',-33.676,18.433,'Nuclear'],['Barakah',23.965,52.253,'Nuclear'],['Hoover Dam',36.016,-114.737,'Hydro'],['Grand Coulee',47.956,-118.981,'Hydro'],['Palo Verde',33.389,-112.865,'Nuclear'],['Bruce Nuclear',44.327,-81.6,'Nuclear'],['Aswan',23.971,32.878,'Hydro'],['Tarbela',34.088,72.704,'Hydro'],['Kori',35.321,129.299,'Nuclear'],['Wivenhoe',-27.378,152.609,'Pumped storage']];
const locations={US:[39,-98],GB:[54,-2],DE:[51,10],FR:[46,2],ES:[40,-4],IT:[43,12],GR:[39,22],RU:[60,90],UA:[49,32],IN:[22,79],CN:[35,103],JP:[36,138],KR:[36,128],AU:[-25,134],BR:[-12,-52],CA:[56,-106],ZA:[-30,25],NG:[9,8],EG:[26,30],TR:[39,35],IR:[32,53],ID:[-2,118],PK:[30,69],NZ:[-41,173],NL:[52,5],FI:[64,26],SE:[62,15],NO:[62,10],CH:[47,8],PL:[52,19],RO:[46,25],RS:[44,21],VE:[7,-66],LA:[19.8,103.5],GQ:[1.6,10.2],SC:[-4.6,55.5],GI:[36.14,-5.35],TJ:[38.7,71.1],VU:[-16.5,168],TM:[39,59],HN:[15,-86.5],BJ:[9.4,2.3],CG:[-1,15],TD:[15,19],TL:[-8.8,126],NF:[-29,168],CK:[-21.2,-159.8],TV:[-8.5,179],PT:[40,-8],UA:[49,32],SY:[35,38],LK:[7,81],NP:[28,84],UZ:[41,64],BD:[24,90],TH:[15,101],MY:[4,102],PH:[13,122],VN:[16,107],IR:[32,53],SA:[24,45],AE:[24,54]};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function url(v){try{const a=new URL(v);return ['https:','http:'].includes(a.protocol)?a.href:'#'}catch{return '#'}}
function num(v,d=0){return v!==null&&v!==undefined&&v!==''&&Number.isFinite(+v)?(+v).toLocaleString('el-GR',{maximumFractionDigits:d}):'—'}
function utc(v){const d=new Date(v);return Number.isFinite(+d)?d.toLocaleString('el-GR',{timeZone:'UTC',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+' UTC':'—'}
function ago(v){const t=Date.parse(v),m=Math.max(0,Math.floor((Date.now()-t)/60000));return Number.isFinite(t)?m<60?m+' MIN AGO':m<1440?Math.floor(m/60)+'H AGO':Math.floor(m/1440)+'D AGO':'UNKNOWN'}
function write(id,v){if($(id))$(id).textContent=v}
function unavailable(id,message){if($(id))$(id).innerHTML='<div class="empty">'+esc(message)+'</div>'}
function page(name){
 if(!['overview','energy','incidents','about'].includes(name))name='overview';
 document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('is-active',b.dataset.page===name));
 document.querySelectorAll('.page').forEach(el=>el.classList.toggle('is-active',el.id==='page-'+name));
 if(location.hash!=='#'+name)history.replaceState(null,'','#'+name);
 if(name==='overview'&&s.map)setTimeout(()=>s.map.invalidateSize(),90);
 window.scrollTo({top:0,behavior:'auto'});
}
function symbol(kind){return L.divIcon({className:'',html:'<div class="marker '+kind+'"></div>',iconSize:[14,14],iconAnchor:[7,7]})}
function mapInit(){
 if(!window.L){unavailable('worldMap','Χάρτης μη διαθέσιμος');return}
 try{
 const m=L.map('worldMap',{worldCopyJump:true,scrollWheelZoom:false,minZoom:2,maxZoom:12,zoomControl:false}).setView([22,12],2);
 L.control.zoom({position:'topright'}).addTo(m);
 L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(m);
 s.map=m;s.groups={plants:L.layerGroup().addTo(m),internet:L.layerGroup().addTo(m)};
 mapRender();
 }catch(e){unavailable('worldMap','Ο χάρτης δεν μπόρεσε να φορτωθεί')}
}
function mapRender(){
 if(!s.map)return;
 s.groups.plants.clearLayers();s.groups.internet.clearLayers();
 if(s.layer!=='internet'){
 for(const [name,lat,lng,type] of sites)L.marker([lat,lng],{icon:symbol('plant')}).bindPopup('<b>'+esc(name)+'</b><div>'+esc(type)+'</div><b>Operating status: UNKNOWN</b>').addTo(s.groups.plants);
 L.marker([54,-2],{icon:symbol('grid')}).bindPopup('<b>GB system</b><div>Regional demand proxy only, not line loading.</div>').addTo(s.groups.plants);
 }
 let count=0;
 if(s.layer!=='plants'&&s.overview?.internet?.ok){
 for(const x of s.overview.internet.value.events){const loc=locations[x.code];if(!loc)continue;count++;
 L.marker(loc,{icon:symbol('')}).bindPopup('<b>'+esc(x.country)+'</b><div>IODA '+esc(x.sensor)+' · '+esc(utc(x.startedAt))+'</div><div>Not necessarily an ongoing outage.</div><a href="https://ioda.inetintel.cc.gatech.edu/" target="_blank" rel="noopener">IODA source ↗</a>').addTo(s.groups.internet)}
 }
 write('mapCaption',count+' PLOTTED INTERNET SIGNALS');
}
function providerRender(){
 const p=s.overview?.providers;
 if(!p?.ok){unavailable('providerFeed','Πηγές μη διαθέσιμες');return}
 $('providerFeed').innerHTML=p.value.map(x=>'<a class="provider-row" href="'+url(x.url)+'" target="_blank" rel="noopener noreferrer"><span><b>'+esc(x.name)+'</b><br><small>'+esc(!x.ok?'Unavailable':x.incidents?.length?x.incidents.length+' open reports':x.description)+'</small></span><i class="status-bullet '+(!x.ok?'unavailable':x.indicator==='none'?'ok':'issue')+'"></i></a>').join('');
}
function latestItems(){
 let a=[];
 if(s.overview?.providers?.ok)for(const p of s.overview.providers.value)for(const e of p.incidents||[])a.push({kind:'OFFICIAL',tag:'pink',title:e.title||e.name,at:e.time||e.updatedAt||e.createdAt,description:p.name+' · '+e.status,link:p.url});
 if(s.overview?.internet?.ok)for(const x of s.overview.internet.value.events.slice(0,35))a.push({kind:'IODA SIGNAL',tag:'yellow',title:'Connectivity anomaly · '+x.country,at:x.startedAt,description:'Observation, not necessarily active · '+x.sensor,link:'https://ioda.inetintel.cc.gatech.edu/'});
 if(s.news?.ok)for(const x of s.news.articles.slice(0,25))a.push({kind:'NEWS REPORT',tag:'',title:x.title,at:x.publishedAt,description:x.source+' · unverified news report',link:x.url});
 return a.sort((x,y)=>(Date.parse(y.at)||0)-(Date.parse(x.at)||0));
}
function latestRender(){
 const a=latestItems();
 $('latestFeed').innerHTML=a.length?a.slice(0,18).map(x=>'<a class="feedrow" href="'+url(x.link)+'" target="_blank" rel="noopener noreferrer"><div class="feedhead"><span class="tag '+x.tag+'">'+esc(x.kind)+'</span><span class="feedtime">'+esc(ago(x.at))+'</span></div><div class="feedtitle">'+esc(x.title)+'</div><div class="feedsub">'+esc(x.description)+' · '+esc(utc(x.at))+'</div></a>').join(''):'<div class="empty">Δεν υπάρχουν διαθέσιμες αναφορές από τα συγκεκριμένα feeds. Αυτό δεν αποδεικνύει ότι όλα λειτουργούν.</div>';
 if(a.length)write('tickerCopy',a[0].kind+': '+a[0].title);
}
function overviewRender(){
 const d=s.overview; if(!d)return;
 const i=d.internet;write('signalCount',i?.ok?num(i.value.events.length):'N/A');write('signalDetail',i?.ok?'IODA / LAST 48 HOURS':'IODA UNAVAILABLE');
 const p=d.providers,ready=p?.ok?p.value.filter(x=>x.ok):[],total=ready.reduce((n,x)=>n+x.incidents.length,0);
 write('platformCount',ready.length?num(total):'N/A');write('platformDetail',ready.length?ready.length+'/'+p.value.length+' PROVIDERS':'FEEDS UNAVAILABLE');
 const gb=d.gb?.ok?d.gb.value:null; const valid=gb&&gb.mw!==null;
 write('gbNumber',valid?num(gb.mw):'N/A');write('gbEnergyNum',valid?num(gb.mw):'N/A');write('gbDetail',valid?utc(gb.at):'DATA UNAVAILABLE');write('gbEnergyTime',valid?utc(gb.at):'DATA UNAVAILABLE');
 $('gbFuelBars').innerHTML=gb?.fuels?.length?gb.fuels.filter(x=>x.mw>0).sort((a,b)=>b.mw-a.mw).slice(0,7).map(x=>'<div class="fuel-item"><span>'+esc(x.name)+'</span><b>'+num(x.mw)+' MW</b></div>').join(''):'<div class="empty">Unavailable</div>';
 write('lastUpdated','CHECKED '+utc(d.fetchedAt));write('footerTime','DATA '+utc(d.fetchedAt));
 $('connectionIndicator').innerHTML='<i></i>'+(i?.ok||ready.length||valid?' SOURCES CONNECTED':' SOURCES UNAVAILABLE');
 $('connectionIndicator').className='connection '+(i?.ok||ready.length||valid?'good':'fail');
 providerRender();latestRender();mapRender();
}
function newsRender(){
 const d=s.news;
 if(!d?.ok){
const reports=latestItems().filter(x=>x.kind!=='NEWS REPORT').slice(0,30);
$('newsFeed').innerHTML='<div class="empty">GDELT news feed currently unavailable. Below are separately labeled official service reports and observed IODA connectivity signals, not independently verified news or confirmed power failures.</div>'+reports.map((x,i)=>'<a class="story" href="'+url(x.link)+'" target="_blank" rel="noopener noreferrer"><div class="story-index">'+String(i+1).padStart(2,'0')+'</div><div><h3 class="story-title">'+esc(x.title)+'</h3><div class="story-meta"><span class="story-lbl">'+esc(x.kind)+' · SOURCE-ATTRIBUTED</span><span>'+esc(x.description)+'</span><span>'+utc(x.at)+'</span></div></div></a>').join('');
return
}
 $('newsFeed').innerHTML=d.articles.length?d.articles.map((x,n)=>'<a class="story" href="'+url(x.url)+'" target="_blank" rel="noopener noreferrer"><div class="story-index">'+String(n+1).padStart(2,'0')+'</div><div><h3 class="story-title">'+esc(x.title)+'</h3><div class="story-meta"><span class="story-lbl">NEWS REPORT · UNVERIFIED</span><span>'+esc(x.source)+'</span><span>'+utc(x.publishedAt)+'</span></div></div></a>').join(''):'<div class="empty">No recent matching articles from this source.</div>';
}
function cyberRender(){
 $('cisaFeed').innerHTML=s.cyber?.ok&&s.cyber.items?.length?s.cyber.items.slice(0,6).map(x=>'<a class="kev" href="https://nvd.nist.gov/vuln/detail/'+encodeURIComponent(x.id||x.cve)+'" target="_blank" rel="noopener noreferrer"><strong>'+esc(x.id||x.cve)+' / '+esc(x.vendor)+'</strong><span>'+esc(x.dateAdded)+' · '+esc(x.name)+'</span></a>').join(''):'<div class="empty">CISA KEV unavailable</div>';
}
function plot(id,raw,color){
 const el=$(id),arr=raw.filter(v=>Number.isFinite(v));if(!el)return;
 if(arr.length<2){el.innerHTML='<div class="chart-empty">Not enough measurements</div>';return}
 let low=Math.min(49.8,...arr),high=Math.max(50.2,...arr),w=600,h=140;
 let pts=arr.map((v,j)=>((j*600)/(arr.length-1)).toFixed(1)+','+(h-(v-low)/(high-low)*(h-4)).toFixed(1)).join(' ');
 el.innerHTML='<svg role="img" aria-label="Measured grid frequency" viewBox="0 0 600 140" preserveAspectRatio="none"><polyline points="'+pts+'" stroke="'+color+'" stroke-width="3" fill="none" vector-effect="non-scaling-stroke"/></svg>';
}
function energyRender(){
 const e=s.energy,p=e?.power,f=e?.frequency;
 write('countryTitle',countryNames[s.country]||s.country.toUpperCase());
 if(p?.ok&&p.latest){
  const latest=Object.entries(p.latest).map(([id,mw])=>({name:p.series?.find(x=>x.id===id)?.name||id,mw:Number(mw)})).filter(x=>Number.isFinite(x.mw)&&x.mw>=0&&!/total|forecast/i.test(x.name)).sort((a,b)=>b.mw-a.mw);
  write('genNumber',latest.length?num(latest.reduce((n,x)=>n+x.mw,0)):'N/A');const max=latest[0]?.mw||1;
  $('generationBars').innerHTML=latest.slice(0,8).map(x=>'<div class="bar-item"><span>'+esc(x.name.slice(0,19))+'</span><div class="bar-track"><div class="bar-fill" style="width:'+Math.max(0,Math.min(100,x.mw/max*100)).toFixed(1)+'%"></div></div><div class="bar-val">'+num(x.mw)+' MW</div></div>').join('');
  write('genTimestamp','Source: Energy-Charts · '+utc(p.at)+' · generation, not overload');
 }else{write('genNumber','N/A');unavailable('generationBars','Country generation unavailable');write('genTimestamp','No valid reading')}
 if(f?.ok&&f.latest&&Number.isFinite(Number(f.latest.hz))){
  const hz=Number(f.latest.hz).toFixed(3);write('frequencyNow',hz);write('euFrequency',hz+' Hz');write('freqFresh','READING '+ago(f.latest.at));
  write('frequencyTimestamp','Freiburg sensor · '+utc(f.latest.at)+' · not all-European overload');
  let vals=(f.history||[]).map(x=>Number(x.hz)).filter(Number.isFinite);plot('frequencyPlot',vals,'#6c5de3');plot('freqSpark',vals,'#6c5de3');
 }else{write('frequencyNow','N/A');write('euFrequency','N/A');write('freqFresh','UNAVAILABLE');write('frequencyTimestamp','Sensor unavailable');unavailable('frequencyPlot','Frequency data unavailable');unavailable('freqSpark','Frequency data unavailable')}
}
async function data(path){const r=await fetch(path,{headers:{Accept:'application/json'}});if(!r.ok)throw Error('source '+r.status);return r.json()}
async function loadOverview(){try{s.overview=await data('/api/overview');overviewRender()}catch{write('signalCount','N/A');write('platformCount','N/A');write('gbNumber','N/A');write('gbEnergyNum','N/A');unavailable('latestFeed','Monitoring source unavailable — not zero incidents');unavailable('providerFeed','Unavailable');$('connectionIndicator').textContent='SOURCES UNAVAILABLE'}}
async function loadNews(){try{s.news=await data('/api/news?topic='+encodeURIComponent(s.topic));}catch{s.news={ok:false,articles:[]}}newsRender();latestRender()}
async function loadEnergy(){try{s.energy=await data('/api/energy?country='+encodeURIComponent(s.country));}catch{s.energy=null}energyRender()}
async function loadCyber(){try{s.cyber=await data('/api/cyber')}catch{s.cyber=null}cyberRender()}
async function refresh(){if(s.refreshing)return;s.refreshing=true;$('refreshAll').disabled=true;try{await Promise.allSettled([loadOverview(),loadNews(),loadEnergy(),loadCyber()])}finally{s.refreshing=false;$('refreshAll').disabled=false}}
function bind(){
 document.querySelectorAll('.nav-link').forEach(b=>b.addEventListener('click',()=>page(b.dataset.page)));
 document.querySelectorAll('[data-layer]').forEach(b=>b.addEventListener('click',()=>{s.layer=b.dataset.layer;document.querySelectorAll('[data-layer]').forEach(x=>x.classList.toggle('is-selected',x===b));mapRender()}));
 document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{s.topic=b.dataset.topic;document.querySelectorAll('[data-topic]').forEach(x=>x.classList.toggle('is-selected',x===b));unavailable('newsFeed','Loading recent reports…');loadNews()}));
 $('countrySelect').onchange=e=>{s.country=e.target.value;loadEnergy()};
 $('showAllNews').onclick=()=>page('incidents');$('exploreEnergy').onclick=()=>page('energy');$('refreshAll').onclick=refresh;
 $('scenarioIntensity').oninput=e=>write('scenarioIntensityLabel',e.target.value+' / 5');
 $('runScenario').onclick=()=>{
 const region=$('scenarioRegion').value,cause=$('scenarioCause').value,level=$('scenarioIntensity').value;
 const explain=cause.includes('space')?'Geomagnetic storms could disrupt multiple independent power systems.':cause.includes('cyber')?'A coordinated event could affect different independent systems, but a single outage does not prove attack.':'Grid cascades depend on physical interconnections; they do not automatically spread across oceans.';
 $('scenarioOutput').innerHTML='<b>HYPOTHETICAL · '+esc(region)+' · LEVEL '+esc(level)+'/5</b><br>'+esc(explain)+'<br><b>WORLDWIDE PROBABILITY: NOT ESTIMABLE FROM THIS MODEL.</b>';
 };
 addEventListener('hashchange',()=>page(location.hash.slice(1)));
}
function clock(){write('utcTime',new Date().toLocaleTimeString('en-GB',{timeZone:'UTC',hour:'2-digit',minute:'2-digit'})+' UTC')}
bind();mapInit();clock();setInterval(clock,25000);page(location.hash.slice(1)||'overview');refresh();setInterval(refresh,300000);
