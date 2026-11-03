import { TypeJson, hash } from '../../../../types';

import { JsonNode, getObjectKey, getValueKey } from '../commons';
import { getTypeKey } from '../type';

// 方針: docs/apex-gumtree-diff.md 3 章・4 章

/** GumTree が比べる木のノード。JsonType / StructureJsonType は実ノード、それ以外は仮想ノード */
export type GumTreeNode = {
    /** 木の中での前順の番号 */
    id: number;
    /** 同じラベル同士だけを対応付ける */
    label: string;
    /** ノード自身のプリミティブのプロパティ。違えば更新 (changed) */
    values: Record<string, DiffFieldValue>;
    /** 同形の判定。実ノードは objectKey、仮想ノードは子の hash から作る */
    hash: string;
    /** 値を見ない形だけの hash (recovery で使う) */
    structureHash: string;
    /** 親のどのプロパティにあるか */
    role: string;
    /** 子の順序が意味を持つか */
    ordered: boolean;
    children: GumTreeNode[];
    parent: GumTreeNode | undefined;
    /** 元の値 */
    raw: unknown;
    /** 元の JsonType / StructureJsonType。仮想ノードは undefined */
    source: JsonNode | undefined;
    height: number;
    size: number;
};

export type DiffPrimitive = string | number | boolean | null;
export type DiffFieldValue = DiffPrimitive | DiffPrimitive[];
export type DiffNodeValue =
    DiffPrimitive | JsonNode | { [key: string]: DiffNodeValue | undefined } | DiffNodeValue[];

