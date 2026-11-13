(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const time = v => v && Number.isFinite(Date.parse(v)) ? new Date(v).toLocaleString('el-GR',{timeZone:'Europe/Athens',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'}) : 'άγνωστη';
  const age = v => { const m=(Date.now()-Date.parse(v))/60000; return Number.isFinite(m) && m>=0 ? (m<1?'μόλις τώρα':m<60?`${Math.floor(m)} λεπτά πριν`:`${Math.floor(m/60)} ώρες πριν`) : 'άγνωστη'; };
  const fmt = n => Number(n).toLocaleString('el-GR');
  const REGION = {europe:['GR','GB','DE','FR','ES','PT','IT','NL','BE','PL','AT','CH','CZ','SK','HU','RO','BG','HR','SI','RS','DK','SE','NO','FI','IE','TR','UA','XK','GI','AX'],americas:['US','CA','MX','BR','AR','CL','CO','PE','VE','EC','BO','PY','UY','GY','SR','GF','CR','PA','HN','GT','NI','SV','BZ','CU','DO','HT','JM','PR'],asia:['CN','IN','JP','KR','KP','TW','SG','ID','MY','TH','VN','PH','PK','BD','NP','LK','IR','IQ','IL','SA','AE','QA','BH','TJ'],africa:['ZA','NG','EG','KE','ET','DZ','MA','TN','GH','CI','CM','CD','CG','AO','SD','TZ','UG','GQ','SC','BJ'],oceania:['AU','NZ','FJ','PG','NC','CK','NF','WS','SB']};
  let region='world', latest=null, lastKey='', saving=false;
  const card=(label,value,detail,link,kind='neutral')=>`<article class="r-card r-${kind}"><div class="r-label">${esc(label)}</div><div class="r-value">${esc(value)}</div><div class="r-detail">${detail}</div>${link?`<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">Πηγή ↗</a>`:''}</article>`;
  function appendEvent(text) {
    try {const h=JSON.parse(localStorage.getItem('blackout.radar.events.v1')||'[]'); h.unshift({at:new Date().toISOString(),text});localStorage.setItem('blackout.radar.events.v1',JSON.stringify(h.slice(0,40)));} catch {}
  }
  function timeline() {try {const h=JSON.parse(localStorage.getItem('blackout.radar.events.v1')||'[]');$('radarTimeline').innerHTML=h.length?h.slice(0,6).map(e=>`<div class="r-event"><b>${esc(time(e.at))}</b><span>${esc(e.text)}</span></div>`).join(''):'Η καταγραφή ξεκινά τώρα.';} catch {$('radarTimeline').textContent='Η τοπική καταγραφή δεν είναι διαθέσιμη.';}}
  function render() {
    if(!latest)return;
    const {pulse:p,out:o,failed}=latest, systems=p?.systems||[], ce=systems.find(s=>s.id==='ce'), gb=systems.find(s=>s.id==='gb'), tx=systems.find(s=>s.id==='tx'), gr=(p?.mix||[]).find(m=>m.code==='gr');
    const nets=(o?.internet?.countries||[]).filter(c=>c.ongoing && (region==='world'||(REGION[region]||[]).includes(c.code)));
    const cards=[];
    if (region==='world') { let trend='Απαιτείται περισσότερη τοπική καταγραφή.'; try { const h=JSON.parse(localStorage.getItem('blackout.pulse.history.v1')||'[]'); const prev=h.filter(x=>Date.parse(x[0])<=Date.now()-50*60000).at(-1); if(prev && p?.headline?.score!=null){const diff=p.headline.score-prev[1];trend=`Μεταβολή σε περίπου 1 ώρα: ${diff>0?'+':''}${diff} μονάδες. Το ιστορικό χτίζεται όσο η σελίδα είναι ανοιχτή.`;} } catch {} cards.push(card('ΤΑΣΗ ΔΕΙΚΤΗ',p?.headline?.score==null?'Άγνωστο':`${p.headline.score}/100`,esc(trend),null,p?.headline?.score==null?'unknown':'live')); }
    if(region==='world'||region==='europe'){
      cards.push(card('ΗΠΕΙΡΩΤΙΚΗ ΕΥΡΩΠΗ',ce?.score!=null?`${ce.score}/100`:'Άγνωστο',ce?.score!=null?`Συχνότητα ${esc(p.frequency?.ce?.latestHz ?? '—')} Hz · μέτρηση ${esc(age(ce.at))}`:'Δεν υπάρχει πρόσφατη μέτρηση · όχι ένδειξη ασφάλειας',ce?.sourceUrl,ce?.score!=null?'live':'unknown'));
      cards.push(card('ΜΕΓΑΛΗ ΒΡΕΤΑΝΙΑ',gb?.score!=null?`${gb.score}/100`:'Άγνωστο',gb?`Δείκτης δικτύου · μέτρηση ${esc(age(gb.at))}`:'Χωρίς πρόσφατη μέτρηση', 'https://bmrs.elexon.co.uk/',gb?'live':'unknown'));
      cards.push(card('ΕΛΛΑΔΑ · ΠΑΡΑΓΩΓΗ',gr?`${gr.ibrShare}%`:'Άγνωστο',gr?`Ήλιος + άνεμος · μέτρηση ${esc(age(gr.at))}. Δεν μετρά κίνδυνο.`:'Χωρίς διαθέσιμο μίγμα παραγωγής','https://www.energy-charts.info/',gr?'live':'unknown'));
    }
    if(region==='world'||region==='americas'){
      cards.push(card('ΤΕΞΑΣ · ERCOT',tx?.score!=null?`${fmt(p.ercot.prcMw)} MW`:'Άγνωστο',tx?`PRC · μέτρηση ${esc(age(tx.at))}. Όρια EEA εξαρτώνται και από επιχειρησιακές συνθήκες.`:'Δεν υπάρχει πρόσφατη μέτρηση εφεδρείας','https://www.ercot.com/gridmktinfo/dashboards/gridconditions',tx?'live':'unknown'));
      cards.push(card('ΚΑΛΙΦΟΡΝΙΑ · CAISO','Δείτε την πηγή','Ο διαχειριστής δημοσιεύει ζήτηση και παραγωγή. Η αυτόματη λήψη δεν έχει επιβεβαιωθεί.','https://www.caiso.com/todays-outlook','unknown'));
    }
    if(['asia','africa','oceania'].includes(region)) cards.push(card('ΔΕΔΟΜΕΝΑ ΡΕΥΜΑΤΟΣ','Άγνωστο','Δεν υπάρχει επιβεβαιωμένη πρόσφατη μέτρηση δικτύου για αυτή την περιοχή.',null,'unknown'));
    cards.push(card('INTERNET · IODA',o?.internet?.ongoing==null?'Άγνωστο':`${nets.length} σήματα`,o?.internet?.ongoing==null?'Η πηγή δεν απάντησε.':'Χώρες με πρόσφατο σήμα αισθητήρα · δεν επιβεβαιώνεται γενική διακοπή ή αιτία ρεύματος.','https://ioda.inetintel.cc.gatech.edu/',o?.internet?.ongoing==null?'unknown':'neutral'));
    const active=(o?.providers||[]).filter(x=>x.ok && ['major','critical','minor'].includes(x.indicator));
    cards.push(card('ΨΗΦΙΑΚΕΣ ΥΠΗΡΕΣΙΕΣ',o?`${active.length} πάροχοι`:'Άγνωστο',o?'Με ενεργή υποβάθμιση ή συμβάν στις επίσημες σελίδες. Παγκόσμια εικόνα· η περιοχή συχνά δεν προσδιορίζεται.':'Η ροή δεν απάντησε',null,o?'neutral':'unknown'));
    $('radarGrid').innerHTML=cards.join('');
    const majors=(o?.providers||[]).filter(x=>x.ok && (['major','critical'].includes(x.indicator)||x.incidents?.length));
    $('majorIncidents').innerHTML=majors.length?majors.slice(0,8).map(x=>`<div class="r-event"><b>${esc(x.name)}</b><span>${esc(x.description||'Αναφορά παρόχου')} ${(x.incidents||[]).slice(0,2).map(i=>`<br>${esc(i.name)} · ${esc(i.status||'κατάσταση άγνωστη')} · ενημέρωση ${esc(time(i.at))}`).join('')}<br><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">Επίσημη πηγή ↗</a></span></div>`).join(''):o?'<div class="empty">Δεν εντοπίστηκαν περιστατικά στις πηγές που απάντησαν. Οι μη διαθέσιμες πηγές παραμένουν άγνωστες.</div>':'<div class="empty">Η ροή δεν απάντησε.</div>';
    $('radarFresh').textContent=`Τελευταίος επιτυχής έλεγχος: δίκτυα ${p?time(p.fetchedAt):'άγνωστος'} · υπηρεσίες ${o?time(o.fetchedAt):'άγνωστος'}. Οι πηγές ανανεώνονται σε διαφορετικούς χρόνους.${failed?' Κάποια ροή δεν απάντησε.':''} Ιστορικό και ειδοποιήσεις λειτουργούν μόνο σε αυτή τη συσκευή με ανοιχτή τη σελίδα.`;
    const nowKey=active.map(x=>`${x.name}:${x.indicator}`).sort().join('|');
    if(lastKey && nowKey!==lastKey && o){appendEvent(`Αλλαγή στα status παρόχων: ${active.length} με δηλωμένο περιστατικό.`);if('Notification' in window && Notification.permission==='granted' && active.some(x=>['major','critical'].includes(x.indicator)))new Notification('BLACKOUT · περιστατικό υπηρεσίας',{body:'Ένας πάροχος αναφέρει σοβαρό περιστατικό. Άνοιξε το ραντάρ για λεπτομέρειες.'});}
    if(o)lastKey=nowKey||'none';
    timeline();
  }
  async function get(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error(r.status);return r.json();}
  async function refresh(){if(saving)return;saving=true;const r=await Promise.allSettled([get('/api/pulse'),get('/api/outages')]);latest={pulse:r[0].status==='fulfilled'?r[0].value:null,out:r[1].status==='fulfilled'?r[1].value:null,failed:r.some(x=>x.status==='rejected')};render();saving=false;}
  $('regionFilter').addEventListener('click',e=>{const b=e.target.closest('[data-region]');if(!b)return;region=b.dataset.region;document.querySelectorAll('#regionFilter button').forEach(x=>x.classList.toggle('on',x===b));if(region!=='world')document.querySelector(`#mapViews [data-v="${region}"]`)?.click();render();});
  $('enableAlerts').addEventListener('click',async()=>{if(!('Notification' in window)){$('enableAlerts').textContent='Οι ειδοποιήσεις δεν υποστηρίζονται';return;}const permission=await Notification.requestPermission();$('enableAlerts').textContent=permission==='granted'?'Ειδοποιήσεις ενεργές στη σελίδα':'Οι ειδοποιήσεις δεν ενεργοποιήθηκαν';});
  if('Notification' in window && Notification.permission==='granted')$('enableAlerts').textContent='Ειδοποιήσεις ενεργές στη σελίδα';
  refresh();setInterval(()=>{if(!document.hidden)refresh()},60000);
})();
