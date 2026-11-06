import { analyzeCustomLabels } from '../processor/Metadata/labelAnalysis';
import { analyzeFlows, getFlowLabelUsages } from '../processor/Metadata/flowAnalysis';
import { analyzeFlexiPages, analyzeLayouts } from '../processor/Metadata/pageAnalysis';
import { analyzePermissions } from '../processor/Metadata/permissionAnalysis';
import { analyzeMetadataReferences } from '../processor/Metadata/referenceAnalysis';
import { compareKeyed, contextOf } from './commons';
import type {
    FindingRow,
    LabelUsageRow,
    MetadataSnapshot,
    ReferenceUsageRow,
    ReportInput,
} from './types';

// 横断の provider (crossRef.labels / metadata.findings)。方針: docs/report-components-plan.md 2.8 章

const labelsOf = (snapshot: MetadataSnapshot) =>
    analyzeCustomLabels(snapshot.customLabels ?? [], {
        ...(snapshot.lwc ? { lwc: snapshot.lwc } : {}),
        ...(snapshot.apex ? { apex: snapshot.apex } : {}),
        usages: getFlowLabelUsages(snapshot.flows ?? []),
    });

/** crossRef.labels: カスタム表示ラベルと使用箇所 (使われていないラベルは usages が空) */
export const getLabelUsages = (input: ReportInput): LabelUsageRow[] => {
    const before = input.before ? labelsOf(input.before).labels : undefined;
    return compareKeyed(
        before,
        labelsOf(input.after).labels,
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
            usages: label.usages.map(({ origin, unit }) => ({ origin, unit })),
        };
    });
};

/** 種類をまたぐ参照の解析 (フォルダ単位のメタデータをまとめて渡す) */
export const analyzeSnapshotReferences = (snapshot: MetadataSnapshot) =>
    analyzeMetadataReferences({
        metadata: [
            ...(snapshot.permissionSets ?? []),
            ...(snapshot.mutingPermissionSets ?? []),
            ...(snapshot.profiles ?? []),
            ...(snapshot.permissionSetGroups ?? []),
            ...(snapshot.customLabels ?? []),
            ...(snapshot.flows ?? []),
            ...(snapshot.layouts ?? []),
            ...(snapshot.flexiPages ?? []),
            ...(snapshot.others ?? []),
        ],
        ...(snapshot.objects ? { objects: snapshot.objects } : {}),
        ...(snapshot.apex ? { apex: snapshot.apex } : {}),
        ...(snapshot.lwc ? { lwc: snapshot.lwc } : {}),
    });

/** crossRef.references: 参照先ごとの、参照している単位 (逆引き) */
export const getReferenceUsages = (input: ReportInput): ReferenceUsageRow[] => {
    const usagesOf = (snapshot: MetadataSnapshot) => {
        const analysis = analyzeSnapshotReferences(snapshot);
        const problems = new Map(
            analysis.findings.map((f) => [`${f.refType}:${f.target}`, f.code]),
        );
        const rows = new Map<string, ReferenceUsageRow>();
        for (const r of analysis.references) {
            const key = `${r.refType}:${r.target}`;
            const row = rows.get(key) ?? {
                refType: r.refType,
                target: r.target,
                usedBy: [],
                ...(problems.get(key) ? { problem: problems.get(key)! } : {}),
            };
            row.usedBy.push({
                from: r.from,
                via: r.via,
                filePath: r.filePath,
                ...(r.sourceKeys ? { sourceKeys: r.sourceKeys } : {}),
            });
            rows.set(key, row);
        }
        return [...rows.values()].sort((a, b) =>
            `${a.refType}:${a.target}`.localeCompare(`${b.refType}:${b.target}`),
        );
    };
    return compareKeyed(
        input.before ? usagesOf(input.before) : undefined,
        usagesOf(input.after),
        (row) => `${row.refType}:${row.target}`,
        input.before !== undefined,
        (b, a) =>
            JSON.stringify(b.usedBy.map((u) => [u.from, u.via])) ===
            JSON.stringify(a.usedBy.map((u) => [u.from, u.via])),
    ).map((c) => ({ ...(c.after ?? c.before)!, ...(c.status ? { status: c.status } : {}) }));
};

/** ある時点の解析の指摘をすべて集める */
const findingsOf = (snapshot: MetadataSnapshot): FindingRow[] => {
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
    return [
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
        ...labelsOf(snapshot).findings.map((f) => row('label', f.unit, f)),
        ...analyzeFlows(snapshot.flows ?? [], context).findings.map((f) => row('flow', f.flow, f)),
        ...analyzeLayouts(snapshot.layouts ?? [], context).findings.map((f) =>
            row('layout', f.layout, f),
        ),
        ...analyzeFlexiPages(snapshot.flexiPages ?? [], context).findings.map((f) =>
            row('flexiPage', f.flexiPage, f),
        ),
        ...analyzeSnapshotReferences(snapshot).findings.map((f) => row('reference', f.from, f)),
    ];
};

/**
 * metadata.findings: 権限・ラベル・Flow・画面の解析の指摘。before を渡すと、新しく出た指摘は added、
 * なくなった指摘は removed、続いている指摘は unchanged (source・code・単位・対象で対応付ける)
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
