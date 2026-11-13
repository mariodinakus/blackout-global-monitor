(() => {
  'use strict';
  const C = {"AW":[12.5,-70],"AF":[33,65],"AO":[-12.5,18.5],"AI":[18.3,-63.2],"AX":[60.1,19.9],"AL":[41,20],"AD":[42.5,1.5],"AE":[24,54],"AR":[-34,-64],"AM":[40,45],"AS":[-14.3,-170],"AQ":[-90,0],"TF":[-49.2,69.2],"AG":[17.1,-61.8],"AU":[-27,133],"AT":[47.3,13.3],"AZ":[40.5,47.5],"BI":[-3.5,30],"BE":[50.8,4],"BJ":[9.5,2.3],"BF":[13,-2],"BD":[24,90],"BG":[43,25],"BH":[26,50.6],"BS":[24.3,-76],"BA":[44,18],"BL":[18.5,-63.4],"SH":[-15.9,-5.7],"BY":[53,28],"BZ":[17.3,-88.7],"BM":[32.3,-64.7],"BO":[-17,-65],"BQ":[12.2,-68.2],"BR":[-10,-55],"BB":[13.2,-59.5],"BN":[4.5,114.7],"BT":[27.5,90.5],"BV":[-54.4,3.4],"BW":[-22,24],"CF":[7,21],"CA":[60,-95],"CC":[-12.5,96.8],"CH":[47,8],"CL":[-30,-71],"CN":[35,105],"CI":[8,-5],"CM":[6,12],"CD":[0,25],"CG":[-1,15],"CK":[-21.2,-159.8],"CO":[4,-72],"KM":[-12.2,44.3],"CV":[16,-24],"CR":[10,-84],"CU":[21.5,-80],"CW":[12.1,-68.9],"CX":[-10.5,105.7],"KY":[19.5,-80.5],"CY":[35,33],"CZ":[49.8,15.5],"DE":[51,9],"DJ":[11.5,43],"DM":[15.4,-61.3],"DK":[56,10],"DO":[19,-70.7],"DZ":[28,3],"EC":[-2,-77.5],"EG":[27,30],"ER":[15,39],"EH":[24.5,-13],"ES":[40,-4],"EE":[59,26],"ET":[8,38],"FI":[64,26],"FJ":[-18,175],"FK":[-51.7,-59],"FR":[46,2],"FO":[62,-7],"FM":[6.9,158.3],"GA":[-1,11.8],"GB":[54,-2],"GE":[42,43.5],"GG":[49.5,-2.6],"GH":[8,-2],"GI":[36.1,-5.3],"GN":[11,-10],"GP":[16.3,-61.6],"GM":[13.5,-16.6],"GW":[12,-15],"GQ":[2,10],"GR":[39,22],"GD":[12.1,-61.7],"GL":[72,-40],"GT":[15.5,-90.2],"GF":[4,-53],"GU":[13.5,144.8],"GY":[5,-59],"HK":[22.3,114.2],"HM":[-53.1,72.5],"HN":[15,-86.5],"HR":[45.2,15.5],"HT":[19,-72.4],"HU":[47,20],"ID":[-5,120],"IM":[54.3,-4.5],"IN":[20,77],"IO":[-6,71.5],"IE":[53,-8],"IR":[32,53],"IQ":[33,44],"IS":[65,-18],"IL":[31.5,35.1],"IT":[42.8,12.8],"JM":[18.3,-77.5],"JE":[49.3,-2.2],"JO":[31,36],"JP":[36,138],"KZ":[48,68],"KE":[1,38],"KG":[41,75],"KH":[13,105],"KI":[1.4,173],"KN":[17.3,-62.7],"KR":[37,127.5],"XK":[42.7,21.2],"KW":[29.5,45.8],"LA":[18,105],"LB":[33.8,35.8],"LR":[6.5,-9.5],"LY":[25,17],"LC":[13.9,-61],"LI":[47.3,9.5],"LK":[7,81],"LS":[-29.5,28.5],"LT":[56,24],"LU":[49.8,6.2],"LV":[57,25],"MO":[22.2,113.6],"MF":[18.1,-63.9],"MA":[32,-5],"MC":[43.7,7.4],"MD":[47,29],"MG":[-20,47],"MV":[3.3,73],"MX":[23,-102],"MH":[9,168],"MK":[41.8,22],"ML":[17,-4],"MT":[35.8,14.6],"MM":[22,98],"ME":[42.5,19.3],"MN":[46,105],"MP":[15.2,145.8],"MZ":[-18.2,35],"MR":[20,-12],"MS":[16.8,-62.2],"MQ":[14.7,-61],"MU":[-20.3,57.6],"MW":[-13.5,34],"MY":[2.5,112.5],"YT":[-12.8,45.2],"NA":[-22,17],"NC":[-21.5,165.5],"NE":[16,8],"NF":[-29,168],"NG":[10,8],"NI":[13,-85],"NU":[-19,-169.9],"NL":[52.5,5.8],"NO":[62,10],"NP":[28,84],"NR":[-0.5,166.9],"NZ":[-41,174],"OM":[21,57],"PK":[30,70],"PA":[9,-80],"PN":[-25.1,-130.1],"PE":[-10,-76],"PH":[13,122],"PW":[7.5,134.5],"PG":[-6,147],"PL":[52,20],"PR":[18.3,-66.5],"KP":[40,127],"PT":[39.5,-8],"PY":[-23,-58],"PS":[31.9,35.2],"PF":[-15,-140],"QA":[25.5,51.3],"RE":[-21.1,55.5],"RO":[46,25],"RU":[60,100],"RW":[-2,30],"SA":[25,45],"SD":[15,30],"SN":[14,-14],"SG":[1.4,103.8],"GS":[-54.5,-37],"SJ":[78,20],"SB":[-8,159],"SL":[8.5,-11.5],"SV":[13.8,-88.9],"SM":[43.8,12.4],"SO":[10,49],"PM":[46.8,-56.3],"RS":[44,21],"SS":[7,30],"ST":[1,7],"SR":[4,-56],"SK":[48.7,19.5],"SI":[46.1,14.8],"SE":[62,15],"SZ":[-26.5,31.5],"SX":[18,-63],"SC":[-4.6,55.7],"SY":[35,38],"TC":[21.8,-71.6],"TD":[15,19],"TG":[8,1.2],"TH":[15,100],"TJ":[39,71],"TK":[-9,-172],"TM":[40,60],"TL":[-8.8,125.9],"TO":[-20,-175],"TT":[11,-61],"TN":[34,9],"TR":[39,35],"TV":[-8,178],"TW":[23.5,121],"TZ":[-6,35],"UG":[1,32],"UA":[49,32],"UM":[19.3,166.6],"UY":[-33,-56],"US":[38,-97],"UZ":[41,64],"VA":[41.9,12.5],"VC":[13.3,-61.2],"VE":[8,-66],"VG":[18.4,-64.6],"VI":[18.4,-64.9],"VN":[16.2,107.8],"VU":[-16,167],"WF":[-13.3,-176.2],"WS":[-13.6,-172.3],"YE":[15,48],"ZA":[-29,24],"ZM":[-15,30],"ZW":[-20,30]};
  const GRID = { ce: [47.2, 9.5], gb: [54.3, -2.3], tx: [31.3, -99.2] };
  const VIEWS = { europe: { lat: 46, lng: 12, altitude: 1.5 }, americas: { lat: 20, lng: -85, altitude: 2 }, asia: { lat: 25, lng: 95, altitude: 2 }, africa: { lat: 3, lng: 20, altitude: 2 }, oceania: { lat: -22, lng: 140, altitude: 2 } };
  const COLORS = { calm: '#16a34a', watch: '#ca8a04', stress: '#ea580c', severe: '#dc2626', edge: '#7f1d1d', unknown: '#94a3b8' };
  const IMG = 'https://cdn.jsdelivr.net/npm/three-globe@2.45.6/example/img/';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tAth = iso => iso ? new Date(iso).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Athens' }) : '—';
  const el = document.getElementById('map'), info = document.getElementById('mapInfo');
  if (!el) return;
  if (!window.Globe) { el.innerHTML = '<div class="empty" style="padding:20px">Η υδρόγειος δεν φορτώθηκε (χρειάζεται WebGL).</div>'; return; }

  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const show = { net: true, mix: true, grid: true };
  let data = { net: [], mix: [], grid: [] };
  const say = html => { info.innerHTML = html; };

  // No map tiles and no API key: one static earth texture from the three-globe package.
  const globe = new Globe(el)
    .globeImageUrl(IMG + (dark ? 'earth-night.jpg' : 'earth-day.jpg'))
    .backgroundColor('rgba(0,0,0,0)')
    .showAtmosphere(true).atmosphereColor(dark ? '#60a5fa' : '#93c5fd').atmosphereAltitude(0.16)
    .pointLat('lat').pointLng('lng').pointColor('color').pointAltitude(0.012).pointRadius(d => d.ongoing ? 0.75 : 0.5)
    .pointLabel(d => esc(d.title))
    .onPointClick(d => say(d.html))
    .ringLat('lat').ringLng('lng').ringColor(() => t => `rgba(220,38,38,${1 - t})`).ringMaxRadius(3.2).ringPropagationSpeed(1.6).ringRepeatPeriod(1400)
    .htmlLat('lat').htmlLng('lng').htmlAltitude(d => d.kind === 'grid' ? 0.05 : 0.02)
    .htmlElement(d => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = d.kind === 'grid' ? 'gridm' : 'pill';
      b.style[d.kind === 'grid' ? 'borderColor' : 'background'] = d.color;
      b.textContent = d.text; b.title = d.title;
      b.style.pointerEvents = 'auto'; b.style.cursor = 'pointer';
      b.addEventListener('click', () => say(d.html));
      return b;
    });
  const size = () => globe.width(el.clientWidth).height(el.clientHeight);
  size(); addEventListener('resize', size);
  globe.pointOfView(VIEWS.europe, 0);
  const ctl = globe.controls();
  ctl.autoRotate = true; ctl.autoRotateSpeed = 0.35; ctl.enableZoom = false;
  el.addEventListener('pointerdown', () => { ctl.autoRotate = false; ctl.enableZoom = true; }, { once: true });

  function render() {
    globe.pointsData(show.net ? data.net : []);
    globe.ringsData(show.net ? data.net.filter(d => d.ongoing) : []);
    globe.htmlElementsData([...(show.mix ? data.mix : []), ...(show.grid ? data.grid : [])]);
  }

  function build(pulse, out) {
    const net = [], mix = [], grid = [];
    for (const c of out?.internet?.countries || []) {
      const p = C[c.code]; if (!p) continue;
      net.push({ lat: p[0], lng: p[1], ongoing: c.ongoing, color: c.ongoing ? COLORS.severe : COLORS.watch, title: c.country,
        html: `<b>${esc(c.country)}</b> · ${c.ongoing ? 'ενεργή διακοπή Internet' : 'διακοπή Internet που έληξε'} · από ${tAth(c.startedAt)}${c.endedAt ? ' έως ' + tAth(c.endedAt) : ''} · αισθητήρες: ${esc(c.sensors.join(', '))} <span class="muted">· IODA · δεν σημαίνει απαραίτητα διακοπή ρεύματος</span>` });
    }
    for (const s of pulse?.systems || []) {
      if (s.kind === 'structural') {
        const p = C[String(s.id).toUpperCase()]; if (!p) continue;
        const share = s.components[0]?.v || '';
        mix.push({ kind: 'mix', lat: p[0], lng: p[1], color: COLORS[s.tone] || COLORS.unknown, text: parseFloat(share).toFixed(0) + '%', title: s.name,
          html: `<b>${esc(s.name)}</b> · ηλιακά + αιολικά τώρα ${esc(share)} · μέγιστο 24h ${esc(s.components[1]?.v)} · φορτίο ${esc(s.components[2]?.v)} · ${esc(s.label)} <span class="muted">· δεδομένα ${tAth(s.at)} · Energy-Charts · Ισπανία 28/4/2025 ≈70%</span>` });
      } else if (GRID[s.id]) {
        grid.push({ kind: 'grid', lat: GRID[s.id][0], lng: GRID[s.id][1], color: COLORS[s.tone] || COLORS.unknown, text: String(s.score ?? '—'), title: s.name,
          html: `<b>${esc(s.name)}</b> · ${s.score ?? '—'}/100 · ${esc(s.label)} · ${s.components.map(c => esc(c.k) + ' ' + esc(c.v)).join(' · ')} <span class="muted">· μέτρηση ${tAth(s.at)} · ${esc(s.source)}</span>` });
      }
    }
    data = { net, mix, grid };
    render();
  }

  async function refresh() {
    const get = u => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null);
    const [pulse, out] = await Promise.all([get('/api/pulse'), get('/api/outages')]);
    if (pulse || out) build(pulse, out);
  }

  document.getElementById('mapLayers').addEventListener('click', e => {
    const b = e.target.closest('[data-l]'); if (!b) return;
    show[b.dataset.l] = b.classList.toggle('on'); render();
  });
  document.getElementById('mapViews').addEventListener('click', e => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    ctl.autoRotate = false; globe.pointOfView(VIEWS[b.dataset.v], 900);
  });
  refresh(); setInterval(() => { if (!document.hidden) refresh(); }, 60000);
})();
