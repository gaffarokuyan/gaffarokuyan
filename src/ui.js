import * as G from './game.js';
import { stars } from './loom.js';
import { DICT, LANG_NAMES, logText } from './i18n.js';
import { icon, cityArt, TILE_ICON } from './icons.js';

// Dil: oyuncunun seçtiği; seçmediyse telefonun dili (Türkçe, Kürtçe ya da İngilizce).
const LANG_KEY = 'karwan-lang';
function detectLang() {
  const saved = store(LANG_KEY);
  if (saved && DICT[saved]) return saved;
  for (const l of navigator.languages?.length ? navigator.languages : [navigator.language || '']) {
    const c = l.toLowerCase();
    if (c.startsWith('tr')) return 'tr';
    if (c.startsWith('ku') || c.startsWith('kmr')) return 'ku';
    if (c.startsWith('en')) return 'en';
  }
  return 'en';
}
let lang, d, u;
function setLang(l) {
  lang = l; d = DICT[l]; u = d.ui;
  document.documentElement.lang = l;
}
setLang(detectLang());

const KEY = 'kervan-v3';
const TUT_KEY = 'kervan-tutorial-v1';
const rng = Math.random;
const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const app = document.getElementById('app');

let s;
let view = 'route';
let anim = null; // zar ve hareket animasyonu sürerken: { pos, face, rolling }
let toast = null;
let toastTimer = 0;
let tut = null; // öğretici adımı ya da null
let confirmReset = false;
let langOpen = false; // dil seçici açık mı
let lastSheet = ''; // giriş animasyonu yalnızca yeni açılan sayfada oynasın
let lastGold = null;

// Android uygulamasında yerel köprü: dokunsal geri bildirim. Tarayıcıda yoksa sessizce geçer.
const haptic = (kind) => { try { window.KarwanNative?.haptic(kind); } catch { /* köprü yok */ } };

const fmt = (n) => Math.round(n).toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR');
const N = G.TILES.length;

function store(get, set) {
  try { return set === undefined ? localStorage.getItem(get) : localStorage.setItem(get, set); } catch { return null; }
}
function restore(data) {
  if (data?.v === 3) return data;
  try {
    const saved = JSON.parse(store(KEY));
    if (saved?.v === 3) return saved;
  } catch { /* kayıt yoksa yeni oyun */ }
  return G.newGame();
}
const save = () => store(KEY, JSON.stringify(s));

const tileName = (i) => {
  const t = G.TILES[i];
  return t.type === 'sehir' ? d.cities[t.city] : d.tiles[t.type];
};
const tileArt = (t) => (t.type === 'sehir' ? cityArt(t.city) : icon(TILE_ICON[t.type]));

function cell(i) {
  if (i <= 6) return [1, i + 1];
  if (i <= 12) return [i - 5, 7];
  if (i <= 18) return [7, 19 - i];
  return [25 - i, 1];
}

const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
// Üç boyutlu zar: karşılıklı yüzlerin toplamı 7. ORIENT, istenen yüzü öne getiren küp dönüşü [x, y].
const FACE_AT = { 1: '', 2: 'rotateY(90deg)', 3: 'rotateX(90deg)', 4: 'rotateX(-90deg)', 5: 'rotateY(-90deg)', 6: 'rotateY(180deg)' };
const ORIENT = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };
let dieTilt = -6; // zar masaya hafif yamuk düşer; açı çizimler arasında korunur
const cubeTransform = (x, y, z) => `rotateZ(${z}deg) rotateX(${x}deg) rotateY(${y}deg)`;

