import {
    ErrorTypeClass,
    NormalArgumentsTypeClass,
    TypeArgumentsTypeClass,
    isExpressionListType,
    isTypeListType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { TypeRef } from './type';
import { Expression } from './expression';
import { expressionListConvert, typeListConvert } from './list';

export const normalArgumentsConvert = (
    target: NormalArgumentsTypeClass,
    errorClass: ErrorTypeClass[],
): Expression[] => {
    const valueTypeClass = target.getValue();
    if (valueTypeClass) {
        const expressionListTypeClass = toTypeClass(
            valueTypeClass,
            isExpressionListType,
            errorClass,
        );
        if (expressionListTypeClass) {
            return expressionListConvert(expressionListTypeClass, errorClass);
        }
    }

    return [];
};

export const typeArgumentsConvert = (
    target: TypeArgumentsTypeClass,
    errorClass: ErrorTypeClass[],
): TypeRef[] => {
    const valueTypeClass = target.getValue();
    if (valueTypeClass) {
        const typeListTypeClass = toTypeClass(valueTypeClass, isTypeListType, errorClass);
        if (typeListTypeClass) {
            return typeListConvert(typeListTypeClass, errorClass);
        }
    }

    return [];
};
