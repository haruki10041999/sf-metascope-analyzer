import {
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
import { normalIdConvert, soqlIdConvert } from './id';
import { TypeRef } from './type';
import { typeArgumentsConvert } from './arguments';
import { IdCreatedNamePair, idCreatedNamePairConvert } from './pair';

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

export type TypeName = {
    value?: string;
    generic: TypeRef[];
};

export const typeNameConvert = (
    target: TypeNameTypeClass,
    errorClass: ErrorTypeClass[],
): TypeName => {
    const typeName: TypeName = {
        generic: [],
    };

    const valueTypeClass = target.getValue();
    if (typeof valueTypeClass === 'string') {
        typeName.value = valueTypeClass;
    } else {
        if (isNormalIdType(valueTypeClass)) {
            typeName.value = normalIdConvert(valueTypeClass);
        }
    }

    const genericTypeClass = target.getGeneric();
    if (genericTypeClass) {
        const typeClass = toTypeClass(genericTypeClass, isTypeArgumentsType, errorClass);
        if (typeClass) {
            const generic = typeArgumentsConvert(typeClass, errorClass);
            if (generic) {
                typeName.generic.push(...generic);
            }
        }
    }

    return typeName;
};

export const createdNameConvert = (
    target: CreatedNameTypeClass,
    errorClass: ErrorTypeClass[],
): IdCreatedNamePair[] => {
    const values: IdCreatedNamePair[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isIdCreatedNamePairType, errorClass);
        if (valueTypeClass) {
            values.push(idCreatedNamePairConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export const fieldNameConvert = (
    target: FieldNameTypeClass,
    errorClass: ErrorTypeClass[],
): string[] => {
    const values: string[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSoqlIdType, errorClass);
        if (valueTypeClass) {
            if (isSoqlIdType(valueTypeClass)) {
                const soqlId = soqlIdConvert(valueTypeClass, errorClass);
                if (soqlId) {
                    values.push(soqlId);
                }
            }
        }
    });

    return values;
};

export type DateFieldName = {
    value: string[];
    isConvertTimeZone: boolean;
};

export const dateFieldNameConvert = (
    target: DateFieldNameTypeClass,
    errorClass: ErrorTypeClass[],
): DateFieldName => {
    const values: string[] = [];
    const isConvertTimeZone = target.getConvertTimeZone();
    const valueTypeClass = toTypeClass(target.getValue(), isFieldNameType, errorClass);
    if (valueTypeClass) {
        values.push(...fieldNameConvert(valueTypeClass, errorClass));
    }
    return {
        value: values,
        isConvertTimeZone: isConvertTimeZone,
    };
};

export const dataCategoryNameConvert = (
    target: DataCategoryNameTypeClass,
    errorClass: ErrorTypeClass[],
): string[] => {
    const values: string[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isSoqlIdType, errorClass);
        if (valueTypeClass) {
            const soqlId = soqlIdConvert(valueTypeClass, errorClass);
            if (soqlId) {
                values.push(soqlId);
            }
        }
    });

    return values;
};
