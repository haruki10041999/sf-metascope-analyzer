import type { ErrorJson, JsonType } from '../commons/json';
import { childOf, childrenOf, type XmlElement } from '../commons/xml';
import { type ValueTreeOptions, toValueTree, toValueTreeProperties } from '../commons/valueTree';
import {
    makeMetadataJson,
    nonEmptyEntry,
    readProperties,
    readText,
    readXmlRoot,
    unknownChildNames,
    type ParsedXmlFile,
    type PropertiesOf,
    type XmlFile,
    type XmlReadProblem,
    type XmlSourceRegistry,
} from '../commons/xmlJson';

// Flow (flows/<名前>.flow-meta.xml) の JSON。方針: docs/metadata-implementation.md 10 章
// - 要素 (actionCalls など)・資源 (variables など) は name をキーに持つ JSON ノード。中身は要素の種類ごとに形が違い多いので、
//   XML の要素名をプロパティ名にした値の木 (properties) にする
// - 接続 (connector / defaultConnector / faultConnector など) は要素の外 (ルートの edges) に出す
//   (つなぎ替えただけで要素の objectKey が変わらないように)
// - Flow Builder の画面上の位置 (locationX / locationY) と画面の設定 (CanvasMode など) は読まない
// - 使っている項目・変数・Apex・サブフロー・LWC・ラベルを references に取り出す (種類をまたぐ突き合わせは解析で行う)

export const FLOW_SCHEMA = {
    label: 'string',
    apiVersion: 'string',
    processType: 'string',
    status: 'string',
    description: 'string',
    runInMode: 'string',
    interviewLabel: 'string',
    triggerOrder: 'number',
    environments: 'string',
    isTemplate: 'boolean',
    timeZoneSidKey: 'string',
    sourceTemplate: 'string',
    isAdditionalPermissionRequiredToRun: 'boolean',
    migratedFromWorkflowRuleName: 'string',
} as const;

/** 要素 (XML の要素名 → kind) */
export const FLOW_ELEMENT_KINDS = {
    actionCalls: 'flowActionCall',
    apexPluginCalls: 'flowApexPluginCall',
    assignments: 'flowAssignment',
    collectionProcessors: 'flowCollectionProcessor',
    customErrors: 'flowCustomError',
    decisions: 'flowDecision',
    loops: 'flowLoop',
    orchestratedStages: 'flowOrchestratedStage',
    recordCreates: 'flowRecordCreate',
    recordDeletes: 'flowRecordDelete',
    recordLookups: 'flowRecordLookup',
    recordRollbacks: 'flowRecordRollback',
    recordUpdates: 'flowRecordUpdate',
    screens: 'flowScreen',
    steps: 'flowStep',
    subflows: 'flowSubflow',
    transforms: 'flowTransform',
    waits: 'flowWait',
} as const;

/** 資源 (XML の要素名 → kind) */
export const FLOW_RESOURCE_KINDS = {
    variables: 'flowVariable',
    constants: 'flowConstant',
    formulas: 'flowFormula',
    textTemplates: 'flowTextTemplate',
    choices: 'flowChoice',
    dynamicChoiceSets: 'flowDynamicChoiceSet',
    stages: 'flowStage',
} as const;

export type FlowElementKind = (typeof FLOW_ELEMENT_KINDS)[keyof typeof FLOW_ELEMENT_KINDS];
export type FlowResourceKind = (typeof FLOW_RESOURCE_KINDS)[keyof typeof FLOW_RESOURCE_KINDS];

/** 値の要素 (<value><stringValue>…</stringValue></value> の stringValue など) */
const VALUE_TYPES = new Set([
    'apexValue',
    'booleanValue',
    'dateTimeValue',
    'dateValue',
    'elementReference',
    'formulaDataType',
    'formulaExpression',
    'numberValue',
    'setupReference',
    'sobjectValue',
    'stringValue',
    'transformValueReference',
]);

/** 1 つしかなくても配列にする要素 (繰り返せる要素) */
const LIST_NAMES = new Set([
    'assignmentItems',
    'choiceReferences',
    'conditions',
    'dataTypeMappings',
    'fields',
    'filters',
    'inputAssignments',
    'inputParameters',
    'outputAssignments',
    'outputParameters',
    'processMetadataValues',
    'queriedFields',
    'rules',
    'scheduledPaths',
    'sortOptions',
    'stageSteps',
    'storeOutputAutomatically',
    'waitEvents',
    'visibilityRule',
    'collectionProcessorFilters',
    'transformValues',
    'transformValueActions',
    'mapItems',
]);

