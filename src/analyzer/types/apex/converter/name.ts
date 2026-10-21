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

export const makeCreatedNameRule = (): AssignForValueRule<
    CreatedNameTypeClass,
    CreatedNameType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isCreatedNameTypeClass),
        construct: (nameTypeClass: CreatedNameTypeClass) => {
            const value = nameTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [makeIdCreatedNamePairRule(), makeErrorAssignRule]),
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

export const makeDataCategoryNameRule = (): AssignForValueRule<
    DataCategoryNameTypeClass,
    DataCategoryNameType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDataCategoryNameTypeClass),
        construct: (nameTypeClass: DataCategoryNameTypeClass) => {
            const value = nameTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeSoqlIdRule(), makeErrorAssignRule]));
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

export const makeDateFieldNameRule = (): AssignForValueRule<
    DateFieldNameTypeClass,
    DateFieldNameType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isDateFieldNameTypeClass),
        construct: (nameTypeClass: DateFieldNameTypeClass) => {
            const value = assignMultiClass(nameTypeClass.getValue(), [
                makeFieldNameRule(),
                makeErrorAssignRule,
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

export const makeFieldNameRule = (): AssignForValueRule<FieldNameTypeClass, FieldNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isFieldNameTypeClass),
        construct: (nameTypeClass: FieldNameTypeClass) => {
            const value = nameTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeSoqlIdRule(), makeErrorAssignRule]));
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

export const makeQualifiedNameRule = (): AssignForValueRule<
    QualifiedNameTypeClass,
    QualifiedNameType
> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isQualifiedNameTypeClass),
        construct: (nameTypeClass: QualifiedNameTypeClass) => {
            const value = nameTypeClass
                .getValue()
                .map((v) => assignMultiClass(v, [makeIdRule(), makeErrorAssignRule]));
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

export const makeTypeNameRule = (): AssignForValueRule<TypeNameTypeClass, TypeNameType> => {
    return {
        isValid: (target: unknown) => isTargetTypeClass(target, isTypeNameTypeClass),
        construct: (nameTypeClass: TypeNameTypeClass) => {
            const value = assignMultiClass(nameTypeClass.getValue(), [
                makeStringAssignRule,
                makeIdRule(),
                makeErrorAssignRule,
            ]);
            const generic = assignMultiClass(nameTypeClass.getGeneric(), [
                makeTypeArgumentsRule(),
                makeErrorAssignRule,
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

