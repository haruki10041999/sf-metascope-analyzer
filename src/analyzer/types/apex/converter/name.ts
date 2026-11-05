import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { TypeArgumentsType } from './arguments';
import { IdType, SoqlIdType } from './id';
import { IdCreatedNamePairType } from './pair';

export type CreatedNameType = CommonType<'createdName'> & {
    value: ValueRuleValue<IdCreatedNamePairType>[];
};

export const isCreatedNameType = (value: unknown): value is CreatedNameType => {
    return isCommonType(value) && value.type === 'createdName';
};

export type DataCategoryNameType = CommonType<'dataCategoryName'> & {
    value: ValueRuleValue<SoqlIdType>[];
};

export const isDataCategoryNameType = (value: unknown): value is DataCategoryNameType => {
    return isCommonType(value) && value.type === 'dataCategoryName';
};

export type DateFieldNameType = CommonType<'dateFieldName'> & {
    value: ValueRuleValue<FieldNameType>;
    isConvertTimeZone: boolean;
};

export const isDateFieldNameType = (value: unknown): value is DateFieldNameType => {
    return isCommonType(value) && value.type === 'dateFieldName';
};

export type FieldNameType = CommonType<'fieldName'> & {
    value: ValueRuleValue<SoqlIdType>[];
};

export const isFieldNameType = (value: unknown): value is FieldNameType => {
    return isCommonType(value) && value.type === 'fieldName';
};

export type QualifiedNameType = CommonType<'qualifiedName'> & {
    value: ValueRuleValue<IdType>[];
};

export const isQualifiedNameType = (value: unknown): value is QualifiedNameType => {
    return isCommonType(value) && value.type === 'qualifiedName';
};

export type TypeNameType = CommonType<'typeName'> &
    (
        | {
              value: 'list' | 'set' | 'map';
          }
        | {
              value: ValueRuleValue<IdType>;
          }
    ) & {
        generic: ValueRuleValue<TypeArgumentsType | null>;
    };

export const isTypeNameType = (value: unknown): value is TypeNameType => {
    return isCommonType(value) && value.type === 'typeName';
};
