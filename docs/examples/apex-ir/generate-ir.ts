/**
 * サンプルの IR を ir-output/<name>.ir.json に出力する。
 *
 * 実行: npx ttsx --noCheck docs/examples/apex-ir/generate-ir.ts
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { baseName, parseUnit, sampleUrl, samples, toSyntaxErrorJson } from './pipeline';

const outputDirectory = new URL('./ir-output/', import.meta.url);
await mkdir(outputDirectory, { recursive: true });

for (const { file, rule } of samples) {
    const source = await readFile(sampleUrl(file), 'utf8');
    const { unit, syntaxErrors } = parseUnit(source, rule);

    toSyntaxErrorJson(syntaxErrors).forEach(({ line, column, message }) => {
        console.warn(`${file} ${line}:${column} ${message}`);
    });

    const outputFile = new URL(`./${baseName(file)}.ir.json`, outputDirectory);
    await writeFile(outputFile, `${JSON.stringify(unit, null, 2)}\n`, 'utf8');
    console.log(`IR written to ${fileURLToPath(outputFile)}`);
}
