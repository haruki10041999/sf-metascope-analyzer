import {
    CommonTypeClass,
    ErrorTypeClass,
    QualifiedNameTypeClass,
    TypeNameTypeClass,
    CreatedNameTypeClass,
    FieldNameTypeClass,
    DateFieldNameTypeClass,
    DataCategoryNameTypeClass,
    isErrorType,
    isNormalIdType,
    isSoqlIdType,
    TypeArgumentsTypeClass,
    IdCreatedNamePairTypeClass,
    isTypeArgumentsType,
    isIdCreatedNamePairType,
    isFieldNameType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { NormalId, normalIdConvert, SoqlId, soqlIdConvert } from './id';
import { TypeArguments, typeArgumentsConvert } from './arguments';

export type QualifiedName = NormalId[] | null;

export const qualifiedNameConvert = (
    target: QualifiedNameTypeClass,
    errorClass: ErrorTypeClass[],
): QualifiedName => {
    const values: string[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isNormalIdType, errorClass);
        if (valueTypeClass) {
            values.push(normalIdConvert(valueTypeClass));
        }
    });
    return values.length > 0 ? values : null;
};

export type TypeName = {
    value: string | NormalId | null;
    generic: TypeArguments | null;
};

export const typeNameConvert = (
    target: TypeNameTypeClass,
    errorClass: ErrorTypeClass[],
): TypeName => {
    let value = null;
    let generic = null;

    const valueTypeClass = target.getValue();

    if (!(valueTypeClass instanceof CommonTypeClass)) {
        value = valueTypeClass;
    } else {
        if (isNormalIdType(valueTypeClass)) {
            value = normalIdConvert(valueTypeClass);
        }
    }

    const genericTypeClass = target.getGeneric();
    if (genericTypeClass) {
        const typeClass = toTypeClass(genericTypeClass, isTypeArgumentsType, errorClass);
        generic = typeClass ? typeArgumentsConvert(typeClass, errorClass) : null;
    }

    return {
        value: value,
        generic: generic,
    };
};

export type CreatedName = IdCreatedNamePairTypeClass[] | null;

export const createdNameConvert = (
    target: CreatedNameTypeClass,
    errorClass: ErrorTypeClass[],
): CreatedName => {
    const values: IdCreatedNamePairTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isIdCreatedNamePairType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
        }
    });
    return values.length > 0 ? values : null;
};

export type FieldName = SoqlId[] | null;

export const fieldNameConvert = (
    target: FieldNameTypeClass,
    errorClass: ErrorTypeClass[],
): FieldName => {
    const values: (string | null)[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSoqlIdType, errorClass);
        if (valueTypeClass) {
            if (isSoqlIdType(valueTypeClass)) {
                values.push(soqlIdConvert(valueTypeClass, errorClass));
            }
        }
    });

    return values.filter((v): v is string => v !== null).length
        ? values.filter((v): v is string => v !== null)
        : null;
};

export type DateFieldName = {
    value: FieldName | null;
    isConvertTimeZone: boolean;
};

export const dateFieldNameConvert = (
    target: DateFieldNameTypeClass,
    errorClass: ErrorTypeClass[],
): DateFieldName => {
    let value: FieldName | null = null;
    const isConvertTimeZone = target.getConvertTimeZone();
    const valueTypeClass = toTypeClass(target.getValue(), isFieldNameType, errorClass);
    if (valueTypeClass) {
        value = fieldNameConvert(valueTypeClass, errorClass);
    }
    return {
        value: value,
        isConvertTimeZone: isConvertTimeZone,
    };
};

export type DataCategoryName = SoqlId[] | null;

export const dataCategoryNameConvert = (
    target: DataCategoryNameTypeClass,
    errorClass: ErrorTypeClass[],
): DataCategoryName => {
    const values: (string | null)[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSoqlIdType, errorClass);
        if (valueTypeClass) {
            values.push(soqlIdConvert(valueTypeClass, errorClass));
        }
    });

    return values.filter((v): v is string => v !== null).length
        ? values.filter((v): v is string => v !== null)
        : null;
};