function die(face) {
  const shown = face || 6;
  const [x, y] = ORIENT[shown];
  const faces = [1, 2, 3, 4, 5, 6].map((f) => `<div class="face" style="transform:${FACE_AT[f]} translateZ(var(--half))">
      ${Array.from({ length: 9 }, (_, k) => `<i class="${PIPS[f].includes(k) ? (f === 1 ? 'on red' : 'on') : ''}"></i>`).join('')}</div>`).join('');
  return `<div class="die3d" aria-label="${face ? `${u.lastRoll}: ${face}` : u.lastRoll}">
    <span class="die-shadow"></span>
    <div class="die-toss"><div class="cube" style="transform:${cubeTransform(x, y, dieTilt)}">
      <span class="core cx"></span><span class="core cy"></span><span class="core cz"></span>${faces}
    </div></div>
  </div>`;
}

// Zarı havaya atar, iki eksende yuvarlar, sekerek "face" yüzüne düşürür. Süre: ms.
const TOSS_MS = 900;
function tossDie(from, face) {
  const root = document.querySelector('.die3d');
  if (!root || !root.animate) return;
  const cube = root.querySelector('.cube');
  const [fx, fy] = ORIENT[from || 6];
  const [tx, ty] = ORIENT[face];
  const spin = () => (Math.random() < 0.5 ? -1 : 1) * 360 * (1 + Math.floor(Math.random() * 2));
  const startTilt = dieTilt;
  dieTilt = Math.round((Math.random() * 2 - 1) * 12);
  cube.style.transform = cubeTransform(tx, ty, dieTilt);
  // Tam turlar eklenir: bitiş açısı görsel olarak hedef yüzle aynıdır, arada zar yuvarlanır.
  cube.animate([
    { transform: cubeTransform(fx, fy, startTilt) },
    { transform: cubeTransform(tx + spin(), ty + spin(), dieTilt) },
  ], { duration: TOSS_MS * 0.86, easing: 'cubic-bezier(.2,.75,.25,1)' });
  root.querySelector('.die-toss').animate([
    { transform: 'translateY(0) scale(1)', easing: 'cubic-bezier(.25,.8,.4,1)' },
    { transform: 'translateY(-58px) scale(1.12)', offset: 0.36, easing: 'cubic-bezier(.6,0,.9,.5)' },
    { transform: 'translateY(0) scale(1)', offset: 0.7, easing: 'cubic-bezier(.3,.8,.5,1)' },
    { transform: 'translateY(-10px) scale(1.02)', offset: 0.83, easing: 'cubic-bezier(.5,0,.8,.5)' },
    { transform: 'translateY(0) scale(1)' },
  ], { duration: TOSS_MS });
  root.querySelector('.die-shadow').animate([
    { transform: 'scale(1)', opacity: 0.55 },
    { transform: 'scale(0.55)', opacity: 0.25, offset: 0.36 },
    { transform: 'scale(1.06)', opacity: 0.6, offset: 0.7 },
    { transform: 'scale(0.9)', opacity: 0.45, offset: 0.83 },
    { transform: 'scale(1)', opacity: 0.55 },
  ], { duration: TOSS_MS });
}

/* ---------- Üst bilgi ---------- */
function hud() {
  const bump = lastGold !== null && lastGold !== s.gold ? ' bump' : '';
  lastGold = s.gold;
  const item = (ic, value, label, cls = '') =>
    `<li class="${cls}">${icon(ic)}<span><b>${value}</b><small>${label}</small></span></li>`;
  return `<header class="hud">
    <div class="brand">
      <h1 class="logo">Karwan</h1>
      <span class="trip">${u.trip(s.laps + 1)}</span>
      <button class="langbtn" data-act="langopen" aria-label="${u.language}: ${LANG_NAMES[lang]}">${lang.toUpperCase()}</button>
      <button class="helpbtn" data-act="help" aria-label="${u.help}">${icon('help')}</button>
    </div>
    <ul class="res">
      ${item('coin', fmt(s.gold), u.gold, `gold${bump}`)}
      ${item('die', s.dice, u.dice)}
      ${item('cargo', `${G.load(s)}/${G.capacity(s)}`, u.cargo)}
      ${item('bonus', `×${s.mult}`, u.mult, s.mult > 1 ? 'hot' : '')}
    </ul>
  </header>`;
}

