import type { FlowParseResult } from '../../parser/Metadata/flow';
import { FLOW_START, type ConvertKeys, type FlowJson, type FlowReference } from '../../types';
import type { LabelUsage } from './labelAnalysis';
import {
    MetadataContext,
    MetadataFinding,
    ReferenceProblem,
    makeReferenceChecker,
} from './references';

// Flow の解析。方針: docs/metadata-implementation.md 10 章
// Flow の一覧、オブジェクトごとの自動化、図 (要素と接続)、到達できない要素・失敗時の経路のない処理、参照先の確認

export type FlowInfo = {
    name: string;
    label?: string;
    processType?: string;
    status?: string;
    /** 起動 (RecordAfterSave / Scheduled など) */
    triggerType?: string;
    /** Create / Update / CreateAndUpdate / Delete */
    recordTriggerType?: string;
    /** レコードトリガー・スケジュールの対象オブジェクト */
    object?: string;
    triggerOrder?: number;
    elementCount: number;
    filePath: string;
    sourceKeys: ConvertKeys;
};

/** 図のノード (要素と起動) */
export type FlowGraphNode = { id: string; kind: string; label?: string };

export type FlowGraph = {
    flow: string;
    nodes: FlowGraphNode[];
    edges: { from: string; to: string; edgeType: string }[];
};

/** オブジェクトごとの自動化 (レコードトリガーフロー) */
export type ObjectAutomation = {
    object: string;
    flows: Pick<
        FlowInfo,
        'name' | 'triggerType' | 'recordTriggerType' | 'triggerOrder' | 'status'
    >[];
};

export type FlowAnalysisCode =
    | 'UNKNOWN_OBJECT'
    | 'UNKNOWN_FIELD'
    | 'UNKNOWN_APEX_CLASS'
    | 'APEX_NOT_INVOCABLE'
    | 'UNKNOWN_FLOW'
    | 'UNKNOWN_LWC'
    | 'LWC_NOT_FLOW_SCREEN'
    | 'UNKNOWN_CUSTOM_LABEL'
    | 'UNKNOWN_FLOW_ELEMENT'
    | 'UNREACHABLE_ELEMENT'
    | 'NO_FAULT_PATH';

export type FlowFinding = MetadataFinding<FlowAnalysisCode> & { flow: string };

export type FlowAnalysis = {
    flows: FlowInfo[];
    graphs: FlowGraph[];
    automation: ObjectAutomation[];
    findings: FlowFinding[];
};

/** 失敗するかもしれない処理 (faultConnector を付けられるもの) */
const FAULTABLE_KINDS = new Set([
    'flowRecordCreate',
    'flowRecordUpdate',
    'flowRecordDelete',
    'flowRecordLookup',
    'flowActionCall',
    'flowApexPluginCall',
    'flowSubflow',
]);

/** 実行時に Flow が作る名前 (要素の参照として確かめない) */
const BUILTIN_ELEMENTS = new Set(['$Record', '$Record__Prior']);

const readableFlows = (results: FlowParseResult[]) =>
    results.flatMap((result) =>
        result.dataType === 'flow' ? [{ result, json: result.result.base as FlowJson }] : [],
    );

/** Flow の中のすべての参照 (起動・要素・資源) と、見つけたノードの sourceKeys */
const referencesOf = (json: FlowJson) => [
    ...(json.start?.references ?? []).map((ref) => ({
        ref,
        kind: 'flowStart',
        sourceKeys: json.start!.sourceKeys,
    })),
    ...(json.elements ?? []).flatMap((element) =>
        (element.references ?? []).map((ref) => ({
            ref,
            kind: element.kind as string,
            sourceKeys: element.sourceKeys,
        })),
    ),
    ...(json.resources ?? []).flatMap((resource) =>
        (resource.references ?? []).map((ref) => ({
            ref,
            kind: resource.kind as string,
            sourceKeys: resource.sourceKeys,
        })),
    ),
];

/** Flow の中の $Label.<名前> (カスタム表示ラベルの解析に渡す) */
export const getFlowLabelUsages = (results: FlowParseResult[]): LabelUsage[] =>
    readableFlows(results).flatMap(({ result, json }) =>
        referencesOf(json)
            .filter(({ ref }) => ref.refType === 'label')
            .map(({ ref, sourceKeys }) => ({
                name: ref.value,
                origin: 'flow' as const,
                unit: result.result.id,
                sourceKeys,
            })),
    );

