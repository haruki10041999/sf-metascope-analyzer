import {
    ErrorTypeClass,
    NormalValueTypeClass,
    ElementValueTypeClass,
    WhenValueTypeClass,
    CoordinateValueTypeClass,
    LocationValueTypeClass,
    isCoordinateValueType,
    isFieldNameType,
    SignedNumberTypeClass,
    FieldNameTypeClass,
    BoundExpressionTypeClass,
    isSignedNumberType,
    isBoundExpressionType,
    isNormalLiteralType,
    DateFormulaTypeClass,
    SubQueryTypeClass,
    ValueListTypeClass,
    isValueListType,
    isDateFormulaType,
    isSubQueryType,
    isTypeRefType,
    isWhenLiteralType,
    isNormalIdType,
} from '../../apex_IR';

import { toTypeClass, CommonClass, isCommonClass } from './commons';
import { isString, isStringArray, normalIdConvert } from './id';
import { ExpressionClass, boundExpressionConvert, isExpressionClass } from './expression';
import {
    isSignedLiteralClass,
    isWhenLiteralClassArray,
    NormalLiteralClass,
    normalLiteralConvert,
    SignedLiteralClass,
    signedNumberConvert,
    WhenLiteralClass,
    whenLiteralConvert,
} from './literal';
import { fieldNameConvert } from './name';
import { valueListConvert } from './list';
import { TypeRefClass, typeRefConvert } from './type';
import {
    DateFormulaClass,
    SubQueryClass,
    dateFormulaConvert,
    isDateFormulaClass,
    isSubQueryClass,
    subQueryConvert,
} from './query';

export const coordinateValueConvert = (
    target: CoordinateValueTypeClass,
    errorClass: ErrorTypeClass[],
): SignedLiteralClass | ExpressionClass | null => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is SignedNumberTypeClass | BoundExpressionTypeClass =>
            isSignedNumberType(target) || isBoundExpressionType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isSignedNumberType(valueTypeClass)) {
            return signedNumberConvert(valueTypeClass, errorClass);
        }
        if (isBoundExpressionType(valueTypeClass)) {
            return boundExpressionConvert(valueTypeClass, errorClass);
        }
    }

    return null;
};

export const isCoordinateValue = (target: any): target is SignedLiteralClass | ExpressionClass => {
    return isSignedLiteralClass(target) || isExpressionClass(target);
};

export const isCoordinateValueArray = (
    target: any,
): target is (SignedLiteralClass | ExpressionClass)[] => {
    return Array.isArray(target) && target.every((t) => isCoordinateValue(t));
};

export const elementValueConvert = (
    target: ElementValueTypeClass,
    errorClass: ErrorTypeClass[],
): NormalLiteralClass => {
    const elementValue = new NormalLiteralClass();

    const valueTypeClass = toTypeClass(target.getValue(), isNormalLiteralType, errorClass);
    if (valueTypeClass) {
        elementValue.copy(normalLiteralConvert(valueTypeClass, errorClass));
    }
    return elementValue;
};

export const locationValueConvert = (
    target: LocationValueTypeClass,
    errorClass: ErrorTypeClass[],
): (SignedLiteralClass | ExpressionClass)[] | string[] | ExpressionClass | null => {
    const value = target.getValue();
    const coordinates = target.getCoordinates();

    if (coordinates && coordinates.length > 0) {
        const values: (SignedLiteralClass | ExpressionClass)[] = [];
        coordinates.forEach((coordinate) => {
            const typeClass = toTypeClass(coordinate, isCoordinateValueType, errorClass);
            if (typeClass) {
                const coordinateValue = coordinateValueConvert(typeClass, errorClass);
                if (coordinateValue) {
                    values.push(coordinateValue);
                }
            }
        });
        return values;
    }

    if (value) {
        const typeClass = toTypeClass(
            value,
            (target): target is FieldNameTypeClass | BoundExpressionTypeClass =>
                isFieldNameType(target) || isBoundExpressionType(target),
            errorClass,
        );

        if (typeClass) {
            if (isFieldNameType(typeClass)) {
                return fieldNameConvert(typeClass, errorClass);
            }
            if (isBoundExpressionType(typeClass)) {
                return boundExpressionConvert(typeClass, errorClass);
            }
        }
    }

    return null;
};

export const isLocationValue = (
    target: any,
): target is (SignedLiteralClass | ExpressionClass)[] | string[] | ExpressionClass => {
    return isCoordinateValueArray(target) || isStringArray(target) || isExpressionClass(target);
};

export const isLocationValueArray = (
    target: any,
): target is ((SignedLiteralClass | ExpressionClass)[] | string[] | ExpressionClass)[] => {
    return Array.isArray(target) && target.every((t) => isLocationValue(t));
};

export class NormalValueClass extends CommonClass {
    private value:
        | string
        | SignedLiteralClass
        | NormalValueClass[]
        | DateFormulaClass
        | SubQueryClass
        | ExpressionClass
        | null = null;
    private valueType: string | null = null;

