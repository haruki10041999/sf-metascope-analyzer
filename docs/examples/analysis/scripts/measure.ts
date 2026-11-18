/**
 * 保存・parse・依存関係・差分の時間と大きさを測る (docs/save-format-plan.md 1.7 の表。段階 S0。置き場の行は S4・S5。
 * 大きいリポジトリは docs/implementation-roadmap.md 8 章の M1〜M5)
 *
 *   npx ttsx --noCheck docs/examples/analysis/scripts/measure.ts                     # サンプル (before → after)
 *   npx ttsx --noCheck docs/examples/analysis/scripts/measure.ts <before> <after>     # ほかのリポジトリ (sfdx のプロジェクト)
 *   npx ttsx --noCheck docs/examples/analysis/scripts/measure.ts <repo> <repo> --runs 3   # 同じものを 3 回測り、中央値を出す
 *
 * 選べるもの:
 *   --runs N     同じ計測を N 回行い、中央値を出す (既定 1)。PC によってはぶれが大きい (同じ計測で 2 倍以上違うこともある) ので、
 *                比べるときは 3 回以上にする
 *   --threads N  置き場の読み込みの parse を worker_threads に任せる (RepositoryProcessor の threads と同じ)。
 *                ttsx で動かすとスレッドごとの準備に十数秒かかるので、ビルド版で測る値とは違う
 *
 * 大きいリポジトリでもメモリが足りるように、解析結果は 1 つずつ測って手放す (前は同じリポジトリを同時に 3 つ持ち、
 * NPSP では 8 GB を超えて止まった)。before と after が同じなら差分は測らない。保存データは一時フォルダに書いて消す
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { buildDependencyGraph } from '../../../../src/analyzer/processor/dependency/graph';
import {
    ProjectTree,
    Repository,
    RepositoryProcessor,
    closeAllStoreBackends,
    WorkingTree,
    diffRepositories,
    getRepositoryDependencies,
} from '../../../../src/analyzer/unit';
import { repositoryOf } from '../../paths';

const args = process.argv.slice(2);
const option = (name: string, fallback: number): number => {
    const index = args.indexOf(name);
    if (index < 0) return fallback;
    const value = Number(args[index + 1]);
    args.splice(index, 2);
    if (!Number.isInteger(value) || value < 0) throw new Error(`${name} は 0 以上の整数`);
    return value;
};
const runs = Math.max(1, option('--runs', 1));
const threads = option('--threads', 0);
const [beforeRoot = repositoryOf('before'), afterRoot = repositoryOf('after')] = args;
const sameRoot = path.resolve(beforeRoot) === path.resolve(afterRoot);

const time = async <T>(fn: () => T | Promise<T>): Promise<[T, number]> => {
    const start = performance.now();
    const value = await fn();
    return [value, performance.now() - start];
};

const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = sorted.length >> 1;
    return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
};

/** 中央値 (2 回以上なら、範囲も出す) */
const ms = (values: number[]) =>
    values.length === 1
        ? `${values[0]!.toFixed(1)} ms`
        : `${median(values).toFixed(1)} ms (${Math.min(...values).toFixed(0)}〜${Math.max(...values).toFixed(0)})`;
