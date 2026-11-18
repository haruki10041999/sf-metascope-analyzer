import {
    type DependencyGraph,
    getDependencies,
    getDependents,
    toLevel,
} from '../processor/dependency/graph';
import { dependencyGraphOf } from '../unit/dependencies';
import type { Repository } from '../unit/repository';
import { unitName } from '../unit/unitType';
import type { FeatureScopeRow, ReportInput } from './types';

// 機能のまとまり (docs/todo.md 2.5): 起点 (オブジェクト・クラス・LWC など) から依存関係のグラフを両方向にたどり、
// 関わる単位を種類をまたいで集める。ドキュメントの雛形 feature_overview の材料 (範囲の単位を、種類ごとの provider の
// 引数 (objects・classes・components など) にする)

export type FeatureScopeArgs = {
    /** 起点のノード (object:Invoice__c・apexClass:AccountService・lwc:accountList など) */
    targets: string[];
    /** たどる段数 (既定 1) */
    depth?: number;
    /** たどる向き (既定 both) */
    direction?: 'both' | 'dependencies' | 'dependents';
    /** 範囲から外す単位の種類 (profile・objectTranslation など、広く何でも参照するもの) */
    excludeTypes?: string[];
};

/**
 * 単位の名前と場所 (リポジトリからの相対パス)。種類と id で引く。
 * 名前はほかの provider (metadata.units など) と同じ書き方 (フォルダのある種類は Folder.Name)
 */
const unitsOf = (repository: Repository) => {
    const units = new Map<string, { name: string; filePath: string }>();
    for (const [type, results] of repository.entries()) {
        for (const result of results) {
            units.set(`${type}:${result.result.id}`, {
                name: unitName(type, result),
                filePath: repository.locationOf(result),
            });
        }
    }
    return units;
};

/** 起点を単位のノードにする (object:Invoice__c.Amount__c → object:Invoice__c) */
const unitNodeOf = (graph: DependencyGraph, id: string) =>
    graph.nodes.has(id) ? toLevel(graph, id, 'unit') : undefined;

/**
 * feature.scope: 起点から depth 段たどった、関わる単位 (起点・使っているもの (uses)・使われているもの (usedBy)・両方 (both))。
 * リポジトリにない参照先 (標準のオブジェクトなど) は持たない
 */
export const getFeatureScope = (input: ReportInput, args: FeatureScopeArgs): FeatureScopeRow[] => {
    const graph = dependencyGraphOf(input.after);
    const depth = args.depth ?? 1;
    const direction = args.direction ?? 'both';
    const found = new Map<string, { relation: Set<'uses' | 'usedBy'>; depth: number }>();
    const add = (id: string, relation: 'uses' | 'usedBy', step: number) => {
        const entry = found.get(id) ?? { relation: new Set(), depth: step };
        entry.relation.add(relation);
        entry.depth = Math.min(entry.depth, step);
        found.set(id, entry);
    };
    const targets = new Set<string>();
    for (const target of args.targets) {
        const unit = unitNodeOf(graph, target);
        if (!unit) continue;
        targets.add(unit);
        if (direction !== 'dependents') {
            for (const [id, step] of getDependencies(graph, target, { depth, level: 'unit' })) {
                add(id, 'uses', step);
            }
        }
        if (direction !== 'dependencies') {
            for (const [id, step] of getDependents(graph, target, { depth, level: 'unit' })) {
                add(id, 'usedBy', step);
            }
        }
    }
    const units = unitsOf(input.after);
    const rows: FeatureScopeRow[] = [];
    const rowOf = (id: string, relation: FeatureScopeRow['relation'], step: number) => {
        const node = graph.nodes.get(id);
        if (!node || node.origin !== 'repository' || !node.unit) return;
        if (args.excludeTypes?.includes(node.unit.type)) return;
        const unit = units.get(`${node.unit.type}:${node.unit.id}`);
        rows.push({
            nodeId: id,
            unitType: node.unit.type,
            name: unit?.name ?? node.name,
            relation,
            depth: step,
            ...(unit ? { filePath: unit.filePath } : {}),
        });
    };
    for (const id of targets) rowOf(id, 'target', 0);
    for (const [id, entry] of found) {
        if (targets.has(id)) continue;
        rowOf(id, entry.relation.size === 2 ? 'both' : [...entry.relation][0]!, entry.depth);
    }
    return rows.sort(
        (a, b) =>
            a.depth - b.depth ||
            a.unitType.localeCompare(b.unitType) ||
            a.name.localeCompare(b.name),
    );
};
