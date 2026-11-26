import type { ApexUnitParseResult } from '../../parser/Apex/unit';
import { type ApexSemanticOptions, analyzeApexUnit } from '../Apex/semantic/analyze';
import { apexSemanticDependenciesOf } from '../Apex/semantic/dependencies';
import { type ApexBodyMetrics, apexMetricsOf } from '../Apex/semantic/metrics';

import type { UnitBodyMetrics, UnitDependencies } from './types';

// Apex の単位 (クラス・トリガー・匿名 Apex) の定義と参照。方針: docs/analysis-plan.md 3.3、docs/plan.md 5.3
// 新しい解析 (processor/Apex/semantic) の結果を、今の依存関係の形に変換する。
// - 定義: クラス (内側のクラスは Outer.Inner)・インターフェース・enum・メソッド・プロパティ・項目
// - 参照: 型・extends・implements・new・メソッドの呼び出し・メンバーの読み書き・SOQL・SOSL・DML・トリガーのオブジェクト、
//   名前を文字列などで渡すもの (Label・Page・Flow・カスタム設定・Type.forName・'callout:X' など。namedReferences.ts)
// - 依存関係に入れるのは、解決した・標準・名前だけの参照 (候補が複数のもの・分からないものは入れない)
// 以前の抽出 (apexLegacy.ts) は、新しい解析との比較のテストのために残している (docs/plan.md の P5 で消す)

export const getApexDependencies = (
    unit: ApexUnitParseResult,
    /** リポジトリの宣言の索引 (単位をまたぐ解決。グラフを作るときに渡す。保存する定義・参照には渡さない) */
    options: ApexSemanticOptions = {},
): UnitDependencies => {
    const analysis = analyzeApexUnit(unit, options);
    if (!analysis) return { definitions: [], references: [] };
    const dependencies = apexSemanticDependenciesOf(analysis).dependencies;
    // メトリクスは単位の中だけで決まるので、保存する定義・参照 (索引を渡さないとき) にだけ付ける
    if (options.repository) return dependencies;
    const metrics = apexMetricsOf(analysis).map(apexBodyMetricsOf);
    return metrics.length ? { ...dependencies, metrics } : dependencies;
};

/** Apex の本体のメトリクスを、保存の形 (UnitBodyMetrics) にする */
const apexBodyMetricsOf = (metrics: ApexBodyMetrics): UnitBodyMetrics => ({
    body: metrics.signature
        ? [...metrics.path.slice(0, -1), metrics.signature].join('.')
        : metrics.path.join('.'),
    ...(metrics.sourceKeys ? { sourceKey: metrics.sourceKeys.sourceKey } : {}),
    values: {
        cyclomatic: metrics.cyclomatic,
        cognitive: metrics.cognitive,
        statements: metrics.statements,
        maxNesting: metrics.maxNesting,
        soql: metrics.soql,
        soqlInLoop: metrics.soqlInLoop,
        sosl: metrics.sosl,
        soslInLoop: metrics.soslInLoop,
        dml: metrics.dml,
        dmlInLoop: metrics.dmlInLoop,
        calls: metrics.calls,
    },
});
