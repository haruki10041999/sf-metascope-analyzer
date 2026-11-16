import type { JsonType } from '../commons/json';
import {
    childrenOf,
    decodeRange,
    parseXml,
    trimDecoded,
    XmlSyntaxError,
    type XmlElement,
} from '../commons/xml';
import { makePositionOf } from '../commons/source';
import { makeSpanJson } from '../commons/spanJson';
import {
    makeMetadataJson,
    nonEmptyEntry,
    readXmlRoot,
    type ParsedXmlFile,
    type SourceText,
    type XmlFile,
    type XmlReadProblem,
    type XmlSourceRegistry,
} from '../commons/xmlJson';
import { makeRecordJsonFromRoot, type RecordJson } from './record';
import { readAttributeTemplate } from './criteria';
import { type TemplateValue, makeTemplateJson } from './formula';
import {
    APEX_COMPONENT_META_SPEC,
    APEX_PAGE_META_SPEC,
    AURA_DEFINITION_BUNDLE_SPEC,
    EMAIL_TEMPLATE_META_SPEC,
    type AuraDefinitionBundleJson,
} from './recordTypes';

// 本体のファイルを伴う種類 (Visualforce・メールテンプレート) と、バンドルの種類 (Aura)。方針: docs/metadata-implementation.md 10 章
// -meta.xml は種類の表 (recordTypes.ts) で読む。本体のマークアップは木 (markupElement・markupText。段階 M6) にし、
// 差し込み ({!...}) を含む属性値・テキストは fxTemplate にする。使っている部品・差し込みの一覧は派生の情報なので
// JSON に持たず、解析 (processor/Metadata/markup.ts) で木から出す

/** 本体のマークアップを XML として読む。読めなければ problems に理由を足し、null (JSON には持たない) */
const parseMarkup = (
    text: SourceText,
    kindType: string,
    problems: XmlReadProblem[],
): { file: XmlFile; root: XmlElement } | null => {
    const file: XmlFile = { filePath: text.filePath, source: text.source };
    try {
        return { file, root: parseXml(text.source) };
    } catch (error) {
        if (!(error instanceof XmlSyntaxError)) throw error;
        problems.push({
            code: 'XML_SYNTAX',
            file,
            kindType,
            message: error.reason,
            position: error.position,
        });
        return null;
    }
};

/** 属性 1 つ。値は差し込みを含めば fxTemplate (段階 M6) */
export type MarkupAttributeJson = { name: string; value: TemplateValue };

/** マークアップの要素 (タグ・属性 (書いた順)・子) */
export type MarkupElementJson = JsonType<'markupElement'> & {
    tag: string;
    attributes: MarkupAttributeJson[];
    children: MarkupNodeJson[];
};

/** 要素の間のテキスト (前後の空白を除いたもの。空白だけのものは持たない) */
export type MarkupTextJson = JsonType<'markupText'> & { text: TemplateValue };

export type MarkupNodeJson = MarkupElementJson | MarkupTextJson;

const isNamespaceAttribute = (name: string) => name === 'xmlns' || name.startsWith('xmlns:');

/** 要素の子 (要素とテキスト。書いた順) を木にする。exclude のタグの子要素 (宣言) は持たない */
const makeMarkupNodes = (
    element: XmlElement,
    file: XmlFile,
    registry: XmlSourceRegistry,
    exclude: ReadonlySet<string> = new Set(),
): MarkupNodeJson[] => {
    if (!element.content) return [];
    const positionOf = makePositionOf(file.source);
    const nodes: MarkupNodeJson[] = [];
    const pushText = (start: number, end: number) => {
        const decoded = trimDecoded(decodeRange(file.source, start, end));
        if (!decoded.text) return;
        const span = {
            start: positionOf(decoded.starts[0]!),
            end: positionOf(decoded.ends[decoded.ends.length - 1]!),
        };
        nodes.push(
            makeSpanJson<MarkupTextJson>(
                'markupText',
                {
                    text: makeTemplateJson(decoded, file, registry, span, ({ message, offset }) =>
                        registry.problems.push({
                            code: 'FORMULA_SYNTAX',
                            file,
                            kindType: 'markupText',
                            message,
                            position: positionOf(offset),
                        }),
                    ),
                },
                span,
                file,
                registry,
            ),
        );
    };
    let index = element.content.start;
    for (const child of element.children) {
        pushText(index, child.start.offset);
        index = child.end.offset;
        if (exclude.has(child.name)) continue;
        nodes.push(makeMarkupElement(child, file, registry));
    }
    pushText(index, element.content.end);
    return nodes;
};

