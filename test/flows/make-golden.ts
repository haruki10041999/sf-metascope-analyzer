// 流れの図のゴールデン (test/flows/golden/) を今の出力で作り直す。
// 使い方: npx ttsx --noCheck test/flows/make-golden.ts
// 違いを確かめて受け入れるときだけ使う
import fs from 'node:fs';

import { GOLDEN_DIR, GOLDEN_NAMES, goldenFileOf, goldenOutputs, serializeGolden } from './golden';

fs.mkdirSync(GOLDEN_DIR, { recursive: true });
const outputs = await goldenOutputs();
for (const name of GOLDEN_NAMES)
    fs.writeFileSync(goldenFileOf(name), serializeGolden(outputs[name]));
console.log(`ゴールデン ${GOLDEN_NAMES.length} 件を ${GOLDEN_DIR} に書きました`);
