/**
 * apex の JSON 生成の流れを、サンプルごとに段階別の JSON として出力する。
 *
 * 1. ソース → IR（UnitVisitor）→ CommonType（converter）。構文エラーは CommonErrorListener で収集
 * 2. CommonType → ConvertNode + SourceJson[]（makeConvertType）
 * 3. ConvertNode → JSON（make*UnitJson）
 * 4. JSON に残った objectKey / sourceKey だけで SourceJson[] を作り直す（regenerateSourceObjects）
 *
 * 変換処理は ../apex-ir/pipeline.ts を共有する。
 *
 * 実行: npx ttsx --noCheck docs/examples/apex-json/generate-json-pipeline.ts
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { SourceJson } from '../../../src/analyzer/types/apex';
import {
    UnitRule,
    baseName,
    parseUnit,
    sampleUrl,
    samples,
    toCommonType,
    toJsonOutput,
    toSyntaxErrorJson,
    unitRules,
} from '../apex-ir/pipeline';

const outputDirectory = new URL('./output/', import.meta.url);

const targets: { file: string; rule: UnitRule; url: URL }[] = [
    ...samples.map(({ file, rule }) => ({ file, rule, url: sampleUrl(file) })),
    // エラー経路の確認用（構文エラーを含む）
    { file: 'broken.apex', rule: unitRules.anonymous, url: new URL('./broken.apex', import.meta.url) },
];

// 集計用: ツリー中の { type: 'error' }（converter のエラー）と { kind: 'error' }（ErrorJson）を数える
const collect = (target: unknown, key: 'type' | 'kind', value: string, found: unknown[] = []) => {
    if (Array.isArray(target)) {
        target.forEach((item) => collect(item, key, value, found));
    } else if (target !== null && typeof target === 'object') {
        if ((target as Record<string, unknown>)[key] === value) {
            found.push(target);
        }
        Object.values(target).forEach((item) => collect(item, key, value, found));
    }
    return found;
};

const countSources = (sourceObjects: SourceJson[]) =>
    sourceObjects.reduce((sum, object) => sum + object.source.length, 0);

const writeJson = async (directory: URL, name: string, value: unknown) => {
    await writeFile(new URL(name, directory), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

for (const { file, rule, url } of targets) {
    const source = await readFile(url, 'utf8');
    const directory = new URL(`./${baseName(file)}/`, outputDirectory);
    await mkdir(directory, { recursive: true });

    // 1. CommonType
    const parsed = parseUnit(source, rule);
    const syntaxErrors = toSyntaxErrorJson(parsed.syntaxErrors);
    const commonType = toCommonType(parsed.unit);
    await writeJson(directory, '1.common-type.json', { syntaxErrors, commonType });

    // 2〜4. ConvertNode + SourceJson[] → JSON → JSON に残ったキーだけの SourceJson[]
    const { convertNode, allSourceObjects, json, sourceObjects } = await toJsonOutput(commonType);
    await writeJson(directory, '2.convert-node.json', convertNode);
    await writeJson(directory, '2.source-all.json', allSourceObjects);
    await writeJson(directory, '3.json.json', json);
    await writeJson(directory, '4.source.json', sourceObjects);

    const converterErrors = collect(commonType, 'type', 'error');
    const errorJsons = collect(json, 'kind', 'error') as { kindType: string }[];
    const summary = {
        file,
        syntaxErrors: syntaxErrors.length,
        converterErrors: converterErrors.length,
        errorJson: errorJsons.length,
        errorJsonKinds: [...new Set(errorJsons.map((e) => e.kindType))],
        sourceObjects: { before: allSourceObjects.length, after: sourceObjects.length },
        sources: { before: countSources(allSourceObjects), after: countSources(sourceObjects) },
    };
    await writeJson(directory, '0.summary.json', summary);

    console.log(JSON.stringify(summary));
    console.log(`  -> ${fileURLToPath(directory)}`);
}
