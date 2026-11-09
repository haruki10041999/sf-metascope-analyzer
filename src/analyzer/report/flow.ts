import { analyzeAutomation } from '../processor/Metadata/automation';
import { analyzeFlows } from '../processor/Metadata/flowAnalysis';
import { FLOW_START, type FlowEdge, type FlowJson } from '../types';
import { changedProps, compareKeyed, contextOf, readable, rowBase } from './commons';
import type {
    AutomationRow,
    FlowDiagram,
    FlowDiffRow,
    FlowListRow,
    FlowReferenceRow,
    MetadataSnapshot,
    SnapshotInput,
} from './types';

// Flow・自動化の provider (flow.* / automation.byObject)。方針: docs/report-components-plan.md 2.6 章

type FlowNode = { id: string; filePath: string; json: FlowJson };

const flowsOf = (snapshot: MetadataSnapshot | undefined) =>
    snapshot ? readable<FlowJson>(snapshot.flows, 'flow') : undefined;

const compareFlows = (input: SnapshotInput) =>
    compareKeyed<FlowNode>(
        flowsOf(input.before),
        flowsOf(input.after),
        (f) => f.id,
        input.before !== undefined,
    );

/** flow.list: Flow の一覧 */
export const getFlowList = (input: SnapshotInput): FlowListRow[] =>
    compareFlows(input).map((compared) => {
        const { json, filePath } = (compared.after ?? compared.before)!;
        return {
            ...rowBase(compared, json, filePath),
            name: json.name,
            ...(json.label !== undefined ? { label: json.label } : {}),
            ...(json.processType !== undefined ? { processType: json.processType } : {}),
            ...(json.start?.triggerType !== undefined
                ? { triggerType: json.start.triggerType }
                : {}),
            ...(json.start?.recordTriggerType !== undefined
                ? { recordTriggerType: json.start.recordTriggerType }
                : {}),
            ...(json.start?.object !== undefined ? { object: json.start.object } : {}),
            ...(json.status !== undefined ? { flowStatus: json.status } : {}),
            elementCount: json.elements?.length ?? 0,
        };
    });

const edgeKey = (edge: FlowEdge) => `${edge.from}->${edge.to}:${edge.edgeType}`;

/** flow.diagram: 要素と接続の図 (before と after を合わせ、差分の色分けに status を持つ) */
export const getFlowDiagrams = (input: SnapshotInput, flows?: string[]): FlowDiagram[] =>
    compareFlows(input)
        .filter(
            (compared) => !flows || flows.includes((compared.after ?? compared.before)!.json.name),
        )
        .map((compared) => {
            const flow = (compared.after ?? compared.before)!;
            const hasBefore = input.before !== undefined;
            const before = compared.before?.json;
            const after = compared.after?.json;
            const elements = compareKeyed(
                before?.elements ?? (hasBefore ? [] : undefined),
                after?.elements ?? [],
                (e) => e.name,
                hasBefore,
            );
            const edges = compareKeyed(
                before?.edges ?? (hasBefore ? [] : undefined),
                after?.edges ?? [],
                edgeKey,
                hasBefore,
                () => true,
            );
            return {
                flow: flow.json.name,
                nodes: [
                    { id: FLOW_START, kind: 'flowStart', filePath: flow.filePath },
                    ...elements.map((e) => {
                        const node = (e.after ?? e.before)!;
                        return {
                            ...rowBase(e, node, flow.filePath),
                            id: node.name,
                            kind: node.kind,
                            ...(node.label !== undefined ? { label: node.label } : {}),
                        };
                    }),
                ],
                edges: edges.map((e) => {
                    const edge = (e.after ?? e.before)!;
                    return {
                        ...rowBase(e, undefined, flow.filePath),
                        from: edge.from,
                        to: edge.to,
                        edgeType: edge.edgeType,
                    };
                }),
            };
        });

/** flow.diffs: 要素・資源・起動・Flow の設定値の変更 (before を渡したときだけ意味がある。unchanged は出さない) */
export const getFlowDiffs = (input: SnapshotInput): FlowDiffRow[] =>
    compareFlows(input).flatMap((compared): FlowDiffRow[] => {
        const flow = (compared.after ?? compared.before)!;
        const name = flow.json.name;
        if (compared.status === 'added' || compared.status === 'removed') {
            return [
                {
                    ...rowBase(compared, flow.json, flow.filePath),
                    flow: name,
                    element: '',
                    kind: 'flow',
                    changedProperties: [],
                },
            ];
        }
        if (compared.status !== 'changed') return [];
        const before = compared.before!.json;
        const after = compared.after!.json;
        const settings = changedProps(before, after, [
            'start',
            'elements',
            'resources',
            'edges',
            'skippedElements',
        ]);
        const start = changedProps(before.start, after.start);
        const nodes = [
            ...compareKeyed(before.elements, after.elements, (e) => e.name, true),
            ...compareKeyed(before.resources, after.resources, (r) => r.name, true),
        ].filter((c) => c.status !== 'unchanged');
        return [
            ...(settings.length
                ? [
                      {
                          ...rowBase(compared, after, flow.filePath),
                          flow: name,
                          element: '',
                          kind: 'flow',
                          changedProperties: settings.map((c) => c.name),
                      },
                  ]
                : []),
            ...(start.length
                ? [
                      {
                          ...rowBase(
                              { status: 'changed' },
                              after.start ?? before.start,
                              flow.filePath,
                          ),
                          flow: name,
                          element: FLOW_START,
                          kind: 'flowStart',
                          changedProperties: start.map((c) => c.name),
                      },
                  ]
                : []),
            ...nodes.map((c) => {
                const node = (c.after ?? c.before)!;
                return {
                    ...rowBase(c, node, flow.filePath),
                    flow: name,
                    element: node.name,
                    kind: node.kind,
                    changedProperties:
                        c.status === 'changed'
                            ? changedProps(c.before, c.after).map((p) => p.name)
                            : [],
                };
            }),
        ];
    });

