// Dolgulu oyun çizimleri, 48×48. Renkler çizimin içindedir; sanatçı gelene kadar yer tutucu sanat.
const C = {
  ink: '#2a1b3d', red: '#c8372d', redD: '#8f2420', gold: '#f2b632', goldD: '#b9741a', goldL: '#ffe08a',
  cream: '#f6ead0', creamD: '#dcc59a', blue: '#2b4a8b', blueL: '#4a74c9', teal: '#2fa7a0', tealD: '#1d7f7a',
  wood: '#a8743a', woodD: '#7a4f24', sand: '#e2c48c', stone: '#9aa3b5', stoneD: '#6f7790', water: '#3b8fe0',
};

const A = {
  coin: `<circle cx="24" cy="26" r="18" fill="${C.goldD}"/><circle cx="24" cy="23" r="18" fill="${C.gold}"/>
    <circle cx="24" cy="23" r="12.5" fill="#e09f22"/><circle cx="24" cy="23" r="12.5" fill="none" stroke="${C.goldL}" stroke-width="1.6" stroke-dasharray="2.2 2.6"/>
    <path d="m24 15 2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.7-4.9 2.7 1.1-5.3-4-3.7 5.4-.6z" fill="#fff4cc"/>
    <ellipse cx="16" cy="13" rx="5" ry="2.4" fill="#fff" opacity=".5" transform="rotate(-32 16 13)"/>`,
  die: `<rect x="7" y="10" width="34" height="33" rx="8" fill="${C.creamD}"/><rect x="7" y="6" width="34" height="33" rx="8" fill="#fffaf0"/>
    <circle cx="16" cy="14.5" r="3.3" fill="${C.ink}"/><circle cx="24" cy="22.5" r="3.3" fill="${C.red}"/><circle cx="32" cy="30.5" r="3.3" fill="${C.ink}"/>`,
  cargo: `<path d="M14 19c-5 5-7.5 12-5.5 18 1.5 4.5 6 6 15.5 6s14-1.5 15.5-6c2-6-.5-13-5.5-18z" fill="${C.woodD}"/>
    <path d="M14 19c-5 5-7.5 12-5.5 18 1.4 4 5 5.6 12 5.9C15 38 13.5 29 17 20z" fill="${C.wood}"/>
    <path d="M16 11h16l-3.5 8h-9z" fill="#8a5a2b"/><rect x="15" y="17" width="18" height="4.5" rx="2.2" fill="${C.gold}"/>
    <path d="M19 31h10" stroke="#5e3a17" stroke-width="2.2" stroke-linecap="round"/>`,
  bonus: `<path d="m24 4 5.8 11.8 13 1.9-9.4 9.2 2.2 13L24 33.8l-11.6 6.1 2.2-13-9.4-9.2 13-1.9z" fill="${C.gold}" stroke="${C.goldD}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="m24 11 3 6.4 6.8.9" stroke="#fff4cc" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  camel: `<path d="M13 32v11M19 33v10M28 33v10M33 31v12" stroke="${C.woodD}" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M9 26 5.5 32" stroke="${C.woodD}" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="22" cy="28" rx="13.5" ry="7.5" fill="#dca14a"/><ellipse cx="20" cy="21" rx="7.5" ry="6.5" fill="#dca14a"/>
    <path d="M32 27 37.5 14" stroke="#dca14a" stroke-width="5.5" stroke-linecap="round"/><ellipse cx="40.5" cy="13" rx="5.2" ry="3.2" fill="#dca14a"/>
    <circle cx="41.5" cy="12" r="1" fill="${C.ink}"/>
    <path d="M13.5 21h14l-1.2 9h-11.6z" fill="${C.red}"/><path d="M14.5 25.5h12" stroke="${C.gold}" stroke-width="1.6" stroke-dasharray="2 1.6"/>`,
  help: `<circle cx="24" cy="25.5" r="17" fill="${C.creamD}"/><circle cx="24" cy="23" r="17" fill="${C.cream}"/>
    <path d="M18.8 18.6a5.4 5.4 0 1 1 7.6 5c-1.4.6-2.4 1.8-2.4 3.4v1" stroke="${C.ink}" stroke-width="3.6" stroke-linecap="round" fill="none"/>
    <circle cx="24" cy="33.5" r="2.4" fill="${C.ink}"/>`,
  loom: `<rect x="7" y="8" width="5" height="33" rx="2" fill="${C.woodD}"/><rect x="36" y="8" width="5" height="33" rx="2" fill="${C.woodD}"/>
    <rect x="5" y="9" width="38" height="5.5" rx="2.7" fill="${C.wood}"/>
    <path d="M16 14.5v6M20 14.5v6M24 14.5v6M28 14.5v6M32 14.5v6" stroke="${C.cream}" stroke-width="1.3"/>
    <rect x="12" y="20" width="24" height="17" fill="${C.red}"/><path d="m24 22 5 6.5-5 6.5-5-6.5z" fill="${C.cream}"/><path d="m24 25.5 2.4 3-2.4 3-2.4-3z" fill="${C.blue}"/>
    <rect x="5" y="36" width="38" height="5.5" rx="2.7" fill="${C.wood}"/>`,
  well: `<path d="M13 21V9M35 21V9" stroke="${C.woodD}" stroke-width="3.2" stroke-linecap="round"/><path d="M10 9h28" stroke="${C.wood}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M24 9v6" stroke="#5e3a17" stroke-width="1.5"/><rect x="21" y="14.5" width="6" height="5" rx="1" fill="${C.wood}"/>
    <path d="M9 22h30v15a5 5 0 0 1-5 5H14a5 5 0 0 1-5-5z" fill="${C.stone}"/>
    <path d="M9 29h30M9 35.5h30M17 22v7M31 22v7M13 29v6.5M24 29v6.5M35 29v6.5" stroke="${C.stoneD}" stroke-width="1.5"/>
    <ellipse cx="24" cy="22" rx="15" ry="4.2" fill="#7e879c"/><ellipse cx="24" cy="22.4" rx="12" ry="2.8" fill="${C.water}"/><ellipse cx="21" cy="21.8" rx="5" ry="1" fill="#a9d4ff"/>`,
  ambush: `<path d="M9.5 39C15 30 25 18 39 7.5c-2.5 9.5-11 20.5-23.5 31z" fill="#e9eef6"/><path d="M14 36c6-7 13-15 21-23" stroke="#b8c2d3" stroke-width="1.4"/>
    <path d="M38.5 39C33 30 23 18 9 7.5c2.5 9.5 11 20.5 23.5 31z" fill="#cfd7e4"/>
    <path d="m7.5 34.5 6.5 6.5M40.5 34.5 34 41" stroke="${C.red}" stroke-width="4.2" stroke-linecap="round"/>
    <circle cx="10.5" cy="38" r="2.8" fill="${C.gold}"/><circle cx="37.5" cy="38" r="2.8" fill="${C.gold}"/>`,
  road: `<ellipse cx="16" cy="31" rx="4.6" ry="2.8" fill="#c9a66b"/><ellipse cx="30" cy="20" rx="4.6" ry="2.8" fill="#c9a66b"/>
    <ellipse cx="27" cy="35" rx="2.6" ry="1.6" fill="#b8925a"/><ellipse cx="18" cy="17" rx="2.2" ry="1.4" fill="#b8925a"/>`,
  route: `<path d="m7 12 11-4 12 4 11-4v29l-11 4-12-4-11 4z" fill="${C.cream}"/><path d="M18 8v29M30 12v29" stroke="${C.creamD}" stroke-width="1.6"/>
    <path d="M11 31c4-2 6-8 10-8s6 6 10 4 4-9 6.5-11" stroke="${C.red}" stroke-width="2.2" stroke-dasharray="3 2.6" fill="none" stroke-linecap="round"/>
    <circle cx="38" cy="15" r="3" fill="${C.red}"/>`,
  inn: `<path d="M3 19h42l-5-7H8z" fill="${C.woodD}"/><rect x="6" y="19" width="36" height="22" fill="#dcae72"/>
    <path d="M19 41V31a5 5 0 0 1 10 0v10z" fill="#5b2d1a"/><path d="M10 29v-2a2.5 2.5 0 0 1 5 0v2zM33 29v-2a2.5 2.5 0 0 1 5 0v2z" fill="#5b2d1a"/>
    <path d="M6 23h36" stroke="${C.teal}" stroke-width="2"/><path d="M24 12V4" stroke="#5e3a17" stroke-width="2"/><path d="M24 4.5h8l-2.5 2.5L32 9.5h-8z" fill="${C.red}"/>`,
  album: `<rect x="9" y="7" width="31" height="36" rx="3" fill="${C.blue}"/><rect x="9" y="7" width="6" height="36" rx="2" fill="#1e3466"/>
    <rect x="19" y="14" width="16" height="17" rx="2" fill="${C.cream}"/><path d="m27 16.5 5.5 6-5.5 6-5.5-6z" fill="${C.red}"/><path d="m27 20 2.2 2.5-2.2 2.5-2.2-2.5z" fill="${C.cream}"/>
    <path d="M20 36h14" stroke="${C.gold}" stroke-width="2" stroke-linecap="round"/>`,
  log: `<rect x="11" y="6" width="26" height="36" rx="3" fill="${C.cream}"/><path d="M11 10a4 4 0 0 0-4 4v2h4zM37 38a4 4 0 0 0 4-4v-2h-4z" fill="${C.creamD}"/>
    <path d="M16 15h16M16 21h16M16 27h11M16 33h14" stroke="${C.wood}" stroke-width="2.2" stroke-linecap="round"/>`,
  guard: `<path d="m24 4 16 5.5v11.5c0 10.5-6.5 17.5-16 22-9.5-4.5-16-11.5-16-22V9.5z" fill="#1e3466"/>
    <path d="m24 8.5 12 4v9c0 8.2-5 14-12 17.5-7-3.5-12-9.3-12-17.5v-9z" fill="${C.blueL}"/>
    <path d="m24 14.5 2.7 5.5 6 .9-4.4 4.2 1 6L24 28.3l-5.3 2.8 1-6-4.4-4.2 6-.9z" fill="${C.gold}"/>`,
  lock: `<rect x="11" y="21" width="26" height="20" rx="4" fill="#4a5480"/><path d="M16 21v-5a8 8 0 0 1 16 0v5" stroke="#4a5480" stroke-width="4.5" fill="none"/><circle cx="24" cy="30" r="3" fill="#2a3058"/>`,
  ipek: `<path d="M37 29c5 2 7.5 7 5 12l-7-5z" fill="#e45c8a"/><rect x="10" y="11" width="28" height="25" rx="4" fill="#e45c8a"/>
    <path d="M20 11c4.5 8.5 4.5 16.5 0 25M28 11c4.5 8.5 4.5 16.5 0 25" stroke="#f9a7c3" stroke-width="2" fill="none"/>
    <ellipse cx="10" cy="23.5" rx="4.5" ry="12.5" fill="#b83a66"/><ellipse cx="10" cy="23.5" rx="1.8" ry="5.2" fill="#6e1a3c"/>`,
  baharat: `<path d="M12 21c-3.5 6-3.5 14 0 19.5 2 3 6 4.5 12 4.5s10-1.5 12-4.5c3.5-5.5 3.5-13.5 0-19.5z" fill="#c99556"/>
    <path d="M12 21c-3.5 6-3.5 14 0 19.5 1.6 2.4 4.4 3.8 8.6 4.3C15 39 14.5 30 17 22z" fill="#d8a96a"/>
    <ellipse cx="24" cy="21" rx="12.5" ry="4.2" fill="#9c6a33"/><path d="M13.5 20c2-7 19-7 21 0-4.5 2.4-16.5 2.4-21 0z" fill="#e8672a"/>
    <circle cx="20" cy="15.5" r="1.4" fill="#ffb26b"/><circle cx="27" cy="14.5" r="1.4" fill="#ffb26b"/><circle cx="24" cy="17.5" r="1.2" fill="#c44d16"/>`,
  cay: `<ellipse cx="24" cy="41.5" rx="15" ry="3.8" fill="${C.creamD}"/><ellipse cx="24" cy="40.5" rx="15" ry="3.3" fill="${C.cream}"/>
    <path d="M15.5 9h17c0 5-4.2 8.4-4.2 13.6S32.5 32 32.5 39h-17c0-7 4.2-11.2 4.2-16.4S15.5 14 15.5 9z" fill="#ffffff" opacity=".45"/>
    <path d="M17.4 17.5h13.2c-1.6 2-2.3 3.4-2.3 5.1 0 4.6 3.9 9 4.2 16.4h-17c.3-7.4 4.2-11.8 4.2-16.4 0-1.7-.7-3.1-2.3-5.1z" fill="#b8321f"/>
    <path d="M15.5 9h17" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M19 22c0 4-2 7-2.4 12" stroke="#ffd0c4" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`,
  kilim: `<path d="M8 15H4.5M8 21H4.5M8 27H4.5M8 33H4.5M40 15h3.5M40 21h3.5M40 27h3.5M40 33h3.5" stroke="${C.cream}" stroke-width="2" stroke-linecap="round"/>
    <rect x="8" y="10" width="32" height="28" rx="2" fill="${C.red}"/><rect x="11" y="13" width="26" height="22" fill="none" stroke="${C.gold}" stroke-width="2"/>
    <path d="m24 15.5 6.5 8.5-6.5 8.5-6.5-8.5z" fill="${C.blue}"/><path d="m24 19.5 3.4 4.5-3.4 4.5-3.4-4.5z" fill="${C.cream}"/>`,
};

