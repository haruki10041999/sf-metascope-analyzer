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
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeStringAssignRule,
    makeNullAssignRule,
    makeErrorAssignRule,
    makeSourceInfo,
} from './commons';
import { makeTypeArgumentsRule, TypeArgumentsType } from './arguments';
import { makeIdRule, makeSoqlIdRule, IdType, SoqlIdType } from './id';
import { makeIdCreatedNamePairRule, IdCreatedNamePairType } from './pair';

export type CreatedNameType = CommonType & {
    value: ValueRuleValue<IdCreatedNamePairType>[];
};

export const isCreatedNameType = typia.createIs<CreatedNameType>();

export const makeCreatedNameRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<CreatedNameTypeClass, CreatedNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCreatedNameTypeClass),
        construct: (nameTypeClass: CreatedNameTypeClass) => {
            const value = nameTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [
                        makeIdCreatedNamePairRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            return {
                type: nameTypeClass.getType(),
                sourceInfo: makeSourceInfo(nameTypeClass),
                value,
            };
        },
    };
};

export type DataCategoryNameType = CommonType & {
    value: ValueRuleValue<unknown>[];
};

export const isDataCategoryNameType = typia.createIs<DataCategoryNameType>();

export const makeDataCategoryNameRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<DataCategoryNameTypeClass, DataCategoryNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDataCategoryNameTypeClass),
        construct: (nameTypeClass: DataCategoryNameTypeClass) => {
            const value = nameTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [
                        makeSoqlIdRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            return {
                type: nameTypeClass.getType(),
                sourceInfo: makeSourceInfo(nameTypeClass),
                value,
            };
        },
    };
};

export type DateFieldNameType = CommonType & {
    value: ValueRuleValue<FieldNameType>;
    isConvertTimeZone: boolean;
};

export const isDateFieldNameType = typia.createIs<DateFieldNameType>();

export const makeDateFieldNameRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<DateFieldNameTypeClass, DateFieldNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDateFieldNameTypeClass),
        construct: (nameTypeClass: DateFieldNameTypeClass) => {
            const value = assignMultiClass(nameTypeClass.getValue(), [
                makeFieldNameRule(errorInfo),
                makeErrorAssignRule(errorInfo),
            ]);
            const isConvertTimeZone = nameTypeClass.getConvertTimeZone();
            return {
                type: nameTypeClass.getType(),
                sourceInfo: makeSourceInfo(nameTypeClass),
                value,
                isConvertTimeZone,
            };
        },
    };
};

export type FieldNameType = CommonType & {
    value: ValueRuleValue<SoqlIdType>[];
};

export const isFieldNameType = typia.createIs<FieldNameType>();

export const makeFieldNameRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<FieldNameTypeClass, FieldNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldNameTypeClass),
        construct: (nameTypeClass: FieldNameTypeClass) => {
            const value = nameTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [
                        makeSoqlIdRule(errorInfo),
                        makeErrorAssignRule(errorInfo),
                    ]),
                );
            return {
                type: nameTypeClass.getType(),
                sourceInfo: makeSourceInfo(nameTypeClass),
                value,
            };
        },
    };
};

export type QualifiedNameType = CommonType & {
    value: ValueRuleValue<IdType>[];
};

export const isQualifiedNameType = typia.createIs<QualifiedNameType>();

export const makeQualifiedNameRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<QualifiedNameTypeClass, QualifiedNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isQualifiedNameTypeClass),
        construct: (nameTypeClass: QualifiedNameTypeClass) => {
            const value = nameTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeIdRule(), makeErrorAssignRule(errorInfo)]));
            return {
                type: nameTypeClass.getType(),
                sourceInfo: makeSourceInfo(nameTypeClass),
                value,
            };
        },
    };
};

export type TypeNameType = CommonType & {
    value: ValueRuleValue<string | IdType>;
    generic: ValueRuleValue<TypeArgumentsType | null>;
};

export const isTypeNameType = typia.createIs<TypeNameType>();

export const makeTypeNameRule = (
    errorInfo: ErrorInfo[],
): AssignForValueRule<TypeNameTypeClass, TypeNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeNameTypeClass),
        construct: (nameTypeClass: TypeNameTypeClass) => {
            const value = assignMultiClass(nameTypeClass.getValue(), [
                makeStringAssignRule,
                makeIdRule(),
                makeErrorAssignRule(errorInfo),
            ]);
            const generic = assignMultiClass(nameTypeClass.getGeneric(), [
                makeTypeArgumentsRule(errorInfo),
                makeErrorAssignRule(errorInfo),
                makeNullAssignRule,
            ]);
            return {
                type: nameTypeClass.getType(),
                sourceInfo: makeSourceInfo(nameTypeClass),
                value,
                generic,
            };
        },
    };
};

