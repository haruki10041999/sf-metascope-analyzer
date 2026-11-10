import type { LwcJsStatementJson, LwcTypeJson } from '../../../../types';

import { JsonNode, Sources } from '../../../commons/diff/commons';
import {
    DiffNodeValue,
    GumTreeDiff,
    GumTreeLanguage,
    makeGumTreeBuilder,
    makeGumTreeDiff,
    makeSourceDistance,
    matchTrees,
} from '../../../commons/diff/gumtree';

// LWC の JS / TS の本体 (文の並び) の GumTree の木の作り方。木の作り方そのものは commons/diff/gumtree/tree.ts で共通
// (Apex は processor/Apex/diff/gumtree/tree.ts)。方針: docs/lwc-json-types.md 6 章 (段階 4)
// - 文・式はすべて kind を持つので、ラベルはほぼ kind のまま (Apex の getExpressionLabel のような形からの推定は要らない)
// - jsMemberAccess は Apex の memberAccess と同じく type (object / method) をラベルに含める
// - try の節は condition ごと、if の分岐・switch の case は分岐のラベルにする (Apex の if.branch・try.catch と同じ考え方)
// - 型 (lwcType) は葉にし、書かれた型の文字列で比べる (Apex の型と同じ)

/** 実ノードのラベル。同じ kind で形が大きく違うものは形も含める */
const getNodeLabel = (node: JsonNode): string => {
    const raw = node as unknown as Record<string, unknown>;
    switch (node.kind) {
        case 'jsMemberAccess':
            return `${node.kind}:${String(raw.type)}`;
        case 'jsFunction':
            return raw.arrow === true ? 'jsFunction:arrow' : 'jsFunction';
        default:
            return node.kind;
    }
};

/** kind を持たない入れ物 (分岐・節) のラベル */
const getElementLabel = (owner: string, role: string, value: Record<string, unknown>) => {
    if (owner === 'jsIf' && role === 'conditionBlock') return 'jsIf.branch';
    if (owner === 'jsTry' && role === 'block') return `jsTry.${String(value.condition)}`;
    if (owner === 'jsSwitch' && role === 'cases')
        return 'test' in value ? 'jsSwitch.case' : 'jsSwitch.default';
    return undefined;
};

/** 子の順序が意味を持たない並び (デコレーター・import の参照・型の集合) */
const UNORDERED_LABELS = [/\.decorator$/, /\.references$/, /\.implement$/];

export const LWC_GUMTREE_LANGUAGE: GumTreeLanguage = {
    nodeLabel: getNodeLabel,
    valueLabel: getElementLabel,
    isOrdered: (label) => !UNORDERED_LABELS.some((pattern) => pattern.test(label)),
    /**
     * 文の並び (block) を持つプロパティか。try の block は節の並びなので除く。
     * jsLabeled の body (1 文) も要素 1 つの並びにする (Apex の { } のない本体と同じ)
     */
    isBlockRole: (owner, role) =>
        (role === 'block' && owner !== 'jsTry') || (owner === 'jsLabeled' && role === 'body'),
    /** 型は葉にする (中身の LwcTypeContentJson は kind を持たない) */
    leafValues: (node) =>
        node.kind === 'lwcType' ? { type: (node as unknown as LwcTypeJson).text } : undefined,
};

const builder = makeGumTreeBuilder(LWC_GUMTREE_LANGUAGE);

/** 文の並びから木を作る。根は block の仮想ノード */
export const makeLwcBlockTree = builder.makeBlockTree;

/** 本体の文の並びの差分 (GumTree。Apex の makeGumTreeBlockDiff と同じ形) */
export type LwcBlockDiff = GumTreeDiff<DiffNodeValue>[];

export const makeLwcBlockDiff = (
    before: LwcJsStatementJson[],
    after: LwcJsStatementJson[],
    sources?: Sources,
): LwcBlockDiff => {
    const rootBefore = makeLwcBlockTree(before);
    const rootAfter = makeLwcBlockTree(after);
    const mappings = matchTrees(
        rootBefore,
        rootAfter,
        sources ? { distance: makeSourceDistance(sources) } : {},
    );
    return makeGumTreeDiff<DiffNodeValue>(rootBefore, rootAfter, mappings);
};
