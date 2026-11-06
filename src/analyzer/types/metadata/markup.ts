import type { ErrorJson, JsonType } from '../commons/json';
import { childrenOf, parseXml, XmlSyntaxError, type XmlElement } from '../commons/xml';
import {
    makeMetadataJson,
    makeXmlErrorJson,
    nonEmptyEntry,
    readXmlRoot,
    type ParsedXmlFile,
    type SourceText,
    type XmlFile,
    type XmlReadProblem,
    type XmlSourceRegistry,
} from '../commons/xmlJson';
import { makeRecordJsonFromRoot, type RecordJson } from './record';
import {
    APEX_COMPONENT_META_SPEC,
    APEX_PAGE_META_SPEC,
    AURA_DEFINITION_BUNDLE_SPEC,
    EMAIL_TEMPLATE_META_SPEC,
    type AuraDefinitionBundleJson,
} from './recordTypes';

// 本体のファイルを伴う種類 (Visualforce・メールテンプレート) と、バンドルの種類 (Aura)。方針: docs/metadata-implementation.md 10 章
// -meta.xml は種類の表 (recordTypes.ts) で読み、本体のマークアップは構造 (ルートの属性・使っている部品・宣言) だけを JSON にする。
// 中の差し込み ({!...}) などの参照は、参照の対応 (docs/analysis-plan.md) でまとめて扱う

/** 本体のマークアップを XML として読む。読めなければ problems に理由を足し、ErrorJson */
const parseMarkup = (
    text: SourceText,
    kindType: string,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
): { file: XmlFile; root: XmlElement } | ErrorJson => {
    const file: XmlFile = { filePath: text.filePath, source: text.source };
    try {
        return { file, root: parseXml(text.source) };
    } catch (error) {
        if (!(error instanceof XmlSyntaxError)) throw error;
        const json = makeXmlErrorJson(kindType, error.reason, error.position, file, registry);
        problems.push({
            code: 'XML_SYNTAX',
            file,
            kindType,
            message: error.reason,
            position: error.position,
            error: json,
        });
        return json;
    }
};

/** 名前空間付きのタグ (apex:outputText・c:myComponent など) の一覧 (重複なし・名前の順)。exclude のタグは除く */
const namespacedTags = (root: XmlElement, exclude: ReadonlySet<string> = new Set()): string[] => {
    const tags = new Set<string>();
    const visit = (element: XmlElement) => {
        if (element.name.includes(':') && !exclude.has(element.name)) tags.add(element.name);
        element.children.forEach(visit);
    };
    root.children.forEach(visit);
    return [...tags].sort();
};

/** 差し込み ({!...}) の中身 (前後の空白を除く。重複なし・名前の順) */
const expressionsOf = (source: string): string[] =>
    [
        ...new Set([...source.matchAll(/{!([^}]*)}/g)].map((m) => m[1]!.trim()).filter(Boolean)),
    ].sort();

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
    /** 使っている部品のタグ */
    components: string[];
    /** 差し込み ({!...} の中身。重複なし・名前の順)。参照の解析で使う */
    expressions?: string[];
    /** apex:component の apex:attribute */
    componentAttributes?: MarkupDeclarationJson<'visualforceAttribute'>[];
};

/** Visualforce ページ (pages/<名前>.page-meta.xml と <名前>.page) */
export type ApexPageJson = RecordJson<typeof APEX_PAGE_META_SPEC> & {
    markup?: VisualforceMarkupJson | ErrorJson;
};

/** Visualforce コンポーネント (components/<名前>.component-meta.xml と <名前>.component) */
export type ApexComponentJson = RecordJson<typeof APEX_COMPONENT_META_SPEC> & {
    markup?: VisualforceMarkupJson | ErrorJson;
};

const makeVisualforceMarkup = (
    text: SourceText | undefined,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
): { markup?: VisualforceMarkupJson | ErrorJson } => {
    if (!text) return {};
    const parsed = parseMarkup(text, 'visualforceMarkup', registry, problems);
    if (!('root' in parsed)) return { markup: parsed };
    return {
        markup: makeMetadataJson<VisualforceMarkupJson>(
            'visualforceMarkup',
            {
                root: parsed.root.name,
                attributes: attributesOf(parsed.root),
                components: namespacedTags(parsed.root, new Set(['apex:attribute'])),
                ...nonEmptyEntry('expressions', expressionsOf(text.source)),
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
): ApexPageJson | ErrorJson => {
    const meta = readXmlRoot(file, APEX_PAGE_META_SPEC.root, 'apexPage', registry, problems);
    if (!('name' in meta)) return meta;
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
): ApexComponentJson | ErrorJson => {
    const meta = readXmlRoot(
        file,
        APEX_COMPONENT_META_SPEC.root,
        'apexComponent',
        registry,
        problems,
    );
    if (!('name' in meta)) return meta;
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

/** メールテンプレート。-meta.xml の値 (件名・種類など) と本文 (.email。そのままの文字列) */
export type EmailTemplateJson = RecordJson<typeof EMAIL_TEMPLATE_META_SPEC> & { body?: string };

export const makeEmailTemplateJson = (
    file: ParsedXmlFile,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
    extras: SourceText[] = [],
): EmailTemplateJson | ErrorJson => {
    const meta = readXmlRoot(
        file,
        EMAIL_TEMPLATE_META_SPEC.root,
        'emailTemplate',
        registry,
        problems,
    );
    if (!('name' in meta)) return meta;
    const body = extras.find((extra) => extra.fileName.endsWith('.email'));
    return makeRecordJsonFromRoot(
        EMAIL_TEMPLATE_META_SPEC,
        meta,
        file,
        registry,
        body ? { body: body.source } : {},
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
    /** 使っている部品のタグ (aura: の宣言のタグは除く) */
    components: string[];
    /** 差し込み ({!...} の中身。重複なし・名前の順)。参照の解析で使う */
    expressions?: string[];
    /** Controller.js / Helper.js / Renderer.js の関数の名前 (書いた順)。キーは controller / helper / renderer */
    javascript?: Partial<Record<'controller' | 'helper' | 'renderer', string[]>>;
    /** バンドルの中のファイル (名前の順) */
    files: string[];
    /** <名前>.<種類>-meta.xml */
    meta?: AuraDefinitionBundleJson | ErrorJson;
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
): AuraBundleJson | ErrorJson => {
    const extension = file.filePath.split('.').pop() ?? '';
    const bundleType = (
        extension in AURA_BUNDLE_ROOTS ? extension : 'cmp'
    ) as keyof typeof AURA_BUNDLE_ROOTS;
    const root = readXmlRoot(file, AURA_BUNDLE_ROOTS[bundleType], 'auraBundle', registry, problems);
    if (!('name' in root)) return root;

    const metaText = extras.find((extra) => extra.fileName.endsWith('-meta.xml'));
    let meta: AuraDefinitionBundleJson | ErrorJson | undefined;
    if (metaText) {
        const parsed = parseMarkup(metaText, 'auraDefinitionBundle', registry, problems);
        meta =
            'root' in parsed
                ? makeRecordJsonFromRoot(
                      AURA_DEFINITION_BUNDLE_SPEC,
                      parsed.root,
                      { ...parsed.file, name: file.name },
                      registry,
                  )
                : parsed;
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
            components: namespacedTags(root, AURA_DECLARATION_TAGS),
            ...nonEmptyEntry('expressions', expressionsOf(file.source)),
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
