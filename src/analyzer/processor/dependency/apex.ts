import type { ApexUnitParseResult } from '../../parser/Apex/unit';
import { analyzeApexUnit } from '../Apex/semantic/analyze';
import { apexSemanticDependenciesOf } from '../Apex/semantic/dependencies';

import type { UnitDependencies } from './types';

// Apex の単位 (クラス・トリガー・匿名 Apex) の定義と参照。方針: docs/analysis-plan.md 3.3、docs/plan.md 5.3
// 新しい解析 (processor/Apex/semantic) の結果を、今の依存関係の形に変換する。
// - 定義: クラス (内側のクラスは Outer.Inner)・インターフェース・enum・メソッド・プロパティ・項目
// - 参照: 型・extends・implements・new・メソッドの呼び出し・メンバーの読み書き・SOQL・SOSL・DML・トリガーのオブジェクト、
//   名前を文字列などで渡すもの (Label・Page・Flow・カスタム設定・Type.forName・'callout:X' など。namedReferences.ts)
// - 依存関係に入れるのは、解決した・標準・名前だけの参照 (候補が複数のもの・分からないものは入れない)
// 以前の抽出 (apexLegacy.ts) は、新しい解析との比較のテストのために残している (docs/plan.md の P5 で消す)

export const getApexDependencies = (unit: ApexUnitParseResult): UnitDependencies => {
    const analysis = analyzeApexUnit(unit);
    return analysis
        ? apexSemanticDependenciesOf(analysis).dependencies
        : { definitions: [], references: [] };
};
