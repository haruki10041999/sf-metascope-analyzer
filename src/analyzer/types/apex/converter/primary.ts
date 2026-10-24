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
    isCommonType,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    assignMultiClass,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeSourceInfo,
    makeStringAssignRule,
} from './commons';
import { makeIdAssignRule, IdType } from './id';
import {
    makeLiteralAssignRule,
    makeSoqlLiteralAssignRule,
    makeSoslLiteralAssignRule,
    LiteralType,
    SoqlLiteralType,
    SoslLiteralType,
} from './literal';
import { makeTypeRefAssignRule, TypeRefType } from './type';

export type IdPrimaryType = CommonType<'idPrimary'> & {
    value: ValueRuleValue<IdType>;
};

export const isIdPrimaryType = (value: unknown): value is IdPrimaryType => {
    return isCommonType(value) && value.type === 'idPrimary';
};

export const makeIdPrimaryAssignRule: AssignForValueRule<IdPrimaryTypeClass, IdPrimaryType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isIdPrimaryTypeClass),
    construct: (primaryTypeClass: IdPrimaryTypeClass) => {
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            makeIdAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: primaryTypeClass.getType(),
            sourceInfo: makeSourceInfo(primaryTypeClass),
            value,
        };
    },
};

export type LiteralPrimaryType = CommonType<'literalPrimary'> & {
    value: ValueRuleValue<LiteralType>;
};

export const isLiteralPrimaryType = (value: unknown): value is LiteralPrimaryType => {
    return isCommonType(value) && value.type === 'literalPrimary';
};

export const makeLiteralPrimaryAssignRule: AssignForValueRule<
    LiteralPrimaryTypeClass,
    LiteralPrimaryType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isLiteralPrimaryTypeClass),
    construct: (primaryTypeClass: LiteralPrimaryTypeClass) => {
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            makeLiteralAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: primaryTypeClass.getType(),
            sourceInfo: makeSourceInfo(primaryTypeClass),
            value,
        };
    },
};

export type PrimaryType = CommonType<'primary'> & {
    value: string;
};

export const isPrimaryType = (value: unknown): value is PrimaryType => {
    return isCommonType(value) && value.type === 'primary';
};

export const makePrimaryAssignRule: AssignForValueRule<NormalPrimaryTypeClass, PrimaryType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalPrimaryType),
    construct: (primaryTypeClass: NormalPrimaryTypeClass) => {
        return {
            type: primaryTypeClass.getType(),
            sourceInfo: makeSourceInfo(primaryTypeClass),
            value: primaryTypeClass.getValue(),
        };
    },
};

export type SoqlPrimaryType = CommonType<'soqlPrimary'> & {
    value: ValueRuleValue<SoqlLiteralType>;
};

export const isSoqlPrimaryType = (value: unknown): value is SoqlPrimaryType => {
    return isCommonType(value) && value.type === 'soqlPrimary';
};

export const makeSoqlPrimaryAssignRule: AssignForValueRule<SoqlPrimaryTypeClass, SoqlPrimaryType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlPrimaryTypeClass),
        construct: (primaryTypeClass: SoqlPrimaryTypeClass) => {
            const value = assignMultiClass(primaryTypeClass.getValue(), [
                makeSoqlLiteralAssignRule,
                makeErrorAssignRule,
            ]);
            return {
                type: primaryTypeClass.getType(),
                sourceInfo: makeSourceInfo(primaryTypeClass),
                value,
            };
        },
    };

export type SoslPrimaryType = CommonType<'soslPrimary'> & {
    value: ValueRuleValue<SoslLiteralType>;
};

export const isSoslPrimaryType = (value: unknown): value is SoslPrimaryType => {
    return isCommonType(value) && value.type === 'soslPrimary';
};

