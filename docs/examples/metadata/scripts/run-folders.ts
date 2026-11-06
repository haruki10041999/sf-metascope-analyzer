/**
 * フォルダ単位のメタデータ (権限・ラベル・Flow・画面) の parse・Diff・解析の動作検証。
 * samples/before と after の force-app/main/default を本番と同じ流れ (MetadataFolderParser.parseAll) で読み、output/ に出力する。
 * 方針: docs/metadata-a-plan.md
 *
 * - output/json/<before|after>/<フォルダ>/<種類>_<名前>.json: 解析結果 (MetadataFolderParser.saveForDevelopper と同じ形)
 * - output/json/folders.md:   ファイルごとの dataType・行の件数・読めなかった要素、解析 (analysis) の結果
 * - output/diff/folder-diff.json: 種類ごとの make*UnitDiffs の結果
 * - output/diff/folders.md:   unchanged 以外の差分の一覧と、kind ごとの JSON・差分への出現数
 * - output/report/<provider>.json: レポートの data provider (src/analyzer/report) の出力 (before → after)
 *
 * 実行: npx ttsx --noCheck docs/examples/metadata/scripts/run-folders.ts
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    METADATA_FOLDER_PARSERS,
    MetadataFileParseResult,
} from '../../../../src/analyzer/parser/Metadata';
import { MetadataParser } from '../../../../src/analyzer/parser/Metadata/parser';
import { LwcParser } from '../../../../src/analyzer/parser/Lwc/parser';
import { ApexParser } from '../../../../src/analyzer/parser/Apex/parser';
import {
    analyzeAutomation,
    analyzeCustomLabels,
    apexContextOf,
    analyzeFlexiPages,
    analyzeFlows,
    analyzeLayouts,
    analyzeObject,
    analyzePermissions,
    getFlowLabelUsages,
    lwcContextOf,
    METADATA_UNIT_DIFFS,
    type MetadataContext,
} from '../../../../src/analyzer/processor/Metadata';
import {
    REPORT_PROVIDERS,
    analyzeSnapshotReferences,
    type MetadataSnapshot,
} from '../../../../src/analyzer/report';
import { SIDES } from './run-parse';

const here = path.dirname(fileURLToPath(import.meta.url));
const samples = path.resolve(here, '../samples');
const jsonDirectory = path.resolve(here, '../output/json');
const diffDirectory = path.resolve(here, '../output/diff');
const reportDirectory = path.resolve(here, '../output/report');

type Side = (typeof SIDES)[number];

const sourceRoot = (side: Side) => path.join(samples, side, 'force-app', 'main', 'default');

/** 解析結果の filePath を、実行環境に依らない default からの相対パスにする */
const relative = <R extends MetadataFileParseResult>(side: Side, results: R[]): R[] =>
    results.map((result) => ({
        ...result,
        filePath: path.relative(sourceRoot(side), result.filePath).split(path.sep).join('/'),
    }));

/** 種類ごとの parser と Diff (フォルダ単位のメタデータのすべての種類) */
const TYPES = METADATA_FOLDER_PARSERS.map((parser) => ({
    parser,
    diff: METADATA_UNIT_DIFFS[parser.spec.type]!,
}));

type Parsed = Record<string, MetadataFileParseResult[]>;

const parseSide = async (side: Side): Promise<Parsed> =>
    Object.fromEntries(
        await Promise.all(
            TYPES.map(async ({ parser }) => [
                parser.spec.type,
                relative(side, await parser.parseAll(sourceRoot(side))),
            ]),
        ),
    );

/** 解析に使うリポジトリの解析結果 (オブジェクトと、Apex のサンプルのクラス名) */
const lwcSamples = () =>
    LwcParser.parseLwcBundles(
        path.resolve(here, '../../lwc/samples/bundles/force-app/main/default/lwc'),
    );

const namesOf = (parsed: Parsed, type: string) =>
    (parsed[type] ?? []).map((r) => r.result.id.slice(type.length + 1));

/** Apex は Apex のサンプル (docs/examples/apex/samples/diff/<side>) を使う */
const apexSamples = (side: Side) =>
    ApexParser.parseApexUnits(path.resolve(here, `../../apex/samples/diff/${side}`));

const objectSamples = (side: Side) =>
    MetadataParser.parseObjects(path.join(sourceRoot(side), 'objects'));

