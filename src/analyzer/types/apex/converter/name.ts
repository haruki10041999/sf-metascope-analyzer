import typia from 'typia';

import {
    CreatedNameTypeClass,
    DataCategoryNameTypeClass,
    DateFieldNameTypeClass,
    FieldNameTypeClass,
    QualifiedNameTypeClass,
    TypeNameTypeClass,
    isCreatedNameType as isCreatedNameTypeClass,
    isDataCategoryNameType as isDataCategoryNameTypeClass,
    isDateFieldNameType as isDateFieldNameTypeClass,
    isFieldNameType as isFieldNameTypeClass,
    isQualifiedNameType as isQualifiedNameTypeClass,
    isTypeNameType as isTypeNameTypeClass,
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
import { makeTypeArgumentsRule, TypeArgumentsType } from './arguments';
import { makeIdRule, makeSoqlIdRule, IdType, SoqlIdType } from './id';
import { makeIdCreatedNamePairRule, IdCreatedNamePairType } from './pair';

export type CreatedNameType = {
    type: string;
    value: ValueRuleValue<IdCreatedNamePairType>[];
};

export const isCreatedNameType = typia.createIs<CreatedNameType>();

export const makeCreatedNameRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<CreatedNameTypeClass, CreatedNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCreatedNameTypeClass),
        construct: (nameTypeClass: CreatedNameTypeClass) => {
            const node = makeSourceNode(nameTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = nameTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeIdCreatedNamePairRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: nameTypeClass.getType(), value };
        },
    };
};

export type DataCategoryNameType = {
    type: string;
    value: ValueRuleValue<unknown>[];
};

export const isDataCategoryNameType = typia.createIs<DataCategoryNameType>();

export const makeDataCategoryNameRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DataCategoryNameTypeClass, DataCategoryNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDataCategoryNameTypeClass),
        construct: (nameTypeClass: DataCategoryNameTypeClass) => {
            const node = makeSourceNode(nameTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = nameTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeSoqlIdRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: nameTypeClass.getType(), value };
        },
    };
};

export type DateFieldNameType = {
    type: string;
    value: ValueRuleValue<FieldNameType>;
    isConvertTimeZone: boolean;
};

export const isDateFieldNameType = typia.createIs<DateFieldNameType>();

export const makeDateFieldNameRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<DateFieldNameTypeClass, DateFieldNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDateFieldNameTypeClass),
        construct: (nameTypeClass: DateFieldNameTypeClass) => {
            const node = makeSourceNode(nameTypeClass);
            const value = assignMultiClass(nameTypeClass.getValue(), [
                makeFieldNameRule(sourceField(node, 'value'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const isConvertTimeZone = nameTypeClass.getConvertTimeZone();
            slot(node);
            return { type: nameTypeClass.getType(), value, isConvertTimeZone };
        },
    };
};

export type FieldNameType = {
    type: string;
    value: ValueRuleValue<SoqlIdType>[];
};

export const isFieldNameType = typia.createIs<FieldNameType>();

export const makeFieldNameRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldNameTypeClass, FieldNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldNameTypeClass),
        construct: (nameTypeClass: FieldNameTypeClass) => {
            const node = makeSourceNode(nameTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = nameTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeSoqlIdRule(valueSource(index), errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: nameTypeClass.getType(), value };
        },
    };
};

export type QualifiedNameType = {
    type: string;
    value: ValueRuleValue<IdType>[];
};

export const isQualifiedNameType = typia.createIs<QualifiedNameType>();

export const makeQualifiedNameRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<QualifiedNameTypeClass, QualifiedNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isQualifiedNameTypeClass),
        construct: (nameTypeClass: QualifiedNameTypeClass) => {
            const node = makeSourceNode(nameTypeClass);
            const valueSource = sourceList(node, 'value');
            const value = nameTypeClass
                .getValue()
                .map((v, index) =>
                    assignMultiClass(v, [
                        makeIdRule(valueSource(index)),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            slot(node);
            return { type: nameTypeClass.getType(), value };
        },
    };
};

export type TypeNameType = {
    type: string;
    value: ValueRuleValue<string | IdType>;
    generic: ValueRuleValue<TypeArgumentsType>;
};

export const isTypeNameType = typia.createIs<TypeNameType>();

export const makeTypeNameRule = (
    slot: SourceSlot,
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeNameTypeClass, TypeNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeNameTypeClass),
        construct: (nameTypeClass: TypeNameTypeClass) => {
            const node = makeSourceNode(nameTypeClass);
            const value = assignMultiClass(nameTypeClass.getValue(), [
                {
                    isValid: (target: unknown): target is string => typeof target === 'string',
                    construct: (value: string) => value,
                },
                makeIdRule(sourceField(node, 'value')),
                makeErrorAssignRule(errorInfo),
            ]);
            const generic = assignMultiClass(nameTypeClass.getGeneric(), [
                makeTypeArgumentsRule(sourceField(node, 'generic'), errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            slot(node);
            return { type: nameTypeClass.getType(), value, generic };
        },
    };
};

