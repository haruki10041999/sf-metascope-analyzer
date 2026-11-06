import {
    CustomFieldJson,
    ErrorJson,
    FIELD_SCHEMA,
    PICKLIST_VALUE_SCHEMA,
    PicklistValueJson,
    ValueSetJson,
    LookupFilterJson,
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
import {
    PresentDiff,
    PropertiesDiff,
    makePresentDiff,
    makePropertiesDiff,
    presentEntry,
} from '../../commons/diff/present';

export type PicklistValueJsonDiff = NodeDiff<
    'picklistValue',
    PicklistValueJson,
    { fullName: ValueDiff<string> } & PropertiesDiff<typeof PICKLIST_VALUE_SCHEMA>
>;

export const makePicklistValueDiff = (
    before: PicklistValueJson | ErrorJson,
    after: PicklistValueJson | ErrorJson,
    match: Match = 'slot',
): PicklistValueJsonDiff =>
    makeNodeDiff('picklistValue', before, after, match, (b, a) => ({
        fullName: makeValueDiff(b.fullName, a.fullName),
        ...makePropertiesDiff(PICKLIST_VALUE_SCHEMA, b, a),
    }));

/** 選択リスト値は D. キー対応 (キー: fullName)。並び順の変化は報告しない */
export type PicklistValuesDiff = ListItemDiff<
    'picklistValue',
    PicklistValueJson | ErrorJson,
    PicklistValueJsonDiff
>;

/** どれもファイルにないことがあるので、両方にないプロパティは持たない */
export type ValueSetJsonDiff = {
    restricted?: PresentDiff<boolean, ValueDiff<boolean>>;
    sorted?: PresentDiff<boolean, ValueDiff<boolean>>;
    valueSetName?: PresentDiff<string, ValueDiff<string>>;
    controllingField?: PresentDiff<string, ValueDiff<string>>;
    values?: PresentDiff<(PicklistValueJson | ErrorJson)[], PicklistValuesDiff[]>;
};

export const makeValueSetDiff = (
    before: ValueSetJson,
    after: ValueSetJson,
    sources?: Sources,
): ValueSetJsonDiff => ({
    ...presentEntry(
        'restricted',
        makePresentDiff(before.restricted, after.restricted, makeValueDiff),
    ),
    ...presentEntry('sorted', makePresentDiff(before.sorted, after.sorted, makeValueDiff)),
    ...presentEntry(
        'valueSetName',
        makePresentDiff(before.valueSetName, after.valueSetName, makeValueDiff),
    ),
    ...presentEntry(
        'controllingField',
        makePresentDiff(before.controllingField, after.controllingField, makeValueDiff),
    ),
    ...presentEntry(
        'values',
        makePresentDiff(before.values, after.values, (bv, av) =>
            makeKeyedDiff(
                'picklistValue',
                bv,
                av,
                makePicklistValueDiff,
                (value) => (value.kind === 'error' ? undefined : value.fullName),
                sources,
            ),
        ),
    ),
});

export type CustomFieldJsonDiff = NodeDiff<
    'field',
    CustomFieldJson,
    {
        apiName: ValueDiff<string>;
        valueSet?: PresentDiff<ValueSetJson, ValueSetJsonDiff>;
        /** 絞り込み条件は値として比べる (条件の行は番号で組み合わせるので、まとめて 1 つの値) */
        lookupFilter?: PresentDiff<LookupFilterJson, ValueDiff<LookupFilterJson>>;
    } & PropertiesDiff<typeof FIELD_SCHEMA>
>;

export const makeCustomFieldDiff = (
    before: CustomFieldJson | ErrorJson,
    after: CustomFieldJson | ErrorJson,
    match: Match = 'slot',
    sources?: Sources,
): CustomFieldJsonDiff =>
    makeNodeDiff('field', before, after, match, (b, a) => ({
        apiName: makeValueDiff(b.apiName, a.apiName),
        ...makePropertiesDiff(FIELD_SCHEMA, b, a),
        ...presentEntry(
            'lookupFilter',
            makePresentDiff(b.lookupFilter, a.lookupFilter, makeValueDiff),
        ),
        ...presentEntry(
            'valueSet',
            makePresentDiff(b.valueSet, a.valueSet, (bv, av) => makeValueSetDiff(bv, av, sources)),
        ),
    }));