const isPrimitive = (value: unknown): value is DiffPrimitive =>
    value === null || ['string', 'number', 'boolean'].includes(typeof value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isJsonNode = (value: unknown): value is JsonNode =>
    isRecord(value) && typeof value.kind === 'string' && isRecord(value.sourceKeys);

/** catch の例外型名は分類済みの修飾名なので、配列全体を値として比較する */
const isAtomicArray = (label: string, role: string) =>
    label === 'catchCondition' && role === 'exceptionType';

const isValueLike = (value: unknown): value is DiffFieldValue =>
    isPrimitive(value) || (Array.isArray(value) && value.every(isPrimitive));

// ---------------------------------------------------------------------------
// ラベル
// ---------------------------------------------------------------------------

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
    if (typeof value.kind === 'string') {
        // new 式の初期化部分 (kind はあるが sourceKeys はない)
        return 'collection' in value ? `new:${value.kind}` : value.kind;
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
    if ('name' in value && Object.keys(value).every((k) => k === 'name' || k === 'init')) {
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

/** 子の順序が意味を持たない並び (apex-json-diff-policy.md の B) */
const UNORDERED_LABELS = [
    /\.modifier$/,
    /^modifiers$/,
    /^switchCondition\.condition$/,
    /\.select\.field$/,
    /\.(where|having)(\.condition)+$/,
    /^sosl\.with$/,
];

const isOrdered = (label: string) => !UNORDERED_LABELS.some((pattern) => pattern.test(label));

/** 文の並び (block) を持つプロパティか。try / switch の block は節の並びなので除く */
const isBlockRole = (owner: string, role: string) =>
    (role === 'block' || role === 'body') && owner !== 'try' && owner !== 'switch';

// ---------------------------------------------------------------------------
// 木の構築
// ---------------------------------------------------------------------------

type NodeInit = {
    label: string;
    values?: Record<string, DiffFieldValue>;
    children?: GumTreeNode[];
    role: string;
    raw: unknown;
    source?: JsonNode | undefined;
};

const makeNode = ({ label, values = {}, children = [], role, raw, source }: NodeInit) => {
    const node: GumTreeNode = {
        id: -1,
        label,
        values,
        hash: source ? getObjectKey(source) : hash([label, values, children.map((c) => c.hash)]),
        structureHash: hash([label, children.map((c) => c.structureHash)]),
        role,
        ordered: isOrdered(label),
        children,
        parent: undefined,
        raw,
        source,
        height: 1 + Math.max(0, ...children.map((c) => c.height)),
        size: 1 + children.reduce((sum, c) => sum + c.size, 0),
    };
    children.forEach((c) => (c.parent = node));
    return node;
};

/** オブジェクトのプロパティを values と子に分ける */
const splitProperties = (label: string, value: Record<string, unknown>) => {
    const values: Record<string, DiffFieldValue> = {};
    const children: GumTreeNode[] = [];

    Object.entries(value).forEach(([key, v]) => {
        if (key === 'kind' || key === 'sourceKeys' || v === undefined) {
            return;
        }
        if (isBlockRole(label, key)) {
            children.push(makeBlockNode(v, key));
        } else if (key === 'modifier' && isRecord(v)) {
            children.push(makeModifiersNode(v));
        } else if (Array.isArray(v) && isAtomicArray(label, key) && isValueLike(v)) {
            values[key] = v;
        } else if (Array.isArray(v)) {
            children.push(makeTreeNode(v, label, key));
        } else if (isValueLike(v)) {
            values[key] = v;
        } else {
            children.push(makeTreeNode(v, label, key));
        }
    });

    return { values, children };
};

/** ModifiersJson ({ access: [...], ... }) は分類キーをまたいで 1 つの順序なしの並びにする */
const makeModifiersNode = (modifiers: Record<string, unknown>): GumTreeNode => {
    const children = Object.values(modifiers)
        .flatMap((list) => (Array.isArray(list) ? list : []))
        .map((m) => makeTreeNode(m, 'modifiers', 'modifier'));
    return makeNode({ label: 'modifiers', children, role: 'modifier', raw: modifiers });
};

/** 文の並び。{ } のない 1 文だけの本体も要素 1 つの block にする */
const makeBlockNode = (value: unknown, role: string): GumTreeNode => {
    const list = Array.isArray(value) ? value : [value];
    const children = list.map((item) =>
        Array.isArray(item)
            ? makeBlockNode(item, 'statement')
            : makeTreeNode(item, 'block', 'statement'),
    );
    return makeNode({ label: 'block', children, role, raw: value });
};

const makeTreeNode = (value: unknown, owner: string, role: string): GumTreeNode => {
    if (isPrimitive(value)) {
        // 式の位置にある識別子など
        return makeNode({ label: 'name', values: { value }, role, raw: value });
    }

    if (Array.isArray(value)) {
        const label = `${owner}.${role}`;
        const children = value.map((item) => makeTreeNode(item, owner, role));
        return makeNode({ label, children, role, raw: value });
    }

    if (isJsonNode(value)) {
        const label = getNodeLabel(value);
        if (value.kind === 'type') {
            // 型は葉にする (中身の TypeContentJson は kind を持たない)
            return makeNode({
                label,
                values: { type: getTypeKey(value as TypeJson) },
                role,
                raw: value,
                source: value,
            });
        }
        return makeNode({
            label,
            ...splitProperties(label, value),
            role,
            raw: value,
            source: value,
        });
    }

    if (isRecord(value)) {
        const label =
            getElementLabel(owner, role, value) ?? getExpressionLabel(value) ?? `${owner}.${role}`;
        return makeNode({ label, ...splitProperties(label, value), role, raw: value });
    }

    return makeNode({
        label: 'unknown',
        values: { value: getValueKey(value) },
        role,
        raw: value,
    });
};

const assignIds = (root: GumTreeNode) => {
    preOrder(root).forEach((node, index) => (node.id = index));
    return root;
};

/** 文の並びから木を作る。根は block の仮想ノード */
export const makeBlockTree = (statements: unknown[]): GumTreeNode => {
    return assignIds(makeBlockNode(statements, 'root'));
};

// ---------------------------------------------------------------------------
// 走査
// ---------------------------------------------------------------------------

export const preOrder = (root: GumTreeNode): GumTreeNode[] => {
    const nodes: GumTreeNode[] = [];
    const visit = (node: GumTreeNode) => {
        nodes.push(node);
        node.children.forEach(visit);
    };
    visit(root);
    return nodes;
};

export const postOrder = (root: GumTreeNode): GumTreeNode[] => {
    const nodes: GumTreeNode[] = [];
    const visit = (node: GumTreeNode) => {
        node.children.forEach(visit);
        nodes.push(node);
    };
    visit(root);
    return nodes;
};

export const descendants = (node: GumTreeNode): GumTreeNode[] => preOrder(node).slice(1);
