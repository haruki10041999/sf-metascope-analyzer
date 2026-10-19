import {
    ElementValuePairsTypeClass,
    ElementValuePairTypeClass,
    IdCreatedNamePairTypeClass,
    MapCreatorRestPairTypeClass,
    PairListTypeClass,
    PairTypeClass,
    isElementValuePairsType,
    isElementValuePairType,
    isIdCreatedNamePairType,
    isMapCreatorRestPairType,
} from '../../apex_IR';
import { makeElementValueType } from '../modifier';

import {
    ErrorInfo,
    SourceInfoMap,
    AssignForValueRule,
    ValueRuleValue,
    makeEmptySourceInfoMap,
    isTargetTypeClass,
    assignMultiClass,
    makeErrorAssignRule,
} from './commons';
import { makeBaseExpressionRule } from './expression';
import { makeAnyIdRule, makeIdRule } from './id';
import { makeTypeListRule } from './list';
import { makeElementValueRule } from './value';

export const makeElementValuePairsRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ElementValuePairsTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isElementValuePairsType),
        construct: (pairTypeClass: ElementValuePairsTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = pairTypeClass.getValue().forEach((v, index) => {
                const valueSourceInfo = makeEmptySourceInfoMap();
                const value = assignMultiClass(v, [
                    makeElementValuePairRule(valueSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                nestedSourceInfo[`${pairTypeClass.getType()}_${index}`] = valueSourceInfo;
            });
            sourceInfo[pairTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeElementValuePairRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ElementValuePairTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isElementValuePairType),
        construct: (pairTypeClass: ElementValuePairTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const variant = assignMultiClass(pairTypeClass.getLeft(), [
                makeIdRule(nestedSourceInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const value = assignMultiClass(pairTypeClass.getRight(), [
                makeElementValueRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[pairTypeClass.getType()] = nestedSourceInfo;
            return { variant, value };
        },
    };
};

export const makeIdCreatedNamePairRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<IdCreatedNamePairTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isIdCreatedNamePairType),
        construct: (pairTypeClass: IdCreatedNamePairTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const collection = assignMultiClass(pairTypeClass.getLeft(), [
                makeAnyIdRule(nestedSourceInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const generic = assignMultiClass(pairTypeClass.getRight(), [
                makeTypeListRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[pairTypeClass.getType()] = nestedSourceInfo;
            return { collection, generic };
        },
    };
};

export const makeMapCreatorRestPairRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<MapCreatorRestPairTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMapCreatorRestPairType),
        construct: (pairTypeClass: MapCreatorRestPairTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const key = assignMultiClass(pairTypeClass.getLeft(), [
                ...makeBaseExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const value = assignMultiClass(pairTypeClass.getRight(), [
                ...makeBaseExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[pairTypeClass.getType()] = nestedSourceInfo;
            return { key, value };
        },
    };
};
