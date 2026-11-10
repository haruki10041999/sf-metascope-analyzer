import {
    APEX_META_SCHEMA,
    ApexClassMetaJson,
    ApexMetaJson,
    ApexTriggerMetaJson,
    PackageVersionJson,
} from '../../../types';

import {
    Match,
    NodeDiff,
    ValueDiff,
    getValueKey,
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
    presentEntry,
} from '../../commons/diff/present';

// クラス・トリガーのメタデータ (-meta.xml) の差分。方針は docs/metadata-implementation.md と同じ
// (両方にない値は出さず、片方にだけある値は added / removed)

type ApexMetaFields = {
    /** 管理パッケージのバージョン。D. キー対応 (キー: namespace) */
    packageVersions?: PresentDiff<
        PackageVersionJson[],
        TypedListDiff<PackageVersionJson, ValueDiff<PackageVersionJson>>
    >;
} & PropertiesDiff<typeof APEX_META_SCHEMA>;

export type ApexClassMetaJsonDiff = NodeDiff<'apexClassMeta', ApexClassMetaJson, ApexMetaFields>;

export type ApexTriggerMetaJsonDiff = NodeDiff<
    'apexTriggerMeta',
    ApexTriggerMetaJson,
    ApexMetaFields
>;

const makePackageVersionsDiff = (
    before: PackageVersionJson[],
    after: PackageVersionJson[],
): TypedListDiff<PackageVersionJson, ValueDiff<PackageVersionJson>> =>
    makeTypedListDiff(
        before,
        after,
        pairByKey(
            before.map((version) => version.namespace),
            after.map((version) => version.namespace),
            before.map(getValueKey),
            after.map(getValueKey),
        ),
        makeValueDiff,
    );

const makeApexMetaFields = (before: ApexMetaJson, after: ApexMetaJson): ApexMetaFields => ({
    ...makePropertiesDiff(APEX_META_SCHEMA, before, after),
    ...presentEntry(
        'packageVersions',
        makePresentDiff(before.packageVersions, after.packageVersions, makePackageVersionsDiff),
    ),
});

export const makeApexClassMetaDiff = (
    before: ApexClassMetaJson,
    after: ApexClassMetaJson,
    match: Match = 'slot',
): ApexClassMetaJsonDiff => makeNodeDiff('apexClassMeta', before, after, match, makeApexMetaFields);

export const makeApexTriggerMetaDiff = (
    before: ApexTriggerMetaJson,
    after: ApexTriggerMetaJson,
    match: Match = 'slot',
): ApexTriggerMetaJsonDiff =>
    makeNodeDiff('apexTriggerMeta', before, after, match, makeApexMetaFields);
