import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';

import { goldenFileOf, goldenInputs, goldenOutputOf, serializeGolden } from './golden';

// IR v2 を本来の流れにつなぐときの比べる基準。今の出力 (キーの値を除く) がゴールデンと同じか (docs/ir-v2-integration.md 3.0)
// 違いが正しい変更なら npx ttsx --noCheck test/ir-v2/make-golden.ts で作り直す

describe('ゴールデン (サンプルの Apex・LWC の JSON)', () => {
    const inputs = goldenInputs();

    it('サンプルの入力とゴールデンのファイルがそろっている', () => {
        assert.ok(inputs.length > 0);
        const missing = inputs.filter((relative) => !fs.existsSync(goldenFileOf(relative)));
        assert.deepEqual(missing, []);
    });

    for (const relative of inputs) {
        it(relative, async () => {
            const expected = fs.readFileSync(goldenFileOf(relative), 'utf8').replace(/\r\n/g, '\n');
            assert.equal(serializeGolden(await goldenOutputOf(relative)), expected);
        });
    }
});