/** flow.references: 参照する項目・Apex・サブフロー・LWC・ラベル (after の時点)。参照先がなければ problem に指摘の code */
export const getFlowReferences = (input: SnapshotInput): FlowReferenceRow[] => {
    const analysis = analyzeFlows(input.after.flows ?? [], contextOf(input.after));
    const problems = new Map(
        analysis.findings.map((f) => [`${f.flow}:${f.target}:${f.sourceKeys?.sourceKey}`, f.code]),
    );
    return (flowsOf(input.after) ?? []).flatMap(({ json, filePath }) => {
        const owners = [
            ...(json.start ? [{ element: FLOW_START, node: json.start }] : []),
            ...(json.elements ?? []).map((node) => ({ element: node.name, node })),
            ...(json.resources ?? []).map((node) => ({ element: node.name, node })),
        ];
        return owners.flatMap(({ element, node }) =>
            (node.references ?? [])
                .filter((ref) => ref.refType !== 'element' && ref.refType !== 'global')
                .map((ref) => {
                    const problem = problems.get(
                        `${json.name}:${ref.value}:${node.sourceKeys.sourceKey}`,
                    );
                    return {
                        filePath,
                        sourceKeys: node.sourceKeys,
                        flow: json.name,
                        element,
                        refType: ref.refType,
                        value: ref.value,
                        ...(problem ? { problem } : {}),
                    };
                }),
        );
    });
};

/** automation.byObject: オブジェクトごとの自動化 (レコードトリガーフロー・Apex トリガー・入力規則) */
export const getAutomationByObject = (input: SnapshotInput): AutomationRow[] => {
    const summarize = (snapshot: MetadataSnapshot) =>
        analyzeAutomation({
            ...(snapshot.flows ? { flows: snapshot.flows } : {}),
            ...(snapshot.apex ? { apex: snapshot.apex } : {}),
            ...(snapshot.objects ? { objects: snapshot.objects } : {}),
        });
    const hasBefore = input.before !== undefined;
    const before = input.before ? summarize(input.before) : undefined;
    const after = summarize(input.after);
    const objects = compareKeyed(
        before,
        after,
        (a) => a.object.toLowerCase(),
        hasBefore,
        () => true,
    );
    return objects.map(({ before: b, after: a }) => {
        const object = (a ?? b)!.object;
        const flows = compareKeyed(
            b?.flows ?? (hasBefore ? [] : undefined),
            a?.flows ?? [],
            (f) => f.name,
            hasBefore,
            (x, y) => JSON.stringify(x) === JSON.stringify(y),
        );
        const triggers = compareKeyed(
            b?.triggers ?? (hasBefore ? [] : undefined),
            a?.triggers ?? [],
            (t) => t.name,
            hasBefore,
            (x, y) => JSON.stringify({ ...x, unit: '' }) === JSON.stringify({ ...y, unit: '' }),
        );
        const rules = compareKeyed(
            b?.validationRules ?? (hasBefore ? [] : undefined),
            a?.validationRules ?? [],
            (r) => r.name,
            hasBefore,
            (x, y) => x.sourceKeys.objectKey === y.sourceKeys.objectKey,
        );
        return {
            object,
            flows: flows.map((c) => {
                const { name, triggerType, recordTriggerType, triggerOrder } = (c.after ??
                    c.before)!;
                return {
                    ...(c.status ? { status: c.status } : {}),
                    name,
                    ...(triggerType !== undefined ? { triggerType } : {}),
                    ...(recordTriggerType !== undefined ? { recordTriggerType } : {}),
                    ...(triggerOrder !== undefined ? { triggerOrder } : {}),
                };
            }),
            triggers: triggers.map((c) => {
                const t = (c.after ?? c.before)!;
                return {
                    ...(c.status ? { status: c.status } : {}),
                    name: t.name,
                    events: t.events,
                    ...(t.status !== undefined ? { triggerStatus: t.status } : {}),
                };
            }),
            validationRules: rules.map((c) => {
                const r = (c.after ?? c.before)!;
                return {
                    ...rowBase(c, r, undefined),
                    name: r.name,
                    active: r.active,
                    ...(r.errorMessage !== undefined ? { errorMessage: r.errorMessage } : {}),
                };
            }),
        };
    });
};
