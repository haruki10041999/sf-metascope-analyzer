import {
    ErrorJson,
    FLOW_SCHEMA,
    FlowEdge,
    FlowElementJson,
    FlowJson,
    FlowProperties,
    FlowReference,
    FlowResourceJson,
    FlowRuleJson,
    FlowScreenFieldJson,
    FlowStartJson,
    FlowValue,
} from '../../../types';

import {
    ListItemDiff,
    Match,
    NodeDiff,
    Sources,
    ValueDiff,
    makeKeyedDiff,
    makeNodeDiff,
    makeSequenceDiff,
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

// Flow の差分。方針: docs/metadata-implementation.md 10 章
// 要素・資源は name で D、接続 (edges) は B、決定の結果 (rules) は C (name で組にする)、
// 値の木 (properties) は値ごと (配列は書いた順の C)、references は B

/** 値の木の差分。プロパティごとに、配列なら C (書いた順)、それ以外は値として比べる */
export type FlowPropertiesDiff = Record<
    string,
    PresentDiff<FlowValue, ValueDiff<FlowValue> | TypedListDiff<FlowValue, ValueDiff<FlowValue>>>
>;

export const makeFlowPropertiesDiff = (
    before: FlowProperties = {},
    after: FlowProperties = {},
): FlowPropertiesDiff =>
    Object.fromEntries(
        [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap((key) => {
            const diff = makePresentDiff<
                FlowValue,
                ValueDiff<FlowValue> | TypedListDiff<FlowValue, ValueDiff<FlowValue>>
            >(before[key], after[key], (b, a) =>
                Array.isArray(b) && Array.isArray(a)
                    ? makeOrderedValuesDiff<FlowValue>(b, a)
                    : makeValueDiff<FlowValue>(b, a),
            );
            return diff === undefined ? [] : [[key, diff]];
        }),
    );

const propertiesEntry = (before?: FlowProperties, after?: FlowProperties) =>
    before || after ? { properties: makeFlowPropertiesDiff(before, after) } : {};

const optionalEntry = <K extends string>(key: K, before?: string, after?: string) =>
    presentEntry(key, makePresentDiff(before, after, makeValueDiff));

type ReferencesDiff = PresentDiff<FlowReference[], TypedListDiff<FlowReference, never>>;

const referencesEntry = (before?: FlowReference[], after?: FlowReference[]) =>
    presentEntry('references', makePresentDiff(before, after, makeUnorderedValuesDiff));

export type FlowRuleJsonDiff = NodeDiff<
    'flowRule',
    FlowRuleJson,
    {
        name: ValueDiff<string>;
        label?: PresentDiff<string, ValueDiff<string>>;
        properties?: FlowPropertiesDiff;
    }
>;

export const makeFlowRuleDiff = (
    before: FlowRuleJson,
    after: FlowRuleJson,
    match: Match = 'key',
): FlowRuleJsonDiff =>
    makeNodeDiff('flowRule', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...optionalEntry('label', b.label, a.label),
        ...propertiesEntry(b.properties, a.properties),
    }));

export type FlowScreenFieldJsonDiff = NodeDiff<
    'flowScreenField',
    FlowScreenFieldJson,
    {
        name: ValueDiff<string>;
        fieldType?: PresentDiff<string, ValueDiff<string>>;
        extensionName?: PresentDiff<string, ValueDiff<string>>;
        properties?: FlowPropertiesDiff;
        fields?: PresentDiff<
            FlowScreenFieldJson[],
            ListItemDiff<'flowScreenField', FlowScreenFieldJson, FlowScreenFieldJsonDiff>[]
        >;
    }
>;

export const makeFlowScreenFieldDiff = (
    before: FlowScreenFieldJson,
    after: FlowScreenFieldJson,
    match: Match = 'key',
    sources?: Sources,
): FlowScreenFieldJsonDiff =>
    makeNodeDiff('flowScreenField', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...optionalEntry('fieldType', b.fieldType, a.fieldType),
        ...optionalEntry('extensionName', b.extensionName, a.extensionName),
        ...propertiesEntry(b.properties, a.properties),
        ...presentEntry('fields', makeScreenFieldsDiff(b.fields, a.fields, sources)),
    }));

const makeScreenFieldsDiff = (
    before: FlowScreenFieldJson[] | undefined,
    after: FlowScreenFieldJson[] | undefined,
    sources?: Sources,
) =>
    makePresentDiff(before, after, (b, a) =>
        makeKeyedDiff(
            'flowScreenField',
            b,
            a,
            (x, y, match) => makeFlowScreenFieldDiff(x, y, match, sources),
            (field) => field.name,
            sources,
        ),
    );

export type FlowElementJsonDiff = NodeDiff<
    FlowElementJson['kind'],
    FlowElementJson,
    {
        name: ValueDiff<string>;
        label?: PresentDiff<string, ValueDiff<string>>;
        description?: PresentDiff<string, ValueDiff<string>>;
        properties?: FlowPropertiesDiff;
        rules?: PresentDiff<
            FlowRuleJson[],
            ListItemDiff<'flowRule', FlowRuleJson, FlowRuleJsonDiff>[]
        >;
        fields?: PresentDiff<
            FlowScreenFieldJson[],
            ListItemDiff<'flowScreenField', FlowScreenFieldJson, FlowScreenFieldJsonDiff>[]
        >;
        references?: ReferencesDiff;
    }