/* ---------- Yol görünümü ---------- */
function board() {
  const pos = anim ? anim.pos : s.pos;
  const tiles = G.TILES.map((t, i) => {
    const [r, c] = cell(i);
    const here = i === pos;
    const bots = t.type === 'sehir' ? s.bots.filter((b) => b.city === t.city).length : 0;
    return `<div class="tile t-${t.type}${here ? ' here' : ''}" style="grid-area:${r}/${c}" title="${tileName(i)}">
      ${tileArt(t)}
      ${t.type === 'sehir' ? `<span class="tag">${d.cityAbbr[t.city]}</span>` : ''}
      ${bots ? `<span class="bots" aria-label="${u.rivals(bots)}">${'<i></i>'.repeat(bots)}</span>` : ''}
      ${here ? `<span class="camel" aria-label="${u.here}">${icon('camel')}</span>` : ''}
    </div>`;
  }).join('');
  return `<section class="carpet" aria-label="${u.board}">
    <div class="board">
      ${tiles}
      <div class="field">
        <span class="medallion" aria-hidden="true"></span>
        <p class="banner"><span>${tileName(pos)}</span></p>
        ${die(anim ? anim.face : s.lastRoll)}
      </div>
    </div>
  </section>`;
}

function ahead() {
  const pos = anim ? anim.pos : s.pos;
  const items = [1, 2, 3, 4, 5, 6].map((n) => {
    const i = (pos + n) % N;
    const t = G.TILES[i];
    return `<li class="mini t-${t.type}"><span class="n">${n}</span>${tileArt(t)}<span class="nm">${tileName(i)}</span></li>`;
  }).join('');
  return `<section class="block"><h2 class="label">${u.ahead}</h2><ol class="ahead">${items}</ol></section>`;
}

function cargoStrip() {
  const held = G.GOODS.filter((g) => s.cargo[g.id] > 0);
  const body = held.length
    ? `<ul class="chips">${held.map((g) => `<li>${icon(g.id)}<b>${s.cargo[g.id]}</b><span>${d.goods[g.id]}</span></li>`).join('')}</ul>`
    : `<p class="empty">${icon('cargo')}<span>${u.cargoEmpty}</span></p>`;
  return `<section class="block"><h2 class="label">${u.cargo} · ${G.load(s)}/${G.capacity(s)}</h2>${body}</section>`;
}

function goals() {
  const bar = (label, n, m, ic, go) => `<button class="goal" data-act="tab" data-id="${go}">
      ${icon(ic)}<span class="gl">${label}</span><span class="gv">${n}/${m}</span>
      <span class="bar"><i style="width:${(n / m) * 100}%"></i></span></button>`;
  return `<section class="block"><h2 class="label">${u.goals}</h2><div class="goals">
    ${bar(u.tabHan, s.han, G.MAX_HAN, 'inn', 'inn')}
    ${bar(u.tabAlbum, s.album.length, G.MOTIFS.length, 'album', 'album')}
  </div></section>`;
}

const routeView = () => `${board()}${ahead()}${cargoStrip()}${goals()}`;

