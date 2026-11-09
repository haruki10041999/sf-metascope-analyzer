// メンバー (クラス・オブジェクトのメソッド / プロパティ、TS のシグネチャ) で共通に使う型と作り方。
// Babel 8 の判別 union (ClassMethodComputed | ClassMethodNonComputed など) を IR にも写す (docs/ir-v2-types.md 5.3・5.4)
import { isIdentifier, type Node } from '@babel/types';

import { IrBuildError, IrError } from '../../commons/ir';
import {
    type AnyEvaluatePair,
    type EvaluatePairInstance,
    getSourceSpan,
    lazyPairs,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { arrayPatternTypePair } from './arrayPattern';
import { assignmentPatternTypePair } from './assignmentPattern';
import { bigIntLiteralTypePair, type BigIntLiteralTypeClass } from './bigIntLiteral';
import { IdentifierTypeClass, identifierTypePair } from './identifier';
import { numericLiteralTypePair, type NumericLiteralTypeClass } from './numericLiteral';
import { objectPatternTypePair } from './objectPattern';
import { privateNameTypePair } from './privateName';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';
import { voidPatternTypePair } from './voidPattern';

// ---------------------------------------------------------------------------
// key
// ---------------------------------------------------------------------------

/** computed: false のときの key (Babel 8 の ClassMethodNonComputed などの key) */
export type StaticMemberKeyTypeClass =
    IdentifierTypeClass | StringLiteralTypeClass | NumericLiteralTypeClass | BigIntLiteralTypeClass;

/**
 * computed と key の組み合わせ。computed: false の key は TStaticKey (既定は Identifier・文字列・数値・BigInt。
 * Babel が PrivateName を許すノード (ClassAccessorProperty・ObjectProperty・TSDeclareMethod) では PrivateName も足す)
 */
export type MemberKey<TStaticKey = StaticMemberKeyTypeClass> =
    { computed: false; key: TStaticKey } | { computed: true; key: ExpressionTypeClass };

/** computed: false の key の pair (Identifier・StringLiteral・NumericLiteral・BigIntLiteral) */
export const staticMemberKeyPairs = lazyPairs(
    () =>
        [
            identifierTypePair,
            stringLiteralTypePair,
            numericLiteralTypePair,
            bigIntLiteralTypePair,
        ] as const,
);

/** computed: false の key の pair (staticMemberKeyPairs に PrivateName を足したもの) */
export const staticMemberKeyOrPrivateNamePairs = lazyPairs(
    () => [...staticMemberKeyPairs(), privateNameTypePair] as const,
);

/**
 * computed に合わせて key を作る。computed: true なら式、false なら staticKeyPairs のどれか。
 * 合わない key (エラーからの回復など) は IrBuildError (UNSUPPORTED_CONTEXT) になる
 */
export const createMemberKey = <TPair extends AnyEvaluatePair>(
    target: { computed: boolean; key: Node },
    originalSource: string,
    staticKeyPairs: readonly TPair[],
    visitorName: string,
): MemberKey<EvaluatePairInstance<TPair>> =>
    target.computed
        ? {
              computed: true,
              key: visitNode(
                  target.key,
                  originalSource,
                  expressionVisitorEvaluatePairs(),
                  `${visitorName}.key`,
              ),
          }
        : {
              computed: false,
              key: visitNode(target.key, originalSource, staticKeyPairs, `${visitorName}.key`),
          };

// ---------------------------------------------------------------------------
// get・set の params
// ---------------------------------------------------------------------------

/** TS の this パラメータ (`this: T`。Babel では name が this の Identifier) */
export type ThisParamTypeClass = IdentifierTypeClass;

/** get の params。0 個 (TS のクラス・オブジェクトのメソッドでは、先頭に this パラメータだけ置ける) */
export type GetterParams = [] | [ThisParamTypeClass];

/** set の params。ちょうど 1 個で rest は不可 (TS のクラス・オブジェクトのメソッドでは、先頭に this パラメータを置ける) */
export type SetterParams<TParam = SetterParamTypeClass> = [TParam] | [ThisParamTypeClass, TParam];

/** set の引数 (関数の引数から RestElement を除いたもの) */
export const setterParamPairs = lazyPairs(
    () =>
        [
            identifierTypePair,
            assignmentPatternTypePair,
            arrayPatternTypePair,
            objectPatternTypePair,
            voidPatternTypePair,
        ] as const,
);

export type SetterParamTypeClass = EvaluatePairInstance<
    ReturnType<typeof setterParamPairs>[number]
>;

/** IR の型で表せない組み合わせ (Babel のエラーからの回復など)。区切りまで IrBuildError を伝える */
export const failUnsupported = (target: Node, originalSource: string, message: string): never => {
    const span = getSourceSpan(target, originalSource);
    throw new IrBuildError(
        new IrError('UNSUPPORTED_CONTEXT', target.type, span.context, message, span),
    );
};

/** あってはならない子 (例: set の returnType) があれば IrBuildError */
export const rejectChild = (
    target: Node,
    child: Node | null | undefined,
    originalSource: string,
    message: string,
): void => {
    if (child != null) {
        failUnsupported(target, originalSource, message);
    }
};

const isThisParam = (param: Node | null | undefined): param is Node & { name: 'this' } =>
    isIdentifier(param) && param.name === 'this';

const createThisParam = (param: Node, originalSource: string): ThisParamTypeClass =>
    visitNode(param, originalSource, [identifierTypePair], 'ThisParam');

/** get の params を作る。数が合わなければ IrBuildError */
export const createGetterParams = (
    target: Node & { params: readonly Node[] },
    originalSource: string,
    visitorName: string,
): GetterParams => {
    const { params } = target;
    if (params.length === 0) {
        return [];
    }
    if (params.length === 1 && isThisParam(params[0])) {
        return [createThisParam(params[0], originalSource)];
    }
    return failUnsupported(target, originalSource, `${visitorName}: get の引数は 0 個です`);
};

/** set の params を作る。数が合わない・rest のとき (paramPairs に合わないとき) は IrBuildError */
export const createSetterParams = <TPair extends AnyEvaluatePair>(
    target: Node & { params: readonly Node[] },
    originalSource: string,
    paramPairs: readonly TPair[],
    visitorName: string,
): SetterParams<EvaluatePairInstance<TPair>> => {
    const { params } = target;
    const name = `${visitorName}.params`;
    if (params.length === 1) {
        return [visitNode(params[0], originalSource, paramPairs, name)];
    }
    if (params.length === 2 && isThisParam(params[0])) {
        return [
            createThisParam(params[0], originalSource),
            visitNode(params[1], originalSource, paramPairs, name),
        ];
    }
    return failUnsupported(target, originalSource, `${visitorName}: set の引数はちょうど 1 個です`);
};
