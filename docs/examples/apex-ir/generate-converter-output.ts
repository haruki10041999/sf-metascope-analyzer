/**
 * サンプルの converter 出力（CommonType）を converter-output/<name>.converted.json に出力する。
 *
 * 実行: npx ttsx --noCheck docs/examples/apex-ir/generate-converter-output.ts
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { baseName, parseUnit, sampleUrl, samples, toCommonType, toSyntaxErrorJson } from './pipeline';

const outputDirectory = new URL('./converter-output/', import.meta.url);
await mkdir(outputDirectory, { recursive: true });

for (const { file, rule } of samples) {
    const source = await readFile(sampleUrl(file), 'utf8');
    const { unit, syntaxErrors } = parseUnit(source, rule);

    const result = {
        file,
        syntaxErrors: toSyntaxErrorJson(syntaxErrors),
        converted: toCommonType(unit),
    };

    const outputFile = new URL(`./${baseName(file)}.converted.json`, outputDirectory);
    await writeFile(outputFile, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    console.log(`Converter output written to ${fileURLToPath(outputFile)}`);
}