/** Flow の解析。context (リポジトリの解析結果) を渡すと、参照先も確かめる */
export const analyzeFlows = (
    results: FlowParseResult[],
    context: MetadataContext = {},
): FlowAnalysis => {
    const flows = readableFlows(results);
    const check = makeReferenceChecker({
        ...context,
        flows: context.flows ?? flows.map(({ json }) => json.name),
    });
    const findings: FlowFinding[] = [];
    const infos: FlowInfo[] = [];
    const graphs: FlowGraph[] = [];

    for (const { result, json } of flows) {
        const add = (
            code: FlowAnalysisCode,
            severity: FlowFinding['severity'],
            target: string,
            message: string,
            sourceKeys: ConvertKeys,
        ) =>
            findings.push({
                code,
                severity,
                flow: json.name,
                target,
                message,
                filePath: result.filePath,
                sourceKeys,
            });

        infos.push({
            name: json.name,
            ...(json.label !== undefined ? { label: json.label } : {}),
            ...(json.processType !== undefined ? { processType: json.processType } : {}),
            ...(json.status !== undefined ? { status: json.status } : {}),
            ...(json.start?.triggerType !== undefined
                ? { triggerType: json.start.triggerType }
                : {}),
            ...(json.start?.recordTriggerType !== undefined
                ? { recordTriggerType: json.start.recordTriggerType }
                : {}),
            ...(json.start?.object !== undefined ? { object: json.start.object } : {}),
            ...(json.triggerOrder !== undefined ? { triggerOrder: json.triggerOrder } : {}),
            elementCount: json.elements?.length ?? 0,
            filePath: result.filePath,
            sourceKeys: json.sourceKeys,
        });

        // 図
        const elements = json.elements ?? [];
        const edges = (json.edges ?? []).map(({ from, to, edgeType }) => ({ from, to, edgeType }));
        graphs.push({
            flow: json.name,
            nodes: [
                { id: FLOW_START, kind: 'flowStart' },
                ...elements.map((element) => ({
                    id: element.name,
                    kind: element.kind,
                    ...(element.label !== undefined ? { label: element.label } : {}),
                })),
            ],
            edges,
        });

        // 到達できない要素 (起動からたどれないもの)。起動の接続がない Flow (古い形式など) は見ない
        if (edges.some((edge) => edge.from === FLOW_START)) {
            const reached = new Set([FLOW_START]);
            const queue = [FLOW_START];
            while (queue.length) {
                const current = queue.shift()!;
                for (const edge of edges) {
                    if (edge.from === current && !reached.has(edge.to)) {
                        reached.add(edge.to);
                        queue.push(edge.to);
                    }
                }
            }
            elements
                .filter((element) => !reached.has(element.name))
                .forEach((element) =>
                    add(
                        'UNREACHABLE_ELEMENT',
                        'warning',
                        element.name,
                        `要素 ${element.name} は起動からたどれない`,
                        element.sourceKeys,
                    ),
                );
        }

        // 失敗時の経路 (faultConnector) のない処理
        const faulted = new Set(
            edges.filter((edge) => edge.edgeType === 'faultConnector').map((edge) => edge.from),
        );
        elements
            .filter((element) => FAULTABLE_KINDS.has(element.kind) && !faulted.has(element.name))
            .forEach((element) =>
                add(
                    'NO_FAULT_PATH',
                    'info',
                    element.name,
                    `要素 ${element.name} に失敗時の経路 (faultConnector) がない`,
                    element.sourceKeys,
                ),
            );

        // 参照先
        const names = new Set(
            [...elements, ...(json.resources ?? [])].map((node) => node.name.toLowerCase()),
        );
        const problemOf = (ref: FlowReference, kind: string): ReferenceProblem | undefined => {
            switch (ref.refType) {
                case 'object':
                    return check.object(ref.value);
                case 'field':
                    return check.field(ref.value);
                case 'apexClass': {
                    const unknown = check.apexClass(ref.value);
                    if (unknown) return unknown;
                    // Apex アクション (actionCalls) は @InvocableMethod を持つクラスだけを呼べる
                    const invocable = context.invocableApexClasses?.map((n) => n.toLowerCase());
                    return kind === 'flowActionCall' &&
                        invocable &&
                        !invocable.includes(ref.value.toLowerCase())
                        ? {
                              code: 'APEX_NOT_INVOCABLE',
                              target: ref.value,
                              message: `Apex クラス ${ref.value} に @InvocableMethod がない`,
                          }
                        : undefined;
                }
                case 'flow':
                    return check.flow(ref.value);
                case 'label':
                    return check.customLabel(ref.value);
                case 'lwc': {
                    const unknown = check.lwc(ref.value);
                    if (unknown) return unknown;
                    const meta = context.lwcMeta?.[ref.value];
                    return meta && !meta.targets.includes('lightning__FlowScreen')
                        ? {
                              code: 'LWC_NOT_FLOW_SCREEN',
                              target: ref.value,
                              message: `LWC ${ref.value} の targets に lightning__FlowScreen がない`,
                          }
                        : undefined;
                }
                case 'element':
                    return names.has(ref.value.toLowerCase()) || BUILTIN_ELEMENTS.has(ref.value)
                        ? undefined
                        : {
                              code: 'UNKNOWN_FLOW_ELEMENT',
                              target: ref.value,
                              message: `要素・資源 ${ref.value} が Flow の中にない`,
                          };
                default:
                    return undefined;
            }
        };
        const seen = new Set<string>();
        referencesOf(json).forEach(({ ref, kind, sourceKeys }) => {
            const problem = problemOf(ref, kind);
            if (!problem) return;
            const key = `${problem.code}:${problem.target}:${sourceKeys.sourceKey}`;
            if (seen.has(key)) return;
            seen.add(key);
            add(
                problem.code as FlowAnalysisCode,
                problem.code === 'UNKNOWN_FLOW_ELEMENT' ? 'error' : 'warning',
                problem.target,
                problem.message,
                sourceKeys,
            );
        });
    }

    // オブジェクトごとの自動化
    const byObject = new Map<string, ObjectAutomation['flows']>();
    infos
        .filter((info) => info.object)
        .forEach((info) =>
            byObject.set(info.object!, [
                ...(byObject.get(info.object!) ?? []),
                {
                    name: info.name,
                    ...(info.triggerType !== undefined ? { triggerType: info.triggerType } : {}),
                    ...(info.recordTriggerType !== undefined
                        ? { recordTriggerType: info.recordTriggerType }
                        : {}),
                    ...(info.triggerOrder !== undefined ? { triggerOrder: info.triggerOrder } : {}),
                    ...(info.status !== undefined ? { status: info.status } : {}),
                },
            ]),
        );
    const automation = [...byObject]
        .map(([object, list]) => ({
            object,
            flows: list.sort(
                (a, b) =>
                    (a.triggerOrder ?? Number.MAX_SAFE_INTEGER) -
                        (b.triggerOrder ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name),
            ),
        }))
        .sort((a, b) => a.object.localeCompare(b.object));

    return { flows: infos, graphs, automation, findings };
};
