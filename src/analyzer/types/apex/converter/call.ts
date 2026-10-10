import {
    CommonTypeClass,
    ErrorTypeClass,
    MethodCallTypeClass,
    DotMethodCallTypeClass,
    isNormalIdType,
    isAnyIdType,
    isExpressionListType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { normalIdConvert, anyIdConvert } from './id';
import { Expression } from './expression';
import { expressionListConvert } from './list';

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
