import {
    type DependencyGraph,
    type NodeLevel,
    diffDependencies,
    getDependencies,
    getDependents,
    getImpact,
    getUnused,
    toDot,
    toLevel,
    toMermaid,
} from '../processor/dependency/graph';
import { dependencyGraphOf } from '../unit/dependencies';
import { diffRepositories } from '../unit/repository';

import type { ReportInput, RowBase, ViewStatus } from './types';

// 依存関係のレポートの provider (dependency.*)。入力のリポジトリから依存関係のグラフを作る。
// 方針: docs/analysis-plan.md 3.5

/** 単位の変更の状態 (単位の Diff から)。キーは単位のノードの id */
const unitStatuses = (input: ReportInput, graph: DependencyGraph): Map<string, ViewStatus> => {
    const statuses = new Map<string, ViewStatus>();
    if (!input.before) return statuses;
    const unitNodes = new Map(
        [...graph.nodes.values()]
            .filter((node) => node.level === 'unit' && node.unit)
            .map((node) => [`${node.unit!.type}:${node.unit!.id}`, node.id]),
    );
    for (const [type, diffs] of diffRepositories(input.before, input.after)) {
        for (const diff of diffs) {
            const node = unitNodes.get(`${type}:${diff.id}`);
            if (node) statuses.set(node, diff.status);
        }
    }
    return statuses;
};

/** ノードの行 */
export type DependencyNodeRow = RowBase & {
    id: string;
    type: string;
    name: string;
    origin: string;
    /** 何段目で見つかったか */
    depth?: number;
};

const nodeRow = (graph: DependencyGraph, id: string, depth?: number): DependencyNodeRow => {
    const node = graph.nodes.get(id)!;
    return {
        id,
        type: node.type,
        name: node.name,
        origin: node.origin,
        ...(depth !== undefined ? { depth } : {}),
        ...(node.sourceKeys ? { sourceKeys: node.sourceKeys } : {}),
    };
};

/** dependency.dependents / dependency.dependencies の引数 */
export type DependencyTraverseArgs = {
    /** 起点のノード (field:Invoice__c.Amount__c / apexClass:AccountService など) */
    target: string;
    depth?: number;
    level?: NodeLevel;
};

/** dependency.dependents: ノードを使っているもの (逆引き) */
export const getDependentRows = (input: ReportInput, args: DependencyTraverseArgs) => {
    const graph = dependencyGraphOf(input.after);
    return [...getDependents(graph, args.target, args)].map(([id, depth]) =>
        nodeRow(graph, id, depth),
    );
};

/** dependency.dependencies: ノードが使っているもの */
export const getDependencyRows = (input: ReportInput, args: DependencyTraverseArgs) => {
    const graph = dependencyGraphOf(input.after);
    return [...getDependencies(graph, args.target, args)].map(([id, depth]) =>
        nodeRow(graph, id, depth),
    );
};

/** dependency.impact: 変更した単位 (before と比べて) から被依存をたどった、影響を受ける単位 */
export const getImpactRows = (input: ReportInput, args: { depth?: number } = {}) => {
    const graph = dependencyGraphOf(input.after);
    const statuses = unitStatuses(input, graph);
    const changed = [...statuses].filter(([, status]) => status !== 'unchanged').map(([id]) => id);
    return {
        changed: changed.map((id) => ({ ...nodeRow(graph, id), status: statuses.get(id)! })),
        impacted: [...getImpact(graph, changed, args.depth ?? 2)].map(([id, depth]) =>
            nodeRow(graph, id, depth),
        ),
    };
};

/** dependency.missing: リポジトリにない参照先 */
export const getMissingRows = (input: ReportInput) => {
    const graph = dependencyGraphOf(input.after);
    return graph.findings.map((finding) => ({
        code: finding.code,
        severity: finding.severity,
        target: finding.target,
        from: toLevel(graph, finding.from, 'member'),
        unit: toLevel(graph, finding.from, 'unit'),
        message: finding.message,
        ...(graph.nodes.get(finding.from)?.sourceKeys
            ? { sourceKeys: graph.nodes.get(finding.from)!.sourceKeys }
            : {}),
    }));
};

/** dependency.unused: ほかから使われていないもの (掃除の候補) */
export const getUnusedRows = (input: ReportInput) => {
    const graph = dependencyGraphOf(input.after);
    return getUnused(graph).map((node) => nodeRow(graph, node.id));
};

/** dependency.changes: before / after の依存の増減 (メンバーの細かさ) */
export const getDependencyChanges = (input: ReportInput) => {
    if (!input.before) return [];
    const { added, removed } = diffDependencies(
        dependencyGraphOf(input.before),
        dependencyGraphOf(input.after),
    );
    return [
        ...added.map((d) => ({ ...d, status: 'added' as const })),
        ...removed.map((d) => ({ ...d, status: 'removed' as const })),
    ].sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
};

/** dependency.graph: 図 (単位の細かさ)。targets を渡すと、その単位から depth 段の範囲だけ */
export const getDependencyDiagram = (
    input: ReportInput,
    args: { targets?: string[]; depth?: number; format?: 'mermaid' | 'dot' } = {},
) => {
    const graph = dependencyGraphOf(input.after);
    const scope = args.targets?.length
        ? new Set(
              args.targets.flatMap((target) => [
                  toLevel(graph, target, 'unit'),
                  ...getDependencies(graph, target, { depth: args.depth ?? 1 }).keys(),
                  ...getDependents(graph, target, { depth: args.depth ?? 1 }).keys(),
              ]),
          )
        : undefined;
    return {
        format: args.format ?? 'mermaid',
        text: args.format === 'dot' ? toDot(graph, scope) : toMermaid(graph, scope),
    };
};
