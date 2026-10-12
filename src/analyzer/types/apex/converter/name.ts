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

import { toTypeClass, CommonClass, isCommonClass } from './commons';
import { normalIdConvert, soqlIdConvert } from './id';
import { TypeRefClass } from './type';
import { typeArgumentsConvert } from './arguments';
import { IdCreatedNamePairClass, idCreatedNamePairConvert } from './pair';

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

export class TypeNameClass extends CommonClass {
    private value: string | null = null;
    private generic: TypeRefClass[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    resetGeneric(): void {
        this.generic = [];
    }

    setGeneric(generic: TypeRefClass[]): void {
        this.generic.push(...generic);
    }

    getValue(): string | null {
        return this.value;
    }

    getGeneric(): TypeRefClass[] {
        return this.generic;
    }

    copy(commonClass: TypeNameClass): void {
        this.setValue(commonClass.getValue());
        this.resetGeneric();
        this.setGeneric(commonClass.getGeneric());
    }
}

export const isTypeNameClass = (target: any): target is TypeNameClass => {
    return isCommonClass(target, TypeNameClass);
};

export const isTypeNameClassArray = (target: any): target is TypeNameClass[] => {
    return Array.isArray(target) && target.every((t) => isTypeNameClass(t));
};

export const typeNameConvert = (
    target: TypeNameTypeClass,
    errorClass: ErrorTypeClass[],
): TypeNameClass => {
    const typeName = new TypeNameClass();

    const valueTypeClass = target.getValue();
    if (typeof valueTypeClass === 'string') {
        typeName.setValue(valueTypeClass);
    } else {
        if (isNormalIdType(valueTypeClass)) {
            typeName.setValue(normalIdConvert(valueTypeClass));
        }
    }

    const genericTypeClass = target.getGeneric();
    if (genericTypeClass) {
        const typeClass = toTypeClass(genericTypeClass, isTypeArgumentsType, errorClass);
        if (typeClass) {
            typeName.setGeneric(typeArgumentsConvert(typeClass, errorClass));
        }
    }

    return typeName;
};

export const createdNameConvert = (
    target: CreatedNameTypeClass,
    errorClass: ErrorTypeClass[],
): IdCreatedNamePairClass[] => {
    const values: IdCreatedNamePairClass[] = [];

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

export class DateFieldNameClass extends CommonClass {
    private value: string[] = [];
    private isConvertTimeZone: boolean | null = null;

    resetValue(): void {
        this.value = [];
    }

    setValue(value: string[]): void {
        this.value.push(...value);
    }

    setIsConvertTimeZone(isConvertTimeZone: boolean | null): void {
        this.isConvertTimeZone = isConvertTimeZone;
    }

    getValue(): string[] {
        return this.value;
    }

    getIsConvertTimeZone(): boolean | null {
        return this.isConvertTimeZone;
    }

    copy(commonClass: DateFieldNameClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.setIsConvertTimeZone(commonClass.getIsConvertTimeZone());
    }
}

export const isDateFieldNameClass = (target: any): target is DateFieldNameClass => {
    return isCommonClass(target, DateFieldNameClass);
};

export const dateFieldNameConvert = (
    target: DateFieldNameTypeClass,
    errorClass: ErrorTypeClass[],
): DateFieldNameClass => {
    const dateFieldName = new DateFieldNameClass();

    dateFieldName.setIsConvertTimeZone(target.getConvertTimeZone());

    const valueTypeClass = toTypeClass(target.getValue(), isFieldNameType, errorClass);
    if (valueTypeClass) {
        dateFieldName.setValue(fieldNameConvert(valueTypeClass, errorClass));
    }
    return dateFieldName;
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
