import typia from 'typia';

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
    ErrorInfo,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeNullAssignRule,
    makeSourceInfo,
} from './commons';
import { makeBaseExpressionRule, BaseExpressionType } from './expression';
import { makeAnyIdRule, makeIdRule, IdType, AnyIdType } from './id';
import { makeTypeListRule, TypeListType } from './list';
import { makeElementValueRule, ElementValueType } from './value';

export type ElementValuePairsType = CommonType & {
    value: ValueRuleValue<ElementValuePairType>[];
};

export const isElementValuePairsType = typia.createIs<ElementValuePairsType>();

export const makeElementValuePairsRule = (): AssignForValueRule<
    ElementValuePairsTypeClass,
    ElementValuePairsType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isElementValuePairsTypeClass),
        construct: (pairTypeClass: ElementValuePairsTypeClass) => {
            const value = pairTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeElementValuePairRule(), makeErrorAssignRule]));
            return {
                type: pairTypeClass.getType(),
                sourceInfo: makeSourceInfo(pairTypeClass),
                value,
            };
        },
    };
};

export type ElementValuePairType = CommonType & {
    left: ValueRuleValue<IdType>;
    right: ValueRuleValue<ElementValueType>;
};

export const isElementValuePairType = typia.createIs<ElementValuePairType>();

export const makeElementValuePairRule = (): AssignForValueRule<
    ElementValuePairTypeClass,
    ElementValuePairType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isElementValuePairTypeClass),
        construct: (pairTypeClass: ElementValuePairTypeClass) => {
            const left = assignMultiClass(pairTypeClass.getLeft(), [
                makeIdRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(pairTypeClass.getRight(), [
                makeElementValueRule(),
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
};

export type IdCreatedNamePairType = CommonType & {
    left: ValueRuleValue<AnyIdType>;
    right: ValueRuleValue<TypeListType | null>;
};

export const isIdCreatedNamePairType = typia.createIs<IdCreatedNamePairType>();

export const makeIdCreatedNamePairRule = (): AssignForValueRule<
    IdCreatedNamePairTypeClass,
    IdCreatedNamePairType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isIdCreatedNamePairTypeClass),
        construct: (pairTypeClass: IdCreatedNamePairTypeClass) => {
            const left = assignMultiClass(pairTypeClass.getLeft(), [
                makeAnyIdRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(pairTypeClass.getRight(), [
                makeTypeListRule(),
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
};

export type MapCreatorRestPairType = CommonType & {
    left: ValueRuleValue<BaseExpressionType>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isMapCreatorRestPairType = typia.createIs<MapCreatorRestPairType>();

export const makeMapCreatorRestPairRule = (): AssignForValueRule<
    MapCreatorRestPairTypeClass,
    MapCreatorRestPairType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMapCreatorRestPairTypeClass),
        construct: (pairTypeClass: MapCreatorRestPairTypeClass) => {
            const left = assignMultiClass(pairTypeClass.getLeft(), [
                ...makeBaseExpressionRule(),
                makeErrorAssignRule,
            ]);
            const right = assignMultiClass(pairTypeClass.getRight(), [
                ...makeBaseExpressionRule(),
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
};

