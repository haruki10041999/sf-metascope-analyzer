import typia from 'typia';

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
import {
    makeFieldGroupByRule,
    makeFieldOrderRule,
    makeUpdateTypeRule,
    FieldGroupByType,
    FieldOrderType,
    UpdateTypeType,
} from './clause';
import { makeFieldNameRule, FieldNameType } from './name';
import { makeFieldSpecRule, makeSoqlFunctionRule, FieldSpecType, SoqlFunctionType } from './query';
import { makeFormalParameterRule, FormalParameterType } from './parameter';
import { makeSoqlIdRule, makeSoslIdRule, SoqlIdType, SoslIdType } from './id';
import {
    makeSelectEntryRule,
    makeSubFieldEntryRule,
    SelectEntryType,
    SubFieldEntryType,
} from './entry';
import { makeTypeRefRule, TypeRefType } from './type';
import { makeValueRule, ValueType } from './value';

export type ExpressionListType = {
    type: string;
    value: ValueRuleValue<BaseExpressionType>[];
};

export const isExpressionListType = typia.createIs<ExpressionListType>();

export const makeExpressionListRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ExpressionListTypeClass, ExpressionListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isExpressionListTypeClass),
        construct: (listTypeClass: ExpressionListTypeClass) => {
            const node = makeSourceNode(listTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = listTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        ...makeBaseExpressionRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: listTypeClass.getType(), value };
        },
    };
};

export type FieldGroupByListType = {
    type: string;
    value: ValueRuleValue<FieldGroupByType>[];
};

export const isFieldGroupByListType = typia.createIs<FieldGroupByListType>();

export const makeFieldGroupByListRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldGroupByListTypeClass, FieldGroupByListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldGroupByListTypeClass),
        construct: (listTypeClass: FieldGroupByListTypeClass) => {
            const node = makeSourceNode(listTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = listTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeFieldGroupByRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: listTypeClass.getType(), value };
        },
    };
};

export type FieldListType = {
    type: string;
    value: ValueRuleValue<SoslFieldType>[];
};

export const isFieldListType = typia.createIs<FieldListType>();

export const makeFieldListRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldListTypeClass, FieldListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldListTypeClass),
        construct: (listTypeClass: FieldListTypeClass) => {
            const node = makeSourceNode(listTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = listTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeSoslFieldRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: listTypeClass.getType(), value };
        },
    };
};

export type FieldNameListType = {
    type: string;
    value: ValueRuleValue<FieldNameType>[];
};

export const isFieldNameListType = typia.createIs<FieldNameListType>();

export const makeFieldNameListRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldNameListTypeClass, FieldNameListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldNameListTypeClass),
        construct: (listTypeClass: FieldNameListTypeClass) => {
            const node = makeSourceNode(listTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = listTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeFieldNameRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: listTypeClass.getType(), value };
        },
    };
};

export type FieldOrderListType = {
    type: string;
    value: ValueRuleValue<FieldOrderType>[];
};

export const isFieldOrderListType = typia.createIs<FieldOrderListType>();

export const makeFieldOrderListRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldOrderListTypeClass, FieldOrderListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldOrderListTypeClass),
        construct: (listTypeClass: FieldOrderListTypeClass) => {
            const node = makeSourceNode(listTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = listTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeFieldOrderRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: listTypeClass.getType(), value };
        },
    };
};

export type FieldSpecListType = {
    type: string;
    value: ValueRuleValue<FieldSpecType>[];
};

export const isFieldSpecListType = typia.createIs<FieldSpecListType>();

export const makeFieldSpecListRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldSpecListTypeClass, FieldSpecListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldSpecListTypeClass),
        construct: (listTypeClass: FieldSpecListTypeClass) => {
            const node = makeSourceNode(listTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = listTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeFieldSpecRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: listTypeClass.getType(), value };
        },
    };
};

export type FormalParameterListType = {
    type: string;
    value: ValueRuleValue<FormalParameterType>[];
};

export const isFormalParameterListType = typia.createIs<FormalParameterListType>();

export const makeFormalParameterListRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FormalParameterListTypeClass, FormalParameterListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFormalParameterListTypeClass),
        construct: (listTypeClass: FormalParameterListTypeClass) => {
            const node = makeSourceNode(listTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = listTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeFormalParameterRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: listTypeClass.getType(), value };
        },
    };
};

export type FromNameListType = {
    type: string;
    value: ValueRuleValue<FromNameType>[];
};

export const isFromNameListType = typia.createIs<FromNameListType>();

export const makeFromNameListRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FromNameListTypeClass, FromNameListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFromNameListTypeClass),
        construct: (listTypeClass: FromNameListTypeClass) => {
            const node = makeSourceNode(listTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = listTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeFromNameRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: listTypeClass.getType(), value };
        },
    };
};

