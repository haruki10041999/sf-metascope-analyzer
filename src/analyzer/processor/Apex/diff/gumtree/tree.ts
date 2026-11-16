import { TypeJson } from '../../../../types';

import { JsonNode } from '../../../commons/diff/commons';
import { GumTreeLanguage, makeGumTreeBuilder } from '../../../commons/diff/gumtree';
import { getTypeKey } from '../type';

// Apex の GumTree の木の作り方 (ラベルの付け方など)。木の作り方そのものは commons/diff/gumtree/tree.ts で共通
// 方針: docs/apex-implementation.md・4 章

/** 実ノードのラベル。同じ kind で形が大きく違うものは形も含める */
const getNodeLabel = (node: JsonNode): string => {
    const raw = node as unknown as Record<string, unknown>;
    switch (node.kind) {
        case 'limitClause':
        case 'offsetClause':
        case 'memberAccess':
            return `${node.kind}:${String(raw.type)}`;
        default:
            return node.kind;
    }
};

/**
 * kind を持たない入れ物のラベルを形から決める。決まらなければ undefined。
 * 式はすべて kind を持つ (docs/json-redesign-plan.md の段階 A2) ので、ここに残るのは文・宣言・SOQL の入れ物だけ
 */
export const getExpressionLabel = (value: Record<string, unknown>): string | undefined => {
    // switch の when のリテラル・SOQL の数・アノテーションの引数 (式ではない値)
    if ('value' in value && 'valueType' in value) return 'literal';
    if ('variants' in value) return 'localVariableDeclaration';
    if (
        'name' in value &&
        Object.keys(value).every((k) => k === 'name' || k === 'init' || k === 'sourceKeys')
    ) {
        return 'variant';
    }
    return undefined;
};

/** 配列の要素になっている入れ物のラベル (docs 4 章) */
const getElementLabel = (owner: string, role: string, value: Record<string, unknown>) => {
    if (owner === 'if' && role === 'conditionBlock') return 'if.branch';
    if (owner === 'try' && role === 'block') return `try.${String(value.condition)}`;
    if (owner === 'switch' && role === 'when') return 'switch.when';
    if (owner === 'new' && role === 'entries') return 'new.entry';
    return undefined;
};

/** 子の順序が意味を持たない並び (apex-implementation.md の B) */
const UNORDERED_LABELS = [
    /\.modifier$/,
    /^modifiers$/,
    /^switchCondition\.condition$/,
    /\.select\.field$/,
    /\.(where|having)(\.condition)+$/,
    /^sosl\.with$/,
];

export const APEX_GUMTREE_LANGUAGE: GumTreeLanguage = {
    nodeLabel: getNodeLabel,
    valueLabel: (owner, role, value) =>
        getElementLabel(owner, role, value) ?? getExpressionLabel(value),
    isOrdered: (label) => !UNORDERED_LABELS.some((pattern) => pattern.test(label)),
    /** 文の並び (block) を持つプロパティか。try / switch の block は節の並びなので除く */
    isBlockRole: (owner, role) =>
        (role === 'block' || role === 'body') && owner !== 'try' && owner !== 'switch',
    isAtomicArray: () => false,
    /** 型は葉にする (中身の TypeContentJson は kind を持たない) */
    leafValues: (node) =>
        node.kind === 'type' ? { type: getTypeKey(node as unknown as TypeJson) } : undefined,
    /** ModifiersJson ({ access: [...], ... }) は分類キーをまたいで 1 つの順序なしの並びにする */
    groupProperty: (key, value) =>
        key === 'modifier' && typeof value === 'object' && value !== null && !Array.isArray(value)
            ? {
                  label: 'modifiers',
                  role: 'modifier',
                  items: Object.values(value).flatMap((list) => (Array.isArray(list) ? list : [])),
              }
            : undefined,
};

const builder = makeGumTreeBuilder(APEX_GUMTREE_LANGUAGE);

/** 文の並びから木を作る。根は block の仮想ノード */
export const makeBlockTree = builder.makeBlockTree;
