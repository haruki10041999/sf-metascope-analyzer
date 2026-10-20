import typia from 'typia';

import {
    CoordinateValueTypeClass,
    ElementValueTypeClass,
    ErrorTypeClass,
    LocationValueTypeClass,
    NormalValueTypeClass,
    ValueTypeClass,
    WhenLiteralTypeClass,
    WhenValueTypeClass,
    isCoordinateValueType as isCoordinateValueTypeClass,
    isElementValueType as isElementValueTypeClass,
    isErrorType,
    isLocationValueType as isLocationValueTypeClass,
    isNormalValueType,
    isWhenLiteralType,
    isWhenValueType as isWhenValueTypeClass,
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
import { makeBoundExpressionRule, BoundExpressionType } from './expression';
import { makeIdRule, IdType } from './id';
import { makeValueListRule, ValueListType } from './list';
import {
    makeLiteralRule,
    makeSignedNumberRule,
    makeWhenLiteralRule,
    LiteralType,
    SignedNumberType,
    SignedIntegerType,
    WhenLiteralType,
} from './literal';
import { makeFieldNameRule, FieldNameType } from './name';
import { makeDateFormulaRule, makeSubQueryRule, DateFormulaType, SubQueryType } from './query';
import { makeTypeRefRule, TypeRefType } from './type';

export type CoordinateValueType = {
    type: string;
    value: ValueRuleValue<SignedNumberType | BoundExpressionType>;
};

export const isCoordinateValueType = typia.createIs<CoordinateValueType>();

export const makeCoordinateValueRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CoordinateValueTypeClass, CoordinateValueType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCoordinateValueTypeClass),
        construct: (valueTypeClass: CoordinateValueTypeClass) => {
            const node = makeSourceNode(valueTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(valueTypeClass.getValue(), [
                makeSignedNumberRule(valueSource, errorInfo),
                makeBoundExpressionRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: valueTypeClass.getType(), value };
        },
    };
};

export type ElementValueType = {
    type: string;
    value: ValueRuleValue<LiteralType>;
};

export const isElementValueType = typia.createIs<ElementValueType>();

export const makeElementValueRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ElementValueTypeClass, ElementValueType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isElementValueTypeClass),
        construct: (valueTypeClass: ElementValueTypeClass) => {
            const node = makeSourceNode(valueTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(valueTypeClass.getValue(), [
                makeLiteralRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: valueTypeClass.getType(), value };
        },
    };
};

export type LocationValueType = {
    type: string;
    value: ValueRuleValue<FieldNameType | BoundExpressionType>;
    coordinates: ValueRuleValue<ValueRuleValue<CoordinateValueType>[]> | null;
};

export const isLocationValueType = typia.createIs<LocationValueType>();

export const makeLocationValueRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<LocationValueTypeClass, LocationValueType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLocationValueTypeClass),
        construct: (valueTypeClass: LocationValueTypeClass) => {
            const node = makeSourceNode(valueTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(valueTypeClass.getValue(), [
                makeFieldNameRule(valueSource, errorInfo),
                makeBoundExpressionRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const coordinatesTypeClass = valueTypeClass.getCoordinates();
            let coordinates: ValueRuleValue<ValueRuleValue<CoordinateValueType>[]> | null = null;
            if (coordinatesTypeClass) {
                const coordinatesSource = sourceList(node, 'coordinates');
                coordinates = coordinatesTypeClass.map((v, index) =>
                    assignMultiClass(v, [
                        makeCoordinateValueRule(coordinatesSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            } else {
                sourceField(node, 'coordinates');
            }
            slot(node);
            return { type: valueTypeClass.getType(), value, coordinates };
        },
    };
};

export type ValueType = {
    type: string;
    value: ValueRuleValue<
        | string
        | SignedNumberType
        | DateFormulaType
        | SubQueryType
        | ValueListType
        | BoundExpressionType
    >;
    valueType: string;
};

export const isValueType = typia.createIs<ValueType>();

export const makeValueRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NormalValueTypeClass, ValueType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalValueType),
        construct: (valueTypeClass: NormalValueTypeClass) => {
            const node = makeSourceNode(valueTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(valueTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeSignedNumberRule(valueSource, errorInfo),
                makeDateFormulaRule(valueSource, errorInfo),
                makeSubQueryRule(valueSource, errorInfo),
                makeValueListRule(valueSource, errorInfo),
                makeBoundExpressionRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const valueType = valueTypeClass.getValueType();
            slot(node);
            return { type: valueTypeClass.getType(), value, valueType };
        },
    };
};

export type WhenValueType = {
    type: string;
    value: ValueRuleValue<string | IdType | ValueRuleValue<WhenLiteralType>[]>;
    valueType: ValueRuleValue<TypeRefType>;
};

export const isWhenValueType = typia.createIs<WhenValueType>();

export const makeWhenValueRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<WhenValueTypeClass, WhenValueType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhenValueTypeClass),
        construct: (valueTypeClass: WhenValueTypeClass) => {
            const node = makeSourceNode(valueTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(valueTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                {
                    isValid: (
                        target: unknown,
                    ): target is (WhenLiteralTypeClass | ErrorTypeClass)[] =>
                        Array.isArray(target) &&
                        target.every(
                            (t) =>
                                isTargetTypeClass(t, isWhenLiteralType) ||
                                isTargetTypeClass(t, isErrorType),
                        ),
                    construct: (values: (WhenLiteralTypeClass | ErrorTypeClass)[]) => {
                        const listSource = sourceList(node, 'value');
                        return values.map((v, index) =>
                            assignMultiClass(v, [
                                makeWhenLiteralRule(listSource(index), errorInfo),
                                makeErrorAssignRule(errorInfo),
                            ]),
                        );
                    },
                },
                makeIdRule(valueSource),
                makeErrorAssignRule(errorInfo),
            ]);
            const valueType = assignMultiClass(valueTypeClass.getValueType(), [
                makeTypeRefRule(sourceField(node, 'valueType'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: valueTypeClass.getType(), value, valueType };
        },
    };
};

