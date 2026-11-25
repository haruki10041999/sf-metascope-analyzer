import type { FlowParseResult } from '../../parser/Metadata/flow';
import { FLOW_START, type ConvertKeys, type FlowJson, type FlowResourceJson } from '../../types';
import { type FlowRefInfo, analyzeFlowRefs } from './flowRefs';
import type { LabelUsage } from './labelAnalysis';
import { MetadataContext, MetadataFinding, ReferenceProblem } from './references';

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

/**
 * Flow の解析の指摘。参照先 (オブジェクト・項目・Apex・サブフロー・LWC・ラベル) がリポジトリにあるかは、
 * 依存関係のグラフの指摘 (referenceFindingsOf) で見る。ここは Flow の中の決まりだけ
 */
export type FlowAnalysisCode =
    | 'APEX_NOT_INVOCABLE'
    | 'LWC_NOT_FLOW_SCREEN'
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

/**
 * Flow の中のすべての参照 (起動・要素・資源) と、見つけたノードの sourceKeys。
 * 段階 M3 で JSON の references から、解析 (flowRefs.ts) に移した
 */
const referencesOf = (json: FlowJson) =>
    analyzeFlowRefs(json).map((ref) => ({
        ref,
        kind: ref.elementKind,
        sourceKeys: ref.sourceKeys!,
    }));

/** Flow の中の $Label.<名前> (カスタム表示ラベルの解析に渡す) */
export const getFlowLabelUsages = (results: FlowParseResult[]): LabelUsage[] =>
    readableFlows(results).flatMap(({ result, json }) =>
        referencesOf(json)
            .filter(({ ref }) => ref.refType === 'customLabel')
            .map(({ ref, sourceKeys }) => ({
                name: ref.target,
                origin: 'flow' as const,
                unit: result.result.id,
                sourceKeys,
            })),
    );

/** Flow の解析。context (リポジトリの解析結果) を渡すと、Apex アクション・画面の LWC の決まりも確かめる */
export const analyzeFlows = (
    results: FlowParseResult[],
    context: MetadataContext = {},
): FlowAnalysis => {
    const flows = readableFlows(results);
    const apexClasses = context.apexClasses?.map((name) => name.toLowerCase());
    const invocable = context.invocableApexClasses?.map((name) => name.toLowerCase());
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
        const problemOf = (ref: FlowRefInfo, kind: string): ReferenceProblem | undefined => {
            switch (ref.refType) {
                case 'apexClass': {
                    // Apex アクション (actionCalls) は @InvocableMethod を持つクラスだけを呼べる
                    // (リポジトリにないクラスは、グラフの UNKNOWN_APEX_CLASS で見るので、ここでは見ない)
                    const target = ref.target.toLowerCase();
                    const exists = !apexClasses || apexClasses.includes(target);
                    return kind === 'flowActionCall' &&
                        exists &&
                        invocable &&
                        !invocable.includes(target)
                        ? {
                              code: 'APEX_NOT_INVOCABLE',
                              target: ref.target,
                              message: `Apex クラス ${ref.target} に @InvocableMethod がない`,
                          }
                        : undefined;
                }
                case 'lwc': {
                    // js-meta.xml が分かる (リポジトリにある) LWC だけ
                    const meta = context.lwcMeta?.[ref.target];
                    return meta && !meta.targets.includes('lightning__FlowScreen')
                        ? {
                              code: 'LWC_NOT_FLOW_SCREEN',
                              target: ref.target,
                              message: `LWC ${ref.target} の targets に lightning__FlowScreen がない`,
                          }
                        : undefined;
                }
                case 'element':
                    return names.has(ref.target.toLowerCase()) || BUILTIN_ELEMENTS.has(ref.target)
                        ? undefined
                        : {
                              code: 'UNKNOWN_FLOW_ELEMENT',
                              target: ref.target,
                              message: `要素・資源 ${ref.target} が Flow の中にない`,
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

// ---------------------------------------------------------------------------
// Flow の入出力 (段階 M8 の #11。意味の差分の材料)
// ---------------------------------------------------------------------------

/** Flow の入力・出力の変数 1 つ (サブフロー・Apex・API から渡せる・受け取れるもの) */
export type FlowInterfaceVariable = {
    name: string;
    direction: 'input' | 'output' | 'inputOutput';
    dataType?: string;
    objectType?: string;
    apexClass?: string;
    isCollection: boolean;
    sourceKeys?: FlowResourceJson['sourceKeys'];
};

const flagOf = (resource: FlowResourceJson, name: 'isInput' | 'isOutput' | 'isCollection') => {
    // 段階 M8 から変数の型はノードの直下 (それより前の保存データは properties の値の木)
    const own = resource[name];
    if (typeof own === 'boolean') return own;
    return resource.properties?.[name] === true;
};

const textOf = (resource: FlowResourceJson, name: 'dataType' | 'objectType' | 'apexClass') => {
    const own = resource[name];
    if (typeof own === 'string') return own;
    const value = resource.properties?.[name];
    return typeof value === 'string' ? value : undefined;
};

/** Flow の入出力 (isInput / isOutput の変数。名前の順) */
export const flowInterfaceOf = (flow: FlowJson): FlowInterfaceVariable[] =>
    (flow.resources ?? [])
        .filter((resource) => resource.kind === 'flowVariable')
        .flatMap((resource): FlowInterfaceVariable[] => {
            const input = flagOf(resource, 'isInput');
            const output = flagOf(resource, 'isOutput');
            if (!input && !output) return [];
            const dataType = textOf(resource, 'dataType');
            const objectType = textOf(resource, 'objectType');
            const apexClass = textOf(resource, 'apexClass');
            return [
                {
                    name: resource.name,
                    direction: input && output ? 'inputOutput' : input ? 'input' : 'output',
                    ...(dataType !== undefined ? { dataType } : {}),
                    ...(objectType !== undefined ? { objectType } : {}),
                    ...(apexClass !== undefined ? { apexClass } : {}),
                    isCollection: flagOf(resource, 'isCollection'),
                    ...(resource.sourceKeys ? { sourceKeys: resource.sourceKeys } : {}),
                },
            ];
        })
        .sort((a, b) => a.name.localeCompare(b.name));
