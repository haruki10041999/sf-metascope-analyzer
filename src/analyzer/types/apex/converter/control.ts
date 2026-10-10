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
import { normalIdConvert } from './id';
import { TypeRef, typeRefConvert } from './type';
import { Expression, expressionConvert } from './expression';
import { expressionListConvert } from './list';
import { NormalStatement } from './statement';
import { normalBlockConvert } from './block';
import { WhenValue, whenValueConvert } from './value';
import { LocalVariableDeclaration, localVariableDeclarationConvert } from './declaration';

export type EnhancedForControl = {
    value?: string;
    valueType: TypeRef;
    fromVariant?: Expression;
};

export const enhancedForControlConvert = (
    target: EnhancedForControlTypeClass,
    errorClass: ErrorTypeClass[],
): EnhancedForControl => {
    const enhancedForControl: EnhancedForControl = {
        valueType: {
            value: [],
        },
    };

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        enhancedForControl.value = normalIdConvert(valueTypeClass);
    }

    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);
    if (valueTypeTypeClass) {
        const typeRef = typeRefConvert(valueTypeTypeClass, errorClass);
        enhancedForControl.valueType.value.push(...typeRef.value);
        if (typeRef.dimension) {
            enhancedForControl.valueType.dimension = typeRef.dimension;
        }
    }

    const fromVariantTypeClass = toTypeClass(
        target.getFromVariant(),
        isExpressionTypeAll,
        errorClass,
    );
    if (fromVariantTypeClass) {
        const expression = expressionConvert(fromVariantTypeClass, errorClass);
        if (expression) {
            enhancedForControl.fromVariant = expression;
        }
    }

    return enhancedForControl;
};

export type ForControl = {
    value?: EnhancedForControl | Expression;
    init?: LocalVariableDeclaration | Expression[];
    update: Expression[];
};

export const forControlConvert = (
    target: ForControlTypeClass,
    errorClass: ErrorTypeClass[],
): ForControl => {
    const update: Expression[] = [];
    const updateValue = target.getUpdate();
    if (updateValue) {
        const updateTypeClass = toTypeClass(updateValue, isForUpdateType, errorClass);
        if (updateTypeClass) {
            update.push(...forUpdateConvert(updateTypeClass, errorClass));
        }
    }

    const forControl: ForControl = {
        update: update,
    };

    const initValue = target.getInit();
    if (initValue) {
        const initTypeClass = toTypeClass(initValue, isForInitType, errorClass);
        if (initTypeClass) {
            const init = forInitConvert(initTypeClass, errorClass);
            if (init) {
                forControl.init = init;
            }
        }
    }

    const valueValue = target.getValue();

    if (valueValue) {
        if (isEnhancedForControlType(valueValue)) {
            forControl.value = enhancedForControlConvert(valueValue, errorClass);
        }

        if (isExpressionTypeAll) {
            const expressionTypeClass = toTypeClass(valueValue, isExpressionTypeAll, errorClass);
            if (expressionTypeClass) {
                const expression = expressionConvert(expressionTypeClass, errorClass);
                if (expression) {
                    forControl.value = expression;
                }
            }
        }
    }

    return forControl;
};

export const forInitConvert = (
    target: ForInitTypeClass,
    errorClass: ErrorTypeClass[],
): LocalVariableDeclaration | Expression[] | undefined => {
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

export const forUpdateConvert = (
    target: ForUpdateTypeClass,
    errorClass: ErrorTypeClass[],
): Expression[] => {
    const valueTypeClass = toTypeClass(target.getValue(), isExpressionListType, errorClass);
    if (valueTypeClass) {
        return expressionListConvert(valueTypeClass, errorClass);
    }

    return [];
};

export type WhenControl = {
    value: WhenValue;
    block: NormalStatement[];
};

export const whenControlConvert = (
    target: WhenControlTypeClass,
    errorClass: ErrorTypeClass[],
): WhenControl => {
    const block: NormalStatement[] = [];
    const blockTypeClass = toTypeClass(target.getBlock(), isNormalBlockType, errorClass);
    if (blockTypeClass) {
        block.push(...normalBlockConvert(blockTypeClass, errorClass));
    }

    const whenControl: WhenControl = {
        value: {
            valueType: {
                value: [],
            },
        },
        block: block,
    };

    const valueTypeClass = toTypeClass(target.getValue(), isWhenValueType, errorClass);
    if (valueTypeClass) {
        const value = whenValueConvert(valueTypeClass, errorClass);
        whenControl.value.valueType.value = value.valueType.value;
        if (value.value) {
            whenControl.value.value = value.value;
        }
        if (value.valueType.dimension) {
            whenControl.value.valueType.dimension = value.valueType.dimension;
        }
    }

    return whenControl;
};
