import type {
    ConvertKeys,
    FlowElementJson,
    FlowJson,
    FlowResourceJson,
    FlowStartJson,
} from '../../types';
import { FLOW_START } from '../../types';

import { metadataRecordsOf, walkMetadataJson } from './walker';
import { formulaNameOf } from '../../types/metadata/criteria';

// Flow の要素・資源・起動が使っているもの (docs/json-redesign-plan.md の段階 M3)。
// 段階 M2 までは parse が XML から取り出して JSON (references) に持っていた。LWC の calls・events と同じく、
// JSON の値の木を共通の走査 (walker.ts) でたどって解析で出す。参照の種類の名前は依存関係の語彙 (DependencyTargetType)

/** Flow の要素が使っているものの種類 */
export type FlowRefType =
    | 'object'
    | 'field'
    /** 同じ Flow の要素・資源 (変数など) の名前 */
    | 'element'
    /** $User.Id / $Flow.FaultMessage など */
    | 'globalVariable'
    | 'apexClass'
    | 'flow'
    | 'lwc'
    /** 画面の部品 (c 以外の名前空間の部品は <名前空間>:<名前>) */
    | 'aura'
    | 'customLabel'
    /** $Permission.<名前> */
    | 'customPermission'
    /** $CustomMetadata.<型>__mdt.<レコード> のレコード (<型 (__mdt なし)>.<レコード>) */
    | 'customMetadata'
    /** アクション (actionCalls) の emailAlert (ワークフローのメールアラート <オブジェクト>.<名前>) */
    | 'workflowAlert'
    /** アクションの quickAction (<オブジェクト>.<名前> か、グローバルなら <名前>) */
    | 'quickAction'
    /** アクションの externalService (外部サービスの登録の名前。actionName の . の前) */
    | 'externalServiceRegistration'
    /** カスタム通知 (CustomNotificationType を DeveloperName で取得するもの) */
    | 'customNotificationType';

/** 使っているもの 1 つ */
export type FlowRefInfo = {
    refType: FlowRefType;
    /** object: Invoice__c / field: Invoice__c.Amount__c / element: 要素・資源の名前 / globalVariable: $User.Id など */
    target: string;
    /** 使っている要素・資源の名前 (起動は $start) */
    element: string;
    /** 使っている要素・資源・起動の kind */
    elementKind: string;
    /** 使っている要素・資源・起動の位置 */
    sourceKeys?: ConvertKeys;
};

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown): string | undefined =>
    typeof value === 'string' && value !== '' ? value : undefined;

const rows = (json: unknown, name: string): Json[] =>
    isRecord(json) && Array.isArray(json[name]) ? (json[name] as unknown[]).filter(isRecord) : [];

const MERGE_FIELD = /\{!([^}]+)\}/g;

/** 行の項目 (inputAssignments などの field、条件の行 (criterion。段階 M7) の左辺) */
const rowField = (row: Json): string | undefined => str(row.field) ?? formulaNameOf(row.left);
const LABEL_IN_TEXT = /\$Label\.(\w+)/g;

/** 値が要素・資源の名前 (または $Record.<項目> など) のプロパティ */
const REFERENCE_NAMES = new Set([
    'elementReference',
    'leftValueReference',
    'assignToReference',
    'assignNextValueToReference',
    'collectionReference',
    'inputReference',
    'outputReference',
    'choiceReferences',
]);

/** レコードの操作 (Get / Create / Update / Delete) の要素 */
const RECORD_OPERATIONS = new Set([
    'flowRecordLookup',
    'flowRecordCreate',
    'flowRecordUpdate',
    'flowRecordDelete',
]);

