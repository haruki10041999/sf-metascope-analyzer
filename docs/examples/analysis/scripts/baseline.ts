/**
 * サンプルのリポジトリ (before / after) の依存関係の基準。docs/json-redesign-plan.md の段階 M0
 *
 * グラフの辺 (メンバーの細かさ → 参照先のノード) と、ない参照の指摘を、行の一覧にする。
 * JSON・参照の取り出しを作り直す段階 (M1〜M7・A3 など) で、基準の行が消えていないかを
 * test/dependency/baseline.test.ts で確かめる。行が増えるのはよい (足した参照)。
 * 減るのが正しいとき (2 本の辺を 1 本にしたなど) は、理由を確かめてから基準を作り直す:
 *
 *   npx ttsx --noCheck docs/examples/analysis/scripts/baseline.ts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { type DependencyGraph, toLevel } from '../../../../src/analyzer/processor/dependency/graph';
import {
    ProjectTree,
    Repository,
    WorkingTree,
    analyzeDependencies,
} from '../../../../src/analyzer/unit';
import { SIDES, type Side, repositoryOf } from '../../paths';

const here = path.dirname(fileURLToPath(import.meta.url));

/** 基準のファイル */
export const baselineFileOf = (side: Side): string =>
    path.join(here, '..', 'output', `baseline-${side}.json`);

export type Baseline = {
    /** '<参照元 (メンバー)> --<kind>--> <参照先>' */
    edges: string[];
    /** '<code> <参照先> <- <参照元 (単位)>' */
    findings: string[];
};

const sorted = (lines: Iterable<string>) => [...new Set(lines)].sort();

/** グラフの基準の行 */
export const baselineOf = (graph: DependencyGraph): Baseline => ({
    edges: sorted(
        graph.edges.map(
            (edge) => `${toLevel(graph, edge.from, 'member')} --${edge.kind}--> ${edge.to}`,
        ),
    ),
    findings: sorted(
        graph.findings.map(
            (finding) =>
                `${finding.code} ${finding.target} <- ${toLevel(graph, finding.from, 'unit')}`,
        ),
    ),
});

/** サンプルのリポジトリの今の基準 */
export const currentBaselineOf = async (side: Side): Promise<Baseline> => {
    const repository = await Repository.load(new ProjectTree(new WorkingTree(repositoryOf(side))));
    return baselineOf(analyzeDependencies(repository));
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
    for (const side of SIDES) {
        const baseline = await currentBaselineOf(side);
        await fs.writeFile(baselineFileOf(side), `${JSON.stringify(baseline, null, 4)}\n`);
        console.log(
            `${side}: ${baseline.edges.length} edges, ${baseline.findings.length} findings`,
        );
    }
}
