import {
    type DependencyGraph,
    type GraphUnit,
    buildDependencyGraph,
} from '../processor/dependency/graph';
import type { IdParseResult } from '../processor/commons/diff/unit';
import type { UnitDependencies } from '../processor/dependency/types';
import { getUnitDependencies } from '../processor/dependency/units';
import type { ApexUnitParseResult } from '../parser/Apex/unit';
import { type ApexDeclarationIndex, apexRepositoryIndexOf } from '../processor/Apex/semantic';

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
 * - 3: Apex の定義・参照に、単位をまたげば解決できるかもしれない参照の数 (pendingResolution) を足した。
 *      親クラスから引き継いだフィールドを、同じ名前の型より先に引く (2026-11-26)
 * - 4: 参照に確かさ (resolution) を持たせ、候補の参照 (candidates) も残す。オーバーロード・継承した
 *      メンバーの解決を足した (2026-11-26)
 * - 5: ほかの単位の型のメンバー・メソッドの名前だけの参照も、単位をまたげば解決できるかもしれない参照 (pendingResolution)
 *      に数える (インターフェースの実装クラスへの呼び出しの候補を、グラフで作るため。2026-11-26)
 */
export const DERIVED_VERSION = 9;

/** 保存した定義・参照を、解析結果に使う (UnitStore が、版の合う保存したものを読んだとき) */
export const primeUnitDependencies = (result: object, dependencies: UnitDependencies): void => {
    unitDependencies.set(result, dependencies);
};

/** 単位 1 つの定義・参照 (同じ解析結果には、作ったものを使い回す) */
export const unitDependenciesOf = (type: string, result: IdParseResult): UnitDependencies => {
    let dependencies = unitDependencies.get(result);
    if (!dependencies) {
        dependencies = getUnitDependencies(type, result);
        unitDependencies.set(result, dependencies);
    }
    return dependencies;
};

const APEX_UNIT_TYPES = new Set(['apexClass', 'apexTrigger', 'anonymousApex']);

/**
 * リポジトリのすべての単位の定義・参照 (グラフの入力)。
 * Apex の単位のうち、単位の中だけでは解決できなかった参照があるもの (pendingResolution) は、リポジトリの
 * クラスの宣言の索引を渡して解析し直す (ほかのクラスの型・親クラス・メソッドの戻り値をたどる。docs/plan.md 10 章 P4)。
 * 解析し直した結果はほかの単位に依存するので、保存しない (グラフはリポジトリごとに作り直す)
 */
export const getRepositoryDependencies = (repository: Repository): GraphUnit[] => {
    let index: ApexDeclarationIndex | undefined;
    const indexOf = () =>
        (index ??= apexRepositoryIndexOf(repository.get('apexClass') as ApexUnitParseResult[]));
    return repository.entries().flatMap(([type, results]) =>
        results.map((result) => {
            const local = unitDependenciesOf(type, result);
            const dependencies =
                APEX_UNIT_TYPES.has(type) && (local.pendingResolution ?? 0) > 0
                    ? getUnitDependencies(type, result, {
                          repository: {
                              index: indexOf(),
                              unit: (result as ApexUnitParseResult).result.base.name,
                          },
                      })
                    : local;
            return { type, id: result.result.id, dependencies };
        }),
    );
};

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