/** 画面上の位置 (読まない) */
const POSITION_NAMES = new Set(['locationX', 'locationY']);

/** ルートの processMetadataValues のうち、Flow Builder の画面の設定 (読まない) */
const BUILDER_SETTINGS = new Set(['BuilderType', 'CanvasMode', 'OriginBuilderType']);

const isConnector = (name: string) => name === 'connector' || name.endsWith('Connector');

/** 値の木。{ type, value } は値の要素 (stringValue など) 1 つの値 */
export type FlowValue =
    | string
    | boolean
    | { type: string; value: string }
    | FlowValue[]
    | { [name: string]: FlowValue };

export type FlowProperties = Record<string, FlowValue>;

/** 使っているもの */
export type FlowReferenceType =
    | 'object'
    | 'field'
    | 'element'
    | 'global'
    | 'apexClass'
    | 'flow'
    | 'lwc'
    | 'component'
    | 'label';

export type FlowReference = {
    refType: FlowReferenceType;
    /** object: Invoice__c / field: Invoice__c.Amount__c / element: 要素・資源の名前 / global: $User.Id など */
    value: string;
};

/** 接続 (要素の外に出したもの)。edgeType は接続の要素名 (rules の中のものは rules[<名前>].connector) */
export type FlowEdge = {
    from: string;
    to: string;
    edgeType: string;
    isGoTo?: boolean;
};

/** 決定の結果 (decisions の rules)。上から順に評価される */
export type FlowRuleJson = JsonType<'flowRule'> & {
    name: string;
    label?: string;
    properties?: FlowProperties;
};

/** 画面の項目 (screens の fields)。セクション・列は fields を入れ子に持つ */
export type FlowScreenFieldJson = JsonType<'flowScreenField'> & {
    name: string;
    fieldType?: string;
    /** 部品の名前 (c:accountList など)。fieldType が ComponentInstance のとき */
    extensionName?: string;
    properties?: FlowProperties;
    fields?: FlowScreenFieldJson[];
};

/** 要素 1 つ */
export type FlowElementJson = JsonType<FlowElementKind> & {
    name: string;
    label?: string;
    description?: string;
    properties?: FlowProperties;
    /** decisions の結果 */
    rules?: FlowRuleJson[];
    /** screens の項目 */
    fields?: FlowScreenFieldJson[];
    references?: FlowReference[];
};

/** 資源 1 つ */
export type FlowResourceJson = JsonType<FlowResourceKind> & {
    name: string;
    description?: string;
    properties?: FlowProperties;
    references?: FlowReference[];
};

/** 起動 (start)。レコードトリガーの対象と条件、スケジュール */
export type FlowStartJson = JsonType<'flowStart'> & {
    object?: string;
    triggerType?: string;
    recordTriggerType?: string;
    properties?: FlowProperties;
    references?: FlowReference[];
};

export type FlowJson = JsonType<'flow'> & {
    name: string;
    start?: FlowStartJson;
    elements?: FlowElementJson[];
    resources?: FlowResourceJson[];
    /** 接続 (B. 集合)。起動からの接続の from は $start */
    edges?: FlowEdge[];
    /** ルートの processMetadataValues (Flow Builder の画面の設定は除く) */
    processMetadataValues?: FlowValue[];
    skippedElements?: string[];
} & PropertiesOf<typeof FLOW_SCHEMA>;

export const FLOW_START = '$start';

// ---------------------------------------------------------------------------
// 値の木
// ---------------------------------------------------------------------------

/** Flow の値の木の決まり: 接続 (要素の外の edges に出す) と画面上の位置は読まない */
const FLOW_VALUE_TREE: ValueTreeOptions = {
    lists: LIST_NAMES,
    skip: (name) => isConnector(name) || POSITION_NAMES.has(name),
    valueTypes: VALUE_TYPES,
};

