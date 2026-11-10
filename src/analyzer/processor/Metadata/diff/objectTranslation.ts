import {
    CaseValueJson,
    CustomFieldTranslationJson,
    CustomObjectTranslationJson,
    FIELD_TRANSLATION_SCHEMA,
    LayoutSectionTranslationJson,
    LookupFilterTranslationJson,
    OBJECT_TRANSLATION_SCHEMA,
    PicklistValueTranslationJson,
    PropertySchema,
    TRANSLATION_MEMBERS,
    TranslationMemberJson,
    TranslationMemberKey,
    getTranslationMemberName,
} from '../../../types';

import {
    JsonNode,
    ListItemDiff,
    Match,
    NodeDiff,
    Sources,
    ValueDiff,
    getValueKey,
    makeKeyedDiff,
    makeNodeDiff,
    makeValueDiff,
    pairByKey,
} from '../../commons/diff/commons';
import { TypedListDiff, makeTypedListDiff } from '../../commons/diff/list';
import {
    PresentDiff,
    PropertiesDiff,
    makePresentDiff,
    makePropertiesDiff,
    makeUnorderedValuesDiff,
    presentEntry,
} from '../../commons/diff/present';

// 方針: docs/object-translation.md 3 章 (分類・status・出力の形はオブジェクトと同じ)

// ---------------------------------------------------------------------------
// 項目の翻訳
// ---------------------------------------------------------------------------

export type PicklistValueTranslationJsonDiff = NodeDiff<
    'picklistValueTranslation',
    PicklistValueTranslationJson,
    {
        masterLabel: ValueDiff<string>;
        translation?: PresentDiff<string, ValueDiff<string>>;
    }
>;

export const makePicklistValueTranslationDiff = (
    before: PicklistValueTranslationJson,
    after: PicklistValueTranslationJson,
    match: Match = 'slot',
): PicklistValueTranslationJsonDiff =>
    makeNodeDiff('picklistValueTranslation', before, after, match, (b, a) => ({
        masterLabel: makeValueDiff(b.masterLabel, a.masterLabel),
        ...presentEntry(
            'translation',
            makePresentDiff(b.translation, a.translation, makeValueDiff),
        ),
    }));

export type CustomFieldTranslationJsonDiff = NodeDiff<
    'fieldTranslation',
    CustomFieldTranslationJson,
    {
        name: ValueDiff<string>;
        /** 選択リスト値は D. キー対応 (キー: masterLabel) */
        picklistValues?: PresentDiff<
            PicklistValueTranslationJson[],
            ListItemDiff<
                'picklistValueTranslation',
                PicklistValueTranslationJson,
                PicklistValueTranslationJsonDiff
            >[]
        >;
        lookupFilter?: PresentDiff<
            LookupFilterTranslationJson,
            ValueDiff<LookupFilterTranslationJson>
        >;
    } & PropertiesDiff<typeof FIELD_TRANSLATION_SCHEMA>
>;

export const makeCustomFieldTranslationDiff = (
    before: CustomFieldTranslationJson,
    after: CustomFieldTranslationJson,
    match: Match = 'slot',
    sources?: Sources,
): CustomFieldTranslationJsonDiff =>
    makeNodeDiff('fieldTranslation', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...makePropertiesDiff(FIELD_TRANSLATION_SCHEMA, b, a),
        ...presentEntry(
            'picklistValues',
            makePresentDiff(b.picklistValues, a.picklistValues, (bp, ap) =>
                makeKeyedDiff(
                    'picklistValueTranslation',
                    bp,
                    ap,
                    makePicklistValueTranslationDiff,
                    (value) => value.masterLabel,
                    sources,
                ),
            ),
        ),
        ...presentEntry(
            'lookupFilter',
            makePresentDiff(b.lookupFilter, a.lookupFilter, makeValueDiff),
        ),
    }));

// ---------------------------------------------------------------------------
// 名前で識別する翻訳 (recordTypes / validationRules / webLinks / layouts など)
// ---------------------------------------------------------------------------

export type TranslationMemberJsonDiff = NodeDiff<
    TranslationMemberJson['kind'],
    TranslationMemberJson,
    {
        name: ValueDiff<string>;
        /** layouts のセクション名の翻訳。D. キー対応 (キー: section) */
        sections?: PresentDiff<
            LayoutSectionTranslationJson[],
            TypedListDiff<LayoutSectionTranslationJson, ValueDiff<LayoutSectionTranslationJson>>
        >;
    } & Record<string, unknown>
>;

