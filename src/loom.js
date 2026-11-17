// İlmek: dokuma tezgâhı bulmacası.
// Tezgâh sırayla renk ister. Sütunların en üstündeki makara alınır:
// istenen renkse dokunur, değilse mekikte bekler. Mekik dolarsa bölüm kaybedilir.
export const THREADS = ['kok', 'civit', 'cehri', 'ceviz']; // kök boya, çivit, cehri, ceviz

function weave(p) {
  p.woven++;
  if (p.woven === p.per) { p.woven = 0; p.row++; }
}

function settle(p) {
  for (;;) {
    if (p.row >= p.rows.length) { p.status = 'won'; return; }
    const i = p.buf.indexOf(p.rows[p.row]);
    if (i < 0) break;
    p.buf.splice(i, 1);
    weave(p);
  }
  if (p.buf.length >= p.cap) p.status = 'lost';
}

export function tap(p, c) {
  if (p.status !== 'play') return false;
  const col = p.cols[c];
  if (!col || !col.length) return false;
  const color = col.pop();
  if (color === p.rows[p.row]) weave(p);
  else { p.buf.push(color); p.peak = Math.max(p.peak, p.buf.length); }
  settle(p);
  return true;
}

const clone = (p) => ({ ...p, cols: p.cols.map((c) => c.slice()), buf: p.buf.slice() });
const key = (p) => p.cols.map((c) => c.join(',')).join('|') + '#' + p.buf.slice().sort().join(',') + '#' + p.row + '.' + p.woven;

// Bu durumdan bitişe kadar mekikte aynı anda bekleyen en az iplik sayısı. Çözüm yoksa Infinity.
export function minPeak(p, memo = new Map()) {
  if (p.status === 'won') return 0;
  if (p.status === 'lost') return Infinity;
  const k = key(p);
  if (memo.has(k)) return memo.get(k);
  let best = Infinity;
  for (let c = 0; c < p.cols.length; c++) {
    if (!p.cols[c].length) continue;
    const q = clone(p);
    q.peak = 0;
    tap(q, c);
    if (q.status === 'lost') continue;
    best = Math.min(best, Math.max(q.peak, minPeak(q, memo)));
  }
  memo.set(k, best);
  return best;
}

// En iyi çözümü izleyen bir sonraki hamle (ipucu ve testler için).
export function bestMove(p) {
  const memo = new Map();
  let move = -1, best = Infinity;
  for (let c = 0; c < p.cols.length; c++) {
    if (!p.cols[c].length) continue;
    const q = clone(p);
    q.peak = 0;
    tap(q, c);
    if (q.status === 'lost') continue;
    const v = Math.max(q.peak, minPeak(q, memo));
    if (v < best) { best = v; move = c; }
  }
  return move;
}

export function generate(rng, { rows = 5, per = 3, cols = 4, cap = 5 } = {}) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const order = [];
    for (let r = 0; r < rows; r++) {
      let c;
      do { c = THREADS[Math.floor(rng() * THREADS.length)]; } while (c === order[r - 1]);
      order.push(c);
    }
    const spools = order.flatMap((c) => Array(per).fill(c));
    for (let i = spools.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [spools[i], spools[j]] = [spools[j], spools[i]];
    }
    const stacks = Array.from({ length: cols }, () => []);
    spools.forEach((s, i) => stacks[i % cols].push(s));
    const p = { rows: order, per, row: 0, woven: 0, cols: stacks, buf: [], cap, peak: 0, status: 'play', best: 0 };
    const best = minPeak(clone(p));
    // Çok kolay (hiç bekletmeden biten) ya da çözümsüz tezgâhları ele.
    if (best >= 1 && best < cap) { p.best = best; return p; }
  }
  throw new Error('Çözülebilir tezgâh üretilemedi');
}

// 3 yıldız: en iyi çözüm kadar az bekletme. 2: bir fazla. 1: tamamlandı. 0: mekik doldu.
export function stars(p) {
  if (p.status !== 'won') return 0;
  if (p.peak <= p.best) return 3;
  if (p.peak <= p.best + 1) return 2;
  return 1;
}
