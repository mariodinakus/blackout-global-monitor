'use strict';
/**
 * /api/outages — what is actually down right now.
 * 1) IODA (Georgia Tech): country-level Internet outages — often the first trace of a power cut.
 * 2) Official status pages of major cloud / platform providers.
 * 3) Google News: reports of power outages and of cyberattacks in the last 24h (reports, not confirmed events).
 * 4) CISA KEV: vulnerabilities confirmed as exploited in real attacks.
 */
const UA = { Accept: 'application/json', 'User-Agent': 'BLACKOUT-Outages/3.0 (public monitor)' };
const num = v => (v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null);
async function get(url, ms = 9000, type = 'json') {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw Error('HTTP ' + r.status);
  return type === 'json' ? r.json() : r.text();
}
const arr = d => Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.data?.events) ? d.data.events : [];

async function ioda() {
  const now = Math.floor(Date.now() / 1000), from = now - 24 * 3600;
  const d = await get(`https://api.ioda.inetintel.cc.gatech.edu/v2/outages/events?entityType=country&from=${from}&until=${now}&format=codf&limit=200`, 11000);
  const byCountry = new Map();
  for (const e of arr(d)) {
    const loc = String(e.location || '');
    if (!loc.startsWith('country/')) continue;
    const start = num(e.start), dur = num(e.duration);
    if (!start) continue;
    const end = dur ? start + dur : null;
    const code = loc.slice(8).toUpperCase();
    const ongoing = !end || end >= now - 3600;
    const cur = byCountry.get(code) || { code, country: String(e.location_name || code), sensors: new Set(), startedAt: start, endedAt: end, ongoing: false };
    cur.sensors.add(String(e.datasource || 'ioda'));
    cur.startedAt = Math.min(cur.startedAt, start);
    cur.endedAt = cur.endedAt === null || end === null ? null : Math.max(cur.endedAt, end);
    cur.ongoing = cur.ongoing || ongoing;
    byCountry.set(code, cur);
  }
  const list = [...byCountry.values()].map(c => ({
    code: c.code, country: c.country, sensors: [...c.sensors], ongoing: c.ongoing,
    startedAt: new Date(c.startedAt * 1000).toISOString(), endedAt: c.endedAt ? new Date(c.endedAt * 1000).toISOString() : null,
    confidence: c.sensors.size >= 2 ? 'high' : 'single-sensor'
  })).sort((a, b) => (b.ongoing - a.ongoing) || (b.sensors.length - a.sensors.length) || Date.parse(b.startedAt) - Date.parse(a.startedAt));
  return { countries: list, ongoing: list.filter(c => c.ongoing).length, source: 'IODA · Georgia Tech', sourceUrl: 'https://ioda.inetintel.cc.gatech.edu/' };
}

