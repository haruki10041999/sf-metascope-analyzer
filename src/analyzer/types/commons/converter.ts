// converter (IR → CommonType) の出力の共通の型。Apex (types/apex/converter) と LWC (types/lwc/converter) で同じ形にする。
// CommonType は { type, sourceInfo, ...フィールド } の素のオブジェクトで、このあと JSON を作るときに sourceInfo を
// sourceKeys と sourceObject に分ける
import typia from 'typia';

import type { SourcePosition } from './source';

/** ノードのソース位置 (LWC はファイルのパスを足した LwcSourceInfo) */
export type SourceInfo = {
    context: string;
    start: SourcePosition;
    end: SourcePosition;
};

export type CommonType<TName extends string> = {
    type: TName;
    sourceInfo: SourceInfo;
};

// CommonType かどうかの実行時の判定 (JSON への変換で、ノードとそれ以外の値を分ける)
export const isCommonType = typia.createIs<CommonType<string>>();

/** IR を作れなかった理由 (apex_IR / lwc_IR の ErrorTypeClass の code) */
export type ConvertErrorCode =
    'NULL_CHILD' | 'UNSUPPORTED_CONTEXT' | 'TYPE_MISMATCH' | 'EXCEPTION' | 'UNRESOLVED';

/** IR を作れなかったノード (ErrorTypeClass) の CommonType */
export type ErrorType = CommonType<'error'> & {
    errorCode: ConvertErrorCode;
    contextType: string;
};

/** 子の値 (IR を作れなかったところは ErrorType) */
export type ValueRuleValue<T> = T | ErrorType;
