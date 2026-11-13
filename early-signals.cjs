'use strict';
/*
 * Grid Early Signals: measured deviations over 5, 15 and 60 minutes.
 * No predictions or failure probabilities. Missing/stale readings remain null.
 */
const ISO = x => { const d = new Date(x); return Number.isFinite(+d) ? d.toISOString() : null; };
const val = x => x === null || x === undefined || x === '' ? null : Number.isFinite(Number(x)) ? Number(x) : null;
const UA = { Accept: 'application/json', 'User-Agent': 'BLACKOUT-EarlySignals/1.0' };
async function json(url) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(11000) });
  if (!r.ok) throw Error('Upstream HTTP ' + r.status);
  return r.json();
}
function energyRows(raw) {
  const out = [];
  for (const row of Array.isArray(raw && raw.data) ? raw.data : []) {
    const x = row.timestamp || row.time;
    const at = typeof x === 'number' ? ISO(x * (x < 1e12 ? 1000 : 1)) : ISO(x);
    const v = row.values && typeof row.values === 'object' ? Object.values(row.values).find(v => val(v) !== null) : row.value;
    const hz = val(v);
    if (at && hz !== null && hz > 45 && hz < 55) out.push({ at, hz });
  }
  return out;
}
function measure(input, expectedWindowMin = 75) {
  const pts = input.filter(p => p && Number.isFinite(Date.parse(p.at)) && Number.isFinite(p.hz)).sort((a,b) => Date.parse(a.at)-Date.parse(b.at));
  const last = pts[pts.length - 1];
  if (!last || Date.now() - Date.parse(last.at) > 10 * 60000 || Date.parse(last.at) > Date.now() + 120000)
    return { ok:false, reason:'Missing or stale measured frequency', at:last ? last.at : null, changes:{} };
  const changes = {};
  for (const minutes of [5,15,60]) {
    const target = Date.parse(last.at) - minutes * 60000;
    const candidates = pts.filter(p => Math.abs(Date.parse(p.at)-target) <= 120000);
    const best = candidates.sort((a,b)=>Math.abs(Date.parse(a.at)-target)-Math.abs(Date.parse(b.at)-target))[0];
    changes[minutes] = best ? {
      fromHz:+best.hz.toFixed(4), toHz:+last.hz.toFixed(4),
      deltaMHz:Math.round((last.hz-best.hz)*1000),
      fromAt:best.at, toAt:last.at,
      deviationFrom50MHz:Math.round((last.hz-50)*1000)
    } : null;
  }
  return { ok:true, at:last.at, latestHz:+last.hz.toFixed(4), changes, samples:pts.length, availableMinutes:Math.round((Date.parse(last.at)-Date.parse(pts[0].at))/60000) };
}
async function continental() {
  const end = new Date(Date.now()-30000), start = new Date(Date.now()-80*60000);
  const q = new URLSearchParams({ region:'DE-Freiburg', start:start.toISOString(), end:end.toISOString() });
  const raw = await json('https://api.energy-charts.info/v2/frequency?' + q);
  return {...measure(energyRows(raw)), name:'Ηπειρωτική Ευρώπη', source:'Energy-Charts / Freiburg sensor', sourceUrl:'https://www.energy-charts.info/charts/frequency/chart.htm', scope:'One published frequency sensor, not line loading' };
}
async function britain() {
  const end = new Date(), start = new Date(Date.now()-80*60000);
  const q = new URLSearchParams({from:start.toISOString(), to:end.toISOString()});
  const raw = await json('https://data.elexon.co.uk/bmrs/api/v1/system/frequency?' + q);
  const arr = Array.isArray(raw) ? raw : Array.isArray(raw && raw.data) ? raw.data : [];
  const pts = arr.map(p=>({ at:ISO(p.measurementTime || p.startTime || p.time), hz:val(p.frequency) })).filter(p=>p.at && p.hz > 45 && p.hz < 55);
  return {...measure(pts), name:'Μεγάλη Βρετανία', source:'Elexon BMRS / FREQ', sourceUrl:'https://bmrs.elexon.co.uk/system-frequency', scope:'Frequency observations; not blackout forecast' };
}
module.exports = async (req,res) => {
  if (req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  const [ce,gb] = await Promise.allSettled([continental(),britain()]);
  const failed = (source,sourceUrl) => ({ok:false,at:null,changes:{},source,sourceUrl,reason:'Public source unavailable'});
  res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=120');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(200).json({
    fetchedAt:new Date().toISOString(),
    metric:'Measured frequency change (mHz), not failure risk',
    windowsMinutes:[5,15,60],
    ce:ce.status==='fulfilled' ? ce.value : failed('Energy-Charts','https://www.energy-charts.info/'),
    gb:gb.status==='fulfilled' ? gb.value : failed('Elexon','https://bmrs.elexon.co.uk/'),
    note:'Only windows with source measurements near the requested interval are returned. A missing reading is not zero.'
  });
};
module.exports._test = {measure,energyRows};