const STATUSPAGES = [
  ['Cloudflare', 'https://www.cloudflarestatus.com'], ['GitHub', 'https://www.githubstatus.com'], ['OpenAI', 'https://status.openai.com'],
  ['Discord', 'https://discordstatus.com'], ['Zoom', 'https://status.zoom.us'], ['Atlassian', 'https://status.atlassian.com'],
  ['DigitalOcean', 'https://status.digitalocean.com'], ['Vercel', 'https://www.vercel-status.com'], ['Anthropic', 'https://status.anthropic.com'],
  ['Reddit', 'https://www.redditstatus.com'], ['Dropbox', 'https://status.dropbox.com'], ['Twilio', 'https://status.twilio.com'],
  ['Datadog', 'https://status.datadoghq.com'], ['Figma', 'https://status.figma.com'], ['Shopify', 'https://www.shopifystatus.com'],
  ['Coinbase', 'https://status.coinbase.com'], ['Notion', 'https://www.notion-status.com']
];
async function statuspage([name, base]) {
  const d = await get(base + '/api/v2/summary.json', 7000);
  const incidents = (d.incidents || []).filter(i => !['resolved', 'completed', 'postmortem'].includes(i.status)).slice(0, 4)
    .map(i => ({ name: String(i.name || '').slice(0, 160), status: i.status, impact: i.impact, at: i.updated_at || i.created_at }));
  return { name, url: base, indicator: d.status?.indicator || 'none', description: d.status?.description || '', incidents };
}
async function googleCloud() {
  const d = await get('https://status.cloud.google.com/incidents.json', 8000);
  const open = (Array.isArray(d) ? d : []).filter(i => !i.end).slice(0, 4);
  return { name: 'Google Cloud', url: 'https://status.cloud.google.com/', indicator: open.length ? (open.some(i => /high|outage/i.test(i.severity || i.status_impact || '')) ? 'major' : 'minor') : 'none', description: open.length ? `${open.length} ενεργά περιστατικά` : 'All systems operational', incidents: open.map(i => ({ name: String(i.external_desc || '').slice(0, 160), status: i.most_recent_update?.status || 'ongoing', impact: i.severity, at: i.modified || i.begin })) };
}
async function azure() {
  const x = await get('https://azure.status.microsoft/en-us/status/feed/', 8000, 'text');
  const items = [...x.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => ({ name: (m[1].match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1] || '', at: (m[1].match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || null }))
    .filter(i => i.at && Date.now() - Date.parse(i.at) < 24 * 3600e3).slice(0, 4);
  return { name: 'Microsoft Azure', url: 'https://azure.status.microsoft/', indicator: items.length ? 'major' : 'none', description: items.length ? 'Ανακοινώσεις τελευταίων 24h' : 'Καμία ανακοίνωση 24h', incidents: items.map(i => ({ name: i.name.trim().slice(0, 160), status: 'reported', at: new Date(i.at).toISOString() })) };
}
async function aws() {
  // AWS publishes this file as UTF-16; decode by BOM
  const r = await fetch('https://health.aws.amazon.com/public/currentevents', { headers: UA, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw Error('HTTP ' + r.status);
  const buf = new Uint8Array(await r.arrayBuffer());
  const enc = buf[0] === 0xfe && buf[1] === 0xff ? 'utf-16be' : buf[0] === 0xff && buf[1] === 0xfe ? 'utf-16le' : 'utf-8';
  const d = JSON.parse(new TextDecoder(enc).decode(buf).replace(/^\uFEFF/, '') || '[]');
  const open = (Array.isArray(d) ? d : []).slice(0, 4);
  return { name: 'Amazon Web Services', url: 'https://health.aws.amazon.com/health/status', indicator: open.length ? 'major' : 'none', description: open.length ? `${open.length} ενεργά περιστατικά` : 'No open events', incidents: open.map(i => ({ name: String((i.service_name || '') + (i.region_name ? ' · ' + i.region_name : '') + ': ' + (i.summary || '')).slice(0, 160), status: 'ongoing', at: num(i.date) ? new Date(num(i.date) * 1000).toISOString() : null })) };
}
async function slack() {
  const d = await get('https://slack-status.com/api/v2.0.0/current', 7000);
  const inc = (d.active_incidents || []).slice(0, 4);
  return { name: 'Slack', url: 'https://slack-status.com/', indicator: inc.length ? (inc.some(i => i.type === 'outage') ? 'major' : 'minor') : 'none', description: inc.length ? `${inc.length} ενεργά περιστατικά` : 'All systems operational', incidents: inc.map(i => ({ name: String(i.title || '').slice(0, 160), status: i.status || i.type, at: i.date_updated || i.date_created || null })) };
}
async function providers() {
  const jobs = [...STATUSPAGES.map(s => () => statuspage(s)), googleCloud, azure, aws, slack];
  const names = [...STATUSPAGES.map(s => s[0]), 'Google Cloud', 'Microsoft Azure', 'Amazon Web Services', 'Slack'];
  const res = await Promise.all(jobs.map(async (fn, i) => { try { return { ok: true, ...(await fn()) }; } catch { return { ok: false, name: names[i], indicator: 'unknown', incidents: [] }; } }));
  const rank = { critical: 4, major: 3, minor: 2, maintenance: 1, none: 0, unknown: -1 };
  return res.sort((a, b) => (rank[b.indicator] ?? 0) - (rank[a.indicator] ?? 0));
}

const Q_POWER = '"power outage" OR "power cut" OR "load shedding" OR "grid failure" OR "electricity blackout"';
const Q_CYBER = 'cyberattack OR "cyber attack" OR ransomware OR "data breach" OR DDoS';
async function news(query) {
  // Google News RSS: fast and broad. Reports only — not confirmed incidents.
  const x = await get('https://news.google.com/rss/search?q=' + encodeURIComponent(query + ' when:1d') + '&hl=en-US&gl=US&ceid=US:en', 8000, 'text');
  const tag = (b, t) => ((b.match(new RegExp('<' + t + '[^>]*>([\\s\\S]*?)</' + t + '>')) || [])[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
  const seen = new Set();
  return [...x.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
    const full = tag(m[1], 'title'), src = tag(m[1], 'source');
    const title = src && full.endsWith(' - ' + src) ? full.slice(0, -(src.length + 3)) : full;
    const at = tag(m[1], 'pubDate');
    return { title: title.slice(0, 200), url: tag(m[1], 'link'), domain: src, at: at ? new Date(at).toISOString() : null };
  }).filter(a => { const k = a.title.toLowerCase().slice(0, 50); if (!/^https?:/.test(a.url) || seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => Date.parse(b.at || 0) - Date.parse(a.at || 0)).slice(0, 15);
}

async function kev() {
  // CISA Known Exploited Vulnerabilities: flaws confirmed as used in real attacks
  const d = await get('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', 11000);
  const all = (d.vulnerabilities || []).sort((a, b) => String(b.dateAdded).localeCompare(String(a.dateAdded)));
  const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const recent = all.filter(v => String(v.dateAdded) >= since);
  return { added14d: recent.length, ransomware14d: recent.filter(v => /known/i.test(v.knownRansomwareCampaignUse || '') && !/unknown/i.test(v.knownRansomwareCampaignUse)).length,
    items: all.slice(0, 8).map(v => ({ cve: String(v.cveID || ''), vendor: String(v.vendorProject || ''), product: String(v.product || ''), name: String(v.vulnerabilityName || '').slice(0, 140), added: String(v.dateAdded || ''), ransomware: /known/i.test(v.knownRansomwareCampaignUse || '') && !/unknown/i.test(v.knownRansomwareCampaignUse) })) };
}

module.exports = async (req, res) => {
  const wrap = async fn => { try { return { ok: true, value: await fn() }; } catch (e) { return { ok: false, reason: String(e.message).slice(0, 60) }; } };
  const [i, p, n, cn, k] = await Promise.all([wrap(ioda), wrap(providers), wrap(() => news(Q_POWER)), wrap(() => news(Q_CYBER)), wrap(kev)]);
  const prov = p.ok ? p.value : [];
  const body = {
    fetchedAt: new Date().toISOString(),
    internet: i.ok ? i.value : { countries: [], ongoing: null, reason: i.reason, source: 'IODA', sourceUrl: 'https://ioda.inetintel.cc.gatech.edu/' },
    providers: prov,
    providersDown: prov.filter(x => ['major', 'critical'].includes(x.indicator)).length,
    providersDegraded: prov.filter(x => x.indicator === 'minor').length,
    news: n.ok ? n.value : [], newsOk: n.ok, newsReason: n.ok ? undefined : n.reason,
    cyber: { news: cn.ok ? cn.value : [], newsOk: cn.ok, kev: k.ok ? k.value : null },
    note: 'Διακοπές Internet ανιχνεύονται από αισθητήρες, όχι από διαχειριστές ρεύματος. Οι ειδήσεις είναι αναφορές, όχι επιβεβαιωμένα συμβάντα.'
  };
  res.setHeader('Cache-Control', 'public, s-maxage=90, stale-while-revalidate=120');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = 200;
  res.end(JSON.stringify(body));
};
