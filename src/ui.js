import * as G from './game.js';
import { stars } from './loom.js';

const KEY = 'kervan-v1';
const rng = Math.random;
const app = document.getElementById('app');
let s;
let tab = 'gunluk';

function restore(data) {
  if (data && data.v === 1) return data;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && saved.v === 1) return saved;
  } catch { /* kayıt yoksa yeni oyun */ }
  return G.newGame();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* kayıt kapalıysa oyun yine çalışır */ }
}

const TILE_LABEL = { yol: 'Yol', tezgah: 'Tezgâh', kuyu: 'Kuyu', pusu: 'Pusu' };
const THREAD_NAME = { kok: 'kök boya kırmızısı', civit: 'çivit mavisi', cehri: 'cehri sarısı', ceviz: 'ceviz kahvesi' };
const fmt = (n) => Math.round(n).toLocaleString('tr-TR');

function cell(i) {
  if (i <= 6) return [1, i + 1];
  if (i <= 12) return [i - 5, 7];
  if (i <= 18) return [7, 19 - i];
  return [25 - i, 1];
}

function tileName(i) {
  const t = G.TILES[i];
  return t.type === 'sehir' ? G.CITIES[t.city].name : TILE_LABEL[t.type];
}

function board() {
  const tiles = G.TILES.map((t, i) => {
    const [r, c] = cell(i);
    const here = i === s.pos;
    const bots = t.type === 'sehir' ? s.bots.filter((b) => b.city === t.city).length : 0;
    const label = t.type === 'sehir' ? G.CITIES[t.city].abbr : '';
    return `<div class="tile t-${t.type}${here ? ' here' : ''}" style="grid-area:${r}/${c}" title="${tileName(i)}">
      <span class="glyph">${label}</span>
      ${bots ? `<span class="bots" aria-label="${bots} rakip kervan">${'<i></i>'.repeat(bots)}</span>` : ''}
      ${here ? '<span class="caravan" aria-label="Kervanın burada"></span>' : ''}
    </div>`;
  }).join('');
  const out = s.dice < 1;
  return `<section class="board" aria-label="Yol halkası">
    ${tiles}
    <div class="hub">
      <p class="where">${tileName(s.pos)}</p>
      <div class="die" aria-label="Son zar">${s.lastRoll || '–'}</div>
      ${out
        ? '<button class="btn primary" data-act="newday">Gün doğsun (+10 zar)</button>'
        : '<button class="btn primary" data-act="roll">Zar at</button>'}
      <p class="hint">${out ? 'Zarın bitti.' : `${s.dice} zar kaldı`}</p>
    </div>
  </section>
  <ul class="legend">
    <li><span class="key t-sehir"></span>Şehir: pazar</li>
    <li><span class="key t-tezgah"></span>Tezgâh: bulmaca</li>
    <li><span class="key t-kuyu"></span>Kuyu: +2 zar</li>
    <li><span class="key t-pusu"></span>Pusu: yük kaybı</li>
  </ul>`;
}

function stats() {
  return `<header class="top">
    <h1>Kervan</h1>
    <dl class="stats">
      <div><dt>Altın</dt><dd>${fmt(s.gold)}</dd></div>
      <div><dt>Zar</dt><dd>${s.dice}</dd></div>
      <div><dt>Yük</dt><dd>${G.load(s)}/${G.capacity(s)}</dd></div>
      <div class="${s.mult > 1 ? 'hot' : ''}"><dt>Çarpan</dt><dd>×${s.mult}</dd></div>
    </dl>
  </header>`;
}

function motif(m, owned) {
  const cells = [...m.px].map((b) => `<i class="${b === '1' ? 'on' : ''}"></i>`).join('');
  return `<li class="motif${owned ? ' owned' : ''}">
    <div class="px" aria-hidden="true">${cells}</div>
    <div><strong>${owned ? m.name : 'Dokunmadı'}</strong><span>${owned ? m.meaning : 'Tezgâhta en az 2 yıldız al.'}</span></div>
  </li>`;
}

function panels() {
  const tabs = [['gunluk', 'Yol günlüğü'], ['han', 'Han'], ['album', `Albüm ${s.album.length}/${G.MOTIFS.length}`]];
  let body;
  if (tab === 'han') {
    const max = s.han >= G.MAX_HAN;
    body = `<div class="han">
      <div class="floors" aria-label="Han ${s.han}. kat">${Array.from({ length: G.MAX_HAN }, (_, i) => `<i class="${i < s.han ? 'built' : ''}"></i>`).join('')}</div>
      <div class="rows">
        <div class="row"><div><strong>${max ? 'Büyük Han' : `Han, ${s.han}. kat`}</strong><span>Kervan ${G.capacity(s)} yük taşır. Her sefer ${100 * s.han} altın getirir.</span></div>
          ${max ? '<span class="pill">Tamamlandı</span>' : `<button class="btn" data-act="upgrade" ${s.gold < G.hanCost(s) ? 'disabled' : ''}>Kat çık · ${fmt(G.hanCost(s))}</button>`}</div>
        <div class="row"><div><strong>Muhafız: ${s.guards}</strong><span>Her muhafız bir pusuyu püskürtür.</span></div>
          <button class="btn" data-act="guard" ${s.gold < G.GUARD_COST ? 'disabled' : ''}>Tut · ${G.GUARD_COST}</button></div>
        <div class="row"><div><strong>${s.laps} sefer</strong><span>Şian'dan her geçiş bir sefer sayılır.</span></div>
          <button class="btn ghost" data-act="reset">Baştan başla</button></div>
      </div>
    </div>`;
  } else if (tab === 'album') {
    body = `<ul class="album">${G.MOTIFS.map((m) => motif(m, s.album.includes(m.id))).join('')}</ul>`;
  } else {
    body = `<ol class="log">${s.log.map((e) => `<li class="k-${e.k}">${e.t}</li>`).join('')}</ol>`;
  }
  return `<nav class="tabs" role="tablist">${tabs.map(([id, name]) =>
    `<button role="tab" aria-selected="${tab === id}" data-act="tab" data-id="${id}">${name}</button>`).join('')}</nav>
  <section class="panel">${body}</section>`;
}

