import type {
    ApexComponentJson,
    ApexPageJson,
    AuraBundleJson,
    AuraDefinitionBundleJson,
    EmailTemplateJson,
    ErrorJson,
    MarkupDeclarationJson,
    PropertySchema,
    RecordChildJson,
    RecordChildSpec,
    RecordJson,
    RecordSpec,
    TreeSpec,
    ValueTree,
    VisualforceMarkupJson,
} from '../../../types';
import {
    APEX_COMPONENT_META_SPEC,
    APEX_PAGE_META_SPEC,
    AURA_DEFINITION_BUNDLE_SPEC,
    EMAIL_TEMPLATE_META_SPEC,
    recordChildKey,
} from '../../../types';

import {
    ListItemDiff,
    Match,
    NodeDiff,
    Sources,
    ValueDiff,
    makeKeyedDiff,
    makeNodeDiff,
    makeValueDiff,
} from '../../commons/diff/commons';
import { TypedListDiff } from '../../commons/diff/list';
import {
    PresentDiff,
    PropertiesDiff,
    makeOrderedValuesDiff,
    makePresentDiff,
    makePropertiesDiff,
    makeUnorderedValuesDiff,
    presentEntry,
} from '../../commons/diff/present';
import { NameValuesDiff, makeNameValuesDiff } from './page';

// 優先度 B・C の差分。方針: docs/metadata-b-c-plan.md 2.3 章
// 種類の表 (RecordSpec) から作る。値は 1 つずつ (makePropertiesDiff)、繰り返す値は書いた順 (C)、
// 入れ子の構造 (値の木) は 'one' なら値、'many' なら書いた順 (C)、子はキーで D (キーがなければ集合)

type ListsDiff<S extends { lists?: readonly string[] }> = {
    [L in NonNullable<S['lists']>[number]]?: PresentDiff<
        string[],
        TypedListDiff<string, ValueDiff<string>>
    >;
};

type TreesDiff<S extends { trees?: TreeSpec }> = {
    [T in keyof NonNullable<S['trees']>]?: NonNullable<S['trees']>[T] extends 'many'
        ? PresentDiff<ValueTree[], TypedListDiff<ValueTree, ValueDiff<ValueTree>>>
        : PresentDiff<ValueTree, ValueDiff<ValueTree>>;
};

type ValuesDiff<S extends { schema: PropertySchema; lists?: readonly string[]; trees?: TreeSpec }> =
    PropertiesDiff<S['schema']> &
        ListsDiff<S> &
        TreesDiff<S> & { skippedElements?: PresentDiff<string[], TypedListDiff<string, never>> };

/** 子の差分 */
export type RecordChildJsonDiff<C extends RecordChildSpec> = NodeDiff<
    C['kind'],
    RecordChildJson<C>,
    ValuesDiff<C>
>;

type ChildrenDiff<S extends RecordSpec> = {
    [E in keyof NonNullable<S['children']>]?: PresentDiff<
        RecordChildJson<NonNullable<S['children']>[E]>[],
        ListItemDiff<
            NonNullable<S['children']>[E]['kind'],
            RecordChildJson<NonNullable<S['children']>[E]>,
            RecordChildJsonDiff<NonNullable<S['children']>[E]>
        >[]
    >;
};

/** 種類の差分 */
export type RecordJsonDiff<S extends RecordSpec> = NodeDiff<
    S['kind'],
    RecordJson<S>,
    { fullName: ValueDiff<string> } & ValuesDiff<S> & ChildrenDiff<S>
>;

type Values = Record<string, unknown>;

