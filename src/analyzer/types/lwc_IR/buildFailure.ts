import type { Node } from '@babel/types';

import { type ErrorCode, IrBuildError, IrError } from '../commons/ir';
import { getSourceSpan } from './commonVisitor';

/**
 * Babel の AST が、IR の型の前提 (構文上ありえない組み合わせを書けない型) に合わないとき。
 * errorRecovery で回復した AST などで起こる。IrBuildError を投げ、区切り (省略できる子・配列の要素・モジュール) まで伝える
 */
export const failIrBuild = (
    code: ErrorCode,
    ctx: Node,
    originalSource: string,
    message: string,
): never => {
    const span = getSourceSpan(ctx, originalSource);
    throw new IrBuildError(new IrError(code, ctx.type, span.context, message, span));
};

/** 1 個以上の要素を持つ配列 */
export type NonEmptyArray<T> = [T, ...T[]];

/** 配列を NonEmptyArray にする。空なら IrBuildError */
export const toNonEmptyArray = <T>(
    items: readonly T[],
    ctx: Node,
    originalSource: string,
    message: string,
): NonEmptyArray<T> => {
    const [first, ...rest] = items;
    return first === undefined
        ? failIrBuild('TYPE_MISMATCH', ctx, originalSource, message)
        : [first, ...rest];
};
