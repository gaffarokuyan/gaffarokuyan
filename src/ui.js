import * as G from './game.js';
import { stars } from './loom.js';
import { DICT, logText } from './i18n.js';

// Dil tarayıcıdan seçilir: Türkçe tarayıcıda Türkçe, diğerlerinde İngilizce.
const lang = (navigator.language || '').toLowerCase().startsWith('tr') ? 'tr' : 'en';
const d = DICT[lang];
const u = d.ui;
document.documentElement.lang = lang;

const KEY = 'kervan-v2';
const rng = Math.random;
const app = document.getElementById('app');
let s;
let tab = 'gunluk';

function restore(data) {
  if (data && data.v === 2) return data;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && saved.v === 2) return saved;
  } catch { /* kayıt yoksa yeni oyun */ }
  return G.newGame();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* kayıt kapalıysa oyun yine çalışır */ }
}

const TILE_LABEL = d.tiles;
const THREAD_NAME = d.threads;
const fmt = (n) => Math.round(n).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US');

function cell(i) {
  if (i <= 6) return [1, i + 1];
  if (i <= 12) return [i - 5, 7];
  if (i <= 18) return [7, 19 - i];
  return [25 - i, 1];
}

function tileName(i) {
  const t = G.TILES[i];
  return t.type === 'sehir' ? d.cities[t.city] : TILE_LABEL[t.type];
}

function board() {
  const tiles = G.TILES.map((t, i) => {
    const [r, c] = cell(i);
    const here = i === s.pos;
    const bots = t.type === 'sehir' ? s.bots.filter((b) => b.city === t.city).length : 0;
    const label = t.type === 'sehir' ? d.cityAbbr[t.city] : '';
    return `<div class="tile t-${t.type}${here ? ' here' : ''}" style="grid-area:${r}/${c}" title="${tileName(i)}">
      <span class="glyph">${label}</span>
      ${bots ? `<span class="bots" aria-label="${u.rivals(bots)}">${'<i></i>'.repeat(bots)}</span>` : ''}
      ${here ? '<span class="caravan" aria-label="${u.here}"></span>' : ''}
    </div>`;
  }).join('');
  const out = s.dice < 1;
  return `<section class="board" aria-label="${u.board}">
    ${tiles}
    <div class="hub">
      <p class="where">${tileName(s.pos)}</p>
      <div class="die" aria-label="${u.lastRoll}">${s.lastRoll || '–'}</div>
      ${out
        ? `<button class="btn primary" data-act="newday">${u.newDay}</button>`
        : `<button class="btn primary" data-act="roll">${u.roll}</button>`}
      <p class="hint">${out ? u.outOfDice : u.diceLeft(s.dice)}</p>
    </div>
  </section>
  <ul class="legend">
    ${['sehir', 'tezgah', 'kuyu', 'pusu'].map((k, i) => `<li><span class="key t-${k}"></span>${u.legend[i]}</li>`).join('')}
  </ul>`;
}

function stats() {
  return `<header class="top">
    <h1>Kervan</h1>
    <dl class="stats">
      <div><dt>${u.gold}</dt><dd>${fmt(s.gold)}</dd></div>
      <div><dt>${u.dice}</dt><dd>${s.dice}</dd></div>
      <div><dt>${u.cargo}</dt><dd>${G.load(s)}/${G.capacity(s)}</dd></div>
      <div class="${s.mult > 1 ? 'hot' : ''}"><dt>${u.mult}</dt><dd>×${s.mult}</dd></div>
    </dl>
  </header>`;
}

function motif(m, owned) {
  const cells = [...m.px].map((b) => `<i class="${b === '1' ? 'on' : ''}"></i>`).join('');
  return `<li class="motif${owned ? ' owned' : ''}">
    <div class="px" aria-hidden="true">${cells}</div>
    <div><strong>${owned ? d.motifs[m.id][0] : u.notWoven}</strong><span>${owned ? d.motifs[m.id][1] : u.notWovenHint}</span></div>
  </li>`;
}

function panels() {
  const tabs = [['gunluk', u.tabLog], ['han', u.tabHan], ['album', `${u.tabAlbum} ${s.album.length}/${G.MOTIFS.length}`]];
  let body;
  if (tab === 'han') {
    const max = s.han >= G.MAX_HAN;
    body = `<div class="han">
      <div class="floors" aria-label="${u.floorsAria(s.han)}">${Array.from({ length: G.MAX_HAN }, (_, i) => `<i class="${i < s.han ? 'built' : ''}"></i>`).join('')}</div>
      <div class="rows">
        <div class="row"><div><strong>${max ? u.hanMax : u.hanFloor(s.han)}</strong><span>${u.hanDesc(G.capacity(s), 100 * s.han)}</span></div>
          ${max ? `<span class="pill">${u.done}</span>` : `<button class="btn" data-act="upgrade" ${s.gold < G.hanCost(s) ? 'disabled' : ''}>${u.upgrade} · ${fmt(G.hanCost(s))}</button>`}</div>
        <div class="row"><div><strong>${u.guards(s.guards)}</strong><span>${u.guardDesc}</span></div>
          <button class="btn" data-act="guard" ${s.gold < G.GUARD_COST ? 'disabled' : ''}>${u.hire} · ${G.GUARD_COST}</button></div>
        <div class="row"><div><strong>${u.laps(s.laps)}</strong><span>${u.lapsDesc}</span></div>
          <button class="btn ghost" data-act="reset">${u.reset}</button></div>
      </div>
    </div>`;
  } else if (tab === 'album') {
    body = `<ul class="album">${G.MOTIFS.map((m) => motif(m, s.album.includes(m.id))).join('')}</ul>`;
  } else {
    body = `<ol class="log">${s.log.map((e) => `<li class="k-${e.k}">${logText(lang, e)}</li>`).join('')}</ol>`;
  }
  return `<nav class="tabs" role="tablist">${tabs.map(([id, name]) =>
    `<button role="tab" aria-selected="${tab === id}" data-act="tab" data-id="${id}">${name}</button>`).join('')}</nav>
  <section class="panel">${body}</section>`;
}

