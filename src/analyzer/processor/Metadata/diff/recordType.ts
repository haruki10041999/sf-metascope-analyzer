import { RECORD_TYPE_SCHEMA, RecordTypeJson, RecordTypePicklistJson } from '../../../types';

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
    makePresentDiff,
    makePropertiesDiff,
    makeUnorderedValuesDiff,
    presentEntry,
} from '../../commons/diff/present';

type RecordTypePicklistValue = NonNullable<RecordTypePicklistJson['values']>[number];

/** レコードタイプで使える値は B. 集合 (並び順は項目の選択リスト値の順で決まる) */
export type RecordTypePicklistJsonDiff = NodeDiff<
    'recordTypePicklist',
    RecordTypePicklistJson,
    {
        picklist: ValueDiff<string>;
        values?: PresentDiff<
            RecordTypePicklistValue[],
            TypedListDiff<RecordTypePicklistValue, never>
        >;
    }
>;

export const makeRecordTypePicklistDiff = (
    before: RecordTypePicklistJson,
    after: RecordTypePicklistJson,
    match: Match = 'slot',
): RecordTypePicklistJsonDiff =>
    makeNodeDiff('recordTypePicklist', before, after, match, (b, a) => ({
        picklist: makeValueDiff(b.picklist, a.picklist),
        ...presentEntry('values', makePresentDiff(b.values, a.values, makeUnorderedValuesDiff)),
    }));

export type RecordTypeJsonDiff = NodeDiff<
    'recordType',
    RecordTypeJson,
    {
        fullName: ValueDiff<string>;
        /** 選択リストごとの値。D. キー対応 (キー: 項目の API 名) */
        picklistValues?: PresentDiff<
            RecordTypePicklistJson[],
            ListItemDiff<'recordTypePicklist', RecordTypePicklistJson, RecordTypePicklistJsonDiff>[]
        >;
    } & PropertiesDiff<typeof RECORD_TYPE_SCHEMA>
>;

export const makeRecordTypeDiff = (
    before: RecordTypeJson,
    after: RecordTypeJson,
    match: Match = 'slot',
    sources?: Sources,
): RecordTypeJsonDiff =>
    makeNodeDiff('recordType', before, after, match, (b, a) => ({
        fullName: makeValueDiff(b.fullName, a.fullName),
        ...makePropertiesDiff(RECORD_TYPE_SCHEMA, b, a),
        ...presentEntry(
            'picklistValues',
            makePresentDiff(b.picklistValues, a.picklistValues, (bp, ap) =>
                makeKeyedDiff(
                    'recordTypePicklist',
                    bp,
                    ap,
                    makeRecordTypePicklistDiff,
                    (picklist) => picklist.picklist,
                    sources,
                ),
            ),
        ),
    }));
