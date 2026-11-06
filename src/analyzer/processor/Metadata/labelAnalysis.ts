import type { ApexUnitParseResult } from '../../parser/Apex/unit';
import type { CustomLabelsParseResult } from '../../parser/Metadata/customLabels';
import type { LwcBundleParseResult } from '../../parser/Lwc/parser';
import type { ConvertKeys, CustomLabelsJson } from '../../types';
import type { MetadataFinding } from './references';

// カスタム表示ラベルの解析。方針: docs/metadata-implementation.md 10 章
// ラベルの使用箇所 (LWC の @salesforce/label/c.<名前>、Apex の System.Label.<名前> / Label.<名前>、Flow の $Label.<名前>)、
// 使われていないラベル、ないラベルへの参照

export type LabelUsageOrigin = 'lwc' | 'apex' | 'flow';

/** ラベルを使っているところ */
export type LabelUsage = {
    /** ラベルの名前 (fullName) */
    name: string;
    origin: LabelUsageOrigin;
    /** 使っている単位の id (lwc_<名前> / class_<名前> / flow_<名前> など) */
    unit: string;
    /** 使っているところ (import・式など) の sourceKeys */
    sourceKeys?: ConvertKeys;
};

export type CustomLabelInfo = {
    name: string;
    value?: string;
    language?: string;
    protected?: boolean;
    categories: string[];
    /** ラベルのファイルの id (customLabels_CustomLabels) */
    unit: string;
    sourceKeys: ConvertKeys;
    usages: LabelUsage[];
};

export type LabelAnalysisCode = 'UNKNOWN_CUSTOM_LABEL' | 'UNUSED_CUSTOM_LABEL';

export type LabelFinding = MetadataFinding<LabelAnalysisCode> & { unit: string };

export type LabelAnalysis = {
    labels: CustomLabelInfo[];
    findings: LabelFinding[];
};

export type LabelUsageInputs = {
    lwc?: LwcBundleParseResult[];
    apex?: ApexUnitParseResult[];
    /** Flow など、ほかの解析で取り出した使用箇所 (flowAnalysis の getFlowLabelUsages) */
    usages?: LabelUsage[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** JSON をたどり、kind を持つノードごとに visit を呼ぶ */
export const walkJsonNodes = (
    value: unknown,
    visit: (node: Record<string, unknown> & { kind: string }) => void,
): void => {
    if (Array.isArray(value)) {
        value.forEach((item) => walkJsonNodes(item, visit));
        return;
    }
    if (!isRecord(value)) return;
    if (typeof value.kind === 'string') visit(value as Record<string, unknown> & { kind: string });
    Object.values(value).forEach((child) => walkJsonNodes(child, visit));
};

const LWC_LABEL_PREFIX = '@salesforce/label/';

/** LWC の @salesforce/label/c.<名前> の import */
export const getLwcLabelUsages = (bundles: LwcBundleParseResult[]): LabelUsage[] =>
    bundles.flatMap((bundle) => {
        const usages: LabelUsage[] = [];
        walkJsonNodes(bundle.result.base, (node) => {
            if (node.kind !== 'lwcImport' || node.category !== 'label') return;
            const source = String(node.source);
            const name = source.slice(LWC_LABEL_PREFIX.length).replace(/^c\./, '');
            usages.push({
                name,
                origin: 'lwc',
                unit: `lwc_${bundle.result.id}`,
                sourceKeys: node.sourceKeys as ConvertKeys,
            });
        });
        return usages;
    });

/** Apex の式の . でつないだ名前 (System.Label.Greeting)。名前だけの並びでなければ undefined */
const dottedName = (value: unknown): string | undefined => {
    if (typeof value === 'string') return value;
    if (isRecord(value) && value.kind === 'memberAccess' && value.type === 'object') {
        const object = dottedName(value.object);
        return object === undefined ? undefined : `${object}.${String(value.member)}`;
    }
    return undefined;
};

const APEX_LABEL = /^(?:System\.)?Label\.(\w+)$/i;

/** Apex の System.Label.<名前> / Label.<名前> */
export const getApexLabelUsages = (units: ApexUnitParseResult[]): LabelUsage[] =>
    units.flatMap((unit) => {
        const usages: LabelUsage[] = [];
        walkJsonNodes(unit.result.base, (node) => {
            if (node.kind !== 'memberAccess') return;
            const match = dottedName(node)?.match(APEX_LABEL);
            if (!match) return;
            usages.push({
                name: match[1]!,
                origin: 'apex',
                unit: unit.result.id,
                sourceKeys: node.sourceKeys as ConvertKeys,
            });
        });
        return usages;
    });

/** カスタム表示ラベルの解析 */
export const analyzeCustomLabels = (
    labelFiles: CustomLabelsParseResult[],
    inputs: LabelUsageInputs = {},
): LabelAnalysis => {
    const usages = [
        ...getLwcLabelUsages(inputs.lwc ?? []),
        ...getApexLabelUsages(inputs.apex ?? []),
        ...(inputs.usages ?? []),
    ];
    const usagesByName = new Map<string, LabelUsage[]>();
    usages.forEach((usage) => {
        const key = usage.name.toLowerCase();
        usagesByName.set(key, [...(usagesByName.get(key) ?? []), usage]);
    });

    const labels: CustomLabelInfo[] = labelFiles.flatMap((file) => {
        if (file.dataType !== 'customLabels') return [];
        const json = file.result.base as CustomLabelsJson;
        return (json.labels ?? []).map((label) => ({
            name: label.fullName,
            ...(label.value !== undefined ? { value: label.value } : {}),
            ...(label.language !== undefined ? { language: label.language } : {}),
            ...(label.protected !== undefined ? { protected: label.protected } : {}),
            categories: label.categories ?? [],
            unit: file.result.id,
            sourceKeys: label.sourceKeys,
            usages: usagesByName.get(label.fullName.toLowerCase()) ?? [],
        }));
    });

    const known = new Set(labels.map((label) => label.name.toLowerCase()));
    const findings: LabelFinding[] = [
        ...usages
            .filter((usage) => !known.has(usage.name.toLowerCase()))
            .map((usage): LabelFinding => ({
                code: 'UNKNOWN_CUSTOM_LABEL',
                severity: 'warning',
                unit: usage.unit,
                target: usage.name,
                message: `カスタム表示ラベル ${usage.name} がリポジトリにない`,
                ...(usage.sourceKeys ? { sourceKeys: usage.sourceKeys } : {}),
            })),
        ...labels
            .filter((label) => label.usages.length === 0)
            .map((label): LabelFinding => ({
                code: 'UNUSED_CUSTOM_LABEL',
                severity: 'info',
                unit: label.unit,
                target: label.name,
                message: `カスタム表示ラベル ${label.name} はリポジトリの中で使われていない`,
                sourceKeys: label.sourceKeys,
            })),
    ];
    return { labels, findings };
};
