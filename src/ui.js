import * as G from './game.js';
import { stars } from './loom.js';
import { DICT, logText } from './i18n.js';
import { icon, TILE_ICON } from './icons.js';

// Dil tarayıcıdan seçilir: Türkçe tarayıcıda Türkçe, diğerlerinde İngilizce.
const lang = (navigator.language || '').toLowerCase().startsWith('tr') ? 'tr' : 'en';
const d = DICT[lang];
const u = d.ui;
document.documentElement.lang = lang;

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
let lastSheet = ''; // giriş animasyonu yalnızca yeni açılan sayfada oynasın

const fmt = (n) => Math.round(n).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US');
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

function cell(i) {
  if (i <= 6) return [1, i + 1];
  if (i <= 12) return [i - 5, 7];
  if (i <= 18) return [7, 19 - i];
  return [25 - i, 1];
}

const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
function die(face, rolling) {
  const on = PIPS[face] || [];
  return `<div class="die${rolling ? ' rolling' : ''}" aria-label="${face ? `${u.lastRoll}: ${face}` : u.lastRoll}">
    ${Array.from({ length: 9 }, (_, k) => `<i class="${on.includes(k) ? 'on' : ''}"></i>`).join('')}</div>`;
}

/* ---------- Üst bilgi ---------- */
function hud() {
  const bonus = s.mult > 1;
  const item = (ic, value, label, cls = '') =>
    `<li class="${cls}">${icon(ic)}<span><b>${value}</b><small>${label}</small></span></li>`;
  return `<header class="hud">
    <div class="brand">
      <h1>Kervan</h1>
      <span class="trip">${u.trip(s.laps + 1)}</span>
      <button class="iconbtn" data-act="help" aria-label="${u.help}">${icon('help')}</button>
    </div>
    <ul class="res">
      ${item('coin', fmt(s.gold), u.gold, 'gold')}
      ${item('die', s.dice, u.dice)}
      ${item('cargo', `${G.load(s)}/${G.capacity(s)}`, u.cargo)}
      ${item('bonus', `×${s.mult}`, u.mult, bonus ? 'hot' : '')}
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
      ${icon(TILE_ICON[t.type])}
      ${t.type === 'sehir' ? `<span class="abbr">${d.cityAbbr[t.city]}</span>` : ''}
      ${bots ? `<span class="bots" aria-label="${u.rivals(bots)}">${'<i></i>'.repeat(bots)}</span>` : ''}
      ${here ? `<span class="token" aria-label="${u.here}"></span>` : ''}
    </div>`;
  }).join('');
  return `<section class="board" aria-label="${u.board}">
    ${tiles}
    <div class="hub">
      <p class="where">${tileName(pos)}</p>
      ${die(anim ? anim.face : s.lastRoll, anim?.rolling)}
    </div>
  </section>`;
}

function ahead() {
  const pos = anim ? anim.pos : s.pos;
  const items = [1, 2, 3, 4, 5, 6].map((n) => {
    const i = (pos + n) % N;
    const t = G.TILES[i];
    return `<li class="t-${t.type}"><span class="n">${n}</span>${icon(TILE_ICON[t.type])}<span class="nm">${tileName(i)}</span></li>`;
  }).join('');
  return `<section class="block"><h2 class="label">${u.ahead}</h2><ol class="ahead">${items}</ol></section>`;
}

