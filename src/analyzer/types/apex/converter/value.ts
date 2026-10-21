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

export type CoordinateValueType = CommonType & {
    value: ValueRuleValue<SignedNumberType | BoundExpressionType>;
};

export const isCoordinateValueType = typia.createIs<CoordinateValueType>();

export const makeCoordinateValueRule = (): AssignForValueRule<
    CoordinateValueTypeClass,
    CoordinateValueType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCoordinateValueTypeClass),
        construct: (valueTypeClass: CoordinateValueTypeClass) => {
            const value = assignMultiClass(valueTypeClass.getValue(), [
                makeSignedNumberRule(),
                makeBoundExpressionRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: valueTypeClass.getType(),
                sourceInfo: makeSourceInfo(valueTypeClass),
                value,
            };
        },
    };
};

export type ElementValueType = CommonType & {
    value: ValueRuleValue<LiteralType>;
};

export const isElementValueType = typia.createIs<ElementValueType>();

export const makeElementValueRule = (): AssignForValueRule<
    ElementValueTypeClass,
    ElementValueType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isElementValueTypeClass),
        construct: (valueTypeClass: ElementValueTypeClass) => {
            const value = assignMultiClass(valueTypeClass.getValue(), [
                makeLiteralRule(),
                makeErrorAssignRule,
            ]);
            return {
                type: valueTypeClass.getType(),
                sourceInfo: makeSourceInfo(valueTypeClass),
                value,
            };
        },
    };
};

export type LocationValueType = CommonType & {
    value: ValueRuleValue<FieldNameType | BoundExpressionType | null>;
    coordinates: ValueRuleValue<ValueRuleValue<CoordinateValueType>[]> | null;
};

export const isLocationValueType = typia.createIs<LocationValueType>();

export const makeLocationValueRule = (): AssignForValueRule<
    LocationValueTypeClass,
    LocationValueType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isLocationValueTypeClass),
        construct: (valueTypeClass: LocationValueTypeClass) => {
            const value = assignMultiClass(valueTypeClass.getValue(), [
                makeFieldNameRule(),
                makeBoundExpressionRule(),
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);
            const coordinatesTypeClass = valueTypeClass.getCoordinates();
            let coordinates: ValueRuleValue<ValueRuleValue<CoordinateValueType>[]> | null = null;
            if (coordinatesTypeClass) {
                coordinates = coordinatesTypeClass.map((v) =>
                    assignMultiClass(v, [makeCoordinateValueRule(), makeErrorAssignRule]),
                );
            }
            return {
                type: valueTypeClass.getType(),
                sourceInfo: makeSourceInfo(valueTypeClass),
                value,
                coordinates,
            };
        },
    };
};

export type ValueType = CommonType & {
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

export const makeValueRule = (): AssignForValueRule<NormalValueTypeClass, ValueType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNormalValueType),
        construct: (valueTypeClass: NormalValueTypeClass) => {
            const value = assignMultiClass(valueTypeClass.getValue(), [
                makeStringAssignRule,
                makeSignedNumberRule(),
                makeDateFormulaRule(),
                makeSubQueryRule(),
                makeValueListRule(),
                makeBoundExpressionRule(),
                makeErrorAssignRule,
            ]);
            const valueType = valueTypeClass.getValueType();
            return {
                type: valueTypeClass.getType(),
                sourceInfo: makeSourceInfo(valueTypeClass),
                value,
                valueType,
            };
        },
    };
};

export type WhenValueType = CommonType & {
    value: ValueRuleValue<string | IdType | ValueRuleValue<WhenLiteralType>[]>;
    valueType: ValueRuleValue<TypeRefType | null>;
};

export const isWhenValueType = typia.createIs<WhenValueType>();

export const makeWhenValueRule = (): AssignForValueRule<WhenValueTypeClass, WhenValueType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isWhenValueTypeClass),
        construct: (valueTypeClass: WhenValueTypeClass) => {
            const value = assignMultiClass(valueTypeClass.getValue(), [
                makeStringAssignRule,
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
                        return values.map((v) =>
                            assignMultiClass(v, [makeWhenLiteralRule(), makeErrorAssignRule]),
                        );
                    },
                },
                makeIdRule(),
                makeErrorAssignRule,
            ]);
            const valueType = assignMultiClass(valueTypeClass.getValueType(), [
                makeTypeRefRule(),
                makeErrorAssignRule,
                makeNullAssignRule,
            ]);
            return {
                type: valueTypeClass.getType(),
                sourceInfo: makeSourceInfo(valueTypeClass),
                value,
                valueType,
            };
        },
    };
};

