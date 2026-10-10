import {
    ErrorTypeClass,
    ArraySubscriptsTypeClass,
    TypeRefTypeClass,
    isArraySubscriptsType,
    isTypeNameType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass } from './commons';
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
