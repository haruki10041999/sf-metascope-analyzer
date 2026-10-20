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
import { makeCreatedNameRule, CreatedNameType } from './name';
import { makeMapCreatorRestPairRule, MapCreatorRestPairType } from './pair';
import { makeArrayInitializerRule, ArrayInitializerType } from './variable';

export type ArrayCreatorRestType = {
    type: string;
    value: ValueRuleValue<ArrayInitializerType>;
    size: ValueRuleValue<BaseExpressionType>;
};

export const isArrayCreatorRestType = typia.createIs<ArrayCreatorRestType>();

export const makeArrayCreatorRestRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ArrayCreatorRestTypeClass, ArrayCreatorRestType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isArrayCreatorRestTypeClass),
        construct: (restTypeClass: ArrayCreatorRestTypeClass) => {
            const node = makeSourceNode(restTypeClass);
            const value = assignMultiClass(restTypeClass.getValue(), [
                makeArrayInitializerRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const size = assignMultiClass(restTypeClass.getSize(), [
                ...makeBaseExpressionRule(sourceField(node, 'size'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: restTypeClass.getType(), value, size };
        },
    };
};

export type ClassCreatorRestType = {
    type: string;
    value: ValueRuleValue<ArgumentsType>;
};

export const isClassCreatorRestType = typia.createIs<ClassCreatorRestType>();

export const makeClassCreatorRestRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ClassCreatorRestTypeClass, ClassCreatorRestType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isClassCreatorRestTypeClass),
        construct: (restTypeClass: ClassCreatorRestTypeClass) => {
            const node = makeSourceNode(restTypeClass);
            const value = assignMultiClass(restTypeClass.getValue(), [
                makeArgumentsRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: restTypeClass.getType(), value };
        },
    };
};

export type MapCreatorRestType = {
    type: string;
    value: ValueRuleValue<MapCreatorRestPairType>[];
};

export const isMapCreatorRestType = typia.createIs<MapCreatorRestType>();

export const makeMapCreatorRestRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<MapCreatorRestTypeClass, MapCreatorRestType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isMapCreatorRestTypeClass),
        construct: (restTypeClass: MapCreatorRestTypeClass) => {
            const node = makeSourceNode(restTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = restTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeMapCreatorRestPairRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: restTypeClass.getType(), value };
        },
    };
};

export type NoRestType = {
    type: string;
    value: ValueRuleValue<string>;
};

export const isNoRestType = typia.createIs<NoRestType>();

export const makeNoRestRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NoRestTypeClass, NoRestType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNoRestTypeClass),
        construct: (restTypeClass: NoRestTypeClass) => {
            const value = assignMultiClass(restTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeErrorAssignRule(errorInfo),
            ]);
            slot(makeSourceNode(restTypeClass));
            return { type: restTypeClass.getType(), value };
        },
    };
};

export type SetCreatorRestType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>[];
};

export const isSetCreatorRestType = typia.createIs<SetCreatorRestType>();

export const makeSetCreatorRestRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SetCreatorRestTypeClass, SetCreatorRestType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSetCreatorRestTypeClass),
        construct: (restTypeClass: SetCreatorRestTypeClass) => {
            const node = makeSourceNode(restTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = restTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        ...makeBaseExpressionRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: restTypeClass.getType(), value };
        },
    };
};

export type CreatorType = {
    type: string;
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
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CreatorTypeClass, CreatorType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCreatorTypeClass),
        construct: (restTypeClass: CreatorTypeClass) => {
            const node = makeSourceNode(restTypeClass);
            const value = assignMultiClass(restTypeClass.getValue(), [
                makeCreatedNameRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const restSource = sourceField(node, 'rest');
            const rest = assignMultiClass(restTypeClass.getContent(), [
                makeArrayCreatorRestRule(restSource, errorInfo),
                makeClassCreatorRestRule(restSource, errorInfo),
                makeMapCreatorRestRule(restSource, errorInfo),
                makeNoRestRule(restSource, errorInfo),
                makeSetCreatorRestRule(restSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: restTypeClass.getType(), value, rest };
        },
    };
};

