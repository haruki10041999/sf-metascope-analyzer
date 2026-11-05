// Apex の converter で共通の型と部品。IR → CommonType の変換は generic.ts (1 つの変換)
import typia from 'typia';

import { ApexCommonTypeClass, ApexErrorTypeClass, ErrorCode } from '../../apex_IR';
import { SourcePosition } from '../../commons/source';

export type SourceInfo = {
    context: string;
    start: SourcePosition;
    end: SourcePosition;
};

export const isSourceInfo = typia.createIs<SourceInfo>();

// span は ApexCommonVisitor.visit() が必ず設定する
export const makeSourceInfo = (typeClass: ApexCommonTypeClass<string>): SourceInfo => {
    const span = typeClass.getSpan()!;
    return { context: span.context, start: span.start, end: span.end };
};

export type CommonType<TName extends string> = {
    type: TName;
    sourceInfo: SourceInfo;
};

// 各 isXxxType は、これで type の存在を確認してからリテラルを比較する
export const isCommonType = typia.createIs<CommonType<string>>();

export type ErrorType = CommonType<'error'> & {
    errorCode: ErrorCode;
    contextType: string;
};

export const isErrorType = (value: unknown): value is ErrorType => {
    return isCommonType(value) && value.type === 'error';
};

export const makeErrorType = (typeClass: ApexErrorTypeClass): ErrorType => {
    return {
        type: 'error',
        errorCode: typeClass.getCode(),
        contextType: typeClass.getContextType(),
        sourceInfo: makeSourceInfo(typeClass),
    };
};

/** 子の値 (IR を作れなかったところは ErrorType) */
export type ValueRuleValue<T> = T | ErrorType;
