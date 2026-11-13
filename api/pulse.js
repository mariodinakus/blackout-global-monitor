'use strict';
/**
 * /api/pulse — "Πόσο κοντά είμαστε σε blackout;"
 * Live physical stress indicators from public operator/sensor feeds,
 * turned into a transparent 0–100 proximity index per system.
 * It is a heuristic stress indicator, NOT a probability.
 */
const UA = { Accept: 'application/json', 'User-Agent': 'BLACKOUT-Pulse/3.0 (public grid monitor)' };
const clamp = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x));
const num = v => (v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null);
const iso = v => { const d = new Date(v); return Number.isFinite(+d) ? d.toISOString() : null; };
const round = (x, d = 1) => (x === null || x === undefined ? null : Math.round(x * 10 ** d) / 10 ** d);
async function getJson(url, ms = 9000) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw Error('HTTP ' + r.status);
  return r.json();
}

/* ---------- Energy-Charts v2 parser ---------- */
function ecRows(raw) {
  const names = Array.isArray(raw?.series) ? raw.series.map((s, i) => String(s.name || s.id || i)) : [];
  const out = [];
  for (const r of Array.isArray(raw?.data) ? raw.data : []) {
    let at = typeof r.timestamp === 'number' ? iso(r.timestamp * (r.timestamp < 1e12 ? 1000 : 1)) : iso(r.timestamp || r.time);
    if (!at) continue;
    let vals = r.values;
    if (Array.isArray(vals)) vals = Object.fromEntries(vals.map((v, i) => [names[i] || String(i), num(v)]));
    else if (vals && typeof vals === 'object') vals = Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, num(v)]));
    else vals = { value: num(r.value) };
    out.push({ at, values: vals });
  }
  // legacy format {unix_seconds:[], production_types:[{name,data}]}
  if (!out.length && Array.isArray(raw?.unix_seconds)) {
    const types = raw.production_types || [];
    raw.unix_seconds.forEach((t, i) => {
      out.push({ at: iso(t * 1000), values: Object.fromEntries(types.map(p => [p.name, num(p.data?.[i])])) });
    });
  }
  return out.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

/* ---------- Frequency scoring ---------- */
// Continental Europe: 50 mHz normal band, 200 mHz alert, 1 Hz load shedding.
// Great Britain: 200 mHz operational limit, 500 mHz statutory, 1.2 Hz LFDD (48.8 Hz).
const CE_T = [0.05, 0.2, 1.0], GB_T = [0.2, 0.5, 1.2];
function freqScore(devAbsHz, T = CE_T) {
  if (devAbsHz === null) return null;
  if (devAbsHz <= T[0]) return (devAbsHz / T[0]) * 20;
  if (devAbsHz <= T[1]) return 20 + ((devAbsHz - T[0]) / (T[1] - T[0])) * 50;
  return clamp(70 + ((devAbsHz - T[1]) / (T[2] - T[1])) * 30);
}
function freqStats(series, T = CE_T) {
  if (!series.length) return null;
  const devs = series.map(p => p.hz - 50);
  const mean = devs.reduce((a, b) => a + b, 0) / devs.length;
  const sd = Math.sqrt(devs.reduce((a, b) => a + (b - mean) ** 2, 0) / devs.length);
  const maxAbs = Math.max(...devs.map(Math.abs));
  const latest = series.at(-1);
  const latestAbs = Math.abs(latest.hz - 50);
  // blend: current deviation dominates, worst excursion in window adds context
  const score = clamp(0.65 * freqScore(latestAbs, T) + 0.35 * freqScore(maxAbs, T));
  return {
    latestHz: round(latest.hz, 3), at: latest.at,
    deviationMHz: round((latest.hz - 50) * 1000, 0),
    maxDeviationMHz: round(maxAbs * 1000, 0), sdMHz: round(sd * 1000, 1),
    marginToLoadSheddingMHz: round((latest.hz - 49.0) * 1000, 0),
    ageSeconds: Math.max(0, Math.round((Date.now() - Date.parse(latest.at)) / 1000)),
    score: round(score, 0)
  };
}
function thin(series, n = 180) {
  if (series.length <= n) return series;
  const step = series.length / n, out = [];
  for (let i = 0; i < n; i++) out.push(series[Math.floor(i * step)]);
  out.push(series.at(-1));
  return out;
}

