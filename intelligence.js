(() => {
'use strict';
const root=document.getElementById('intelligence-root');if(!root)return;
const $=id=>document.getElementById(id);
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const U=x=>{try{let u=new URL(x);return u.protocol==='https:'?E(u.href):'#'}catch{return '#'}};
const F=(n,d=0)=>Number.isFinite(n)?n.toLocaleString('el-GR',{maximumFractionDigits:d}):'—';
const D=x=>x&&Number.isFinite(Date.parse(x))?new Date(x).toLocaleString('el-GR',{timeZone:'Europe/Athens',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
const GET=async path=>{const r=await fetch(path);if(!r.ok)throw Error('HTTP '+r.status);return r.json()};
const names={gr:'Ελλάδα',de:'Γερμανία',es:'Ισπανία',pt:'Πορτογαλία',fr:'Γαλλία',gb:'Μεγάλη Βρετανία',it:'Ιταλία',us:'ΗΠΑ'};
const edges={gr:[['bg','Βουλγαρία'],['al','Αλβανία'],['mk','Βόρεια Μακεδονία'],['it','Ιταλία']],de:[['fr','Γαλλία'],['nl','Ολλανδία'],['pl','Πολωνία'],['at','Αυστρία'],['cz','Τσεχία'],['dk','Δανία']],es:[['pt','Πορτογαλία'],['fr','Γαλλία']],fr:[['de','Γερμανία'],['es','Ισπανία'],['it','Ιταλία'],['be','Βέλγιο'],['gb','Μεγάλη Βρετανία']],gb:[['fr','Γαλλία'],['be','Βέλγιο'],['nl','Ολλανδία']],it:[['fr','Γαλλία'],['ch','Ελβετία'],['at','Αυστρία'],['gr','Ελλάδα']]};
const iso={gr:'GRC',de:'DEU',us:'USA'};
const events=[
 {id:'iberia',title:'Ιβηρική · Απρίλιος 2025',source:'ENTSO-E Factual / Final Report',url:'https://www.entsoe.eu/publications/blackout/28-april-2025-iberian-blackout/',steps:[
  ['12:32:57','Ταχεία αλληλουχία διαταραχών παραγωγής και τάσης στο ισπανικό δίκτυο.'],
  ['12:33:17–18','Πρόσθετες αποσυνδέσεις παραγωγής, με αυξανόμενες υπερτάσεις.'],
  ['12:33:21','Αποσύνδεση διασύνδεσης εναλλασσόμενου ρεύματος Ισπανίας–Γαλλίας λόγω απώλειας συγχρονισμού.'],
  ['12:33:24','Ολοκληρώνεται ο διαχωρισμός της Ιβηρικής από τη Γαλλία και η κατάρρευση του συστήματος.'],
  ['12:44','Επανηλεκτρίζεται η πρώτη γραμμή 400 kV Γαλλίας–Ισπανίας, ως μέρος της αποκατάστασης.']]},
 {id:'america',title:'ΒΑ ΗΠΑ / Καναδάς · Αύγουστος 2003',source:'FERC / US–Canada Power System Outage Task Force',url:'https://www.ferc.gov/sites/default/files/2020-05/blackout-report.pdf',steps:[
  ['12:15 EDT','Ανακριβή δεδομένα επηρεάζουν τον εκτιμητή κατάστασης του MISO.'],
  ['13:31 EDT','Η μονάδα Eastlake 5 στο Οχάιο τίθεται εκτός λειτουργίας.'],
  ['14:14 EDT','Αστοχεί το σύστημα συναγερμών FirstEnergy.'],
  ['16:05:57 EDT','Η αποσύνδεση της γραμμής Sammis–Star σηματοδοτεί ανεξέλεγκτη αλυσιδωτή διαταραχή.']]},
 {id:'europe',title:'Ευρώπη · Νοέμβριος 2006',source:'UCTE / ENTSO-E Final Report',url:'https://www.entsoe.eu/fileadmin/user_upload/_library/publications/ce/otherreports/Final-Report-20070130.pdf',steps:[
  ['περ. 22:10','Η διαταραχή ξεκινά από το δίκτυο μεταφοράς της βόρειας Γερμανίας.'],
  ['στη συνέχεια','Η συγχρονισμένη περιοχή UCTE διασπάται σε τρεις ζώνες.'],
  ['αντιμετώπιση','Ενέργειες διαχειριστών αποτρέπουν πανευρωπαϊκό blackout.']]}
];
const panel=(title,desc,right='')=>'<div class="intel-pane-head"><div><h3>'+title+'</h3><p>'+desc+'</p></div>'+right+'</div>';
root.innerHTML='<section class="intel-root"><div class="intel-intro"><div><div class="intel-kicker">BLACKOUT / INTELLIGENCE LAB</div><h2>Πώς εξελίσσονται οι διαταραχές</h2><p>Πέντε εργαλεία που διαχωρίζουν πραγματική παρατήρηση, μοντέλο και ιστορικά στοιχεία.</p></div><div class="intel-glance"><span class="intel-tag observed">OBSERVED</span><span class="intel-tag scenario">SCENARIO</span><span class="intel-tag unknown">UNKNOWN ≠ ZERO</span></div></div>'+
'<div class="intel-nav" id="intelNav" role="tablist"><button type="button" role="tab" data-view="cascade" class="active">01 · Cascade Radar</button><button type="button" role="tab" data-view="early">02 · Early Signals</button><button type="button" role="tab" data-view="domino">03 · Digital Domino</button><button type="button" role="tab" data-view="machine">04 · Time Machine</button><button type="button" role="tab" data-view="country">05 · Country Deep Dive</button></div>'+
'<div class="intel-view active" id="intel-cascade"><div class="intel-pane">'+panel('Cascade Radar','Χάρτης επιλεγμένων υπαρκτών διασυνδέσεων με παρατηρήσεις Internet. Καμία βλάβη ηλεκτρικού δικτύου δεν θεωρείται επιβεβαιωμένη από σήματα IODA.','<select id="cascadeSelect" class="intel-selector"><option value="gr">Ελλάδα</option><option value="de">Γερμανία</option><option value="es">Ισπανία</option><option value="fr">Γαλλία</option><option value="gb">Μεγάλη Βρετανία</option><option value="it">Ιταλία</option></select>')+'<div class="intel-flex" id="cascadeOutput"></div><p class="intel-footnote">Στατικό υποσύνολο διασυνοριακών συνδέσεων. Δεν παρέχονται live ροές ισχύος, κατάσταση γραμμών ή πιθανότητες μετάδοσης. <a href="https://www.entsoe.eu/data/map/" target="_blank" rel="noopener">ENTSO-E Grid Map</a>.</p></div></div>'+
'<div class="intel-view" id="intel-early"><div class="intel-pane">'+panel('Grid Early Signals','Πραγματική μεταβολή συχνότητας ανά 5, 15 και 60 λεπτά. Δεν εμφανίζεται τιμή όταν λείπει κατάλληλη μέτρηση.','<span class="intel-tag">Hz / mHz</span>')+'<div class="intel-flex" id="earlyOutput"><div class="intel-empty">Φόρτωση μετρήσεων…</div></div><p class="intel-footnote">Η μεταβολή της συχνότητας δεν ισούται με πιθανότητα blackout. Διαφορετικές πηγές έχουν διαφορετικούς χρόνους δημοσίευσης.</p></div></div>'+
'<div class="intel-view" id="intel-domino"><div class="intel-pane">'+panel('Digital Domino','Ενεργές αναφορές επίσημων status pages και ρητές αναφορές άλλων παρόχων στους τίτλους περιστατικών.')+'<div class="intel-flex"><div><h3>Ενεργές αναφορές</h3><div class="intel-rows" id="dominoOutput"></div></div><div><h3>Σχέσεις που αναφέρονται</h3><div class="intel-rows" id="dominoLinks"></div><p class="intel-footnote">Η αναφορά σε μια ενσωμάτωση δεν αποδεικνύει τεχνική αιτιότητα ή εξάρτηση ολόκληρης πλατφόρμας.</p></div></div></div></div>'+
'<div class="intel-view" id="intel-machine"><div class="intel-pane">'+panel('Blackout Time Machine','Χρονολόγιο ανασυσταμένο από επίσημες εκθέσεις, όχι τεχνητή αναπαραγωγή αδημοσίευτων μετρήσεων.','<select id="machineSelect" class="intel-selector"></select>')+'<div id="machineOutput"></div></div></div>'+
'<div class="intel-view" id="intel-country"><div class="intel-pane">'+panel('Country Deep Dive','Δημοσιευμένη παραγωγή όπου είναι διαθέσιμη, ιστορικές ετήσιες σειρές και σαφείς ελλείψεις κάλυψης.','<select id="countrySelectIntel" class="intel-selector"><option value="gr">Ελλάδα</option><option value="de">Γερμανία</option><option value="us">ΗΠΑ</option></select>')+'<div id="countryOutput"></div></div></div></section>';
let pulse=null,out=null,early=null,catalog=null,step=0,eventId='iberia',countryRequest=0;
$('intelNav').addEventListener('click',ev=>{const b=ev.target.closest('[data-view]');if(!b)return;root.querySelectorAll('[data-view]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-selected',String(x===b))});root.querySelectorAll('.intel-view').forEach(x=>x.classList.toggle('active',x.id==='intel-'+b.dataset.view))});
function cascade(){
 const cc=$('cascadeSelect').value,neighbors=edges[cc]||[],countries=out&&out.internet&&out.internet.countries||[];
 const observed=code=>countries.filter(x=>String(x.code||'').toLowerCase()===code&&x.ongoing);
 const all=[[cc,names[cc]],...neighbors],active=all.filter(x=>observed(x[0]).length);
 $('cascadeOutput').innerHTML='<div class="intel-row"><span class="intel-tag scenario">STATIC ELECTRICAL NETWORK</span><h3 style="margin:10px 0">'+E(names[cc])+'</h3><p class="intel-sub">Διασυνδέσεις στο επιλεγμένο υποσύνολο: '+neighbors.length+'</p><div class="intel-node-list">'+neighbors.map(x=>'<div class="intel-node">'+E(x[1])+(observed(x[0]).length?' · IODA':'')+'</div>').join('')+'</div><div class="intel-insight">Αυτές οι συνδέσεις δεν σημαίνουν ότι μια διακοπή θα εξαπλωθεί.</div></div>'+
 '<div class="intel-row"><span class="intel-tag observed">OBSERVED INTERNET ANOMALIES</span><h3 style="margin:10px 0">'+(out&&out.internet&&out.internet.ongoing===null?'Άγνωστο':active.length+' από '+all.length+' χώρες')+'</h3>'+
 (out&&out.internet&&out.internet.ongoing===null?'<div class="intel-empty">Η πηγή IODA δεν απάντησε.</div>':active.length?active.map(x=>'<div class="intel-metric"><span>'+E(x[1])+'</span><span>IODA · όχι διακοπή ρεύματος</span><b>'+observed(x[0]).length+'</b></div>').join(''):'<div class="intel-empty">Δεν εμφανίζονται ενεργά σήματα στις επιλεγμένες χώρες. Αυτό δεν πιστοποιεί την απουσία διαταραχών.</div>')+
 '<div class="intel-insight"><b>Επιβεβαιωμένο ηλεκτρικό cascade:</b> άγνωστο από αυτές τις πηγές · <a href="https://ioda.inetintel.cc.gatech.edu/" target="_blank" rel="noopener">IODA</a></div></div>';
}
$('cascadeSelect').addEventListener('change',cascade);
function earlyCard(data,label){
 if(!data||!data.ok)return '<div class="intel-row"><h3>'+E(label)+'</h3><div class="intel-empty">Μη διαθέσιμη ή παρωχημένη μέτρηση. Δεν υποκαθίσταται με μηδέν.</div></div>';
 return '<div class="intel-row"><h3>'+E(label)+'</h3><span class="intel-sub">'+F(data.latestHz,4)+' Hz · '+D(data.at)+'</span>'+
 [5,15,60].map(m=>{const p=data.changes&&data.changes[m];return '<div class="intel-metric"><b>'+m+' min</b><span>'+(p?'από '+D(p.fromAt):'Ανεπαρκές χρονικό παράθυρο')+'</span><b>'+(p?(p.deltaMHz>0?'+':'')+F(p.deltaMHz)+' mHz':'—')+'</b></div>'}).join('')+
 '<span class="intel-sub"><a href="'+U(data.sourceUrl)+'" target="_blank" rel="noopener">'+E(data.source)+'</a> · '+E(data.scope)+'</span></div>';
}
function renderEarly(){$('earlyOutput').innerHTML=earlyCard(early&&early.ce,'Ηπειρωτική Ευρώπη')+earlyCard(early&&early.gb,'Μεγάλη Βρετανία')}
function domino(){
 const providers=out&&Array.isArray(out.providers)?out.providers:[];
 const issues=providers.filter(p=>p.ok!==false&&p.indicator!=='none').flatMap(p=>(p.incidents||[]).map(i=>({p,i}))).sort((a,b)=>(Date.parse(b.i.at)||0)-(Date.parse(a.i.at)||0));
 $('dominoOutput').innerHTML=issues.length?issues.slice(0,12).map(x=>'<div class="intel-row"><span class="intel-tag observed">'+E(x.p.name)+' · '+E(x.p.indicator)+'</span><strong style="display:block;margin-top:8px">'+E(x.i.name)+'</strong><span class="intel-sub">'+E(x.i.status)+' · '+D(x.i.at)+'</span><a class="intel-link" href="'+U(x.p.url)+'" target="_blank" rel="noopener">Επίσημη πηγή ↗</a></div>').join(''):'<div class="intel-empty">Δεν καταγράφηκαν διαθέσιμα ενεργά περιστατικά. Η απουσία αναφοράς δεν σημαίνει ότι όλοι οι πάροχοι λειτουργούν.</div>';
 const keys=['Microsoft','Amazon','AWS','Google','Cloudflare','Azure','GitHub','Slack','Zoom','OpenAI','Anthropic','Notion'];
 let rel=[];
 for(const x of issues)for(const key of keys)if(!x.p.name.toLowerCase().includes(key.toLowerCase())&&String(x.i.name||'').toLowerCase().includes(key.toLowerCase()))rel.push({provider:x.p.name,other:key,incident:x.i.name,at:x.i.at,url:x.p.url});
 $('dominoLinks').innerHTML=rel.length?rel.slice(0,10).map(x=>'<div class="intel-row"><span class="intel-tag scenario">MENTION / POSSIBLE INTEGRATION</span><strong style="display:block;margin:7px 0">'+E(x.provider)+' → '+E(x.other)+'</strong><span class="intel-sub">'+E(x.incident)+' · '+D(x.at)+'</span><a class="intel-link" href="'+U(x.url)+'" target="_blank" rel="noopener">Πηγή ↗</a></div>').join(''):'<div class="intel-empty">Καμία ρητή αναφορά άλλου παρόχου στο διαθέσιμο δείγμα. Δεν επινοούνται σχέσεις.</div>';
}
function machine(){
 const e=events.find(v=>v.id===eventId)||events[0];step=Math.min(e.steps.length-1,Math.max(0,step));
 $('machineOutput').innerHTML='<div class="intel-row"><div class="intel-glance"><span class="intel-tag observed">DOCUMENTED</span><span>Βήμα '+(step+1)+' / '+e.steps.length+'</span></div><div class="intel-timeline"><button type="button" id="machinePrev" '+(step===0?'disabled':'')+'>Προηγούμενο</button><button type="button" id="machineNext" '+(step===e.steps.length-1?'disabled':'')+'>Επόμενο</button></div><input type="range" class="intel-track" id="machineSlider" min="0" max="'+(e.steps.length-1)+'" value="'+step+'" aria-label="Χρονικό σημείο"><div class="intel-step" style="margin:15px 0"><b>'+E(e.steps[step][0])+'</b><p>'+E(e.steps[step][1])+'</p></div><div class="intel-tiles">'+e.steps.map((v,j)=>'<div class="intel-stat"><b style="font-size:12px">'+E(v[0])+'</b><span>'+(step===j?'ΕΠΙΛΕΓΜΕΝΟ':'Βήμα '+(j+1))+'</span></div>').join('')+'</div><div class="intel-insight">Πηγή: <a href="'+U(e.url)+'" target="_blank" rel="noopener">'+E(e.source)+' ↗</a>. Δεν αποτυπώνεται μη δημοσιευμένη τηλεμετρία.</div></div>';
 $('machinePrev').addEventListener('click',()=>{step--;machine()});
 $('machineNext').addEventListener('click',()=>{step++;machine()});
 $('machineSlider').addEventListener('input',ev=>{step=Number(ev.target.value);machine()});
}
$('machineSelect').innerHTML=events.map(e=>'<option value="'+E(e.id)+'">'+E(e.title)+'</option>').join('');
$('machineSelect').addEventListener('change',ev=>{eventId=ev.target.value;step=0;machine()});
function table(arr){
 const a=Array.isArray(arr)?arr.filter(x=>Number.isFinite(Number(x.value))).slice(-8):[];
 return a.length?'<table class="intel-table"><thead><tr><th>ΠΕΡΙΟΔΟΣ</th><th>ΤΙΜΗ</th></tr></thead><tbody>'+a.map(x=>'<tr><td>'+E(x.at)+'</td><td>'+F(Number(x.value),2)+' TWh</td></tr>').join('')+'</tbody></table>':'<div class="intel-empty">Δεν διατίθεται ιστορική σειρά.</div>';
}
async function country(){
 const token=++countryRequest,cc=$('countrySelectIntel').value;
 $('countryOutput').innerHTML='<div class="intel-empty">Ανάκτηση τεκμηριωμένων δεδομένων για '+E(names[cc])+'…</div>';
 const r=await Promise.allSettled([cc==='us'?Promise.resolve(null):GET('/api/energy?country='+cc),catalog?Promise.resolve(catalog):GET('/api/global-catalog'),pulse?Promise.resolve(pulse):GET('/api/pulse')]);
 if(token!==countryRequest)return;
 const live=r[0].status==='fulfilled'?r[0].value:null;
 const cat=r[1].status==='fulfilled'?r[1].value:null;
 const p=r[2].status==='fulfilled'?r[2].value:null;
 if(cat&&cat.ok)catalog=cat;if(p)pulse=p;
 const record=cat&&Array.isArray(cat.countries)?cat.countries.find(x=>x.iso3===iso[cc]):null;
 let hist=null;
 if(record){try{hist=await GET('/api/grid-history?kind=country&id='+encodeURIComponent(record.id))}catch{}}
 if(token!==countryRequest)return;
 const livePower=live&&live.power&&live.power.ok&&live.power.latest?live.power:null;
 const fuel=livePower?Object.entries(livePower.latest).map(([id,v])=>({label:(livePower.series||[]).find(x=>x.id===id)?.name||id,v:Number(v)})).filter(x=>Number.isFinite(x.v)&&x.v>0&&!/load|total|forecast|cross border|import|export/i.test(x.label)).sort((a,b)=>b.v-a.v):[];
 const amount=fuel.length?fuel.reduce((sum,x)=>sum+x.v,0):null;
 const mix=p&&Array.isArray(p.mix)?p.mix.find(x=>x.code===cc):null;
 const ann=hist&&hist.ok?hist.annual||{}:{};
 const demand=ann.demand&&ann.demand.length?ann.demand.at(-1):null;
 let cards='<div class="intel-statline"><div class="intel-stat"><b>'+F(amount)+' MW</b><span>Δημοσιευμένη παραγωγή '+(livePower?'('+D(livePower.at)+')':'· όχι live feed')+'</span></div><div class="intel-stat"><b>'+(mix?F(mix.ibrShare,1)+'%':'—')+'</b><span>Ηλιακά + αιολικά, όχι δείκτης κινδύνου</span></div><div class="intel-stat"><b>'+(demand?F(Number(demand.value),2):'—')+'</b><span>Ετήσια ζήτηση σε TWh'+(demand?' · '+E(demand.at):'')+'</span></div></div>';
 const fuels=fuel.length?fuel.slice(0,9).map(x=>'<div class="intel-metric"><span>'+E(x.label)+'</span><span></span><b>'+F(x.v)+' MW</b></div>').join(''):'<div class="intel-empty">Δεν διατίθεται ελεγμένη live παραγωγή για αυτή τη χώρα.</div>';
 const interchange=mix&&Number.isFinite(mix.crossBorderMw)?'<div class="intel-row"><strong>Καθαρό διασυνοριακό ισοζύγιο</strong><b class="intel-mono" style="display:block;margin-top:8px">'+F(mix.crossBorderMw)+' MW</b><span class="intel-sub">Πρόσημο κατά την πηγή, όχι χωριστές εισαγωγές / εξαγωγές.</span></div>':'<div class="intel-row"><strong>Εισαγωγές / εξαγωγές</strong><span class="intel-sub">Μη διαθέσιμη επαληθευμένη τρέχουσα χωριστή σειρά.</span></div>';
 const reserve=cc==='us'&&p&&p.ercot?'<div class="intel-row"><strong>Μόνο Τέξας / ERCOT · άμεση εφεδρεία PRC</strong><b class="intel-mono" style="display:block;margin-top:8px">'+F(p.ercot.prcMw)+' MW</b><span class="intel-sub">Όχι εθνική εφεδρεία ΗΠΑ · '+D(p.ercot.at)+'</span></div>':'<div class="intel-row"><strong>Εθνικό περιθώριο εφεδρείας</strong><span class="intel-sub">Δεν δημοσιεύεται ομοιόμορφη live τιμή από τα συνδεδεμένα feeds.</span></div>';
 cards+='<div class="intel-flex" style="margin-top:14px"><div class="intel-row"><h3>Παραγωγή ανά πηγή</h3>'+fuels+'<span class="intel-sub">Energy-Charts · '+D(livePower&&livePower.at)+'</span></div><div class="intel-rows">'+interchange+reserve+'</div></div>';
 cards+='<div class="intel-flex" style="margin-top:14px"><div class="intel-row"><h3>Ετήσια παραγωγή</h3>'+table(ann.generation)+'</div><div class="intel-row"><h3>Ετήσια ζήτηση</h3>'+table(ann.demand)+'</div></div><p class="intel-footnote">Ετήσια δεδομένα Ember / World Power Monitor, όχι live. ΗΠΑ: χωρίς πανεθνική live συχνότητα και χωρίς ενιαίο σύστημα μεταφοράς. <a href="https://ember-energy.org/data/" target="_blank" rel="noopener">Ember</a> · <a href="https://www.energy-charts.info/" target="_blank" rel="noopener">Energy-Charts</a>.</p>';
 $('countryOutput').innerHTML=cards;
}
$('countrySelectIntel').addEventListener('change',country);
async function refresh(){
 const r=await Promise.allSettled([GET('/api/outages'),GET('/api/pulse'),GET('/api/early-signals')]);
 if(r[0].status==='fulfilled')out=r[0].value;
 if(r[1].status==='fulfilled')pulse=r[1].value;
 if(r[2].status==='fulfilled')early=r[2].value;
 cascade();domino();renderEarly();
}
machine();country();refresh();setInterval(()=>{if(!document.hidden)refresh()},90000);
})();
