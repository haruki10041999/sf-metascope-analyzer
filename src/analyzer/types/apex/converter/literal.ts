import {
    LiteralTypeClass,
    NormalLiteralTypeClass,
    PrimitiveLiteralTypeClass,
    SignedIntegerTypeClass,
    SignedNumberTypeClass,
    SoqlLiteralTypeClass,
    SoslLiteralAltTypeClass,
    SoslLiteralTypeClass,
    WhenLiteralTypeClass,
    isNormalLiteralType,
    isSignedIntegerType,
    isSignedNumberType,
    isSoqlLiteralType,
    isSoslLiteralAltType,
    isSoslLiteralType,
    isWhenLiteralType,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    assignMultiClass,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeSourceInfo,
    makeEmptySourceInfoMap,
} from './commons';

export type LiteralType = {
    value: ValueRuleValue<string>;
    valueType: string;
};

export const makeLiteralRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalLiteralTypeClass, LiteralType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalLiteralType),
    construct: (literalTypeClass: NormalLiteralTypeClass) => {
        sourceInfo[literalTypeClass.getType()] = makeSourceInfo(literalTypeClass);
        return {
            value: assignMultiClass(literalTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]),
            valueType: literalTypeClass.getValueType(),
        };
    },
});

export type SignLiteralType = {
    value: ValueRuleValue<string>;
    valueType: string;
    operator: string | null;
};

export const makeSignedIntegerRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SignedIntegerTypeClass, SignLiteralType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isSignedIntegerType),
    construct: (literalTypeClass: SignedIntegerTypeClass) => {
        sourceInfo[literalTypeClass.getType()] = makeSourceInfo(literalTypeClass);
        return {
            value: assignMultiClass(literalTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]),
            valueType: literalTypeClass.getValueType(),
            operator: literalTypeClass.getOperator(),
        };
    },
});

export const makeSignedNumberRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SignedNumberTypeClass, SignLiteralType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isSignedNumberType),
    construct: (literalTypeClass: SignedNumberTypeClass) => {
        sourceInfo[literalTypeClass.getType()] = makeSourceInfo(literalTypeClass);
        return {
            value: assignMultiClass(literalTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]),
            valueType: literalTypeClass.getValueType(),
            operator: literalTypeClass.getOperator(),
        };
    },
});

export const makeSoqlLiteralRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoqlLiteralTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlLiteralType),
        construct: (_typeClass: SoqlLiteralTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeSoslLiteralAltRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslLiteralAltTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslLiteralAltType),
        construct: (_typeClass: SoslLiteralAltTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeSoslLiteralRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslLiteralTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslLiteralType),
        construct: (_typeClass: SoslLiteralTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};

export const makeWhenLiteralRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhenLiteralTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhenLiteralType),
        construct: (_typeClass: WhenLiteralTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            throw new Error('Not implemented');
        },
    };
};
