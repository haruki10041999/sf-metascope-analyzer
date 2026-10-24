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
    makeLimitedStringAssignRule,
} from './commons';
import { makeBoundExpressionAssignRule, BoundExpressionType } from './expression';
import { makeIdAssignRule, IdType } from './id';
import { makeValueListAssignRule, ValueListType } from './list';
import {
    makeLiteralAssignRule,
    makeSignedNumberAssignRule,
    makeWhenLiteralAssignRule,
    LiteralType,
    SignedNumberType,
    SignedIntegerType,
    WhenLiteralType,
} from './literal';
import { makeFieldNameAssignRule, FieldNameType } from './name';
import {
    makeDateFormulaAssignRule,
    makeSubQueryAssignRule,
    DateFormulaType,
    SubQueryType,
} from './query';
import { makeTypeRefAssignRule, TypeRefType } from './type';

export type CoordinateValueType = CommonType<'coordinateValue'> & {
    value: ValueRuleValue<SignedNumberType | BoundExpressionType>;
};

export const isCoordinateValueType = (value: unknown): value is CoordinateValueType => {
    return isCommonType(value) && value.type === 'coordinateValue';
};

export const makeCoordinateValueAssignRule: AssignForValueRule<
    CoordinateValueTypeClass,
    CoordinateValueType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isCoordinateValueTypeClass),
    construct: (valueTypeClass: CoordinateValueTypeClass) => {
        const value = assignMultiClass(valueTypeClass.getValue(), [
            makeSignedNumberAssignRule,
            makeBoundExpressionAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: valueTypeClass.getType(),
            sourceInfo: makeSourceInfo(valueTypeClass),
            value,
        };
    },
};

export type ElementValueType = CommonType<'elementValue'> & {
    value: ValueRuleValue<LiteralType>;
};

export const isElementValueType = (value: unknown): value is ElementValueType => {
    return isCommonType(value) && value.type === 'elementValue';
};

export const makeElementValueAssignRule: AssignForValueRule<
    ElementValueTypeClass,
    ElementValueType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isElementValueTypeClass),
    construct: (valueTypeClass: ElementValueTypeClass) => {
        const value = assignMultiClass(valueTypeClass.getValue(), [
            makeLiteralAssignRule,
            makeErrorAssignRule,
        ]);
        return {
            type: valueTypeClass.getType(),
            sourceInfo: makeSourceInfo(valueTypeClass),
            value,
        };
    },
};

export type LocationValueType = CommonType<'locationValue'> & {
    value: ValueRuleValue<
        FieldNameType | BoundExpressionType | ValueRuleValue<CoordinateValueType>[]
    >;
};

export const isLocationValueType = (value: unknown): value is LocationValueType => {
    return isCommonType(value) && value.type === 'locationValue';
};

export const makeLocationValueAssignRule: AssignForValueRule<
    LocationValueTypeClass,
    LocationValueType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isLocationValueTypeClass),
    construct: (valueTypeClass: LocationValueTypeClass) => {
        const value = assignMultiClass(valueTypeClass.getValue(), [
            {
                isValid: (
                    target: unknown,
                ): target is (CoordinateValueTypeClass | ErrorTypeClass)[] =>
                    Array.isArray(target) &&
                    target.every(
                        (t) =>
                            isTargetTypeClass(t, isCoordinateValueTypeClass) ||
                            isTargetTypeClass(t, isErrorType),
                    ),
                construct: (values: (CoordinateValueTypeClass | ErrorTypeClass)[]) => {
                    return values.map((v) => {
                        return assignMultiClass(v, [
                            makeCoordinateValueAssignRule,
                            makeErrorAssignRule,
                        ]);
                    });
                },
            },
            makeFieldNameAssignRule,
            makeBoundExpressionAssignRule,
            makeErrorAssignRule,
        ]);

        return {
            type: valueTypeClass.getType(),
            sourceInfo: makeSourceInfo(valueTypeClass),
            value,
        };
    },
};

export type ValueType = CommonType<'value'> &
    (
        | {
              value: string;
              valueType:
                  | 'null'
                  | 'boolean'
                  | 'string'
                  | 'integer'
                  | 'longText'
                  | 'date'
                  | 'time'
                  | 'dateTime'
                  | 'currency';
          }
        | {
              value: SignedNumberType;
              valueType: 'number';
          }
        | {
              value: DateFormulaType;
              valueType: 'dateFormula';
          }
        | {
              value: SubQueryType;
              valueType: 'subQuery';
          }
        | {
              value: ValueListType;
              valueType: 'list';
          }
        | {
              value: BoundExpressionType;
              valueType: 'bind';
          }
        | {
              value: ErrorType;
          }
    );