export type FromNameType = {
    type: string;
    value: ValueRuleValue<FieldNameType>;
    alias: ValueRuleValue<SoqlIdType>;
};

export const isFromNameType = typia.createIs<FromNameType>();

export const makeFromNameRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FromNameTypeClass, FromNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFromNameTypeClass),
        construct: (listTypeClass: FromNameTypeClass) => {
            const node = makeSourceNode(listTypeClass);
            const value = assignMultiClass(listTypeClass.getValue(), [
                makeFieldNameRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const alias = assignMultiClass(listTypeClass.getAlias(), [
                makeSoqlIdRule(sourceField(node, 'alias'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: listTypeClass.getType(), value, alias };
        },
    };
};

export type NetworkListType = {
    type: string;
    value: ValueRuleValue<string>[];
};

export const isNetworkListType = typia.createIs<NetworkListType>();

export const makeNetworkListRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<NetworkListTypeClass, NetworkListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isNetworkListTypeClass),
        construct: (listTypeClass: NetworkListTypeClass) => {
            const value = listTypeClass.getValue().map((v) =>
                assignMultiClass(v, [
                    {
                        isValid: (target: unknown): target is string => typeof target === 'string',
                        construct: (value: string) => value,
                    },
                    makeErrorAssignRule(errorInfo),
                ]),
            );
            slot(makeSourceNode(listTypeClass));
            return { type: listTypeClass.getType(), value };
        },
    };
};

export type SelectListType = {
    type: string;
    value: ValueRuleValue<SelectEntryType>[];
};

export const isSelectListType = typia.createIs<SelectListType>();

export const makeSelectListRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SelectListTypeClass, SelectListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSelectListTypeClass),
        construct: (listTypeClass: SelectListTypeClass) => {
            const node = makeSourceNode(listTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = listTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeSelectEntryRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: listTypeClass.getType(), value };
        },
    };
};

export type SoslFieldType = {
    type: string;
    value: ValueRuleValue<SoslIdType | SoqlFunctionType>;
    func: ValueRuleValue<string>;
};

export const isSoslFieldType = typia.createIs<SoslFieldType>();

export const makeSoslFieldRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SoslFieldTypeClass, SoslFieldType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSoslFieldTypeClass),
        construct: (listTypeClass: SoslFieldTypeClass) => {
            const node = makeSourceNode(listTypeClass);
            const valueSource = sourceField(node, 'value');
            const value = assignMultiClass(listTypeClass.getValue(), [
                makeSoslIdRule(valueSource, errorInfo),
                makeSoqlFunctionRule(valueSource, errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const func = listTypeClass.getFunc();
            slot(node);
            return { type: listTypeClass.getType(), value, func };
        },
    };
};

export type SubFieldListType = {
    type: string;
    value: ValueRuleValue<SubFieldEntryType>[];
};

export const isSubFieldListType = typia.createIs<SubFieldListType>();

export const makeSubFieldListRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<SubFieldListTypeClass, SubFieldListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isSubFieldListTypeClass),
        construct: (listTypeClass: SubFieldListTypeClass) => {
            const node = makeSourceNode(listTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = listTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeSubFieldEntryRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: listTypeClass.getType(), value };
        },
    };
};

export type TypeListType = {
    type: string;
    value: ValueRuleValue<TypeRefType>[];
};

export const isTypeListType = typia.createIs<TypeListType>();

export const makeTypeListRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeListTypeClass, TypeListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeListTypeClass),
        construct: (listTypeClass: TypeListTypeClass) => {
            const node = makeSourceNode(listTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = listTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeTypeRefRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: listTypeClass.getType(), value };
        },
    };
};

export type UpdateListType = {
    type: string;
    value: ValueRuleValue<UpdateTypeType>[];
};

export const isUpdateListType = typia.createIs<UpdateListType>();

export const makeUpdateListRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<UpdateListTypeClass, UpdateListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isUpdateListTypeClass),
        construct: (listTypeClass: UpdateListTypeClass) => {
            const node = makeSourceNode(listTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = listTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeUpdateTypeRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: listTypeClass.getType(), value };
        },
    };
};

export type ValueListType = {
    type: string;
    value: ValueRuleValue<ValueType>[];
};

export const isValueListType = typia.createIs<ValueListType>();

export const makeValueListRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<ValueListTypeClass, ValueListType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isValueListTypeClass),
        construct: (listTypeClass: ValueListTypeClass) => {
            const node = makeSourceNode(listTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = listTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeValueRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: listTypeClass.getType(), value };
        },
    };
};