/** 要素・資源・起動 1 つの参照を集める */
const makeCollector = (startObject: string | undefined) => {
    const refs: { refType: FlowRefType; target: string }[] = [];
    const seen = new Set<string>();
    const add = (refType: FlowRefType, target: string | undefined) => {
        const key = `${refType}:${target}`;
        if (!target || seen.has(key)) return;
        seen.add(key);
        refs.push({ refType, target });
    };
    /** {!...} の中や elementReference の値 */
    const addPath = (path: string) => {
        const trimmed = path.trim();
        const label = trimmed.match(/^\$Label\.(\w+)/);
        if (label) return add('customLabel', label[1]!);
        const record = trimmed.match(/^\$Record(?:__Prior)?\.(\w+)/);
        if (record) {
            return startObject
                ? add('field', `${startObject}.${record[1]}`)
                : add('globalVariable', trimmed);
        }
        // カスタム権限・カスタム設定・カスタムメタデータは、定義のある種類の参照にする (数式の解析と同じ。dependency/formula.ts)
        const [head, first, second, third] = trimmed.split('.');
        switch (head?.toLowerCase()) {
            case '$permission':
                if (first) return add('customPermission', first);
                break;
            case '$setup':
                if (first) {
                    add('object', first);
                    if (second) add('field', `${first}.${second}`);
                    return;
                }
                break;
            case '$custommetadata':
                if (first) {
                    add('object', first);
                    if (second) add('customMetadata', `${first.replace(/__mdt$/i, '')}.${second}`);
                    if (third) add('field', `${first}.${third}`);
                    return;
                }
                break;
        }
        if (trimmed.startsWith('$')) {
            return add('globalVariable', trimmed.split('.').slice(0, 2).join('.'));
        }
        add('element', trimmed.split('.')[0]!);
    };
    /** 数式の木 (段階 M4) の名前 (書いた順) */
    const namesIn = (node: unknown): string[] =>
        metadataRecordsOf(node)
            .filter((n) => n.kind === 'fxName' && Array.isArray(n.path))
            .map((n) => (n.path as string[]).join('.'));
    /** 要素の中のすべての文字列 (参照のプロパティ・差し込み・ラベル) と、数式の木の差し込み・ラベル */
    const scan = (node: unknown) =>
        walkMetadataJson(
            node,
            {
                record: (record, context) => {
                    // 条件の行 (段階 M7): conditions の左辺は資源・要素の参照。filters の左辺は対象のオブジェクトの項目
                    // (レコードの操作の項目として別に見る)。右辺の elementReference は参照
                    if (record.kind === 'criterion') {
                        if (context.path.at(-1) !== 'filters') {
                            const left = formulaNameOf(record.left);
                            if (left) addPath(left);
                        }
                        const right = isRecord(record.right) ? record.right : undefined;
                        if (right?.type === 'reference') {
                            const name = formulaNameOf(right.value);
                            if (name) addPath(name);
                        }
                    }
                    // 数式の差し込み {!x} の中の名前 (文字列のときの MERGE_FIELD と同じ)
                    if (record.kind === 'fxMerge') namesIn(record.expression).forEach(addPath);
                    // 数式の中の $Label.X (文字列のときの LABEL_IN_TEXT と同じ)
                    // テンプレートの文字列のまま残った部分 (読めなかった差し込み・本文の $Label)
                    if (record.kind === 'fxTemplate' && Array.isArray(record.parts)) {
                        for (const part of record.parts) {
                            if (typeof part !== 'string') continue;
                            for (const match of part.matchAll(MERGE_FIELD)) addPath(match[1]!);
                            for (const match of part.matchAll(LABEL_IN_TEXT))
                                add('customLabel', match[1]!);
                        }
                    }
                    if (record.kind === 'fxName' && Array.isArray(record.path)) {
                        const [head, name] = record.path as string[];
                        if (head === '$Label' && name) add('customLabel', name);
                    }
                },
                value: (key, value, owner) => {
                    if (key === 'kind') return;
                    if (
                        REFERENCE_NAMES.has(key) ||
                        (key === 'value' && REFERENCE_NAMES.has(String(owner.type)))
                    ) {
                        addPath(value);
                    }
                    for (const match of value.matchAll(MERGE_FIELD)) addPath(match[1]!);
                    for (const match of value.matchAll(LABEL_IN_TEXT))
                        add('customLabel', match[1]!);
                },
            },
            { dataType: 'flow', unitName: '', path: [] },
        );
    return { refs, add, scan };
};

