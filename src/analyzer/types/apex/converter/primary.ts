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
    SourceSlot,
    AssignForValueRule,
    ValueRuleValue,
    assignMultiClass,
    isTargetTypeClass,
    makeErrorAssignRule,
    makeSourceNode,
    sourceField,
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

export type IdPrimaryType = {
    type: string;
    value: ValueRuleValue<IdType>;
};

export const isIdPrimaryType = typia.createIs<IdPrimaryType>();

export const makeIdPrimaryRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<IdPrimaryTypeClass, IdPrimaryType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isIdPrimaryTypeClass),
    construct: (primaryTypeClass: IdPrimaryTypeClass) => {
        const node = makeSourceNode(primaryTypeClass);
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            makeIdRule(sourceField(node, 'value')),
            makeErrorAssignRule(errorInfo),
        ]);
        slot(node);
        return { type: primaryTypeClass.getType(), value };
    },
});

export type LiteralPrimaryType = {
    type: string;
    value: ValueRuleValue<LiteralType>;
};

export const isLiteralPrimaryType = typia.createIs<LiteralPrimaryType>();

export const makeLiteralPrimaryRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<LiteralPrimaryTypeClass, LiteralPrimaryType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isLiteralPrimaryTypeClass),
    construct: (primaryTypeClass: LiteralPrimaryTypeClass) => {
        const node = makeSourceNode(primaryTypeClass);
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            makeLiteralRule(sourceField(node, 'value'), errorInfo),
            makeErrorAssignRule(errorInfo),
        ]);
        slot(node);
        return { type: primaryTypeClass.getType(), value };
    },
});

export type PrimaryType = {
    type: string;
    value: ValueRuleValue<string>;
};

export const isPrimaryType = typia.createIs<PrimaryType>();

export const makePrimaryRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalPrimaryTypeClass, PrimaryType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalPrimaryType),
    construct: (primaryTypeClass: NormalPrimaryTypeClass) => {
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            {
                isValid: (target: unknown): target is string => typeof target === 'string',
                construct: (value: string) => value,
            },
            makeErrorAssignRule(errorInfo),
        ]);
        slot(makeSourceNode(primaryTypeClass));
        return { type: primaryTypeClass.getType(), value };
    },
});

export type SoqlPrimaryType = {
    type: string;
    value: ValueRuleValue<SoqlLiteralType>;
};

export const isSoqlPrimaryType = typia.createIs<SoqlPrimaryType>();

export const makeSoqlPrimaryRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoqlPrimaryTypeClass, SoqlPrimaryType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoqlPrimaryTypeClass),
        construct: (primaryTypeClass: SoqlPrimaryTypeClass) => {
            const node = makeSourceNode(primaryTypeClass);
            const value = assignMultiClass(primaryTypeClass.getValue(), [
                makeSoqlLiteralRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: primaryTypeClass.getType(), value };
        },
    };
};

export type SoslPrimaryType = {
    type: string;
    value: ValueRuleValue<SoslLiteralType>;
};

export const isSoslPrimaryType = typia.createIs<SoslPrimaryType>();

export const makeSoslPrimaryRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslPrimaryTypeClass, SoslPrimaryType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslPrimaryTypeClass),
        construct: (primaryTypeClass: SoslPrimaryTypeClass) => {
            const node = makeSourceNode(primaryTypeClass);
            const value = assignMultiClass(primaryTypeClass.getValue(), [
                makeSoslLiteralRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: primaryTypeClass.getType(), value };
        },
    };
};

export type SuperPrimaryType = {
    type: string;
    value: ValueRuleValue<string>;
};

export const isSuperPrimaryType = typia.createIs<SuperPrimaryType>();

export const makeSuperPrimaryRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SuperPrimaryTypeClass, SuperPrimaryType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isSuperPrimaryTypeClass),
    construct: (primaryTypeClass: SuperPrimaryTypeClass) => {
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            {
                isValid: (target: unknown): target is string => typeof target === 'string',
                construct: (value: string) => value,
            },
            makeErrorAssignRule(errorInfo),
        ]);
        slot(makeSourceNode(primaryTypeClass));
        return { type: primaryTypeClass.getType(), value };
    },
});

export type ThisPrimaryType = {
    type: string;
    value: ValueRuleValue<string>;
};

export const isThisPrimaryType = typia.createIs<ThisPrimaryType>();

export const makeThisPrimaryRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ThisPrimaryTypeClass, ThisPrimaryType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isThisPrimaryTypeClass),
    construct: (primaryTypeClass: ThisPrimaryTypeClass) => {
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            {
                isValid: (target: unknown): target is string => typeof target === 'string',
                construct: (value: string) => value,
            },
            makeErrorAssignRule(errorInfo),
        ]);
        slot(makeSourceNode(primaryTypeClass));
        return { type: primaryTypeClass.getType(), value };
    },
});

export type TypeRefPrimaryType = {
    type: string;
    value: ValueRuleValue<TypeRefType>;
};

export const isTypeRefPrimaryType = typia.createIs<TypeRefPrimaryType>();

export const makeTypeRefPrimaryRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeRefPrimaryTypeClass, TypeRefPrimaryType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeRefPrimaryTypeClass),
        construct: (primaryTypeClass: TypeRefPrimaryTypeClass) => {
            const node = makeSourceNode(primaryTypeClass);
            const value = assignMultiClass(primaryTypeClass.getValue(), [
                makeTypeRefRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: primaryTypeClass.getType(), value };
        },
    };
};

export type VoidPrimaryType = {
    type: string;
    value: ValueRuleValue<string>;
};

export const isVoidPrimaryType = typia.createIs<VoidPrimaryType>();

export const makeVoidPrimaryRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<VoidPrimaryTypeClass, VoidPrimaryType> => ({
    isValid: (target: unknown) => isTargetTypeClass(target, isVoidPrimaryTypeClass),
    construct: (primaryTypeClass: VoidPrimaryTypeClass) => {
        const value = assignMultiClass(primaryTypeClass.getValue(), [
            {
                isValid: (target: unknown): target is string => typeof target === 'string',
                construct: (value: string) => value,
            },
            makeErrorAssignRule(errorInfo),
        ]);
        slot(makeSourceNode(primaryTypeClass));
        return { type: primaryTypeClass.getType(), value };
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

export const makeBasePrimaryRule = (slot: SourceSlot, errorInfo: ErrorInfo[]) => {
    return [
        makeIdPrimaryRule(slot, errorInfo),
        makePrimaryRule(slot, errorInfo),
        makeVoidPrimaryRule(slot, errorInfo),
        makeSuperPrimaryRule(slot, errorInfo),
        makeThisPrimaryRule(slot, errorInfo),
        makeLiteralPrimaryRule(slot, errorInfo),
        makeTypeRefPrimaryRule(slot, errorInfo),
        makeSoqlPrimaryRule(slot, errorInfo),
        makeSoslPrimaryRule(slot, errorInfo),
    ];
};