/* ---------- Han ---------- */
function innView() {
  const max = s.han >= G.MAX_HAN;
  const cost = G.hanCost(s);
  const floors = Array.from({ length: G.MAX_HAN }, (_, i) =>
    `<i class="floor${i < s.han ? ' built' : ''}" style="--w:${100 - i * 12}%"></i>`).reverse().join('');
  const upgrade = max ? '' : `<section class="panel">
      <div class="panel-head"><h3>${u.nextFloor}</h3><span class="price">${icon('coin')}${fmt(cost)}</span></div>
      <ul class="perks"><li>${icon('cargo')}<b>+2</b> ${u.perkCargo}</li><li>${icon('coin')}<b>+100</b> ${u.perkIncome}</li></ul>
      <button class="btn3d orange wide" data-act="upgrade" ${s.gold < cost ? 'disabled' : ''}>${u.upgrade}</button>
      ${s.gold < cost ? `<p class="hint">${u.needGold(fmt(cost - s.gold))}</p>` : ''}
    </section>`;
  return `<section class="inn-hero">
      <div class="building${max ? ' grand' : ''}" aria-label="${u.floorsAria(s.han)}">
        <span class="flag"></span>${floors}<span class="ground"></span>
      </div>
      <h2>${max ? u.hanMax : u.hanFloor(s.han)}</h2>
      <p class="sub">${u.floorOf(s.han, G.MAX_HAN)}</p>
    </section>
    <dl class="stats3">
      <div>${icon('cargo')}<dt>${u.capStat}</dt><dd>${G.capacity(s)}</dd></div>
      <div>${icon('coin')}<dt>${u.incomeStat}</dt><dd>${fmt(100 * s.han)}</dd></div>
      <div>${icon('route')}<dt>${u.tripsStat}</dt><dd>${s.laps}</dd></div>
    </dl>
    ${upgrade}
    <section class="panel row">
      <span class="plate">${icon('guard')}</span>
      <div class="grow"><h3>${u.guards(s.guards)}</h3><p class="sub">${u.guardDesc}</p></div>
      <button class="btn3d teal" data-act="guard" ${s.gold < G.GUARD_COST ? 'disabled' : ''}>${u.hire}<span class="cost">${icon('coin')}${G.GUARD_COST}</span></button>
    </section>
    <button class="link" data-act="reset">${confirmReset ? u.confirmReset : u.reset}</button>`;
}

/* ---------- Albüm ---------- */
function motifArt(m, owned) {
  return `<div class="px${owned ? ' owned' : ''}" aria-hidden="true">${[...m.px].map((b) => `<i class="${b === '1' ? 'on' : ''}"></i>`).join('')}</div>`;
}
function albumView() {
  const n = s.album.length;
  return `<section class="album-head">
      ${icon('album')}
      <div class="grow"><h2 class="title">${u.tabAlbum}</h2><p class="sub">${u.albumDone(n, G.MOTIFS.length)}</p>
      <span class="bar"><i style="width:${(n / G.MOTIFS.length) * 100}%"></i></span></div>
    </section>
    <ul class="album">${G.MOTIFS.map((m) => {
      const owned = s.album.includes(m.id);
      return `<li class="motif${owned ? ' owned' : ''}">
        <div class="frame">${motifArt(m, owned)}${owned ? '' : `<span class="lock">${icon('lock')}</span>`}</div>
        <strong>${owned ? d.motifs[m.id][0] : u.notWoven}</strong>
        <span>${owned ? d.motifs[m.id][1] : u.notWovenHint}</span></li>`;
    }).join('')}</ul>`;
}

/* ---------- Günlük ---------- */
const LOG_ICON = { iyi: 'bonus', kotu: 'ambush', pazar: 'coin', bilgi: 'route' };
function logView() {
  if (!s.log.length) return `<p class="sub">${u.logEmpty}</p>`;
  return `<h2 class="title">${u.tabLog}</h2>
    <ol class="log">${s.log.map((e) => `<li class="k-${e.k}"><span class="plate sm">${icon(LOG_ICON[e.k])}</span><span>${logText(lang, e)}</span></li>`).join('')}</ol>`;
}