function cargoStrip() {
  const held = G.GOODS.filter((g) => s.cargo[g.id] > 0);
  const body = held.length
    ? `<ul class="chips">${held.map((g) => `<li class="g-${g.id}">${icon(g.id)}<b>${s.cargo[g.id]}</b>${d.goods[g.id]}</li>`).join('')}</ul>`
    : `<p class="muted">${u.cargoEmpty}</p>`;
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
    `<i class="${i < s.han ? 'built' : ''}" style="--w:${100 - i * 14}%"></i>`).reverse().join('');
  const upgrade = max ? '' : `<section class="card">
      <div class="card-head"><h3>${u.nextFloor}</h3><span class="price">${icon('coin')}${fmt(cost)}</span></div>
      <ul class="perks"><li><b>+2</b> ${u.perkCargo}</li><li><b>+100</b> ${u.perkIncome}</li></ul>
      <button class="btn primary wide" data-act="upgrade" ${s.gold < cost ? 'disabled' : ''}>${u.upgrade}</button>
      ${s.gold < cost ? `<p class="muted center">${u.needGold(fmt(cost - s.gold))}</p>` : ''}
    </section>`;
  return `<section class="inn-hero">
      <div class="building" aria-label="${u.floorsAria(s.han)}">${floors}</div>
      <h2>${max ? u.hanMax : u.hanFloor(s.han)}</h2>
      <p class="muted">${u.floorOf(s.han, G.MAX_HAN)}</p>
    </section>
    <dl class="stats3">
      <div><dt>${u.capStat}</dt><dd>${G.capacity(s)}</dd></div>
      <div><dt>${u.incomeStat}</dt><dd>${fmt(100 * s.han)}</dd></div>
      <div><dt>${u.tripsStat}</dt><dd>${s.laps}</dd></div>
    </dl>
    ${upgrade}
    <section class="card row">
      <span class="badge-ic">${icon('guard')}</span>
      <div class="grow"><h3>${u.guards(s.guards)}</h3><p class="muted">${u.guardDesc}</p></div>
      <button class="btn" data-act="guard" ${s.gold < G.GUARD_COST ? 'disabled' : ''}>${u.hire} · ${G.GUARD_COST}</button>
    </section>
    <button class="link danger" data-act="reset">${confirmReset ? u.confirmReset : u.reset}</button>`;
}

/* ---------- Albüm ---------- */
function motifArt(m, owned) {
  return `<div class="px${owned ? ' owned' : ''}" aria-hidden="true">${[...m.px].map((b) => `<i class="${b === '1' ? 'on' : ''}"></i>`).join('')}</div>`;
}
function albumView() {
  const n = s.album.length;
  return `<section class="block">
      <h2 class="title">${u.tabAlbum}</h2>
      <p class="muted">${u.albumDone(n, G.MOTIFS.length)}</p>
      <span class="bar big"><i style="width:${(n / G.MOTIFS.length) * 100}%"></i></span>
    </section>
    <ul class="album">${G.MOTIFS.map((m) => {
      const owned = s.album.includes(m.id);
      return `<li class="motif${owned ? ' owned' : ''}">${motifArt(m, owned)}
        <strong>${owned ? d.motifs[m.id][0] : u.notWoven}</strong>
        <span>${owned ? d.motifs[m.id][1] : u.notWovenHint}</span></li>`;
    }).join('')}</ul>`;
}

/* ---------- Günlük ---------- */
const LOG_ICON = { iyi: 'bonus', kotu: 'ambush', pazar: 'city', bilgi: 'route' };
function logView() {
  if (!s.log.length) return `<p class="muted">${u.logEmpty}</p>`;
  return `<h2 class="title">${u.tabLog}</h2>
    <ol class="log">${s.log.map((e) => `<li class="k-${e.k}">${icon(LOG_ICON[e.k])}<span>${logText(lang, e)}</span></li>`).join('')}</ol>`;
}

