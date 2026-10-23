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
import { ArgumentsType, makeArgumentsAssignRule } from './arguments';

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
    makeStringAssignRule,
} from './commons';
import { makeBaseExpressionAssignRules, BaseExpressionType } from './expression';
import { makeCreatedNameAssignRule, CreatedNameType } from './name';
import { makeMapCreatorRestPairAssignRule, MapCreatorRestPairType } from './pair';
import { makeArrayInitializerAssignRule, ArrayInitializerType } from './variable';

export type ArrayCreatorRestType = CommonType<'arrayCreatorRest'> & {
    value: ValueRuleValue<ArrayInitializerType | null>;
    size: ValueRuleValue<BaseExpressionType | null>;
};

export const isArrayCreatorRestType = (value: unknown): value is ArrayCreatorRestType => {
    return isCommonType(value) && value.type === 'arrayCreatorRest';
};

export const makeArrayCreatorRestAssignRule: AssignForValueRule<
    ArrayCreatorRestTypeClass,
    ArrayCreatorRestType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isArrayCreatorRestTypeClass),
    construct: (restTypeClass: ArrayCreatorRestTypeClass) => {
        const value = assignMultiClass(restTypeClass.getValue(), [
            makeArrayInitializerAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        const size = assignMultiClass(restTypeClass.getSize(), [
            ...makeBaseExpressionAssignRules,
            makeErrorAssignRule,
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

export type ClassCreatorRestType = CommonType<'classCreatorRest'> & {
    value: ValueRuleValue<ArgumentsType>;
};

export const isClassCreatorRestType = (value: unknown): value is ClassCreatorRestType => {
    return isCommonType(value) && value.type === 'classCreatorRest';
};

export const makeClassCreatorRestAssignRule: AssignForValueRule<
    ClassCreatorRestTypeClass,
    ClassCreatorRestType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isClassCreatorRestTypeClass),
    construct: (restTypeClass: ClassCreatorRestTypeClass) => {
        const value = assignMultiClass(restTypeClass.getValue(), [
            makeArgumentsAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: restTypeClass.getType(),
            sourceInfo: makeSourceInfo(restTypeClass),
            value,
        };
    },
};

export type MapCreatorRestType = CommonType<'mapCreatorRest'> & {
    value: ValueRuleValue<MapCreatorRestPairType>[];
};

export const isMapCreatorRestType = (value: unknown): value is MapCreatorRestType => {
    return isCommonType(value) && value.type === 'mapCreatorRest';
};

export const makeMapCreatorRestAssignRule: AssignForValueRule<
    MapCreatorRestTypeClass,
    MapCreatorRestType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isMapCreatorRestTypeClass),
    construct: (restTypeClass: MapCreatorRestTypeClass) => {
        const value = restTypeClass
            .getValue()
            .map((v) =>
                assignMultiClass(v, [makeMapCreatorRestPairAssignRule, makeErrorAssignRule]),
            );
        return {
            type: restTypeClass.getType(),
            sourceInfo: makeSourceInfo(restTypeClass),
            value,
        };
    },
};

export type NoRestType = CommonType<'noRest'> & {
    value: ValueRuleValue<string>;
};

export const isNoRestType = (value: unknown): value is NoRestType => {
    return isCommonType(value) && value.type === 'noRest';
};

export const makeNoRestAssignRule: AssignForValueRule<NoRestTypeClass, NoRestType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isNoRestTypeClass),
    construct: (restTypeClass: NoRestTypeClass) => {
        const value = assignMultiClass(restTypeClass.getValue(), [
            makeStringAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: restTypeClass.getType(),
            sourceInfo: makeSourceInfo(restTypeClass),
            value,
        };
    },
};

export type SetCreatorRestType = CommonType<'setCreatorRest'> & {
    value: ValueRuleValue<BaseExpressionType>[];
};

export const isSetCreatorRestType = (value: unknown): value is SetCreatorRestType => {
    return isCommonType(value) && value.type === 'setCreatorRest';
};

export const makeSetCreatorRestAssignRule: AssignForValueRule<
    SetCreatorRestTypeClass,
    SetCreatorRestType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSetCreatorRestTypeClass),
    construct: (restTypeClass: SetCreatorRestTypeClass) => {
        const value = restTypeClass
            .getValue()
            .map((v) =>
                assignMultiClass(v, [...makeBaseExpressionAssignRules, makeErrorAssignRule]),
            );
        return {
            type: restTypeClass.getType(),
            sourceInfo: makeSourceInfo(restTypeClass),
            value,
        };
    },
};

export type CreatorType = CommonType<'creator'> & {
    value: ValueRuleValue<CreatedNameType>;
    rest: ValueRuleValue<
        | ArrayCreatorRestType
        | ClassCreatorRestType
        | MapCreatorRestType
        | NoRestType
        | SetCreatorRestType
    >;
};

export const isCreatorType = (value: unknown): value is CreatorType => {
    return isCommonType(value) && value.type === 'creator';
};

export const makeCreatorAssignRule: AssignForValueRule<CreatorTypeClass, CreatorType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isCreatorTypeClass),
    construct: (restTypeClass: CreatorTypeClass) => {
        const value = assignMultiClass(restTypeClass.getValue(), [
            makeCreatedNameAssignRule,
            makeErrorAssignRule,
        ]);
        const rest = assignMultiClass(restTypeClass.getContent(), [
            makeArrayCreatorRestAssignRule,
            makeClassCreatorRestAssignRule,
            makeMapCreatorRestAssignRule,
            makeNoRestAssignRule,
            makeSetCreatorRestAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: restTypeClass.getType(),
            sourceInfo: makeSourceInfo(restTypeClass),
            value,
            rest,
        };
    },
};
