import {
    LWC_BUNDLE_META_SCHEMA,
    LWC_TARGET_PROPERTY_SCHEMA,
    type LwcBundleMetaJson,
    type LwcTargetConfigJson,
    type LwcTargetPropertyJson,
} from '../../../types';

import {
    ListItemDiff,
    Match,
    NodeDiff,
    Sources,
    makeKeyedDiff,
    makeNodeDiff,
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

// LWC のバンドルの設定 (js-meta.xml) の差分。メタデータ (docs/metadata-implementation.md) と同じ書き方:
// 値はスキーマごとの差分、値の並び (targets など) は B. 集合、子 (targetConfig・property) は D. キー対応

type ValuesDiff = PresentDiff<string[], TypedListDiff<string, never>>;

export type LwcTargetPropertyJsonDiff = NodeDiff<
    'lwcTargetProperty',
    LwcTargetPropertyJson,
    PropertiesDiff<typeof LWC_TARGET_PROPERTY_SCHEMA>
>;

const makeTargetPropertyDiff = (
    before: LwcTargetPropertyJson,
    after: LwcTargetPropertyJson,
    match: Match,
): LwcTargetPropertyJsonDiff =>
    makeNodeDiff('lwcTargetProperty', before, after, match, (b, a) =>
        makePropertiesDiff(LWC_TARGET_PROPERTY_SCHEMA, b, a),
    );

export type LwcTargetConfigJsonDiff = NodeDiff<
    'lwcTargetConfig',
    LwcTargetConfigJson,
    {
        targets: TypedListDiff<string, never>;
        /** D. キー対応 (プロパティ名) */
        properties?: PresentDiff<
            LwcTargetPropertyJson[],
            ListItemDiff<'lwcTargetProperty', LwcTargetPropertyJson, LwcTargetPropertyJsonDiff>[]
        >;
        objects?: ValuesDiff;
        supportedFormFactors?: ValuesDiff;
    }
>;

const makeTargetConfigDiff = (
    before: LwcTargetConfigJson,
    after: LwcTargetConfigJson,
    match: Match,
    sources?: Sources,
): LwcTargetConfigJsonDiff =>
    makeNodeDiff('lwcTargetConfig', before, after, match, (b, a) => ({
        targets: makeUnorderedValuesDiff(b.targets, a.targets),
        ...presentEntry(
            'properties',
            makePresentDiff(b.properties, a.properties, (x, y) =>
                makeKeyedDiff(
                    'lwcTargetProperty',
                    x,
                    y,
                    makeTargetPropertyDiff,
                    (p) => p.name,
                    sources,
                ),
            ),
        ),
        ...presentEntry('objects', makePresentDiff(b.objects, a.objects, makeUnorderedValuesDiff)),
        ...presentEntry(
            'supportedFormFactors',
            makePresentDiff(
                b.supportedFormFactors,
                a.supportedFormFactors,
                makeUnorderedValuesDiff,
            ),
        ),
    }));

export type LwcBundleMetaJsonDiff = NodeDiff<
    'lwcBundleMeta',
    LwcBundleMetaJson,
    PropertiesDiff<typeof LWC_BUNDLE_META_SCHEMA> & {
        targets?: ValuesDiff;
        /** D. キー対応 (targets 属性。並べ替えた値をつないだもの) */
        targetConfigs?: PresentDiff<
            LwcTargetConfigJson[],
            ListItemDiff<'lwcTargetConfig', LwcTargetConfigJson, LwcTargetConfigJsonDiff>[]
        >;
        capabilities?: ValuesDiff;
    }
>;

const targetConfigKey = (config: LwcTargetConfigJson) => [...config.targets].sort().join(',');

export const makeLwcBundleMetaDiff = (
    before: LwcBundleMetaJson,
    after: LwcBundleMetaJson,
    sources?: Sources,
): LwcBundleMetaJsonDiff =>
    makeNodeDiff('lwcBundleMeta', before, after, 'slot', (b, a) => ({
        ...makePropertiesDiff(LWC_BUNDLE_META_SCHEMA, b, a),
        ...presentEntry('targets', makePresentDiff(b.targets, a.targets, makeUnorderedValuesDiff)),
        ...presentEntry(
            'targetConfigs',
            makePresentDiff(b.targetConfigs, a.targetConfigs, (x, y) =>
                makeKeyedDiff(
                    'lwcTargetConfig',
                    x,
                    y,
                    (bc, ac, m) => makeTargetConfigDiff(bc, ac, m, sources),
                    targetConfigKey,
                    sources,
                ),
            ),
        ),
        ...presentEntry(
            'capabilities',
            makePresentDiff(b.capabilities, a.capabilities, makeUnorderedValuesDiff),
        ),
    }));
