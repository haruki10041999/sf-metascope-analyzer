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
    [key: string]: string | SourceSpan | SourceSpanInfo | SourceSpanInfo[];
};

export const isSourceSpanInfo = typia.createIs<SourceSpanInfo>();

export type CommonJson<TType extends string> = {
    type: TType;
    sourceSpan: SourceSpanInfo | SourceSpanInfo[];
};

export interface CommonClass<TType extends string, TJSON extends CommonJson<TType>> {
    getType(): TType;
    getSourceSpan(): SourceSpanInfo | SourceSpanInfo[];
    getErrorInfo(): ErrorInfo | ErrorInfo[] | null;
    toJson(): TJSON;
}

export abstract class CommonBaseClass<
    TType extends string,
    TJSON extends CommonJson<TType>,
> implements CommonClass<TType, TJSON> {
    private readonly type: TType;
    private readonly sourceSpanInfo: SourceSpan | SourceSpanInfo | SourceSpanInfo[];
    private readonly errorInfo: ErrorInfo | ErrorInfo[] | null;

    constructor(
        type: TType,
        sourceSpanInfo: SourceSpan | SourceSpanInfo | SourceSpanInfo[],
        errorInfo: ErrorInfo | ErrorInfo[] | null,
    ) {
        this.type = type;
        this.sourceSpanInfo = sourceSpanInfo;
        this.errorInfo = errorInfo;
    }

    getType(): TType {
        return this.type;
    }
    getSourceSpan(): SourceSpanInfo | SourceSpanInfo[] {
        if (Array.isArray(this.sourceSpanInfo)) {
            return this.sourceSpanInfo;
        } else if (isSourceSpanInfo(this.sourceSpanInfo)) {
            return this.sourceSpanInfo;
        } else {
            return { content: this.sourceSpanInfo };
        }
    }
    getErrorInfo(): ErrorInfo | ErrorInfo[] | null {
        return this.errorInfo;
    }
    abstract toJson(): TJSON;
}

export interface ElementClass<TRules extends readonly AnyAssignRule[]> {
    getCommonClass(): AssignForElementClassRuleResult<TRules[number]>;
}

export class ElementBaseClass<
    const TCommonTypeClasses extends readonly CommonTypeClass[],
    const TRules extends readonly AnyAssignRule[],
> implements ElementClass<TRules> {
    private readonly commonClass: AssignForElementClassRuleResult<TRules[number]>;

    constructor(target: TCommonTypeClasses[number], elementRule: TRules) {
        this.commonClass = assignClassToElementClass(target, elementRule);
    }

    getCommonClass(): AssignForElementClassRuleResult<TRules[number]> {
        return this.commonClass;
    }
}

export const assignElementClass = <
    TTarget extends CommonTypeClass,
    const TRules extends readonly AnyAssignRule[],
>(
    target: CommonTypeClass,
    isValid: (target: CommonTypeClass) => target is TTarget,
    elementRule: TRules,
): AssignForElementClassRuleResult<TRules[number]> | ErrorInfo => {
    const elementClass = toTypeClass(target, isValid);

    if (isErrorInfo(elementClass)) {
        return elementClass;
    }

    return new ElementBaseClass<[TTarget], TRules>(elementClass, elementRule).getCommonClass();
};

export const assignElementClassWithNull = <
    TTarget extends CommonTypeClass,
    const TRules extends readonly AnyAssignRule[],
>(
    target: unknown,
    isValid: (target: CommonTypeClass) => target is TTarget,
    elementRule: TRules,
): AssignForElementClassRuleResult<TRules[number]> | ErrorInfo | null => {
    if (target instanceof CommonTypeClass) {
        const elementClass = toTypeClass(target, isValid);

        if (isErrorInfo(elementClass)) {
            return elementClass;
        }

        return new ElementBaseClass<[TTarget], TRules>(elementClass, elementRule).getCommonClass();
    }

    return null;
};

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

export const isTargetTypeClass = <T extends CommonTypeClass>(
    target: unknown,
    isValid: (target: CommonTypeClass) => target is T,
): target is T => {
    return target instanceof CommonTypeClass && isValid(target);
};

export const assignClass = <
    TType extends string,
    TJson extends CommonJson<TType>,
    TParam extends CommonTypeClass,
    TClass extends CommonClass<TType, TJson>,
>(
    typeClass: unknown,
    isValid: (target: unknown) => target is TParam,
    construct: (typeClass: TParam) => TClass,
): TClass | ErrorInfo => {
    if (typeClass) {
        if (isValid(typeClass)) {
            return construct(typeClass);
        }

        if (isTargetTypeClass(typeClass, isErrorType)) {
            return {
                errorCode: typeClass.getCode(),
                contextType: typeClass.getContextType(),
                context: typeClass.getContext(),
                start: typeClass.getSpan()!.start,
                end: typeClass.getSpan()!.end,
            };
        }
    }

    return {
        errorCode: 'TYPE_MISMATCH',
        contextType:
            typeClass instanceof CommonTypeClass
                ? typeClass.getType()
                : typeof typeClass === 'string'
                  ? typeClass
                  : typeof typeClass === 'number'
                    ? String(typeClass)
                    : typeof typeClass === 'boolean'
                      ? String(typeClass)
                      : typeClass === null
                        ? 'null'
                        : 'unknown ',
    };
};

