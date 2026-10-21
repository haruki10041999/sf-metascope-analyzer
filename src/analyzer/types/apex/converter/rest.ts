import typia from 'typia';

import {
    ArrayCreatorRestTypeClass,
    ClassCreatorRestTypeClass,
    CreatorTypeClass,
    MapCreatorRestTypeClass,
    NoRestTypeClass,
    SetCreatorRestTypeClass,
    isArrayCreatorRestType as isArrayCreatorRestTypeClass,
    isClassCreatorRestType as isClassCreatorRestTypeClass,
    isCreatorType as isCreatorTypeClass,
    isMapCreatorRestType as isMapCreatorRestTypeClass,
    isNoRestType as isNoRestTypeClass,
    isSetCreatorRestType as isSetCreatorRestTypeClass,
} from '../../apex_IR';
import { ArgumentsType, makeArgumentsRule } from './arguments';

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
    makeStringAssignRule,
} from './commons';
import { makeBaseExpressionRule, BaseExpressionType } from './expression';
import { makeCreatedNameRule, CreatedNameType } from './name';
import { makeMapCreatorRestPairRule, MapCreatorRestPairType } from './pair';
import { makeArrayInitializerRule, ArrayInitializerType } from './variable';

export type ArrayCreatorRestType = CommonType & {
    value: ValueRuleValue<ArrayInitializerType | null>;
    size: ValueRuleValue<BaseExpressionType | null>;
};

export const isArrayCreatorRestType = typia.createIs<ArrayCreatorRestType>();

export const makeArrayCreatorRestRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ArrayCreatorRestTypeClass, ArrayCreatorRestType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArrayCreatorRestTypeClass),
        construct: (restTypeClass: ArrayCreatorRestTypeClass) => {
            const value = assignMultiClass(restTypeClass.getValue(), [
                makeArrayInitializerRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            const size = assignMultiClass(restTypeClass.getSize(), [
                ...makeBaseExpressionRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: restTypeClass.getType(),
                sourceInfo: makeSourceInfo(restTypeClass),
                value,
                size,
            };
        },
    };
};

export type ClassCreatorRestType = CommonType & {
    value: ValueRuleValue<ArgumentsType>;
};

export const isClassCreatorRestType = typia.createIs<ClassCreatorRestType>();

export const makeClassCreatorRestRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<ClassCreatorRestTypeClass, ClassCreatorRestType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isClassCreatorRestTypeClass),
        construct: (restTypeClass: ClassCreatorRestTypeClass) => {
            const value = assignMultiClass(restTypeClass.getValue(), [
                makeArgumentsRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: restTypeClass.getType(),
                sourceInfo: makeSourceInfo(restTypeClass),
                value,
            };
        },
    };
};

export type MapCreatorRestType = CommonType & {
    value: ValueRuleValue<MapCreatorRestPairType>[];
};

export const isMapCreatorRestType = typia.createIs<MapCreatorRestType>();

export const makeMapCreatorRestRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<MapCreatorRestTypeClass, MapCreatorRestType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMapCreatorRestTypeClass),
        construct: (restTypeClass: MapCreatorRestTypeClass) => {
            const value = restTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [
                        makeMapCreatorRestPairRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            return {
                type: restTypeClass.getType(),
                sourceInfo: makeSourceInfo(restTypeClass),
                value,
            };
        },
    };
};

export type NoRestType = CommonType & {
    value: ValueRuleValue<string>;
};

export const isNoRestType = typia.createIs<NoRestType>();

export const makeNoRestRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<NoRestTypeClass, NoRestType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNoRestTypeClass),
        construct: (restTypeClass: NoRestTypeClass) => {
            const value = assignMultiClass(restTypeClass.getValue(), [
                makeStringAssignRule,
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: restTypeClass.getType(),
                sourceInfo: makeSourceInfo(restTypeClass),
                value,
            };
        },
    };
};

export type SetCreatorRestType = CommonType & {
    value: ValueRuleValue<BaseExpressionType>[];
};

export const isSetCreatorRestType = typia.createIs<SetCreatorRestType>();

export const makeSetCreatorRestRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<SetCreatorRestTypeClass, SetCreatorRestType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSetCreatorRestTypeClass),
        construct: (restTypeClass: SetCreatorRestTypeClass) => {
            const value = restTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [
                        ...makeBaseExpressionRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            return {
                type: restTypeClass.getType(),
                sourceInfo: makeSourceInfo(restTypeClass),
                value,
            };
        },
    };
};

export type CreatorType = CommonType & {
    value: ValueRuleValue<CreatedNameType>;
    rest: ValueRuleValue<
        | ArrayCreatorRestType
        | ClassCreatorRestType
        | MapCreatorRestType
        | NoRestType
        | SetCreatorRestType
    >;
};

export const isCreatorType = typia.createIs<CreatorType>();

export const makeCreatorRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<CreatorTypeClass, CreatorType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCreatorTypeClass),
        construct: (restTypeClass: CreatorTypeClass) => {
            const value = assignMultiClass(restTypeClass.getValue(), [
                makeCreatedNameRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const rest = assignMultiClass(restTypeClass.getContent(), [
                makeArrayCreatorRestRule(errorInfo),
                makeClassCreatorRestRule(errorInfo),
                makeMapCreatorRestRule(errorInfo),
                makeNoRestRule(errorInfo),
                makeSetCreatorRestRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            return {
                type: restTypeClass.getType(),
                sourceInfo: makeSourceInfo(restTypeClass),
                value,
                rest,
            };
        },
    };
};