/* ---------- Alt bölüm: bildirim, zar, sekme çubuğu ---------- */
function dock() {
  const out = s.dice < 1;
  const roll = view !== 'route' ? '' : out
    ? `<button class="roll btn3d teal" data-act="newday">${icon('die')}<span class="roll-label">${u.newDay}</span></button>`
    : `<button class="roll btn3d orange" data-act="roll" aria-label="${u.roll}, ${u.diceLeft(s.dice)}" ${anim ? 'disabled' : ''}>
        ${icon('die')}<span class="roll-label">${u.roll}</span><span class="count"><b>${s.dice}</b><small>${u.dice}</small></span></button>`;
  const toastHtml = toast && view === 'route'
    ? `<div class="toast k-${toast.k}${toast.fresh ? ' enter' : ''}" role="status"><span class="plate sm">${icon(LOG_ICON[toast.k])}</span><span>${toast.text}</span></div>`
    : '';
  const tabs = [['route', u.tabRoute, 'route'], ['inn', u.tabInn, 'inn'], ['album', u.tabAlbum, 'album'], ['log', u.tabLogShort, 'log']];
  return `<div class="dock"><div class="dock-in">
    ${toastHtml}${roll}
    <nav class="tabbar" aria-label="Menu">${tabs.map(([id, name, ic]) =>
      `<button data-act="tab" data-id="${id}" ${view === id ? 'aria-current="page"' : ''}><span class="tab-ic">${icon(ic)}</span><span>${name}</span>${id === 'album' && s.album.length ? `<em>${s.album.length}</em>` : ''}</button>`).join('')}</nav>
  </div></div>`;
}

/* ---------- Pazar ---------- */
function market(p) {
  const city = d.cities[p.city];
  const load = G.load(s);
  const cap = G.capacity(s);
  const rivals = s.bots.filter((b) => b.city === p.city).map((b) => d.bots[b.id]);
  const rows = G.GOODS.map((g) => {
    const r = G.ratio(s, p.city, g.id);
    const tag = r < 0.8 ? `<span class="pill cheap">${u.cheap}</span>` : r > 1.3 ? `<span class="pill dear">${u.dear}</span>` : '';
    const buyP = G.price(s, p.city, g.id);
    const canBuy = s.gold >= buyP && load < cap && s.stock[p.city][g.id] >= 2;
    const have = s.cargo[g.id];
    const sp = G.sellPrice(s, p.city, g.id);
    const diff = sp - G.avgCost(s, g.id);
    const trend = have ? (diff >= 0 ? 'up' : 'down') : '';
    return `<li class="good">
      <span class="plate goods-plate">${icon(g.id)}</span>
      <div class="gmeta">
        <div class="gname"><strong>${d.goods[g.id]}</strong>${tag}</div>
        <span class="gsub">${have ? u.holding(have, fmt(G.avgCost(s, g.id))) : u.youHave(0)}</span>
        ${have > 1 ? `<button class="link sm" data-act="sellall" data-id="${g.id}">${u.sellAll(have)}</button>` : ''}
      </div>
      <button class="trade btn3d teal" data-act="buy" data-id="${g.id}" ${canBuy ? '' : 'disabled'}><small>${u.buy}</small><b>${fmt(buyP)}</b></button>
      <button class="trade btn3d gold ${trend}" data-act="sell" data-id="${g.id}" ${have ? '' : 'disabled'}>
        ${have ? `<em class="delta">${diff >= 0 ? '+' : '−'}${fmt(Math.abs(diff))}</em>` : ''}<small>${u.sell}</small><b>${fmt(sp)}</b></button>
    </li>`;
  }).join('');
  return `<div class="sheet parchment" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
    <span class="band" aria-hidden="true"></span>
    <header class="sheet-head">
      <span class="plate big">${cityArt(p.city)}</span>
      <div><h2 id="sheet-title">${u.market(city)}</h2>
      <p class="sub">${rivals.length ? u.alsoHere(rivals.join(', ')) : u.marketSub}</p></div>
    </header>
    <div class="meters">
      <span class="purse">${icon('coin')}<b>${fmt(s.gold)}</b></span>
      <span class="capbar"><small>${icon('cargo')}${u.cargo} ${load}/${cap}</small><span class="bar"><i style="width:${(load / cap) * 100}%"></i></span></span>
    </div>
    ${s.mult > 1 ? `<p class="note">${icon('bonus')}<span>${u.multNote(s.mult)}</span></p>` : ''}
    <ul class="goods">${rows}</ul>
    <div class="sheet-foot"><button class="btn3d orange wide" data-act="leave">${u.onward}</button></div>
  </div>`;
}