async function euFrequency() {
  const end = new Date(Date.now() - 30000), start = new Date(Date.now() - 20 * 60000);
  const q = new URLSearchParams({ region: 'DE-Freiburg', start: start.toISOString(), end: end.toISOString() });
  const rows = ecRows(await getJson('https://api.energy-charts.info/v2/frequency?' + q, 9500));
  const series = rows.map(r => ({ at: r.at, hz: num(Object.values(r.values).find(v => v !== null)) }))
    .filter(p => p.hz > 45 && p.hz < 55);
  if (!series.length) throw Error('no data');
  return { stats: freqStats(series), series: thin(series).map(p => [p.at, round(p.hz, 4)]), source: 'Energy-Charts (Fraunhofer ISE) · αισθητήρας Freiburg', sourceUrl: 'https://www.energy-charts.info/charts/frequency/chart.htm' };
}

async function gbFrequency() {
  const end = new Date(), start = new Date(Date.now() - 30 * 60000);
  const q = new URLSearchParams({ from: start.toISOString(), to: end.toISOString() });
  const d = await getJson('https://data.elexon.co.uk/bmrs/api/v1/system/frequency?' + q, 9000);
  const list = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
  const series = list.map(x => ({ at: iso(x.measurementTime || x.startTime || x.time), hz: num(x.frequency) }))
    .filter(p => p.at && p.hz > 45 && p.hz < 55).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  if (!series.length) throw Error('no data');
  const stats = freqStats(series, GB_T);
  stats.marginToLoadSheddingMHz = round((series.at(-1).hz - 48.8) * 1000, 0); // GB LFDD stage 1 = 48.8 Hz
  return { stats, series: thin(series).map(p => [p.at, round(p.hz, 4)]), source: 'Elexon BMRS · FREQ', sourceUrl: 'https://bmrs.elexon.co.uk/system-frequency' };
}

async function gbAdequacy() {
  const now = Date.now();
  const q = new URLSearchParams({ publishDateTimeFrom: new Date(now - 4 * 3600000).toISOString(), publishDateTimeTo: new Date(now).toISOString() });
  const d = await getJson('https://data.elexon.co.uk/bmrs/api/v1/datasets/LOLPDRM/stream?' + q, 10000);
  const rows = (Array.isArray(d) ? d : d?.data || []).map(v => ({
    at: iso(String(v.startTime || '').replace(' ', 'T')), pub: iso(String(v.publishTime || '').replace(' ', 'T')),
    lolp: num(v.lossOfLoadProbability), margin: num(v.deratedMargin)
  })).filter(x => x.at && Date.parse(x.at) >= now - 30 * 60000 && Date.parse(x.at) <= now + 12 * 3600000);
  rows.sort((a, b) => Date.parse(a.at) - Date.parse(b.at) || Date.parse(b.pub) - Date.parse(a.pub));
  const seen = new Set(), fc = [];
  for (const r of rows) { if (seen.has(r.at)) continue; seen.add(r.at); fc.push(r); }
  if (!fc.length) throw Error('no forecast');
  const minMargin = Math.min(...fc.map(r => r.margin ?? Infinity));
  const maxLolp = Math.max(...fc.map(r => r.lolp ?? 0));
  const marginScore = Number.isFinite(minMargin) ? clamp(((5000 - minMargin) / 4500) * 100) : null;
  const lolpScore = maxLolp > 0 ? clamp(((Math.log10(maxLolp) + 4) / 3) * 100) : 0; // 1e-4 → 0, 0.1 → 100
  return {
    minMarginMw: Number.isFinite(minMargin) ? Math.round(minMargin) : null, maxLolp, nowMarginMw: fc[0].margin,
    forecast: fc.slice(0, 24).map(r => [r.at, r.margin, r.lolp]),
    score: round(Math.max(marginScore ?? 0, lolpScore), 0),
    source: 'Elexon / NESO · LOLPDRM', sourceUrl: 'https://bmrs.elexon.co.uk/'
  };
}

