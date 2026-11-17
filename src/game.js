// Kervan: oyun kuralları. Arayüzden bağımsızdır; tüm fonksiyonlar durumu (s) yerinde değiştirir.
import { generate, tap, stars } from './loom.js';

export const GOODS = [
  { id: 'ipek', name: 'İpek', base: 60 },
  { id: 'baharat', name: 'Baharat', base: 40 },
  { id: 'cay', name: 'Çay', base: 25 },
  { id: 'kilim', name: 'Kilim', base: 80 },
];

// mult < 1: mal burada üretilir ve ucuzdur. mult > 1: burada aranır ve pahalıdır.
export const CITIES = [
  { name: 'Şian', loc: "Şian'da", abbr: 'ŞİA', mult: { ipek: 0.5, baharat: 1.2, cay: 0.6, kilim: 1.5 } },
  { name: 'Kaşgar', loc: "Kaşgar'da", abbr: 'KAŞ', mult: { ipek: 0.8, baharat: 0.6, cay: 0.9, kilim: 1.2 } },
  { name: 'Semerkant', loc: "Semerkant'ta", abbr: 'SEM', mult: { ipek: 1.1, baharat: 0.8, cay: 1.1, kilim: 0.9 } },
  { name: 'Buhara', loc: "Buhara'da", abbr: 'BUH', mult: { ipek: 1.2, baharat: 1.0, cay: 1.3, kilim: 0.6 } },
  { name: 'Tebriz', loc: "Tebriz'de", abbr: 'TEB', mult: { ipek: 1.4, baharat: 1.3, cay: 1.4, kilim: 0.5 } },
  { name: 'İstanbul', loc: "İstanbul'da", abbr: 'İST', mult: { ipek: 1.8, baharat: 1.6, cay: 1.6, kilim: 1.3 } },
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
  { id: 'goz', name: 'Göz', meaning: 'Nazardan korur.', px: '0001000001110001101101101011011011000111000001000' },
  { id: 'elibelinde', name: 'Elibelinde', meaning: 'Bereket ve analık.', px: '0011100001110010010011111111011101001110001101100' },
  { id: 'kocboynuzu', name: 'Koçboynuzu', meaning: 'Güç ve yiğitlik.', px: '1100011101010110111010001000101110110101011100011' },
  { id: 'hayatagaci', name: 'Hayat Ağacı', meaning: 'Ölümsüzlük umudu.', px: '0001000010101000111001001001010101000111000001000' },
  { id: 'akrep', name: 'Akrep', meaning: 'Kötülükten sakınma.', px: '1000001010101000111001111111001110001010101001001' },
  { id: 'suyolu', name: 'Su Yolu', meaning: 'Yaşamın sürekliliği.', px: '1110111100010010111010010001111011110001001011101' },
];

export const BOT_NAMES = ['Demir Kervanı', 'Zümrüt Kervanı', 'Poyraz Kervanı'];
export const MULT_BY_STARS = [1, 1.25, 1.5, 2];
export const GUARD_COST = 60;
export const MAX_HAN = 5;
const TARGET = 20;
const SPREAD = 0.9;

const good = (id) => GOODS.find((g) => g.id === id);

export function newGame() {
  return {
    v: 1,
    gold: 300, dice: 15, pos: 0, han: 1, guards: 0, mult: 1, laps: 0, lastRoll: 0,
    cargo: { ipek: 0, baharat: 0, cay: 0, kilim: 0 },
    album: [],
    stock: CITIES.map(() => ({ ipek: TARGET, baharat: TARGET, cay: TARGET, kilim: TARGET })),
    bots: BOT_NAMES.map((name, i) => ({ name, city: (i * 2 + 1) % CITIES.length, good: null, qty: 0, paid: 0 })),
    pending: null,
    log: [{ k: 'bilgi', t: "Kervanın Şian'da hazır. Ucuza al, yolun ilerisinde pahalıya sat." }],
  };
}

export const capacity = (s) => 6 + 2 * s.han;
export const load = (s) => Object.values(s.cargo).reduce((a, b) => a + b, 0);
export const hanCost = (s) => (s.han + 1) ** 2 * 100;

