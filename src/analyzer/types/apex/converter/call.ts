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
    value: NormalId | undefined;
    param: ExpressionList | undefined;
    reference: string | undefined;
};

export const methodCallConvert = (
    target: MethodCallTypeClass,
    errorClass: ErrorTypeClass[],
): MethodCall => {
    const valueTypeClass = target.getValue();
    let value: MethodCall['value'] = undefined;
    if (!(valueTypeClass instanceof CommonTypeClass)) {
        value = valueTypeClass ?? undefined;
    } else {
        const normalId = toTypeClass(valueTypeClass, isNormalIdType, errorClass);
        value = normalId ? normalIdConvert(normalId) : undefined;
    }

    const paramTypeClass = target.getParam();
    let param = undefined;
    if (paramTypeClass) {
        const expressionList = toTypeClass(paramTypeClass, isExpressionListType, errorClass);
        param = expressionList ? expressionListConvert(expressionList, errorClass) : undefined;
    }

    return {
        value: value,
        param: param,
        reference: target.getReference() ?? undefined,
    };
};

export type DotMethodCall = {
    value: AnyId | undefined;
    param: ExpressionList | undefined;
};

export const dotMethodCallConvert = (
    target: DotMethodCallTypeClass,
    errorClass: ErrorTypeClass[],
): DotMethodCall => {
    let value = undefined;
    const valueTypeClass = toTypeClass(target.getValue(), isAnyIdType, errorClass);
    if (valueTypeClass) {
        value = anyIdConvert(valueTypeClass);
    }

    const paramTypeClass = target.getParam();
    let param;
    if (!(paramTypeClass instanceof CommonTypeClass)) {
        param = paramTypeClass ?? undefined;
    } else {
        const expressionList = toTypeClass(paramTypeClass, isExpressionListType, errorClass);
        param = expressionList ? expressionListConvert(expressionList, errorClass) : undefined;
    }

    return {
        value: value,
        param: param,
    };
};
