/**
 * オブジェクトの parse の動作検証。samples/before と after の force-app/main/default/objects を本番と同じ流れ
 * (MetadataParser.parseObjects) で JSON にし、output/json/ に出力する。
 *
 * - output/json/<before|after>/<API 名>.json: ObjectFileStructureType (MetadataParser.saveObjectFileForDevelopper と同じ形)
 * - output/json/<before|after>/objectTranslations/<オブジェクト>-<言語>.json: オブジェクトの翻訳 (ObjectTranslationParser)
 * - output/json/summary.md:                 オブジェクトごとの子の件数、読めなかったファイル、解析 (analysis) の結果
 *
 * 実行: npx ttsx --noCheck docs/examples/metadata/scripts/run-parse.ts
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MetadataParser, ObjectParseResult } from '../../../../src/analyzer/parser/Metadata/parser';
import {
    ObjectTranslationParseResult,
    ObjectTranslationParser,
} from '../../../../src/analyzer/parser/Metadata/objectTranslation';
import {
    TRANSLATION_MEMBERS,
    TranslationMemberKey,
} from '../../../../src/analyzer/types/metadata/objectTranslation';
import {
    analyzeObject,
    getObjectDependencies,
} from '../../../../src/analyzer/processor/Metadata/analysis';
import { OBJECT_MEMBERS, ObjectMemberKey } from '../../../../src/analyzer/types/metadata/object';

const here = path.dirname(fileURLToPath(import.meta.url));
const outputDirectory = path.resolve(here, '../output/json');
const samples = path.resolve(here, '../samples');

export const SIDES = ['before', 'after'] as const;

/** before / after のオブジェクトを読む。filePath は実行環境に依らないよう objects からの相対パスにする */
export const parseSide = async (side: (typeof SIDES)[number]): Promise<ObjectParseResult[]> => {
    const objectsDir = path.join(samples, side, 'force-app', 'main', 'default', 'objects');
    const results = await MetadataParser.parseObjects(objectsDir);
    return results.map((result) => ({
        ...result,
        filePath: path.relative(objectsDir, result.filePath).split(path.sep).join('/'),
    }));
};

/** before / after のオブジェクトの翻訳を読む。filePath は objectTranslations からの相対パスにする */
export const parseTranslationSide = async (
    side: (typeof SIDES)[number],
): Promise<ObjectTranslationParseResult[]> => {
    const translationsDir = path.join(
        samples,
        side,
        'force-app',
        'main',
        'default',
        'objectTranslations',
    );
    const results = await ObjectTranslationParser.parseObjectTranslations(translationsDir);
    return results.map((result) => ({
        ...result,
        filePath: path.relative(translationsDir, result.filePath).split(path.sep).join('/'),
    }));
};

const summarizeTranslations = (results: ObjectTranslationParseResult[]): string[] => {
    const members = ['fields', 'caseValues', ...Object.keys(TRANSLATION_MEMBERS)] as (
        'fields' | 'caseValues' | TranslationMemberKey
    )[];
    const lines = ['### 翻訳 (objectTranslations)', ''];
    lines.push(`| 翻訳 | dataType | ${members.join(' | ')} | 読めなかったファイル |`);
    lines.push(`| --- | --- | ${members.map(() => '---').join(' | ')} | --- |`);
    results.forEach((result) => {
        const counts =
            result.dataType === 'objectTranslation'
                ? members.map((key) => String(result.result.base[key]?.length ?? 0))
                : members.map(() => '-');
        const errors = result.resolvedError
            .map((e) => `${e.filePath} L${e.start.line}: ${e.code} ${e.errorMessage}`)
            .join('<br>');
        lines.push(
            `| ${result.result.id} | ${result.dataType} | ${counts.join(' | ')} | ${errors || '-'} |`,
        );
    });
    lines.push('');
    return lines;
};

const summarize = (side: string, results: ObjectParseResult[]): string[] => {
    const lines = [`## ${side}`, ''];
    const members = Object.keys(OBJECT_MEMBERS) as ObjectMemberKey[];
    lines.push(`| オブジェクト | dataType | ${members.join(' | ')} | 読めなかったファイル |`);
    lines.push(`| --- | --- | ${members.map(() => '---').join(' | ')} | --- |`);
    results.forEach((result) => {
        const counts =
            result.dataType === 'object'
                ? members.map((key) => String(result.result.base[key]?.length ?? 0))
                : members.map(() => '-');
        const errors = result.resolvedError
            .map((e) => `${e.filePath} L${e.start.line}: ${e.code} ${e.errorMessage}`)
            .join('<br>');
        lines.push(
            `| ${result.result.id} | ${result.dataType} | ${counts.join(' | ')} | ${errors || '-'} |`,
        );
    });

    const objects = results.flatMap((r) =>
        r.dataType === 'object' ? [analyzeObject(r.result.base)] : [],
    );
    lines.push('', '### 項目 (analysis)', '');
    objects.forEach((object) => {
        const fields = object.fields
            .filter((field) => field.origin === 'metadata')
            .map(
                (field) =>
                    `${field.apiName}: ${field.valueType}${field.reference ? ` → ${field.reference.objectApiName} (${field.reference.relationType})` : ''}`,
            );
        lines.push(
            `- **${object.apiName}** (${object.objectType}): ${fields.join(', ') || '（項目のファイルなし）'}`,
        );
    });
    lines.push('', '### 参照関係 (analysis)', '');
    getObjectDependencies(objects)
        .filter((dependency) => dependency.childObjectApiName !== 'User')
        .forEach((dependency) =>
            lines.push(
                `- ${dependency.parentObjectApiName}.${dependency.parentFieldApiName} → ${dependency.childObjectApiName} (${dependency.type})`,
            ),
        );
    lines.push('');
    return lines;
};

const main = async () => {
    await rm(outputDirectory, { recursive: true, force: true });
    const summary = ['# オブジェクトの parse の結果', '', '`run-parse.ts` が出力する。', ''];

    for (const side of SIDES) {
        const results = await parseSide(side);
        const directory = path.join(outputDirectory, side);
        await mkdir(directory, { recursive: true });
        for (const result of results) {
            for (const { outputPath, data } of MetadataParser.saveObjectFileForDevelopper(
                directory,
                result,
            )) {
                await writeFile(outputPath, data as string, 'utf8');
            }
        }
        summary.push(...summarize(side, results));
        console.log(`${side}: ${results.map((r) => `${r.result.id}(${r.dataType})`).join(', ')}`);

        const translations = await parseTranslationSide(side);
        const translationDirectory = path.join(directory, 'objectTranslations');
        await mkdir(translationDirectory, { recursive: true });
        for (const result of translations) {
            for (const {
                outputPath,
                data,
            } of ObjectTranslationParser.saveObjectTranslationFileForDevelopper(
                translationDirectory,
                result,
            )) {
                await writeFile(outputPath, data as string, 'utf8');
            }
        }
        summary.push(...summarizeTranslations(translations));
        console.log(
            `${side} (翻訳): ${translations.map((r) => `${r.result.id}(${r.dataType})`).join(', ')}`,
        );
    }

    await writeFile(path.join(outputDirectory, 'summary.md'), `${summary.join('\n')}\n`, 'utf8');
    console.log(`出力: ${outputDirectory}`);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await main();
}