function market(p) {
  const city = G.CITIES[p.city];
  const rows = G.GOODS.map((g) => {
    const r = G.ratio(s, p.city, g.id);
    const tag = r < 0.8 ? '<span class="pill cheap">ucuz</span>' : r > 1.3 ? '<span class="pill dear">pahalı</span>' : '';
    const buyP = G.price(s, p.city, g.id);
    const canBuy = s.gold >= buyP && G.load(s) < G.capacity(s) && s.stock[p.city][g.id] >= 2;
    return `<li class="good">
      <div class="gname"><strong>${g.name}</strong>${tag}<span>Sende ${s.cargo[g.id]}</span></div>
      <button class="btn" data-act="buy" data-id="${g.id}" ${canBuy ? '' : 'disabled'}>Al · ${fmt(buyP)}</button>
      <button class="btn" data-act="sell" data-id="${g.id}" ${s.cargo[g.id] ? '' : 'disabled'}>Sat · ${fmt(G.sellPrice(s, p.city, g.id))}</button>
    </li>`;
  }).join('');
  const rivals = s.bots.filter((b) => b.city === p.city).map((b) => b.name);
  return `<div class="sheet" role="dialog" aria-label="${city.name} pazarı">
    <h2>${city.name} pazarı</h2>
    <p class="sub">${fmt(s.gold)} altın · yük ${G.load(s)}/${G.capacity(s)}${rivals.length ? ` · ${rivals.join(', ')} de burada` : ''}</p>
    ${s.mult > 1 ? `<p class="note">Usta çarpanı ×${s.mult}: satışların değerli. İlk alımda çarpan biter, önce sat.</p>` : ''}
    <ul class="goods">${rows}</ul>
    <button class="btn primary wide" data-act="leave">Yola devam</button>
  </div>`;
}

function loom(p) {
  const z = p.puzzle;
  const kilim = z.rows.map((c, i) => {
    const state = i < z.row ? 'done' : i === z.row && z.status === 'play' ? 'now' : 'todo';
    const fill = state === 'now' ? z.woven : state === 'done' ? z.per : 0;
    return `<li class="weft ${state} th-${c}" aria-label="${i + 1}. sıra: ${THREAD_NAME[c]}">
      ${Array.from({ length: z.per }, (_, k) => `<i class="${k < fill ? 'in' : ''}"></i>`).join('')}</li>`;
  }).join('');
  const buf = Array.from({ length: z.cap }, (_, i) =>
    `<i class="slot${i === z.cap - 1 ? ' last' : ''}${z.buf[i] ? ` spool th-${z.buf[i]}` : ''}"></i>`).join('');
  const cols = z.cols.map((col, c) => `<button class="stack" data-act="tap" data-id="${c}" ${col.length && z.status === 'play' ? '' : 'disabled'}
      aria-label="${col.length ? `${c + 1}. sütun, üstte ${THREAD_NAME[col[col.length - 1]]}` : `${c + 1}. sütun boş`}">
      ${col.map((t, i) => `<i class="spool th-${t}${i === col.length - 1 ? ' topmost' : ''}"></i>`).join('')}
    </button>`).join('');
  let foot;
  if (z.status === 'play') {
    foot = `<p class="sub">Sıradaki renk: <b class="th-text th-${z.rows[z.row]}">${THREAD_NAME[z.rows[z.row]]}</b>. En iyi çözüm mekikte en çok ${z.best} iplik bekletir.</p>`;
  } else {
    const n = stars(z);
    foot = `<div class="result">
      <p class="starline" aria-label="${n} yıldız">${'★'.repeat(n)}<span>${'★'.repeat(3 - n)}</span></p>
      <p class="sub">${n ? `Kilim tamam. Bir sonraki pazarda satışların ×${G.MULT_BY_STARS[n]}.` : 'Mekik doldu. Bu kilim yarım kaldı.'}</p>
      <button class="btn primary wide" data-act="finish">Yola devam</button>
    </div>`;
  }
  return `<div class="sheet loom" role="dialog" aria-label="Dokuma tezgâhı">
    <h2>Dokuma tezgâhı</h2>
    <ol class="kilim">${kilim}</ol>
    <p class="cap">Mekik <span>son yuva dolarsa kaybedersin</span></p>
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
