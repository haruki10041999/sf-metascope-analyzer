import {
    ExpressionListTypeClass,
    FieldGroupByListTypeClass,
    FieldListTypeClass,
    FieldNameListTypeClass,
    FieldOrderListTypeClass,
    FieldSpecListTypeClass,
    FormalParameterListTypeClass,
    FromNameListTypeClass,
    FromNameTypeClass,
    NetworkListTypeClass,
    SelectListTypeClass,
    SoslFieldTypeClass,
    SubFieldListTypeClass,
    TypeListTypeClass,
    UpdateListTypeClass,
    ValueListTypeClass,
    isExpressionListType as isExpressionListTypeClass,
    isFieldGroupByListType as isFieldGroupByListTypeClass,
    isFieldListType as isFieldListTypeClass,
    isFieldNameListType as isFieldNameListTypeClass,
    isFieldOrderListType as isFieldOrderListTypeClass,
    isFieldSpecListType as isFieldSpecListTypeClass,
    isFormalParameterListType as isFormalParameterListTypeClass,
    isFromNameListType as isFromNameListTypeClass,
    isFromNameType as isFromNameTypeClass,
    isNetworkListType as isNetworkListTypeClass,
    isSelectListType as isSelectListTypeClass,
    isSoslFieldType as isSoslFieldTypeClass,
    isSubFieldListType as isSubFieldListTypeClass,
    isTypeListType as isTypeListTypeClass,
    isUpdateListType as isUpdateListTypeClass,
    isValueListType as isValueListTypeClass,
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
    makeStringAssignRule,
    makeSourceInfo,
} from './commons';
import { makeBaseExpressionAssignRules, BaseExpressionType } from './expression';
import {
    makeFieldGroupByAssignRule,
    makeFieldOrderAssignRule,
    makeUpdateTypeAssignRule,
    FieldGroupByType,
    FieldOrderType,
    UpdateTypeType,
} from './clause';
import { makeFieldNameAssignRule, FieldNameType } from './name';
import {
    makeFieldSpecAssignRule,
    makeSoqlFunctionAssignRule,
    FieldSpecType,
    SoqlFunctionType,
} from './query';
import { makeFormalParameterAssignRule, FormalParameterType } from './parameter';
import { makeSoqlIdAssignRule, makeSoslIdAssignRule, SoqlIdType, SoslIdType } from './id';
import {
    makeSelectEntryAssignRule,
    makeSubFieldEntryAssignRule,
    SelectEntryType,
    SubFieldEntryType,
} from './entry';
import { makeTypeRefAssignRule, TypeRefType } from './type';
import { makeValueAssignRule, ValueType } from './value';

export type ExpressionListType = CommonType<'expressionList'> & {
    value: ValueRuleValue<BaseExpressionType>[];
};

export const isExpressionListType = (value: unknown): value is ExpressionListType => {
    return isCommonType(value) && value.type === 'expressionList';
};

export const makeExpressionListAssignRule: AssignForValueRule<
    ExpressionListTypeClass,
    ExpressionListType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isExpressionListTypeClass),
    construct: (listTypeClass: ExpressionListTypeClass) => {
        const value = listTypeClass
            .getValue()
            .map((v) =>
                assignMultiClass(v, [...makeBaseExpressionAssignRules, makeErrorAssignRule]),
            );
        return {
            type: listTypeClass.getType(),
            sourceInfo: makeSourceInfo(listTypeClass),
            value,
        };
    },
};

export type FieldGroupByListType = CommonType<'fieldGroupByList'> & {
    value: ValueRuleValue<FieldGroupByType>[];
};

export const isFieldGroupByListType = (value: unknown): value is FieldGroupByListType => {
    return isCommonType(value) && value.type === 'fieldGroupByList';
};

export const makeFieldGroupByListAssignRule: AssignForValueRule<
    FieldGroupByListTypeClass,
    FieldGroupByListType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFieldGroupByListTypeClass),
    construct: (listTypeClass: FieldGroupByListTypeClass) => {
        const value = listTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeFieldGroupByAssignRule, makeErrorAssignRule]));
        return {
            type: listTypeClass.getType(),
            sourceInfo: makeSourceInfo(listTypeClass),
            value,
        };
    },
};

export type FieldListType = CommonType<'fieldList'> & {
    value: ValueRuleValue<SoslFieldType>[];
};

export const isFieldListType = (value: unknown): value is FieldListType => {
    return isCommonType(value) && value.type === 'fieldList';
};

export const makeFieldListAssignRule: AssignForValueRule<FieldListTypeClass, FieldListType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFieldListTypeClass),
    construct: (listTypeClass: FieldListTypeClass) => {
        const value = listTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeSoslFieldAssignRule, makeErrorAssignRule]));
        return {
            type: listTypeClass.getType(),
            sourceInfo: makeSourceInfo(listTypeClass),
            value,
        };
    },
};

