// Karwan: oyun kuralları. Arayüzden bağımsızdır; tüm fonksiyonlar durumu (s) yerinde değiştirir.
import { generate, tap, stars } from './loom.js';

export const GOODS = [
  { id: 'ipek', base: 60 },
  { id: 'baharat', base: 40 },
  { id: 'cay', base: 25 },
  { id: 'kilim', base: 80 },
];

// mult < 1: mal burada üretilir ve ucuzdur. mult > 1: burada aranır ve pahalıdır.
export const CITIES = [
  { mult: { ipek: 0.5, baharat: 1.2, cay: 0.6, kilim: 1.5 } },
  { mult: { ipek: 0.8, baharat: 0.6, cay: 0.9, kilim: 1.2 } },
  { mult: { ipek: 1.1, baharat: 0.8, cay: 1.1, kilim: 0.9 } },
  { mult: { ipek: 1.2, baharat: 1.0, cay: 1.3, kilim: 0.6 } },
  { mult: { ipek: 1.4, baharat: 1.3, cay: 1.4, kilim: 0.5 } },
  { mult: { ipek: 1.8, baharat: 1.6, cay: 1.6, kilim: 1.3 } },
];

// 24 duraklı yol halkası. Şian'dan her geçiş bir sefer sayılır.
const T = (type, city) => ({ type, city });
export const TILES = [
  T('sehir', 0), T('yol'), T('tezgah'), T('kuyu'),
  T('sehir', 1), T('pusu'), T('yol'), T('tezgah'),
  T('sehir', 2), T('yol'), T('kuyu'), T('pusu'),
  T('sehir', 3), T('tezgah'), T('yol'), T('yol'),
  T('sehir', 4), T('kuyu'), T('pusu'), T('tezgah'),
  T('sehir', 5), T('yol'), T('tezgah'), T('kuyu'),
];

export const MOTIFS = [
  { id: 'goz', px: '0001000001110001101101101011011011000111000001000' },
  { id: 'elibelinde', px: '0011100001110010010011111111011101001110001101100' },
  { id: 'kocboynuzu', px: '1100011101010110111010001000101110110101011100011' },
  { id: 'hayatagaci', px: '0001000010101000111001001001010101000111000001000' },
  { id: 'akrep', px: '1000001010101000111001111111001110001010101001001' },
  { id: 'suyolu', px: '1110111100010010111010010001111011110001001011101' },
];

export const BOT_COUNT = 3;
export const MULT_BY_STARS = [1, 1.25, 1.5, 2];
export const GUARD_COST = 60;
export const MAX_HAN = 5;
const TARGET = 20;
const SPREAD = 0.9;

const good = (id) => GOODS.find((g) => g.id === id);

export function newGame() {
  return {
    v: 3,
    gold: 300, dice: 15, pos: 0, han: 1, guards: 0, mult: 1, laps: 0, lastRoll: 0,
    cargo: { ipek: 0, baharat: 0, cay: 0, kilim: 0 },
    costs: { ipek: 0, baharat: 0, cay: 0, kilim: 0 }, // taşınan malın toplam alış maliyeti
    album: [],
    stock: CITIES.map(() => ({ ipek: TARGET, baharat: TARGET, cay: TARGET, kilim: TARGET })),
    bots: Array.from({ length: BOT_COUNT }, (_, i) => ({ id: i, city: (i * 2 + 1) % CITIES.length, good: null, qty: 0, paid: 0 })),
    pending: null,
    log: [{ k: 'bilgi', id: 'start' }],
  };
}

export const capacity = (s) => 6 + 2 * s.han;
export const load = (s) => Object.values(s.cargo).reduce((a, b) => a + b, 0);
export const hanCost = (s) => (s.han + 1) ** 2 * 100;
// Taşınan malın birim başına ortalama alış fiyatı (yoksa 0).
export const avgCost = (s, id) => (s.cargo[id] ? Math.round(s.costs[id] / s.cargo[id]) : 0);

// Bir mal eksildiğinde maliyet de ortalama oranında düşer.
function drop(s, id) {
  s.costs[id] -= s.costs[id] / s.cargo[id];
  s.cargo[id]--;
}

// Günlüğe metin değil, mesaj kimliği ve sayılar yazılır; dile i18n.js çevirir.
function say(s, k, id, p) {
  s.log.unshift({ k, id, p });
  if (s.log.length > 30) s.log.length = 30;
}

// Fiyat stoka bağlıdır: mal azaldıkça pahalanır, bollaştıkça ucuzlar.
export function price(s, city, id) {
  const scarcity = Math.min(2.2, Math.max(0.5, (TARGET / Math.max(s.stock[city][id], 1)) ** 0.6));
  return Math.max(1, Math.round(good(id).base * CITIES[city].mult[id] * scarcity));
}
export const sellPrice = (s, city, id) => Math.max(1, Math.round(price(s, city, id) * SPREAD * s.mult));
// Taban fiyata göre ucuzluk oranı (arayüzdeki "ucuz / pahalı" etiketi için).
export const ratio = (s, city, id) => price(s, city, id) / good(id).base;

