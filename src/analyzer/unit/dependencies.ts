import {
    type DependencyGraph,
    type GraphUnit,
    buildDependencyGraph,
} from '../processor/dependency/graph';
import type { UnitDependencies } from '../processor/dependency/types';
import { getUnitDependencies } from '../processor/dependency/units';

import type { Repository } from './repository';

// リポジトリ (Repository) から依存関係のグラフを作る。方針: docs/analysis-plan.md 3.5

/**
 * 単位ごとの定義・参照 (解析結果のオブジェクトごと)。定義・参照はその単位の解析結果だけで決まるので、
 * Repository.update・save で引き継いだ (変わらなかった) 単位は作り直さない (docs/save-format-plan.md の S0)
 */
const unitDependencies = new WeakMap<object, UnitDependencies>();

/**
 * 派生の情報 (単位ごとの定義・参照の取り出し方。processor/dependency/units.ts・apex.ts) の版
 * (docs/save-format-plan.md の S4)。解析結果の版 (UNIT_FORMAT_VERSIONS) と分ける。
 * JSON は変えずに取り出す参照を変えたとき (走査・取り出しの追加・直し) はこれだけを上げる。
 * 上げると、保存した定義・参照 (UnitStore の derived) を捨てて、保存した解析結果から作り直す (parse はやり直さない)。
 * 版の履歴:
 * - 1: 定義・参照を保存するようにした (2026-11-17)
 * - 2: Apex の参照を新しい解析 (processor/Apex/semantic) で取り出す。定義・参照を symbol・reference の表にも書く (2026-11-25)
 */
export const DERIVED_VERSION = 2;

/** 保存した定義・参照を、解析結果に使う (UnitStore が、版の合う保存したものを読んだとき) */
export const primeUnitDependencies = (result: object, dependencies: UnitDependencies): void => {
    unitDependencies.set(result, dependencies);
};

/** 単位 1 つの定義・参照 (同じ解析結果には、作ったものを使い回す) */
export const unitDependenciesOf = (type: string, result: object): UnitDependencies => {
    let dependencies = unitDependencies.get(result);
    if (!dependencies) {
        dependencies = getUnitDependencies(type, result);
        unitDependencies.set(result, dependencies);
    }
    return dependencies;
};

/** リポジトリのすべての単位の定義・参照 */
export const getRepositoryDependencies = (repository: Repository): GraphUnit[] =>
    repository.entries().flatMap(([type, results]) =>
        results.map((result) => ({
            type,
            id: result.result.id,
            dependencies: unitDependenciesOf(type, result),
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
