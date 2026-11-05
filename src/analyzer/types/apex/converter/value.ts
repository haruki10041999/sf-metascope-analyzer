import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { BoundExpressionType } from './expression';
import { IdType } from './id';
import { ValueListType } from './list';
import { LiteralType, SignedNumberType, WhenLiteralType } from './literal';
import { FieldNameType } from './name';
import { DateFormulaType, SubQueryType } from './query';
import { TypeRefType } from './type';

export type CoordinateValueType = CommonType<'coordinateValue'> & {
    value: ValueRuleValue<SignedNumberType | BoundExpressionType>;
};

export const isCoordinateValueType = (value: unknown): value is CoordinateValueType => {
    return isCommonType(value) && value.type === 'coordinateValue';
};

export type ElementValueType = CommonType<'elementValue'> & {
    value: ValueRuleValue<LiteralType>;
};

export const isElementValueType = (value: unknown): value is ElementValueType => {
    return isCommonType(value) && value.type === 'elementValue';
};

export type LocationValueType = CommonType<'locationValue'> & {
    value: ValueRuleValue<
        FieldNameType | BoundExpressionType | ValueRuleValue<CoordinateValueType>[]
    >;
};

export const isLocationValueType = (value: unknown): value is LocationValueType => {
    return isCommonType(value) && value.type === 'locationValue';
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
              value: ValueRuleValue<BoundExpressionType>;
              valueType: 'bind';
          }
    );

export const isValueType = (value: unknown): value is ValueType => {
    return isCommonType(value) && value.type === 'value';
};

export type WhenValueType = CommonType<'whenValue'> &
    (
        | {
              value: 'else';
          }
        | {
              value: ValueRuleValue<WhenLiteralType>[];
          }
        | {
              value: ValueRuleValue<IdType>;
              valueType: ValueRuleValue<TypeRefType>;
          }
    );

export const isWhenValueType = (value: unknown): value is WhenValueType => {
    return isCommonType(value) && value.type === 'whenValue';
};