const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;
const heapMb = () => `${(process.memoryUsage().heapUsed / 1048576).toFixed(0)} MB`;

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
const sides = sameRoot ? [afterRoot] : [beforeRoot, afterRoot];
try {
    for (const [index, root] of sides.entries()) {
        const column = (label: string, value: string) => {
            const row =
                rows.find(([name]) => name === label) ?? rows[rows.push([label, '', '']) - 1]!;
            row[(sameRoot ? 1 : index) + 1] = value;
        };
        const tree = new ProjectTree(new WorkingTree(root));
        column('ファイル数 (ProjectTree の範囲)', String((await tree.listFiles()).length));

        // すべて parse (置き場なし)。1 回ごとに手放す
        const parse: number[] = [];
        const deps: number[] = [];
        const build: number[] = [];
        for (let run = 0; run < runs; run++) {
            const [repository, parseTime] = await time(() => Repository.load(tree));
            parse.push(parseTime);
            const [dependencies, depsTime] = await time(() =>
                getRepositoryDependencies(repository),
            );
            deps.push(depsTime);
            const [graph, buildTime] = await time(() => buildDependencyGraph(dependencies));
            build.push(buildTime);
            if (run === 0) {
                column(
                    '単位の数',
                    String(repository.entries().reduce((n, [, results]) => n + results.length, 0)),
                );
                column(
                    '定義 / 参照 / ノード / 辺',
                    `${dependencies.reduce((n, u) => n + u.dependencies.definitions.length, 0)} / ${dependencies.reduce((n, u) => n + u.dependencies.references.length, 0)} / ${graph.nodes.size} / ${graph.edges.length}`,
                );
                column('すべて parse したあとのヒープ', heapMb());
            }
        }
        column('すべて parse', ms(parse));
        column('定義・参照 (getRepositoryDependencies)', ms(deps));
        column('グラフ (buildDependencyGraph)', ms(build));

        // 置き場 (UnitStore。SQLite。docs/save-format-plan.md 4.1)。最初は parse、起動し直すと保存したものを読む
        const cold: number[] = [];
        const save: number[] = [];
        const warm: number[] = [];
        const warmDeps: number[] = [];
        for (let run = 0; run < runs; run++) {
            const storeDir = path.join(tmp, `store-${index}-${run}`);
            const [first, coldTime] = await time(() =>
                RepositoryProcessor.create(storeDir, root, { threads }),
            );
            cold.push(coldTime);
            getRepositoryDependencies(first.after);
            const [, saveTime] = await time(() => first.save());
            save.push(saveTime);
            await first.close();
            const [second, warmTime] = await time(() =>
                RepositoryProcessor.create(storeDir, root, { threads }),
            );
            warm.push(warmTime);
            const [, warmDepsTime] = await time(() => getRepositoryDependencies(second.after));
            warmDeps.push(warmDepsTime);
            if (run === 0) {
                const stats = second.store.stats;
                const storeSize = await dirSize(path.join(storeDir, 'store'));
                column(
                    '置き場: 保存データ (ファイル数・合計)',
                    `${storeSize.files}・${kb(storeSize.bytes)}`,
                );
                column(
                    '置き場: 起動し直した読み込みの内訳 (parse / 読んだ / hash / 読まずに済んだ)',
                    `${stats.parsed} / ${stats.loaded} / ${stats.hashed} / ${stats.statHits}`,
                );
            }
            await second.close();
        }
        column(
            `置き場: 最初の読み込み (すべて parse${threads ? `・${threads} スレッド` : ''})`,
            ms(cold),
        );
        column('置き場: 保存 (解析結果・定義・参照・ソース)', ms(save));
        column('置き場: 起動し直した読み込み', ms(warm));
        column('置き場: 起動し直したあとの定義・参照', ms(warmDeps));
    }
    if (!sameRoot) {
        // 差分は before と after を両方持つので、最後に読み直す
        const before = await Repository.load(new ProjectTree(new WorkingTree(beforeRoot)));
        const after = await Repository.load(new ProjectTree(new WorkingTree(afterRoot)));
        const diff: number[] = [];
        for (let run = 0; run < runs; run++) {
            diff.push((await time(() => diffRepositories(before, after)))[1]);
        }
        rows.push(['差分 (diffRepositories、before → after)', '—', ms(diff)]);
    }
} finally {
    closeAllStoreBackends();
    await fs.rm(tmp, { recursive: true, force: true });
}

console.log(
    `Node ${process.version}・${os.platform()} ${os.release()}・${runs} 回${runs > 1 ? 'の中央値 (最小〜最大)' : ''}${threads ? `・parse ${threads} スレッド` : ''}\n`,
);
console.log(
    sameRoot ? '| 項目 | 値 |\n| --- | --- |' : '| 項目 | before | after |\n| --- | --- | --- |',
);
for (const [label, before, after] of rows) {
    console.log(sameRoot ? `| ${label} | ${after} |` : `| ${label} | ${before} | ${after} |`);
}
