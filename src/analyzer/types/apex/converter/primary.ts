import typia from 'typia';

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
    isIdPrimaryType as isIdPrimaryTypeClass,
    isLiteralPrimaryType as isLiteralPrimaryTypeClass,
    isNormalPrimaryType,
    isSoqlPrimaryType as isSoqlPrimaryTypeClass,
    isSoslPrimaryType as isSoslPrimaryTypeClass,
    isSuperPrimaryType as isSuperPrimaryTypeClass,
    isThisPrimaryType as isThisPrimaryTypeClass,
    isTypeRefPrimaryType as isTypeRefPrimaryTypeClass,
    isVoidPrimaryType as isVoidPrimaryTypeClass,
} from '../../apex_IR';

import {
    ErrorInfo,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    assignMultiClass,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeSourceInfo,
    makeStringAssignRule,
} from './commons';
import { makeIdRule, IdType } from './id';
import {
    makeLiteralRule,
    makeSoqlLiteralRule,
    makeSoslLiteralRule,
    LiteralType,
    SoqlLiteralType,
    SoslLiteralType,
} from './literal';
import { makeTypeRefRule, TypeRefType } from './type';

export type IdPrimaryType = CommonType & {
    value: ValueRuleValue<IdType>;
};

export const isIdPrimaryType = typia.createIs<IdPrimaryType>();

export const makeIdPrimaryRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<IdPrimaryTypeClass, IdPrimaryType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isIdPrimaryTypeClass),
    construct: (primaryTypeClass: IdPrimaryTypeClass) => {
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            makeIdRule(),
            makeErrorAssignRule(errorInfo),
        ]);
        return {
            type: primaryTypeClass.getType(),
            sourceInfo: makeSourceInfo(primaryTypeClass),
            value,
        };
    },
});

export type LiteralPrimaryType = CommonType & {
    value: ValueRuleValue<LiteralType>;
};

export const isLiteralPrimaryType = typia.createIs<LiteralPrimaryType>();

export const makeLiteralPrimaryRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<LiteralPrimaryTypeClass, LiteralPrimaryType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isLiteralPrimaryTypeClass),
    construct: (primaryTypeClass: LiteralPrimaryTypeClass) => {
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            makeLiteralRule(errorInfo),
            makeErrorAssignRule(errorInfo),
        ]);
        return {
            type: primaryTypeClass.getType(),
            sourceInfo: makeSourceInfo(primaryTypeClass),
            value,
        };
    },
});

export type PrimaryType = CommonType & {
    value: ValueRuleValue<string>;
};

export const isPrimaryType = typia.createIs<PrimaryType>();

export const makePrimaryRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalPrimaryTypeClass, PrimaryType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalPrimaryType),
    construct: (primaryTypeClass: NormalPrimaryTypeClass) => {
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            makeStringAssignRule,
            makeErrorAssignRule(errorInfo),
        ]);
        return {
            type: primaryTypeClass.getType(),
            sourceInfo: makeSourceInfo(primaryTypeClass),
            value,
        };
    },
});

export type SoqlPrimaryType = CommonType & {
    value: ValueRuleValue<SoqlLiteralType>;
};

export const isSoqlPrimaryType = typia.createIs<SoqlPrimaryType>();

export const makeSoqlPrimaryRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoqlPrimaryTypeClass, SoqlPrimaryType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlPrimaryTypeClass),
        construct: (primaryTypeClass: SoqlPrimaryTypeClass) => {
            const value = assignMultiClass(primaryTypeClass.getValue(), [
                makeSoqlLiteralRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: primaryTypeClass.getType(),
                sourceInfo: makeSourceInfo(primaryTypeClass),
                value,
            };
        },
    };
};

export type SoslPrimaryType = CommonType & {
    value: ValueRuleValue<SoslLiteralType>;
};

export const isSoslPrimaryType = typia.createIs<SoslPrimaryType>();

