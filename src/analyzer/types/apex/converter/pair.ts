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
    private right: NormalLiteralClass = new NormalLiteralClass();

    setLeft(left: string | null): void {
        this.left = left;
    }

    setRight(right: NormalLiteralClass): void {
        this.right.copy(right);
    }

    getLeft(): string | null {
        return this.left;
    }

    getRight(): NormalLiteralClass {
        return this.right;
    }

    copy(commonClass: ElementValuePairClass): void {
        this.setLeft(commonClass.getLeft());
        this.setRight(commonClass.getRight());
    }
}

export const isElementValuePairClass = (target: any): target is ElementValuePairClass => {
    return isCommonClass(target, ElementValuePairClass);
};

export const isElementValuePairClassArray = (target: any): target is ElementValuePairClass[] => {
    return Array.isArray(target) && target.every((t) => isElementValuePairClass(t));
};

export const elementValuePairConvert = (
    target: ElementValuePairTypeClass,
    errorClass: ErrorTypeClass[],
): ElementValuePairClass => {
    const elementValuePair = new ElementValuePairClass();

    const leftTypeClass = toTypeClass(target.getLeft(), isNormalIdType, errorClass);
    if (leftTypeClass) {
        elementValuePair.setLeft(normalIdConvert(leftTypeClass));
    }

    const rightTypeClass = toTypeClass(target.getRight(), isElementValueType, errorClass);
    if (rightTypeClass) {
        elementValuePair.setRight(elementValueConvert(rightTypeClass, errorClass));
    }

    return elementValuePair;
};

export const elementValuePairsConvert = (
    target: ElementValuePairsTypeClass,
    errorClass: ErrorTypeClass[],
): ElementValuePairClass[] => {
    const values: ElementValuePairClass[] = [];

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
    private right: TypeRefClass[] = [];

    setLeft(left: string | null): void {
        this.left = left;
    }

    resetRight(): void {
        this.right = [];
    }

    setRight(right: TypeRefClass[]): void {
        this.right.push(...right);
    }

    getLeft(): string | null {
        return this.left;
    }

    getRight(): TypeRefClass[] {
        return this.right;
    }

    copy(commonClass: IdCreatedNamePairClass): void {
        this.setLeft(commonClass.getLeft());
        this.resetRight();
        this.setRight(commonClass.getRight());
    }
}

export const isIdCreatedNamePairClass = (target: any): target is IdCreatedNamePairClass => {
    return isCommonClass(target, IdCreatedNamePairClass);
};

export const isIdCreatedNamePairClassArray = (target: any): target is IdCreatedNamePairClass[] => {
    return Array.isArray(target) && target.every((t) => isIdCreatedNamePairClass(t));
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
    return isCommonClass(target, MapCreatorRestPairClass);
};

export const isMapCreatorRestPairClassArray = (
    target: any,
): target is MapCreatorRestPairClass[] => {
    return Array.isArray(target) && target.every((t) => isMapCreatorRestPairClass(t));
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
