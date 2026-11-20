// Oyunu tek dosyaya paketler:
//   dist/index.html  tarayıcıda doğrudan açılır
//   dist/kervan.html paylaşım sayfası için gövde parçası (doctype/head içermez)
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const out = await build({ entryPoints: ['src/ui.js'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020' });
const js = out.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
const css = await readFile('src/style.css', 'utf8');

const fragment = `<title>Kervan</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@600;700;800&display=swap">
<style>
${css}</style>
<div id="app"></div>
<script>${js}</script>
`;

await mkdir('dist', { recursive: true });
await writeFile('dist/kervan.html', fragment);
await writeFile('dist/index.html', `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head>
<body style="margin:0">
${fragment}</body></html>
`);
console.log(`dist/index.html ve dist/kervan.html yazıldı (${(fragment.length / 1024).toFixed(1)} KB)`);
