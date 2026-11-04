import typia from 'typia';

import {
    ApexCommonTypeClass,
    ApexErrorTypeClass,
    ErrorCode,
    isErrorType as isApexErrorTypeClass,
} from '../../apex_IR';
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

export const isTargetTypeClass = <T extends ApexCommonTypeClass<string>>(
    target: unknown,
    isValid: (target: ApexCommonTypeClass<string>) => target is T,
): target is T => {
    return target instanceof ApexCommonTypeClass && isValid(target);
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
    isValid: (target: unknown) => isTargetTypeClass(target, isApexErrorTypeClass),
    construct: (typeClass: ApexErrorTypeClass) => {
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
        `Unsupported type: ${typeClass instanceof ApexCommonTypeClass ? typeClass.getType() : typeof typeClass}`,
    );
};

