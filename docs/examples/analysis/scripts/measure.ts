/**
 * 保存・parse・依存関係・差分の時間と大きさを測る (docs/save-format-plan.md 1.7 の表。段階 S0)
 *
 *   npx ttsx --noCheck docs/examples/analysis/scripts/measure.ts                 # サンプル (before → after)
 *   npx ttsx --noCheck docs/examples/analysis/scripts/measure.ts <before> <after> # ほかのリポジトリ (sfdx のプロジェクト)
 *
 * 1 回だけ流した値を出す (ばらつきは見ない)。保存データは一時フォルダに書いて消す
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { buildDependencyGraph } from '../../../../src/analyzer/processor/dependency/graph';
import {
    ProjectTree,
    Repository,
    WorkingTree,
    diffRepositories,
    getRepositoryDependencies,
} from '../../../../src/analyzer/unit';
import { repositoryOf } from '../../paths';

const [beforeRoot = repositoryOf('before'), afterRoot = repositoryOf('after')] =
    process.argv.slice(2);

const time = async <T>(fn: () => T | Promise<T>): Promise<[T, number]> => {
    const start = performance.now();
    const value = await fn();
    return [value, performance.now() - start];
};

const ms = (value: number) => `${value.toFixed(1)} ms`;
const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;

const dirSize = async (dir: string): Promise<{ files: number; bytes: number }> => {
    let files = 0;
    let bytes = 0;
    for (const entry of await fs.readdir(dir, { withFileTypes: true, recursive: true })) {
        if (!entry.isFile()) continue;
        files++;
        bytes += (await fs.stat(path.join(entry.parentPath, entry.name))).size;
    }
    return { files, bytes };
};

const rows: [string, string, string][] = [];
const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'measure-'));
const repositories: Repository[] = [];
try {
    for (const [index, root] of [beforeRoot, afterRoot].entries()) {
        const tree = new ProjectTree(new WorkingTree(root));
        const files = (await tree.listFiles()).length;
        const [first, parse1] = await time(() => Repository.load(tree));
        const [repository, parse2] = await time(() => Repository.load(tree));
        repositories.push(repository);
        const units = repository.entries().reduce((n, [, results]) => n + results.length, 0);
        const saveDir = path.join(tmp, String(index));
        await fs.mkdir(saveDir, { recursive: true });
        const [, save] = await time(() => repository.save(saveDir));
        const saved = await dirSize(saveDir);
        const [, load] = await time(() => Repository.loadSaved(root, saveDir));
        const [dependencies, deps] = await time(() => getRepositoryDependencies(first));
        const [graph, build] = await time(() => buildDependencyGraph(dependencies));
        const definitions = dependencies.reduce((n, u) => n + u.dependencies.definitions.length, 0);
        const references = dependencies.reduce((n, u) => n + u.dependencies.references.length, 0);
        const column = (label: string, value: string) => {
            const row =
                rows.find(([name]) => name === label) ?? rows[rows.push([label, '', '']) - 1]!;
            row[index + 1] = value;
        };
        column('ファイル数 (ProjectTree の範囲)', String(files));
        column('単位の数', String(units));
        column('すべて parse #1', ms(parse1));
        column('すべて parse #2', ms(parse2));
        column('保存 (Repository.save)', ms(save));
        column('保存データ (ファイル数・合計)', `${saved.files}・${kb(saved.bytes)}`);
        column('読み込み (Repository.loadSaved)', ms(load));
        column('定義・参照 (getRepositoryDependencies)', ms(deps));
        column('グラフ (buildDependencyGraph)', ms(build));
        column(
            '定義 / 参照 / ノード / 辺',
            `${definitions} / ${references} / ${graph.nodes.size} / ${graph.edges.length}`,
        );
    }
    const [, diff] = await time(() => diffRepositories(repositories[0]!, repositories[1]!));
    rows.push(['差分 (diffRepositories、before → after)', '—', ms(diff)]);
} finally {
    await fs.rm(tmp, { recursive: true, force: true });
}

console.log(`Node ${process.version}・${os.platform()} ${os.release()}\n`);
console.log('| 項目 | before | after |\n| --- | --- | --- |');
for (const [label, before, after] of rows) console.log(`| ${label} | ${before} | ${after} |`);
