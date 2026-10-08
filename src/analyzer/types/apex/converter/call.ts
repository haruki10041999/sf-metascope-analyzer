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
import { NormalId, normalIdConvert, AnyId, anyIdConvert } from './id';
import { ExpressionList, expressionListConvert } from './list';

export type MethodCall = {
    value: NormalId | null;
    param: ExpressionList | null;
    reference: string | null;
};

export const methodCallConvert = (
    target: MethodCallTypeClass,
    errorClass: ErrorTypeClass[],
): MethodCall => {
    const valueTypeClass = target.getValue();
    let value;
    if (!(valueTypeClass instanceof CommonTypeClass)) {
        value = valueTypeClass;
    } else {
        const normalId = toTypeClass(valueTypeClass, isNormalIdType, errorClass);
        value = normalId ? normalIdConvert(normalId) : null;
    }

    const paramTypeClass = target.getParam();
    let param = null;
    if (paramTypeClass) {
        const expressionList = toTypeClass(paramTypeClass, isExpressionListType, errorClass);
        param = expressionList ? expressionListConvert(expressionList, errorClass) : null;
    }

    return {
        value: value,
        param: param,
        reference: target.getReference(),
    };
};

export type DotMethodCall = {
    value: AnyId | null;
    param: ExpressionList | null;
};

export const dotMethodCallConvert = (
    target: DotMethodCallTypeClass,
    errorClass: ErrorTypeClass[],
): DotMethodCall => {
    let value = null;
    const valueTypeClass = toTypeClass(target.getValue(), isAnyIdType, errorClass);
    if (valueTypeClass) {
        value = anyIdConvert(valueTypeClass);
    }

    const paramTypeClass = target.getParam();
    let param;
    if (!(paramTypeClass instanceof CommonTypeClass)) {
        param = paramTypeClass;
    } else {
        const expressionList = toTypeClass(paramTypeClass, isExpressionListType, errorClass);
        param = expressionList ? expressionListConvert(expressionList, errorClass) : null;
    }

    return {
        value: value,
        param: param,
    };
};