/** 子要素を値の木にする (共通の値の木。types/commons/valueTree.ts)。skip にある子要素・接続・位置は持たない */
const toProperties = (element: XmlElement, skip: ReadonlySet<string> = new Set()): FlowProperties =>
    toValueTreeProperties(element, FLOW_VALUE_TREE, skip) as FlowProperties;

const toValue = (element: XmlElement): FlowValue =>
    toValueTree(element, FLOW_VALUE_TREE) as FlowValue;

const propertiesEntry = (properties: FlowProperties) =>
    Object.keys(properties).length ? { properties } : {};

// ---------------------------------------------------------------------------
// 接続
// ---------------------------------------------------------------------------

/** 要素の中の接続を取り出す。rules など名前を持つ子の中のものは edgeType に <子の要素名>[<名前>]. を付ける */
const collectEdges = (from: string, element: XmlElement, prefix = ''): FlowEdge[] =>
    element.children.flatMap((child): FlowEdge[] => {
        if (isConnector(child.name)) {
            const to = readText(child, 'targetReference');
            if (!to) return [];
            const isGoTo = readText(child, 'isGoTo') === 'true';
            return [
                { from, to, edgeType: `${prefix}${child.name}`, ...(isGoTo ? { isGoTo } : {}) },
            ];
        }
        const name = readText(child, 'name');
        return child.children.length && name !== undefined
            ? collectEdges(from, child, `${prefix}${child.name}[${name}].`)
            : [];
    });

// ---------------------------------------------------------------------------
// 参照
// ---------------------------------------------------------------------------

const MERGE_FIELD = /\{!([^}]+)\}/g;
const LABEL_IN_TEXT = /\$Label\.(\w+)/g;

/** 参照として読む要素 (値が要素・資源の名前、または $Record.<項目> など) */
const REFERENCE_NAMES = new Set([
    'elementReference',
    'leftValueReference',
    'assignToReference',
    'assignNextValueToReference',
    'collectionReference',
    'inputReference',
    'outputReference',
    'choiceReferences',
    'dataTypeMappings',
]);

/** 参照を集める。startObject はレコードトリガーの対象 ($Record の項目をそのオブジェクトの項目にする) */
const makeReferenceCollector = (startObject: string | undefined) => {
    const refs: FlowReference[] = [];
    const seen = new Set<string>();
    const add = (refType: FlowReferenceType, value: string) => {
        const key = `${refType}:${value}`;
        if (!value || seen.has(key)) return;
        seen.add(key);
        refs.push({ refType, value });
    };
    /** {!...} の中や elementReference の値 */
    const addPath = (path: string) => {
        const trimmed = path.trim();
        const label = trimmed.match(/^\$Label\.(\w+)/);
        if (label) return add('label', label[1]!);
        const record = trimmed.match(/^\$Record(?:__Prior)?\.(\w+)/);
        if (record) {
            return startObject
                ? add('field', `${startObject}.${record[1]}`)
                : add('global', trimmed);
        }
        if (trimmed.startsWith('$')) return add('global', trimmed.split('.').slice(0, 2).join('.'));
        add('element', trimmed.split('.')[0]!);
    };
    /** 要素の中のすべての文字列・参照の要素 */
    const scan = (element: XmlElement) => {
        for (const child of element.children) {
            if (isConnector(child.name)) continue;
            if (child.children.length) {
                scan(child);
                continue;
            }
            if (REFERENCE_NAMES.has(child.name)) {
                addPath(child.text);
            }
            for (const match of child.text.matchAll(MERGE_FIELD)) addPath(match[1]!);
            for (const match of child.text.matchAll(LABEL_IN_TEXT)) add('label', match[1]!);
        }
    };
    return { refs, add, scan };
};

/** レコードの操作 (Get / Create / Update / Delete) の対象オブジェクトと項目 */
const RECORD_OPERATIONS = new Set([
    'recordLookups',
    'recordCreates',
    'recordUpdates',
    'recordDeletes',
]);

