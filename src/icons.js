// Çizgi ikonlar: 24×24, renk currentColor'dan gelir.
const P = {
  city: '<path d="M3 20h18M5 20v-7h14v7M7.5 13a4.5 4.5 0 0 1 9 0M12 4v4.5M10 20v-3.5h4V20"/>',
  loom: '<path d="M5 3v18M19 3v18M5 6.5h14M5 17.5h14M9 6.5v11M12 6.5v11M15 6.5v11"/>',
  well: '<path d="M12 3.5s6 6.8 6 10.8a6 6 0 0 1-12 0c0-4 6-10.8 6-10.8z"/>',
  ambush: '<path d="M14.5 5.5 20 4l-1.5 5.5L9 19l-4-4zM7 13l4 4M4 20l2.5-2.5"/>',
  road: '<circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/>',
  die: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.3" fill="currentColor" stroke="none"/>',
  cargo: '<path d="m4 8 8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8"/>',
  bonus: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.7.3-1.2.9-1.2 1.6v.4"/><circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none"/>',
  route: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14"/>',
  inn: '<path d="M3 21h18M5 21V9.5L12 4l7 5.5V21M9.5 21v-5.5h5V21M9 11.5h.01M15 11.5h.01"/>',
  album: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  log: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none"/>',
  guard: '<path d="M12 3 5 6v5.5c0 4.3 3 7.8 7 9.5 4-1.7 7-5.2 7-9.5V6z"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  ipek: '<path d="M7 4h10M7 20h10M8.5 4v16M15.5 4v16M8.5 8l7 2.5M8.5 12.5l7 2.5M8.5 17l7-1"/>',
  baharat: '<path d="M9 3h6v3H9zM9.5 6v2C7.5 9 6.5 11 6.5 13v6a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-6c0-2-1-4-3-5V6"/>',
  cay: '<path d="M5 10h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 11h1a2 2 0 0 1 0 4h-1M9 3.5c0 1.8 1.5 1.8 1.5 3.5M12.5 3.5c0 1.8 1.5 1.8 1.5 3.5"/>',
  kilim: '<rect x="5" y="4" width="14" height="16" rx="1"/><path d="m12 8 3 4-3 4-3-4zM3 7h2M3 12h2M3 17h2M19 7h2M19 12h2M19 17h2"/>',
};

export const TILE_ICON = { sehir: 'city', tezgah: 'loom', kuyu: 'well', pusu: 'ambush', yol: 'road' };

export function icon(name, cls = '') {
  return `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}