/* ---------- Alt bölüm: bildirim, zar, sekme çubuğu ---------- */
function dock() {
  const out = s.dice < 1;
  const roll = view !== 'route' ? '' : out
    ? `<button class="roll" data-act="newday">${icon('die')}<span>${u.newDay}</span></button>`
    : `<button class="roll" data-act="roll" ${anim ? 'disabled' : ''}>${icon('die')}<span>${u.roll}</span><small>${u.diceLeft(s.dice)}</small></button>`;
  const toastHtml = toast ? `<div class="toast k-${toast.k}${toast.fresh ? ' enter' : ''}" role="status">${icon(LOG_ICON[toast.k])}<span>${toast.text}</span></div>` : '';
  const tabs = [['route', u.tabRoute, 'route'], ['inn', u.tabInn, 'inn'], ['album', u.tabAlbum, 'album'], ['log', u.tabLogShort, 'log']];
  return `<div class="dock"><div class="dock-in">
    ${toastHtml}${roll}
    <nav class="tabbar" aria-label="Menu">${tabs.map(([id, name, ic]) =>
      `<button data-act="tab" data-id="${id}" ${view === id ? 'aria-current="page"' : ''}>${icon(ic)}<span>${name}</span>${id === 'album' && s.album.length ? `<em>${s.album.length}</em>` : ''}</button>`).join('')}</nav>
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
      <span class="gic g-${g.id}">${icon(g.id)}</span>
      <div class="gmeta">
        <div class="gname"><strong>${d.goods[g.id]}</strong>${tag}</div>
        <span class="gsub">${have ? u.holding(have, fmt(G.avgCost(s, g.id))) : u.youHave(0)}</span>
        ${have > 1 ? `<button class="link" data-act="sellall" data-id="${g.id}">${u.sellAll(have)}</button>` : ''}
      </div>
      <button class="trade" data-act="buy" data-id="${g.id}" ${canBuy ? '' : 'disabled'}><small>${u.buy}</small><b>${fmt(buyP)}</b></button>
      <button class="trade sell ${trend}" data-act="sell" data-id="${g.id}" ${have ? '' : 'disabled'}>
        <small>${u.sell}${have ? ` <em>${diff >= 0 ? '+' : '−'}${fmt(Math.abs(diff))}</em>` : ''}</small><b>${fmt(sp)}</b></button>
    </li>`;
  }).join('');
  return `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
    <span class="grab"></span>
    <header class="sheet-head">
      <span class="sheet-ic">${icon('city')}</span>
      <div><h2 id="sheet-title">${u.market(city)}</h2>
      <p class="muted">${rivals.length ? u.alsoHere(rivals.join(', ')) : u.marketSub}</p></div>
    </header>
    <div class="meters">
      <span class="gold">${icon('coin')}<b>${fmt(s.gold)}</b></span>
      <span class="capbar"><small>${u.cargo} ${load}/${cap}</small><span class="bar"><i style="width:${(load / cap) * 100}%"></i></span></span>
    </div>
    ${s.mult > 1 ? `<p class="note">${icon('bonus')}<span>${u.multNote(s.mult)}</span></p>` : ''}
    <ul class="goods">${rows}</ul>
    <div class="sheet-foot"><button class="btn primary wide" data-act="leave">${u.onward}</button></div>
  </div>`;
}

/* ---------- Tezgâh ---------- */
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
    `<i class="slot${z.buf[i] ? ` spool th-${z.buf[i]}` : ''}"></i>`).join('');

  let body;
  if (z.status === 'play') {
    const cols = z.cols.map((col, c) => `<button class="stack" data-act="tap" data-id="${c}" ${col.length ? '' : 'disabled'}
        aria-label="${col.length ? u.colAria(c + 1, d.threads[col[col.length - 1]]) : u.colEmpty(c + 1)}">
        ${col.map((t, i) => `<i class="spool th-${t}${i === col.length - 1 ? ' top' : ''}"></i>`).join('')}</button>`).join('');
    const need = z.rows[z.row];
    body = `<div class="stacks">${cols}</div>
      <p class="need">${u.nextColor} <span class="chip th-${need}"><i></i>${d.threads[need]}</span></p>
      <p class="muted small">${u.best(z.best)}</p>`;
  } else {
    const n = stars(z);
    const next = n >= 2 ? G.MOTIFS.find((m) => !s.album.includes(m.id)) : null;
    body = `<div class="result">
      <p class="stars" aria-label="${u.starsAria(n)}">${[1, 2, 3].map((k) => `<span class="${k <= n ? 'on' : ''}" style="--k:${k}">★</span>`).join('')}</p>
      <p class="result-text">${n ? u.loomWon(G.MULT_BY_STARS[n]) : u.loomLost}</p>
      ${next ? `<div class="reward">${motifArt(next, true)}<div><small>${u.newMotif}</small><strong>${d.motifs[next.id][0]}</strong><span class="muted">${d.motifs[next.id][1]}</span></div></div>` : ''}
    </div>
    <div class="sheet-foot"><button class="btn primary wide" data-act="finish">${u.onward}</button></div>`;
  }
  return `<div class="sheet loom" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
    <span class="grab"></span>
    <header class="sheet-head">
      <span class="sheet-ic loom-ic">${icon('loom')}</span>
      <div><h2 id="sheet-title">${u.loom}</h2><p class="muted">${z.status === 'play' ? u.loomHow : ''}</p></div>
    </header>
    <ol class="kilim">${kilim}</ol>
    <div class="shuttle${warn}">
      <p class="label">${u.shuttle} <b>${z.buf.length}/${z.cap}</b> <span>${u.shuttleHint}</span></p>
      <div class="slots">${buf}</div>
    </div>
    ${body}
  </div>`;
}

