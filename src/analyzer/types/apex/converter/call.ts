import {
    CommonTypeClass,
    ErrorTypeClass,
    MethodCallTypeClass,
    DotMethodCallTypeClass,
    isNormalIdType,
    isAnyIdType,
    isExpressionListType,
} from '../../apex_IR';

import { toTypeClass, CommonClass, isCommonClass } from './commons';
import { normalIdConvert, anyIdConvert } from './id';
import { ExpressionClass } from './expression';
import { expressionListConvert } from './list';

export class MethodCallClass extends CommonClass {
    private value: string | null = null;
    private param: ExpressionClass[] = [];
    private reference: string | null = null;

    setValue(value: string | null): void {
        this.value = value;
    }

    resetParam(): void {
        this.param = [];
    }

    setParam(param: ExpressionClass[]): void {
        this.param.push(...param);
    }

    setReference(reference: string | null): void {
        this.reference = reference;
    }

    getValue(): string | null {
        return this.value;
    }

    getParam(): ExpressionClass[] {
        return this.param;
    }

    getReference(): string | null {
        return this.reference;
    }

    copy(commonClass: MethodCallClass): void {
        this.setValue(commonClass.getValue());
        this.resetParam();
        this.setParam(commonClass.getParam());
        this.setReference(commonClass.getReference());
    }
}

export const isMethodCallClass = (target: CommonClass): target is MethodCallClass => {
    return isCommonClass(target, MethodCallClass);
};

export const methodCallConvert = (
    target: MethodCallTypeClass,
    errorClass: ErrorTypeClass[],
): MethodCallClass => {
    const methodCall = new MethodCallClass();

    const paramTypeClass = target.getParam();
    if (paramTypeClass) {
        const expressionList = toTypeClass(paramTypeClass, isExpressionListType, errorClass);
        if (expressionList) {
            methodCall.setParam(expressionListConvert(expressionList, errorClass));
        }
    }

    const valueTypeClass = target.getValue();
    if (valueTypeClass) {
        const normalId = toTypeClass(valueTypeClass, isNormalIdType, errorClass);
        if (normalId) {
            methodCall.setValue(normalIdConvert(normalId));
        }
    }

    const reference = target.getReference();
    if (reference) {
        methodCall.setReference(reference);
    }

    return methodCall;
};

export class DotMethodCallClass extends CommonClass {
    private value: string | null = null;
    private param: ExpressionClass[] = [];

    setValue(value: string | null): void {
        this.value = value;
    }

    resetParam(): void {
        this.param = [];
    }

    setParam(param: ExpressionClass[]): void {
        this.param.push(...param);
    }

    getValue(): string | null {
        return this.value;
    }

    getParam(): ExpressionClass[] {
        return this.param;
    }

    copy(commonClass: DotMethodCallClass): void {
        this.setValue(commonClass.getValue());
        this.resetParam();
        this.setParam(commonClass.getParam());
    }
}

export const isDotMethodCallClass = (target: CommonClass): target is DotMethodCallClass => {
    return isCommonClass(target, DotMethodCallClass);
};

export const dotMethodCallConvert = (
    target: DotMethodCallTypeClass,
    errorClass: ErrorTypeClass[],
): DotMethodCallClass => {
    const dotMethodCall = new DotMethodCallClass();

    const paramTypeClass = target.getParam();
    if (paramTypeClass) {
        const expressionList = toTypeClass(paramTypeClass, isExpressionListType, errorClass);
        if (expressionList) {
            dotMethodCall.setParam(expressionListConvert(expressionList, errorClass));
        }
    }

    const valueTypeClass = toTypeClass(target.getValue(), isAnyIdType, errorClass);
    if (valueTypeClass) {
        dotMethodCall.setValue(anyIdConvert(valueTypeClass));
    }

    return dotMethodCall;
};
