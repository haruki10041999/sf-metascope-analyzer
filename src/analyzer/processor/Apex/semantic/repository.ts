import type { ApexUnitJson, ApexUnitParseResult } from '../../../parser/Apex/unit';
import { type ApexDeclaration, apexDeclarationsOf } from './declaration';
import {
    APEX_EXTERNAL_ID_SEPARATOR,
    type ApexDeclarationIndex,
    apexDeclarationIndexOf,
} from './type';

// リポジトリの Apex クラスの宣言の索引 (単位をまたぐ解決。docs/plan.md 10 章 P4 の段 1)。
// 型の解決 (type.ts) に渡すと、ほかのクラスの型・親クラス・メンバー・メソッドの戻り値をたどる。
// - 外から見えるのはクラスの単位の宣言だけ (トリガー・匿名 Apex の中の型は外から使えない)
// - 入れるのは型・メソッド・フィールド・プロパティ・enum の定数・メソッドの引数 (本体の中の変数は入れない)
// - ID は「<単位名>#<sourceKey>」(単位の中の宣言と区別する。sourceKey は単位をまたぐと重なりうる)

/** 外から引く宣言の種類 */
const VISIBLE_KINDS = new Set<ApexDeclaration['kind']>([
    'class',
    'interface',
    'enum',
    'method',
    'interfaceMethod',
    'field',
    'property',
    'enumConstant',
    // メソッドの引数 (オーバーロードを引数の型で絞るため)
    'parameter',
]);

const externalId = (unit: string, id: string) => `${unit}${APEX_EXTERNAL_ID_SEPARATOR}${id}`;

/** 単位 1 つの宣言を、索引に入れる形 (ID に単位名を付ける) にする */
export const apexExternalDeclarationsOf = (
    unit: string,
    declarations: readonly ApexDeclaration[],
): ApexDeclaration[] =>
    declarations
        .filter((d) => VISIBLE_KINDS.has(d.kind))
        .map(
            (d) =>
                ({
                    ...d,
                    id: externalId(unit, d.id),
                    ownerId: d.ownerId ? externalId(unit, d.ownerId) : null,
                    bodyId: null,
                    ...('parameterIds' in d
                        ? { parameterIds: d.parameterIds.map((id) => externalId(unit, id)) }
                        : {}),
                }) as ApexDeclaration,
        );

/**
 * リポジトリの Apex の単位から、クラスの宣言の索引を作る。
 * 型の解決には { index, unit: <解析する単位の名前> } を渡す (自分の単位の宣言は索引から除いて引く)
 */
export const apexRepositoryIndexOf = (
    units: readonly (ApexUnitParseResult | ApexUnitJson)[],
): ApexDeclarationIndex =>
    apexDeclarationIndexOf(
        units.flatMap((unit) => {
            const base = 'result' in unit ? unit.result.base : unit;
            const source = base.source;
            if (base.unitType !== 'class' || !source || source.fileType === 'error') return [];
            return apexExternalDeclarationsOf(base.name, apexDeclarationsOf(source).declarations);
        }),
    );
