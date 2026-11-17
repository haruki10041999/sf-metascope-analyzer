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

import { resolveReport, writeReportHtml } from '../../../../src/builder/reportBuilder';
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
    const resolved = resolveReport(document, document.diff ? sample : { after: sample.after });
    if (!resolved.ok) {
        console.error(JSON.stringify(resolved.issues, null, 2));
        process.exitCode = 1;
        return;
    }
    const output = path.resolve(here, '../output', `${path.basename(specFile, '.json')}.html`);
    console.log(await writeReportHtml(resolved.report, output));
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await main();
}