const collectReferences = (
    elementName: string,
    element: XmlElement,
    startObject: string | undefined,
): FlowReference[] => {
    const collector = makeReferenceCollector(startObject);
    const object = readText(element, 'object');
    if ((RECORD_OPERATIONS.has(elementName) || elementName === 'start') && object) {
        collector.add('object', object);
        const fields = [
            ...childrenOf(element, 'filters'),
            ...childrenOf(element, 'inputAssignments'),
            ...childrenOf(element, 'outputAssignments'),
        ].flatMap((row) => {
            const field = readText(row, 'field');
            return field ? [field] : [];
        });
        [...fields, ...childrenOf(element, 'queriedFields').map((f) => f.text)].forEach((field) =>
            collector.add('field', `${object}.${field}`),
        );
    }
    if (elementName === 'actionCalls') {
        const actionType = readText(element, 'actionType');
        const actionName = readText(element, 'actionName');
        if (actionName && actionType === 'apex') collector.add('apexClass', actionName);
        if (actionName && actionType === 'flow') collector.add('flow', actionName);
    }
    if (elementName === 'apexPluginCalls') {
        const apexClass = readText(element, 'apexClass');
        if (apexClass) collector.add('apexClass', apexClass);
    }
    if (elementName === 'subflows') {
        const flowName = readText(element, 'flowName');
        if (flowName) collector.add('flow', flowName);
    }
    if (elementName === 'screens') {
        const visit = (field: XmlElement) => {
            const extension = readText(field, 'extensionName');
            if (extension) {
                const [namespace, component] = extension.split(':');
                if (namespace === 'c' && component) collector.add('lwc', component);
                else collector.add('component', extension);
            }
            childrenOf(field, 'fields').forEach(visit);
        };
        childrenOf(element, 'fields').forEach(visit);
    }
    collector.scan(element);
    return collector.refs;
};

const referencesEntry = (references: FlowReference[]) => (references.length ? { references } : {});

// ---------------------------------------------------------------------------
// XML → JSON
// ---------------------------------------------------------------------------

const makeRuleJson = (rule: XmlElement, file: XmlFile, registry: XmlSourceRegistry) =>
    makeMetadataJson<FlowRuleJson>(
        'flowRule',
        {
            name: readText(rule, 'name') ?? '',
            ...(readText(rule, 'label') !== undefined ? { label: readText(rule, 'label')! } : {}),
            ...propertiesEntry(toProperties(rule, new Set(['name', 'label']))),
        },
        rule,
        file,
        registry,
    );

const makeScreenFieldJson = (
    field: XmlElement,
    file: XmlFile,
    registry: XmlSourceRegistry,
): FlowScreenFieldJson => {
    const fieldType = readText(field, 'fieldType');
    const extensionName = readText(field, 'extensionName');
    const fields = childrenOf(field, 'fields').map((child) =>
        makeScreenFieldJson(child, file, registry),
    );
    return makeMetadataJson<FlowScreenFieldJson>(
        'flowScreenField',
        {
            name: readText(field, 'name') ?? '',
            ...(fieldType !== undefined ? { fieldType } : {}),
            ...(extensionName !== undefined ? { extensionName } : {}),
            ...propertiesEntry(
                toProperties(field, new Set(['name', 'fieldType', 'extensionName', 'fields'])),
            ),
            ...nonEmptyEntry('fields', fields),
        },
        field,
        file,
        registry,
    );
};

const optionalText = <K extends string>(element: XmlElement, name: K) => {
    const text = readText(element, name);
    return text === undefined ? {} : ({ [name]: text } as Record<K, string>);
};

const makeElementJson = (
    elementName: keyof typeof FLOW_ELEMENT_KINDS,
    element: XmlElement,
    startObject: string | undefined,
    file: XmlFile,
    registry: XmlSourceRegistry,
): FlowElementJson => {
    const rules =
        elementName === 'decisions'
            ? childrenOf(element, 'rules').map((rule) => makeRuleJson(rule, file, registry))
            : [];
    const fields =
        elementName === 'screens'
            ? childrenOf(element, 'fields').map((field) =>
                  makeScreenFieldJson(field, file, registry),
              )
            : [];
    const skip = new Set(['name', 'label', 'description']);
    if (rules.length) skip.add('rules');
    if (fields.length) skip.add('fields');
    return makeMetadataJson<FlowElementJson>(
        FLOW_ELEMENT_KINDS[elementName],
        {
            name: readText(element, 'name') ?? '',
            ...optionalText(element, 'label'),
            ...optionalText(element, 'description'),
            ...propertiesEntry(toProperties(element, skip)),
            ...nonEmptyEntry('rules', rules),
            ...nonEmptyEntry('fields', fields),
            ...referencesEntry(collectReferences(elementName, element, startObject)),
        },
        element,
        file,
        registry,
    );
};

