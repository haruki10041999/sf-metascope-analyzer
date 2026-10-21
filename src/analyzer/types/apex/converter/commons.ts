import typia from 'typia';

import {
    CommonTypeClass,
    ErrorTypeClass,
    SourcePosition,
    ErrorCode,
    isErrorType as isErrorTypeClass,
} from '../../apex_IR';

export type SourceInfo = {
    context: string;
    start: SourcePosition;
    end: SourcePosition;
};

export const isSourceInfo = typia.createIs<SourceInfo>();

// span は CommonVisitor.visit() が必ず設定する
export const makeSourceInfo = (typeClass: CommonTypeClass): SourceInfo => {
    const span = typeClass.getSpan()!;
    return { context: span.context, start: span.start, end: span.end };
};

export type ErrorInfo = {
    index: number;
    errorCode: ErrorCode;
    contextType: string;
    sourceInfo: SourceInfo;
};

export const isErrorInfo = typia.createIs<ErrorInfo>();
export const makeErrorInfo = (index: number, typeClass: ErrorTypeClass): ErrorInfo => {
    return {
        index: index,
        errorCode: typeClass.getCode(),
        contextType: typeClass.getContextType(),
        sourceInfo: makeSourceInfo(typeClass),
    };
};

export const isTargetTypeClass = <T extends CommonTypeClass>(
    target: unknown,
    isValid: (target: CommonTypeClass) => target is T,
): target is T => {
    return target instanceof CommonTypeClass && isValid(target);
};

type AnyAssignRule = {
    isValid: (target: unknown) => target is unknown;
    construct: (target: never) => unknown;
};

export type ErrorType = {
    errorCode: ErrorCode;
    index: number;
};

export const isErrorType = typia.createIs<ErrorType>();

export type ValueRuleValue<T> = T | ErrorType;

export type CommonType = {
    type: string;
    sourceInfo: SourceInfo;
};

export type AssignForValueRule<TValue, TResult> = {
    isValid: (target: unknown) => target is TValue;
    construct: (target: TValue) => TResult;
};

export const makeStringAssignRule = {
    isValid: (target: unknown): target is string => typeof target === 'string',
    construct: (value: string) => value,
};

export const makeNumberAssignRule = {
    isValid: (target: unknown): target is number => typeof target === 'number',
    construct: (value: number) => value,
};

export const makeNullAssignRule = {
    isValid: (target: unknown): target is null => target === null,
    construct: (value: null) => value,
};

export const makeErrorAssignRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ErrorTypeClass, ErrorType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isErrorTypeClass),
    construct: (typeClass: ErrorTypeClass) => {
        const index = errorInfo.length + 1;
        const error = makeErrorInfo(index, typeClass);
        errorInfo.push(error);
        return { errorCode: error.errorCode, index: index };
    },
});

type AssignForValueRuleResult<TRule> =
    TRule extends AssignForValueRule<infer _TValue, infer TResult> ? TResult : never;

export const assignMultiClass = <const TRules extends readonly AnyAssignRule[]>(
    typeClass: unknown,
    isAssignList: TRules,
): AssignForValueRuleResult<TRules[number]> => {
    for (const rule of isAssignList) {
        if (rule.isValid(typeClass)) {
            return rule.construct(typeClass as never) as AssignForValueRuleResult<TRules[number]>;
        }
    }

    throw new Error(
        `Unsupported type: ${typeClass instanceof CommonTypeClass ? typeClass.getType() : typeof typeClass}`,
    );
};

