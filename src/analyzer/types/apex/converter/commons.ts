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
export const makeSourceInfo = (typeClass: CommonTypeClass<string>): SourceInfo => {
    const span = typeClass.getSpan()!;
    return { context: span.context, start: span.start, end: span.end };
};

export type CommonType<TName extends string> = {
    type: TName;
    sourceInfo: SourceInfo;
};

// 各 isXxxType は、これで type の存在を確認してからリテラルを比較する
export const isCommonType = (value: unknown): value is CommonType<string> => {
    return (
        typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        typeof value.type === 'string'
    );
};

export type ErrorType = CommonType<'error'> & {
    errorCode: ErrorCode;
    contextType: string;
};

export const isErrorType = (value: unknown): value is ErrorType => {
    return isCommonType(value) && value.type === 'error';
};

export const makeErrorType = (typeClass: ErrorTypeClass): ErrorType => {
    return {
        type: 'error',
        errorCode: typeClass.getCode(),
        contextType: typeClass.getContextType(),
        sourceInfo: makeSourceInfo(typeClass),
    };
};

export const isTargetTypeClass = <T extends CommonTypeClass<string>>(
    target: unknown,
    isValid: (target: CommonTypeClass<string>) => target is T,
): target is T => {
    return target instanceof CommonTypeClass && isValid(target);
};

type AnyAssignRule = {
    isValid: (target: unknown) => target is unknown;
    construct: (target: never) => unknown;
};

export type ValueRuleValue<T> = T | ErrorType;

export type AssignForValueRule<TValue, TResult> = {
    isValid: (target: unknown) => target is TValue;
    construct: (target: TValue) => TResult;
};

export const makeStringAssignRule = {
    isValid: (target: unknown): target is string => typeof target === 'string',
    construct: (value: string) => value,
};

export const makeLimitedStringAssignRule = <const TElement extends string>(
    allowedValues: readonly TElement[],
) => ({
    isValid: (target: unknown): target is TElement =>
        typeof target === 'string' && allowedValues.includes(target as TElement),

    construct: (value: TElement): TElement => value,
});

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
        return makeErrorType(typeClass);
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
