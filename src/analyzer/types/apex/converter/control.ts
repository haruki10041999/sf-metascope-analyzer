import {
    ErrorTypeClass,
    ForControlTypeClass,
    ForInitTypeClass,
    ForUpdateTypeClass,
    EnhancedForControlTypeClass,
    WhenControlTypeClass,
    ExpressionListTypeClass,
    LocalVariableDeclarationTypeClass,
    isEnhancedForControlType,
    isExpressionListType,
    isExpressionTypeAll,
    isForInitType,
    isForUpdateType,
    isLocalVariableDeclarationType,
    isNormalBlockType,
    isNormalIdType,
    isTypeRefType,
    isWhenValueType,
} from '../../apex_IR';

import { toTypeClass } from './commons';
import { NormalId, normalIdConvert } from './id';
import { TypeRef, typeRefConvert } from './type';
import { Expression, expressionConvert } from './expression';
import { ExpressionList, expressionListConvert } from './list';
import { NormalBlock, normalBlockConvert } from './block';
import { WhenValue, whenValueConvert } from './value';
import { LocalVariableDeclaration, localVariableDeclarationConvert } from './declaration';

export type EnhancedForControl = {
    value: NormalId | undefined;
    valueType: TypeRef | undefined;
    fromVariant: Expression;
};

export const enhancedForControlConvert = (
    target: EnhancedForControlTypeClass,
    errorClass: ErrorTypeClass[],
): EnhancedForControl => {
    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);
    const fromVariantTypeClass = toTypeClass(
        target.getFromVariant(),
        isExpressionTypeAll,
        errorClass,
    );

    return {
        value: valueTypeClass ? normalIdConvert(valueTypeClass) : undefined,
        valueType: valueTypeTypeClass ? typeRefConvert(valueTypeTypeClass, errorClass) : undefined,
        fromVariant: fromVariantTypeClass
            ? expressionConvert(fromVariantTypeClass, errorClass)
            : undefined,
    };
};

export type ForControl = {
    value: EnhancedForControl | Expression;
    init: ForInit;
    update: ForUpdate;
};

export const forControlConvert = (
    target: ForControlTypeClass,
    errorClass: ErrorTypeClass[],
): ForControl => {
    const valueValue = target.getValue();

    let value: ForControl['value'] = undefined;
    if (valueValue) {
        if (isEnhancedForControlType(valueValue)) {
            value = enhancedForControlConvert(valueValue, errorClass);
        } else {
            const expressionTypeClass = toTypeClass(valueValue, isExpressionTypeAll, errorClass);
            value = expressionTypeClass
                ? expressionConvert(expressionTypeClass, errorClass)
                : undefined;
        }
    }

    const initValue = target.getInit();
    const initTypeClass = initValue ? toTypeClass(initValue, isForInitType, errorClass) : undefined;

    const updateValue = target.getUpdate();
    const updateTypeClass = updateValue
        ? toTypeClass(updateValue, isForUpdateType, errorClass)
        : undefined;

    return {
        value: value,
        init: initTypeClass ? forInitConvert(initTypeClass, errorClass) : undefined,
        update: updateTypeClass ? forUpdateConvert(updateTypeClass, errorClass) : undefined,
    };
};

export type ForInit = LocalVariableDeclaration | ExpressionList;

export const forInitConvert = (target: ForInitTypeClass, errorClass: ErrorTypeClass[]): ForInit => {
    const valueTypeClass = toTypeClass(
        target.getValue(),
        (target): target is LocalVariableDeclarationTypeClass | ExpressionListTypeClass =>
            isLocalVariableDeclarationType(target) || isExpressionListType(target),
        errorClass,
    );

    if (valueTypeClass) {
        if (isLocalVariableDeclarationType(valueTypeClass)) {
            return localVariableDeclarationConvert(valueTypeClass, errorClass);
        }
        if (isExpressionListType(valueTypeClass)) {
            return expressionListConvert(valueTypeClass, errorClass);
        }
    }

    return undefined;
};

export type ForUpdate = ExpressionList;

export const forUpdateConvert = (
    target: ForUpdateTypeClass,
    errorClass: ErrorTypeClass[],
): ForUpdate => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionListType, errorClass);
    return valueTypeClass ? expressionListConvert(valueTypeClass, errorClass) : undefined;
};

export type WhenControl = {
    value: WhenValue | undefined;
    block: NormalBlock;
};

export const whenControlConvert = (
    target: WhenControlTypeClass,
    errorClass: ErrorTypeClass[],
): WhenControl => {
    const valueTypeClass = toTypeClass(target.getValue(), isWhenValueType, errorClass);
    const blockTypeClass = toTypeClass(target.getBlock(), isNormalBlockType, errorClass);

    return {
        value: valueTypeClass ? whenValueConvert(valueTypeClass, errorClass) : undefined,
        block: blockTypeClass ? normalBlockConvert(blockTypeClass, errorClass) : undefined,
    };
};
