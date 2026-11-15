(() => {
'use strict';
const root=document.getElementById('nerve-center');if(!root)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=u=>{try{const x=new URL(u);return x.protocol==='https:'?esc(x.href):'#'}catch{return '#'}};
const css=document.createElement('style');css.textContent=`
.nerve{margin:28px 0;padding:22px;background:#111b2a;color:#e7eef8;border:1px solid #34465c;border-radius:17px}
.nerve h2{font-size:1.4rem;margin:6px 0}.nerve p{font-size:.88rem;color:#aebfd1;line-height:1.55}
.nerve-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px;margin:16px 0}
.nerve-tile{background:#1b2a3e;border:1px solid #33475e;border-radius:12px;padding:12px}
.nerve-tile strong{display:block;font-size:1.5rem}.nerve-tile small{color:#aebfd1}
.nerve-tabs{display:flex;gap:7px;overflow-x:auto;margin:16px 0}.nerve-tabs button,.nerve-refresh{background:#263a54;color:#e7eef8;border:1px solid #435a74;border-radius:9px;padding:9px 12px;cursor:pointer;white-space:nowrap}
.nerve-tabs button[aria-selected=true]{background:#375b80;border-color:#8ac5fb}
.nerve-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:9px;max-height:470px;overflow:auto}
.nerve-entry{background:#19293b;border:1px solid #32455a;border-radius:12px;padding:12px;overflow-wrap:anywhere}
.nerve-entry b{display:block}.nerve-entry small{color:#a8bad0}.nerve-entry a{color:#9acdfd}
.nerve-warn{color:#ffd18a}.nerve-alert{color:#ff9999}.nerve-ok{color:#79dfae}
`;document.head.appendChild(css);
root.innerHTML='<section class="nerve"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div><div class="eyebrow">GLOBAL NERVE CENTER / VERIFIED SIGNALS</div><h2>Παγκόσμια εικόνα υποδομών</h2></div><button class="nerve-refresh" id="nerveRefresh">Ανανέωση</button></div><p>Ενέργεια, Internet, cloud και κυβερνοασφάλεια στην ίδια οθόνη. Οι ειδήσεις είναι αναφορές, όχι επιβεβαιωμένες επιθέσεις. Άγνωστο ≠ κανονική λειτουργία.</p><div id="nerveSummary" class="nerve-summary"></div><div id="nerveTabs" class="nerve-tabs" role="tablist"><button data-tab="net" role="tab" aria-selected="true">Internet</button><button data-tab="cloud" role="tab">Cloud</button><button data-tab="cyber" role="tab">Cyber / CISA</button><button data-tab="reports" role="tab">Αναφορές</button></div><div id="nerveList" class="nerve-list">Φόρτωση…</div><p id="nerveFoot"></p></section>';
let state=null,tab='net';
const item=(title,body,link,url)=>'<article class="nerve-entry"><b>'+esc(title)+'</b><p>'+body+'</p>'+(url?'<a href="'+safe(url)+'" target="_blank" rel="noopener noreferrer">'+esc(link||'Πηγή')+'</a>':'')+'</article>';
function render(){
const sum=document.getElementById('nerveSummary'),list=document.getElementById('nerveList'),foot=document.getElementById('nerveFoot');
if(!state){sum.innerHTML='';list.textContent='Αδυναμία φόρτωσης δεδομένων. Δοκίμασε ξανά.';return}
const {out,pulse}=state,net=out?.internet?.countries||[],providers=out?.providers||[],cy=out?.cyber||{},systems=pulse?.systems||[];
const stats=[['Grid systems',systems.length,'Μόνο διαθέσιμα στοιχεία'],['Internet events',net.length,'Αναφορές IODA 24h'],['Cloud incidents',providers.filter(x=>['major','critical','minor'].includes(x.indicator)).length,'Επίσημες καταστάσεις'],['CISA KEV 14d',cy.kev?.added14d??'—','Εκμεταλλευόμενες ευπάθειες']];
sum.innerHTML=stats.map(([n,v,d])=>'<div class="nerve-tile"><strong>'+esc(v)+'</strong>'+esc(n)+'<br><small>'+esc(d)+'</small></div>').join('');
document.querySelectorAll('#nerveTabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)));
let html='';
if(tab==='net')html=net.map(x=>item(x.country||x.code,'<span class="'+(x.ongoing?'nerve-alert':'nerve-warn')+'">'+(x.ongoing?'Ενδεχομένως ενεργό':'Συμβάν τελευταίου 24ώρου')+'</span><br><small>Αισθητήρες: '+esc((x.sensors||[]).join(', '))+' · '+esc(x.startedAt||'')+'</small>','IODA','https://ioda.inetintel.cc.gatech.edu/')).join('');
if(tab==='cloud')html=providers.map(x=>item(x.name,'<span class="'+(x.ok===false||x.indicator==='unknown'?'nerve-warn':x.indicator==='none'?'nerve-ok':'nerve-alert')+'">'+esc(x.ok===false?'Πηγή μη διαθέσιμη':x.indicator||'unknown')+'</span><br><small>'+esc(x.description||'')+'</small>'+(x.incidents||[]).slice(0,2).map(y=>'<p>'+esc(y.name)+'</p>').join(''),'Επίσημο status',x.url)).join('');
if(tab==='cyber'){const k=cy.kev;html=(k?.items||[]).map(x=>item(x.cve,'<small>'+esc(x.vendor)+' · '+esc(x.product)+' · '+esc(x.added)+'</small><p>'+esc(x.name)+'</p>'+(x.ransomware?'<span class="nerve-alert">CISA: known ransomware use</span>':''),'CISA KEV','https://www.cisa.gov/known-exploited-vulnerabilities-catalog')).join('');html+=(cy.news||[]).slice(0,8).map(x=>item('Αναφορά · '+x.title,'<small>'+esc(x.domain||'')+' · '+esc(x.at||'')+'</small>','Άρθρο',x.url)).join('')}
if(tab==='reports')html=(out?.news||[]).map(x=>item(x.title,'<small>'+esc(x.domain||'')+' · '+esc(x.at||'')+'</small>','Άρθρο',x.url)).join('');
list.innerHTML=html||'<p>Δεν υπάρχουν διαθέσιμα δεδομένα από αυτή την πηγή. Αυτό δεν αποδεικνύει ότι δεν υπάρχουν περιστατικά.</p>';
foot.textContent='Λήψη: '+(out?.fetchedAt?new Date(out.fetchedAt).toLocaleString('el-GR'):'άγνωστη')+' · Ανανέωση κάθε 5 λεπτά όσο η σελίδα είναι ενεργή.';
}
async function refresh(){document.getElementById('nerveFoot').textContent='Ανανέωση…';const get=async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()};const [a,b]=await Promise.allSettled([get('/api/outages'),get('/api/pulse')]);state={out:a.status==='fulfilled'?a.value:null,pulse:b.status==='fulfilled'?b.value:null};render()}
document.getElementById('nerveRefresh').addEventListener('click',refresh);document.getElementById('nerveTabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b){tab=b.dataset.tab;render()}});refresh();setInterval(()=>{if(!document.hidden)refresh()},300000);
})();
