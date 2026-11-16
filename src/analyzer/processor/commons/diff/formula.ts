import { type FormulaValue, isFxJson } from '../../../types/metadata/formula';

import { JsonNode, Sources, ValueDiff, isSameValue, makeValueDiff } from './commons';
import {
    DiffFieldValue,
    GumTreeDiff,
    GumTreeLanguage,
    makeGumTreeBuilder,
    makeGumTreeDiff,
    makeSourceDistance,
    matchTrees,
} from './gumtree';

// 数式 (fx*。docs/json-redesign-plan.md の段階 M4) の差分。Apex・LWC の式と同じく GumTree で対応付ける。
// 両方が数式の木なら木の差分、どちらかが読めなかった数式 (文字列) なら値として比べる

/** 数式の差分。同じなら unchanged、両方が木で違えば GumTree の差分 (tree)、それ以外は値の差分 */
export type FormulaDiff = ValueDiff<FormulaValue> | { status: 'changed'; tree: GumTreeDiff[] };

export const FORMULA_GUMTREE_LANGUAGE: GumTreeLanguage = {
    /** 違う関数の呼び出し同士は対応付けない */
    nodeLabel: (node: JsonNode) =>
        node.kind === 'fxCall'
            ? `fxCall:${String((node as unknown as { name: unknown }).name)}`
            : node.kind,
    /** 名前は . でつないだ 1 つの値にする (名前の部分ごとの対応付けはしない) */
    leafValues: (node: JsonNode): Record<string, DiffFieldValue> | undefined =>
        node.kind === 'fxName'
            ? { path: ((node as unknown as { path: string[] }).path ?? []).join('.') }
            : undefined,
};

const builder = makeGumTreeBuilder(FORMULA_GUMTREE_LANGUAGE);

export const makeFormulaDiff = (
    before: FormulaValue,
    after: FormulaValue,
    sources?: Sources,
): FormulaDiff => {
    if (isSameValue(before, after) || !isFxJson(before) || !isFxJson(after)) {
        return makeValueDiff(before, after);
    }
    const rootBefore = builder.makeBlockTree([before]);
    const rootAfter = builder.makeBlockTree([after]);
    const mappings = matchTrees(
        rootBefore,
        rootAfter,
        sources ? { distance: makeSourceDistance(sources) } : {},
    );
    return { status: 'changed', tree: makeGumTreeDiff(rootBefore, rootAfter, mappings) };
};
