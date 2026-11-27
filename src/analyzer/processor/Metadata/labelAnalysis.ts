import type { ApexUnitParseResult } from '../../parser/Apex/unit';
import type { LwcBundleParseResult } from '../../parser/Lwc/parser';
import type { ConvertKeys, LwcNodeJson } from '../../types';
import { apexDottedNameOf, walkApexParseResult } from '../Apex/walker';
import { walkJson } from '../commons/node';

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

const LWC_LABEL_PREFIX = '@salesforce/label/';

/** LWC の @salesforce/label/c.<名前> の import */
export const getLwcLabelUsages = (bundles: LwcBundleParseResult[]): LabelUsage[] =>
    bundles.flatMap((bundle) => {
        if (bundle.dataType !== 'lwcBundle') return [];
        const usages: LabelUsage[] = [];
        // 共通の走査 (processor/commons/node.ts) で、import のノードだけを見る
        walkJson<LwcNodeJson>(bundle.result.base, {
            enter: {
                lwcImport: (node) => {
                    if (node.category !== 'label') return;
                    const name = node.source.slice(LWC_LABEL_PREFIX.length).replace(/^c\./, '');
                    usages.push({
                        name,
                        origin: 'lwc',
                        unit: `lwc_${bundle.result.id}`,
                        sourceKeys: node.sourceKeys,
                    });
                },
            },
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