/* ---------- Tezgâh ---------- */
function confetti() {
  const colors = ['#f2b632', '#c8372d', '#2fa7a0', '#4a74c9', '#f6ead0', '#e45c8a'];
  return `<span class="confetti" aria-hidden="true">${Array.from({ length: 28 }, (_, i) =>
    `<i style="--x:${(i * 37) % 100}%;--d:${(i % 7) * 0.09}s;--r:${(i * 53) % 360}deg;--c:${colors[i % colors.length]}"></i>`).join('')}</span>`;
}

function loom(p) {
  const z = p.puzzle;
  const kilim = z.rows.map((c, i) => {
    const state = i < z.row ? 'done' : i === z.row && z.status === 'play' ? 'now' : 'todo';
    const fill = state === 'now' ? z.woven : state === 'done' ? z.per : 0;
    return `<li class="weft ${state} th-${c}" aria-label="${u.rowAria(i + 1, d.threads[c])}">
      ${Array.from({ length: z.per }, (_, k) => `<i class="${k < fill ? 'in' : ''}"></i>`).join('')}</li>`;
  }).join('');
  const warn = z.buf.length >= z.cap - 1 ? ' warn' : '';
  const buf = Array.from({ length: z.cap }, (_, i) =>
    `<i class="slot">${z.buf[i] ? `<span class="spool th-${z.buf[i]}"></span>` : ''}</i>`).join('');

  let body;
  if (z.status === 'play') {
    const cols = z.cols.map((col, c) => `<button class="peg" data-act="tap" data-id="${c}" ${col.length ? '' : 'disabled'}
        aria-label="${col.length ? u.colAria(c + 1, d.threads[col[col.length - 1]]) : u.colEmpty(c + 1)}">
        ${col.map((t, i) => `<span class="spool th-${t}${i === col.length - 1 ? ' top' : ''}"></span>`).join('')}</button>`).join('');
    const need = z.rows[z.row];
    body = `<div class="pegs">${cols}</div>
      <p class="need">${u.nextColor} <span class="chip th-${need}"><i></i>${d.threads[need]}</span></p>
      <p class="sub">${u.best(z.best)}</p>`;
  } else {
    const n = stars(z);
    const next = n >= 2 ? G.MOTIFS.find((m) => !s.album.includes(m.id)) : null;
    body = `<div class="result${n === 3 ? ' perfect' : ''}${n === 0 ? ' failed' : ''}">
      ${n === 3 ? confetti() : ''}
      <div class="burst"><p class="stars" aria-label="${u.starsAria(n)}">${[1, 2, 3].map((k) => `<span class="${k <= n ? 'on' : ''}" style="--k:${k}">${icon('bonus')}</span>`).join('')}</p></div>
      <p class="result-text">${n ? u.loomWon(G.MULT_BY_STARS[n]) : u.loomLost}</p>
      ${next ? `<div class="reward">${motifArt(next, true)}<div><small>${u.newMotif}</small><strong>${d.motifs[next.id][0]}</strong><span>${d.motifs[next.id][1]}</span></div></div>` : ''}
    </div>
    <div class="sheet-foot"><button class="btn3d orange wide" data-act="finish">${u.onward}</button></div>`;
  }
  return `<div class="sheet parchment loom" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
    <span class="band" aria-hidden="true"></span>
    <header class="sheet-head">
      <span class="plate big">${icon('loom')}</span>
      <div><h2 id="sheet-title">${u.loom}</h2><p class="sub">${z.status === 'play' ? u.loomHow : ''}</p></div>
    </header>
    <div class="loomframe"><ol class="kilim">${kilim}</ol></div>
    <div class="shuttle${warn}">
      <p class="label">${u.shuttle} <b>${z.buf.length}/${z.cap}</b> <span>${u.shuttleHint}</span></p>
      <div class="boat">${buf}</div>
    </div>
    ${body}
  </div>`;
}