// Şehirler: her biri kendi mimari simgesiyle.
const CITY = [
  // Şian: pagoda
  `<rect x="17" y="30" width="14" height="13" fill="${C.red}"/><path d="M9 31.5h30l-5-6H14z" fill="${C.blue}"/>
   <rect x="19" y="20" width="10" height="7" fill="${C.red}"/><path d="M12 21.5h24l-4.5-6h-15z" fill="${C.blue}"/>
   <rect x="21" y="11" width="6" height="6" fill="${C.red}"/><path d="M15 12.5h18l-4-5.5h-10z" fill="${C.blue}"/>
   <path d="M24 2.5V7" stroke="${C.gold}" stroke-width="2.4" stroke-linecap="round"/><rect x="22" y="36" width="4" height="7" rx="2" fill="${C.redD}"/>`,
  // Kaşgar: taçkapılı cami
  `<rect x="6.5" y="14" width="5" height="29" fill="#d8b277"/><rect x="36.5" y="14" width="5" height="29" fill="#d8b277"/>
   <path d="m6.5 14 2.5-5.5 2.5 5.5zM36.5 14l2.5-5.5 2.5 5.5z" fill="${C.teal}"/>
   <rect x="11.5" y="21" width="25" height="22" fill="#ecd09a"/><path d="M17 21a7 7 0 0 1 14 0z" fill="${C.teal}"/>
   <path d="M17.5 43V31a6.5 6.5 0 0 1 13 0v12z" fill="#8a5a2b"/><path d="M11.5 25h25" stroke="${C.teal}" stroke-width="1.8"/>`,
  // Semerkant: turkuaz dilimli kubbe
  `<rect x="11" y="29" width="26" height="14" fill="#ecd7aa"/><rect x="14" y="24.5" width="20" height="5" fill="#d9bf8c"/>
   <path d="M13.5 25.5c0-11.5 4.7-17.5 10.5-17.5s10.5 6 10.5 17.5z" fill="${C.teal}"/>
   <path d="M24 8v17.5M19 10.5c-2 4-3 9-3 15M29 10.5c2 4 3 9 3 15" stroke="${C.tealD}" stroke-width="1.6" fill="none"/>
   <path d="M24 8V3.5" stroke="${C.gold}" stroke-width="2.4" stroke-linecap="round"/><path d="M19.5 43v-7a4.5 4.5 0 0 1 9 0v7z" fill="${C.blue}"/>`,
  // Buhara: Kalyan minaresi
  `<rect x="5" y="32" width="12" height="11" fill="#ecd09a"/><path d="M5 32a6 6 0 0 1 12 0z" fill="${C.teal}"/>
   <rect x="31" y="30" width="12" height="13" fill="#ecd09a"/><path d="M31 30a6 6 0 0 1 12 0z" fill="${C.teal}"/>
   <path d="m19 43 2-30h6l2 30z" fill="#d8a96a"/><path d="M20.4 22h7.2M20 30h8M19.6 37h8.8" stroke="#a8743a" stroke-width="2"/>
   <rect x="18" y="9.5" width="12" height="5" rx="1" fill="#c99556"/><path d="M20 9.5a4 4 0 0 1 8 0z" fill="${C.teal}"/>`,
  // Tebriz: kapalı çarşı tonozları
  `<rect x="5" y="20" width="38" height="23" fill="#cf7d4f"/>
   <path d="M5 21c0-5.5 4.2-9 9.5-9s9.5 3.5 9.5 9c0-5.5 4.2-9 9.5-9s9.5 3.5 9.5 9z" fill="#b5653b"/>
   <circle cx="14.5" cy="14" r="2" fill="${C.gold}"/><circle cx="33.5" cy="14" r="2" fill="${C.gold}"/>
   <path d="M9 43v-9.5a5.5 5.5 0 0 1 11 0V43zM28 43v-9.5a5.5 5.5 0 0 1 11 0V43z" fill="#5b2d1a"/><path d="M5 27h38" stroke="#e3a274" stroke-width="1.6"/>`,
  // İstanbul: kubbeler ve minareler
  `<rect x="5.5" y="12" width="3.4" height="31" fill="#efe3c8"/><path d="m5.5 12 1.7-8 1.7 8z" fill="${C.blue}"/>
   <rect x="39.1" y="12" width="3.4" height="31" fill="#efe3c8"/><path d="m39.1 12 1.7-8 1.7 8z" fill="${C.blue}"/>
   <rect x="11" y="30" width="26" height="13" fill="#efe3c8"/>
   <path d="M10 33.5c0-4.4 2.2-6.8 5.2-6.8s5.2 2.4 5.2 6.8zM27.6 33.5c0-4.4 2.2-6.8 5.2-6.8s5.2 2.4 5.2 6.8z" fill="#7a8fb8"/>
   <path d="M14 31c0-9.5 4.5-14.5 10-14.5S34 21.5 34 31z" fill="#90a4cc"/><path d="M24 16.5v-5" stroke="${C.gold}" stroke-width="2.4" stroke-linecap="round"/>
   <path d="M21 43v-5a3 3 0 0 1 6 0v5z" fill="${C.blue}"/>`,
];

export const TILE_ICON = { sehir: 'route', tezgah: 'loom', kuyu: 'well', pusu: 'ambush', yol: 'road' };

const svg = (body, cls) => `<svg class="i ${cls}" viewBox="0 0 48 48" aria-hidden="true">${body}</svg>`;
export const icon = (name, cls = '') => svg(A[name] || '', cls);
export const cityArt = (i, cls = '') => svg(CITY[i], cls);