const makeMarkupElement = (
    element: XmlElement,
    file: XmlFile,
    registry: XmlSourceRegistry,
): MarkupElementJson =>
    makeMetadataJson<MarkupElementJson>(
        'markupElement',
        {
            tag: element.name,
            attributes: Object.keys(element.attributes)
                .filter((name) => !isNamespaceAttribute(name))
                .map((name) => ({
                    name,
                    value: readAttributeTemplate(element, name, { file, registry }),
                })),
            children: makeMarkupNodes(element, file, registry),
        },
        element,
        file,
        registry,
    );

const attributesOf = (element: XmlElement): Record<string, string> =>
    Object.fromEntries(
        Object.entries(element.attributes).filter(
            ([name]) => name !== 'xmlns' && !name.startsWith('xmlns:'),
        ),
    );

/** 属性で書く宣言 (apex:attribute・aura:attribute など)。名前をキーにする JSON ノード */
export type MarkupDeclarationJson<K extends string = string> = JsonType<K> & {
    name: string;
    /** name 以外の属性 */
    attributes: Record<string, string>;
};

const makeDeclarations = <K extends string>(
    root: XmlElement,
    tag: string,
    kind: K,
    nameOf: (attributes: Record<string, string>) => string | undefined,
    file: XmlFile,
    registry: XmlSourceRegistry,
): MarkupDeclarationJson<K>[] =>
    childrenOf(root, tag).map((element) => {
        const attributes = attributesOf(element);
        const name = nameOf(attributes) ?? '';
        const { name: _name, ...rest } = attributes;
        return makeMetadataJson<MarkupDeclarationJson<K>>(
            kind,
            { name, attributes: rest },
            element,
            file,
            registry,
        );
    });

const byName = (attributes: Record<string, string>) => attributes.name;

// ---------------------------------------------------------------------------
// Visualforce
// ---------------------------------------------------------------------------

/** Visualforce の本体 (.page / .component) */
export type VisualforceMarkupJson = JsonType<'visualforceMarkup'> & {
    /** ルートのタグ (apex:page / apex:component) */
    root: string;
    /** ルートの属性 (controller・standardController・extensions など) */
    attributes: Record<string, string>;
    /** ルートの中身の木 (apex:component の apex:attribute は componentAttributes に出すので持たない。段階 M6) */
    body: MarkupNodeJson[];
    /** apex:component の apex:attribute */
    componentAttributes?: MarkupDeclarationJson<'visualforceAttribute'>[];
};

/** Visualforce ページ (pages/<名前>.page-meta.xml と <名前>.page)。markup は読めなければ持たない (理由は resolvedError) */
export type ApexPageJson = RecordJson<typeof APEX_PAGE_META_SPEC> & {
    markup?: VisualforceMarkupJson;
};

/** Visualforce コンポーネント (components/<名前>.component-meta.xml と <名前>.component)。markup は読めなければ持たない */
export type ApexComponentJson = RecordJson<typeof APEX_COMPONENT_META_SPEC> & {
    markup?: VisualforceMarkupJson;
};

const makeVisualforceMarkup = (
    text: SourceText | undefined,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
): { markup?: VisualforceMarkupJson } => {
    if (!text) return {};
    const parsed = parseMarkup(text, 'visualforceMarkup', problems);
    if (!parsed) return {};
    return {
        markup: makeMetadataJson<VisualforceMarkupJson>(
            'visualforceMarkup',
            {
                root: parsed.root.name,
                attributes: attributesOf(parsed.root),
                body: makeMarkupNodes(
                    parsed.root,
                    parsed.file,
                    registry,
                    new Set(['apex:attribute']),
                ),
                ...nonEmptyEntry(
                    'componentAttributes',
                    makeDeclarations(
                        parsed.root,
                        'apex:attribute',
                        'visualforceAttribute',
                        byName,
                        parsed.file,
                        registry,
                    ),
                ),
            },
            parsed.root,
            parsed.file,
            registry,
        ),
    };
};

