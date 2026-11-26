import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { describe, it } from 'node:test';

import {
    type StoreDump,
    currentStoreDumpOf,
    storeDumpFileOf,
} from '../../docs/examples/analysis/scripts/store';
import { SIDES } from '../../docs/examples/paths';

// 保存の置き場 (SQLite) の形のゴールデン (docs/plan.md 10 章 P3)。サンプルのリポジトリを保存し、表の行の数・
// ノードの種類・定義と参照の行が、docs/examples/analysis/output/store-<side>.json と同じかを確かめる。
// 違いが意図したものなら、確かめてから docs/examples/analysis/scripts/store.ts で作り直す

describe('保存の置き場の形 (store のゴールデン)', () => {
    for (const side of SIDES) {
        it(`${side} のサンプルを保存した表の中身が、ゴールデンと同じ`, async () => {
            const golden = JSON.parse(
                await fs.readFile(storeDumpFileOf(side), 'utf8'),
            ) as StoreDump;
            const current = await currentStoreDumpOf(side);
            assert.deepEqual(current.counts, golden.counts);
            assert.deepEqual(current.nodeKinds, golden.nodeKinds);
            assert.deepEqual(current.symbols, golden.symbols);
            assert.deepEqual(current.metrics, golden.metrics);
            assert.deepEqual(current.references, golden.references);
        });
    }
});
