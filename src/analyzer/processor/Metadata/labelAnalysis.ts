import type { ApexUnitParseResult } from '../../parser/Apex/unit';
import type { LwcBundleParseResult } from '../../parser/Lwc/parser';
import type { ConvertKeys } from '../../types';
import { apexDottedNameOf, walkApexParseResult } from '../Apex/walker';

// カスタム表示ラベルの使用箇所 (LWC の @salesforce/label/c.<名前>、Apex の System.Label.<名前> / Label.<名前>、
// Flow の $Label.<名前>)。使われていないラベル・ないラベルへの参照は、依存関係のグラフで見る
// (UNUSED_CUSTOM_LABEL はレポートの crossRef、UNKNOWN_CUSTOM_LABEL はグラフの指摘。docs/json-redesign-plan.md 6 章の 9)

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

const APEX_LABEL = /^(?:System\.)?Label\.(\w+)$/i;

/** Apex の System.Label.<名前> / Label.<名前> */
export const getApexLabelUsages = (units: ApexUnitParseResult[]): LabelUsage[] =>
    units.flatMap((unit) => {
        const usages: LabelUsage[] = [];
        // Apex の共通の走査 (docs/json-redesign-plan.md の段階 A3)
        walkApexParseResult(unit, {
            memberAccess: (node) => {
                const match = apexDottedNameOf(node)?.match(APEX_LABEL);
                if (!match) return;
                usages.push({
                    name: match[1]!,
                    origin: 'apex',
                    unit: unit.result.id,
                    sourceKeys: node.sourceKeys as ConvertKeys,
                });
            },
        });
        return usages;
    });
