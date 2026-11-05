import { isCommonType, CommonType, ValueRuleValue } from './commons';
import { BaseExpressionType } from './expression';
import { FieldGroupByType, FieldOrderType, UpdateTypeType } from './clause';
import { FieldNameType } from './name';
import { FieldSpecType, SoqlFunctionType } from './query';
import { FormalParameterType } from './parameter';
import { SoqlIdType, SoslIdType } from './id';
import { SelectEntryType, SubFieldEntryType } from './entry';
import { TypeRefType } from './type';
import { ValueType } from './value';

export type ExpressionListType = CommonType<'expressionList'> & {
    value: ValueRuleValue<BaseExpressionType>[];
};

export const isExpressionListType = (value: unknown): value is ExpressionListType => {
    return isCommonType(value) && value.type === 'expressionList';
};

export type FieldGroupByListType = CommonType<'fieldGroupByList'> & {
    value: ValueRuleValue<FieldGroupByType>[];
};

export const isFieldGroupByListType = (value: unknown): value is FieldGroupByListType => {
    return isCommonType(value) && value.type === 'fieldGroupByList';
};

export type FieldListType = CommonType<'fieldList'> & {
    value: ValueRuleValue<SoslFieldType>[];
};

export const isFieldListType = (value: unknown): value is FieldListType => {
    return isCommonType(value) && value.type === 'fieldList';
};

export type FieldNameListType = CommonType<'fieldNameList'> & {
    value: ValueRuleValue<FieldNameType>[];
};

export const isFieldNameListType = (value: unknown): value is FieldNameListType => {
    return isCommonType(value) && value.type === 'fieldNameList';
};

export type FieldOrderListType = CommonType<'fieldOrderList'> & {
    value: ValueRuleValue<FieldOrderType>[];
};

export const isFieldOrderListType = (value: unknown): value is FieldOrderListType => {
    return isCommonType(value) && value.type === 'fieldOrderList';
};

export type FieldSpecListType = CommonType<'fieldSpecList'> & {
    value: ValueRuleValue<FieldSpecType>[];
};

export const isFieldSpecListType = (value: unknown): value is FieldSpecListType => {
    return isCommonType(value) && value.type === 'fieldSpecList';
};

export type FormalParameterListType = CommonType<'formalParameterList'> & {
    value: ValueRuleValue<FormalParameterType>[];
};

export const isFormalParameterListType = (value: unknown): value is FormalParameterListType => {
    return isCommonType(value) && value.type === 'formalParameterList';
};

export type FromNameListType = CommonType<'fromNameList'> & {
    value: ValueRuleValue<FromNameType>[];
};

export const isFromNameListType = (value: unknown): value is FromNameListType => {
    return isCommonType(value) && value.type === 'fromNameList';
};

export type FromNameType = CommonType<'fromName'> & {
    value: ValueRuleValue<FieldNameType>;
    alias: ValueRuleValue<SoqlIdType | null>;
};

export const isFromNameType = (value: unknown): value is FromNameType => {
    return isCommonType(value) && value.type === 'fromName';
};

export type NetworkListType = CommonType<'networkList'> & {
    value: ValueRuleValue<string>[];
};

export const isNetworkListType = (value: unknown): value is NetworkListType => {
    return isCommonType(value) && value.type === 'networkList';
};

export type SelectListType = CommonType<'selectList'> & {
    value: ValueRuleValue<SelectEntryType>[];
};

export const isSelectListType = (value: unknown): value is SelectListType => {
    return isCommonType(value) && value.type === 'selectList';
};

export type SoslFieldType = CommonType<'soslField'> & {
    value: ValueRuleValue<SoslIdType | SoqlFunctionType>;
    func: 'TOLABEL' | 'CONVERT_CURRENCY' | 'FORMAT' | null;
};

export const isSoslFieldType = (value: unknown): value is SoslFieldType => {
    return isCommonType(value) && value.type === 'soslField';
};

export type SubFieldListType = CommonType<'subFieldList'> & {
    value: ValueRuleValue<SubFieldEntryType>[];
};

export const isSubFieldListType = (value: unknown): value is SubFieldListType => {
    return isCommonType(value) && value.type === 'subFieldList';
};

export type TypeListType = CommonType<'typeList'> & {
    value: ValueRuleValue<TypeRefType>[];
};

export const isTypeListType = (value: unknown): value is TypeListType => {
    return isCommonType(value) && value.type === 'typeList';
};

export type UpdateListType = CommonType<'updateList'> & {
    value: ValueRuleValue<UpdateTypeType>[];
};

export const isUpdateListType = (value: unknown): value is UpdateListType => {
    return isCommonType(value) && value.type === 'updateList';
};

export type ValueListType = CommonType<'valueList'> & {
    value: ValueRuleValue<ValueType>[];
};

export const isValueListType = (value: unknown): value is ValueListType => {
    return isCommonType(value) && value.type === 'valueList';
};
