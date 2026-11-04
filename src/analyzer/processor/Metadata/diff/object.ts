import {
    CompactLayoutJson,
    CustomFieldJson,
    CustomObjectJson,
    ErrorJson,
    FieldSetJson,
    ListViewJson,
    NameFieldJson,
    OBJECT_SCHEMA,
    ObjectType,
    RecordTypeJson,
    ValidationRuleJson,
    WebLinkJson,
} from '../../../types';

import {
    JsonNode,
    ListItemDiff,
    Match,
    NodeDiff,
    Sources,
    ValueDiff,
    makeKeyedDiff,
    makeNodeDiff,
    makeValueDiff,
} from '../../commons/diff/commons';
import {
    PresentDiff,
    PropertiesDiff,
    makePresentDiff,
    makePropertiesDiff,
    presentEntry,
} from '../../commons/diff/present';
import { CompactLayoutJsonDiff, makeCompactLayoutDiff } from './compactLayout';
import { CustomFieldJsonDiff, makeCustomFieldDiff } from './field';
import { FieldSetJsonDiff, makeFieldSetDiff } from './fieldSet';
import { ListViewJsonDiff, makeListViewDiff } from './listView';
import { RecordTypeJsonDiff, makeRecordTypeDiff } from './recordType';
import { ValidationRuleJsonDiff, makeValidationRuleDiff } from './validationRule';
import { WebLinkJsonDiff, makeWebLinkDiff } from './webLink';

/** 子の配列の差分。フォルダにも object-meta.xml の中にもない側は added / removed (配列ごと) */
type MembersDiff<K extends string, T extends JsonNode, D> = PresentDiff<
    (T | ErrorJson)[],
    ListItemDiff<K, T | ErrorJson, D>[]
>;

/**
 * オブジェクトの子はどれも名前 (項目は API 名、それ以外は fullName) で同一性が決まるので D. キー対応。
 * 読めなかったファイル (ErrorJson) はキーを持たないので B. 集合。並び順の変化は報告しない。
 * 両方にない値・子の配列は、プロパティごと持たない
 */
export type CustomObjectJsonDiff = NodeDiff<
    'object',
    CustomObjectJson,
    {
        apiName: ValueDiff<string>;
        objectType: ValueDiff<ObjectType>;
        nameField?: PresentDiff<NameFieldJson, ValueDiff<NameFieldJson>>;
        fields?: MembersDiff<'field', CustomFieldJson, CustomFieldJsonDiff>;
        validationRules?: MembersDiff<'validationRule', ValidationRuleJson, ValidationRuleJsonDiff>;
        recordTypes?: MembersDiff<'recordType', RecordTypeJson, RecordTypeJsonDiff>;
        listViews?: MembersDiff<'listView', ListViewJson, ListViewJsonDiff>;
        fieldSets?: MembersDiff<'fieldSet', FieldSetJson, FieldSetJsonDiff>;
        compactLayouts?: MembersDiff<'compactLayout', CompactLayoutJson, CompactLayoutJsonDiff>;
        webLinks?: MembersDiff<'webLink', WebLinkJson, WebLinkJsonDiff>;
    } & PropertiesDiff<typeof OBJECT_SCHEMA>
>;

/** 子の識別キー。ErrorJson はキーを持たない */
const byName = (member: { fullName: string } | ErrorJson): string | undefined =>
    'fullName' in member ? member.fullName : undefined;

/** 子の配列を名前で対応付ける (片方にしかなければ配列ごと added / removed) */
const makeMembersDiff = <K extends string, T extends JsonNode, D>(
    kind: K,
    before: (T | ErrorJson)[] | undefined,
    after: (T | ErrorJson)[] | undefined,
    makeDiff: (before: T | ErrorJson, after: T | ErrorJson, match: Match) => D,
    getId: (member: T | ErrorJson) => string | undefined,
    sources: Sources | undefined,
) => makePresentDiff(before, after, (b, a) => makeKeyedDiff(kind, b, a, makeDiff, getId, sources));

export const makeCustomObjectDiff = (
    before: CustomObjectJson | ErrorJson,
    after: CustomObjectJson | ErrorJson,
    match: Match = 'slot',
    sources?: Sources,
): CustomObjectJsonDiff =>
    makeNodeDiff('object', before, after, match, (b, a) => ({
        apiName: makeValueDiff(b.apiName, a.apiName),
        objectType: makeValueDiff(b.objectType, a.objectType),
        ...makePropertiesDiff(OBJECT_SCHEMA, b, a),
        ...presentEntry('nameField', makePresentDiff(b.nameField, a.nameField, makeValueDiff)),
        ...presentEntry(
            'fields',
            makeMembersDiff(
                'field',
                b.fields,
                a.fields,
                (bf, af, m) => makeCustomFieldDiff(bf, af, m, sources),
                (field) => (field.kind === 'error' ? undefined : field.apiName),
                sources,
            ),
        ),
        ...presentEntry(
            'validationRules',
            makeMembersDiff(
                'validationRule',
                b.validationRules,
                a.validationRules,
                makeValidationRuleDiff,
                byName,
                sources,
            ),
        ),
        ...presentEntry(
            'recordTypes',
            makeMembersDiff(
                'recordType',
                b.recordTypes,
                a.recordTypes,
                (br, ar, m) => makeRecordTypeDiff(br, ar, m, sources),
                byName,
                sources,
            ),
        ),
        ...presentEntry(
            'listViews',
            makeMembersDiff(
                'listView',
                b.listViews,
                a.listViews,
                makeListViewDiff,
                byName,
                sources,
            ),
        ),
        ...presentEntry(
            'fieldSets',
            makeMembersDiff(
                'fieldSet',
                b.fieldSets,
                a.fieldSets,
                makeFieldSetDiff,
                byName,
                sources,
            ),
        ),
        ...presentEntry(
            'compactLayouts',
            makeMembersDiff(
                'compactLayout',
                b.compactLayouts,
                a.compactLayouts,
                makeCompactLayoutDiff,
                byName,
                sources,
            ),
        ),
        ...presentEntry(
            'webLinks',
            makeMembersDiff('webLink', b.webLinks, a.webLinks, makeWebLinkDiff, byName, sources),
        ),
    }));