export const makeApexPageJson = (
    file: ParsedXmlFile,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
    extras: SourceText[] = [],
): ApexPageJson | null => {
    const meta = readXmlRoot(file, APEX_PAGE_META_SPEC.root, 'apexPage', problems);
    if (!meta) return null;
    const markup = makeVisualforceMarkup(
        extras.find((extra) => extra.fileName.endsWith('.page')),
        registry,
        problems,
    );
    return makeRecordJsonFromRoot(APEX_PAGE_META_SPEC, meta, file, registry, markup);
};

export const makeApexComponentJson = (
    file: ParsedXmlFile,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
    extras: SourceText[] = [],
): ApexComponentJson | null => {
    const meta = readXmlRoot(file, APEX_COMPONENT_META_SPEC.root, 'apexComponent', problems);
    if (!meta) return null;
    const markup = makeVisualforceMarkup(
        extras.find((extra) => extra.fileName.endsWith('.component')),
        registry,
        problems,
    );
    return makeRecordJsonFromRoot(APEX_COMPONENT_META_SPEC, meta, file, registry, markup);
};

// ---------------------------------------------------------------------------
// メールテンプレート
// ---------------------------------------------------------------------------

/**
 * メールテンプレート。-meta.xml の値 (件名・種類など) と本文 (.email)。
 * 本文は差し込みを含めば fxTemplate (段階 M6。なければ文字列のまま)
 */
export type EmailTemplateJson = RecordJson<typeof EMAIL_TEMPLATE_META_SPEC> & {
    body?: TemplateValue;
};

/** メールの本文 (.email のファイル全体) をテンプレートにする */
const makeEmailBody = (text: SourceText, registry: XmlSourceRegistry): TemplateValue => {
    const file: XmlFile = { filePath: text.filePath, source: text.source };
    const positionOf = makePositionOf(text.source);
    const starts = Array.from({ length: text.source.length }, (_, i) => i);
    return makeTemplateJson(
        { text: text.source, starts, ends: starts.map((i) => i + 1) },
        file,
        registry,
        { start: positionOf(0), end: positionOf(text.source.length) },
        ({ message, offset }) =>
            registry.problems.push({
                code: 'FORMULA_SYNTAX',
                file,
                kindType: 'emailTemplate',
                message,
                position: positionOf(offset),
            }),
    );
};

export const makeEmailTemplateJson = (
    file: ParsedXmlFile,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
    extras: SourceText[] = [],
): EmailTemplateJson | null => {
    const meta = readXmlRoot(file, EMAIL_TEMPLATE_META_SPEC.root, 'emailTemplate', problems);
    if (!meta) return null;
    const body = extras.find((extra) => extra.fileName.endsWith('.email'));
    return makeRecordJsonFromRoot(
        EMAIL_TEMPLATE_META_SPEC,
        meta,
        file,
        registry,
        body ? { body: makeEmailBody(body, registry) } : {},
    );
};

// ---------------------------------------------------------------------------
// Aura
// ---------------------------------------------------------------------------

/** バンドルの種類 (メインのファイルの拡張子) とルート要素 */
export const AURA_BUNDLE_ROOTS = {
    cmp: 'aura:component',
    app: 'aura:application',
    evt: 'aura:event',
    intf: 'aura:interface',
    tokens: 'aura:tokens',
} as const;

export const AURA_BUNDLE_TYPES = Object.keys(
    AURA_BUNDLE_ROOTS,
) as (keyof typeof AURA_BUNDLE_ROOTS)[];

/** Aura のバンドル (aura/<名前>/)。メインのマークアップの構造と、JS のファイルの関数の名前 */
export type AuraBundleJson = JsonType<'auraBundle'> & {
    /** バンドル名 */
    name: string;
    bundleType: keyof typeof AURA_BUNDLE_ROOTS;
    /** ルート (aura:component など) の属性 (controller・implements・extends・access など) */
    rootAttributes: Record<string, string>;
    attributes?: MarkupDeclarationJson<'auraAttribute'>[];
    registerEvents?: MarkupDeclarationJson<'auraRegisterEvent'>[];
    /** aura:handler (名前がなければ event をキーにする) */
    handlers?: MarkupDeclarationJson<'auraHandler'>[];
    methods?: MarkupDeclarationJson<'auraMethod'>[];
    /** aura:dependency の resource */
    dependencies?: string[];
    /** lightning:messageChannel の type (メッセージチャネル <名前>__c。重複なし・名前の順) */
    messageChannels?: string[];
    /** ルートの中身の木 (aura: の宣言 (attributes などに出すもの) は持たない。段階 M6) */
    body: MarkupNodeJson[];
    /** Controller.js / Helper.js / Renderer.js の関数の名前 (書いた順)。キーは controller / helper / renderer */
    javascript?: Partial<Record<'controller' | 'helper' | 'renderer', string[]>>;
    /** バンドルの中のファイル (名前の順) */
    files: string[];
    /** <名前>.<種類>-meta.xml。読めなければ持たない (理由は resolvedError) */
    meta?: AuraDefinitionBundleJson;
};

