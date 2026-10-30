/**
 * 開発者用: Apex ファイルを解析し、ApexParser.saveApexFileForDevelopper で <outDir>/<id>.json に出力する。
 * 中身を人が確認するための出力なので、worker (スレッド) は使わず 1 ファイルずつ順に処理する。
 *
 * 実行: npx ttsx --noCheck docs/examples/apex-ir/generate-parser-developer-output.ts [srcDir] [outDir]
 *   srcDir 省略時: docs/examples/apex-ir のサンプル
 *   outDir 省略時: docs/examples/apex-ir/parser-output
 */
import { mkdir, readdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ApexParser } from '../../../src/analyzer/parser/Apex/parser';
import { writeSaveDataInfo } from '../../../src/analyzer/worker';

import { sampleUrl, samples } from './pipeline';

const [srcDirArg, outDirArg] = process.argv.slice(2).filter((a) => !a.startsWith('--'));

const outDirectory = outDirArg
    ? resolve(outDirArg)
    : fileURLToPath(new URL('./parser-output/', import.meta.url));
const files = srcDirArg
    ? await ApexParser.searchApexFiles(resolve(srcDirArg))
    : samples.map(({ file }) => fileURLToPath(sampleUrl(file)));

// 以前の出力を消しておく (エディタ等で開かれていてもよいよう、ディレクトリ自体は残す)
await mkdir(outDirectory, { recursive: true });
for (const entry of await readdir(outDirectory)) {
    await rm(join(outDirectory, entry), { recursive: true, force: true });
}

for (const filePath of files) {
    const parsed = await ApexParser.parseApexClass(filePath);
    const saveDataInfo = ApexParser.saveApexFileForDevelopper(outDirectory, parsed);
    await writeSaveDataInfo(saveDataInfo);

    console.log(
        `${parsed.result.id}: dataType=${parsed.dataType}, syntaxErrors=${parsed.resolvedError.length}`,
    );
}
console.log(`Developer output written to ${outDirectory}`);
