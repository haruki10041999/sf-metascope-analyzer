/**
 * サンプルの JSON 出力を json-output/<name>.json.json に、
 * JSON に残ったキーだけの SourceJson[] を source-output/<name>.source.json に出力する。
 *
 * 実行: npx ttsx --noCheck docs/examples/apex-ir/generate-json-output.ts
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import {
    baseName,
    parseUnit,
    sampleUrl,
    samples,
    toCommonType,
    toJsonOutput,
    toSyntaxErrorJson,
} from './pipeline';

const jsonDirectory = new URL('./json-output/', import.meta.url);
const sourceDirectory = new URL('./source-output/', import.meta.url);
await mkdir(jsonDirectory, { recursive: true });
await mkdir(sourceDirectory, { recursive: true });

for (const { file, rule } of samples) {
    const source = await readFile(sampleUrl(file), 'utf8');
    const { unit, syntaxErrors } = parseUnit(source, rule);
    const { json, sourceObjects } = await toJsonOutput(toCommonType(unit));

    const jsonFile = new URL(`./${baseName(file)}.json.json`, jsonDirectory);
    await writeFile(
        jsonFile,
        `${JSON.stringify({ file, syntaxErrors: toSyntaxErrorJson(syntaxErrors), json }, null, 2)}\n`,
        'utf8',
    );

    const sourceFile = new URL(`./${baseName(file)}.source.json`, sourceDirectory);
    await writeFile(sourceFile, `${JSON.stringify({ file, sourceObjects }, null, 2)}\n`, 'utf8');

    console.log(`JSON output written to ${fileURLToPath(jsonFile)}`);
    console.log(`Source output written to ${fileURLToPath(sourceFile)}`);
}
