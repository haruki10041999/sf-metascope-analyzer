import { AriaAttrNameToPropNameMap, SPECIAL_PROPERTY_ATTRIBUTE_MAPPING } from '@lwc/shared';
import { toPropertyName } from '@lwc/template-compiler';
import type { DefaultTreeAdapterTypes } from 'parse5';

import type { ErrorJson, JsonType } from '../commons/json';
import { makePositionOf } from '../commons/source';
import {
    getLightningComponentSpec,
    getLightningMetadataRef,
    type LwcMetadataRefType,
} from './lightning';
import {
    makeSpanErrorJson,
    makeSpanJson,
    type SourceFile,
    type Span,
    type SpanSourceRegistry,
} from '../commons/spanJson';

// LWC のテンプレート (.html) の JSON。中間表現は作らず、parse5 の木から直接作る (XML と同じ方式)。
// 方針: docs/lwc-json-reference.md
// - 要素・テキスト・属性・ディレクティブ・イベントハンドラーは JsonType (属性ごとの位置を持つ)
// - lwc:if / lwc:elseif / lwc:else (と if:true / if:false) は分岐の並び lwcIf、for:each / iterator:* は lwcForEach の
//   意味のブロックにする (template-compiler の IfBlock / ForEach と同じ考え方)。ディレクティブを付けた要素は、
//   <template> ならその子を、ほかの要素ならその要素を、ブロックの子にする
// - 要素の位置は要素全体 (子孫を含む)。ルート (lwcTemplate) はファイル全体のソースを持たない (CSS・JS と同じ)

type P5Node = DefaultTreeAdapterTypes.Node;
type P5ChildNode = DefaultTreeAdapterTypes.ChildNode;
type P5Element = DefaultTreeAdapterTypes.Element;
type P5Template = DefaultTreeAdapterTypes.Template;
type P5Text = DefaultTreeAdapterTypes.TextNode;
type P5Attribute = P5Element['attrs'][number];

/** {…} の式。LWC のテンプレートの式は名前の参照だけなので、ドットで分けられれば path を持つ */
export type LwcExpressionJson = {
    /** {} の中の文字列 (前後の空白を除く) */
    text: string;
    /** row.id → ['row', 'id']。名前の参照でなければ持たない */
    path?: string[];
    /** 先頭の名前が for:item / for:index / iterator:* で定義した名前か (false ならコンポーネントのメンバーの参照) */
    local: boolean;
};

/** 属性の値。{…} は式、引用符付きの文字列・式は static (title="{title}" は LWC1034 の違反)、値なしは boolean */
export type LwcAttributeValueJson =
    | { type: 'static'; value: string }
    | { type: 'expression'; expression: LwcExpressionJson }
    | { type: 'boolean' };

export type LwcAttributeJson = JsonType<'lwcAttribute'> & {
    /** 書かれた名前 (parse5 で小文字になる) */
    name: string;
    /** コンポーネントのタグで、プロパティ (@api) に渡すもの (record-id → recordId)。class / style / slot / data-* は持たない */
    propertyName?: string;
    value: LwcAttributeValueJson;
};

/** 制御のブロックにしないディレクティブ (key / lwc:ref / lwc:dom / lwc:spread / lwc:is / lwc:slot-data など) */
export type LwcDirectiveJson = JsonType<'lwcDirective'> & {
    name: string;
    value: LwcAttributeValueJson;
};

/** イベントハンドラー (onselect={handleSelect}) */
export type LwcHandlerJson = JsonType<'lwcHandler'> & {
    /** on を除いた名前 (select) */
    event: string;
    handler: LwcAttributeValueJson;
};

export type LwcTextJson = JsonType<'lwcText'> & {
    /** 連続する空白を 1 つにし、前後の空白を除いたもの */
    text: string;
    expressions: LwcExpressionJson[];
};

/** タグ名から分かる、参照するコンポーネント (docs/lwc-json-reference.md) */
export type LwcComponentRefJson = {
    namespace: string;
    /** camelCase (c-account-row → accountRow) */
    name: string;
    /** c/accountRow */
    module: string;
    /** 同じ名前空間のバンドル / 基本コンポーネント (lightning) / ほかの名前空間 */
    source: 'local' | 'lightning' | 'package';
};

export type LwcElementType = 'html' | 'component' | 'slot' | 'template' | 'dynamic' | 'external';

/**
 * Salesforce のメタデータを参照する属性 (lightning-* のカタログ (lightning.ts) にあるもの。6.5.4)。
 * 値が式のものは、JS の値・import と合わせて解析で解決する
 */
