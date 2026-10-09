import {
    ErrorTypeClass,
    ArrayInitializerTypeClass,
    VariableDeclaratorTypeClass,
    VariableDeclaratorsTypeClass,
    isExpressionTypeAll,
    isNormalIdType,
    isVariableDeclaratorType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { Expression, expressionConvert } from './expression';
import { NormalId, normalIdConvert } from './id';

export type ArrayInitializer = Expression[] | undefined;

export const arrayInitializerConvert = (
    target: ArrayInitializerTypeClass,
    errorClass: ErrorTypeClass[],
): ArrayInitializer => {
    const values: Expression[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            values.push(expressionConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type VariableDeclarator = {
    value: NormalId | undefined;
    content: Expression;
};

export const variableDeclaratorConvert = (
    target: VariableDeclaratorTypeClass,
    errorClass: ErrorTypeClass[],
): VariableDeclarator => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);

    const contentValue = target.getContent();
    const contentTypeClass = contentValue
        ? toTypeClass(contentValue, isExpressionTypeAll, errorClass)
        : undefined;

    return {
        value: valueTypeClass ? normalIdConvert(valueTypeClass) : undefined,
        content: contentTypeClass ? expressionConvert(contentTypeClass, errorClass) : undefined,
    };
};

export type VariableDeclarators = VariableDeclarator[] | undefined;

export const variableDeclaratorsConvert = (
    target: VariableDeclaratorsTypeClass,
    errorClass: ErrorTypeClass[],
): VariableDeclarators => {
    const values: VariableDeclarator[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isVariableDeclaratorType, errorClass);
        if (valueTypeClass) {
            values.push(variableDeclaratorConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};
