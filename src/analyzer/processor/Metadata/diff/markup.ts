import type { MarkupAttributeJson, MarkupNodeJson } from '../../../types';
import { templateTextOf } from '../../../types/metadata/formula';

import { JsonNode, Sources } from '../../commons/diff/commons';
import {
    DiffFieldValue,
    GumTreeDiff,
    GumTreeLanguage,
    makeGumTreeBuilder,
    makeGumTreeDiff,
    makeSourceDistance,
    matchTrees,
} from '../../commons/diff/gumtree';

// Visualforce・Aura の本体の木 (markupElement・markupText。docs/json-redesign-plan.md の段階 M6) の差分。
// LWC のテンプレートと同じく GumTree で対応付ける (包む・外す、入れ子の深さが変わっても対応付ける)

export const MARKUP_GUMTREE_LANGUAGE: GumTreeLanguage = {
    /** 違うタグの要素同士は対応付けない */
    nodeLabel: (node: JsonNode) =>
        node.kind === 'markupElement'
            ? `element:${String((node as unknown as { tag: unknown }).tag)}`
            : node.kind,
    /** 子の並び (children) は文の並びと同じく block にする */
    isBlockRole: (_owner, role) => role === 'children',
    /** テキストは葉 (差し込みも書いた形の文字列で比べる) */
    leafValues: (node: JsonNode): Record<string, DiffFieldValue> | undefined =>
        node.kind === 'markupText'
            ? { text: templateTextOf((node as unknown as { text: never }).text) }
            : undefined,
    /** 要素の属性は、属性名ごとの値にする (差分は要素の fields に属性名で出る) */
    fieldValues: (owner, key, value) =>
        owner.startsWith('element:') && key === 'attributes' && Array.isArray(value)
            ? Object.fromEntries(
                  (value as MarkupAttributeJson[]).map((attribute) => [
                      attribute.name,
                      templateTextOf(attribute.value),
                  ]),
              )
            : undefined,
};

const builder = makeGumTreeBuilder(MARKUP_GUMTREE_LANGUAGE);

/** 本体の木の差分 (上の階層のノードの並びを根にする) */
export type MarkupBodyDiff = GumTreeDiff[];

export const makeMarkupBodyDiff = (
    before: MarkupNodeJson[],
    after: MarkupNodeJson[],
    sources?: Sources,
): MarkupBodyDiff => {
    const rootBefore = builder.makeBlockTree(before);
    const rootAfter = builder.makeBlockTree(after);
    const mappings = matchTrees(
        rootBefore,
        rootAfter,
        sources ? { distance: makeSourceDistance(sources) } : {},
    );
    return makeGumTreeDiff(rootBefore, rootAfter, mappings);
};