function say(s, k, t) {
  s.log.unshift({ k, t });
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
      say(s, 'pazar', `${b.name} ${CITIES[c].loc} ${b.qty} ${good(b.good).name.toLowerCase()} sattı. Fiyat düştü.`);
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
        say(s, 'pazar', `${b.name} ${CITIES[c].loc} ${b.qty} ${good(cheapest).name.toLowerCase()} aldı. Fiyat yükseldi.`);
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
    say(s, 'iyi', `${s.laps}. sefer tamamlandı. Han sana ${bonus} altın kazandırdı.`);
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
    say(s, 'iyi', 'Kuyu başında dinlendin. 2 zar kazandın.');
  } else if (tile.type === 'yol') {
    const g = 10 + 5 * s.han;
    s.gold += g;
    say(s, 'bilgi', `Yolda bir tüccara rehberlik ettin. ${g} altın.`);
  } else if (tile.type === 'pusu') {
    ambush(s, rng);
  }
  return true;
}

function ambush(s, rng) {
  const who = s.bots[Math.floor(rng() * s.bots.length)].name;
  if (s.guards > 0) {
    s.guards--;
    say(s, 'iyi', `${who} pusu kurdu ama muhafızın püskürttü.`);
    return;
  }
  const held = GOODS.map((g) => g.id).filter((id) => s.cargo[id] > 0);
  if (!held.length) {
    const lost = Math.round(s.gold * 0.1);
    s.gold -= lost;
    say(s, 'kotu', `${who} pusu kurdu. Yükün yoktu, ${lost} altın kaptırdın.`);
    return;
  }
  const taken = [];
  for (let i = 0; i < 2; i++) {
    const left = GOODS.map((g) => g.id).filter((id) => s.cargo[id] > 0);
    if (!left.length) break;
    const id = left[Math.floor(rng() * left.length)];
    s.cargo[id]--;
    taken.push(good(id).name.toLowerCase());
  }
  say(s, 'kotu', `${who} pusu kurdu. ${taken.join(' ve ')} kaptırdın. Handan muhafız tutabilirsin.`);
}

export function buy(s, id) {
  const p = s.pending;
  if (!p || p.type !== 'pazar') return false;
  const cost = price(s, p.city, id);
  if (s.gold < cost || load(s) >= capacity(s) || s.stock[p.city][id] < 2) return false;
  s.gold -= cost;
  s.cargo[id]++;
  s.stock[p.city][id]--;
  p.bought = true;
  s.mult = 1; // Usta çarpanı ilk alımda biter; aynı şehirde al-sat yapılamasın diye.
  return true;
}

export function sell(s, id) {
  const p = s.pending;
  if (!p || p.type !== 'pazar' || s.cargo[id] < 1) return false;
  s.gold += sellPrice(s, p.city, id);
  s.cargo[id]--;
  s.stock[p.city][id]++;
  p.sold = true;
  return true;
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
  if (n === 0) { say(s, 'kotu', 'Mekik doldu, kilim yarım kaldı.'); return true; }
  s.mult = Math.max(s.mult, MULT_BY_STARS[n]);
  let text = `Kilimi ${n} yıldızla dokudun. Bir sonraki pazarda satışların ×${MULT_BY_STARS[n]}.`;
  if (n >= 2) {
    const next = MOTIFS.find((m) => !s.album.includes(m.id));
    if (next) {
      s.album.push(next.id);
      text += ` Albüme ${next.name} motifi eklendi.`;
      if (s.album.length === MOTIFS.length) { s.gold += 500; text += ' Albüm tamamlandı: 500 altın.'; }
    }
  }
  say(s, 'iyi', text);
  return true;
}

export function upgradeHan(s) {
  if (s.han >= MAX_HAN || s.gold < hanCost(s)) return false;
  s.gold -= hanCost(s);
  s.han++;
  say(s, 'iyi', s.han === MAX_HAN
    ? 'Hanın artık Büyük Han. İpek Yolu seni konuşuyor.'
    : `Han ${s.han}. kata çıktı. Kervan artık ${capacity(s)} yük taşıyor.`);
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
  say(s, 'bilgi', 'Gün doğdu. 10 zar yenilendi.');
  return true;
}