/* ---------- Öğretici ---------- */
const TUT_ART = { die: () => icon('die'), city: () => cityArt(5), loom: () => icon('loom'), inn: () => icon('inn') };
function tutorial() {
  const steps = u.tutorial;
  const [ic, title, text] = steps[tut];
  const last = tut === steps.length - 1;
  return `<div class="scrim center"><div class="tut parchment" role="dialog" aria-modal="true" aria-labelledby="tut-title">
    <span class="band" aria-hidden="true"></span>
    <div class="tut-art"><span class="rays" aria-hidden="true"></span>${TUT_ART[ic]()}</div>
    <p class="label">${u.stepOf(tut + 1, steps.length)}</p>
    <h2 id="tut-title">${title}</h2>
    <p class="tut-text">${text}</p>
    <div class="dots">${steps.map((_, i) => `<i class="${i === tut ? 'on' : ''}"></i>`).join('')}</div>
    <div class="tut-act">
      ${last ? '<span></span>' : `<button class="link" data-act="tutskip">${u.skip}</button>`}
      <button class="btn3d orange" data-act="tutnext">${last ? u.start : u.next}</button>
    </div>
  </div></div>`;
}

/* ---------- Dil seçici ---------- */
function langPicker() {
  return `<div class="scrim center"><div class="tut parchment langpick" role="dialog" aria-modal="true" aria-labelledby="lang-title">
    <span class="band" aria-hidden="true"></span>
    <h2 id="lang-title">Dil · Language · Ziman</h2>
    <div class="langs">${Object.entries(LANG_NAMES).map(([k, name]) =>
      `<button class="btn3d ${k === lang ? 'orange' : 'teal'} wide" data-act="setlang" data-id="${k}" ${k === lang ? 'aria-current="true"' : ''}>${name}</button>`).join('')}</div>
  </div></div>`;
}

/* ---------- Çizim ---------- */
const VIEWS = { route: routeView, inn: innView, album: albumView, log: logView };

function render() {
  const p = s.pending;
  const key = p && !anim ? `${p.type}:${p.city ?? p.puzzle.rows.join('')}:${s.pos}:${s.dice}` : '';
  const enter = key && key !== lastSheet ? ' enter' : '';
  lastSheet = key;
  const sheet = key ? `<div class="scrim${enter}">${p.type === 'pazar' ? market(p) : loom(p)}</div>` : '';
  const scrollY = window.scrollY;
  const sheetScroll = document.querySelector('.sheet')?.scrollTop ?? 0;
  app.innerHTML = `<div class="sky" aria-hidden="true"></div><div class="shell">${hud()}<main class="view view-${view}">${VIEWS[view]()}</main></div>${dock()}${sheet}${tut !== null && !langOpen ? tutorial() : ''}${langOpen ? langPicker() : ''}`;
  window.scrollTo(0, scrollY);
  if (!enter && sheetScroll) { const el = document.querySelector('.sheet'); if (el) el.scrollTop = sheetScroll; }
  if (toast) toast.fresh = false;
  save();
}

// Altın değişince dokunulan düğmenin üstünde "+45" gibi bir rakam süzülür.
function floater(el, diff) {
  if (!diff || reduceMotion) return;
  const r = el.getBoundingClientRect();
  const f = document.createElement('div');
  f.className = `floater ${diff > 0 ? 'up' : 'down'}`;
  f.innerHTML = `${icon('coin')}<b>${diff > 0 ? '+' : '−'}${fmt(Math.abs(diff))}</b>`;
  f.style.left = `${r.left + r.width / 2}px`;
  f.style.top = `${r.top}px`;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 950);
}

function showToast(events) {
  clearTimeout(toastTimer);
  const e = events.find((x) => x.k === 'kotu') || events[0];
  toast = e ? { k: e.k, text: logText(lang, e), fresh: true } : null;
  if (toast) toastTimer = setTimeout(() => { toast = null; render(); }, 4200);
}