export const isValueType = (value: unknown): value is ValueType => {
    return isCommonType(value) && value.type === 'value';
};

export const makeValueAssignRule: AssignForValueRule<NormalValueTypeClass, ValueType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isNormalValueType),
    construct: (valueTypeClass: NormalValueTypeClass) => {
        const value = assignMultiClass(valueTypeClass.getValue(), [
            makeStringAssignRule,
            makeSignedNumberAssignRule,
            makeDateFormulaAssignRule,
            makeSubQueryAssignRule,
            makeValueListAssignRule,
            makeBoundExpressionAssignRule,
            makeErrorAssignRule,
        ]);

        if (typeof value === 'string') {
            const valueType = valueTypeClass.getValueType() as
                | 'null'
                | 'boolean'
                | 'string'
                | 'integer'
                | 'longText'
                | 'date'
                | 'time'
                | 'dateTime'
                | 'currency';
            return {
                type: valueTypeClass.getType(),
                sourceInfo: makeSourceInfo(valueTypeClass),
                value,
                valueType,
            };
        } else if (value.type === 'signedNumber') {
            const valueType = valueTypeClass.getValueType() as 'number';
            return {
                type: valueTypeClass.getType(),
                sourceInfo: makeSourceInfo(valueTypeClass),
                value,
                valueType,
            };
        } else if (value.type === 'dateFormula') {
            const valueType = valueTypeClass.getValueType() as 'dateFormula';
            return {
                type: valueTypeClass.getType(),
                sourceInfo: makeSourceInfo(valueTypeClass),
                value,
                valueType,
            };
        } else if (value.type === 'subQuery') {
            const valueType = valueTypeClass.getValueType() as 'subQuery';
            return {
                type: valueTypeClass.getType(),
                sourceInfo: makeSourceInfo(valueTypeClass),
                value,
                valueType,
            };
        } else if (value.type === 'valueList') {
            const valueType = valueTypeClass.getValueType() as 'list';
            return {
                type: valueTypeClass.getType(),
                sourceInfo: makeSourceInfo(valueTypeClass),
                value,
                valueType,
            };
        } else if (value.type === 'boundExpression') {
            const valueType = valueTypeClass.getValueType() as 'bind';
            return {
                type: valueTypeClass.getType(),
                sourceInfo: makeSourceInfo(valueTypeClass),
                value,
                valueType,
            };
        } else {
            return {
                type: valueTypeClass.getType(),
                sourceInfo: makeSourceInfo(valueTypeClass),
                value,
            };
        }
    },
};

export type WhenValueType = CommonType<'whenValue'> &
    (
        | {
              value: ValueRuleValue<'else' | ValueRuleValue<WhenLiteralType>[]>;
          }
        | {
              value: ValueRuleValue<IdType>;
              valueType: ValueRuleValue<TypeRefType>;
          }
    );

export const isWhenValueType = (value: unknown): value is WhenValueType => {
    return isCommonType(value) && value.type === 'whenValue';
};

export const makeWhenValueAssignRule: AssignForValueRule<WhenValueTypeClass, WhenValueType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isWhenValueTypeClass),
    construct: (valueTypeClass: WhenValueTypeClass) => {
        const value = assignMultiClass(valueTypeClass.getValue(), [
            makeLimitedStringAssignRule(['else']),
            {
                isValid: (target: unknown): target is (WhenLiteralTypeClass | ErrorTypeClass)[] =>
                    Array.isArray(target) &&
                    target.every(
                        (t) =>
                            isTargetTypeClass(t, isWhenLiteralType) ||
                            isTargetTypeClass(t, isErrorType),
                    ),
                construct: (values: (WhenLiteralTypeClass | ErrorTypeClass)[]) => {
                    return values.map((v) =>
                        assignMultiClass(v, [makeWhenLiteralAssignRule, makeErrorAssignRule]),
                    );
                },
            },
            makeIdAssignRule,
            makeErrorAssignRule,
        ]);

        if (isCommonType(value) && value.type === 'id') {
            const valueType = assignMultiClass(valueTypeClass.getValueType(), [
                makeTypeRefAssignRule,
                makeErrorAssignRule,
            ]);
            return {
                type: valueTypeClass.getType(),
                sourceInfo: makeSourceInfo(valueTypeClass),
                value,
                valueType,
            };
        } else {
            return {
                type: valueTypeClass.getType(),
                sourceInfo: makeSourceInfo(valueTypeClass),
                value,
            };
        }
    },
};
