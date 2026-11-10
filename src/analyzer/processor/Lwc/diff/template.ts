import type {
    LwcAttributeValueJson,
    LwcMetadataRefJson,
    LwcTemplateJson,
    LwcTemplateNodeJson,
} from '../../../types';

import {
    JsonNode,
    NodeDiff,
    Sources,
    ValueDiff,
    makeNodeDiff,
    makeValueDiff,
} from '../../commons/diff/commons';
import {
    DiffFieldValue,
    GumTreeDiff,
    GumTreeLanguage,
    makeGumTreeBuilder,
    makeGumTreeDiff,
    makeSourceDistance,
    matchTrees,
} from '../../commons/diff/gumtree';
import { PresentDiff, makePresentDiff, presentEntry } from '../../commons/diff/present';

// LWC のテンプレート (HTML) の差分。方針: docs/lwc-implementation.md
// 要素の木は、Apex の文の並びと同じ GumTree で対応付ける (lwc:if で囲む・外す、div で包むと深さが変わるため)。
// 言語ごとの違い (ラベルの付け方など) だけを LWC_TEMPLATE_GUMTREE_LANGUAGE に書く

/** 属性の値を、比べるための 1 つの文字列にする ({row.id} / "text" / 値なし) */
const valueText = (value: LwcAttributeValueJson | undefined): string | null => {
    if (!value) return null;
    switch (value.type) {
        case 'expression':
            return `{${value.expression.text}}`;
        case 'static':
            return value.value;
        case 'boolean':
            return '';
    }
};

const isAttributeValue = (value: unknown): value is LwcAttributeValueJson =>
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    ['expression', 'static', 'boolean'].includes(String((value as { type: unknown }).type));

type NamedValue = {
    name?: string;
    event?: string;
    value?: LwcAttributeValueJson;
    handler?: LwcAttributeValueJson;
};
type MetadataRefValue = Pick<
    LwcMetadataRefJson,
    'attribute' | 'value' | 'expression' | 'objectExpression'
>;

/** メタデータの参照の値 (項目の式のオブジェクトは {式}.<項目>) */
const metadataRefText = (ref: MetadataRefValue): string | null => {
    if (ref.expression) return `{${ref.expression.text}}`;
    if (ref.objectExpression) return `{${ref.objectExpression.text}}.${ref.value ?? ''}`;
    return ref.value ?? null;
};

/**
 * 要素の属性・ディレクティブ・イベントを、要素の値 (fields) にする。キーは属性名 (ディレクティブは lwc:ref などの名前、
 * イベントは on<名前>)。木のノードにしないので、属性の小さな同形のノードに要素の対応付けが引っ張られない。
 * 違いは要素の差分の fields に、属性名ごとに出る (属性名で対応付ける D と同じ)
 */
const ELEMENT_PROPERTIES: Record<string, (item: NamedValue) => [string, string | null]> = {
    attributes: (item) => [String(item.name), valueText(item.value)],
    directives: (item) => [String(item.name), valueText(item.value)],
    events: (item) => [`on${String(item.event)}`, valueText(item.handler)],
    /** メタデータの参照は ref:<属性名> (祖先のフォームのオブジェクトが変わったときにも違いが出る) */
    metadataRefs: (item) => {
        const ref = item as unknown as MetadataRefValue;
        return [`ref:${ref.attribute}`, metadataRefText(ref)];
    },
};

export const LWC_TEMPLATE_GUMTREE_LANGUAGE: GumTreeLanguage = {
    /** 違うタグの要素同士は対応付けない */
    nodeLabel: (node: JsonNode) => {
        const raw = node as unknown as Record<string, unknown>;
        switch (node.kind) {
            case 'lwcElement':
                return `element:${String(raw.tag)}`;
            case 'lwcForEach':
                return `lwcForEach:${String(raw.iteratorType)}`;
            default:
                return node.kind;
        }
    },
    /** 要素の並び (children) は、文の並びと同じく block にする */
    isBlockRole: (_owner, role) => role === 'children',
    /** テキストは葉 (式は文字列から作ったものなので、文字列で比べる) */
    leafValues: (node: JsonNode): Record<string, DiffFieldValue> | undefined =>
        node.kind === 'lwcText'
            ? { text: String((node as unknown as { text: unknown }).text) }
            : undefined,
    fieldValues: (owner, key, value) => {
        // 要素の属性・ディレクティブ・イベント
        const toEntry = owner.startsWith('element:') ? ELEMENT_PROPERTIES[key] : undefined;
        if (toEntry && Array.isArray(value)) {
            return Object.fromEntries(value.map((item) => toEntry(item as NamedValue)));
        }
        // 分岐の条件・繰り返しの対象・参照するコンポーネントは、1 つの値として比べる
        if (isAttributeValue(value)) return { [key]: valueText(value) };
        if (key === 'component' && typeof value === 'object' && value !== null) {
            return { [key]: String((value as { module: unknown }).module) };
        }
        return undefined;
    },
};

const builder = makeGumTreeBuilder(LWC_TEMPLATE_GUMTREE_LANGUAGE);

/** テンプレートの子の並び (要素の木) の差分 */
export const makeLwcTemplateChildrenDiff = (
    before: LwcTemplateNodeJson[],
    after: LwcTemplateNodeJson[],
    sources?: Sources,
): GumTreeDiff[] => {
    const rootBefore = builder.makeBlockTree(before);
    const rootAfter = builder.makeBlockTree(after);
    const mappings = matchTrees(
        rootBefore,
        rootAfter,
        sources ? { distance: makeSourceDistance(sources) } : {},
    );
    return makeGumTreeDiff(rootBefore, rootAfter, mappings);
};

export type LwcTemplateJsonDiff = NodeDiff<
    'lwcTemplate',
    LwcTemplateJson,
    {
        renderMode?: PresentDiff<string, ValueDiff<string>>;
        preserveComments: ValueDiff<boolean>;
        /** 要素の木 (GumTree) */
        children: GumTreeDiff[];
    }
>;

export const makeLwcTemplateDiff = (
    before: LwcTemplateJson,
    after: LwcTemplateJson,
    sources?: Sources,
): LwcTemplateJsonDiff =>
    makeNodeDiff('lwcTemplate', before, after, 'slot', (b, a) => ({
        ...presentEntry('renderMode', makePresentDiff(b.renderMode, a.renderMode, makeValueDiff)),
        preserveComments: makeValueDiff(b.preserveComments, a.preserveComments),
        children: makeLwcTemplateChildrenDiff(b.children, a.children, sources),
    }));
