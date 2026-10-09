import {
    ErrorTypeClass,
    NormalArgumentsTypeClass,
    TypeArgumentsTypeClass,
    isExpressionListType,
    isTypeListType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { ExpressionList, expressionListConvert, TypeList, typeListConvert } from './list';

export type NormalArguments = ExpressionList | undefined;

export const normalArgumentsConvert = (
    target: NormalArgumentsTypeClass,
    errorClass: ErrorTypeClass[],
): NormalArguments => {
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

    return undefined;
};

export type TypeArguments = TypeList | undefined;

export const typeArgumentsConvert = (
    target: TypeArgumentsTypeClass,
    errorClass: ErrorTypeClass[],
): TypeArguments => {
    const valueTypeClass = target.getValue();
    if (valueTypeClass) {
        const typeListTypeClass = toTypeClass(valueTypeClass, isTypeListType, errorClass);
        if (typeListTypeClass) {
            return typeListConvert(typeListTypeClass, errorClass);
        }
    }

    return undefined;
};