export type FieldNameListType = CommonType<'fieldNameList'> & {
    value: ValueRuleValue<FieldNameType>[];
};

export const isFieldNameListType = (value: unknown): value is FieldNameListType => {
    return isCommonType(value) && value.type === 'fieldNameList';
};

export const makeFieldNameListAssignRule: AssignForValueRule<
    FieldNameListTypeClass,
    FieldNameListType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFieldNameListTypeClass),
    construct: (listTypeClass: FieldNameListTypeClass) => {
        const value = listTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeFieldNameAssignRule, makeErrorAssignRule]));
        return {
            type: listTypeClass.getType(),
            sourceInfo: makeSourceInfo(listTypeClass),
            value,
        };
    },
};

export type FieldOrderListType = CommonType<'fieldOrderList'> & {
    value: ValueRuleValue<FieldOrderType>[];
};

export const isFieldOrderListType = (value: unknown): value is FieldOrderListType => {
    return isCommonType(value) && value.type === 'fieldOrderList';
};

export const makeFieldOrderListAssignRule: AssignForValueRule<
    FieldOrderListTypeClass,
    FieldOrderListType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFieldOrderListTypeClass),
    construct: (listTypeClass: FieldOrderListTypeClass) => {
        const value = listTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeFieldOrderAssignRule, makeErrorAssignRule]));
        return {
            type: listTypeClass.getType(),
            sourceInfo: makeSourceInfo(listTypeClass),
            value,
        };
    },
};

export type FieldSpecListType = CommonType<'fieldSpecList'> & {
    value: ValueRuleValue<FieldSpecType>[];
};

export const isFieldSpecListType = (value: unknown): value is FieldSpecListType => {
    return isCommonType(value) && value.type === 'fieldSpecList';
};

export const makeFieldSpecListAssignRule: AssignForValueRule<
    FieldSpecListTypeClass,
    FieldSpecListType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFieldSpecListTypeClass),
    construct: (listTypeClass: FieldSpecListTypeClass) => {
        const value = listTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeFieldSpecAssignRule, makeErrorAssignRule]));
        return {
            type: listTypeClass.getType(),
            sourceInfo: makeSourceInfo(listTypeClass),
            value,
        };
    },
};

export type FormalParameterListType = CommonType<'formalParameterList'> & {
    value: ValueRuleValue<FormalParameterType>[];
};

export const isFormalParameterListType = (value: unknown): value is FormalParameterListType => {
    return isCommonType(value) && value.type === 'formalParameterList';
};

export const makeFormalParameterListAssignRule: AssignForValueRule<
    FormalParameterListTypeClass,
    FormalParameterListType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFormalParameterListTypeClass),
    construct: (listTypeClass: FormalParameterListTypeClass) => {
        const value = listTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeFormalParameterAssignRule, makeErrorAssignRule]));
        return {
            type: listTypeClass.getType(),
            sourceInfo: makeSourceInfo(listTypeClass),
            value,
        };
    },
};

export type FromNameListType = CommonType<'fromNameList'> & {
    value: ValueRuleValue<FromNameType>[];
};

export const isFromNameListType = (value: unknown): value is FromNameListType => {
    return isCommonType(value) && value.type === 'fromNameList';
};

export const makeFromNameListAssignRule: AssignForValueRule<
    FromNameListTypeClass,
    FromNameListType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFromNameListTypeClass),
    construct: (listTypeClass: FromNameListTypeClass) => {
        const value = listTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeFromNameAssignRule, makeErrorAssignRule]));
        return {
            type: listTypeClass.getType(),
            sourceInfo: makeSourceInfo(listTypeClass),
            value,
        };
    },
};

export type FromNameType = CommonType<'fromName'> & {
    value: ValueRuleValue<FieldNameType>;
    alias: ValueRuleValue<SoqlIdType | null>;
};

export const isFromNameType = (value: unknown): value is FromNameType => {
    return isCommonType(value) && value.type === 'fromName';
};

export const makeFromNameAssignRule: AssignForValueRule<FromNameTypeClass, FromNameType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFromNameTypeClass),
    construct: (listTypeClass: FromNameTypeClass) => {
        const value = assignMultiClass(listTypeClass.getValue(), [
            makeFieldNameAssignRule,
            makeErrorAssignRule,
        ]);
        const alias = assignMultiClass(listTypeClass.getAlias(), [
            makeSoqlIdAssignRule,
            makeErrorAssignRule,
            makeNullAssignRule,
        ]);
        return {
            type: listTypeClass.getType(),
            sourceInfo: makeSourceInfo(listTypeClass),
            value,
            alias,
        };
    },
};

export type NetworkListType = CommonType<'networkList'> & {
    value: ValueRuleValue<string>[];
};

