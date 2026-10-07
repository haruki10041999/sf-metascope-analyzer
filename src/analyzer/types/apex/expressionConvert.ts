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
        const arth1TypeClassLeftValue = (typeClass as Arth1ExpressionTypeClass).getLeft();
        const arth1TypeClassRightValue = (typeClass as Arth1ExpressionTypeClass).getRight();
        const arth1TypeClassOperatorValue = (typeClass as Arth1ExpressionTypeClass).getOperator();
    }
};