function roll() {
  if (anim) return;
  const from = s.pos;
  const prevFace = s.lastRoll;
  const marker = s.log[0];
  if (!G.roll(s, rng)) return;
  const fresh = [];
  for (const e of s.log) { if (e === marker) break; fresh.push(e); }
  const events = fresh.filter((e) => e.k !== 'pazar');
  haptic('roll');
  if (reduceMotion) { showToast(events); return; }
  const steps = s.lastRoll;
  // Zar havadayken ekran yeniden çizilmez; animasyon kesintisiz akar.
  anim = { pos: from, face: prevFace, rolling: true };
  render();
  tossDie(prevFace, s.lastRoll);
  setTimeout(() => haptic('tick'), TOSS_MS * 0.7);
  setTimeout(() => {
    anim.face = s.lastRoll;
    anim.rolling = false;
    render();
    let i = 0;
    const hop = () => {
      if (i >= steps) { anim = null; showToast(events); render(); return; }
      anim.pos = (from + ++i) % N;
      haptic('tick');
      render();
      setTimeout(hop, 170);
    };
    setTimeout(hop, 260);
  }, TOSS_MS + 40);
}

const actions = {
  roll,
  newday: () => G.newDay(s),
  buy: (id) => G.buy(s, id),
  sell: (id) => G.sell(s, id),
  sellall: (id) => G.sellAll(s, id),
  leave: () => G.leaveMarket(s),
  tap: (id) => G.loomTap(s, Number(id)),
  finish: () => G.finishLoom(s),
  upgrade: () => G.upgradeHan(s),
  guard: () => G.hireGuard(s),
  tab: (id) => { view = id; window.scrollTo(0, 0); },
  help: () => { tut = 0; },
  langopen: () => { langOpen = true; },
  setlang: (id) => { if (DICT[id]) { setLang(id); store(LANG_KEY, id); } langOpen = false; },
  tutnext: () => { tut = tut + 1 < u.tutorial.length ? tut + 1 : null; if (tut === null) store(TUT_KEY, '1'); },
  tutskip: () => { tut = null; store(TUT_KEY, '1'); },
  reset: () => {
    if (!confirmReset) { confirmReset = true; return; }
    s = G.newGame(); view = 'route'; confirmReset = false; lastGold = null;
  },
};

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const act = el.dataset.act;
  if (act !== 'reset') confirmReset = false;
  const before = s.gold;
  actions[act]?.(el.dataset.id);
  if (['buy', 'sell', 'sellall', 'upgrade', 'guard'].includes(act)) floater(el, s.gold - before);
  if (s.gold !== before) haptic(s.gold > before ? 'gain' : 'tick');
  // Zar atışı kendi çizimini yönetir; burada yeniden çizmek havadaki zarı siler.
  if (act === 'roll' && anim) return;
  render();
});

// Android geri tuşu: önce açık pencereyi kapatır, sonra Yol sekmesine döner.
// true dönerse uygulama kapanmaz; false dönerse sistem uygulamadan çıkar.
window.karwanBack = () => {
  if (anim) return true;
  if (langOpen) { langOpen = false; render(); return true; }
  if (tut !== null) { actions.tutskip(); render(); return true; }
  const p = s.pending;
  if (p?.type === 'pazar') { G.leaveMarket(s); render(); return true; }
  if (p?.type === 'tezgah') {
    if (p.puzzle.status !== 'play') { G.finishLoom(s); render(); }
    return true; // dokuma yarıda bırakılamaz
  }
  if (view !== 'route') { view = 'route'; render(); return true; }
  return false;
};

function start(data) {
  s = restore(data?.state);
  if (data?.view) view = data.view;
  // İlk açılış: önce dil, sonra öğretici.
  if (!store(TUT_KEY) && !data?.state) tut = 0;
  if (!store(LANG_KEY) && !data?.state) langOpen = true;
  render();
}
const hot = window.claude?.hot;
hot?.snapshot?.(() => ({ state: s, view }));
if (hot?.ready) hot.ready(start); else start(hot?.data ?? {});
