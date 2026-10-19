import {
    NormalLiteralTypeClass,
    SignedIntegerTypeClass,
    SignedNumberTypeClass,
    SoqlLiteralTypeClass,
    SoslLiteralTypeClass,
    SoslLiteralAltTypeClass,
    WhenLiteralTypeClass,
    isNormalLiteralType,
    isSignedIntegerType,
    isSignedNumberType,
    isSoqlLiteralType,
    isSoslLiteralType,
    isSoslLiteralAltType,
    isWhenLiteralType,
} from '../../apex_IR';

import {
    ErrorInfo,
    SourceInfoMap,
    assignMultiClass,
    isErrorInfo,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeErrorInfo,
    makeSourceInfo,
    makeEmptySourceInfoMap,
    makeSingleSourceInfoMap,
    makeArraySourceInfoMap,
} from './commons';

export const makeLiteralRule = (sourceInfo: SourceInfoMap, errorInfo: ErrorInfo[]) => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalLiteralType),
        construct: (normalLiteralTypeClass: NormalLiteralTypeClass) => {
            sourceInfo[normalLiteralTypeClass.getType()] = makeSourceInfo(normalLiteralTypeClass);
            return {
                value: assignMultiClass(normalLiteralTypeClass.getValue(), [
                    {
                        isValid: (target: unknown): target is string => typeof target === 'string',
                        construct: (value: string) => {
                            return value;
                        },
                    },
                    makeErrorAssignRule(errorInfo),
                ]),
                valueType: normalLiteralTypeClass.getType(),
            };
        },
    };
};

export const makeSignedIntegerRule = (sourceInfo: SourceInfoMap, errorInfo: ErrorInfo[]) => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSignedIntegerType),
        construct: (signedIntegerTypeClass: SignedIntegerTypeClass) => {
            sourceInfo[signedIntegerTypeClass.getType()] = makeSourceInfo(signedIntegerTypeClass);
            return {
                value: assignMultiClass(signedIntegerTypeClass.getValue(), [
                    {
                        isValid: (target: unknown): target is string => typeof target === 'string',
                        construct: (value: string) => {
                            return value;
                        },
                    },
                    makeErrorAssignRule(errorInfo),
                ]),
                valueType: signedIntegerTypeClass.getValueType(),
                operator: signedIntegerTypeClass.getOperator(),
            };
        },
    };
};

export const makeSignedNumberRule = (sourceInfo: SourceInfoMap, errorInfo: ErrorInfo[]) => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSignedNumberType),
        construct: (signedNumberTypeClass: SignedNumberTypeClass) => {
            sourceInfo[signedNumberTypeClass.getType()] = makeSourceInfo(signedNumberTypeClass);
            return {
                value: assignMultiClass(signedNumberTypeClass.getValue(), [
                    {
                        isValid: (target: unknown): target is string => typeof target === 'string',
                        construct: (value: string) => {
                            return value;
                        },
                    },
                    makeErrorAssignRule(errorInfo),
                ]),
                valueType: signedNumberTypeClass.getType(),
                operator: signedNumberTypeClass.getOperator(),
            };
        },
    };
};
