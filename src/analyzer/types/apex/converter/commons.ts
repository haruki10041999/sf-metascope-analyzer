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

export type CommonType = {
    type: string;
    sourceInfo: SourceInfo;
};

export type ErrorInfo = CommonType & {
    type: 'error';
    errorCode: ErrorCode;
    contextType: string;
};

export const isErrorInfo = typia.createIs<ErrorInfo>();
export const makeErrorInfo = (typeClass: ErrorTypeClass): ErrorInfo => {
    return {
        type: 'error',
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

export type ValueRuleValue<T> = T | ErrorInfo;

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

export const makeErrorAssignRule = {
    isValid: (target: unknown) => isTargetTypeClass(target, isErrorTypeClass),
    construct: (typeClass: ErrorTypeClass) => {
        return makeErrorInfo(typeClass);
    },
};

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