export const assignClassArray = <
    TType extends string,
    TJson extends CommonJson<TType>,
    TParam extends CommonTypeClass,
    TClass extends CommonClass<TType, TJson>,
>(
    typeClassArray: unknown[],
    isValid: (target: unknown) => target is TParam,
    construct: (typeClass: TParam) => TClass,
): (TClass | ErrorInfo)[] => {
    return typeClassArray.map((typeClass) => assignClass(typeClass, isValid, construct));
};

export const assignClassWithNull = <
    TType extends string,
    TJson extends CommonJson<TType>,
    TParam extends CommonTypeClass,
    TClass extends CommonClass<TType, TJson>,
>(
    typeClass: unknown | null,
    isValid: (target: unknown) => target is TParam,
    construct: (typeClass: TParam) => TClass,
): TClass | ErrorInfo | null => {
    if (typeClass) {
        if (isValid(typeClass)) {
            return construct(typeClass);
        }

        if (isTargetTypeClass(typeClass, isErrorType)) {
            return {
                errorCode: typeClass.getCode(),
                contextType: typeClass.getContextType(),
                context: typeClass.getContext(),
                start: typeClass.getSpan()!.start,
                end: typeClass.getSpan()!.end,
            };
        }
    }

    return null;
};

type AnyAssignRule = {
    isValid: (target: unknown) => target is unknown;
    construct: (target: never) => unknown;
};

export type AssignForElementClassRule<
    TClass extends CommonTypeClass,
    TType extends string,
    TJson extends CommonJson<TType>,
> = {
    isValid: (target: unknown) => target is TClass;
    construct: (target: TClass) => CommonClass<TType, TJson>;
};

type AssignForElementClassRuleResult<TRule> = TRule extends {
    construct: (target: never) => infer TResult;
}
    ? TResult
    : never;

export const assignClassToElementClass = <const TRules extends readonly AnyAssignRule[]>(
    typeClass: CommonTypeClass,
    isAssignList: TRules,
): AssignForElementClassRuleResult<TRules[number]> => {
    for (const rule of isAssignList) {
        if (rule.isValid(typeClass)) {
            return rule.construct(typeClass as never) as AssignForElementClassRuleResult<
                TRules[number]
            >;
        }
    }

    throw new Error('unsupported TypeClass');
};

export type AssignForValueRule<TValue, TResult> = {
    isValid: (target: unknown) => target is TValue;
    construct: (target: TValue) => TResult;
};

type AssignForValueRuleResult<TRule> =
    TRule extends AssignForValueRule<infer _TValue, infer TResult> ? TResult : never;

export const assignMultiClass = <const TRules extends readonly AnyAssignRule[]>(
    typeClass: unknown,
    isAssignList: TRules,
): AssignForValueRuleResult<TRules[number]> | ErrorInfo => {
    for (const rule of isAssignList) {
        if (rule.isValid(typeClass)) {
            return rule.construct(typeClass as never) as AssignForValueRuleResult<TRules[number]>;
        }
    }

    if (isTargetTypeClass(typeClass, isErrorType)) {
        return {
            errorCode: typeClass.getCode(),
            contextType: typeClass.getContextType(),
            context: typeClass.getContext(),
            start: typeClass.getSpan()!.start,
            end: typeClass.getSpan()!.end,
        };
    }

    return {
        errorCode: 'TYPE_MISMATCH',
        contextType:
            typeClass instanceof CommonTypeClass
                ? typeClass.getType()
                : typeof typeClass === 'string'
                  ? typeClass
                  : typeof typeClass === 'number' || typeof typeClass === 'boolean'
                    ? String(typeClass)
                    : typeClass === null
                      ? 'null'
                      : 'unknown',
    };
};

export const assignMultiClassWithNull = <const TRules extends readonly AnyAssignRule[]>(
    typeClass: unknown,
    isAssignList: TRules,
): AssignForValueRuleResult<TRules[number]> | ErrorInfo | null => {
    if (typeClass) {
        for (const rule of isAssignList) {
            if (rule.isValid(typeClass)) {
                return rule.construct(typeClass as never) as AssignForValueRuleResult<
                    TRules[number]
                >;
            }
        }

        if (isTargetTypeClass(typeClass, isErrorType)) {
            return {
                errorCode: typeClass.getCode(),
                contextType: typeClass.getContextType(),
                context: typeClass.getContext(),
                start: typeClass.getSpan()!.start,
                end: typeClass.getSpan()!.end,
            };
        }
    }

    return null;
};
