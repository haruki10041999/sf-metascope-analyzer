import {
    ErrorTypeClass,
    ArraySubscriptsTypeClass,
    TypeRefTypeClass,
    isArraySubscriptsType,
    isTypeNameType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
import { TypeName, typeNameConvert } from './name';

export type ArraySubscripts = number | undefined;

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
    value: TypeName[] | undefined;
    dimension: ArraySubscripts;
};

export const typeRefConvert = (target: TypeRefTypeClass, errorClass: ErrorTypeClass[]): TypeRef => {
    const values: TypeName[] = [];

    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isTypeNameType, errorClass);
        if (valueTypeClass) {
            values.push(typeNameConvert(valueTypeClass, errorClass));
        }
    });

    const dimensionTypeClass = toTypeClass(
        target.getDimension(),
        isArraySubscriptsType,
        errorClass,
    );

    const arraySubscripts = dimensionTypeClass
        ? arraySubscriptsConvert(dimensionTypeClass, errorClass)
        : undefined;

    return {
        value: values.length > 0 ? values : undefined,
        dimension:
            arraySubscripts !== undefined && arraySubscripts !== 0 ? arraySubscripts : undefined,
    };
};