/* ---------- Inverter-based (solar + wind) share — the Iberia 2025 vulnerability ---------- */
const COUNTRIES = { es: 'Ισπανία', pt: 'Πορτογαλία', gr: 'Ελλάδα', it: 'Ιταλία', de: 'Γερμανία', fr: 'Γαλλία', pl: 'Πολωνία', nl: 'Ολλανδία', be: 'Βέλγιο', at: 'Αυστρία', ch: 'Ελβετία', cz: 'Τσεχία', sk: 'Σλοβακία', hu: 'Ουγγαρία', ro: 'Ρουμανία', bg: 'Βουλγαρία', hr: 'Κροατία', si: 'Σλοβενία', rs: 'Σερβία', dk: 'Δανία', se: 'Σουηδία', no: 'Νορβηγία', fi: 'Φινλανδία', ie: 'Ιρλανδία' };
const EXCLUDE = /load|residual|share|cross border|consumption|import|export/i;
async function countryMix(cc) {
  const end = new Date(), start = new Date(Date.now() - 26 * 3600000);
  const q = new URLSearchParams({ country: cc, start: start.toISOString(), end: end.toISOString() });
  const rows = ecRows(await getJson('https://api.energy-charts.info/v2/public_power?' + q, 10500));
  const calc = r => {
    let gen = 0, sol = 0, wind = 0, load = null, cb = null, n = 0;
    for (const [k, v] of Object.entries(r.values)) {
      if (v === null) continue;
      if (/^load\b/i.test(k)) { load = v; continue; }
      if (/cross border/i.test(k)) { cb = v; continue; }
      if (EXCLUDE.test(k) || v <= 0) continue;
      gen += v; n++;
      if (/solar/i.test(k)) sol += v;
      if (/wind/i.test(k)) wind += v;
    }
    return n >= 2 && gen > 0 ? { at: r.at, genMw: gen, solarMw: sol, windMw: wind, loadMw: load, crossBorderMw: cb, ibr: (sol + wind) / gen * 100 } : null;
  };
  const pts = rows.map(calc).filter(Boolean);
  if (!pts.length) throw Error('no mix');
  // the newest rows are often published before every fuel type has reported
  while (pts.length > 4 && pts.at(-1).genMw < 0.6 * pts.at(-2).genMw) pts.pop();
  const last = pts.at(-1);
  const day = pts.filter(p => Date.parse(p.at) > Date.now() - 24 * 3600000);
  const peak = day.reduce((m, p) => (p.ibr > m.ibr ? p : m), day[0] || last);
  return {
    code: cc, name: COUNTRIES[cc], at: last.at, ageMinutes: Math.round((Date.now() - Date.parse(last.at)) / 60000),
    ibrShare: round(last.ibr, 1), solarMw: Math.round(last.solarMw), windMw: Math.round(last.windMw), genMw: Math.round(last.genMw),
    loadMw: last.loadMw !== null ? Math.round(last.loadMw) : null, crossBorderMw: last.crossBorderMw !== null ? Math.round(last.crossBorderMw) : null,
    peak24: { share: round(peak.ibr, 1), at: peak.at },
    history: thin(day, 96).map(p => [p.at, round(p.ibr, 1)]),
    ibrScore: round(clamp(((last.ibr - 40) / 50) * 100), 0)
  };
}

/* ---------- ERCOT (Texas) physical responsive capability ---------- */
// country mixes change every 15 min: keep them 10 min in the warm function instead of refetching each call
const MIX_CACHE = new Map();
async function cachedMix(cc) {
  const hit = MIX_CACHE.get(cc);
  if (hit && Date.now() - hit.t < 600000) return hit.v;
  const v = await countryMix(cc);
  MIX_CACHE.set(cc, { t: Date.now(), v });
  return v;
}

