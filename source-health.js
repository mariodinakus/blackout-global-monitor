(() => {
'use strict';
const mount=document.getElementById('source-health');if(!mount)return;
const feeds=[
 {name:'Grid pressure',path:'/api/pulse',test:d=>Array.isArray(d.systems)&&d.systems.length>0,detail:d=>d.systems?.length+' systems'},
 {name:'Power generation',path:'/api/energy?country=de',test:d=>!!d.power?.ok&&!!d.power?.at,detail:d=>d.power?.at?'Measured '+new Date(d.power.at).toLocaleString('el-GR'):'No recent power data'},
 {name:'Internet & cloud',path:'/api/outages',test:d=>Array.isArray(d.providers)&&!!d.internet,detail:d=>(d.providers?.length||0)+' cloud providers'},
 {name:'Cyber intelligence',path:'/api/outages',test:d=>!!d.cyber?.kev,detail:d=>d.cyber?.kev?'CISA KEV feed available':'CISA feed unavailable'},
 {name:'Early signals',path:'/api/early-signals',test:d=>!!d&&!d.error,detail:d=>d?.fetchedAt?'Updated '+new Date(d.fetchedAt).toLocaleTimeString('el-GR'):'Response received'}
];
const css=document.createElement('style');css.textContent='.health{margin:28px 0;padding:20px;border:1px solid #34465c;border-radius:16px;background:#111b2a;color:#e7eef8}.health h2{margin:4px 0 8px;font-size:1.3rem}.health p{color:#a9b9cb;font-size:.85rem}.health-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:9px}.health-item{background:#19283b;border:1px solid #34465c;border-radius:12px;padding:12px}.health-item b{display:block;margin-bottom:7px}.health-item small{color:#a9b9cb}.health-ok{color:#70dfb0}.health-warn{color:#f4ca72}.health-bad{color:#f6a1a1}.health button{background:#273d58;color:white;border:1px solid #4b6580;border-radius:9px;padding:8px 12px;cursor:pointer}';document.head.appendChild(css);
mount.innerHTML='<section class="health"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><div class="eyebrow">SOURCE HEALTH / LIVE CHECK</div><h2>Ποιες πηγές απαντούν;</h2></div><button type="button" id="healthRefresh">Έλεγχος τώρα</button></div><p>Ελέγχουμε τις δικές μας διαδρομές API. Επιτυχής απόκριση δεν εγγυάται ότι τα δεδομένα της αρχικής πηγής είναι πρόσφατα. Οι αποτυχίες δεν σημαίνουν blackout.</p><div class="health-grid" id="healthGrid"></div><p id="healthTime">—</p></section>';
const grid=document.getElementById('healthGrid');
async function check(){
grid.innerHTML=feeds.map(f=>'<div class="health-item"><b>'+f.name+'</b><small>Έλεγχος…</small></div>').join('');
const results=await Promise.all(feeds.map(async f=>{const started=Date.now();try{const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),11500);let response;try{response=await fetch(f.path,{cache:'no-store',signal:ctrl.signal})}finally{clearTimeout(timeout)}if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();const ok=f.test(data);return {f,ok,ms:Date.now()-started,description:f.detail(data)}}catch(e){return{f,ok:false,ms:Date.now()-started,description:String(e.message).slice(0,90)}}}));
grid.innerHTML=results.map(x=>'<div class="health-item"><b>'+x.f.name+'</b><span class="'+(x.ok?'health-ok':'health-warn')+'">'+(x.ok?'● Διαθέσιμη':'● Μη επαληθευμένη')+'</span><br><small>'+x.ms+' ms · '+String(x.description).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))+'</small></div>').join('');
document.getElementById('healthTime').textContent='Τελευταίος έλεγχος: '+new Date().toLocaleString('el-GR')+' · '+results.filter(x=>x.ok).length+'/'+results.length+' διαδρομές επαληθευμένες';
}
document.getElementById('healthRefresh').addEventListener('click',check);check();setInterval(()=>{if(!document.hidden)check()},300000);
})();
