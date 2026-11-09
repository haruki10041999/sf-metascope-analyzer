import type { CustomLabelsJson } from '../types';
import { analyzeFlows } from '../processor/Metadata/flowAnalysis';
import { analyzeFlexiPages, analyzeLayouts } from '../processor/Metadata/pageAnalysis';
import { analyzePermissions } from '../processor/Metadata/permissionAnalysis';
import type { DependencyGraph } from '../processor/dependency/graph';
import { toLevel } from '../processor/dependency/graph';
import { dependencyGraphOf } from '../unit/dependencies';
import type { Repository } from '../unit/repository';
import { compareKeyed, contextOf } from './commons';
import { snapshotOf } from './snapshot';
import type { FindingRow, LabelUsageRow, ReferenceUsageRow, ReportInput } from './types';

// 横断の provider (crossRef.labels / crossRef.references / metadata.findings)。
// 参照 (使用箇所・逆引き・ない参照先) は、依存関係のグラフ (analysis-plan 3 章) から作る。
// 種類ごとの解析 (権限・Flow・画面) は、その種類だけで分かる指摘を出す。方針: docs/report-components-plan.md 2.8 章

/** グラフの単位のノード → 解析結果の filePath */
const filePaths = (repository: Repository): Map<string, string> =>
    new Map(
        repository
            .entries()
            .flatMap(([type, results]) =>
                results.map((result) => [`${type}:${result.result.id}`, result.filePath] as const),
            ),
    );

/** 参照している単位の種類 → ラベルの使用箇所の origin */
const LABEL_ORIGINS: Record<string, string> = {
    apexClass: 'apex',
    apexTrigger: 'apex',
    anonymousApex: 'apex',
};

/** ラベル (customLabels の中の 1 つ) と、グラフから引いた使用箇所 */
const labelsOf = (repository: Repository, graph: DependencyGraph) => {
    const usages = new Map<string, Map<string, { origin: string; unit: string }>>();
    for (const edge of graph.edges) {
        const node = graph.nodes.get(edge.to);
        if (node?.type !== 'customLabel') continue;
        const key = node.name.toLowerCase();
        const byUnit = usages.get(key) ?? new Map<string, { origin: string; unit: string }>();
        byUnit.set(`${edge.unit.type}:${edge.unit.id}`, {
            origin: LABEL_ORIGINS[edge.unit.type] ?? edge.unit.type,
            unit: edge.unit.id,
        });
        usages.set(key, byUnit);
    }
    return (snapshotOf(repository).customLabels ?? []).flatMap((file) =>
        file.dataType === 'customLabels'
            ? ((file.result.base as CustomLabelsJson).labels ?? []).flatMap((label) =>
                  label.kind === 'customLabel'
                      ? [
                            {
                                name: label.fullName,
                                value: label.value,
                                sourceKeys: label.sourceKeys,
                                usages: [
                                    ...(usages.get(label.fullName.toLowerCase())?.values() ?? []),
                                ],
                            },
                        ]
                      : [],
              )
            : [],
    );
};

/** crossRef.labels: カスタム表示ラベルと使用箇所 (使われていないラベルは usages が空) */
export const getLabelUsages = (input: ReportInput): LabelUsageRow[] => {
    const before = input.before
        ? labelsOf(input.before, dependencyGraphOf(input.before))
        : undefined;
    return compareKeyed(
        before,
        labelsOf(input.after, dependencyGraphOf(input.after)),
        (label) => label.name.toLowerCase(),
        input.before !== undefined,
        (b, a) => b.sourceKeys.objectKey === a.sourceKeys.objectKey,
    ).map((c) => {
        const label = (c.after ?? c.before)!;
        return {
            ...(c.status ? { status: c.status } : {}),
            sourceKeys: label.sourceKeys,
            name: label.name,
            ...(label.value !== undefined ? { value: label.value } : {}),
            usages: label.usages,
        };
    });
};

/** 逆引きに出さない参照先 (標準のもの・確かめられないもの) */
const isListedTarget = (origin: string) => origin !== 'standard' && origin !== 'unknown';

/** ある時点の、参照先ごとの参照している単位 */
const usagesOf = (repository: Repository): ReferenceUsageRow[] => {
    const graph = dependencyGraphOf(repository);
    const paths = filePaths(repository);
    const problems = new Map(graph.findings.map((f) => [f.target, f.code]));
    const rows = new Map<string, ReferenceUsageRow>();
    for (const edge of graph.edges) {
        const target = graph.nodes.get(edge.to)!;
        if (!isListedTarget(target.origin)) continue;
        // 自分の単位の中の参照 (オブジェクトの入力規則 → 項目など) は除く
        if (toLevel(graph, edge.to, 'unit') === toLevel(graph, edge.from, 'unit')) continue;
        const site = graph.nodes.get(edge.from);
        const row = rows.get(edge.to) ?? {
            refType: target.type,
            target: target.name,
            usedBy: [],
            ...(problems.get(edge.to) ? { problem: problems.get(edge.to)! } : {}),
        };
        row.usedBy.push({
            from: edge.unit.id,
            via: edge.via,
            filePath: paths.get(`${edge.unit.type}:${edge.unit.id}`) ?? '',
            ...(site?.sourceKeys ? { sourceKeys: site.sourceKeys } : {}),
        });
        rows.set(edge.to, row);
    }
    return [...rows.values()].sort((a, b) =>
        `${a.refType}:${a.target}`.localeCompare(`${b.refType}:${b.target}`),
    );
};

