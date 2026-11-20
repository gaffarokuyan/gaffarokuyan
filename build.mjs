// Oyunu paketler:
//   dist/index.html   tarayıcıda doğrudan açılır (yazı tipleri Google Fonts'tan)
//   dist/kervan.html  paylaşım sayfası için gövde parçası (doctype/head içermez)
//   android/app/src/main/assets/  Android uygulamasının çevrimdışı oyun dosyaları (yazı tipleri dahil)
import { build } from 'esbuild';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const out = await build({ entryPoints: ['src/ui.js'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020' });
const js = out.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const css = await readFile('src/style.css', 'utf8');

const body = `<style>
${css}</style>
<div id="app"></div>
<script>${js}</script>
`;
const fragment = `<title>Kervan</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@600;700;800&display=swap">
${body}`;

await mkdir('dist', { recursive: true });
await writeFile('dist/kervan.html', fragment);
await writeFile('dist/index.html', `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head>
<body style="margin:0">
${fragment}</body></html>
`);

// Android: ağ izni olmadan çalışsın diye yazı tipleri de pakete girer (Latin + Türkçe karakterler).
const ASSETS = 'android/app/src/main/assets';
const FONTS = [
  ['Lilita One', '@fontsource/lilita-one', 'lilita-one', 400],
  ['Nunito', '@fontsource/nunito', 'nunito', 600],
  ['Nunito', '@fontsource/nunito', 'nunito', 700],
  ['Nunito', '@fontsource/nunito', 'nunito', 800],
];
const RANGES = {
  latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
};
await rm(ASSETS, { recursive: true, force: true });
await mkdir(`${ASSETS}/fonts`, { recursive: true });
let faces = '';
for (const [family, pkg, slug, weight] of FONTS) {
  for (const [subset, range] of Object.entries(RANGES)) {
    const file = `${slug}-${subset}-${weight}-normal.woff2`;
    await copyFile(`node_modules/${pkg}/files/${file}`, `${ASSETS}/fonts/${file}`);
    faces += `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:block;src:url(fonts/${file}) format("woff2");unicode-range:${range}}\n`;
  }
}
await writeFile(`${ASSETS}/index.html`, `<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<title>Kervan</title>
<style>${faces}
html,body{margin:0;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;overscroll-behavior:none}
img,svg{-webkit-user-drag:none}</style>
</head>
<body>
${body}</body></html>
`);
console.log(`dist/index.html, dist/kervan.html ve ${ASSETS}/ yazıldı (${(fragment.length / 1024).toFixed(1)} KB)`);
