import {
    NormalPrimaryTypeClass,
    ThisPrimaryTypeClass,
    VoidPrimaryTypeClass,
    SuperPrimaryTypeClass,
    IdPrimaryTypeClass,
    TypeRefPrimaryTypeClass,
    LiteralPrimaryTypeClass,
    SoqlPrimaryTypeClass,
    SoslPrimaryTypeClass,
    BasedPrimaryTypeClass,
    NormalIdTypeClass,
    isNormalPrimaryType,
    isThisPrimaryType,
    isVoidPrimaryType,
    isSuperPrimaryType,
    isTypeRefPrimaryType,
    isIdPrimaryType,
    isLiteralPrimaryType,
    isSoqlPrimaryType,
    isSoslPrimaryType,
    isNormalIdType,
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
import { makeIdRule } from './id';
import { makeLiteralRule } from './literal';

export const makePrimaryRule = (sourceInfo: SourceInfoMap, errorInfo: ErrorInfo[]) => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalPrimaryType),
        construct: (primaryTypeClass: NormalPrimaryTypeClass) => {
            return assignMultiClass(primaryTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => {
                        sourceInfo[primaryTypeClass.getType()] = makeSourceInfo(primaryTypeClass);
                        return value;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
        },
    };
};

export const makeThisPrimaryRule = (sourceInfo: SourceInfoMap, errorInfo: ErrorInfo[]) => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isThisPrimaryType),
        construct: (thisPrimaryTypeClass: ThisPrimaryTypeClass) => {
            return assignMultiClass(thisPrimaryTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => {
                        sourceInfo[thisPrimaryTypeClass.getType()] =
                            makeSourceInfo(thisPrimaryTypeClass);
                        return value;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
        },
    };
};

export const makeSuperPrimaryRule = (sourceInfo: SourceInfoMap, errorInfo: ErrorInfo[]) => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSuperPrimaryType),
        construct: (superPrimaryTypeClass: SuperPrimaryTypeClass) => {
            return assignMultiClass(superPrimaryTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => {
                        sourceInfo[superPrimaryTypeClass.getType()] =
                            makeSourceInfo(superPrimaryTypeClass);
                        return value;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
        },
    };
};

export const makeIdPrimaryRule = (sourceInfo: SourceInfoMap, errorInfo: ErrorInfo[]) => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isIdPrimaryType),
        construct: (idPrimaryTypeClass: IdPrimaryTypeClass) => {
            const idPrimaryType = idPrimaryTypeClass.getType();
            const idPrimarySourceInfo = makeEmptySourceInfoMap();
            const idPrimary = assignMultiClass(idPrimaryTypeClass.getValue(), [
                makeIdRule(idPrimarySourceInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[idPrimaryType] = idPrimarySourceInfo;
            return idPrimary;
        },
    };
};

export const makeLiteralPrimaryRule = (sourceInfo: SourceInfoMap, errorInfo: ErrorInfo[]) => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLiteralPrimaryType),
        construct: (literalPrimaryTypeClass: LiteralPrimaryTypeClass) => {
            const literalPrimaryType = literalPrimaryTypeClass.getType();
            const literalPrimarySourceInfo = makeEmptySourceInfoMap();
            const literal = assignMultiClass(literalPrimaryTypeClass.getValue(), [
                makeLiteralRule(literalPrimarySourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[literalPrimaryType] = literalPrimarySourceInfo;
            return literal;
        },
    };
};

export const makeBasedPrimaryRule = (sourceInfo: SourceInfoMap, errorInfo: ErrorInfo[]) => {
    return [
        makePrimaryRule(sourceInfo, errorInfo),
        makeThisPrimaryRule(sourceInfo, errorInfo),
        makeSuperPrimaryRule(sourceInfo, errorInfo),
        makeIdPrimaryRule(sourceInfo, errorInfo),
        makeLiteralPrimaryRule(sourceInfo, errorInfo),
    ];
};
