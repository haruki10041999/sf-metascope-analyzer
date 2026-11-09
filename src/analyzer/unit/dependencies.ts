import {
    type DependencyGraph,
    type GraphUnit,
    buildDependencyGraph,
} from '../processor/dependency/graph';
import { getUnitDependencies } from '../processor/dependency/units';

import type { Repository } from './repository';

// リポジトリ (Repository) から依存関係のグラフを作る。方針: docs/analysis-plan.md 3.5

/** リポジトリのすべての単位の定義・参照 */
export const getRepositoryDependencies = (repository: Repository): GraphUnit[] =>
    repository.entries().flatMap(([type, results]) =>
        results.map((result) => ({
            type,
            id: result.result.id,
            dependencies: getUnitDependencies(type, result),
        })),
    );

/** リポジトリの依存関係のグラフ (ノード・辺・ない参照の指摘) */
export const analyzeDependencies = (repository: Repository): DependencyGraph =>
    buildDependencyGraph(getRepositoryDependencies(repository));

const graphs = new WeakMap<Repository, DependencyGraph>();
const graphSources = new WeakMap<Repository, Repository>();

/**
 * derived (値を伏せたリポジトリなど) のグラフに、original のグラフを使う。
 * グラフは名前・種類・位置だけを持ち値を持たないので、伏せる前の参照 (メールの本文の項目など) をそのまま使える
 */
export const shareDependencyGraph = (derived: Repository, original: Repository): void => {
    graphSources.set(derived, original);
};

/** リポジトリの依存関係のグラフ (同じリポジトリには、作ったものを使い回す) */
export const dependencyGraphOf = (repository: Repository): DependencyGraph => {
    const original = graphSources.get(repository);
    if (original) return dependencyGraphOf(original);
    let graph = graphs.get(repository);
    if (!graph) {
        graph = analyzeDependencies(repository);
        graphs.set(repository, graph);
    }
    return graph;
};