function findPrc(obj) {
  // Walk JSON, collect {time, prc} candidates. Defensive against schema changes.
  const found = [];
  const walk = (o, depth = 0) => {
    if (!o || depth > 6) return;
    if (Array.isArray(o)) { o.forEach(x => walk(x, depth + 1)); return; }
    if (typeof o === 'object') {
      const key = Object.keys(o).find(k => /^prc$|prcvalue|physicalresponsive/i.test(k));
      if (key && num(o[key]) !== null) {
        const t = o.timestamp || o.interval || o.time || o.epoch || o.lastUpdated;
        found.push({ prc: num(o[key]), at: typeof t === 'number' ? iso(t < 1e12 ? t * 1000 : t) : iso(t) });
      }
      Object.values(o).forEach(v => typeof v === 'object' && walk(v, depth + 1));
    }
  };
  walk(obj);
  const dated = found.filter(f => f.at && Date.parse(f.at) <= Date.now() + 60000).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  return dated.at(-1) || found.at(-1) || null;
}
async function ercot() {
  const d = await getJson('https://www.ercot.com/api/1/services/read/dashboards/daily-prc.json', 9000);
  const p = findPrc(d);
  if (!p) { const e = Error('schema'); e.sample = JSON.stringify(d).slice(0, 600); throw e; }
  // EEA1 when PRC < 2,500 MW; rolling outages (EEA3) when < 1,500 MW
  return { prcMw: Math.round(p.prc), at: p.at, score: round(clamp(((4000 - p.prc) / 2500) * 100), 0), source: 'ERCOT · Physical Responsive Capability', sourceUrl: 'https://www.ercot.com/gridmktinfo/dashboards/gridconditions' };
}

/* ---------- Space weather (NOAA SWPC) ---------- */
async function space() {
  const [kp, scales] = await Promise.all([
    getJson('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json', 8000),
    getJson('https://services.swpc.noaa.gov/products/noaa-scales.json', 8000).catch(() => null)
  ]);
  const last = Array.isArray(kp) ? kp.at(-1) : null;
  const k = num(last?.estimated_kp ?? last?.kp_index);
  if (k === null) throw Error('no kp');
  const g = num(scales?.['0']?.G?.Scale) ?? 0;
  const g24 = Math.max(...['1', '2', '3'].map(i => num(scales?.[i]?.G?.Scale) ?? 0));
  return { kp: round(k, 2), at: iso((last.time_tag || '') + 'Z'), gNow: g, gForecastMax: g24, score: round(clamp(((Math.max(k, g24 > 0 ? g24 + 4 : 0) - 3) / 6) * 100), 0), source: 'NOAA SWPC', sourceUrl: 'https://www.swpc.noaa.gov/' };
}

/* ---------- Bands ---------- */
const BANDS = [[20, 'ΚΑΝΟΝΙΚΗ ΛΕΙΤΟΥΡΓΙΑ', 'calm'], [40, 'ΑΥΞΗΜΕΝΗ ΠΡΟΣΟΧΗ', 'watch'], [60, 'ΠΙΕΣΗ', 'stress'], [80, 'ΣΟΒΑΡΗ ΠΙΕΣΗ', 'severe'], [101, 'ΟΡΙΑΚΗ ΚΑΤΑΣΤΑΣΗ', 'edge']];
const band = s => { if (s === null) return { label: 'ΑΓΝΩΣΤΟ', tone: 'unknown' }; const b = BANDS.find(x => s < x[0]); return { label: b[1], tone: b[2] }; };

