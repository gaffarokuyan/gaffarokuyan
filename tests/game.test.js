import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seeded } from '../src/rng.js';
import * as L from '../src/loom.js';
import * as G from '../src/game.js';

test('üretilen her tezgâh çözülebilir ve en iyi hamleler en iyi skoru verir', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const p = L.generate(seeded(seed), { rows: 4 + (seed % 3) });
    assert.ok(p.best >= 1 && p.best < p.cap);
    let guard = 0;
    while (p.status === 'play') {
      assert.ok(L.tap(p, L.bestMove(p)));
      assert.ok(++guard < 100);
    }
    assert.equal(p.status, 'won');
    assert.equal(p.peak, p.best);
    assert.equal(L.stars(p), 3);
  }
});

test('mekik dolunca bölüm kaybedilir', () => {
  const p = { rows: ['kok'], per: 1, row: 0, woven: 0, cols: [['kok', 'civit', 'cehri']], buf: [], cap: 2, peak: 0, status: 'play', best: 1 };
  L.tap(p, 0);
  assert.equal(p.status, 'play');
  L.tap(p, 0);
  assert.equal(p.status, 'lost');
  assert.equal(L.stars(p), 0);
});

test('motif desenleri 7×7', () => {
  for (const m of G.MOTIFS) assert.equal(m.px.length, 49, m.id);
});

function atMarket(city = 0) {
  const s = G.newGame();
  s.pending = { type: 'pazar', city, bought: false, sold: false };
  return s;
}

test('aynı şehirde al-sat kâr bırakmaz', () => {
  for (const g of G.GOODS) {
    const s = atMarket(0);
    s.gold = 100000;
    const start = s.gold;
    for (let i = 0; i < 6; i++) assert.ok(G.buy(s, g.id));
    for (let i = 0; i < 6; i++) assert.ok(G.sell(s, g.id));
    assert.ok(s.gold < start, g.id);
  }
});

test('usta çarpanı ilk alımda biter, satışta geçerlidir', () => {
  const s = atMarket(5);
  s.cargo.ipek = 1;
  const plain = G.sellPrice(s, 5, 'ipek');
  s.mult = 2;
  assert.ok(G.sellPrice(s, 5, 'ipek') > plain * 1.9);
  G.buy(s, 'cay');
  assert.equal(s.mult, 1);
});

test('kapasite ve altın sınırı uygulanır', () => {
  const s = atMarket(0);
  s.gold = 100000;
  let n = 0;
  while (G.buy(s, 'cay')) n++;
  assert.equal(n, G.capacity(s));
  const poor = atMarket(0);
  poor.gold = 0;
  assert.equal(G.buy(poor, 'cay'), false);
});

test("Şian'da ipek almak İstanbul'da satınca kâr ettirir", () => {
  const s = atMarket(0);
  const cost = G.price(s, 0, 'ipek');
  G.buy(s, 'ipek');
  G.leaveMarket(s);
  s.pending = { type: 'pazar', city: 5, bought: false, sold: false };
  assert.ok(G.sellPrice(s, 5, 'ipek') > cost * 2);
});

test('zar kervanı ilerletir, halka tamamlanınca sefer sayılır', () => {
  const rng = seeded(7);
  const s = G.newGame();
  s.dice = 500;
  let rolls = 0;
  while (s.laps < 2) {
    assert.ok(++rolls < 400);
    const before = s.pos;
    if (!G.roll(s, rng)) assert.fail('zar atılamadı');
    assert.equal(s.pos, (before + s.lastRoll) % G.TILES.length);
    if (s.pending?.type === 'pazar') G.leaveMarket(s);
    if (s.pending?.type === 'tezgah') {
      while (s.pending.puzzle.status === 'play') G.loomTap(s, L.bestMove(s.pending.puzzle));
      G.finishLoom(s);
    }
    assert.equal(s.pending, null);
    for (const st of s.stock) for (const id in st) assert.ok(st[id] >= 1);
    for (const id in s.cargo) assert.ok(s.cargo[id] >= 0);
  }
  assert.ok(s.album.length > 0);
});

test('bekleyen olay varken zar atılamaz', () => {
  const s = atMarket(0);
  assert.equal(G.roll(s, seeded(1)), false);
});

test('han yükseltmesi kapasiteyi artırır ve 5. katta durur', () => {
  const s = G.newGame();
  s.gold = 1e6;
  const cap = G.capacity(s);
  assert.ok(G.upgradeHan(s));
  assert.equal(G.capacity(s), cap + 2);
  while (G.upgradeHan(s));
  assert.equal(s.han, G.MAX_HAN);
});

test('her günlük mesajı her dilde yazılabiliyor', async () => {
  const { logText, LANGS } = await import('../src/i18n.js');
  const rng = seeded(11);
  const s = G.newGame();
  s.dice = 400; s.gold = 5000;
  const seen = new Set();
  for (let i = 0; i < 150; i++) {
    if (!G.roll(s, rng)) G.newDay(s);
    if (s.pending?.type === 'pazar') { G.buy(s, 'ipek'); G.leaveMarket(s); }
    if (s.pending?.type === 'tezgah') {
      while (s.pending.puzzle.status === 'play') G.loomTap(s, i % 3 ? L.bestMove(s.pending.puzzle) : s.pending.puzzle.cols.findIndex((c) => c.length));
      G.finishLoom(s);
    }
    G.upgradeHan(s);
    for (const e of s.log) {
      seen.add(e.id);
      for (const lang of LANGS) {
        const text = logText(lang, e);
        assert.ok(text && !/undefined|NaN/.test(text), `${lang}: ${e.id} -> ${text}`);
      }
    }
  }
  assert.ok(seen.size >= 8, [...seen].join(','));
});

test('ortalama alış maliyeti alım, satış ve pusuda doğru izlenir', () => {
  const s = atMarket(0);
  s.gold = 10000;
  const a = G.price(s, 0, 'ipek'); G.buy(s, 'ipek');
  const b = G.price(s, 0, 'ipek'); G.buy(s, 'ipek');
  assert.equal(G.avgCost(s, 'ipek'), Math.round((a + b) / 2));
  G.sell(s, 'ipek');
  assert.equal(G.avgCost(s, 'ipek'), Math.round((a + b) / 2));
  assert.ok(G.sellAll(s, 'ipek'));
  assert.equal(s.cargo.ipek, 0);
  assert.ok(Math.abs(s.costs.ipek) < 1e-9);
  assert.equal(G.avgCost(s, 'ipek'), 0);
});

test('her dilde aynı arayüz metinleri var', async () => {
  const { DICT } = await import('../src/i18n.js');
  for (const lang of Object.keys(DICT)) {
    assert.deepEqual(Object.keys(DICT[lang].ui).sort(), Object.keys(DICT.tr.ui).sort(), lang);
    assert.deepEqual(Object.keys(DICT[lang].log).sort(), Object.keys(DICT.tr.log).sort(), lang);
    assert.equal(DICT[lang].ui.tutorial.length, DICT.tr.ui.tutorial.length, lang);
    for (const k of ['cities', 'cityAbbr']) assert.equal(DICT[lang][k].length, 6, `${lang}.${k}`);
    assert.equal(DICT[lang].bots.length, G.BOT_COUNT, `${lang}.bots`);
  }
  assert.equal(DICT.ku.ui.market('Semerqend'), 'Bazara Semerqendê');
});