export const makeSoslPrimaryAssignRule: AssignForValueRule<SoslPrimaryTypeClass, SoslPrimaryType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslPrimaryTypeClass),
        construct: (primaryTypeClass: SoslPrimaryTypeClass) => {
            const value = assignMultiClass(primaryTypeClass.getValue(), [
                makeSoslLiteralAssignRule,
                makeErrorAssignRule,
            ]);
            return {
                type: primaryTypeClass.getType(),
                sourceInfo: makeSourceInfo(primaryTypeClass),
                value,
            };
        },
    };

export type SuperPrimaryType = CommonType<'superPrimary'> & {
    value: string;
};

export const isSuperPrimaryType = (value: unknown): value is SuperPrimaryType => {
    return isCommonType(value) && value.type === 'superPrimary';
};

export const makeSuperPrimaryAssignRule: AssignForValueRule<
    SuperPrimaryTypeClass,
    SuperPrimaryType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSuperPrimaryTypeClass),
    construct: (primaryTypeClass: SuperPrimaryTypeClass) => {
        return {
            type: primaryTypeClass.getType(),
            sourceInfo: makeSourceInfo(primaryTypeClass),
            value: primaryTypeClass.getValue(),
        };
    },
};

export type ThisPrimaryType = CommonType<'thisPrimary'> & {
    value: string;
};

export const isThisPrimaryType = (value: unknown): value is ThisPrimaryType => {
    return isCommonType(value) && value.type === 'thisPrimary';
};

export const makeThisPrimaryAssignRule: AssignForValueRule<ThisPrimaryTypeClass, ThisPrimaryType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isThisPrimaryTypeClass),
        construct: (primaryTypeClass: ThisPrimaryTypeClass) => {
            return {
                type: primaryTypeClass.getType(),
                sourceInfo: makeSourceInfo(primaryTypeClass),
                value: primaryTypeClass.getValue(),
            };
        },
    };

export type TypeRefPrimaryType = CommonType<'typeRefPrimary'> & {
    value: ValueRuleValue<TypeRefType>;
};

export const isTypeRefPrimaryType = (value: unknown): value is TypeRefPrimaryType => {
    return isCommonType(value) && value.type === 'typeRefPrimary';
};

export const makeTypeRefPrimaryAssignRule: AssignForValueRule<
    TypeRefPrimaryTypeClass,
    TypeRefPrimaryType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isTypeRefPrimaryTypeClass),
    construct: (primaryTypeClass: TypeRefPrimaryTypeClass) => {
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            makeTypeRefAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: primaryTypeClass.getType(),
            sourceInfo: makeSourceInfo(primaryTypeClass),
            value,
        };
    },
};

export type VoidPrimaryType = CommonType<'voidPrimary'> & {
    value: string;
};

export const isVoidPrimaryType = (value: unknown): value is VoidPrimaryType => {
    return isCommonType(value) && value.type === 'voidPrimary';
};

export const makeVoidPrimaryAssignRule: AssignForValueRule<VoidPrimaryTypeClass, VoidPrimaryType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isVoidPrimaryTypeClass),
        construct: (primaryTypeClass: VoidPrimaryTypeClass) => {
            return {
                type: primaryTypeClass.getType(),
                sourceInfo: makeSourceInfo(primaryTypeClass),
                value: primaryTypeClass.getValue(),
            };
        },
    };

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

export const isBasePrimaryType = (value: unknown): value is BasePrimaryType => {
    return (
        isCommonType(value) &&
        [
            'idPrimary',
            'literalPrimary',
            'soqlPrimary',
            'soslPrimary',
            'typeRefPrimary',
            'voidPrimary',
            'superPrimary',
            'thisPrimary',
            'primary',
        ].includes(value.type)
    );
};

export const makeBasePrimaryAssignRules = [
    makeIdPrimaryAssignRule,
    makePrimaryAssignRule,
    makeVoidPrimaryAssignRule,
    makeSuperPrimaryAssignRule,
    makeThisPrimaryAssignRule,
    makeLiteralPrimaryAssignRule,
    makeTypeRefPrimaryAssignRule,
    makeSoqlPrimaryAssignRule,
    makeSoslPrimaryAssignRule,
] as const;