    setValue(
        value:
            | string
            | SignedLiteralClass
            | NormalValueClass[]
            | DateFormulaClass
            | SubQueryClass
            | ExpressionClass
            | null,
    ): void {
        if (isString(this.value) && isString(value)) {
            this.value = value;
        } else if (this.value instanceof CommonClass && value instanceof CommonClass) {
            if (isSignedLiteralClass(this.value) && isSignedLiteralClass(value)) {
                this.value.copy(value);
            }

            if (isNormalValueClassArray(this.value) && isNormalValueClassArray(value)) {
                this.value.push(...value);
            }

            if (isDateFormulaClass(this.value) && isDateFormulaClass(value)) {
                this.value.copy(value);
            }

            if (isSubQueryClass(this.value) && isSubQueryClass(value)) {
                this.value.copy(value);
            }

            if (isExpressionClass(this.value) && isExpressionClass(value)) {
                this.value.copy(value);
            }
        } else {
            this.value = value;
        }
    }

    setValueType(valueType: string | null): void {
        this.valueType = valueType;
    }

    getValue():
        | string
        | SignedLiteralClass
        | NormalValueClass[]
        | DateFormulaClass
        | SubQueryClass
        | ExpressionClass
        | null {
        return this.value;
    }

    getValueType(): string | null {
        return this.valueType;
    }

    copy(commonClass: NormalValueClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
    }
}

export const isNormalValueClass = (target: any): target is NormalValueClass => {
    return isCommonClass(target, NormalValueClass);
};

export const isNormalValueClassArray = (target: any): target is NormalValueClass[] => {
    return Array.isArray(target) && target.every((t) => isNormalValueClass(t));
};

export const normalValueConvert = (
    target: NormalValueTypeClass,
    errorClass: ErrorTypeClass[],
): NormalValueClass => {
    const normalValue = new NormalValueClass();
    normalValue.setValueType(target.getValueType());

    const valueTypeClass = target.getValue();

    if (typeof valueTypeClass === 'string') {
        normalValue.setValue(valueTypeClass);
    } else {
        const typeClass = toTypeClass(
            valueTypeClass,
            (
                target,
            ): target is
                | SignedNumberTypeClass
                | ValueListTypeClass
                | DateFormulaTypeClass
                | SubQueryTypeClass
                | BoundExpressionTypeClass =>
                isSignedNumberType(target) ||
                isValueListType(target) ||
                isDateFormulaType(target) ||
                isSubQueryType(target) ||
                isBoundExpressionType(target),
            errorClass,
        );

        if (typeClass) {
            if (isSignedNumberType(typeClass)) {
                normalValue.setValue(signedNumberConvert(typeClass, errorClass));
            }
            if (isValueListType(typeClass)) {
                normalValue.setValue(valueListConvert(typeClass, errorClass));
            }
            if (isDateFormulaType(typeClass)) {
                normalValue.setValue(dateFormulaConvert(typeClass, errorClass));
            }
            if (isSubQueryType(typeClass)) {
                normalValue.setValue(subQueryConvert(typeClass, errorClass));
            }
            if (isBoundExpressionType(typeClass)) {
                const expression = boundExpressionConvert(typeClass, errorClass);
                if (expression) {
                    normalValue.setValue(expression);
                }
            }
        }
    }

    return normalValue;
};

export class WhenValueClass extends CommonClass {
    private value: string | WhenLiteralClass[] | null = null;
    private valueType: TypeRefClass = new TypeRefClass();

    setValue(value: string | WhenLiteralClass[] | null): void {
        if (isWhenLiteralClassArray(this.value) && isWhenLiteralClassArray(value)) {
            this.value.push(...value);
        } else if (isString(this.value) && isString(value)) {
            this.value = value;
        } else {
            this.value = value;
        }
    }

    setValueType(valueType: TypeRefClass): void {
        this.valueType.copy(valueType);
    }

    getValue(): string | WhenLiteralClass[] | null {
        return this.value;
    }

    getValueType(): TypeRefClass {
        return this.valueType;
    }

    copy(commonClass: WhenValueClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
    }
}

export const isWhenValueTypeClass = (target: any): target is WhenValueClass => {
    return isCommonClass(target, WhenValueClass);
};

export const isWhenValueTypeClassArray = (target: any): target is WhenValueClass[] => {
    return Array.isArray(target) && target.every((t) => isWhenValueTypeClass(t));
};

export const whenValueConvert = (
    target: WhenValueTypeClass,
    errorClass: ErrorTypeClass[],
): WhenValueClass => {
    const whenValue = new WhenValueClass();

    const valueTypeClass = target.getValue();

    if (typeof valueTypeClass === 'string') {
        whenValue.setValue(valueTypeClass);
    } else if (Array.isArray(valueTypeClass)) {
        const values: WhenLiteralClass[] = [];
        valueTypeClass.forEach((whenliteralTypeClass) => {
            const typeClass = toTypeClass(whenliteralTypeClass, isWhenLiteralType, errorClass);
            if (typeClass) {
                values.push(whenLiteralConvert(typeClass, errorClass));
            }
        });
        whenValue.setValue(values);
    } else {
        const typeClass = toTypeClass(valueTypeClass, isNormalIdType, errorClass);
        if (typeClass) {
            whenValue.setValue(normalIdConvert(typeClass));
        }
    }

    const valueTypeTypeClass = target.getValueType();
    if (valueTypeTypeClass) {
        const typeClass = toTypeClass(valueTypeTypeClass, isTypeRefType, errorClass);
        if (typeClass) {
            whenValue.setValueType(typeRefConvert(typeClass, errorClass));
        }
    }

    return whenValue;
};
