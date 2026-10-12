import {
    ErrorTypeClass,
    ArrayInitializerTypeClass,
    VariableDeclaratorTypeClass,
    VariableDeclaratorsTypeClass,
    isExpressionTypeAll,
    isNormalIdType,
    isVariableDeclaratorType,
} from '../../apex_IR';

import { toTypeClass, CommonClass, isCommonClass } from './commons';
import { ExpressionClass, expressionConvert } from './expression';
import { normalIdConvert } from './id';

export const arrayInitializerConvert = (
    target: ArrayInitializerTypeClass,
    errorClass: ErrorTypeClass[],
): ExpressionClass[] => {
    const values: ExpressionClass[] = [];

    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isExpressionTypeAll, errorClass);
        if (valueTypeClass) {
            values.push(expressionConvert(valueTypeClass, errorClass));
        }
    });

    return values;
};

export class VariableDeclaratorClass extends CommonClass {
    private value: string | null = null;
    private content: ExpressionClass = new ExpressionClass();

    setValue(value: string | null): void {
        this.value = value;
    }

    setContent(content: ExpressionClass): void {
        this.content.copy(content);
    }

    getValue(): string | null {
        return this.value;
    }

    getContent(): ExpressionClass {
        return this.content;
    }

    copy(commonClass: VariableDeclaratorClass): void {
        this.setValue(commonClass.getValue());
        this.setContent(commonClass.getContent());
    }
}

export const isVariableDeclaratorClass = (target: any): target is VariableDeclaratorClass => {
    return isCommonClass(target, VariableDeclaratorClass);
};

export const isVariableDeclaratorClassArray = (
    target: any,
): target is VariableDeclaratorClass[] => {
    return Array.isArray(target) && target.every((t) => isVariableDeclaratorClass(t));
};

export const variableDeclaratorConvert = (
    target: VariableDeclaratorTypeClass,
    errorClass: ErrorTypeClass[],
): VariableDeclaratorClass => {
    const variableDeclarator = new VariableDeclaratorClass();

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        variableDeclarator.setValue(normalIdConvert(valueTypeClass));
    }

    const contentValue = target.getContent();
    if (contentValue) {
        const contentTypeClass = toTypeClass(contentValue, isExpressionTypeAll, errorClass);
        if (contentTypeClass) {
            variableDeclarator.setContent(expressionConvert(contentTypeClass, errorClass));
        }
    }

    return variableDeclarator;
};

export const variableDeclaratorsConvert = (
    target: VariableDeclaratorsTypeClass,
    errorClass: ErrorTypeClass[],
): VariableDeclaratorClass[] => {
    const values: VariableDeclaratorClass[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isVariableDeclaratorType, errorClass);
        if (valueTypeClass) {
            values.push(variableDeclaratorConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};