const VB = [[25, 'ΧΑΜΗΛΗ ΕΥΑΛΩΤΟΤΗΤΑ', 'calm'], [50, 'ΜΕΤΡΙΑ ΕΥΑΛΩΤΟΤΗΤΑ', 'watch'], [75, 'ΥΨΗΛΗ ΕΥΑΛΩΤΟΤΗΤΑ', 'stress'], [101, 'ΠΟΛΥ ΥΨΗΛΗ ΕΥΑΛΩΤΟΤΗΤΑ', 'severe']];
const vband = s => { if (s === null) return { label: 'ΑΓΝΩΣΤΟ', tone: 'unknown' }; const b = VB.find(x => s < x[0]); return { label: b[1], tone: b[2] }; };
const settle = async fn => { try { return { ok: true, ...(await fn()) }; } catch (e) { return { ok: false, reason: String(e.message || 'unavailable').slice(0, 80), ...(e.sample ? { sample: e.sample } : {}) }; } };

module.exports = async (req, res) => {
  const t0 = Date.now();
  const mixCodes = Object.keys(COUNTRIES);
  const [eu, gbf, gba, tx, sw, ...mixes] = await Promise.all([
    settle(euFrequency), settle(gbFrequency), settle(gbAdequacy), settle(ercot), settle(space),
    ...mixCodes.map(cc => settle(() => cachedMix(cc)))
  ]);
  const euF = eu.ok ? eu.stats.score : null;

  const systems = [];
  systems.push({
    id: 'ce', name: 'Ηπειρωτική Ευρώπη', sub: 'Συγχρονισμένο δίκτυο ENTSO-E · 400+ εκ. άνθρωποι', score: euF,
    components: eu.ok ? [{ k: 'Απόκλιση συχνότητας', v: eu.stats.deviationMHz + ' mHz', s: euF }, { k: 'Μέγιστη απόκλιση 20′', v: eu.stats.maxDeviationMHz + ' mHz' }, { k: 'Απόσταση από αποκοπή φορτίου (49,0 Hz)', v: eu.stats.marginToLoadSheddingMHz + ' mHz' }] : [],
    at: eu.ok ? eu.stats.at : null, source: eu.source, sourceUrl: eu.sourceUrl, ok: eu.ok
  });
  for (const m of mixes) {
    if (!m.ok) continue;
    systems.push({
      id: m.code, kind: 'structural', name: m.name, sub: 'Ευαλωτότητα τύπου Ισπανίας · δομικός δείκτης', score: m.ibrScore,
      components: [{ k: 'Ηλιακά + αιολικά (inverter-based)', v: m.ibrShare + '%', s: m.ibrScore }, { k: 'Μέγιστο 24 ωρών', v: m.peak24.share + '%' }, { k: 'Φορτίο', v: m.loadMw ? m.loadMw.toLocaleString('el-GR') + ' MW' : '—' }],
      at: m.at, source: 'Energy-Charts · public power', sourceUrl: 'https://www.energy-charts.info/', ok: true
    });
  }
  if (gbf.ok || gba.ok) {
    const parts = [gbf.ok ? gbf.stats.score : null, gba.ok ? gba.score : null].filter(x => x !== null);
    systems.push({
      id: 'gb', name: 'Μεγάλη Βρετανία', sub: 'Ανεξάρτητο δίκτυο NESO', score: round(Math.max(...parts) * 0.6 + (parts.reduce((a, b) => a + b, 0) / parts.length) * 0.4, 0),
      components: [gbf.ok && { k: 'Απόκλιση συχνότητας', v: gbf.stats.deviationMHz + ' mHz', s: gbf.stats.score }, gba.ok && { k: 'Ελάχιστο περιθώριο 12h (derated)', v: gba.minMarginMw?.toLocaleString('el-GR') + ' MW', s: gba.score }, gba.ok && { k: 'Μέγ. πιθανότητα απώλειας φορτίου (LoLP)', v: gba.maxLolp ? gba.maxLolp.toExponential(1) : '≈0' }].filter(Boolean),
      at: gbf.ok ? gbf.stats.at : null, source: 'Elexon / NESO', sourceUrl: 'https://bmrs.elexon.co.uk/', ok: true
    });
  }
  if (tx.ok) systems.push({ id: 'tx', name: 'Τέξας (ERCOT)', sub: 'Απομονωμένο δίκτυο ΗΠΑ', score: tx.score, components: [{ k: 'Άμεσα διαθέσιμη εφεδρεία (PRC)', v: tx.prcMw.toLocaleString('el-GR') + ' MW', s: tx.score }, { k: 'Κατώφλι EEA1 / κυλιόμενες διακοπές', v: '2.500 / 1.500 MW' }], at: tx.at, source: tx.source, sourceUrl: tx.sourceUrl, ok: true });
  if (sw.ok) systems.push({ id: 'sw', name: 'Διαστημικός καιρός', sub: 'Γεωμαγνητική καταιγίδα · παγκόσμιος παράγοντας', score: sw.score, components: [{ k: 'Δείκτης Kp (τώρα)', v: String(sw.kp), s: sw.score }, { k: 'Κλίμακα G τώρα / πρόγνωση', v: 'G' + sw.gNow + ' / G' + sw.gForecastMax }], at: sw.at, source: sw.source, sourceUrl: sw.sourceUrl, ok: true });

  systems.forEach(s => { if (!s.kind) s.kind = 'live'; Object.assign(s, s.kind === 'structural' ? vband(s.score) : band(s.score)); });
  const scored = systems.filter(s => s.score !== null && s.kind === 'live');
  const mostExposed = mixes.filter(m => m.ok).sort((a, b) => b.ibrShare - a.ibrShare)[0] || null;
  const worst = scored.reduce((m, s) => (s.score > (m?.score ?? -1) ? s : m), null);
  const headline = worst ? { score: worst.score, system: worst.name, ...band(worst.score) } : { score: null, ...band(null) };

  const es = mixes.find(m => m.ok && m.code === 'es');
  const body = {
    fetchedAt: new Date().toISOString(), tookMs: Date.now() - t0, refreshSeconds: 60,
    headline, systems, mostExposed: mostExposed ? { name: mostExposed.name, share: mostExposed.ibrShare, at: mostExposed.at } : null,
    frequency: { ce: eu.ok ? { ...eu.stats, series: eu.series, source: eu.source, sourceUrl: eu.sourceUrl } : null, gb: gbf.ok ? { ...gbf.stats, series: gbf.series, source: gbf.source, sourceUrl: gbf.sourceUrl } : null },
    mix: mixes.filter(m => m.ok),
    iberia2025: { date: '2025-04-28T10:33:00Z', ibrShareApprox: 70, note: 'Περίπου 59% φωτοβολταϊκά + 12% αιολικά τη στιγμή της κατάρρευσης (ENTSO-E). Αιτία: αλυσιδωτή υπέρταση, όχι συχνότητα.', current: es ? es.ibrShare : null },
    gbAdequacy: gba.ok ? gba : null, ercot: tx.ok ? tx : null, space: sw.ok ? sw : null,
    feeds: { euFrequency: eu.ok, gbFrequency: gbf.ok, gbAdequacy: gba.ok, ercot: tx.ok, space: sw.ok, mix: Object.fromEntries(mixes.map((m, i) => [mixCodes[i], m.ok])) },
    ...(req.query && req.query.debug ? { debug: { eu, gbf: { ok: gbf.ok, reason: gbf.reason }, gba: { ok: gba.ok, reason: gba.reason }, tx, sw: { ok: sw.ok, reason: sw.reason }, mixes: mixes.map(m => ({ ok: m.ok, reason: m.reason })) } } : {}),
    disclaimer: 'Ο δείκτης είναι ευρετικός δείκτης φυσικής πίεσης από δημόσιες μετρήσεις — ΟΧΙ πιθανότητα blackout. Τάση (voltage), φόρτιση γραμμών και SCADA δεν είναι δημόσια.'
  };
  res.setHeader('Cache-Control', 'public, s-maxage=45, stale-while-revalidate=60');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = 200;
  res.end(JSON.stringify(body));
};
module.exports._test = { freqScore, ecRows, findPrc, band };
