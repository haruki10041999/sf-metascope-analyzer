import {
    ArrayCreatorRestTypeClass,
    ClassCreatorRestTypeClass,
    CreatorTypeClass,
    MapCreatorRestTypeClass,
    NoRestTypeClass,
    SetCreatorRestTypeClass,
    isArrayCreatorRestType,
    isClassCreatorRestType,
    isCreatorType,
    isMapCreatorRestType,
    isNoRestType,
    isSetCreatorRestType,
} from '../../apex_IR';
import { makeArgumentsRule } from './arguments';

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
import { makeCreatedNameRule } from './name';
import { makeMapCreatorRestPairRule } from './pair';
import { makeArrayInitializerRule } from './variable';

export const makeArrayCreatorRestRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ArrayCreatorRestTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArrayCreatorRestType),
        construct: (restTypeClass: ArrayCreatorRestTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const init = assignMultiClass(restTypeClass.getValue(), [
                makeArrayInitializerRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const size = assignMultiClass(restTypeClass.getSize(), [
                ...makeBaseExpressionRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[restTypeClass.getType()] = nestedSourceInfo;
            return { init, size };
        },
    };
};

export const makeClassCreatorRestRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ClassCreatorRestTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isClassCreatorRestType),
        construct: (restTypeClass: ClassCreatorRestTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = assignMultiClass(restTypeClass.getValue(), [
                makeArgumentsRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[restTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeMapCreatorRestRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<MapCreatorRestTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMapCreatorRestType),
        construct: (restTypeClass: MapCreatorRestTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = restTypeClass.getValue().forEach((v, index) => {
                const valueSourceInfo = makeEmptySourceInfoMap();
                const value = assignMultiClass(v, [
                    makeMapCreatorRestPairRule(valueSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                nestedSourceInfo[`${restTypeClass.getType()}_${index}`] = valueSourceInfo;
                return value;
            });
            sourceInfo[restTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeNoRestRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NoRestTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNoRestType),
        construct: (restTypeClass: NoRestTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const rest = assignMultiClass(restTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => {
                        nestedSourceInfo['string'] = value;
                        return value;
                    },
                },
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[restTypeClass.getType()] = nestedSourceInfo;
            return rest;
        },
    };
};

export const makeSetCreatorRestRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SetCreatorRestTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSetCreatorRestType),
        construct: (restTypeClass: SetCreatorRestTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const value = restTypeClass.getValue().forEach((v, index) => {
                const valueSourceInfo = makeEmptySourceInfoMap();
                const value = assignMultiClass(v, [
                    ...makeBaseExpressionRule(valueSourceInfo, errorInfo),
                    makeErrorAssignRule(errorInfo),
                ]);
                nestedSourceInfo[`${restTypeClass.getType()}_${index}`] = valueSourceInfo;
                return value;
            });
            sourceInfo[restTypeClass.getType()] = nestedSourceInfo;
            return value;
        },
    };
};

export const makeCreatorRule = (
    sourceInfo: SourceInfoMap,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CreatorTypeClass, ValueRuleValue<unknown>> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCreatorType),
        construct: (restTypeClass: CreatorTypeClass) => {
            const nestedSourceInfo = makeEmptySourceInfoMap();
            const name = assignMultiClass(restTypeClass.getValue(), [
                makeCreatedNameRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const rest = assignMultiClass(restTypeClass.getContent(), [
                makeArrayCreatorRestRule(nestedSourceInfo, errorInfo),
                makeClassCreatorRestRule(nestedSourceInfo, errorInfo),
                makeMapCreatorRestRule(nestedSourceInfo, errorInfo),
                makeNoRestRule(nestedSourceInfo, errorInfo),
                makeSetCreatorRestRule(nestedSourceInfo, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            sourceInfo[restTypeClass.getType()] = nestedSourceInfo;
            return { name, rest };
        },
    };
};
