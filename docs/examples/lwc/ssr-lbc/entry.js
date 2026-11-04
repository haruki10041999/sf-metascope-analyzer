// lightning-base-components を使ったコンポーネント (c/demo) を @lwc/engine-server で HTML にする
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderComponent } from '@lwc/engine-server';
import Demo from 'c/demo';

const here = path.dirname(fileURLToPath(import.meta.url));
const html = renderComponent('c-demo', Demo, {});
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
const withoutStyles = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
console.log(`HTML: ${html.length} 文字 (style を除くと ${withoutStyles.length} 文字)`);
console.log(`style: ${styles.length} 個 (重複を除くと ${new Set(styles).size} 種類)`);
mkdirSync(path.join(here, 'dist'), { recursive: true });
writeFileSync(path.join(here, 'dist', 'demo.html'), `<!doctype html><meta charset="utf-8">${html}`);
