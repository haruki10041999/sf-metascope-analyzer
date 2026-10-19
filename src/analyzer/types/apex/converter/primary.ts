import { ne } from 'zod/v4/locales';
import {
    IdPrimaryTypeClass,
    LiteralPrimaryTypeClass,
    NormalPrimaryTypeClass,
    SoqlPrimaryTypeClass,
    SoslPrimaryTypeClass,
    SuperPrimaryTypeClass,
    ThisPrimaryTypeClass,
    TypeRefPrimaryTypeClass,
    VoidPrimaryTypeClass,
    isIdPrimaryType,
    isLiteralPrimaryType,
    isNormalPrimaryType,
    isSoqlPrimaryType,
    isSoslPrimaryType,
    isSuperPrimaryType,
    isThisPrimaryType,
    isTypeRefPrimaryType,
    isVoidPrimaryType,
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
import { makeIdRule } from './id';
import {
    makeLiteralRule,
    makeSoqlLiteralRule,
    makeSoslLiteralAltRule,
    makeSoslLiteralRule,
} from './literal';
import { makeTypeRefRule } from './type';

export const makeIdPrimaryRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<IdPrimaryTypeClass, ValueRuleValue<string>> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isIdPrimaryType),
    construct: (primaryTypeClass: IdPrimaryTypeClass) => {
        const nestedSourceInfo = makeEmptySourceInfoMap();
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            makeIdRule(nestedSourceInfo),
            makeErrorAssignRule(errorInfo),
        ]);
        sourceInfo[primaryTypeClass.getType()] = nestedSourceInfo;
        return value;
    },
});

export const makeLiteralPrimaryRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<
    LiteralPrimaryTypeClass,
    ValueRuleValue<{ value: ValueRuleValue<string>; valueType: string }>
> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isLiteralPrimaryType),
    construct: (primaryTypeClass: LiteralPrimaryTypeClass) => {
        const nestedSourceInfo = makeEmptySourceInfoMap();
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            makeLiteralRule(nestedSourceInfo, errorInfo),
            makeErrorAssignRule(errorInfo),
        ]);
        sourceInfo[primaryTypeClass.getType()] = nestedSourceInfo;
        return value;
    },
});

export const makePrimaryRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalPrimaryTypeClass, ValueRuleValue<string>> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalPrimaryType),
    construct: (primaryTypeClass: NormalPrimaryTypeClass) =>
        assignMultiClass(primaryTypeClass.getValue(), [
            {
                isValid: (target: unknown): target is string => typeof target === 'string',
                construct: (value: string) => {
                    sourceInfo[primaryTypeClass.getType()] = makeSourceInfo(primaryTypeClass);
                    return value;
                },
            },
            makeErrorAssignRule(errorInfo),
        ]),
});

export const makeSoqlPrimaryRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoqlPrimaryTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlPrimaryType),
        construct: (primaryTypeClass: SoqlPrimaryTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(primaryTypeClass.getValue(), [
                makeSoqlLiteralRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[primaryTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeSoslPrimaryRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslPrimaryTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslPrimaryType),
        construct: (primaryTypeClass: SoslPrimaryTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(primaryTypeClass.getValue(), [
                makeSoslLiteralRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[primaryTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeSuperPrimaryRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SuperPrimaryTypeClass, ValueRuleValue<string>> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isSuperPrimaryType),
    construct: (primaryTypeClass: SuperPrimaryTypeClass) =>
        assignMultiClass(primaryTypeClass.getValue(), [
            {
                isValid: (target: unknown): target is string => typeof target === 'string',
                construct: (value: string) => {
                    sourceInfo[primaryTypeClass.getType()] = makeSourceInfo(primaryTypeClass);
                    return value;
                },
            },
            makeErrorAssignRule(errorInfo),
        ]),
});

export const makeThisPrimaryRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ThisPrimaryTypeClass, ValueRuleValue<string>> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isThisPrimaryType),
    construct: (primaryTypeClass: ThisPrimaryTypeClass) =>
        assignMultiClass(primaryTypeClass.getValue(), [
            {
                isValid: (target: unknown): target is string => typeof target === 'string',
                construct: (value: string) => {
                    sourceInfo[primaryTypeClass.getType()] = makeSourceInfo(primaryTypeClass);
                    return value;
                },
            },
            makeErrorAssignRule(errorInfo),
        ]),
});

export const makeTypeRefPrimaryRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeRefPrimaryTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeRefPrimaryType),
        construct: (primaryTypeClass: TypeRefPrimaryTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(primaryTypeClass.getValue(), [
                makeTypeRefRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[primaryTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeVoidPrimaryRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<VoidPrimaryTypeClass, ValueRuleValue<string>> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isVoidPrimaryType),
    construct: (primaryTypeClass: VoidPrimaryTypeClass) =>
        assignMultiClass(primaryTypeClass.getValue(), [
            {
                isValid: (target: unknown): target is string => typeof target === 'string',
                construct: (value: string) => {
                    sourceInfo[primaryTypeClass.getType()] = makeSourceInfo(primaryTypeClass);
                    return value;
                },
            },
            makeErrorAssignRule(errorInfo),
        ]),
});

export const makeBasePrimaryRule = (sourceInfo: SourceInfoMap, errorInfo: ErrorInfo[]) => {
    return [
        makeIdPrimaryRule(sourceInfo, errorInfo),
        makePrimaryRule(sourceInfo, errorInfo),
        makeVoidPrimaryRule(sourceInfo, errorInfo),
        makeSuperPrimaryRule(sourceInfo, errorInfo),
        makeThisPrimaryRule(sourceInfo, errorInfo),
        makeLiteralPrimaryRule(sourceInfo, errorInfo),
        makeTypeRefPrimaryRule(sourceInfo, errorInfo),
        makeSoqlPrimaryRule(sourceInfo, errorInfo),
        makeSoslPrimaryRule(sourceInfo, errorInfo),
    ];
};
