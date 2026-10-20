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
    SourceSlot,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
    makeSourceNode,
    sourceField,
    sourceList,
} from './commons';
import { makeBaseExpressionRule, BaseExpressionType } from './expression';
import { makeAnyIdRule, makeIdRule, IdType, AnyIdType } from './id';
import { makeTypeListRule, TypeListType } from './list';
import { makeElementValueRule, ElementValueType } from './value';

export type ElementValuePairsType = {
    type: string;
    value: ValueRuleValue<ElementValuePairType>[];
};

export const isElementValuePairsType = typia.createIs<ElementValuePairsType>();

export const makeElementValuePairsRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ElementValuePairsTypeClass, ElementValuePairsType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isElementValuePairsTypeClass),
        construct: (pairTypeClass: ElementValuePairsTypeClass) => {
            const node = makeSourceNode(pairTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = pairTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeElementValuePairRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: pairTypeClass.getType(), value };
        },
    };
};

export type ElementValuePairType = {
    type: string;
    left: ValueRuleValue<IdType>;
    right: ValueRuleValue<ElementValueType>;
};

export const isElementValuePairType = typia.createIs<ElementValuePairType>();

export const makeElementValuePairRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ElementValuePairTypeClass, ElementValuePairType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isElementValuePairTypeClass),
        construct: (pairTypeClass: ElementValuePairTypeClass) => {
            const node = makeSourceNode(pairTypeClass);
            const left = assignMultiClass(pairTypeClass.getLeft(), [
                makeIdRule(sourceField(node, 'left')),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(pairTypeClass.getRight(), [
                makeElementValueRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: pairTypeClass.getType(), left, right };
        },
    };
};

export type IdCreatedNamePairType = {
    type: string;
    left: ValueRuleValue<AnyIdType>;
    right: ValueRuleValue<TypeListType>;
};

export const isIdCreatedNamePairType = typia.createIs<IdCreatedNamePairType>();

export const makeIdCreatedNamePairRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<IdCreatedNamePairTypeClass, IdCreatedNamePairType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isIdCreatedNamePairTypeClass),
        construct: (pairTypeClass: IdCreatedNamePairTypeClass) => {
            const node = makeSourceNode(pairTypeClass);
            const left = assignMultiClass(pairTypeClass.getLeft(), [
                makeAnyIdRule(sourceField(node, 'left')),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(pairTypeClass.getRight(), [
                makeTypeListRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: pairTypeClass.getType(), left, right };
        },
    };
};

export type MapCreatorRestPairType = {
    type: string;
    left: ValueRuleValue<BaseExpressionType>;
    right: ValueRuleValue<BaseExpressionType>;
};

export const isMapCreatorRestPairType = typia.createIs<MapCreatorRestPairType>();

export const makeMapCreatorRestPairRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<MapCreatorRestPairTypeClass, MapCreatorRestPairType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMapCreatorRestPairTypeClass),
        construct: (pairTypeClass: MapCreatorRestPairTypeClass) => {
            const node = makeSourceNode(pairTypeClass);
            const left = assignMultiClass(pairTypeClass.getLeft(), [
                ...makeBaseExpressionRule(sourceField(node, 'left'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const right = assignMultiClass(pairTypeClass.getRight(), [
                ...makeBaseExpressionRule(sourceField(node, 'right'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: pairTypeClass.getType(), left, right };
        },
    };
};

