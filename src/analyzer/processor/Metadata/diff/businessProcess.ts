import {
    BUSINESS_PROCESS_SCHEMA,
    BusinessProcessJson,
    BusinessProcessValue,
    SHARING_REASON_SCHEMA,
    SharingReasonJson,
} from '../../../types';

import {
    Match,
    NodeDiff,
    ValueDiff,
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

/** ビジネスプロセスで使える値は B. 集合 (並び順は項目の選択リスト値の順で決まる。レコードタイプと同じ) */
export type BusinessProcessJsonDiff = NodeDiff<
    'businessProcess',
    BusinessProcessJson,
    {
        fullName: ValueDiff<string>;
        values?: PresentDiff<BusinessProcessValue[], TypedListDiff<BusinessProcessValue, never>>;
    } & PropertiesDiff<typeof BUSINESS_PROCESS_SCHEMA>
>;

export const makeBusinessProcessDiff = (
    before: BusinessProcessJson,
    after: BusinessProcessJson,
    match: Match = 'slot',
): BusinessProcessJsonDiff =>
    makeNodeDiff('businessProcess', before, after, match, (b, a) => ({
        fullName: makeValueDiff(b.fullName, a.fullName),
        ...makePropertiesDiff(BUSINESS_PROCESS_SCHEMA, b, a),
        ...presentEntry('values', makePresentDiff(b.values, a.values, makeUnorderedValuesDiff)),
    }));

export type SharingReasonJsonDiff = NodeDiff<
    'sharingReason',
    SharingReasonJson,
    { fullName: ValueDiff<string> } & PropertiesDiff<typeof SHARING_REASON_SCHEMA>
>;

export const makeSharingReasonDiff = (
    before: SharingReasonJson,
    after: SharingReasonJson,
    match: Match = 'slot',
): SharingReasonJsonDiff =>
    makeNodeDiff('sharingReason', before, after, match, (b, a) => ({
        fullName: makeValueDiff(b.fullName, a.fullName),
        ...makePropertiesDiff(SHARING_REASON_SCHEMA, b, a),
    }));
