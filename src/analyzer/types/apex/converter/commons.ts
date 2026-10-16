import typia from 'typia';

import {
    CommonTypeClass,
    ErrorTypeClass,
    SourceSpan,
    SourcePosition,
    ErrorCode,
    isErrorType,
} from '../../apex_IR';

export type ErrorInfo = {
    errorCode: ErrorCode;
    contextType: string;
    context?: string;
    start?: SourcePosition;
    end?: SourcePosition;
};

export const isErrorInfo = typia.createIs<ErrorInfo>();

export type SourceSpanInfo = {
    content?: SourceSpan;
    [key: string]: SourceSpan | SourceSpanInfo | SourceSpanInfo[];
};

export const isSourceSpanInfo = typia.createIs<SourceSpanInfo>();

export type CommonJson<TType extends string> = {
    type: TType;
    sourceSpan: SourceSpanInfo | SourceSpanInfo[];
};

export interface CommonClass<TType extends string, TJSON extends CommonJson<TType>> {
    getType(): TType;
    getSourceSpan(): SourceSpanInfo | SourceSpanInfo[];
    toJson(): TJSON;
    getErrorInfo(): ErrorInfo | ErrorInfo[] | null;
}

export interface ElementClass<
    TType extends string,
    TContent extends CommonClass<TType, CommonJson<TType>>,
> {
    getCommonClass(): TContent;
}

export const toPrimitiveValue = <T>(
    target: unknown,
    isValid: (target: unknown) => target is T,
): T | ErrorInfo => {
    if (isValid(target)) {
        return target;
    }

    if (target instanceof CommonTypeClass && isErrorType(target)) {
        return {
            errorCode: target.getCode(),
            contextType: target.getContextType(),
            context: target.getContext(),
            start: target.getSpan()!.start,
            end: target.getSpan()!.end,
        };
    }

    return {
        errorCode: 'TYPE_MISMATCH',
        contextType: 'unknown',
    };
};

export const toTypeClass = <T extends CommonTypeClass>(
    target: CommonTypeClass,
    isValidType: (target: CommonTypeClass) => target is T,
): T | ErrorInfo => {
    if (isValidType(target)) {
        return target;
    }

    if (isErrorType(target)) {
        return {
            errorCode: target.getCode(),
            contextType: target.getContextType(),
            context: target.getContext(),
            start: target.getSpan()!.start,
            end: target.getSpan()!.end,
        };
    }

    return {
        errorCode: 'TYPE_MISMATCH',
        contextType: target.getType(),
    };
};

