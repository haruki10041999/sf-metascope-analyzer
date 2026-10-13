import {
    CommonTypeClass,
    ErrorTypeClass,
    NormalLiteralTypeClass,
    WhenLiteralTypeClass,
    SoqlLiteralTypeClass,
    SoslLiteralTypeClass,
    SoslLiteralAltTypeClass,
    SignedIntegerTypeClass,
    SignedNumberTypeClass,
    isQualifiedNameType,
    isNormalQueryType,
    isBoundExpressionType,
    isSoslClausesType,
} from '../../apex_IR';

import { toPrimitiveValue, toTypeClass, CommonClass, isCommonClass } from './commons';
import { qualifiedNameConvert } from './name';
import { ExpressionClass, boundExpressionConvert, isExpressionClass } from './expression';
import { NormalQueryClass, normalQueryConvert } from './query';
import { SoslClausesClass, soslClausesConvert } from './clause';
import { isString } from './id';

export class NormalLiteralClass extends CommonClass {
    private value: string | null = null;
    private valueType: string | null = null;

    setValue(value: string | null): void {
        this.value = value;
    }

    setValueType(valueType: string | null): void {
        this.valueType = valueType;
    }

    getValue(): string | null {
        return this.value;
    }

    getValueType(): string | null {
        return this.valueType;
    }

    copy(commonClass: NormalLiteralClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
    }
}

export const isNormalLiteralClass = (target: any): target is NormalLiteralClass => {
    return isCommonClass(target, NormalLiteralClass);
};

export const isNormalLiteralClassArray = (target: any): target is NormalLiteralClass[] => {
    return Array.isArray(target) && target.every((t) => isNormalLiteralClass(t));
};

