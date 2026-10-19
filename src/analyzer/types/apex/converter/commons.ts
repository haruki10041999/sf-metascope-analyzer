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
    [key: string]: SourceInfo | SourceInfoMap;
};

export const makeEmptySourceInfoMap = (): SourceInfoMap => {
    return {};
};

export const makeSingleSourceInfoMap = (target: CommonTypeClass): SourceInfoMap => {
    const sourceInfoMap = makeEmptySourceInfoMap();
    sourceInfoMap[target.getType()] = makeSourceInfo(target);
    return sourceInfoMap;
};

export const makeArraySourceInfoMap = (targets: CommonTypeClass[]): SourceInfoMap => {
    const sourceInfoMap = makeEmptySourceInfoMap();
    targets.forEach((target, index) => {
        sourceInfoMap[`${target.getType()}_${index}`] = makeSourceInfo(target);
    });
    return sourceInfoMap;
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

export type AssignForValueRule<TValue, TResult> = {
    isValid: (target: unknown) => target is TValue;
    construct: (target: TValue) => TResult | void;
};

export const makeOutputErrorAssignRule = {
    isValid: (target: unknown) => isTargetTypeClass(target, isErrorType),
    construct: (target: ErrorTypeClass): ErrorInfo => {
        return makeErrorInfo(target);
    },
};
export const makeErrorAssignRule = (errorInfo: ErrorInfo[]) => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isErrorType),
    construct: (typeClass: ErrorTypeClass): void => {
        errorInfo.push(makeErrorInfo(typeClass));
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

export const makeIdRule = (sourceInfo: SourceInfoMap) => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalIdType),
        construct: (idTypeClass: NormalIdTypeClass) => {
            sourceInfo[idTypeClass.getType()] = makeSingleSourceInfoMap(idTypeClass);
            return idTypeClass.getValue();
        },
    };
};

export const makeAnyIdRule = (sourceInfo: SourceInfoMap) => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isAnyIdType),
        construct: (idTypeClass: AnyIdTypeClass) => {
            sourceInfo[idTypeClass.getType()] = makeSingleSourceInfoMap(idTypeClass);
            return idTypeClass.getValue();
        },
    };
};