const contextOf = async (side: Side, parsed: Parsed): Promise<MetadataContext> => {
    const objects = await objectSamples(side);
    const labels = (parsed.customLabels ?? []).flatMap((r) =>
        r.dataType === 'customLabels'
            ? ((r.result.base as { labels?: { fullName: string }[] }).labels ?? []).map(
                  (l) => l.fullName,
              )
            : [],
    );
    return {
        ...lwcContextOf(await lwcSamples()),
        flows: namesOf(parsed, 'flow'),
        layouts: namesOf(parsed, 'layout'),
        flexiPages: namesOf(parsed, 'flexiPage'),
        customLabels: labels,
        objects: objects.flatMap((r) =>
            r.dataType === 'object' ? [analyzeObject(r.result.base)] : [],
        ),
        ...apexContextOf(await apexSamples(side)),
    };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** JSON の中の kind を数える */
const countKinds = (value: unknown, counts: Map<string, number>) => {
    if (Array.isArray(value)) {
        value.forEach((item) => countKinds(item, counts));
    } else if (isRecord(value)) {
        if (typeof value.kind === 'string') {
            counts.set(value.kind, (counts.get(value.kind) ?? 0) + 1);
        }
        Object.values(value).forEach((child) => countKinds(child, counts));
    }
};

/** 差分の中で unchanged 以外の kind を数える */
const countChangedKinds = (value: unknown, counts: Map<string, number>) => {
    if (Array.isArray(value)) {
        value.forEach((item) => countChangedKinds(item, counts));
    } else if (isRecord(value)) {
        if (typeof value.kind === 'string' && value.status && value.status !== 'unchanged') {
            counts.set(value.kind, (counts.get(value.kind) ?? 0) + 1);
        }
        Object.values(value).forEach((child) => countChangedKinds(child, counts));
    }
};

const summarizeFiles = (side: Side, parsed: Parsed): string[] => {
    const lines = [
        `## ${side}`,
        '',
        '| id | dataType | 行の件数 | skippedElements | 読めなかったところ |',
        '| --- | --- | --- | --- | --- |',
    ];
    Object.values(parsed)
        .flat()
        .forEach((result) => {
            const base = result.result.base as Record<string, unknown>;
            const rows =
                result.dataType === 'error'
                    ? '-'
                    : Object.entries(base)
                          .filter(([, value]) => Array.isArray(value) && value.some(isRecord))
                          .map(([key, value]) => `${key}: ${(value as unknown[]).length}`)
                          .join('<br>') || '-';
            const skipped = (base.skippedElements as string[] | undefined)?.join(', ') ?? '-';
            const errors =
                result.resolvedError
                    .map((e) => `${e.filePath} L${e.start.line}: ${e.code} ${e.errorMessage}`)
                    .join('<br>') || '-';
            lines.push(
                `| ${result.result.id} | ${result.dataType} | ${rows} | ${skipped} | ${errors} |`,
            );
        });
    lines.push('');
    return lines;
};

const summarizePermissions = (parsed: Parsed, context: MetadataContext): string[] => {
    const analysis = analyzePermissions(
        {
            permissionSets: parsed.permissionSet as never,
            mutingPermissionSets: parsed.mutingPermissionSet as never,
            profiles: parsed.profile as never,
            permissionSetGroups: parsed.permissionSetGroup as never,
        },
        context,
    );
    const lines = [
        '### 権限 (analyzePermissions)',
        '',
        '| 権限 | オブジェクト (CRED / すべて参照・変更) | 項目 (参照・編集) | Apex | ユーザー権限 |',
        '| --- | --- | --- | --- | --- |',
    ];
    const flags = (o: {
        allowCreate: boolean;
        allowRead: boolean;
        allowEdit: boolean;
        allowDelete: boolean;
        viewAllRecords: boolean;
        modifyAllRecords: boolean;
    }) =>
        `${o.allowCreate ? 'C' : '-'}${o.allowRead ? 'R' : '-'}${o.allowEdit ? 'E' : '-'}${o.allowDelete ? 'D' : '-'}${o.viewAllRecords ? ' VA' : ''}${o.modifyAllRecords ? ' MA' : ''}`;
    const row = (
        name: string,
        table: (typeof analysis.holders)[number] | (typeof analysis.groups)[number]['effective'],
    ) =>
        `| ${name} | ${table.objects.map((o) => `${o.object}: ${flags(o)}`).join('<br>') || '-'} | ${table.fields.map((f) => `${f.field}: ${f.readable ? 'R' : '-'}${f.editable ? 'E' : '-'}`).join('<br>') || '-'} | ${table.apexClasses.join(', ') || '-'} | ${table.userPermissions.join(', ') || '-'} |`;
    analysis.holders.forEach((holder) => lines.push(row(`${holder.type}:${holder.name}`, holder)));
    analysis.groups.forEach((group) =>
        lines.push(row(`permissionSetGroup:${group.name} (実際の権限)`, group.effective)),
    );
    lines.push('', '| 重要度 | code | 権限 | 対象 | 内容 |', '| --- | --- | --- | --- | --- |');
    analysis.findings.forEach((f) =>
        lines.push(`| ${f.severity} | ${f.code} | ${f.holder} | ${f.target} | ${f.message} |`),
    );
    lines.push('');
    return lines;
};

/** ラベルの使用箇所は、LWC のサンプル (docs/examples/lwc/samples/bundles) から取る */
const summarizeLabels = async (parsed: Parsed): Promise<string[]> => {
    const analysis = analyzeCustomLabels(parsed.customLabels as never, {
        lwc: await lwcSamples(),
        usages: getFlowLabelUsages(parsed.flow as never),
    });
    const lines = [
        '### カスタム表示ラベル (analyzeCustomLabels)',
        '',
        '| ラベル | 値 | 使っているところ |',
        '| --- | --- | --- |',
    ];
    analysis.labels.forEach((label) =>
        lines.push(
            `| ${label.name} | ${label.value ?? '-'} | ${label.usages.map((u) => `${u.origin}:${u.unit}`).join(', ') || '-'} |`,
        ),
    );
    lines.push('', '| 重要度 | code | 対象 | 内容 |', '| --- | --- | --- | --- |');
    analysis.findings.forEach((f) =>
        lines.push(`| ${f.severity} | ${f.code} | ${f.target} | ${f.message} |`),
    );
    lines.push('');
    return lines;
};

const findingRows = (
    findings: { severity: string; code: string; target: string; message: string }[],
    owner: (f: never) => string,
) => [
    '| 重要度 | code | 対象の単位 | 対象 | 内容 |',
    '| --- | --- | --- | --- | --- |',
    ...findings.map(
        (f) => `| ${f.severity} | ${f.code} | ${owner(f as never)} | ${f.target} | ${f.message} |`,
    ),
];

const summarizeFlows = (parsed: Parsed, context: MetadataContext): string[] => {
    const analysis = analyzeFlows(parsed.flow as never, context);
    const lines = [
        '### Flow (analyzeFlows)',
        '',
        '| Flow | 種類 | 起動 | 対象 | 状態 | 要素 |',
        '| --- | --- | --- | --- | --- | --- |',
    ];
    analysis.flows.forEach((f) =>
        lines.push(
            `| ${f.name} | ${f.processType ?? '-'} | ${[f.triggerType, f.recordTriggerType].filter(Boolean).join(' / ') || '-'} | ${f.object ?? '-'} | ${f.status ?? '-'} | ${f.elementCount} |`,
        ),
    );
    lines.push('', '#### 接続 (図のエッジ)', '');
    analysis.graphs.forEach((g) =>
        lines.push(
            `- **${g.flow}**: ${g.edges.map((e) => `${e.from} → ${e.to} (${e.edgeType})`).join(', ')}`,
        ),
    );
    lines.push('', '#### オブジェクトごとの自動化', '');
    analysis.automation.forEach((a) =>
        lines.push(
            `- ${a.object}: ${a.flows.map((f) => `${f.name} (${f.triggerType ?? ''} ${f.recordTriggerType ?? ''}, 順 ${f.triggerOrder ?? '-'})`).join(', ')}`,
        ),
    );
    lines.push('', ...findingRows(analysis.findings, (f: { flow: string }) => f.flow), '');
    return lines;
};

const summarizePages = (parsed: Parsed, context: MetadataContext): string[] => {
    const layouts = analyzeLayouts(parsed.layout as never, context);
    const pages = analyzeFlexiPages(parsed.flexiPage as never, context);
    const lines = [
        '### ページレイアウト (analyzeLayouts)',
        '',
        '| レイアウト | オブジェクト | 項目 |',
        '| --- | --- | --- |',
    ];
    layouts.layouts.forEach((l) =>
        lines.push(`| ${l.name} | ${l.objectApiName} | ${l.fields.join(', ')} |`),
    );
    lines.push(
        '',
        ...findingRows(layouts.findings, (f: { layout: string }) => f.layout || '-'),
        '',
    );
    lines.push(
        '### Lightning ページ (analyzeFlexiPages)',
        '',
        '| LWC | ページ | リージョン | 渡すプロパティ |',
        '| --- | --- | --- | --- |',
    );
    pages.placements.forEach((p) =>
        lines.push(
            `| ${p.lwc} | ${p.flexiPage} (${p.pageType ?? '-'}) | ${p.region} | ${p.properties.join(', ') || '-'} |`,
        ),
    );
    lines.push('', ...findingRows(pages.findings, (f: { flexiPage: string }) => f.flexiPage), '');
    return lines;
};

/** 優先度 A の種類 (provider の入力では種類ごとに渡す)。ほかは others にまとめる */
const A_TYPES = new Set([
    'permissionSet',
    'mutingPermissionSet',
    'profile',
    'permissionSetGroup',
    'customLabels',
    'flow',
    'layout',
    'flexiPage',
]);

const othersOf = (parsed: Parsed) =>
    Object.entries(parsed).flatMap(([type, results]) => (A_TYPES.has(type) ? [] : results));

const summarizeReferences = async (side: Side, parsed: Parsed): Promise<string[]> => {
    const analysis = analyzeSnapshotReferences({
        permissionSets: parsed.permissionSet as never,
        mutingPermissionSets: parsed.mutingPermissionSet as never,
        profiles: parsed.profile as never,
        permissionSetGroups: parsed.permissionSetGroup as never,
        customLabels: parsed.customLabels as never,
        flows: parsed.flow as never,
        layouts: parsed.layout as never,
        flexiPages: parsed.flexiPage as never,
        others: othersOf(parsed),
        objects: await objectSamples(side),
        apex: await apexSamples(side),
        lwc: await lwcSamples(),
    });
    const lines = [
        '### 種類をまたぐ参照 (analyzeMetadataReferences)',
        '',
        `参照 ${analysis.references.length} 件。参照先ごとの参照元:`,
        '',
        '| 参照先 | 参照元 |',
        '| --- | --- |',
    ];
    Object.entries(analysis.usedBy)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([target, from]) => lines.push(`| ${target} | ${from.join(', ')} |`));
    lines.push('', '| code | 参照元 | 対象 |', '| --- | --- | --- |');
    analysis.findings.forEach((f) => lines.push(`| ${f.code} | ${f.from} | ${f.target} |`));
    lines.push('');
    return lines;
};

