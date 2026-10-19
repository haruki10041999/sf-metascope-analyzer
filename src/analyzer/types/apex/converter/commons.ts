import typia from 'typia';

import {
    CommonTypeClass,
    ErrorTypeClass,
    SourceSpan,
    SourcePosition,
    ErrorCode,
    isErrorType,
    NormalIdTypeClass,
    isNormalIdType,
    AnyIdTypeClass,
    isAnyIdType,
} from '../../apex_IR';

export type SourceInfo = {
    context: string;
    start: SourcePosition;
    end: SourcePosition;
};

export const isSourceInfo = typia.createIs<SourceInfo>();

export const makeSourceInfo = (typeClass: CommonTypeClass): SourceInfo => {
    return {
        context: typeClass.getSpan()!.context,
        start: typeClass.getSpan()!.start,
        end: typeClass.getSpan()!.end,
    };
};

export type SourceInfoMap = {
    [key: string]: string | SourceInfo | SourceInfoMap;
};

export const makeEmptySourceInfoMap = (): SourceInfoMap => {
    return {};
};

export const writeSourceInfo = (
    commonTypeClass: CommonTypeClass,
    target: SourceInfoMap,
    source: SourceInfoMap,
) => {
    let baseKey = commonTypeClass.getType();
    const duplicateKeys = Object.keys(target).filter((key) => key.startsWith(`${baseKey}_`));
    if (duplicateKeys.length > 0) {
        baseKey = `${baseKey}_${duplicateKeys.length}`;
    }

    if (Object.hasOwn(target, baseKey)) {
        const duplicateValue = target[baseKey]!;
        delete target[baseKey];
        target[`${baseKey}_1`] = duplicateValue;
        baseKey = `${baseKey}_2`;
    }

    if (Object.keys(source).length > 0) {
        target[baseKey] = source;
    } else {
        target[baseKey] = makeSourceInfo(commonTypeClass);
    }
};

export type ErrorInfo = {
    errorCode: ErrorCode;
    contextType: string;
    context: string;
    start: SourcePosition;
    end: SourcePosition;
};

export const isErrorInfo = typia.createIs<ErrorInfo>();
export const makeErrorInfo = (typeClass: ErrorTypeClass): ErrorInfo => {
    return {
        errorCode: typeClass.getCode(),
        contextType: typeClass.getContextType(),
        context: typeClass.getContext(),
        start: typeClass.getSpan()!.start,
        end: typeClass.getSpan()!.end,
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

export type ValueRuleValue<T> = T | { errorCode: ErrorCode; index: number } | null;

export type AssignForValueRule<TValue, TResult> = {
    isValid: (target: unknown) => target is TValue;
    construct: (target: TValue) => TResult;
};

export const makeOutputErrorAssignRule = {
    isValid: (target: unknown) => isTargetTypeClass(target, isErrorType),
    construct: (target: ErrorTypeClass): ErrorInfo => {
        return makeErrorInfo(target);
    },
};
export const makeErrorAssignRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ErrorTypeClass, { errorCode: ErrorCode; index: number }> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isErrorType),
    construct: (typeClass: ErrorTypeClass) => {
        const error = makeErrorInfo(typeClass);
        errorInfo.push(error);
        return { errorCode: error.errorCode, index: errorInfo.length };
    },
});

type AssignForValueRuleResult<TRule> =
    TRule extends AssignForValueRule<infer _TValue, infer TResult> ? TResult : never;

export const assignMultiClass = <const TRules extends readonly AnyAssignRule[]>(
    typeClass: unknown,
    isAssignList: TRules,
): AssignForValueRuleResult<TRules[number]> | null => {
    if (typeClass) {
        for (const rule of isAssignList) {
            if (rule.isValid(typeClass)) {
                return rule.construct(typeClass as never) as AssignForValueRuleResult<
                    TRules[number]
                >;
            }
        }
    }

    return null;
};