const makeResourceJson = (
    elementName: keyof typeof FLOW_RESOURCE_KINDS,
    element: XmlElement,
    startObject: string | undefined,
    file: XmlFile,
    registry: XmlSourceRegistry,
): FlowResourceJson =>
    makeMetadataJson<FlowResourceJson>(
        FLOW_RESOURCE_KINDS[elementName],
        {
            name: readText(element, 'name') ?? '',
            ...optionalText(element, 'description'),
            ...propertiesEntry(toProperties(element, new Set(['name', 'description']))),
            ...referencesEntry(collectReferences(elementName, element, startObject)),
        },
        element,
        file,
        registry,
    );

const makeStartJson = (
    element: XmlElement,
    file: XmlFile,
    registry: XmlSourceRegistry,
): FlowStartJson => {
    const object = readText(element, 'object');
    return makeMetadataJson<FlowStartJson>(
        'flowStart',
        {
            ...optionalText(element, 'object'),
            ...optionalText(element, 'triggerType'),
            ...optionalText(element, 'recordTriggerType'),
            ...propertiesEntry(
                toProperties(element, new Set(['object', 'triggerType', 'recordTriggerType'])),
            ),
            ...referencesEntry(collectReferences('start', element, object)),
        },
        element,
        file,
        registry,
    );
};

const ELEMENT_NAMES = Object.keys(FLOW_ELEMENT_KINDS) as (keyof typeof FLOW_ELEMENT_KINDS)[];
const RESOURCE_NAMES = Object.keys(FLOW_RESOURCE_KINDS) as (keyof typeof FLOW_RESOURCE_KINDS)[];

export const makeFlowJson = (
    file: ParsedXmlFile,
    registry: XmlSourceRegistry,
    problems: XmlReadProblem[],
): FlowJson | ErrorJson => {
    const root = readXmlRoot(file, 'Flow', 'flow', registry, problems);
    if (!('name' in root)) return root;

    const startElement = childOf(root, 'start');
    const startObject = startElement ? readText(startElement, 'object') : undefined;

    // 要素・資源は XML の順のまま (種類ごとにまとまっている)
    const elementXml = root.children.filter((child) =>
        (ELEMENT_NAMES as string[]).includes(child.name),
    );
    const elements = elementXml.map((element) =>
        makeElementJson(
            element.name as keyof typeof FLOW_ELEMENT_KINDS,
            element,
            startObject,
            file,
            registry,
        ),
    );
    const resources = root.children
        .filter((child) => (RESOURCE_NAMES as string[]).includes(child.name))
        .map((element) =>
            makeResourceJson(
                element.name as keyof typeof FLOW_RESOURCE_KINDS,
                element,
                startObject,
                file,
                registry,
            ),
        );

    const startElementReference = readText(root, 'startElementReference');
    const edges: FlowEdge[] = [
        ...(startElement ? collectEdges(FLOW_START, startElement) : []),
        ...(startElementReference
            ? [{ from: FLOW_START, to: startElementReference, edgeType: 'startElementReference' }]
            : []),
        ...elementXml.flatMap((element) => collectEdges(readText(element, 'name') ?? '', element)),
    ];

    const processMetadataValues = childrenOf(root, 'processMetadataValues')
        .filter((value) => !BUILDER_SETTINGS.has(readText(value, 'name') ?? ''))
        .map(toValue);

    return makeMetadataJson<FlowJson>(
        'flow',
        {
            name: file.name,
            ...readProperties(root, FLOW_SCHEMA),
            ...(startElement ? { start: makeStartJson(startElement, file, registry) } : {}),
            ...nonEmptyEntry('elements', elements),
            ...nonEmptyEntry('resources', resources),
            ...nonEmptyEntry('edges', edges),
            ...nonEmptyEntry('processMetadataValues', processMetadataValues),
            ...nonEmptyEntry(
                'skippedElements',
                unknownChildNames(root, [
                    ...Object.keys(FLOW_SCHEMA),
                    ...ELEMENT_NAMES,
                    ...RESOURCE_NAMES,
                    'start',
                    'startElementReference',
                    'processMetadataValues',
                ]),
            ),
        },
        root,
        file,
        registry,
    );
};