/** 要素・資源・起動 1 つが使っているもの */
const refsOfNode = (
    node: FlowElementJson | FlowResourceJson | FlowStartJson,
    startObject: string | undefined,
): { refType: FlowRefType; target: string }[] => {
    const collector = makeCollector(startObject);
    const properties: Json = isRecord(node.properties) ? node.properties : {};
    const kind = node.kind;
    const object = kind === 'flowStart' ? str(node.object) : str(properties.object);
    if ((RECORD_OPERATIONS.has(kind) || kind === 'flowStart') && object) {
        collector.add('object', object);
        const fields = [
            ...rows(properties, 'filters'),
            ...rows(properties, 'inputAssignments'),
            ...rows(properties, 'outputAssignments'),
        ].flatMap((row) => {
            const field = rowField(row);
            return field ? [field] : [];
        });
        const queried = Array.isArray(properties.queriedFields)
            ? properties.queriedFields.flatMap((field) => (str(field) ? [field as string] : []))
            : [];
        [...fields, ...queried].forEach((field) => collector.add('field', `${object}.${field}`));
    }
    if (kind === 'flowActionCall') {
        const actionType = str(properties.actionType);
        const actionName = str(properties.actionName);
        if (actionName && actionType === 'apex') collector.add('apexClass', actionName);
        if (actionName && actionType === 'flow') collector.add('flow', actionName);
        if (actionName && actionType === 'emailAlert') collector.add('workflowAlert', actionName);
        if (actionName && actionType === 'quickAction') collector.add('quickAction', actionName);
        // externalService の actionName は <登録の名前>.<操作>
        if (actionName && actionType === 'externalService') {
            collector.add('externalServiceRegistration', actionName.split('.')[0]!);
        }
    }
    // カスタム通知は Id で渡すので、CustomNotificationType を DeveloperName で取得するところから名前を取る
    if (kind === 'flowRecordLookup' && object?.toLowerCase() === 'customnotificationtype') {
        for (const filter of rows(properties, 'filters')) {
            // 条件の行 (段階 M7) の右辺の文字列の値
            const right = isRecord(filter.right) ? filter.right : undefined;
            const name =
                right?.type === 'value' && right.valueType === 'stringValue'
                    ? str(right.value)
                    : undefined;
            if (rowField(filter)?.toLowerCase() === 'developername' && name) {
                collector.add('customNotificationType', name);
            }
        }
    }
    // 変数の型 (dataType が SObject・Apex のときの objectType。段階 M3 で足した)
    // 段階 M8 から変数の型はノードの直下 (それより前の保存データは properties)
    if (kind === 'flowVariable') {
        collector.add('object', str((node as Json).objectType) ?? str(properties.objectType));
    }
    // 動的な選択肢: 選択リストの値 (picklistObject・picklistField) か、レコード (object・表示・値・並べ替えの項目・条件)
    if (kind === 'flowDynamicChoiceSet') {
        const picklistObject = str(properties.picklistObject);
        if (picklistObject) {
            collector.add('object', picklistObject);
            const picklistField = str(properties.picklistField);
            if (picklistField) collector.add('field', `${picklistObject}.${picklistField}`);
        }
        const recordObject = str(properties.object);
        if (recordObject) {
            collector.add('object', recordObject);
            for (const name of ['displayField', 'valueField', 'sortField']) {
                const field = str(properties[name]);
                if (field) collector.add('field', `${recordObject}.${field}`);
            }
            for (const row of [
                ...rows(properties, 'filters'),
                ...rows(properties, 'outputAssignments'),
            ]) {
                const field = rowField(row);
                if (field) collector.add('field', `${recordObject}.${field}`);
            }
        }
    }
    if (kind === 'flowApexPluginCall') collector.add('apexClass', str(properties.apexClass));
    if (kind === 'flowSubflow') collector.add('flow', str(properties.flowName));
    if (kind === 'flowScreen') {
        const visit = (field: Json) => {
            const extension = str(field.extensionName);
            if (extension) {
                const [namespace, component] = extension.split(':');
                if (namespace === 'c' && component) collector.add('lwc', component);
                else collector.add('aura', extension);
            }
            rows(field, 'fields').forEach(visit);
        };
        rows(node, 'fields').forEach(visit);
    }
    // 段階 M2 までの JSON の references (古い保存データ) は見ない
    const { references: _references, ...rest } = node as Json;
    collector.scan(rest);
    return collector.refs;
};

/** Flow の要素・資源・起動が使っているもの (起動・要素・資源の順、それぞれ見つけた順) */
export const analyzeFlowRefs = (flow: FlowJson): FlowRefInfo[] => {
    const startObject = flow.start?.object;
    const nodes: (FlowElementJson | FlowResourceJson | FlowStartJson)[] = [
        ...(flow.start ? [flow.start] : []),
        ...(flow.elements ?? []),
        ...(flow.resources ?? []),
    ];
    return nodes.flatMap((node) => {
        const element = node.kind === 'flowStart' ? FLOW_START : (node as { name: string }).name;
        return refsOfNode(node, startObject).map((ref) => ({
            ...ref,
            element,
            elementKind: node.kind,
            ...(node.sourceKeys ? { sourceKeys: node.sourceKeys } : {}),
        }));
    });
};

/** 古い名前 (段階 M2 までの JSON の refType) → 今の名前。比べるスクリプト・テスト用 */
export const LEGACY_FLOW_REF_TYPES: Readonly<Record<string, FlowRefType>> = {
    label: 'customLabel',
    component: 'aura',
    global: 'globalVariable',
    emailAlert: 'workflowAlert',
    externalService: 'externalServiceRegistration',
};