const makeValuesDiff = (
    spec: Pick<RecordSpec, 'schema' | 'lists' | 'trees'>,
    before: Values,
    after: Values,
): Values => ({
    ...makePropertiesDiff(spec.schema, before as never, after as never),
    ...Object.fromEntries(
        (spec.lists ?? []).flatMap((name) => {
            const diff = makePresentDiff(
                before[name] as string[] | undefined,
                after[name] as string[] | undefined,
                makeOrderedValuesDiff,
            );
            return diff === undefined ? [] : [[name, diff]];
        }),
    ),
    ...Object.fromEntries(
        Object.entries(spec.trees ?? {}).flatMap(([name, cardinality]) => {
            const diff =
                cardinality === 'many'
                    ? makePresentDiff(
                          before[name] as ValueTree[] | undefined,
                          after[name] as ValueTree[] | undefined,
                          makeOrderedValuesDiff,
                      )
                    : makePresentDiff(
                          before[name] as ValueTree | undefined,
                          after[name] as ValueTree | undefined,
                          makeValueDiff,
                      );
            return diff === undefined ? [] : [[name, diff]];
        }),
    ),
    ...presentEntry(
        'skippedElements',
        makePresentDiff(
            before.skippedElements as string[] | undefined,
            after.skippedElements as string[] | undefined,
            makeUnorderedValuesDiff,
        ),
    ),
});

const makeChildrenDiff = (
    children: RecordSpec['children'],
    before: Values,
    after: Values,
    sources?: Sources,
): Values =>
    Object.fromEntries(
        Object.entries(children ?? {}).flatMap(([name, spec]) => {
            const diff = makePresentDiff(
                before[name] as RecordChildJson<RecordChildSpec>[] | undefined,
                after[name] as RecordChildJson<RecordChildSpec>[] | undefined,
                (b, a) =>
                    makeKeyedDiff(
                        spec.kind,
                        b,
                        a,
                        (x, y, match) =>
                            makeNodeDiff(spec.kind, x, y, match, (p, q) =>
                                makeValuesDiff(spec, p as Values, q as Values),
                            ),
                        (child) => recordChildKey(spec, child) || undefined,
                        sources,
                    ),
            );
            return diff === undefined ? [] : [[name, diff]];
        }),
    );

/** 表から、種類の差分を作る関数を作る */
export const makeRecordDiff =
    <S extends RecordSpec>(spec: S) =>
    (
        before: RecordJson<S> | ErrorJson,
        after: RecordJson<S> | ErrorJson,
        match: Match = 'key',
        sources?: Sources,
    ): RecordJsonDiff<S> =>
        makeNodeDiff(
            spec.kind as S['kind'],
            before as RecordJson<RecordSpec>,
            after as RecordJson<RecordSpec>,
            match,
            (b, a) => ({
                fullName: makeValueDiff(b.fullName, a.fullName),
                ...makeValuesDiff(spec, b as Values, a as Values),
                ...makeChildrenDiff(spec.children, b as Values, a as Values, sources),
            }),
        ) as unknown as RecordJsonDiff<S>;

// ---------------------------------------------------------------------------
// マークアップ (Visualforce・メールテンプレート・Aura)
// ---------------------------------------------------------------------------

export type MarkupDeclarationJsonDiff<K extends string = string> = NodeDiff<
    K,
    MarkupDeclarationJson<K>,
    { name: ValueDiff<string>; attributes: NameValuesDiff }
>;

type DeclarationsDiff<K extends string> = PresentDiff<
    MarkupDeclarationJson<K>[],
    ListItemDiff<K, MarkupDeclarationJson<K>, MarkupDeclarationJsonDiff<K>>[]
>;

/** 宣言 (apex:attribute・aura:attribute など) は名前で D */
const makeDeclarationsDiff = <K extends string>(
    kind: K,
    before: MarkupDeclarationJson<K>[] | undefined,
    after: MarkupDeclarationJson<K>[] | undefined,
    sources?: Sources,
): DeclarationsDiff<K> | undefined =>
    makePresentDiff(before, after, (b, a) =>
        makeKeyedDiff(
            kind,
            b,
            a,
            (x, y, match) =>
                makeNodeDiff(kind, x, y, match, (p, q) => ({
                    name: makeValueDiff(p.name, q.name),
                    attributes: makeNameValuesDiff(p.attributes, q.attributes),
                })),
            (declaration) => declaration.name || undefined,
            sources,
        ),
    );