export const normalLiteralConvert = (
    target: NormalLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): NormalLiteralClass => {
    const normalLiteral = new NormalLiteralClass();
    normalLiteral.setValueType(target.getValueType());

    normalLiteral.setValue(
        toPrimitiveValue(
            target.getValue(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    return normalLiteral;
};

export class WhenLiteralClass extends CommonClass {
    private value: string | string[] | null = null;
    private valueType: string | null = null;
    private operator: string | null = null;

    setValue(value: string | string[] | null): void {
        this.value = value;
    }

    setValueType(valueType: string | null): void {
        this.valueType = valueType;
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    getValue(): string | string[] | null {
        return this.value;
    }

    getValueType(): string | null {
        return this.valueType;
    }

    getOperator(): string | null {
        return this.operator;
    }

    copy(commonClass: WhenLiteralClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
        this.setOperator(commonClass.getOperator());
    }
}

export const isWhenLiteralClass = (target: any): target is WhenLiteralClass => {
    return isCommonClass(target, WhenLiteralClass);
};

export const isWhenLiteralClassArray = (target: any): target is WhenLiteralClass[] => {
    return Array.isArray(target) && target.every((t) => isWhenLiteralClass(t));
};

export const whenLiteralConvert = (
    target: WhenLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): WhenLiteralClass => {
    const whenLiteral = new WhenLiteralClass();
    whenLiteral.setValueType(target.getValueType());

    const valueTypeClass = target.getValue();
    if (typeof valueTypeClass === 'string') {
        whenLiteral.setValue(valueTypeClass);
    } else {
        const nameTypeClass = toTypeClass(valueTypeClass, isQualifiedNameType, errorClass);
        if (nameTypeClass) {
            whenLiteral.setValue(qualifiedNameConvert(nameTypeClass, errorClass));
        }
    }

    whenLiteral.setOperator(target.getOperator());

    return whenLiteral;
};

export const soqlLiteralConvert = (
    target: SoqlLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): NormalQueryClass => {
    const soqlLiteral = new NormalQueryClass();

    const queyTypeClass = toTypeClass(target.getValue(), isNormalQueryType, errorClass);
    if (queyTypeClass) {
        soqlLiteral.copy(normalQueryConvert(queyTypeClass, errorClass));
    }

    return soqlLiteral;
};

export class SoslLiteralClass extends CommonClass {
    private value: string | ExpressionClass | null = null;
    private soslClauses: SoslClausesClass = new SoslClausesClass();

    setValue(value: string | ExpressionClass | null) {
        if (isString(this.value) && isString(value)) {
            this.value = value;
        } else if (isExpressionClass(this.value) && isExpressionClass(value)) {
            this.value.copy(value);
        } else {
            this.value = value;
        }
    }

    setSoslClauses(soslClauses: SoslClausesClass): void {
        this.soslClauses.copy(soslClauses);
    }

    getValue(): string | ExpressionClass | null {
        return this.value;
    }

    getSoslClauses(): SoslClausesClass {
        return this.soslClauses;
    }

    copy(commonClass: SoslLiteralClass): void {
        this.setValue(commonClass.getValue());
        this.setSoslClauses(commonClass.getSoslClauses());
    }
}

export const isSoslLiteralClass = (target: any): target is SoslLiteralClass => {
    return isCommonClass(target, SoslLiteralClass);
};

export const isSoslLiteralClassArray = (target: any): target is SoslLiteralClass[] => {
    return Array.isArray(target) && target.every((t) => isSoslLiteralClass(t));
};

export const soslLiteralConvert = (
    target: SoslLiteralTypeClass,
    errorClass: ErrorTypeClass[],
): SoslLiteralClass => {
    const soslLiteral = new SoslLiteralClass();

    const soslClausesTypeClass = toTypeClass(
        target.getSoslClauses(),
        isSoslClausesType,
        errorClass,
    );
    if (soslClausesTypeClass) {
        soslLiteral.setSoslClauses(soslClausesConvert(soslClausesTypeClass, errorClass));
    }

    const valueTypeClass = target.getValue();
    if (typeof valueTypeClass === 'string') {
        soslLiteral.setValue(valueTypeClass);
    } else {
        const typeClass = toTypeClass(valueTypeClass, isBoundExpressionType, errorClass);
        if (typeClass) {
            soslLiteral.setValue(boundExpressionConvert(typeClass, errorClass));
        }
    }

    return soslLiteral;
};

export class SoslLiteralAltClass extends CommonClass {
    private value: string | null = null;
    private soslClauses: SoslClausesClass = new SoslClausesClass();

    setValue(value: string | null) {
        this.value = value;
    }

    setSoslClauses(soslClauses: SoslClausesClass): void {
        this.soslClauses.copy(soslClauses);
    }

    getValue(): string | null {
        return this.value;
    }

    getSoslClauses(): SoslClausesClass {
        return this.soslClauses;
    }

    copy(commonClass: SoslLiteralAltClass): void {
        this.setValue(commonClass.getValue());
        this.setSoslClauses(commonClass.getSoslClauses());
    }
}

export const isSoslLiteralAltClass = (target: any): target is SoslLiteralAltClass => {
    return isCommonClass(target, SoslLiteralAltClass);
};

export const isSoslLiteralAltClassArray = (
    target: CommonClass,
): target is SoslLiteralAltClass[] => {
    return Array.isArray(target) && target.every((t) => isSoslLiteralAltClass(t));
};

export const soslLiteralAltConvert = (
    target: SoslLiteralAltTypeClass,
    errorClass: ErrorTypeClass[],
): SoslLiteralAltClass => {
    const soslLiteralAlt = new SoslLiteralAltClass();

    const soslClausesTypeClass = toTypeClass(
        target.getSoslClauses(),
        isSoslClausesType,
        errorClass,
    );
    if (soslClausesTypeClass) {
        soslLiteralAlt.setSoslClauses(soslClausesConvert(soslClausesTypeClass, errorClass));
    }

    soslLiteralAlt.setValue(
        toPrimitiveValue(
            target.getValue(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    return soslLiteralAlt;
};

export class SignedLiteralClass extends CommonClass {
    private value: string | null = null;
    private valueType: string | null = null;
    private operator: string | null = null;

    setValue(value: string | null): void {
        this.value = value;
    }

    setValueType(valueType: string | null): void {
        this.valueType = valueType;
    }

    setOperator(operator: string | null): void {
        this.operator = operator;
    }

    getValue(): string | null {
        return this.value;
    }

    getValueType(): string | null {
        return this.valueType;
    }

    getOperator(): string | null {
        return this.operator;
    }

    copy(commonClass: SignedLiteralClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
        this.setOperator(commonClass.getOperator());
    }
}

export const isSignedLiteralClass = (target: any): target is SignedLiteralClass => {
    return isCommonClass(target, SignedLiteralClass);
};

export const isSignedLiteralClassArray = (target: any): target is SignedLiteralClass[] => {
    return Array.isArray(target) && target.every((t) => isSignedLiteralClass(t));
};

export const signedIntegerConvert = (
    target: SignedIntegerTypeClass,
    errorClass: ErrorTypeClass[],
): SignedLiteralClass => {
    const signedInteger = new SignedLiteralClass();
    signedInteger.setValueType(target.getValueType());

    signedInteger.setValue(
        toPrimitiveValue(
            target.getValue(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    signedInteger.setOperator(target.getOperator());

    return signedInteger;
};

export const signedNumberConvert = (
    target: SignedNumberTypeClass,
    errorClass: ErrorTypeClass[],
): SignedLiteralClass => {
    const signedNumber = new SignedLiteralClass();
    signedNumber.setValueType(target.getValueType());

    signedNumber.setValue(
        toPrimitiveValue(
            target.getValue(),
            (target): target is string => typeof target === 'string',
            errorClass,
        ),
    );

    signedNumber.setOperator(target.getOperator());

    return signedNumber;
};
