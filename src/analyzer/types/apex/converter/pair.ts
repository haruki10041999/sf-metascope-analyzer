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

import { toTypeClass, CommonClass, isCommonClass } from './commons';
import { ExpressionClass, expressionConvert } from './expression';
import { anyIdConvert, normalIdConvert } from './id';
import { typeListConvert } from './list';
import { NormalLiteralClass } from './literal';
import { TypeRefClass } from './type';
import { elementValueConvert } from './value';

export class ElementValuePairClass extends CommonClass {
    private left: string | null = null;
    private right: NormalLiteral | null = null;

    setLeft(left: string | null): void {
        this.left = left;
    }

    setRight(right: NormalLiteral | null): void {
        this.right = right;
    }

    getLeft(): string | null {
        return this.left;
    }

    getRight(): NormalLiteral | null {
        return this.right;
    }

    copy(commonClass: ElementValuePairClass): void {
        this.setLeft(commonClass.getLeft());
        this.setRight(commonClass.getRight());
    }
}

const isElementValuePairClass = (target: CommonClass): target is ElementValuePairClass => {
    return target instanceof ElementValuePairClass;
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

export class IdCreatedNamePairClass extends CommonClass {
    private left: string | null = null;
    private right: TypeRef[] = [];

    setLeft(left: string | null): void {
        this.left = left;
    }

    resetRight(): void {
        this.right = [];
    }

    setRight(right: TypeRef[]): void {
        this.right.push(...right);
    }

    getLeft(): string | null {
        return this.left;
    }

    getRight(): TypeRef[] {
        return this.right;
    }

    copy(commonClass: IdCreatedNamePairClass): void {
        this.setLeft(commonClass.getLeft());
        this.resetRight();
        this.setRight(commonClass.getRight());
    }
}

const isIdCreatedNamePairClass = (target: CommonClass): target is IdCreatedNamePairClass => {
    return target instanceof IdCreatedNamePairClass;
};

export const idCreatedNamePairConvert = (
    target: IdCreatedNamePairTypeClass,
    errorClass: ErrorTypeClass[],
): IdCreatedNamePairClass => {
    const idCreatedNamePair = new IdCreatedNamePairClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isAnyIdType, errorClass);
    if (leftTypeClass) {
        idCreatedNamePair.setLeft(anyIdConvert(leftTypeClass));
    }

    const rightValue = target.getRight();
    if (rightValue) {
        const typeClass = toTypeClass(rightValue, isTypeListType, errorClass);
        if (typeClass) {
            idCreatedNamePair.setRight(typeListConvert(typeClass, errorClass));
        }
    }

    return idCreatedNamePair;
};

export class MapCreatorRestPairClass extends CommonClass {
    private left: ExpressionClass = new ExpressionClass();
    private right: ExpressionClass = new ExpressionClass();

    setLeft(left: ExpressionClass): void {
        this.left.copy(left);
    }

    setRight(right: ExpressionClass): void {
        this.right.copy(right);
    }

    getLeft(): ExpressionClass {
        return this.left;
    }

    getRight(): ExpressionClass {
        return this.right;
    }

    copy(commonClass: MapCreatorRestPairClass): void {
        this.setLeft(commonClass.getLeft());
        this.setRight(commonClass.getRight());
    }
}

export const isMapCreatorRestPairClass = (
    target: CommonClass,
): target is MapCreatorRestPairClass => {
    return target instanceof MapCreatorRestPairClass;
};

export const mapCreatorRestPairConvert = (
    target: MapCreatorRestPairTypeClass,
    errorClass: ErrorTypeClass[],
): MapCreatorRestPairClass => {
    const mapCreatorRestPair = new MapCreatorRestPairClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isExpressionTypeAll, errorClass);
    if (leftTypeClass) {
        mapCreatorRestPair.setLeft(expressionConvert(leftTypeClass, errorClass));
    }

    const rightTypeClass = toTypeClass(target.getRight(), isExpressionTypeAll, errorClass);
    if (rightTypeClass) {
        mapCreatorRestPair.setRight(expressionConvert(rightTypeClass, errorClass));
    }

    return mapCreatorRestPair;
};