const AURA_DECLARATION_TAGS = new Set([
    'aura:attribute',
    'aura:registerEvent',
    'aura:handler',
    'aura:method',
    'aura:dependency',
]);

const JS_FUNCTION =
    /(?:^|[,{]\s*)([A-Za-z_$][\w$]*)\s*:\s*(?:async\s+)?(?:function\b|\([^)]*\)\s*=>)/gm;

/** Aura のバンドル。file はメインのマークアップ (<名前>.cmp など)、extras はバンドルの中のほかのファイル */
export const makeAuraBundleJson = (
    file: ParsedXmlFile,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
    extras: SourceText[] = [],
): AuraBundleJson | null => {
    const extension = file.filePath.split('.').pop() ?? '';
    const bundleType = (
        extension in AURA_BUNDLE_ROOTS ? extension : 'cmp'
    ) as keyof typeof AURA_BUNDLE_ROOTS;
    const root = readXmlRoot(file, AURA_BUNDLE_ROOTS[bundleType], 'auraBundle', problems);
    if (!root) return null;

    const metaText = extras.find((extra) => extra.fileName.endsWith('-meta.xml'));
    let meta: AuraDefinitionBundleJson | undefined;
    const parsedMeta = metaText && parseMarkup(metaText, 'auraDefinitionBundle', problems);
    if (parsedMeta) {
        meta = makeRecordJsonFromRoot(
            AURA_DEFINITION_BUNDLE_SPEC,
            parsedMeta.root,
            { ...parsedMeta.file, name: file.name },
            registry,
        );
    }
    const javascript = Object.fromEntries(
        extras.flatMap((extra) => {
            const match = extra.fileName.match(/(Controller|Helper|Renderer)\.js$/);
            if (!match) return [];
            const names = [...extra.source.matchAll(JS_FUNCTION)].map((m) => m[1]!);
            return [[match[1]!.toLowerCase(), names]];
        }),
    ) as AuraBundleJson['javascript'];
    const dependencies = childrenOf(root, 'aura:dependency').flatMap((element) =>
        element.attributes.resource ? [element.attributes.resource] : [],
    );
    const messageChannels = new Set<string>();
    const visitChannels = (element: XmlElement) => {
        if (element.name === 'lightning:messageChannel' && element.attributes.type)
            messageChannels.add(element.attributes.type);
        element.children.forEach(visitChannels);
    };
    visitChannels(root);

    return makeMetadataJson<AuraBundleJson>(
        'auraBundle',
        {
            name: file.name,
            bundleType,
            rootAttributes: attributesOf(root),
            ...nonEmptyEntry(
                'attributes',
                makeDeclarations(root, 'aura:attribute', 'auraAttribute', byName, file, registry),
            ),
            ...nonEmptyEntry(
                'registerEvents',
                makeDeclarations(
                    root,
                    'aura:registerEvent',
                    'auraRegisterEvent',
                    byName,
                    file,
                    registry,
                ),
            ),
            ...nonEmptyEntry(
                'handlers',
                makeDeclarations(
                    root,
                    'aura:handler',
                    'auraHandler',
                    (attributes) => attributes.name ?? attributes.event,
                    file,
                    registry,
                ),
            ),
            ...nonEmptyEntry(
                'methods',
                makeDeclarations(root, 'aura:method', 'auraMethod', byName, file, registry),
            ),
            ...nonEmptyEntry('dependencies', dependencies),
            ...nonEmptyEntry('messageChannels', [...messageChannels].sort()),
            body: makeMarkupNodes(root, file, registry, AURA_DECLARATION_TAGS),
            ...(javascript && Object.keys(javascript).length ? { javascript } : {}),
            files: [
                file.filePath.split('/').pop()!,
                ...extras.map((extra) => extra.fileName),
            ].sort(),
            ...(meta ? { meta } : {}),
        },
        root,
        file,
        registry,
    );
};
