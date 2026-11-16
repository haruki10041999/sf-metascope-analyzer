import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
    type Baseline,
    baselineFileOf,
    currentBaselineOf,
} from '../../docs/examples/analysis/scripts/baseline';
import { SIDES } from '../../docs/examples/paths';

// 依存関係の基準 (docs/json-redesign-plan.md の段階 M0)。サンプルのリポジトリのグラフの辺・指摘が、
// 基準 (docs/examples/analysis/output/baseline-<side>.json) から消えていないかを確かめる。増えるのはよい

describe('dependency baseline (参照の基準)', () => {
    for (const side of SIDES) {
        it(`keeps every edge and finding of the ${side} baseline`, async () => {
            const baseline = JSON.parse(
                await fs.readFile(baselineFileOf(side), 'utf8'),
            ) as Baseline;
            const current = await currentBaselineOf(side);
            const missing = (expected: string[], actual: string[]) => {
                const set = new Set(actual);
                return expected.filter((line) => !set.has(line));
            };
            assert.deepEqual(missing(baseline.edges, current.edges), [], 'edges');
            assert.deepEqual(missing(baseline.findings, current.findings), [], 'findings');
        });
    }
});
