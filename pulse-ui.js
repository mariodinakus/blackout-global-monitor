(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const TONES = { calm: 'var(--calm)', watch: 'var(--watch)', stress: 'var(--stress)', severe: 'var(--severe)', edge: 'var(--edge)', unknown: 'var(--unknown)' };
  const toneOf = s => s === null || s === undefined ? 'unknown' : s < 20 ? 'calm' : s < 40 ? 'watch' : s < 60 ? 'stress' : s < 80 ? 'severe' : 'edge';
  const fmt = (n, d = 0) => n === null || n === undefined ? '—' : Number(n).toLocaleString('el-GR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const tAth = iso => iso ? new Date(iso).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Athens' }) : '—';
  const ago = iso => { if (!iso) return '—'; const s = Math.round((Date.now() - Date.parse(iso)) / 1000); return s < 90 ? s + 'δ πριν' : s < 5400 ? Math.round(s / 60) + 'λ πριν' : Math.round(s / 3600) + 'ω πριν'; };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const REFRESH = 60;
  let countdown = REFRESH, timer = null, busy = false;

  /* ---------- gauge ---------- */
  function gauge(score) {
    const cx = 160, cy = 160, r = 128, w = 20;
    const pt = (v, rr = r) => { const a = Math.PI * (1 - v / 100); return [cx + rr * Math.cos(a), cy - rr * Math.sin(a)]; };
    const arc = (a, b, color, width = w) => { const [x1, y1] = pt(a), [x2, y2] = pt(b); return `<path d="M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="butt"/>`; };
    let s = arc(0, 100, 'var(--track)');
    [[0, 20, 'calm'], [20, 40, 'watch'], [40, 60, 'stress'], [60, 80, 'severe'], [80, 100, 'edge']].forEach(([a, b, t]) => { s += arc(a + .4, b - .4, TONES[t], 4).replace(`A${r} ${r}`, `A${r} ${r}`).replace(/stroke-width="4"/, 'stroke-width="4" opacity=".55"'); });
    if (score !== null && score !== undefined) {
      s += arc(0, Math.max(.5, score), TONES[toneOf(score)]);
      const [nx, ny] = pt(score, r - 34);
      s += `<line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="7" fill="var(--ink)"/>`;
    }
    s += `<text x="${cx}" y="${cy - 40}" text-anchor="middle" font-family="JetBrains Mono, ui-monospace, monospace" font-weight="700" font-size="46" fill="var(--ink)">${score ?? '—'}</text>`;
    s += `<text x="${cx - r}" y="${cy + 22}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="JetBrains Mono, ui-monospace, monospace">0 ηρεμία</text><text x="${cx + r}" y="${cy + 22}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="JetBrains Mono, ui-monospace, monospace">100 όριο</text>`;
    $('gauge').innerHTML = s;
  }

  /* ---------- frequency chart ---------- */
  function freqChart(svgId, f, limit) {
    const svg = $(svgId), W = 600, H = 220, P = { l: 46, r: 8, t: 10, b: 22 };
    if (!f || !f.series?.length) { svg.innerHTML = `<text x="300" y="110" text-anchor="middle" fill="var(--muted)" font-size="13">Η πηγή δεν απάντησε — άγνωστο, όχι μηδέν</text>`; return; }
    const pts = f.series.map(([t, hz]) => [Date.parse(t), hz]);
    const maxDev = Math.max(0.08, ...pts.map(p => Math.abs(p[1] - 50))) * 1.15;
    const t0 = pts[0][0], t1 = pts.at(-1)[0] || t0 + 1;
    const x = t => P.l + (t - t0) / (t1 - t0 || 1) * (W - P.l - P.r);
    const y = hz => P.t + (1 - (hz - (50 - maxDev)) / (2 * maxDev)) * (H - P.t - P.b);
    let s = '';
    const bandRect = (d, op) => { const a = y(50 + Math.min(d, maxDev)), b = y(50 - Math.min(d, maxDev)); return `<rect x="${P.l}" y="${a}" width="${W - P.l - P.r}" height="${b - a}" fill="var(--calm)" opacity="${op}"/>`; };
    s += bandRect(.05, .09);
    [50 - maxDev * .9, 50 - .05, 50, 50 + .05, 50 + maxDev * .9].forEach(v => { if (Math.abs(v - 50) > maxDev) return; s += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${P.l - 6}" y="${y(v) + 4}" text-anchor="end" font-size="10.5" fill="var(--muted)" font-family="JetBrains Mono, ui-monospace, monospace">${v.toFixed(3)}</text>`; });
    if (maxDev > .2) [50 - .2, 50 + .2].forEach(v => s += `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--severe)" stroke-dasharray="4 4"/>`);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + x(p[0]).toFixed(1) + ' ' + y(p[1]).toFixed(1)).join('');
    s += `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke"/>`;
    const lp = pts.at(-1); s += `<circle cx="${x(lp[0])}" cy="${y(lp[1])}" r="3.5" fill="var(--accent)"/>`;
    s += `<text x="${P.l}" y="${H - 5}" font-size="10.5" fill="var(--muted)" font-family="JetBrains Mono, ui-monospace, monospace">${tAth(new Date(t0).toISOString())}</text><text x="${W - P.r}" y="${H - 5}" text-anchor="end" font-size="10.5" fill="var(--muted)" font-family="JetBrains Mono, ui-monospace, monospace">${tAth(new Date(t1).toISOString())}</text>`;
    svg.innerHTML = s;
  }

  /* ---------- distances (the "how close" answers) ---------- */
  function distances(d) {
    const out = [];
    const ce = d.frequency?.ce;
    if (ce) out.push({ k: 'Ευρώπη · απόσταση από αποκοπή φορτίου', v: fmt(ce.marginToLoadSheddingMHz) + ' mHz', s: `${fmt(ce.latestHz, 3)} Hz τώρα · όριο 49,000 Hz`, m: (1 - Math.min(1, ce.marginToLoadSheddingMHz / 1000)) * 100 });
    const ib = d.iberia2025;
    const ex = d.mostExposed;
    if (ex && ex.name !== 'Ισπανία') out.push({ k: 'Πιο εκτεθειμένη χώρα τώρα · ηλιακά+αιολικά', v: fmt(ex.share, 0) + '%', s: `${ex.name} · δεδομένα ${tAth(ex.at)}`, m: ex.share, ref: ib?.ibrShareApprox });
    if (ib?.current !== null && ib?.current !== undefined) out.push({ k: 'Ισπανία · ηλιακά+αιολικά vs 28/4/2025', v: fmt(ib.current, 1) + '%', s: `τη μέρα του blackout ≈${ib.ibrShareApprox}%`, m: ib.current, ref: ib.ibrShareApprox });
    const gb = d.gbAdequacy;
    if (gb) out.push({ k: 'Βρετανία · ελάχιστο περιθώριο 12 ωρών', v: fmt(gb.minMarginMw) + ' MW', s: 'κρίσιμο κάτω από ~500 MW', m: Math.max(0, Math.min(100, (5000 - gb.minMarginMw) / 45)) });
    const tx = d.ercot;
    if (tx) out.push({ k: 'Τέξας · άμεση εφεδρεία', v: fmt(tx.prcMw) + ' MW', s: 'EEA1 < 2.500 · διακοπές < 1.500 MW', m: tx.score });
    const sw = d.space;
    if (sw) out.push({ k: 'Ήλιος · γεωμαγνητικός δείκτης Kp', v: fmt(sw.kp, 1) + ' / 9', s: `καταιγίδα από Kp 5 · πρόγνωση έως G${sw.gForecastMax}`, m: sw.kp / 9 * 100 });
    $('distances').innerHTML = out.map(o => `<div class="dist"><div class="k">${esc(o.k)}</div><div class="v">${esc(o.v)}</div><div class="s">${esc(o.s)}</div><div class="meter"><b class="bg-${toneOf(o.m)}" style="width:${Math.max(2, Math.min(100, o.m))}%"></b>${o.ref ? `<u style="left:${o.ref}%"></u>` : ''}</div></div>`).join('') || '<div class="empty">Καμία πηγή δεν απάντησε.</div>';
  }

  function summary(d) {
    const h = d.headline, ce = d.frequency?.ce, es = d.iberia2025;
    if (h.score === null) return 'Οι πηγές δεν απαντούν αυτή τη στιγμή. Αυτό σημαίνει «άγνωστο», όχι «ασφαλές».';
    const calm = h.score < 20 ? 'Κανένα από τα δίκτυα που παρακολουθούμε δεν δείχνει σημάδια επικείμενης κατάρρευσης.' : h.score < 40 ? 'Υπάρχει αυξημένη πίεση σε ένα σύστημα, αλλά μέσα στα κανονικά λειτουργικά όρια.' : 'Ένα σύστημα λειτουργεί υπό αισθητή πίεση — αξίζει να το παρακολουθείς.';
    let s = calm + ` Το πιο πιεσμένο αυτή τη στιγμή: <b>${esc(h.system)}</b> (${h.score}/100).`;
    if (ce) s += ` Η ευρωπαϊκή συχνότητα είναι ${fmt(ce.latestHz, 3)} Hz — ${Math.abs(ce.deviationMHz) <= 50 ? 'μέσα στη ζώνη ±50 mHz' : 'εκτός της κανονικής ζώνης ±50 mHz'}.`;
    if (es?.current != null) s += ` Η Ισπανία τρέχει με ${fmt(es.current, 0)}% ηλιακά+αιολικά (≈${es.ibrShareApprox}% την ημέρα του blackout).`;
    if (d.mostExposed && d.mostExposed.share >= (es?.ibrShareApprox ?? 70)) s += ` Πιο εκτεθειμένη δομικά: <b>${esc(d.mostExposed.name)}</b> με ${fmt(d.mostExposed.share, 0)}% — πάνω από το επίπεδο της Ισπανίας τότε.`;
    return s;
  }

  function systems(list) {
    $('systems').innerHTML = list.filter(s => s.kind !== 'structural').map(s => `<div class="card sys">
      <div class="sys-top"><div><div class="sys-name">${esc(s.name)}</div><div class="sys-sub">${esc(s.sub)}</div></div>
      <div class="sys-score tone-${s.tone}">${s.score ?? '—'}<small>/100</small></div></div>
      <div class="meter"><b class="bg-${s.tone}" style="width:${Math.max(2, s.score ?? 0)}%"></b></div>
      <div class="band tone-${s.tone}" style="align-self:flex-start">${esc(s.label)}</div>
      ${s.components.map(c => `<div class="comp"><span>${esc(c.k)}</span><b>${esc(c.v)}</b></div>`).join('')}
      <div class="sys-foot">${s.at ? 'μέτρηση ' + tAth(s.at) + ' · ' + ago(s.at) : 'χωρίς χρονοσφραγίδα'} · <a href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">${esc(s.source)}</a></div>
    </div>`).join('');
  }

  function ibr(d) {
    const ref = d.iberia2025?.ibrShareApprox ?? 70;
    const mix = [...(d.mix || [])].sort((a, b) => b.ibrShare - a.ibrShare);
    $('ibr').innerHTML = mix.length ? mix.map(m => `<div class="ibr-row"><span class="name">${esc(m.name)}</span>
      <div class="ibr-bar" title="Μέγιστο 24h: ${m.peak24.share}% στις ${tAth(m.peak24.at)}"><span class="now bg-${toneOf(m.ibrScore)}" style="width:${Math.min(100, m.ibrShare)}%"></span><span class="peak" style="left:${Math.min(99, m.peak24.share)}%"></span><span class="ref" style="left:${ref}%"></span></div>
      <span class="val">${fmt(m.ibrShare, 0)}%</span></div>`).join('') + `<div class="chart-foot">Τελευταία δεδομένα χωρών: ${tAth(mix[0].at)} (${ago(mix[0].at)}) · Energy-Charts δημοσιεύει με καθυστέρηση 15–60′</div>` : '<div class="empty">Τα δεδομένα παραγωγής δεν είναι διαθέσιμα.</div>';
  }

  /* ---------- outages ---------- */
  const PTONE = { critical: 'edge', major: 'severe', minor: 'watch', maintenance: 'unknown', none: 'calm', unknown: 'unknown' };
  async function outages() {
    try {
      const r = await fetch('/api/outages', { cache: 'no-store' });
      const d = await r.json();
      const net = d.internet || {}, ongoing = (net.countries || []).filter(c => c.ongoing);
      const stats = [
        [net.ongoing ?? '—', 'χώρες με ενεργή διακοπή Internet', ongoing.length ? 'severe' : 'calm'],
        [(net.countries || []).length || (net.ongoing === null ? '—' : 0), 'χώρες με διακοπή στο 24ωρο', 'watch'],
        [d.providersDown, 'πλατφόρμες με σοβαρό πρόβλημα', d.providersDown ? 'severe' : 'calm'],
        [d.news?.length ?? 0, 'αναφορές διακοπών ρεύματος 24h', 'unknown']
      ];
      $('outStats').innerHTML = stats.map(([v, k, t]) => `<div class="out-stat"><b class="tone-${t}">${esc(v)}</b><span>${esc(k)}</span></div>`).join('');
      $('outNet').innerHTML = (net.countries || []).length ? net.countries.slice(0, 40).map(c => `<div class="out-item"><span class="dot bg-${c.ongoing ? 'severe' : 'watch'}"></span><div><div class="t">${esc(c.country)}${c.ongoing ? '<span class="tag on">ΕΝΕΡΓΗ</span>' : '<span class="tag">ΕΛΗΞΕ</span>'}${c.confidence === 'high' ? '<span class="tag">2+ αισθητήρες</span>' : ''}</div><div class="m">από ${tAth(c.startedAt)}${c.endedAt ? ' έως ' + tAth(c.endedAt) : ''} · ${esc(c.sensors.join(', '))}</div></div></div>`).join('') : `<div class="empty">${net.ongoing === null ? 'Το IODA δεν απάντησε — άγνωστο, όχι μηδέν.' : 'Καμία διακοπή Internet σε επίπεδο χώρας στο 24ωρο.'}</div>`;
      $('outProv').innerHTML = (d.providers || []).map(p => `<div class="out-item"><span class="dot bg-${PTONE[p.indicator] || 'unknown'}"></span><div><div class="t"><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a></div><div class="m">${p.ok === false ? 'σελίδα μη διαθέσιμη' : esc(p.description || p.indicator)}</div>${(p.incidents || []).slice(0, 2).map(i => `<div class="m">• ${esc(i.name)}${i.at ? ' · ' + ago(i.at) : ''}</div>`).join('')}</div></div>`).join('') || '<div class="empty">—</div>';
      $('outNews').innerHTML = (d.news || []).length ? d.news.map(n => `<div class="out-item"><span class="dot bg-unknown"></span><div><div class="t"><a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.title)}</a></div><div class="m">${esc(n.domain)}${n.country ? ' · ' + esc(n.country) : ''}${n.at ? ' · ' + ago(n.at) : ''}</div></div></div>`).join('') : `<div class="empty">${d.newsOk ? 'Καμία αναφορά.' : 'Η ροή ειδήσεων δεν απάντησε.'}</div>`;
      const cy = d.cyber || {}, kev = cy.kev;
      $('cyStats').innerHTML = [[cy.news?.length ?? 0, 'αναφορές κυβερνοεπιθέσεων 24h', 'unknown'], [kev ? kev.added14d : '—', 'νέες ευπάθειες υπό εκμετάλλευση · 14 ημέρες', kev && kev.added14d > 8 ? 'watch' : 'calm'], [kev ? kev.ransomware14d : '—', 'από αυτές σε εκστρατείες ransomware', kev && kev.ransomware14d ? 'severe' : 'calm'], [d.providersDown + (d.providersDegraded || 0), 'πλατφόρμες με ενεργό περιστατικό', d.providersDown ? 'severe' : d.providersDegraded ? 'watch' : 'calm']]
        .map(([v, k, t]) => `<div class="out-stat"><b class="tone-${t}">${esc(v)}</b><span>${esc(k)}</span></div>`).join('');
      $('cyNews').innerHTML = (cy.news || []).length ? cy.news.map(n => `<div class="out-item"><span class="dot bg-unknown"></span><div><div class="t"><a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.title)}</a></div><div class="m">${esc(n.domain)}${n.at ? ' · ' + ago(n.at) : ''}</div></div></div>`).join('') : `<div class="empty">${cy.newsOk ? 'Καμία αναφορά.' : 'Η ροή ειδήσεων δεν απάντησε.'}</div>`;
      $('cyKev').innerHTML = kev ? kev.items.map(v => `<div class="out-item"><span class="dot bg-${v.ransomware ? 'severe' : 'watch'}"></span><div><div class="t">${esc(v.vendor)} ${esc(v.product)}${v.ransomware ? '<span class="tag on">RANSOMWARE</span>' : ''}</div><div class="m">${esc(v.cve)} · προστέθηκε ${esc(v.added)}</div><div class="m">${esc(v.name)}</div></div></div>`).join('') : '<div class="empty">Ο κατάλογος CISA δεν απάντησε.</div>';
    } catch { $('outNet').innerHTML = '<div class="empty">Η ροή outages δεν απάντησε.</div>'; }
  }

  /* ---------- per-viewer history ---------- */
  const KEY = 'blackout.pulse.history.v1';
  function history(score, at) {
    let h = [];
    try { h = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch {}
    if (score !== null) { h.push([at, score]); h = h.filter(p => Date.parse(p[0]) > Date.now() - 48 * 3600e3).slice(-600); try { localStorage.setItem(KEY, JSON.stringify(h)); } catch {} }
    const svg = $('hist'), W = 600, H = 140;
    if (h.length < 2) { svg.innerHTML = `<text x="300" y="75" text-anchor="middle" fill="var(--muted)" font-size="13">Η καμπύλη χτίζεται με κάθε ανανέωση (κάθε 60″)</text>`; return; }
    const t0 = Date.parse(h[0][0]), t1 = Date.parse(h.at(-1)[0]);
    const x = t => 4 + (Date.parse(t) - t0) / (t1 - t0 || 1) * (W - 8), y = v => H - 6 - v / 100 * (H - 12);
    let s = [20, 40, 60, 80].map(v => `<line x1="0" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/>`).join('');
    s += `<path d="${h.map((p, i) => (i ? 'L' : 'M') + x(p[0]).toFixed(1) + ' ' + y(p[1]).toFixed(1)).join('')}" fill="none" stroke="var(--accent)" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
    svg.innerHTML = s;
    $('histFoot').textContent = `${h.length} μετρήσεις από ${tAth(h[0][0])} · min ${Math.min(...h.map(p => p[1]))} · max ${Math.max(...h.map(p => p[1]))} · αποθηκεύεται μόνο στον browser σου`;
  }

  /* ---------- load ---------- */
  async function load() {
    if (busy) return; busy = true;
    $('liveText').textContent = 'ΕΝΗΜΕΡΩΣΗ…';
    try {
      const r = await fetch('/api/pulse', { cache: 'no-store' });
      if (!r.ok) throw Error('HTTP ' + r.status);
      const d = await r.json();
      gauge(d.headline.score);
      $('band').textContent = d.headline.label;
      $('band').className = 'band tone-' + d.headline.tone;
      $('worst').innerHTML = d.headline.system ? `Πιο πιεσμένο σύστημα: <b>${esc(d.headline.system)}</b>` : 'Χωρίς δεδομένα';
      $('summary').innerHTML = summary(d);
      distances(d);
      const ce = d.frequency.ce, gb = d.frequency.gb;
      freqChart('ceChart', ce); freqChart('gbChart', gb);
      $('ceHz').textContent = ce ? fmt(ce.latestHz, 3) + ' Hz' : '—';
      $('gbHz').textContent = gb ? fmt(gb.latestHz, 3) + ' Hz' : '—';
      $('ceFoot').textContent = ce ? `Δ ${ce.deviationMHz > 0 ? '+' : ''}${ce.deviationMHz} mHz · max ±${ce.maxDeviationMHz} · σ ${fmt(ce.sdMHz, 1)} mHz · ${ago(ce.at)} · ${ce.source}` : 'Πηγή μη διαθέσιμη';
      $('gbFoot').textContent = gb ? `Δ ${gb.deviationMHz > 0 ? '+' : ''}${gb.deviationMHz} mHz · max ±${gb.maxDeviationMHz} · ${ago(gb.at)} · ${gb.source} · LFDD 48,8 Hz` : 'Πηγή μη διαθέσιμη';
      systems(d.systems); ibr(d);
      history(d.headline.score, d.fetchedAt);
      if (d.disclaimer) $('disclaimer').textContent = d.disclaimer;
      $('live').className = 'live on';
      document.title = `${d.headline.score ?? '—'}/100 · BLACKOUT`;
    } catch (e) {
      $('live').className = 'live err';
      $('summary').textContent = 'Δεν ήταν δυνατή η σύνδεση με τις πηγές. Θα ξαναδοκιμάσουμε σε λίγο.';
    } finally { busy = false; countdown = REFRESH; }
    outages();
  }
  function tick() {
    countdown = Math.max(0, countdown - 1);
    if (!busy) $('liveText').textContent = `LIVE · ${countdown}″`;
    if (countdown === 0 && !document.hidden) load();
  }
  $('refresh').addEventListener('click', load);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && countdown < REFRESH - 30) load(); });
  gauge(null); load(); timer = setInterval(tick, 1000);
})();
