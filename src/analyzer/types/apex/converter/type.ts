import {
    ErrorTypeClass,
    ArraySubscriptsTypeClass,
    TypeRefTypeClass,
    isArraySubscriptsType,
    isTypeNameType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { TypeName, typeNameConvert } from './name';

export type ArraySubscripts = number | null;

export const arraySubscriptsConvert = (
    target: ArraySubscriptsTypeClass,
    errorClass: ErrorTypeClass[],
): ArraySubscripts => {
    return toPrimitiveValue(
        target.getValue(),
        (target): target is number => typeof target === 'number',
        errorClass,
    );
};

export type TypeRef = {
    value: TypeName[] | null;
    dimension?: ArraySubscripts;
};

export const typeRefConvert = (target: TypeRefTypeClass, errorClass: ErrorTypeClass[]): TypeRef => {
    const values: TypeName[] = [];

    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isTypeNameType, errorClass);
        if (valueTypeClass) {
            values.push(typeNameConvert(valueTypeClass, errorClass));
        }
    });

    let dimension = undefined;
    const dimensionTypeClass = toTypeClass(
        target.getDimension(),
        isArraySubscriptsType,
        errorClass,
    );

    if (dimensionTypeClass) {
        dimension = arraySubscriptsConvert(dimensionTypeClass, errorClass);
    }

    return {
        value: values,
        dimension: dimension,
    };
};
