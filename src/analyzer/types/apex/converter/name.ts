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
    isCommonType,
    ErrorType,
    CommonType,
    AssignForValueRule,
    ValueRuleValue,
    isTargetTypeClass,
    assignMultiClass,
    makeStringAssignRule,
    makeNullAssignRule,
    makeErrorAssignRule,
    makeLimitedStringAssignRule,
    makeSourceInfo,
} from './commons';
import { makeTypeArgumentsAssignRule, TypeArgumentsType } from './arguments';
import { makeIdAssignRule, makeSoqlIdAssignRule, IdType, SoqlIdType } from './id';
import { makeIdCreatedNamePairAssignRule, IdCreatedNamePairType } from './pair';

export type CreatedNameType = CommonType<'createdName'> & {
    value: ValueRuleValue<IdCreatedNamePairType>[];
};

export const isCreatedNameType = (value: unknown): value is CreatedNameType => {
    return isCommonType(value) && value.type === 'createdName';
};

export const makeCreatedNameAssignRule: AssignForValueRule<CreatedNameTypeClass, CreatedNameType> =
    {
        isValid: (target: unknown) => isTargetTypeClass(target, isCreatedNameTypeClass),
        construct: (nameTypeClass: CreatedNameTypeClass) => {
            const value = nameTypeClass
                .getValue()
                .map((v) =>
                    assignMultiClass(v, [makeIdCreatedNamePairAssignRule, makeErrorAssignRule]),
                );
            return {
                type: nameTypeClass.getType(),
                sourceInfo: makeSourceInfo(nameTypeClass),
                value,
            };
        },
    };

export type DataCategoryNameType = CommonType<'dataCategoryName'> & {
    value: ValueRuleValue<SoqlIdType>[];
};

export const isDataCategoryNameType = (value: unknown): value is DataCategoryNameType => {
    return isCommonType(value) && value.type === 'dataCategoryName';
};

export const makeDataCategoryNameAssignRule: AssignForValueRule<
    DataCategoryNameTypeClass,
    DataCategoryNameType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isDataCategoryNameTypeClass),
    construct: (nameTypeClass: DataCategoryNameTypeClass) => {
        const value = nameTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeSoqlIdAssignRule, makeErrorAssignRule]));
        return {
            type: nameTypeClass.getType(),
            sourceInfo: makeSourceInfo(nameTypeClass),
            value,
        };
    },
};

export type DateFieldNameType = CommonType<'dateFieldName'> & {
    value: ValueRuleValue<FieldNameType>;
    isConvertTimeZone: boolean;
};

export const isDateFieldNameType = (value: unknown): value is DateFieldNameType => {
    return isCommonType(value) && value.type === 'dateFieldName';
};

export const makeDateFieldNameAssignRule: AssignForValueRule<
    DateFieldNameTypeClass,
    DateFieldNameType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isDateFieldNameTypeClass),
    construct: (nameTypeClass: DateFieldNameTypeClass) => {
        const value = assignMultiClass(nameTypeClass.getValue(), [
            makeFieldNameAssignRule,
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

export type FieldNameType = CommonType<'fieldName'> & {
    value: ValueRuleValue<SoqlIdType>[];
};

export const isFieldNameType = (value: unknown): value is FieldNameType => {
    return isCommonType(value) && value.type === 'fieldName';
};

export const makeFieldNameAssignRule: AssignForValueRule<FieldNameTypeClass, FieldNameType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isFieldNameTypeClass),
    construct: (nameTypeClass: FieldNameTypeClass) => {
        const value = nameTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeSoqlIdAssignRule, makeErrorAssignRule]));
        return {
            type: nameTypeClass.getType(),
            sourceInfo: makeSourceInfo(nameTypeClass),
            value,
        };
    },
};

export type QualifiedNameType = CommonType<'qualifiedName'> & {
    value: ValueRuleValue<IdType>[];
};

export const isQualifiedNameType = (value: unknown): value is QualifiedNameType => {
    return isCommonType(value) && value.type === 'qualifiedName';
};

export const makeQualifiedNameAssignRule: AssignForValueRule<
    QualifiedNameTypeClass,
    QualifiedNameType
> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isQualifiedNameTypeClass),
    construct: (nameTypeClass: QualifiedNameTypeClass) => {
        const value = nameTypeClass
            .getValue()
            .map((v) => assignMultiClass(v, [makeIdAssignRule, makeErrorAssignRule]));
        return {
            type: nameTypeClass.getType(),
            sourceInfo: makeSourceInfo(nameTypeClass),
            value,
        };
    },
};

export type TypeNameType = CommonType<'typeName'> & {
    value: ValueRuleValue<'list' | 'set' | 'map' | IdType>;
    generic: ValueRuleValue<TypeArgumentsType | null>;
};

export const isTypeNameType = (value: unknown): value is TypeNameType => {
    return isCommonType(value) && value.type === 'typeName';
};

export const makeTypeNameAssignRule: AssignForValueRule<TypeNameTypeClass, TypeNameType> = {
    isValid: (target: unknown) => isTargetTypeClass(target, isTypeNameTypeClass),
    construct: (nameTypeClass: TypeNameTypeClass) => {
        const value = assignMultiClass(nameTypeClass.getValue(), [
            makeLimitedStringAssignRule(['list', 'set', 'map']),
            makeIdAssignRule,
            makeErrorAssignRule,
        ]);
        const generic = assignMultiClass(nameTypeClass.getGeneric(), [
            makeTypeArgumentsAssignRule,
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
