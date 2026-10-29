/**
 * apex の JSON 生成の流れを、サンプルごとに段階別の JSON として出力する。
 *
 * 1. ソース → IR（UnitVisitor）→ CommonType（converter）
 * 2. CommonType → ConvertNode + SourceJson[]（makeConvertType）
 * 3. ConvertNode → JSON（make*UnitJson）
 * 4. JSON に残った objectKey / sourceKey だけで SourceJson[] を作り直す（regenerateSourceObjects）
 *
 * 実行: npx ttsx --noCheck docs/examples/apex-json/generate-json-pipeline.ts
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { ApexParser, ApexParserFactory, ApexParserRuleContext } from '@apexdevtools/apex-parser';

import { ApexSyntaxErrorCollector } from '../../../src/analyzer/parser/Apex/apexSyntaxError';
import { UnitVisitor } from '../../../src/analyzer/types/apex_IR/unitVisitor';
import {
    assignMultiClass,
    makeAnonymousUnitAssignRule,
    makeCompilationUnitAssignRule,
    makeErrorAssignRule,
    makeTriggerUnitAssignRule,
} from '../../../src/analyzer/types/apex/converter';
import {
    JsonType,
    SourceJson,
    makeConvertType,
    regenerateSourceObjects,
} from '../../../src/analyzer/types/apex/commons';
import {
    makeAnonymousUnitJson,
    makeCompilationUnitJson,
    makeTriggerUnitJson,
} from '../../../src/analyzer/types/apex/unit';

const sampleDirectory = new URL('../apex-ir/', import.meta.url);
const brokenSampleDirectory = new URL('./', import.meta.url);
const outputDirectory = new URL('./output/', import.meta.url);

const targets: [string, (parser: ApexParser) => ApexParserRuleContext, URL?][] = [
    ['ParserTest.cls', (parser) => parser.compilationUnit()],
    ['ParserTrigger.trigger', (parser) => parser.triggerUnit()],
    ['parser.apex', (parser) => parser.anonymousUnit()],
    // エラー経路の確認用（構文エラーを含む）
    ['broken.apex', (parser) => parser.anonymousUnit(), brokenSampleDirectory],
];

const toCommonType = (source: string, rule: (parser: ApexParser) => ApexParserRuleContext) => {
    const syntaxErrors = new ApexSyntaxErrorCollector();
    const { parser } = ApexParserFactory.createLexerAndParser(source, syntaxErrors);
    const unit = new UnitVisitor().visit(rule(parser));
    const commonType = assignMultiClass(unit, [
        makeCompilationUnitAssignRule,
        makeTriggerUnitAssignRule,
        makeAnonymousUnitAssignRule,
        makeErrorAssignRule,
    ]);
    return { syntaxErrors: syntaxErrors.diagnostics, commonType };
};

const toUnitJson = (converted: { type: string }) => {
    switch (converted.type) {
        case 'compilationUnit':
            return makeCompilationUnitJson(converted as never);
        case 'triggerUnit':
            return makeTriggerUnitJson(converted as never);
        case 'anonymousUnit':
            return makeAnonymousUnitJson(converted as never);
        default:
            throw new Error(`Unsupported unit type: ${converted.type}`);
    }
};

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

for (const [file, rule, directoryOfSample = sampleDirectory] of targets) {
    const source = await readFile(new URL(file, directoryOfSample), 'utf8');
    const directory = new URL(`./${file.replace(/\.[^.]+$/, '')}/`, outputDirectory);
    await mkdir(directory, { recursive: true });

    // 1. CommonType
    const { syntaxErrors, commonType } = toCommonType(source, rule);
    await writeJson(directory, '1.common-type.json', { syntaxErrors, commonType });

    // 2. ConvertNode + SourceJson[]
    const { result: convertNode, sourceObjects } = await makeConvertType(commonType);
    await writeJson(directory, '2.convert-node.json', convertNode);
    await writeJson(directory, '2.source-all.json', sourceObjects);

    // 3. JSON
    const json = toUnitJson(convertNode);
    await writeJson(directory, '3.json.json', json);

    // 4. JSON に残ったキーだけの SourceJson[]
    const regenerated = regenerateSourceObjects(sourceObjects, json as JsonType<string>);
    await writeJson(directory, '4.source.json', regenerated);

    const converterErrors = collect(commonType, 'type', 'error');
    const errorJsons = collect(json, 'kind', 'error') as { kindType: string }[];
    const summary = {
        file,
        syntaxErrors: syntaxErrors.length,
        converterErrors: converterErrors.length,
        errorJson: errorJsons.length,
        errorJsonKinds: [...new Set(errorJsons.map((e) => e.kindType))],
        sourceObjects: { before: sourceObjects.length, after: regenerated.length },
        sources: { before: countSources(sourceObjects), after: countSources(regenerated) },
    };
    await writeJson(directory, '0.summary.json', summary);

    console.log(JSON.stringify(summary));
    console.log(`  -> ${fileURLToPath(directory)}`);
}
