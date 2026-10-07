import {
    NormalExpressionTypeClass,
    ErrorTypeClass,
    CommonTypeClass,
    Arth1ExpressionTypeClass,
    CoalExpressionTypeClass,
    DotExpressionTypeClass,
    BitOrExpressionTypeClass,
    ArrayExpressionTypeClass,
    NewExpressionTypeClass,
    AssignExpressionTypeClass,
    MethodCallExpressionTypeClass,
    BitNotExpressionTypeClass,
    Arth2ExpressionTypeClass,
    LogAndExpressionTypeClass,
    CastExpressionTypeClass,
    BitAndExpressionTypeClass,
    CmpExpressionTypeClass,
    BitExpressionTypeClass,
    LogOrExpressionTypeClass,
    CondExpressionTypeClass,
    EqualityExpressionTypeClass,
    PostOpExpressionTypeClass,
    NegExpressionTypeClass,
    PreOpExpressionTypeClass,
    SubExpressionTypeClass,
    InstanceOfExpressionTypeClass,
    isNormalExpressionType,
    isArth1ExpressionType,
    isCoalExpressionType,
    isDotExpressionType,
    isBitOrExpressionType,
    isArrayExpressionType,
    isNewExpressionType,
    isAssignExpressionType,
    isMethodCallExpressionType,
    isBitNotExpressionType,
    isArth2ExpressionType,
    isLogAndExpressionType,
    isCastExpressionType,
    isBitAndExpressionType,
    isCmpExpressionType,
    isBitExpressionType,
    isLogOrExpressionType,
    isCondExpressionType,
    isEqualityExpressionType,
    isPostOpExpressionType,
    isNegExpressionType,
    isPreOpExpressionType,
    isSubExpressionType,
    isInstanceOfExpressionType,
    isErrorType,
    ExpressionAllTypeClass,
    AnyIdTypeClass,
    DotMethodCallTypeClass,
} from '../apex_IR';

import { primaryConvert } from './primaryConvert';

export const expressionConvert = (typeClass: CommonTypeClass, errorClasses: ErrorTypeClass[]) => {
    if (isErrorType(typeClass)) {
        errorClasses.push(typeClass as ErrorTypeClass);
        return null;
    }

    let value = null;

    if (isNormalExpressionType(typeClass)) {
        value = (typeClass as NormalExpressionTypeClass).getValue() as string;
    }

    if (isArth1ExpressionType(typeClass)) {
        const left = (typeClass as Arth1ExpressionTypeClass).getLeft() as
            ExpressionAllTypeClass | ErrorTypeClass;
        const right = (typeClass as Arth1ExpressionTypeClass).getRight() as
            ExpressionAllTypeClass | ErrorTypeClass;
        const operator = (typeClass as Arth1ExpressionTypeClass).getOperator() as string;
    }

    if (isCoalExpressionType(typeClass)) {
        const left = (typeClass as CoalExpressionTypeClass).getLeft() as
            ExpressionAllTypeClass | ErrorTypeClass;
        const right = (typeClass as CoalExpressionTypeClass).getRight() as
            ExpressionAllTypeClass | ErrorTypeClass;
        const operator = (typeClass as CoalExpressionTypeClass).getOperator() as string;
    }

    if (isDotExpressionType(typeClass)) {
        const left = (typeClass as DotExpressionTypeClass).getLeft() as
            ExpressionAllTypeClass | ErrorTypeClass;
        const right = (typeClass as DotExpressionTypeClass).getRight() as
            AnyIdTypeClass | DotMethodCallTypeClass | ErrorTypeClass;
        const operator = (typeClass as CoalExpressionTypeClass).getOperator() as string;
    }

    if (isBitOrExpressionType(typeClass)) {
        const left = (typeClass as BitOrExpressionTypeClass).getLeft() as
            ExpressionAllTypeClass | ErrorTypeClass;
        const right = (typeClass as BitOrExpressionTypeClass).getRight() as
            ExpressionAllTypeClass | ErrorTypeClass;
        const operator = (typeClass as BitOrExpressionTypeClass).getOperator() as string;
    }
};
