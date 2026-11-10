// ゴールデン (test/ir/golden/) を今の出力で作り直す。docs/ir-integration.md 3.0
// 使い方: npx ttsx --noCheck test/ir/make-golden.ts
// 違いを確かめて受け入れるときだけ使う (受け入れた違いは docs/ir-integration.md 4 章に書く)
import fs from 'node:fs';
import path from 'node:path';

import { GOLDEN_DIR, goldenFileOf, goldenInputs, goldenOutputOf, serializeGolden } from './golden';

fs.rmSync(GOLDEN_DIR, { recursive: true, force: true });
const inputs = goldenInputs();
for (const relative of inputs) {
    const file = goldenFileOf(relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, serializeGolden(await goldenOutputOf(relative)));
}
console.log(`ゴールデン ${inputs.length} 件を ${GOLDEN_DIR} に書きました`);