export type LwcMetadataRefJson = {
    /** 属性名 (field-name / object-api-name など) */
    attribute: string;
    refType: LwcMetadataRefType;
    /** 静的な値。項目は、祖先のレコードフォームのオブジェクトが静的に分かれば '<オブジェクト>.<項目>' */
    value?: string;
    /** 値が式のとき */
    expression?: LwcExpressionJson;
    /** 項目で、祖先のレコードフォームの object-api-name が式のとき、その式 */
    objectExpression?: LwcExpressionJson;
};

export type LwcElementJson = JsonType<'lwcElement'> & {
    tag: string;
    elementType: LwcElementType;
    component?: LwcComponentRefJson;
    /** <slot> の name (名前なしは '') */
    slotName?: string;
    /** メタデータを参照する属性。なければ持たない */
    metadataRefs?: LwcMetadataRefJson[];
    attributes: LwcAttributeJson[];
    directives: LwcDirectiveJson[];
    events: LwcHandlerJson[];
    children: LwcTemplateNodeJson[];
};

export type LwcBranchDirective = 'lwc:if' | 'lwc:elseif' | 'lwc:else' | 'if:true' | 'if:false';

/** 分岐 1 つ。位置はディレクティブを付けた要素 */
export type LwcBranchJson = JsonType<'lwcBranch'> & {
    directive: LwcBranchDirective;
    /** lwc:else は持たない */
    condition?: LwcAttributeValueJson;
    children: LwcTemplateNodeJson[];
};

/** lwc:if 〜 lwc:else の連なり (if:true / if:false は 1 つずつ)。位置は最初の分岐から最後の分岐まで */
export type LwcIfJson = JsonType<'lwcIf'> & {
    branches: LwcBranchJson[];
};

/** for:each / iterator:*。位置はディレクティブを付けた要素 */
export type LwcForEachJson = JsonType<'lwcForEach'> & {
    iteratorType: 'for:each' | 'iterator';
    /** for:each={rows} / iterator:it={rows} の式 */
    items: LwcAttributeValueJson;
    /** for:item */
    item?: string;
    /** for:index */
    index?: string;
    /** iterator:it の it */
    iteratorName?: string;
    children: LwcTemplateNodeJson[];
};

export type LwcTemplateNodeJson = LwcElementJson | LwcTextJson | LwcIfJson | LwcForEachJson;

export type LwcTemplateJson = JsonType<'lwcTemplate'> & {
    /** lwc:render-mode (light など) */
    renderMode?: string;
    /** lwc:preserve-comments */
    preserveComments: boolean;
    children: LwcTemplateNodeJson[];
};

export type LwcTemplateOptions = {
    /** バンドルの名前空間 (既定は c)。タグの名前空間がこれなら local */
    namespace?: string;
};

// ---------------------------------------------------------------------------
// 属性の分類
// ---------------------------------------------------------------------------

const BRANCH_DIRECTIVES: readonly string[] = [
    'lwc:if',
    'lwc:elseif',
    'lwc:else',
    'if:true',
    'if:false',
];
const LOOP_ATTRIBUTES: readonly string[] = ['for:each', 'for:item', 'for:index'];
const isIteratorAttribute = (name: string) => name.startsWith('iterator:');
const isControlAttribute = (name: string) =>
    BRANCH_DIRECTIVES.includes(name) || LOOP_ATTRIBUTES.includes(name) || isIteratorAttribute(name);
const isDirectiveAttribute = (name: string) => name === 'key' || name.startsWith('lwc:');
const isEventAttribute = (name: string) => name.startsWith('on') && name.length > 2;
/** コンポーネントのタグでも HTML の属性のまま残るもの (template-compiler の判定と同じ) */
const isGlobalAttribute = (name: string) =>
    name === 'class' || name === 'style' || name === 'slot' || name.startsWith('data-');

/**
 * 属性名 → プロパティ名。template-compiler の attributeToPropertyName と同じ
 * (tabindex → tabIndex などの特別な属性・aria-* は @lwc/shared の表、それ以外は kebab-case → camelCase)
 */
const ATTRIBUTE_TO_PROPERTY = new Map<string, string>([
    ...[...SPECIAL_PROPERTY_ATTRIBUTE_MAPPING].map(([property, attribute]): [string, string] => [
        attribute,
        property,
    ]),
    ...Object.entries(AriaAttrNameToPropNameMap),
]);
const attributeToPropertyName = (name: string) =>
    ATTRIBUTE_TO_PROPERTY.get(name) ?? toPropertyName(name);

const NAME_PATH = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/;

const kebabToCamel = (text: string) =>
    text.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());

