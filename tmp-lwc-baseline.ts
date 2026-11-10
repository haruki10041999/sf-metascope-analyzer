// LWC を v2 につなぐ前の、広めの JS / TS の出力 (キーを除く) を保存する。比べるときも同じスクリプトを使う
import fs from 'node:fs';
import path from 'node:path';
import { convertLwcModule, parseLwcModule } from './src/analyzer/parser/Lwc/module';
const [mode, out] = process.argv.slice(2) as ['list' | 'save', string];
const strip = (v: unknown): unknown => Array.isArray(v) ? v.map(strip) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'objectKey' && k !== 'sourceKey').map(([k, c]) => [k, strip(c)])) : v;
const walk = (d: string, acc: string[] = []): string[] => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (acc.length < 4000) walk(p, acc); } else if (/\.(js|ts|mjs)$/.test(e.name) && !e.name.endsWith('.d.ts') && fs.statSync(p).size < 60000) acc.push(p); } return acc; };
if (mode === 'list') {
  const files = walk('node_modules').filter((_, i) => i % 7 === 0).slice(0, 400);
  fs.writeFileSync(path.join(out, 'files.json'), JSON.stringify(files));
  console.log(files.length);
} else {
  const files: string[] = JSON.parse(fs.readFileSync(path.join(out, 'files.json'), 'utf8'));
  const dir = path.join(out, mode === 'save' ? 'before' : 'after');
  fs.mkdirSync(dir, { recursive: true });
  let i = 0, failed = 0;
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
    const fp = `x${i}/x${i}${path.extname(f) === '.ts' ? '.ts' : '.js'}`;
    let res: unknown;
    try { const p = parseLwcModule(fp, src); const c = convertLwcModule(p); res = { module: strip(c.module), resolvedError: strip(p.resolvedError) }; } catch (e) { failed++; res = { exception: String(e).slice(0, 200) }; }
    fs.writeFileSync(path.join(dir, `${i}.json`), JSON.stringify(res, null, 1));
    i++;
  }
  console.log({ files: files.length, failed });
}
