import {
    ErrorTypeClass,
    NormalArgumentsTypeClass,
    TypeArgumentsTypeClass,
    isExpressionListType,
    isTypeListType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { TypeRefClass } from './type';
import { ExpressionClass } from './expression';
import { expressionListConvert, typeListConvert } from './list';

export const normalArgumentsConvert = (
    target: NormalArgumentsTypeClass,
    errorClass: ErrorTypeClass[],
): ExpressionClass[] => {
    const normalArguments: ExpressionClass[] = [];

    const valueTypeClass = target.getValue();
    if (valueTypeClass) {
        const expressionListTypeClass = toTypeClass(
            valueTypeClass,
            isExpressionListType,
            errorClass,
        );
        if (expressionListTypeClass) {
            normalArguments.push(...expressionListConvert(expressionListTypeClass, errorClass));
        }
    }

    return normalArguments;
};

export const typeArgumentsConvert = (
    target: TypeArgumentsTypeClass,
    errorClass: ErrorTypeClass[],
): TypeRefClass[] => {
    const typeArguments: TypeRefClass[] = [];

    const valueTypeClass = target.getValue();
    if (valueTypeClass) {
        const typeListTypeClass = toTypeClass(valueTypeClass, isTypeListType, errorClass);
        if (typeListTypeClass) {
            typeArguments.push(...typeListConvert(typeListTypeClass, errorClass));
        }
    }

    return typeArguments;
};
