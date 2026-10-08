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
import { expressionListConvert } from './list';

export const methodCallConvert = (
    target: MethodCallTypeClass,
    errorClass: ErrorTypeClass[],
): { value: string | null; param: any[] | null; reference: string | null } => {
    const valueTypeClass = target.getValue();
    let value;
    if (!(valueTypeClass instanceof CommonTypeClass)) {
        value = valueTypeClass;
    } else {
        const normalId = toTypeClass(valueTypeClass, isNormalIdType, errorClass);
        value = normalId ? normalIdConvert(normalId) : null;
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
        reference: target.getReference(),
    };
};

export const dotMethodCallConvert = (
    target: DotMethodCallTypeClass,
    errorClass: ErrorTypeClass[],
): { value: string | null; param: any[] | null } => {
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
