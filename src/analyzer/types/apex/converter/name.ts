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
import { normalIdConvert, soqlIdConvert } from './id';

export const qualifiedNameConvert = (
    target: QualifiedNameTypeClass,
    errorClass: ErrorTypeClass[],
): string[] => {
    const values: string[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isNormalIdType, errorClass);
        if (valueTypeClass) {
            values.push(normalIdConvert(valueTypeClass));
        }
    });
    return values;
};

export const typeNameConvert = (
    target: TypeNameTypeClass,
    errorClass: ErrorTypeClass[],
): { value: string | null; generic: TypeArgumentsTypeClass | null } => {
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
        generic = toTypeClass(genericTypeClass, isTypeArgumentsType, errorClass);
    }

    return {
        value: value,
        generic: generic,
    };
};

export const createdNameConvert = (
    target: CreatedNameTypeClass,
    errorClass: ErrorTypeClass[],
): IdCreatedNamePairTypeClass[] | null => {
    const values: IdCreatedNamePairTypeClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isIdCreatedNamePairType, errorClass);
        if (valueTypeClass) {
            values.push(valueTypeClass);
        }
    });
    return values.length > 0 ? values : null;
};

export const fieldNameConvert = (
    target: FieldNameTypeClass,
    errorClass: ErrorTypeClass[],
): string[] => {
    const values: (string | null)[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSoqlIdType, errorClass);
        if (valueTypeClass) {
            if (isSoqlIdType(valueTypeClass)) {
                values.push(soqlIdConvert(valueTypeClass, errorClass));
            }
        }
    });
    return values.filter((v): v is string => v !== null);
};

export const dateFieldNameConvert = (
    target: DateFieldNameTypeClass,
    errorClass: ErrorTypeClass[],
): { value: string[] | null; isConvertTimeZone: boolean } => {
    let value: string[] | null = null;
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

export const dataCategoryNameConvert = (
    target: DataCategoryNameTypeClass,
    errorClass: ErrorTypeClass[],
): string[] => {
    const values: (string | null)[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSoqlIdType, errorClass);
        if (valueTypeClass) {
            if (isFieldNameType(valueTypeClass)) {
                values.push(fieldNameConvert(valueTypeClass, errorClass).join('.'));
            }
        }
    });
    return values.filter((v): v is string => v !== null);
};
