import {
    ElementValuePairsTypeClass,
    ElementValuePairTypeClass,
    IdCreatedNamePairTypeClass,
    MapCreatorRestPairTypeClass,
    isElementValuePairsType as isElementValuePairsTypeClass,
    isElementValuePairType as isElementValuePairTypeClass,
    isIdCreatedNamePairType as isIdCreatedNamePairTypeClass,
    isMapCreatorRestPairType as isMapCreatorRestPairTypeClass,
} from '../../apex_IR';
import {
    isCommonType,
    ErrorType,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeNullAssignRule,
    makeSourceInfo,
} from './commons';
import { makeBaseExpressionAssignRules, BaseExpressionType } from './expression';
import { makeAnyIdAssignRule, makeIdAssignRule, IdType, AnyIdType } from './id';
import { makeTypeListAssignRule, TypeListType } from './list';
import { makeElementValueAssignRule, ElementValueType } from './value';

export type ElementValuePairsType = CommonType<'elementValuePairs'> & {
    value: ValueRuleValue<ElementValuePairType>[];
};

export const isElementValuePairsType = (value: unknown): value is ElementValuePairsType => {
    return isCommonType(value) && value.type === 'elementValuePairs';
};

export const makeElementValuePairsAssignRule: AssignForValueRule<
    ElementValuePairsTypeClass,
    ElementValuePairsType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isElementValuePairsTypeClass),
    construct: (pairTypeClass: ElementValuePairsTypeClass) => {
        const value = pairTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeElementValuePairAssignRule, makeErrorAssignRule]));
        return {
            type: pairTypeClass.getType(),
            sourceInfo: makeSourceInfo(pairTypeClass),
            value,
        };
    },
};

export type ElementValuePairType = CommonType<'elementValuePair'> & {
    left: ValueRuleValue<IdType>;
    right: ValueRuleValue<ElementValueType>;
};

export const isElementValuePairType = (value: unknown): value is ElementValuePairType => {
    return isCommonType(value) && value.type === 'elementValuePair';
};

export const makeElementValuePairAssignRule: AssignForValueRule<
    ElementValuePairTypeClass,
    ElementValuePairType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isElementValuePairTypeClass),
    construct: (pairTypeClass: ElementValuePairTypeClass) => {
        const left = assignMultiClass(pairTypeClass.getLeft(), [
            makeIdAssignRule,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(pairTypeClass.getRight(), [
            makeElementValueAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: pairTypeClass.getType(),
            sourceInfo: makeSourceInfo(pairTypeClass),
            left,
            right,
        };
    },
};

export type IdCreatedNamePairType = CommonType<'idCreatedNamePair'> & {
    left: ValueRuleValue<AnyIdType>;
    right: ValueRuleValue<TypeListType | null>;
};

export const isIdCreatedNamePairType = (value: unknown): value is IdCreatedNamePairType => {
    return isCommonType(value) && value.type === 'idCreatedNamePair';
};

export const makeIdCreatedNamePairAssignRule: AssignForValueRule<
    IdCreatedNamePairTypeClass,
    IdCreatedNamePairType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isIdCreatedNamePairTypeClass),
    construct: (pairTypeClass: IdCreatedNamePairTypeClass) => {
        const left = assignMultiClass(pairTypeClass.getLeft(), [
            makeAnyIdAssignRule,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(pairTypeClass.getRight(), [
            makeTypeListAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        return {
            type: pairTypeClass.getType(),
            sourceInfo: makeSourceInfo(pairTypeClass),
            left,
            right,
        };
    },
};

export type MapCreatorRestPairType = CommonType<'mapCreatorRestPair'> & {
    left: ValueRuleValue<BaseExpressionType>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isMapCreatorRestPairType = (value: unknown): value is MapCreatorRestPairType => {
    return isCommonType(value) && value.type === 'mapCreatorRestPair';
};

export const makeMapCreatorRestPairAssignRule: AssignForValueRule<
    MapCreatorRestPairTypeClass,
    MapCreatorRestPairType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isMapCreatorRestPairTypeClass),
    construct: (pairTypeClass: MapCreatorRestPairTypeClass) => {
        const left = assignMultiClass(pairTypeClass.getLeft(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        const right = assignMultiClass(pairTypeClass.getRight(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
        ]);
        return {
            type: pairTypeClass.getType(),
            sourceInfo: makeSourceInfo(pairTypeClass),
            left,
            right,
        };
    },
};
