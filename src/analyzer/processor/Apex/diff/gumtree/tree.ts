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
        case 'error':
            return `error:${String(raw.kindType)}`;
        case 'forCondition':
            return 'initializeType' in raw ? 'forCondition:enhanced' : 'forCondition:basic';
        case 'limitClause':
        case 'offsetClause':
        case 'memberAccess':
            return `${node.kind}:${String(raw.type)}`;
        default:
            return node.kind;
    }
};

/** kind を持たない式・入れ物のラベルを形から決める。決まらなければ undefined */
export const getExpressionLabel = (value: Record<string, unknown>): string | undefined => {
    if (typeof value.initType === 'string') {
        // new 式 (collection を持つ) と、その初期化部分
        return 'collection' in value ? `new:${value.initType}` : value.initType;
    }
    if ('left' in value && 'right' in value) return 'formula';
    if ('operatorLocation' in value) return 'unary';
    if ('trueValue' in value) return 'ternary';
    if ('convertType' in value) return 'cast';
    if (value.operator === 'instanceof') return 'instanceof';
    if ('parentheses' in value) return 'paren';
    if ('variant' in value && 'index' in value) return 'arrayAccess';
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
    if (owner === 'switch' && role === 'block') return 'switch.when';
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
    /** catch の例外型名は分類済みの修飾名なので、配列全体を値として比較する */
    isAtomicArray: (label, role) => label === 'catchCondition' && role === 'exceptionType',
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