function market(p) {
  const city = d.cities[p.city];
  const rows = G.GOODS.map((g) => {
    const r = G.ratio(s, p.city, g.id);
    const tag = r < 0.8 ? `<span class="pill cheap">${u.cheap}</span>` : r > 1.3 ? `<span class="pill dear">${u.dear}</span>` : '';
    const buyP = G.price(s, p.city, g.id);
    const canBuy = s.gold >= buyP && G.load(s) < G.capacity(s) && s.stock[p.city][g.id] >= 2;
    return `<li class="good">
      <div class="gname"><strong>${d.goods[g.id]}</strong>${tag}<span>${u.youHave(s.cargo[g.id])}</span></div>
      <button class="btn" data-act="buy" data-id="${g.id}" ${canBuy ? '' : 'disabled'}>${u.buy} · ${fmt(buyP)}</button>
      <button class="btn" data-act="sell" data-id="${g.id}" ${s.cargo[g.id] ? '' : 'disabled'}>${u.sell} · ${fmt(G.sellPrice(s, p.city, g.id))}</button>
    </li>`;
  }).join('');
  const rivals = s.bots.filter((b) => b.city === p.city).map((b) => d.bots[b.id]);
  return `<div class="sheet" role="dialog" aria-label="${u.market(city)}">
    <h2>${u.market(city)}</h2>
    <p class="sub">${u.goldN(fmt(s.gold))} · ${u.cargoN(G.load(s), G.capacity(s))}${rivals.length ? ` · ${u.alsoHere(rivals.join(', '))}` : ''}</p>
    ${s.mult > 1 ? `<p class="note">${u.multNote(s.mult)}</p>` : ''}
    <ul class="goods">${rows}</ul>
    <button class="btn primary wide" data-act="leave">${u.onward}</button>
  </div>`;
}

function loom(p) {
  const z = p.puzzle;
  const kilim = z.rows.map((c, i) => {
    const state = i < z.row ? 'done' : i === z.row && z.status === 'play' ? 'now' : 'todo';
    const fill = state === 'now' ? z.woven : state === 'done' ? z.per : 0;
    return `<li class="weft ${state} th-${c}" aria-label="${u.rowAria(i + 1, THREAD_NAME[c])}">
      ${Array.from({ length: z.per }, (_, k) => `<i class="${k < fill ? 'in' : ''}"></i>`).join('')}</li>`;
  }).join('');
  const buf = Array.from({ length: z.cap }, (_, i) =>
    `<i class="slot${i === z.cap - 1 ? ' last' : ''}${z.buf[i] ? ` spool th-${z.buf[i]}` : ''}"></i>`).join('');
  const cols = z.cols.map((col, c) => `<button class="stack" data-act="tap" data-id="${c}" ${col.length && z.status === 'play' ? '' : 'disabled'}
      aria-label="${col.length ? u.colAria(c + 1, THREAD_NAME[col[col.length - 1]]) : u.colEmpty(c + 1)}">
      ${col.map((t, i) => `<i class="spool th-${t}${i === col.length - 1 ? ' topmost' : ''}"></i>`).join('')}
    </button>`).join('');
  let foot;
  if (z.status === 'play') {
    foot = `<p class="sub">${u.nextColor}: <b class="th-text th-${z.rows[z.row]}">${THREAD_NAME[z.rows[z.row]]}</b>. ${u.best(z.best)}</p>`;
  } else {
    const n = stars(z);
    foot = `<div class="result">
      <p class="starline" aria-label="${u.starsAria(n)}">${'★'.repeat(n)}<span>${'★'.repeat(3 - n)}</span></p>
      <p class="sub">${n ? u.loomWon(G.MULT_BY_STARS[n]) : u.loomLost}</p>
      <button class="btn primary wide" data-act="finish">${u.onward}</button>
    </div>`;
  }
  return `<div class="sheet loom" role="dialog" aria-label="${u.loom}">
    <h2>${u.loom}</h2>
    <ol class="kilim">${kilim}</ol>
    <p class="cap">${u.shuttle} <span>${u.shuttleHint}</span></p>
    <div class="buffer">${buf}</div>
    <div class="stacks">${cols}</div>
    ${foot}
  </div>`;
}

function render() {
  const p = s.pending;
  const modal = p ? `<div class="scrim">${p.type === 'pazar' ? market(p) : loom(p)}</div>` : '';
  app.innerHTML = `<main class="game">${stats()}${board()}${panels()}</main>${modal}`;
  save();
}

const actions = {
  roll: () => G.roll(s, rng),
  newday: () => G.newDay(s),
  buy: (id) => G.buy(s, id),
  sell: (id) => G.sell(s, id),
  leave: () => G.leaveMarket(s),
  tap: (id) => G.loomTap(s, Number(id)),
  finish: () => G.finishLoom(s),
  upgrade: () => G.upgradeHan(s),
  guard: () => G.hireGuard(s),
  tab: (id) => { tab = id; },
  reset: () => { s = G.newGame(); tab = 'gunluk'; },
};

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  actions[el.dataset.act]?.(el.dataset.id);
  render();
});

function start(data) {
  s = restore(data && data.state);
  render();
}
const hot = window.claude?.hot;
hot?.snapshot?.(() => ({ state: s }));
if (hot?.ready) hot.ready(start); else start(hot?.data ?? {});
