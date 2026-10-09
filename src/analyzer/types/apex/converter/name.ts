import {
    CommonTypeClass,
    ErrorTypeClass,
    QualifiedNameTypeClass,
    TypeNameTypeClass,
    CreatedNameTypeClass,
    FieldNameTypeClass,
    DateFieldNameTypeClass,
    DataCategoryNameTypeClass,
    isNormalIdType,
    isSoqlIdType,
    isTypeArgumentsType,
    isIdCreatedNamePairType,
    isFieldNameType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { NormalId, normalIdConvert, SoqlId, soqlIdConvert } from './id';
import { TypeArguments, typeArgumentsConvert } from './arguments';
import { IdCreatedNamePair, idCreatedNamePairConvert } from './pair';

export type QualifiedName = NormalId[] | undefined;

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
    return values.length > 0 ? values : undefined;
};

export type TypeName = {
    value: string | NormalId | undefined;
    generic: TypeArguments | undefined;
};

export const typeNameConvert = (
    target: TypeNameTypeClass,
    errorClass: ErrorTypeClass[],
): TypeName => {
    let value = undefined;
    let generic = undefined;

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
        generic = typeClass ? typeArgumentsConvert(typeClass, errorClass) : undefined;
    }

    return {
        value: value,
        generic: generic,
    };
};

export type CreatedName = IdCreatedNamePair[] | undefined;

export const createdNameConvert = (
    target: CreatedNameTypeClass,
    errorClass: ErrorTypeClass[],
): CreatedName => {
    const values: IdCreatedNamePair[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isIdCreatedNamePairType, errorClass);
        if (valueTypeClass) {
            values.push(idCreatedNamePairConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type FieldName = SoqlId[] | undefined;

export const fieldNameConvert = (
    target: FieldNameTypeClass,
    errorClass: ErrorTypeClass[],
): FieldName => {
    const values: (string | undefined)[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSoqlIdType, errorClass);
        if (valueTypeClass) {
            if (isSoqlIdType(valueTypeClass)) {
                values.push(soqlIdConvert(valueTypeClass, errorClass));
            }
        }
    });

    return values.filter((v): v is string => v !== undefined).length
        ? values.filter((v): v is string => v !== undefined)
        : undefined;
};

export type DateFieldName = {
    value: FieldName | undefined;
    isConvertTimeZone: boolean;
};

export const dateFieldNameConvert = (
    target: DateFieldNameTypeClass,
    errorClass: ErrorTypeClass[],
): DateFieldName => {
    let value: FieldName | undefined = undefined;
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

export type DataCategoryName = SoqlId[] | undefined;

export const dataCategoryNameConvert = (
    target: DataCategoryNameTypeClass,
    errorClass: ErrorTypeClass[],
): DataCategoryName => {
    const values: (string | undefined)[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSoqlIdType, errorClass);
        if (valueTypeClass) {
            values.push(soqlIdConvert(valueTypeClass, errorClass));
        }
    });

    return values.filter((v): v is string => v !== undefined).length
        ? values.filter((v): v is string => v !== undefined)
        : undefined;
};
