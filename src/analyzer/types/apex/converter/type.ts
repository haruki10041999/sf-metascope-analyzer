import {
    ErrorTypeClass,
    ArraySubscriptsTypeClass,
    TypeRefTypeClass,
    isArraySubscriptsType,
    isTypeNameType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass, CommonClass, isCommonClass } from './commons';
import { TypeNameClass, typeNameConvert } from './name';

export const arraySubscriptsConvert = (
    target: ArraySubscriptsTypeClass,
    errorClass: ErrorTypeClass[],
): number | null => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is number => typeof target === 'number',
        errorClass,
    );
};

export const isNumber = (target: any): target is number => {
    return typeof target === 'number';
};

export const isNumberArray = (target: any): target is number[] => {
    return Array.isArray(target) && target.every((t) => isNumber(t));
};

export class TypeRefClass extends CommonClass {
    private value: TypeNameClass[] = [];
    private dimension: number | null = null;

    resetValue(): void {
        this.value = [];
    }

    setValue(value: TypeNameClass[]): void {
        this.value.push(...value);
    }

    setDimension(dimension: number | null): void {
        this.dimension = dimension;
    }

    getValue(): TypeNameClass[] {
        return this.value;
    }

    getDimension(): number | null {
        return this.dimension;
    }

    copy(commonClass: TypeRefClass): void {
        this.resetValue();
        this.setValue(commonClass.getValue());
        this.setDimension(commonClass.getDimension());
    }
}

export const isTypeRefClass = (target: any): target is TypeRefClass => {
    return isCommonClass(target, TypeRefClass);
};

export const isTypeRefClassArray = (target: any): target is TypeRefClass[] => {
    return (
        Array.isArray(target) && target.every((t) => t instanceof CommonClass && isTypeRefClass(t))
    );
};

export const typeRefConvert = (
    target: TypeRefTypeClass,
    errorClass: ErrorTypeClass[],
): TypeRefClass => {
    const typeRef = new TypeRefClass();

    const values: TypeNameClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isTypeNameType, errorClass);
        if (valueTypeClass) {
            values.push(typeNameConvert(valueTypeClass, errorClass));
        }
    });
    typeRef.setValue(values);

    const dimensionTypeClass = toTypeClass(
        target.getDimension(),
        isArraySubscriptsType,
        errorClass,
    );
    if (dimensionTypeClass) {
        const dimension = arraySubscriptsConvert(dimensionTypeClass, errorClass);
        if (dimension) {
            typeRef.setDimension(dimension);
        }
    }
    return typeRef;
};