function tickMarket(s, rng) {
  for (const st of s.stock) for (const id in st) st[id] += (TARGET - st[id]) * 0.12;
  for (const b of s.bots) {
    if (rng() < 0.5) b.city = (b.city + 1) % CITIES.length;
    const c = b.city;
    if (b.good && price(s, c, b.good) > b.paid * 1.15) {
      s.stock[c][b.good] += b.qty;
      say(s, 'pazar', 'botSell', { bot: b.id, city: c, qty: b.qty, good: b.good });
      b.good = null;
    }
    if (!b.good) {
      const cheapest = GOODS.map((g) => g.id).sort((x, y) => ratio(s, c, x) - ratio(s, c, y))[0];
      if (ratio(s, c, cheapest) < 0.9) {
        b.good = cheapest;
        b.qty = Math.min(3 + Math.floor(rng() * 3), Math.floor(s.stock[c][cheapest]) - 3);
        if (b.qty < 1) { b.good = null; continue; }
        b.paid = price(s, c, cheapest);
        s.stock[c][cheapest] -= b.qty;
        say(s, 'pazar', 'botBuy', { bot: b.id, city: c, qty: b.qty, good: cheapest });
      }
    }
  }
}

export function roll(s, rng) {
  if (s.pending || s.dice < 1) return false;
  s.dice--;
  const d = 1 + Math.floor(rng() * 6);
  s.lastRoll = d;
  const next = s.pos + d;
  if (next >= TILES.length) {
    s.laps++;
    const bonus = 100 * s.han;
    s.gold += bonus;
    say(s, 'iyi', 'lap', { n: s.laps, bonus });
  }
  s.pos = next % TILES.length;
  tickMarket(s, rng);
  const tile = TILES[s.pos];
  if (tile.type === 'sehir') {
    s.pending = { type: 'pazar', city: tile.city, bought: false, sold: false };
  } else if (tile.type === 'tezgah') {
    s.pending = { type: 'tezgah', puzzle: generate(rng, { rows: 4 + Math.min(2, Math.floor(s.han / 2)) }) };
  } else if (tile.type === 'kuyu') {
    s.dice += 2;
    say(s, 'iyi', 'well');
  } else if (tile.type === 'yol') {
    const g = 10 + 5 * s.han;
    s.gold += g;
    say(s, 'bilgi', 'road', { g });
  } else if (tile.type === 'pusu') {
    ambush(s, rng);
  }
  return true;
}

function ambush(s, rng) {
  const bot = s.bots[Math.floor(rng() * s.bots.length)].id;
  if (s.guards > 0) {
    s.guards--;
    say(s, 'iyi', 'guarded', { bot });
    return;
  }
  const held = GOODS.map((g) => g.id).filter((id) => s.cargo[id] > 0);
  if (!held.length) {
    const lost = Math.round(s.gold * 0.1);
    s.gold -= lost;
    say(s, 'kotu', 'robbedGold', { bot, lost });
    return;
  }
  const taken = [];
  for (let i = 0; i < 2; i++) {
    const left = GOODS.map((g) => g.id).filter((id) => s.cargo[id] > 0);
    if (!left.length) break;
    const id = left[Math.floor(rng() * left.length)];
    drop(s, id);
    taken.push(id);
  }
  say(s, 'kotu', 'robbedGoods', { bot, goods: taken });
}

export function buy(s, id) {
  const p = s.pending;
  if (!p || p.type !== 'pazar') return false;
  const cost = price(s, p.city, id);
  if (s.gold < cost || load(s) >= capacity(s) || s.stock[p.city][id] < 2) return false;
  s.gold -= cost;
  s.cargo[id]++;
  s.costs[id] += cost;
  s.stock[p.city][id]--;
  p.bought = true;
  s.mult = 1; // Usta çarpanı ilk alımda biter; aynı şehirde al-sat yapılamasın diye.
  return true;
}

export function sell(s, id) {
  const p = s.pending;
  if (!p || p.type !== 'pazar' || s.cargo[id] < 1) return false;
  s.gold += sellPrice(s, p.city, id);
  drop(s, id);
  s.stock[p.city][id]++;
  p.sold = true;
  return true;
}

export function sellAll(s, id) {
  let n = 0;
  while (sell(s, id)) n++;
  return n > 0;
}

export function leaveMarket(s) {
  const p = s.pending;
  if (!p || p.type !== 'pazar') return false;
  if (p.sold) s.mult = 1;
  s.pending = null;
  return true;
}

export function loomTap(s, col) {
  const p = s.pending;
  if (!p || p.type !== 'tezgah') return false;
  return tap(p.puzzle, col);
}

export function finishLoom(s) {
  const p = s.pending;
  if (!p || p.type !== 'tezgah' || p.puzzle.status === 'play') return false;
  const n = stars(p.puzzle);
  s.pending = null;
  if (n === 0) { say(s, 'kotu', 'loomFail'); return true; }
  s.mult = Math.max(s.mult, MULT_BY_STARS[n]);
  const msg = { n, mult: MULT_BY_STARS[n], motif: null, album: false };
  if (n >= 2) {
    const next = MOTIFS.find((m) => !s.album.includes(m.id));
    if (next) {
      s.album.push(next.id);
      msg.motif = next.id;
      if (s.album.length === MOTIFS.length) { s.gold += 500; msg.album = true; }
    }
  }
  say(s, 'iyi', 'loomWin', msg);
  return true;
}

export function upgradeHan(s) {
  if (s.han >= MAX_HAN || s.gold < hanCost(s)) return false;
  s.gold -= hanCost(s);
  s.han++;
  if (s.han === MAX_HAN) say(s, 'iyi', 'hanMax');
  else say(s, 'iyi', 'hanUp', { han: s.han, cap: capacity(s) });
  return true;
}

export function hireGuard(s) {
  if (s.gold < GUARD_COST) return false;
  s.gold -= GUARD_COST;
  s.guards++;
  return true;
}

// Prototipte zamanlayıcı ve mağaza yerine geçer.
export function newDay(s) {
  if (s.dice > 0) return false;
  s.dice += 10;
  say(s, 'bilgi', 'newDay');
  return true;
}
