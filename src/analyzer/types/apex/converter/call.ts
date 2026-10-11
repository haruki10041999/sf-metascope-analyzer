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
import { Expression } from './expression';
import { expressionListConvert } from './list';

export class MethodCallClass extends CommonClass {
    private value: string | null;
    private param: Expression[];
    private reference: string | null;

    constructor(value: string | null, param: Expression[], reference: string | null) {
        super();
        this.value = value;
        this.param = param;
        this.reference = reference;
    }

    getValue(): string | null {
        return this.value;
    }

    getParam(): Expression[] {
        return this.param;
    }

    getReference(): string | null {
        return this.reference;
    }
}

export const isMethodCallClass = (target: CommonClass): target is MethodCallClass => {
    return isCommonClass(target, MethodCallClass);
};

export type MethodCall = {
    value?: string;
    param: Expression[];
    reference?: string;
};

export const methodCallConvert = (
    target: MethodCallTypeClass,
    errorClass: ErrorTypeClass[],
): MethodCall => {
    const param: Expression[] = [];
    const paramTypeClass = target.getParam();
    if (paramTypeClass) {
        const expressionList = toTypeClass(paramTypeClass, isExpressionListType, errorClass);
        if (expressionList) {
            param.push(...expressionListConvert(expressionList, errorClass));
        }
    }

    const methodCall: MethodCall = {
        param: param,
    };

    const valueTypeClass = target.getValue();
    if (valueTypeClass) {
        const normalId = toTypeClass(valueTypeClass, isNormalIdType, errorClass);
        if (normalId) {
            methodCall.value = normalIdConvert(normalId);
        }
    }

    const reference = target.getReference();
    if (reference) {
        methodCall.reference = reference;
    }

    return methodCall;
};

export class DotMethodCallClass extends CommonClass {
    private value: string | null;
    private param: Expression[];

    constructor(value: string | null, param: Expression[]) {
        super();
        this.value = value;
        this.param = param;
    }

    getValue(): string | null {
        return this.value;
    }

    getParam(): Expression[] {
        return this.param;
    }
}

export const isDotMethodCallClass = (target: CommonClass): target is DotMethodCallClass => {
    return isCommonClass(target, DotMethodCallClass);
};

export type DotMethodCall = {
    value?: string;
    param: Expression[];
};

export const dotMethodCallConvert = (
    target: DotMethodCallTypeClass,
    errorClass: ErrorTypeClass[],
): DotMethodCall => {
    const param: Expression[] = [];
    const paramTypeClass = target.getParam();
    if (paramTypeClass) {
        const expressionList = toTypeClass(paramTypeClass, isExpressionListType, errorClass);
        if (expressionList) {
            param.push(...expressionListConvert(expressionList, errorClass));
        }
    }

    const dotMethodCall: DotMethodCall = {
        param: param,
    };

    const valueTypeClass = toTypeClass(target.getValue(), isAnyIdType, errorClass);
    if (valueTypeClass) {
        dotMethodCall.value = anyIdConvert(valueTypeClass);
    }

    return dotMethodCall;
};
