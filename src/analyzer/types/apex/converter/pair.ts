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
import { AnyId, anyIdConvert, NormalId, normalIdConvert } from './id';
import { TypeList, typeListConvert } from './list';
import { NormalLiteral } from './literal';
import { elementValueConvert } from './value';

export type ElementValuePair = {
    left: NormalId | undefined;
    right: NormalLiteral | undefined;
};

export const elementValuePairConvert = (
    target: ElementValuePairTypeClass,
    errorClass: ErrorTypeClass[],
): ElementValuePair => {
    const leftTypeClass = toTypeClass(target.getLeft(), isNormalIdType, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isElementValueType, errorClass);

    return {
        left: leftTypeClass ? normalIdConvert(leftTypeClass) : undefined,
        right: rightTypeClass ? elementValueConvert(rightTypeClass, errorClass) : undefined,
    };
};

export type ElementValuePairs = ElementValuePair[] | undefined;

export const elementValuePairsConvert = (
    target: ElementValuePairsTypeClass,
    errorClass: ErrorTypeClass[],
): ElementValuePairs => {
    const values: ElementValuePair[] = [];
    target.getValue().forEach((item) => {
        const valueTypeClass = toTypeClass(item, isElementValuePairType, errorClass);
        if (valueTypeClass) {
            values.push(elementValuePairConvert(valueTypeClass, errorClass));
        }
    });
    return values.length > 0 ? values : undefined;
};

export type IdCreatedNamePair = {
    left: AnyId | undefined;
    right: TypeList | undefined;
};

export const idCreatedNamePairConvert = (
    target: IdCreatedNamePairTypeClass,
    errorClass: ErrorTypeClass[],
): IdCreatedNamePair => {
    const leftTypeClass = toTypeClass(target.getLeft(), isAnyIdType, errorClass);

    const rightValue = target.getRight();
    const rightTypeClass = rightValue ? toTypeClass(rightValue, isTypeListType, errorClass) : undefined;

    return {
        left: leftTypeClass ? anyIdConvert(leftTypeClass) : undefined,
        right: rightTypeClass ? typeListConvert(rightTypeClass, errorClass) : undefined,
    };
};

export type MapCreatorRestPair = {
    left: Expression;
    right: Expression;
};

export const mapCreatorRestPairConvert = (
    target: MapCreatorRestPairTypeClass,
    errorClass: ErrorTypeClass[],
): MapCreatorRestPair => {
    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);

    return {
        left: leftTypeClass ? expressionConvert(leftTypeClass, errorClass) : undefined,
        right: rightTypeClass ? expressionConvert(rightTypeClass, errorClass) : undefined,
    };
};
