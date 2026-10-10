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
import { normalIdConvert } from './id';

export const arrayInitializerConvert = (
    target: ArrayInitializerTypeClass,
    errorClass: ErrorTypeClass[],
): Expression[] => {
    const values: Expression[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            const expression = expressionConvert(valueTypeClass, errorClass);
            if (expression) {
                values.push(expression);
            }
        }
    });
    return values;
};

export type VariableDeclarator = {
    value?: string;
    content?: Expression;
};

export const variableDeclaratorConvert = (
    target: VariableDeclaratorTypeClass,
    errorClass: ErrorTypeClass[],
): VariableDeclarator => {
    const variableDeclarator: VariableDeclarator = {};

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        variableDeclarator.value = normalIdConvert(valueTypeClass);
    }

    const contentValue = target.getContent();
    if (contentValue) {
        const contentTypeClass = toTypeClass(contentValue, isExpressionTypeAll, errorClass);
        if (contentTypeClass) {
            const expression = expressionConvert(contentTypeClass, errorClass);
            if (expression) {
                variableDeclarator.content = expression;
            }
        }
    }

    return variableDeclarator;
};

export const variableDeclaratorsConvert = (
    target: VariableDeclaratorsTypeClass,
    errorClass: ErrorTypeClass[],
): VariableDeclarator[] => {
    const values: VariableDeclarator[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isVariableDeclaratorType, errorClass);
        if (valueTypeClass) {
            values.push(variableDeclaratorConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};
