(() => {
'use strict';
const root=document.getElementById('coverage-root'); if(!root)return;
const countries={gr:'Ελλάδα',de:'Γερμανία',fr:'Γαλλία',it:'Ιταλία',es:'Ισπανία',pt:'Πορτογαλία',nl:'Ολλανδία',be:'Βέλγιο',at:'Αυστρία',pl:'Πολωνία',cz:'Τσεχία',ro:'Ρουμανία',bg:'Βουλγαρία',hu:'Ουγγαρία',hr:'Κροατία',si:'Σλοβενία',sk:'Σλοβακία',se:'Σουηδία',no:'Νορβηγία',fi:'Φινλανδία',dk:'Δανία',ie:'Ιρλανδία',gb:'Ηνωμένο Βασίλειο',ch:'Ελβετία'};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=document.createElement('style');css.textContent=`
.coverage{margin:28px 0;padding:22px;border:1px solid #34465c;border-radius:18px;background:#111b2a;color:#e4ebf4}
.coverage h2{font-size:1.35rem;margin:6px 0}.coverage p{color:#aab9cc;margin:8px 0 16px;font-size:.9rem}
.coverage-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.coverage-stats{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
.coverage-stat{background:#1d2b3d;border:1px solid #304157;border-radius:12px;padding:10px 14px;font-size:.85rem}
.coverage-stat strong{font-size:1.15rem;display:block;color:#f5f8fc}
.coverage-controls{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
.coverage input,.coverage select{min-width:0;max-width:100%;border-radius:9px;background:#172436;color:#fff;border:1px solid #45556c;padding:10px}
.coverage-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:7px;max-height:250px;overflow:auto}
.coverage-country{border:1px solid #34465c;background:#172538;color:#e4ebf4;text-align:left;border-radius:9px;padding:10px;cursor:pointer}
.coverage-country:hover,.coverage-country[aria-pressed=true]{border-color:#77b6f5;background:#243750}
.coverage-country small{display:block;color:#a8b8cd;margin-top:4px}
.coverage-detail{margin-top:14px;padding:15px;border:1px solid #34465c;border-radius:12px;min-height:80px;overflow-wrap:anywhere}
.coverage-detail a{color:#9bcfff}
`;document.head.appendChild(css);
root.innerHTML='<section class="coverage"><div class="coverage-head"><div><div class="eyebrow">GLOBAL COVERAGE / SOURCE QUALITY</div><h2>Περισσότερες χώρες · χωρίς ψεύτικο live</h2></div><span id="coverageUpdated" class="muted">—</span></div><p>Διαθέσιμες χώρες για αίτημα παραγωγής ηλεκτρισμού. Η πραγματική διαθεσιμότητα και η ηλικία των μετρήσεων ελέγχονται ξεχωριστά για κάθε χώρα. Τα Internet outages δεν είναι ηλεκτρικές διακοπές.</p><div class="coverage-stats"><div class="coverage-stat"><strong>24</strong>υποστηριζόμενοι κωδικοί χωρών</div><div class="coverage-stat"><strong id="coverageVerified">0</strong>επαληθευμένες σε αυτή τη συνεδρία</div><div class="coverage-stat"><strong id="coverageOutages">—</strong>χώρες με αναφερόμενα Internet events</div></div><div class="coverage-controls"><input id="coverageSearch" placeholder="Αναζήτηση χώρας…" aria-label="Αναζήτηση χώρας"><select id="coverageFilter" aria-label="Φίλτρο"><option value="all">Όλες</option><option value="checked">Ελεγμένες</option><option value="unchecked">Μη ελεγμένες</option></select></div><div id="coverageList" class="coverage-list"></div><div id="coverageDetail" class="coverage-detail">Επίλεξε χώρα για να ελέγξουμε τα τελευταία διαθέσιμα δεδομένα.</div></section>';
const checked=new Map(),list=document.getElementById('coverageList'),detail=document.getElementById('coverageDetail');
function render(){
 const q=document.getElementById('coverageSearch').value.toLocaleLowerCase('el'),filter=document.getElementById('coverageFilter').value;
 list.innerHTML=Object.entries(countries).filter(([cc,n])=>(cc.includes(q)||n.toLocaleLowerCase('el').includes(q))&&(filter==='all'||(filter==='checked'?checked.has(cc):!checked.has(cc)))).map(([cc,n])=>'<button class="coverage-country" data-cc="'+cc+'" type="button"><b>'+esc(n)+'</b><small>'+ (checked.has(cc)?esc(checked.get(cc).label):'Δεν ελέγχθηκε ακόμη')+'</small></button>').join('')||'<p>Δεν βρέθηκαν χώρες.</p>';
 document.getElementById('coverageVerified').textContent=[...checked.values()].filter(x=>x.valid).length;
}
async function select(cc){
 detail.textContent='Έλεγχος '+countries[cc]+'…';
 try{
 const r=await fetch('/api/energy?country='+encodeURIComponent(cc),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);
 const data=await r.json();const p=data.power;const at=p?.at?Date.parse(p.at):NaN;const age=Number.isFinite(at)?Math.max(0,Math.round((Date.now()-at)/60000)):null;
 const valid=!!p?.ok&&!!p?.latest&&age!==null&&age<=1440;
 const label=valid?(age<=60?'Πρόσφατη μέτρηση':'Μέτρηση '+Math.round(age/60)+' ωρών'):'Μη διαθέσιμο';
 checked.set(cc,{valid,label});render();
 const source=p?.source||'https://www.energy-charts.info/';
 const items=valid?Object.entries(p.latest).filter(([,v])=>typeof v==='number'&&Number.isFinite(v)).slice(0,12):[];
 detail.innerHTML='<b>'+esc(countries[cc])+'</b> · '+esc(label)+'<p>'+(valid?'Δημοσιευμένη παραγωγή ηλεκτρικής ενέργειας · '+esc(new Date(at).toLocaleString('el-GR')):'Δεν επιβεβαιώθηκαν πρόσφατες μετρήσεις παραγωγής. Δεν συμπεραίνουμε διακοπή ρεύματος.')+'</p>'+(items.length?'<div>'+items.map(([k,v])=>'<span class="coverage-stat" style="display:inline-block;margin:3px">'+esc(k)+': '+esc(Math.round(v).toLocaleString('el-GR'))+' MW</span>').join('')+'</div>':'')+'<p><a href="'+esc(source)+'" target="_blank" rel="noopener noreferrer">Πηγή: Energy-Charts</a> · Παραγωγή ≠ διαθέσιμη εφεδρεία ή πιθανότητα blackout.</p>';
 }catch(e){checked.set(cc,{valid:false,label:'Σφάλμα σύνδεσης'});render();detail.textContent='Αδυναμία λήψης δεδομένων: '+String(e.message).slice(0,80);}
}
list.addEventListener('click',e=>{const b=e.target.closest('button[data-cc]');if(b)select(b.dataset.cc)});
document.getElementById('coverageSearch').addEventListener('input',render);
document.getElementById('coverageFilter').addEventListener('change',render);
async function outages(){try{const r=await fetch('/api/outages');if(!r.ok)return;const d=await r.json();const c=d?.internet?.countries;document.getElementById('coverageOutages').textContent=Array.isArray(c)?new Set(c.map(x=>x.code)).size:'—';document.getElementById('coverageUpdated').textContent='Outages: '+(d.fetchedAt?new Date(d.fetchedAt).toLocaleTimeString('el-GR'):'άγνωστη ώρα')}catch{}}
render();outages();
})();