const isElement = (node: P5Node): node is P5Element => 'tagName' in node;
const isText = (node: P5Node): node is P5Text => node.nodeName === '#text';
const childNodesOf = (element: P5Element): P5ChildNode[] =>
    element.tagName === 'template'
        ? (element as P5Template).content.childNodes
        : element.childNodes;

// ---------------------------------------------------------------------------
// JSON
// ---------------------------------------------------------------------------

/**
 * parse5 の木 (parseFragment の結果) → LwcTemplateJson。
 * ルートの要素が <template> でなければ ErrorJson (診断は template-compiler の LWC1079 / LWC1075)
 */
export const makeLwcTemplateJson = (
    fragment: DefaultTreeAdapterTypes.DocumentFragment,
    file: SourceFile,
    registry: SpanSourceRegistry,
    options: LwcTemplateOptions = {},
): LwcTemplateJson | ErrorJson => {
    const positionOf = makePositionOf(file.source);
    const namespace = options.namespace ?? 'c';

    const spanOf = (location: { startOffset: number; endOffset: number } | null | undefined) =>
        location
            ? { start: positionOf(location.startOffset), end: positionOf(location.endOffset) }
            : undefined;
    const elementSpan = (element: P5Element) => spanOf(element.sourceCodeLocation);
    const attributeSpan = (element: P5Element, name: string) =>
        spanOf(element.sourceCodeLocation?.attrs?.[name]);

    const makeExpression = (text: string, scope: ReadonlySet<string>): LwcExpressionJson => {
        const trimmed = text.trim();
        const path = NAME_PATH.test(trimmed) ? trimmed.split('.') : undefined;
        return {
            text: trimmed,
            ...(path ? { path } : {}),
            local: path ? scope.has(path[0]!) : false,
        };
    };

    /** 属性の値。parse5 は引用符の有無を残さないので、ソースの書き方 (= の次の文字) で決める */
    const makeValue = (
        element: P5Element,
        attribute: P5Attribute,
        scope: ReadonlySet<string>,
    ): LwcAttributeValueJson => {
        const location = element.sourceCodeLocation?.attrs?.[attribute.name];
        const raw = location ? file.source.slice(location.startOffset, location.endOffset) : '';
        const equal = raw.indexOf('=');
        if (location && equal < 0) {
            return { type: 'boolean' };
        }
        const written = raw.slice(equal + 1).trimStart();
        if (written.startsWith('{') && attribute.value.endsWith('}')) {
            return {
                type: 'expression',
                expression: makeExpression(attribute.value.slice(1, -1), scope),
            };
        }
        return { type: 'static', value: attribute.value };
    };

    const makeComponentRef = (tag: string): LwcComponentRefJson | undefined => {
        const separator = tag.indexOf('-');
        if (separator <= 0) return undefined;
        const tagNamespace = tag.slice(0, separator);
        const name = kebabToCamel(tag.slice(separator + 1));
        return {
            namespace: tagNamespace,
            name,
            module: `${tagNamespace}/${name}`,
            source:
                tagNamespace === namespace
                    ? 'local'
                    : tagNamespace === 'lightning'
                      ? 'lightning'
                      : 'package',
        };
    };

    const elementTypeOf = (element: P5Element): LwcElementType => {
        const tag = element.tagName;
        if (tag === 'template') return 'template';
        if (tag === 'slot') return 'slot';
        if (tag === 'lwc:component') return 'dynamic';
        if (element.attrs.some((a) => a.name === 'lwc:external')) return 'external';
        return tag.includes('-') ? 'component' : 'html';
    };

    /** 祖先のレコードフォーム (lightning-record-edit-form など) の object-api-name。内側のものが後ろ */
    const formObjects: (LwcAttributeValueJson | undefined)[] = [];

    /** カタログでメタデータを参照するとした属性 */
    const makeMetadataRefs = (tag: string, attributes: LwcAttributeJson[]): LwcMetadataRefJson[] =>
        attributes.flatMap((attribute): LwcMetadataRefJson[] => {
            const refType = getLightningMetadataRef(tag, attribute.name);
            if (!refType) return [];
            const { value } = attribute;
            const base = { attribute: attribute.name, refType };
            if (value.type === 'expression') {
                return [{ ...base, expression: value.expression }];
            }
            if (value.type !== 'static') return [];
            // 項目 (field-name) は、祖先のレコードフォームのオブジェクトと合わせる
            const form =
                refType === 'field' && attribute.name === 'field-name'
                    ? formObjects.at(-1)
                    : undefined;
            if (form?.type === 'static') {
                return [{ ...base, value: `${form.value}.${value.value}` }];
            }
            if (form?.type === 'expression') {
                return [{ ...base, value: value.value, objectExpression: form.expression }];
            }
            return [{ ...base, value: value.value }];
        });

    /** 要素 (制御のディレクティブを除いた属性で作る) */
    const makeElement = (element: P5Element, scope: ReadonlySet<string>): LwcElementJson => {
        const elementType = elementTypeOf(element);
        const component =
            elementType === 'component' ? makeComponentRef(element.tagName) : undefined;
        const attributes: LwcAttributeJson[] = [];
        const directives: LwcDirectiveJson[] = [];
        const events: LwcHandlerJson[] = [];
        for (const attribute of element.attrs) {
            const { name } = attribute;
            if (isControlAttribute(name)) continue;
            const span = attributeSpan(element, name);
            const value = makeValue(element, attribute, scope);
            if (isDirectiveAttribute(name)) {
                directives.push(
                    makeSpanJson<LwcDirectiveJson>(
                        'lwcDirective',
                        { name, value },
                        span,
                        file,
                        registry,
                    ),
                );
            } else if (isEventAttribute(name)) {
                events.push(
                    makeSpanJson<LwcHandlerJson>(
                        'lwcHandler',
                        { event: name.slice(2), handler: value },
                        span,
                        file,
                        registry,
                    ),
                );
            } else {
                const propertyName =
                    elementType === 'component' && !isGlobalAttribute(name)
                        ? attributeToPropertyName(name)
                        : undefined;
                attributes.push(
                    makeSpanJson<LwcAttributeJson>(
                        'lwcAttribute',
                        { name, ...(propertyName ? { propertyName } : {}), value },
                        span,
                        file,
                        registry,
                    ),
                );
            }
        }
        const slotName =
            elementType === 'slot'
                ? (element.attrs.find((a) => a.name === 'name')?.value ?? '')
                : undefined;
        const metadataRefs = makeMetadataRefs(element.tagName, attributes);

        // レコードフォームの中の lightning-input-field などは、このフォームのオブジェクトの項目
        const providesObject = getLightningComponentSpec(element.tagName)?.providesObject === true;
        if (providesObject) {
            formObjects.push(attributes.find((a) => a.name === 'object-api-name')?.value);
        }
        const children = makeChildren(childNodesOf(element), scope);
        if (providesObject) formObjects.pop();

        return makeSpanJson<LwcElementJson>(
            'lwcElement',
            {
                tag: element.tagName,
                elementType,
                ...(component ? { component } : {}),
                ...(slotName !== undefined ? { slotName } : {}),
                ...(metadataRefs.length ? { metadataRefs } : {}),
                attributes,
                directives,
                events,
                children,
            },
            elementSpan(element),
            file,
            registry,
        );
    };

    /**
     * 制御のディレクティブを除いた中身。<template> でほかのディレクティブがなければその子、それ以外は要素そのもの
     */
    const makeBody = (element: P5Element, scope: ReadonlySet<string>): LwcTemplateNodeJson[] => {
        const plainTemplate =
            element.tagName === 'template' &&
            element.attrs.every((a) => isControlAttribute(a.name));
        return plainTemplate
            ? makeChildren(childNodesOf(element), scope)
            : [makeElement(element, scope)];
    };

    const attributeOf = (element: P5Element, name: string) =>
        element.attrs.find((a) => a.name === name);

    const makeBranch = (
        element: P5Element,
        directive: LwcBranchDirective,
        scope: ReadonlySet<string>,
        children: LwcTemplateNodeJson[],
    ): LwcBranchJson => {
        const attribute = attributeOf(element, directive)!;
        return makeSpanJson<LwcBranchJson>(
            'lwcBranch',
            {
                directive,
                ...(directive === 'lwc:else'
                    ? {}
                    : { condition: makeValue(element, attribute, scope) }),
                children,
            },
            elementSpan(element),
            file,
            registry,
        );
    };

    const makeIf = (branches: LwcBranchJson[], spans: (Span | undefined)[]): LwcIfJson => {
        const first = spans[0];
        const last = spans[spans.length - 1];
        return makeSpanJson<LwcIfJson>(
            'lwcIf',
            { branches },
            first && last ? { start: first.start, end: last.end } : undefined,
            file,
            registry,
        );
    };

    /** for:each / iterator:* のブロック。中の名前 (for:item など) を scope に足して中身を作る */
    const makeForEach = (
        element: P5Element,
        scope: ReadonlySet<string>,
        makeInner: (scope: ReadonlySet<string>) => LwcTemplateNodeJson[],
    ): LwcForEachJson | undefined => {
        const forEach = attributeOf(element, 'for:each');
        const iterator = element.attrs.find((a) => isIteratorAttribute(a.name));
        const target = forEach ?? iterator;
        if (!target) return undefined;
        const item = forEach ? attributeOf(element, 'for:item')?.value : undefined;
        const index = forEach ? attributeOf(element, 'for:index')?.value : undefined;
        const iteratorName = iterator?.name.slice('iterator:'.length);
        const inner = new Set(scope);
        [item, index, forEach ? undefined : iteratorName].forEach((n) => n && inner.add(n));
        return makeSpanJson<LwcForEachJson>(
            'lwcForEach',
            {
                iteratorType: forEach ? 'for:each' : 'iterator',
                items: makeValue(element, target, scope),
                ...(item !== undefined ? { item } : {}),
                ...(index !== undefined ? { index } : {}),
                ...(!forEach && iteratorName !== undefined ? { iteratorName } : {}),
                children: makeInner(inner),
            },
            elementSpan(element),
            file,
            registry,
        );
    };

    /** 子の並び。lwc:if 〜 lwc:else の連なり (間の空白・コメントは無視) を 1 つの lwcIf にまとめる */
    const makeChildren = (
        nodes: P5ChildNode[],
        scope: ReadonlySet<string>,
    ): LwcTemplateNodeJson[] => {
        const result: LwcTemplateNodeJson[] = [];
        let chain: { branches: LwcBranchJson[]; spans: (Span | undefined)[] } | null = null;
        const closeChain = () => {
            if (chain) result.push(makeIf(chain.branches, chain.spans));
            chain = null;
        };

        for (const node of nodes) {
            if (isText(node)) {
                const text = node.value.replace(/\s+/g, ' ').trim();
                if (!text) continue;
                closeChain();
                const expressions = [...text.matchAll(/\{([^{}]*)\}/g)].map((m) =>
                    makeExpression(m[1]!, scope),
                );
                result.push(
                    makeSpanJson<LwcTextJson>(
                        'lwcText',
                        { text, expressions },
                        spanOf(node.sourceCodeLocation),
                        file,
                        registry,
                    ),
                );
                continue;
            }
            if (!isElement(node)) continue; // コメント

            const directive = BRANCH_DIRECTIVES.find((d) => attributeOf(node, d)) as
                LwcBranchDirective | undefined;
            const hasLoop =
                attributeOf(node, 'for:each') !== undefined ||
                node.attrs.some((a) => isIteratorAttribute(a.name));

            // for:each と lwc:if が同じ要素にあるときは、繰り返しの中で分岐する (分岐の条件は繰り返しの名前を使える)
            if (hasLoop) {
                closeChain();
                const forEach = makeForEach(node, scope, (inner) =>
                    directive
                        ? [
                              makeIf(
                                  [makeBranch(node, directive, inner, makeBody(node, inner))],
                                  [elementSpan(node)],
                              ),
                          ]
                        : makeBody(node, inner),
                )!;
                result.push(forEach);
                continue;
            }

            if (directive) {
                const branch = makeBranch(node, directive, scope, makeBody(node, scope));
                const continues =
                    (directive === 'lwc:elseif' || directive === 'lwc:else') &&
                    chain !== null &&
                    (chain as { branches: LwcBranchJson[] }).branches.at(-1)?.directive !==
                        'lwc:else';
                if (!continues) closeChain();
                if (!chain) chain = { branches: [], spans: [] };
                chain.branches.push(branch);
                chain.spans.push(elementSpan(node));
                // if:true / if:false は連ならない
                if (directive.startsWith('if:')) closeChain();
                continue;
            }

            closeChain();
            result.push(makeElement(node, scope));
        }
        closeChain();
        return result;
    };

    const root = fragment.childNodes.find(isElement);
    if (!root || root.tagName !== 'template') {
        return makeSpanErrorJson(
            'lwcTemplate',
            root ? `<template> expected but <${root.tagName}> found` : 'root <template> not found',
            root?.sourceCodeLocation
                ? positionOf(root.sourceCodeLocation.startOffset)
                : positionOf(0),
            file,
            registry,
        );
    }

    const renderMode = attributeOf(root, 'lwc:render-mode')?.value;
    return makeSpanJson<LwcTemplateJson>(
        'lwcTemplate',
        {
            ...(renderMode !== undefined ? { renderMode } : {}),
            preserveComments: attributeOf(root, 'lwc:preserve-comments') !== undefined,
            children: makeChildren(childNodesOf(root), new Set()),
        },
        undefined,
        file,
        registry,
    );
};