/* ---------- Öğretici ---------- */
function tutorial() {
  const steps = u.tutorial;
  const [ic, title, text] = steps[tut];
  const last = tut === steps.length - 1;
  return `<div class="scrim center"><div class="tut" role="dialog" aria-modal="true" aria-labelledby="tut-title">
    <div class="tut-art">${icon(ic)}</div>
    <p class="label">${u.stepOf(tut + 1, steps.length)}</p>
    <h2 id="tut-title">${title}</h2>
    <p class="tut-text">${text}</p>
    <div class="dots">${steps.map((_, i) => `<i class="${i === tut ? 'on' : ''}"></i>`).join('')}</div>
    <div class="tut-act">
      ${last ? '<span></span>' : `<button class="btn ghost" data-act="tutskip">${u.skip}</button>`}
      <button class="btn primary" data-act="tutnext">${last ? u.start : u.next}</button>
    </div>
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
  app.innerHTML = `<div class="shell">${hud()}<main class="view">${VIEWS[view]()}</main></div>${dock()}${sheet}${tut !== null ? tutorial() : ''}`;
  window.scrollTo(0, scrollY);
  if (toast) toast.fresh = false;
  save();
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
  const marker = s.log[0];
  if (!G.roll(s, rng)) return;
  const fresh = [];
  for (const e of s.log) { if (e === marker) break; fresh.push(e); }
  const events = fresh.filter((e) => e.k !== 'pazar');
  if (reduceMotion) { showToast(events); return; }
  const steps = s.lastRoll;
  anim = { pos: from, face: s.lastRoll, rolling: true };
  let frame = 0;
  const shuffle = setInterval(() => {
    anim.face = 1 + Math.floor(Math.random() * 6);
    render();
    if (++frame < 7) return;
    clearInterval(shuffle);
    anim.face = s.lastRoll;
    anim.rolling = false;
    let i = 0;
    const hop = () => {
      if (i >= steps) { anim = null; showToast(events); render(); return; }
      anim.pos = (from + ++i) % N;
      render();
      setTimeout(hop, 160);
    };
    setTimeout(hop, 180);
  }, 65);
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
  tutnext: () => { tut = tut + 1 < u.tutorial.length ? tut + 1 : null; if (tut === null) store(TUT_KEY, '1'); },
  tutskip: () => { tut = null; store(TUT_KEY, '1'); },
  reset: () => {
    if (!confirmReset) { confirmReset = true; return; }
    s = G.newGame(); view = 'route'; confirmReset = false;
  },
};

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const act = el.dataset.act;
  if (act !== 'reset') confirmReset = false;
  actions[act]?.(el.dataset.id);
  render();
});

function start(data) {
  s = restore(data?.state);
  if (data?.view) view = data.view;
  if (!store(TUT_KEY) && !data?.state) tut = 0;
  render();
}
const hot = window.claude?.hot;
hot?.snapshot?.(() => ({ state: s, view }));
if (hot?.ready) hot.ready(start); else start(hot?.data ?? {});