export type VisualforceMarkupJsonDiff = NodeDiff<
    'visualforceMarkup',
    VisualforceMarkupJson,
    {
        root: ValueDiff<string>;
        attributes: NameValuesDiff;
        /** B. 使っている部品 */
        components: TypedListDiff<string, never>;
        expressions?: PresentDiff<string[], TypedListDiff<string, never>>;
        componentAttributes?: DeclarationsDiff<'visualforceAttribute'>;
    }
>;

type MarkupFieldDiff = {
    markup?: PresentDiff<VisualforceMarkupJson | ErrorJson, VisualforceMarkupJsonDiff>;
};

export type ApexPageJsonDiff = RecordJsonDiff<typeof APEX_PAGE_META_SPEC> & {
    fields?: MarkupFieldDiff;
};
export type ApexComponentJsonDiff = RecordJsonDiff<typeof APEX_COMPONENT_META_SPEC> & {
    fields?: MarkupFieldDiff;
};

const makeMarkupDiff = (
    before: VisualforceMarkupJson | ErrorJson | undefined,
    after: VisualforceMarkupJson | ErrorJson | undefined,
    sources?: Sources,
) =>
    presentEntry(
        'markup',
        makePresentDiff(before, after, (b, a) =>
            makeNodeDiff('visualforceMarkup', b, a, 'slot', (x, y) => ({
                root: makeValueDiff(x.root, y.root),
                attributes: makeNameValuesDiff(x.attributes, y.attributes),
                components: makeUnorderedValuesDiff(x.components, y.components),
                ...presentEntry(
                    'expressions',
                    makePresentDiff(x.expressions, y.expressions, makeUnorderedValuesDiff),
                ),
                ...presentEntry(
                    'componentAttributes',
                    makeDeclarationsDiff(
                        'visualforceAttribute',
                        x.componentAttributes,
                        y.componentAttributes,
                        sources,
                    ),
                ),
            })),
        ),
    );

/** 表の差分に、種類ごとのプロパティの差分を足す (表の差分が fields を持つときだけ) */
const withFields = <D, E extends object>(diff: D, extra: () => E): D => {
    const node = diff as D & { fields?: object };
    return node.fields ? ({ ...node, fields: { ...node.fields, ...extra() } } as D) : diff;
};

const apexPageMetaDiff = makeRecordDiff(APEX_PAGE_META_SPEC);
const apexComponentMetaDiff = makeRecordDiff(APEX_COMPONENT_META_SPEC);

export const makeApexPageDiff = (
    before: ApexPageJson | ErrorJson,
    after: ApexPageJson | ErrorJson,
    match: Match = 'key',
    sources?: Sources,
): ApexPageJsonDiff =>
    withFields(apexPageMetaDiff(before, after, match, sources), () =>
        makeMarkupDiff((before as ApexPageJson).markup, (after as ApexPageJson).markup, sources),
    );

export const makeApexComponentDiff = (
    before: ApexComponentJson | ErrorJson,
    after: ApexComponentJson | ErrorJson,
    match: Match = 'key',
    sources?: Sources,
): ApexComponentJsonDiff =>
    withFields(apexComponentMetaDiff(before, after, match, sources), () =>
        makeMarkupDiff(
            (before as ApexComponentJson).markup,
            (after as ApexComponentJson).markup,
            sources,
        ),
    );

export type EmailTemplateJsonDiff = RecordJsonDiff<typeof EMAIL_TEMPLATE_META_SPEC> & {
    fields?: { body?: PresentDiff<string, ValueDiff<string>> };
};

const emailTemplateMetaDiff = makeRecordDiff(EMAIL_TEMPLATE_META_SPEC);