const summarizeAutomation = async (side: Side, parsed: Parsed): Promise<string[]> => {
    const automation = analyzeAutomation({
        flows: parsed.flow as never,
        apex: await apexSamples(side),
        objects: await objectSamples(side),
    });
    const lines = [
        '### オブジェクトごとの自動化 (analyzeAutomation)',
        '',
        '| オブジェクト | レコードトリガーフロー | Apex トリガー | 入力規則 |',
        '| --- | --- | --- | --- |',
    ];
    automation.forEach((a) =>
        lines.push(
            `| ${a.object} | ${a.flows.map((f) => `${f.name} (${f.triggerType ?? ''} ${f.recordTriggerType ?? ''}, 順 ${f.triggerOrder ?? '-'})`).join('<br>') || '-'} | ${a.triggers.map((t) => `${t.name} (${t.events.join(', ')}${t.status ? `, ${t.status}` : ''})`).join('<br>') || '-'} | ${a.validationRules.map((r) => `${r.name}${r.active ? '' : ' (無効)'}`).join('<br>') || '-'} |`,
        ),
    );
    lines.push('');
    return lines;
};

const main = async () => {
    const summary = [
        '# フォルダ単位のメタデータの parse の結果',
        '',
        '`run-folders.ts` が出力する。',
        '',
    ];
    const parsedBySide: Partial<Record<Side, Parsed>> = {};
    for (const side of SIDES) {
        const parsed = await parseSide(side);
        parsedBySide[side] = parsed;
        for (const { parser } of TYPES) {
            const directory = path.join(jsonDirectory, side, parser.spec.folder);
            await rm(directory, { recursive: true, force: true });
            await mkdir(directory, { recursive: true });
            for (const result of parsed[parser.spec.type]!) {
                for (const { outputPath, data } of parser.saveForDevelopper(
                    directory,
                    result as never,
                )) {
                    await writeFile(outputPath, data as string, 'utf8');
                }
            }
        }
        summary.push(...summarizeFiles(side, parsed));
        const context = await contextOf(side, parsed);
        summary.push(...summarizePermissions(parsed, context));
        summary.push(...(await summarizeLabels(parsed)));
        summary.push(...summarizeFlows(parsed, context));
        summary.push(...summarizePages(parsed, context));
        summary.push(...(await summarizeAutomation(side, parsed)));
        summary.push(...(await summarizeReferences(side, parsed)));
        console.log(
            `${side}: ${Object.values(parsed)
                .flat()
                .map((r) => `${r.result.id}(${r.dataType})`)
                .join(', ')}`,
        );
    }
    await writeFile(path.join(jsonDirectory, 'folders.md'), `${summary.join('\n')}\n`, 'utf8');

    // Diff
    const before = parsedBySide.before!;
    const after = parsedBySide.after!;
    const diffs = Object.fromEntries(
        TYPES.map(({ parser, diff }) => [
            parser.spec.type,
            (diff as (b: unknown[], a: unknown[]) => unknown[])(
                before[parser.spec.type]!,
                after[parser.spec.type]!,
            ),
        ]),
    );
    await mkdir(diffDirectory, { recursive: true });
    await writeFile(
        path.join(diffDirectory, 'folder-diff.json'),
        `${JSON.stringify(diffs, null, 2)}\n`,
        'utf8',
    );

    const jsonKinds = new Map<string, number>();
    countKinds([Object.values(before), Object.values(after)], jsonKinds);
    const diffKinds = new Map<string, number>();
    countChangedKinds(diffs, diffKinds);
    const lines = [
        '# フォルダ単位のメタデータの Diff',
        '',
        '`run-folders.ts` が出力する。',
        '',
        '## 単位',
        '',
        '| id | status |',
        '| --- | --- |',
    ];
    Object.values(diffs)
        .flat()
        .forEach((d) => {
            const unit = d as { id: string; status: string };
            lines.push(`| ${unit.id} | ${unit.status} |`);
        });
    lines.push(
        '',
        '## kind ごとの出現数',
        '',
        '| kind | JSON | 差分 (unchanged 以外) |',
        '| --- | --- | --- |',
    );
    [...jsonKinds.keys()]
        .sort()
        .forEach((kind) =>
            lines.push(`| ${kind} | ${jsonKinds.get(kind)} | ${diffKinds.get(kind) ?? 0} |`),
        );
    await writeFile(path.join(diffDirectory, 'folders.md'), `${lines.join('\n')}\n`, 'utf8');

    // レポートの data provider (before → after)
    const snapshot = async (side: Side, parsed: Parsed): Promise<MetadataSnapshot> => ({
        permissionSets: parsed.permissionSet as never,
        mutingPermissionSets: parsed.mutingPermissionSet as never,
        profiles: parsed.profile as never,
        permissionSetGroups: parsed.permissionSetGroup as never,
        customLabels: parsed.customLabels as never,
        flows: parsed.flow as never,
        layouts: parsed.layout as never,
        flexiPages: parsed.flexiPage as never,
        others: othersOf(parsed),
        objects: await objectSamples(side),
        apex: await apexSamples(side),
        lwc: await lwcSamples(),
    });
    const input = {
        before: await snapshot('before', before),
        after: await snapshot('after', after),
    };
    await rm(reportDirectory, { recursive: true, force: true });
    await mkdir(reportDirectory, { recursive: true });
    for (const [name, provider] of Object.entries(REPORT_PROVIDERS)) {
        const data = (provider as (input: unknown) => unknown)(input);
        await writeFile(
            path.join(reportDirectory, `${name}.json`),
            `${JSON.stringify(data, null, 2)}\n`,
            'utf8',
        );
    }
    console.log(`出力: ${jsonDirectory}, ${diffDirectory}, ${reportDirectory}`);
};

await main();