>;

/** 要素 1 つの差分。要素の種類 (kind) が変われば値を丸ごと before / after にする */
export const makeFlowElementDiff = (
    before: FlowElementJson,
    after: FlowElementJson,
    match: Match = 'key',
    sources?: Sources,
): FlowElementJsonDiff =>
    makeNodeDiff(before.kind, before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...optionalEntry('label', b.label, a.label),
        ...optionalEntry('description', b.description, a.description),
        ...propertiesEntry(b.properties, a.properties),
        ...presentEntry(
            'rules',
            makePresentDiff(b.rules, a.rules, (br, ar) =>
                makeSequenceDiff('flowRule', br, ar, makeFlowRuleDiff, {
                    sources,
                    canPair: (x, y) => x.name === y.name,
                }),
            ),
        ),
        ...presentEntry('fields', makeScreenFieldsDiff(b.fields, a.fields, sources)),
        ...referencesEntry(b.references, a.references),
    }));

export type FlowResourceJsonDiff = NodeDiff<
    FlowResourceJson['kind'],
    FlowResourceJson,
    {
        name: ValueDiff<string>;
        description?: PresentDiff<string, ValueDiff<string>>;
        properties?: FlowPropertiesDiff;
        references?: ReferencesDiff;
    }
>;

export const makeFlowResourceDiff = (
    before: FlowResourceJson,
    after: FlowResourceJson,
    match: Match = 'key',
): FlowResourceJsonDiff =>
    makeNodeDiff(before.kind, before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...optionalEntry('description', b.description, a.description),
        ...propertiesEntry(b.properties, a.properties),
        ...referencesEntry(b.references, a.references),
    }));

export type FlowStartJsonDiff = NodeDiff<
    'flowStart',
    FlowStartJson,
    {
        object?: PresentDiff<string, ValueDiff<string>>;
        triggerType?: PresentDiff<string, ValueDiff<string>>;
        recordTriggerType?: PresentDiff<string, ValueDiff<string>>;
        properties?: FlowPropertiesDiff;
        references?: ReferencesDiff;
    }
>;

export const makeFlowStartDiff = (before: FlowStartJson, after: FlowStartJson): FlowStartJsonDiff =>
    makeNodeDiff('flowStart', before, after, 'slot', (b, a) => ({
        ...optionalEntry('object', b.object, a.object),
        ...optionalEntry('triggerType', b.triggerType, a.triggerType),
        ...optionalEntry('recordTriggerType', b.recordTriggerType, a.recordTriggerType),
        ...propertiesEntry(b.properties, a.properties),
        ...referencesEntry(b.references, a.references),
    }));

export type FlowJsonDiff = NodeDiff<
    'flow',
    FlowJson,
    {
        name: ValueDiff<string>;
        start?: PresentDiff<FlowStartJson, FlowStartJsonDiff>;
        elements?: PresentDiff<
            FlowElementJson[],
            ListItemDiff<'flowElement', FlowElementJson, FlowElementJsonDiff>[]
        >;
        resources?: PresentDiff<
            FlowResourceJson[],
            ListItemDiff<'flowResource', FlowResourceJson, FlowResourceJsonDiff>[]
        >;
        edges?: PresentDiff<FlowEdge[], TypedListDiff<FlowEdge, never>>;
        processMetadataValues?: PresentDiff<
            FlowValue[],
            TypedListDiff<FlowValue, ValueDiff<FlowValue>>
        >;
        skippedElements?: PresentDiff<string[], TypedListDiff<string, never>>;
    } & PropertiesDiff<typeof FLOW_SCHEMA>
>;

export const makeFlowDiff = (
    before: FlowJson | ErrorJson,
    after: FlowJson | ErrorJson,
    match: Match = 'key',
    sources?: Sources,
): FlowJsonDiff =>
    makeNodeDiff('flow', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        ...makePropertiesDiff(FLOW_SCHEMA, b, a),
        ...presentEntry('start', makePresentDiff(b.start, a.start, makeFlowStartDiff)),
        ...presentEntry(
            'elements',
            makePresentDiff(b.elements, a.elements, (be, ae) =>
                makeKeyedDiff(
                    'flowElement',
                    be,
                    ae,
                    (x, y, m) => makeFlowElementDiff(x, y, m, sources),
                    (element) => element.name,
                    sources,
                ),
            ),
        ),
        ...presentEntry(
            'resources',
            makePresentDiff(b.resources, a.resources, (br, ar) =>
                makeKeyedDiff(
                    'flowResource',
                    br,
                    ar,
                    makeFlowResourceDiff,
                    (resource) => resource.name,
                    sources,
                ),
            ),
        ),
        ...presentEntry('edges', makePresentDiff(b.edges, a.edges, makeUnorderedValuesDiff)),
        ...presentEntry(
            'processMetadataValues',
            makePresentDiff(b.processMetadataValues, a.processMetadataValues, (bp, ap) =>
                makeOrderedValuesDiff<FlowValue>(bp, ap),
            ),
        ),
        ...presentEntry(
            'skippedElements',
            makePresentDiff(b.skippedElements, a.skippedElements, makeUnorderedValuesDiff),
        ),
    }));