export const isNetworkListType = (value: unknown): value is NetworkListType => {
    return isCommonType(value) && value.type === 'networkList';
};

export const makeNetworkListAssignRule: AssignForValueRule<NetworkListTypeClass, NetworkListType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isNetworkListTypeClass),
        construct: (listTypeClass: NetworkListTypeClass) => {
            const value = listTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeStringAssignRule, makeErrorAssignRule]));
            return {
                type: listTypeClass.getType(),
                sourceInfo: makeSourceInfo(listTypeClass),
                value,
            };
        },
    };

export type SelectListType = CommonType<'selectList'> & {
    value: ValueRuleValue<SelectEntryType>[];
};

export const isSelectListType = (value: unknown): value is SelectListType => {
    return isCommonType(value) && value.type === 'selectList';
};

export const makeSelectListAssignRule: AssignForValueRule<SelectListTypeClass, SelectListType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSelectListTypeClass),
    construct: (listTypeClass: SelectListTypeClass) => {
        const value = listTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeSelectEntryAssignRule, makeErrorAssignRule]));
        return {
            type: listTypeClass.getType(),
            sourceInfo: makeSourceInfo(listTypeClass),
            value,
        };
    },
};

export type SoslFieldType = CommonType<'soslField'> & {
    value: ValueRuleValue<SoslIdType | SoqlFunctionType>;
    func: string | null;
};

export const isSoslFieldType = (value: unknown): value is SoslFieldType => {
    return isCommonType(value) && value.type === 'soslField';
};

export const makeSoslFieldAssignRule: AssignForValueRule<SoslFieldTypeClass, SoslFieldType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSoslFieldTypeClass),
    construct: (listTypeClass: SoslFieldTypeClass) => {
        const value = assignMultiClass(listTypeClass.getValue(), [
            makeSoslIdAssignRule,
            makeSoqlFunctionAssignRule,
            makeErrorAssignRule,
        ]);
        const func = listTypeClass.getFunc();
        return {
            type: listTypeClass.getType(),
            sourceInfo: makeSourceInfo(listTypeClass),
            value,
            func,
        };
    },
};

export type SubFieldListType = CommonType<'subFieldList'> & {
    value: ValueRuleValue<SubFieldEntryType>[];
};

export const isSubFieldListType = (value: unknown): value is SubFieldListType => {
    return isCommonType(value) && value.type === 'subFieldList';
};

export const makeSubFieldListAssignRule: AssignForValueRule<
    SubFieldListTypeClass,
    SubFieldListType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isSubFieldListTypeClass),
    construct: (listTypeClass: SubFieldListTypeClass) => {
        const value = listTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeSubFieldEntryAssignRule, makeErrorAssignRule]));
        return {
            type: listTypeClass.getType(),
            sourceInfo: makeSourceInfo(listTypeClass),
            value,
        };
    },
};

export type TypeListType = CommonType<'typeList'> & {
    value: ValueRuleValue<TypeRefType>[];
};

export const isTypeListType = (value: unknown): value is TypeListType => {
    return isCommonType(value) && value.type === 'typeList';
};

export const makeTypeListAssignRule: AssignForValueRule<TypeListTypeClass, TypeListType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isTypeListTypeClass),
    construct: (listTypeClass: TypeListTypeClass) => {
        const value = listTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeTypeRefAssignRule, makeErrorAssignRule]));
        return {
            type: listTypeClass.getType(),
            sourceInfo: makeSourceInfo(listTypeClass),
            value,
        };
    },
};

export type UpdateListType = CommonType<'updateList'> & {
    value: ValueRuleValue<UpdateTypeType>[];
};

export const isUpdateListType = (value: unknown): value is UpdateListType => {
    return isCommonType(value) && value.type === 'updateList';
};

export const makeUpdateListAssignRule: AssignForValueRule<UpdateListTypeClass, UpdateListType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isUpdateListTypeClass),
    construct: (listTypeClass: UpdateListTypeClass) => {
        const value = listTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeUpdateTypeAssignRule, makeErrorAssignRule]));
        return {
            type: listTypeClass.getType(),
            sourceInfo: makeSourceInfo(listTypeClass),
            value,
        };
    },
};

export type ValueListType = CommonType<'valueList'> & {
    value: ValueRuleValue<ValueType>[];
};

export const isValueListType = (value: unknown): value is ValueListType => {
    return isCommonType(value) && value.type === 'valueList';
};

export const makeValueListAssignRule: AssignForValueRule<ValueListTypeClass, ValueListType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isValueListTypeClass),
    construct: (listTypeClass: ValueListTypeClass) => {
        const value = listTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeValueAssignRule, makeErrorAssignRule]));
        return {
            type: listTypeClass.getType(),
            sourceInfo: makeSourceInfo(listTypeClass),
            value,
        };
    },
};
