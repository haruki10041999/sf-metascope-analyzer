import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';

import {
    GOLDEN_NAMES,
    type GoldenName,
    goldenFileOf,
    goldenOutputs,
    serializeGolden,
} from './golden';

// 流れの図の、今の出力がゴールデンと同じか (箱と線の作り方を変えたときに気づくため)。
// 違いが正しい変更なら npx ttsx --noCheck test/flows/make-golden.ts で作り直す

describe('流れの図のゴールデン (サンプル)', () => {
    let outputs: Record<GoldenName, unknown>;
    before(async () => {
        outputs = await goldenOutputs();
    });

    for (const name of GOLDEN_NAMES) {
        it(name, () => {
            const expected = fs.readFileSync(goldenFileOf(name), 'utf8').replace(/\r\n/g, '\n');
            assert.equal(serializeGolden(outputs[name]), expected);
        });
    }
});
