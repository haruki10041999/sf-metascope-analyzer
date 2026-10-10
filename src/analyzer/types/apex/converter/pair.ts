import {
    ErrorTypeClass,
    ElementValuePairTypeClass,
    ElementValuePairsTypeClass,
    IdCreatedNamePairTypeClass,
    MapCreatorRestPairTypeClass,
    isAnyIdType,
    isElementValuePairType,
    isElementValueType,
    isExpressionTypeAll,
    isNormalIdType,
    isTypeListType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { Expression, expressionConvert } from './expression';
import { anyIdConvert, normalIdConvert } from './id';
import { typeListConvert } from './list';
import { NormalLiteral } from './literal';
import { TypeRef } from './type';
import { elementValueConvert } from './value';

export type ElementValuePair = {
    left?: string;
    right?: NormalLiteral;
};

export const elementValuePairConvert = (
    target: ElementValuePairTypeClass,
    errorClass: ErrorTypeClass[],
): ElementValuePair => {
    const elementValuePair: ElementValuePair = {};

    const leftTypeClass = toTypeClass(target.getLeft(), isNormalIdType, errorClass);
    if (leftTypeClass) {
        elementValuePair.left = normalIdConvert(leftTypeClass);
    }

    const rightTypeClass = toTypeClass(target.getRight(), isElementValueType, errorClass);
    if (rightTypeClass) {
        const literal = elementValueConvert(rightTypeClass, errorClass);
        if (literal) {
            elementValuePair.right = literal;
        }
    }

    return elementValuePair;
};

export const elementValuePairsConvert = (
    target: ElementValuePairsTypeClass,
    errorClass: ErrorTypeClass[],
): ElementValuePair[] => {
    const values: ElementValuePair[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isElementValuePairType, errorClass);
        if (valueTypeClass) {
            values.push(elementValuePairConvert(valueTypeClass, errorClass));
        }
    });
    return values;
};

export type IdCreatedNamePair = {
    left?: string;
    right: TypeRef[];
};

export const idCreatedNamePairConvert = (
    target: IdCreatedNamePairTypeClass,
    errorClass: ErrorTypeClass[],
): IdCreatedNamePair => {
    const idCreatedNamePair: IdCreatedNamePair = {
        right: [],
    };

    const leftTypeClass = toTypeClass(target.getLeft(), isAnyIdType, errorClass);
    if (leftTypeClass) {
        idCreatedNamePair.left = anyIdConvert(leftTypeClass);
    }

    const rightValue = target.getRight();
    if (rightValue) {
        const typeClass = toTypeClass(rightValue, isTypeListType, errorClass);
        if (typeClass) {
            idCreatedNamePair.right.push(...typeListConvert(typeClass, errorClass));
        }
    }

    return idCreatedNamePair;
};

export type MapCreatorRestPair = {
    left?: Expression;
    right?: Expression;
};

export const mapCreatorRestPairConvert = (
    target: MapCreatorRestPairTypeClass,
    errorClass: ErrorTypeClass[],
): MapCreatorRestPair => {
    const mapCreatorRestPair: MapCreatorRestPair = {};

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        const expression = expressionConvert(leftTypeClass, errorClass);
        if (expression) {
            mapCreatorRestPair.left = expression;
        }
    }

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        const expression = expressionConvert(rightTypeClass, errorClass);
        if (expression) {
            mapCreatorRestPair.right = expression;
        }
    }

    return mapCreatorRestPair;
};