export const makeSoslPrimaryRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslPrimaryTypeClass, SoslPrimaryType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslPrimaryTypeClass),
        construct: (primaryTypeClass: SoslPrimaryTypeClass) => {
            const value = assignMultiClass(primaryTypeClass.getValue(), [
                makeSoslLiteralRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: primaryTypeClass.getType(),
                sourceInfo: makeSourceInfo(primaryTypeClass),
                value,
            };
        },
    };
};

export type SuperPrimaryType = CommonType & {
    value: ValueRuleValue<string>;
};

export const isSuperPrimaryType = typia.createIs<SuperPrimaryType>();

export const makeSuperPrimaryRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<SuperPrimaryTypeClass, SuperPrimaryType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isSuperPrimaryTypeClass),
    construct: (primaryTypeClass: SuperPrimaryTypeClass) => {
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            makeStringAssignRule,
            makeErrorAssignRule(errorInfo),
        ]);
        return {
            type: primaryTypeClass.getType(),
            sourceInfo: makeSourceInfo(primaryTypeClass),
            value,
        };
    },
});

export type ThisPrimaryType = CommonType & {
    value: ValueRuleValue<string>;
};

export const isThisPrimaryType = typia.createIs<ThisPrimaryType>();

export const makeThisPrimaryRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ThisPrimaryTypeClass, ThisPrimaryType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isThisPrimaryTypeClass),
    construct: (primaryTypeClass: ThisPrimaryTypeClass) => {
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            makeStringAssignRule,
            makeErrorAssignRule(errorInfo),
        ]);
        return {
            type: primaryTypeClass.getType(),
            sourceInfo: makeSourceInfo(primaryTypeClass),
            value,
        };
    },
});

export type TypeRefPrimaryType = CommonType & {
    value: ValueRuleValue<TypeRefType>;
};

export const isTypeRefPrimaryType = typia.createIs<TypeRefPrimaryType>();

export const makeTypeRefPrimaryRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeRefPrimaryTypeClass, TypeRefPrimaryType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeRefPrimaryTypeClass),
        construct: (primaryTypeClass: TypeRefPrimaryTypeClass) => {
            const value = assignMultiClass(primaryTypeClass.getValue(), [
                makeTypeRefRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: primaryTypeClass.getType(),
                sourceInfo: makeSourceInfo(primaryTypeClass),
                value,
            };
        },
    };
};

export type VoidPrimaryType = CommonType & {
    value: ValueRuleValue<string>;
};

export const isVoidPrimaryType = typia.createIs<VoidPrimaryType>();

export const makeVoidPrimaryRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<VoidPrimaryTypeClass, VoidPrimaryType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isVoidPrimaryTypeClass),
    construct: (primaryTypeClass: VoidPrimaryTypeClass) => {
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            makeStringAssignRule,
            makeErrorAssignRule(errorInfo),
        ]);
        return {
            type: primaryTypeClass.getType(),
            sourceInfo: makeSourceInfo(primaryTypeClass),
            value,
        };
    },
});

export type BasePrimaryType =
    | IdPrimaryType
    | LiteralPrimaryType
    | SoqlPrimaryType
    | SoslPrimaryType
    | TypeRefPrimaryType
    | VoidPrimaryType
    | SuperPrimaryType
    | ThisPrimaryType
    | PrimaryType;

export const isBasePrimaryType = typia.createIs<BasePrimaryType>();

export const makeBasePrimaryRule = (errorInfo: ErrorInfo[]) => {
    return [
        makeIdPrimaryRule(errorInfo),
        makePrimaryRule(errorInfo),
        makeVoidPrimaryRule(errorInfo),
        makeSuperPrimaryRule(errorInfo),
        makeThisPrimaryRule(errorInfo),
        makeLiteralPrimaryRule(errorInfo),
        makeTypeRefPrimaryRule(errorInfo),
        makeSoqlPrimaryRule(errorInfo),
        makeSoslPrimaryRule(errorInfo),
    ];
};
