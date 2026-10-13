// GitHub Release yaratadi va yig'ilgan fayllarni yuklaydi.
//
//   npm run build      — avval dist/ ga yig'ish
//   npm run release    — package.json'dagi versiya uchun release
//
// Tavsif CHANGELOG.md'dagi "## <versiya>" bo'limidan olinadi.
// Token: GH_TOKEN muhit o'zgaruvchisi yoki git'ning saqlangan hisobi (git credential).
// Teg (v<versiya>) oldindan yaratilib, push qilingan bo'lishi kerak.

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;
const tag = `v${version}`;
const { owner, repo } = pkg.build.publish[0];
const api = `https://api.github.com/repos/${owner}/${repo}`;

function token() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  const out = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n' }).toString();
  const m = /password=(.*)/.exec(out);
  if (!m) throw new Error('GitHub token topilmadi: GH_TOKEN ni bering yoki git orqali kiring.');
  return m[1].trim();
}

function notes() {
  const text = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
  const start = text.indexOf(`## ${version}`);
  if (start < 0) throw new Error(`CHANGELOG.md da "## ${version}" bo'limi yo'q`);
  const rest = text.slice(start).split('\n').slice(1).join('\n');
  const end = rest.search(/^## /m);
  return (end < 0 ? rest : rest.slice(0, end)).trim();
}

const dist = path.join(root, 'dist');
const assets = [
  `Kokcha-Setup-${version}.exe`,
  `Kokcha-Setup-${version}.exe.blockmap`,
  'latest.yml',
  `Kokcha-${version}-portable.exe`,
];
for (const a of assets) {
  if (!fs.existsSync(path.join(dist, a))) throw new Error(`dist/${a} topilmadi — avval "npm run build"`);
}

const headers = { Authorization: `Bearer ${token()}`, Accept: 'application/vnd.github+json', 'User-Agent': 'kokcha-release' };

let res = await fetch(`${api}/releases/tags/${tag}`, { headers });
let release;
if (res.ok) {
  release = await res.json();
  console.log(`Release ${tag} allaqachon bor — fayllar yangilanadi`);
} else {
  res = await fetch(`${api}/releases`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tag_name: tag, name: `Ko'kcha ${version}`, body: notes() }),
  });
  release = await res.json();
  if (!res.ok) throw new Error(`Release yaratilmadi: ${res.status} ${release.message}`);
  console.log(`Release ${tag} yaratildi`);
}

for (const name of assets) {
  const old = (release.assets || []).find((a) => a.name === name);
  if (old) await fetch(`${api}/releases/assets/${old.id}`, { method: 'DELETE', headers });
  const body = fs.readFileSync(path.join(dist, name));
  const up = await fetch(`https://uploads.github.com/repos/${owner}/${repo}/releases/${release.id}/assets?name=${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/octet-stream' },
    body,
  });
  const a = await up.json();
  if (!up.ok) throw new Error(`${name} yuklanmadi: ${up.status} ${a.message}`);
  console.log(`  ✓ ${name} (${(a.size / 1048576).toFixed(1)} MB)`);
}
console.log(release.html_url);