const makeSectionsDiff = (
    before: LayoutSectionTranslationJson[],
    after: LayoutSectionTranslationJson[],
): TypedListDiff<LayoutSectionTranslationJson, ValueDiff<LayoutSectionTranslationJson>> =>
    makeTypedListDiff(
        before,
        after,
        pairByKey(
            before.map((s) => s.section),
            after.map((s) => s.section),
            before.map(getValueKey),
            after.map(getValueKey),
        ),
        makeValueDiff,
    );

export const makeTranslationMemberDiff =
    (key: TranslationMemberKey) =>
    (
        before: TranslationMemberJson,
        after: TranslationMemberJson,
        match: Match = 'slot',
    ): TranslationMemberJsonDiff =>
        makeNodeDiff(TRANSLATION_MEMBERS[key].kind, before, after, match, (b, a) => {
            const schema = TRANSLATION_MEMBERS[key].schema as PropertySchema;
            const sections = (m: TranslationMemberJson) =>
                'sections' in m ? (m.sections as LayoutSectionTranslationJson[]) : undefined;
            return {
                name: makeValueDiff(getTranslationMemberName(b), getTranslationMemberName(a)),
                ...makePropertiesDiff(
                    schema,
                    b as unknown as Record<string, never>,
                    a as unknown as Record<string, never>,
                ),
                ...presentEntry(
                    'sections',
                    makePresentDiff(sections(b), sections(a), makeSectionsDiff),
                ),
            };
        }) as TranslationMemberJsonDiff;

// ---------------------------------------------------------------------------
// オブジェクトの翻訳
// ---------------------------------------------------------------------------

type MembersDiff<K extends string, T extends JsonNode, D> = PresentDiff<
    T[],
    ListItemDiff<K, T, D>[]
>;

/**
 * オブジェクトの翻訳。子はどれも名前 (項目は name、選択リスト値は masterLabel、レイアウトは layout) で
 * 同一性が決まるので D. キー対応。名詞の格 (caseValues) は名前を持たないので B. 集合。
 * 両方にない値・子の配列は、プロパティごと持たない
 */
export type CustomObjectTranslationJsonDiff = NodeDiff<
    'objectTranslation',
    CustomObjectTranslationJson,
    {
        objectApiName: ValueDiff<string>;
        locale: ValueDiff<string>;
        fields?: PresentDiff<
            CustomFieldTranslationJson[],
            ListItemDiff<
                'fieldTranslation',
                CustomFieldTranslationJson,
                CustomFieldTranslationJsonDiff
            >[]
        >;
        caseValues?: PresentDiff<CaseValueJson[], TypedListDiff<CaseValueJson, never>>;
    } & {
        [K in TranslationMemberKey]?: MembersDiff<
            TranslationMemberJson<K>['kind'],
            TranslationMemberJson<K>,
            TranslationMemberJsonDiff
        >;
    } & PropertiesDiff<typeof OBJECT_TRANSLATION_SCHEMA>
>;

export const makeCustomObjectTranslationDiff = (
    before: CustomObjectTranslationJson,
    after: CustomObjectTranslationJson,
    match: Match = 'slot',
    sources?: Sources,
): CustomObjectTranslationJsonDiff =>
    makeNodeDiff('objectTranslation', before, after, match, (b, a) => ({
        objectApiName: makeValueDiff(b.objectApiName, a.objectApiName),
        locale: makeValueDiff(b.locale, a.locale),
        ...makePropertiesDiff(OBJECT_TRANSLATION_SCHEMA, b, a),
        ...presentEntry(
            'fields',
            makePresentDiff(b.fields, a.fields, (bf, af) =>
                makeKeyedDiff(
                    'fieldTranslation',
                    bf,
                    af,
                    (x, y, m) => makeCustomFieldTranslationDiff(x, y, m, sources),
                    (field) => field.name,
                    sources,
                ),
            ),
        ),
        ...presentEntry(
            'caseValues',
            makePresentDiff(b.caseValues, a.caseValues, makeUnorderedValuesDiff),
        ),
        ...Object.fromEntries(
            (Object.keys(TRANSLATION_MEMBERS) as TranslationMemberKey[]).flatMap((key) => {
                const diff = makePresentDiff(
                    b[key] as TranslationMemberJson[] | undefined,
                    a[key] as TranslationMemberJson[] | undefined,
                    (bm, am) =>
                        makeKeyedDiff(
                            TRANSLATION_MEMBERS[key].kind,
                            bm,
                            am,
                            makeTranslationMemberDiff(key),
                            (member) => getTranslationMemberName(member),
                            sources,
                        ),
                );
                return diff === undefined ? [] : [[key, diff]];
            }),
        ),
    })) as CustomObjectTranslationJsonDiff;
