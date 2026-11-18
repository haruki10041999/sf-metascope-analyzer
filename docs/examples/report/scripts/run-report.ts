/**
 * サンプルのリポジトリから、レポートの文書 (specs/*.json) の HTML を作る (docs/implementation-roadmap.md の R1)。
 * 文書が diff: true なら before → after を比べ、そうでなければ after の 1 時点のレポートにする (MCP のツールと同じ既定)。
 * 先に viewer をビルドしておく: npm run build:report
 *
 *   npx ttsx --noCheck docs/examples/report/scripts/run-report.ts [specs/<名前>.json]
 *
 * 出力: output/<名前>.html (大きいのでコミットしない)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveReport, writeReportSite } from '../../../../src/builder/reportBuilder';
import { ProjectTree, Repository, WorkingTree } from '../../../../src/analyzer/unit';
import { repositoryOf } from '../../paths';

const here = path.dirname(fileURLToPath(import.meta.url));

export const loadSampleInput = async () => ({
    before: await Repository.load(new ProjectTree(new WorkingTree(repositoryOf('before')))),
    after: await Repository.load(new ProjectTree(new WorkingTree(repositoryOf('after')))),
});

const main = async () => {
    const specFile = path.resolve(here, '..', process.argv[2] ?? 'specs/code-interface.json');
    const document = JSON.parse(await fs.readFile(specFile, 'utf8'));
    const sample = await loadSampleInput();
    // データごとの比べ方 (部品の data の diff) も、サンプルの before → after で作る (git の範囲は使えない)
    const resolved = resolveReport(document, document.diff ? sample : { after: sample.after }, {
        inputFor: (comparison) =>
            comparison.kind === 'diff'
                ? { input: sample, compared: 'before → after' }
                : comparison.kind === 'current'
                  ? { input: { after: sample.after }, compared: 'after' }
                  : undefined,
    });
    if (!resolved.ok) {
        console.error(JSON.stringify(resolved.issues, null, 2));
        process.exitCode = 1;
        return;
    }
    // ページに分けた文書は、output/<名前>/ に目次 (index.html) とページ (pages/) を書く
    const name = path.basename(specFile, '.json');
    const output = resolved.pages?.length
        ? path.resolve(here, '../output', name, 'index.html')
        : path.resolve(here, '../output', `${name}.html`);
    console.log(await writeReportSite(resolved, output));
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await main();
}
