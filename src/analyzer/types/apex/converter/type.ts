import {
    ErrorTypeClass,
    ArraySubscriptsTypeClass,
    TypeRefTypeClass,
    isArraySubscriptsType,
    isTypeNameType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass, CommonClass, isCommonClass } from './commons';
import { TypeName, typeNameConvert } from './name';

export const arraySubscriptsConvert = (
    target: ArraySubscriptsTypeClass,
    errorClass: ErrorTypeClass[],
): number | undefined => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is number => typeof target === 'number',
        errorClass,
    );
};

export class TypeRefClass extends CommonClass {
    private value: TypeName[];
    private dimension: number | null;

    constructor(value: TypeName[], dimension: number | null) {
        super();
        this.value = value;
        this.dimension = dimension;
    }

    getValue(): TypeName[] {
        return this.value;
    }

    getDimension(): number | null {
        return this.dimension;
    }
}

export const isTypeRefClass = (target: CommonClass): target is TypeRefClass => {
    return isCommonClass(target, TypeRefClass);
};

export type TypeRef = {
    value: TypeName[];
    dimension?: number;
};

export const typeRefConvert = (target: TypeRefTypeClass, errorClass: ErrorTypeClass[]): TypeRef => {
    const values: TypeName[] = [];

    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isTypeNameType, errorClass);
        if (valueTypeClass) {
            values.push(typeNameConvert(valueTypeClass, errorClass));
        }
    });

    const typeRef: TypeRef = {
        value: values,
    };

    const dimensionTypeClass = toTypeClass(
        target.getDimension(),
        isArraySubscriptsType,
        errorClass,
    );

    if (dimensionTypeClass) {
        const dimension = arraySubscriptsConvert(dimensionTypeClass, errorClass);
        if (dimension) {
            typeRef.dimension = dimension;
        }
    }
    return typeRef;
};