/** crossRef.references: 参照先ごとの、参照している単位 (逆引き。依存関係のグラフから作る) */
export const getReferenceUsages = (input: ReportInput): ReferenceUsageRow[] =>
    compareKeyed(
        input.before ? usagesOf(input.before) : undefined,
        usagesOf(input.after),
        (row) => `${row.refType}:${row.target}`,
        input.before !== undefined,
        (b, a) =>
            JSON.stringify(b.usedBy.map((u) => [u.from, u.via])) ===
            JSON.stringify(a.usedBy.map((u) => [u.from, u.via])),
    ).map((c) => ({ ...(c.after ?? c.before)!, ...(c.status ? { status: c.status } : {}) }));

/**
 * 参照先がリポジトリにあるかの指摘 (種類ごとの解析も出すもの)。グラフの指摘 (source: reference) と重ならないよう、
 * 種類ごとの解析からは除く
 */
const REFERENCE_CODES = new Set([
    'UNKNOWN_OBJECT',
    'UNKNOWN_FIELD',
    'UNKNOWN_APEX_CLASS',
    'UNKNOWN_FLOW',
    'UNKNOWN_LWC',
    'UNKNOWN_LAYOUT',
    'UNKNOWN_FLEXIPAGE',
    'UNKNOWN_PERMISSION_SET',
    'UNKNOWN_MUTING_PERMISSION_SET',
    'UNKNOWN_CUSTOM_LABEL',
]);

/** ある時点の解析の指摘をすべて集める */
const findingsOf = (repository: Repository): FindingRow[] => {
    const snapshot = snapshotOf(repository);
    const context = contextOf(snapshot);
    const row = (
        source: FindingRow['source'],
        unit: string,
        f: {
            code: string;
            severity: FindingRow['severity'];
            target: string;
            message: string;
            filePath?: string;
            sourceKeys?: FindingRow['sourceKeys'];
        },
    ): FindingRow => ({
        source,
        unit,
        code: f.code,
        severity: f.severity,
        target: f.target,
        message: f.message,
        ...(f.filePath !== undefined ? { filePath: f.filePath } : {}),
        ...(f.sourceKeys !== undefined ? { sourceKeys: f.sourceKeys } : {}),
    });
    const graph = dependencyGraphOf(repository);
    const paths = filePaths(repository);
    const typeFindings = [
        ...analyzePermissions(
            {
                ...(snapshot.permissionSets ? { permissionSets: snapshot.permissionSets } : {}),
                ...(snapshot.mutingPermissionSets
                    ? { mutingPermissionSets: snapshot.mutingPermissionSets }
                    : {}),
                ...(snapshot.profiles ? { profiles: snapshot.profiles } : {}),
                ...(snapshot.permissionSetGroups
                    ? { permissionSetGroups: snapshot.permissionSetGroups }
                    : {}),
            },
            context,
        ).findings.map((f) => row('permission', f.holder, f)),
        ...analyzeFlows(snapshot.flows ?? [], context).findings.map((f) => row('flow', f.flow, f)),
        ...analyzeLayouts(snapshot.layouts ?? [], context).findings.map((f) =>
            row('layout', f.layout, f),
        ),
        ...analyzeFlexiPages(snapshot.flexiPages ?? [], context).findings.map((f) =>
            row('flexiPage', f.flexiPage, f),
        ),
    ].filter((f) => !REFERENCE_CODES.has(f.code));
    const referenceFindings = graph.findings.map((f) => {
        const unitNode = graph.nodes.get(toLevel(graph, f.from, 'unit'));
        const target = graph.nodes.get(f.target)!;
        const site = graph.nodes.get(f.from);
        return row('reference', unitNode?.name ?? f.from, {
            code: f.code,
            severity: f.severity,
            target: target.name,
            message: f.message,
            ...(unitNode?.unit
                ? { filePath: paths.get(`${unitNode.unit.type}:${unitNode.unit.id}`) ?? '' }
                : {}),
            ...(site?.sourceKeys ? { sourceKeys: site.sourceKeys } : {}),
        });
    });
    // 使われていないラベル (翻訳からの参照は使用に数えない)
    const unusedLabels = labelsOf(repository, graph)
        .filter((label) => !label.usages.some((usage) => usage.origin !== 'translations'))
        .map((label) =>
            row('label', 'CustomLabels', {
                code: 'UNUSED_CUSTOM_LABEL',
                severity: 'info',
                target: label.name,
                message: `カスタム表示ラベル ${label.name} はリポジトリの中で使われていない`,
                sourceKeys: label.sourceKeys,
            }),
        );
    return [...typeFindings, ...unusedLabels, ...referenceFindings];
};

/**
 * metadata.findings: 権限・Flow・画面の解析の指摘と、ない参照先 (依存関係のグラフ)。before を渡すと、
 * 新しく出た指摘は added、なくなった指摘は removed、続いている指摘は unchanged (source・code・単位・対象で対応付ける)
 */
export const getMetadataFindings = (input: ReportInput): FindingRow[] =>
    compareKeyed(
        input.before ? findingsOf(input.before) : undefined,
        findingsOf(input.after),
        (f) => `${f.source}:${f.code}:${f.unit}:${f.target}`,
        input.before !== undefined,
        () => true,
    ).map((c) => {
        const finding = (c.after ?? c.before)!;
        return { ...finding, ...(c.status ? { status: c.status } : {}) };
    });