export const makeEmailTemplateDiff = (
    before: EmailTemplateJson | ErrorJson,
    after: EmailTemplateJson | ErrorJson,
    match: Match = 'key',
    sources?: Sources,
): EmailTemplateJsonDiff =>
    withFields(emailTemplateMetaDiff(before, after, match, sources), () =>
        presentEntry(
            'body',
            makePresentDiff(
                (before as EmailTemplateJson).body,
                (after as EmailTemplateJson).body,
                makeValueDiff,
            ),
        ),
    );

const auraMetaDiff = makeRecordDiff(AURA_DEFINITION_BUNDLE_SPEC);

export type AuraBundleJsonDiff = NodeDiff<
    'auraBundle',
    AuraBundleJson,
    {
        name: ValueDiff<string>;
        bundleType: ValueDiff<AuraBundleJson['bundleType']>;
        rootAttributes: NameValuesDiff;
        attributes?: DeclarationsDiff<'auraAttribute'>;
        registerEvents?: DeclarationsDiff<'auraRegisterEvent'>;
        handlers?: DeclarationsDiff<'auraHandler'>;
        methods?: DeclarationsDiff<'auraMethod'>;
        dependencies?: PresentDiff<string[], TypedListDiff<string, never>>;
        /** B. 使っている部品 */
        components: TypedListDiff<string, never>;
        expressions?: PresentDiff<string[], TypedListDiff<string, never>>;
        /** ファイルごとの関数の名前 (C. 書いた順) */
        javascript?: Partial<
            Record<
                'controller' | 'helper' | 'renderer',
                PresentDiff<string[], TypedListDiff<string, ValueDiff<string>>>
            >
        >;
        /** B. バンドルの中のファイル */
        files: TypedListDiff<string, never>;
        meta?: PresentDiff<
            AuraDefinitionBundleJson | ErrorJson,
            RecordJsonDiff<typeof AURA_DEFINITION_BUNDLE_SPEC>
        >;
    }
>;

const SCRIPTS = ['controller', 'helper', 'renderer'] as const;

export const makeAuraBundleDiff = (
    before: AuraBundleJson | ErrorJson,
    after: AuraBundleJson | ErrorJson,
    match: Match = 'key',
    sources?: Sources,
): AuraBundleJsonDiff =>
    makeNodeDiff('auraBundle', before, after, match, (b, a) => {
        const javascript = Object.fromEntries(
            SCRIPTS.flatMap((script) => {
                const diff = makePresentDiff(
                    b.javascript?.[script],
                    a.javascript?.[script],
                    makeOrderedValuesDiff,
                );
                return diff === undefined ? [] : [[script, diff]];
            }),
        );
        return {
            name: makeValueDiff(b.name, a.name),
            bundleType: makeValueDiff(b.bundleType, a.bundleType),
            rootAttributes: makeNameValuesDiff(b.rootAttributes, a.rootAttributes),
            ...presentEntry(
                'attributes',
                makeDeclarationsDiff('auraAttribute', b.attributes, a.attributes, sources),
            ),
            ...presentEntry(
                'registerEvents',
                makeDeclarationsDiff(
                    'auraRegisterEvent',
                    b.registerEvents,
                    a.registerEvents,
                    sources,
                ),
            ),
            ...presentEntry(
                'handlers',
                makeDeclarationsDiff('auraHandler', b.handlers, a.handlers, sources),
            ),
            ...presentEntry(
                'methods',
                makeDeclarationsDiff('auraMethod', b.methods, a.methods, sources),
            ),
            ...presentEntry(
                'dependencies',
                makePresentDiff(b.dependencies, a.dependencies, makeUnorderedValuesDiff),
            ),
            components: makeUnorderedValuesDiff(b.components, a.components),
            ...presentEntry(
                'expressions',
                makePresentDiff(b.expressions, a.expressions, makeUnorderedValuesDiff),
            ),
            ...(Object.keys(javascript).length ? { javascript } : {}),
            files: makeUnorderedValuesDiff(b.files, a.files),
            ...presentEntry(
                'meta',
                makePresentDiff(b.meta, a.meta, (bm, am) => auraMetaDiff(bm, am, 'slot', sources)),
            ),
        };
    });
