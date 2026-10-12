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

import { toTypeClass, CommonClass, isCommonClass } from './commons';
import { normalIdConvert } from './id';
import { TypeRefClass, typeRefConvert } from './type';
import {
    ExpressionClass,
    expressionConvert,
    isExpressionClass,
    isExpressionClassArray,
} from './expression';
import { expressionListConvert } from './list';
import { NormalStatementClass } from './statement';
import { normalBlockConvert } from './block';
import { WhenValueClass, whenValueConvert } from './value';
import {
    isLocalVariableDeclarationClass,
    LocalVariableDeclarationClass,
    localVariableDeclarationConvert,
} from './declaration';

export class EnhancedForControlClass extends CommonClass {
    private value: string | null = null;
    private valueType: TypeRefClass = new TypeRefClass();
    private fromVariant: ExpressionClass = new ExpressionClass();

    setValue(value: string | null): void {
        this.value = value;
    }

    setValueType(valueType: TypeRefClass): void {
        this.valueType.copy(valueType);
    }

    setFromVariant(fromVariant: ExpressionClass): void {
        this.fromVariant.copy(fromVariant);
    }

    getValue(): string | null {
        return this.value;
    }

    getValueType(): TypeRefClass {
        return this.valueType;
    }

    getFromVariant(): ExpressionClass {
        return this.fromVariant;
    }

    copy(commonClass: EnhancedForControlClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
        this.setFromVariant(commonClass.getFromVariant());
    }
}

export const isEnhancedForControlClass = (target: any): target is EnhancedForControlClass => {
    return isCommonClass(target, EnhancedForControlClass);
};

export const isEnhancedForControlClassArray = (
    target: any,
): target is EnhancedForControlClass[] => {
    return Array.isArray(target) && target.every((t) => isEnhancedForControlClass(t));
};

export const enhancedForControlConvert = (
    target: EnhancedForControlTypeClass,
    errorClass: ErrorTypeClass[],
): EnhancedForControlClass => {
    const enhancedForControl = new EnhancedForControlClass();

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        enhancedForControl.setValue(normalIdConvert(valueTypeClass));
    }

    const valueTypeTypeClass = toTypeClass(target.getValueType(), isTypeRefType, errorClass);
    if (valueTypeTypeClass) {
        enhancedForControl.setValueType(typeRefConvert(valueTypeTypeClass, errorClass));
    }

    const fromVariantTypeClass = toTypeClass(
        target.getFromVariant(),
        isExpressionTypeAll,
        errorClass,
    );
    if (fromVariantTypeClass) {
        enhancedForControl.setFromVariant(expressionConvert(fromVariantTypeClass, errorClass));
    }

    return enhancedForControl;
};

export class ForControlClass extends CommonClass {
    private value: EnhancedForControlClass | ExpressionClass | null = null;
    private init: LocalVariableDeclarationClass | ExpressionClass[] | null = null;
    private update: ExpressionClass[] = [];

    setValue(value: EnhancedForControlClass | ExpressionClass | null): void {
        if (isEnhancedForControlClass(this.value) && isEnhancedForControlClass(value)) {
            this.value.copy(value);
        } else if (isExpressionClass(this.value) && isExpressionClass(value)) {
            this.value.copy(value);
        } else {
            this.value = value;
        }
    }

    setInit(init: LocalVariableDeclarationClass | ExpressionClass[] | null): void {
        if (isLocalVariableDeclarationClass(this.init) && isLocalVariableDeclarationClass(init)) {
            this.init.copy(init);
        } else if (isExpressionClassArray(this.init) && isExpressionClassArray(init)) {
            this.init.push(...init);
        } else {
            this.init = init;
        }
    }

    resetUpdate(): void {
        this.update = [];
    }

    setupdate(update: ExpressionClass[]): void {
        this.update.push(...update);
    }

    getValue(): EnhancedForControlClass | ExpressionClass | null {
        return this.value;
    }

    getInit(): LocalVariableDeclarationClass | ExpressionClass[] | null {
        return this.init;
    }

    getUpdate(): ExpressionClass[] {
        return this.update;
    }

    copy(commonClass: ForControlClass): void {
        this.setValue(commonClass.getValue());
        this.setInit(commonClass.getInit());
        this.resetUpdate();
        this.setupdate(commonClass.getUpdate());
    }
}

export const isForControlClass = (target: any): target is ForControlClass => {
    return isCommonClass(target, ForControlClass);
};

export const isForControlClassArray = (target: any): target is ForControlClass[] => {
    return Array.isArray(target) && target.every((t) => isForControlClass(t));
};

export const forControlConvert = (
    target: ForControlTypeClass,
    errorClass: ErrorTypeClass[],
): ForControlClass => {
    const forControl = new ForControlClass();

    const updateValue = target.getUpdate();
    if (updateValue) {
        const updateTypeClass = toTypeClass(updateValue, isForUpdateType, errorClass);
        if (updateTypeClass) {
            forControl.setupdate(forUpdateConvert(updateTypeClass, errorClass));
        }
    }

    const initValue = target.getInit();
    if (initValue) {
        const initTypeClass = toTypeClass(initValue, isForInitType, errorClass);
        if (initTypeClass) {
            const init = forInitConvert(initTypeClass, errorClass);
            if (init) {
                forControl.setInit(init);
            }
        }
    }

    const valueValue = target.getValue();

    if (valueValue) {
        if (isEnhancedForControlType(valueValue)) {
            forControl.setValue(enhancedForControlConvert(valueValue, errorClass));
        }

        if (isExpressionTypeAll) {
            const expressionTypeClass = toTypeClass(valueValue, isExpressionTypeAll, errorClass);
            if (expressionTypeClass) {
                forControl.setValue(expressionConvert(expressionTypeClass, errorClass));
            }
        }
    }

    return forControl;
};

export const forInitConvert = (
    target: ForInitTypeClass,
    errorClass: ErrorTypeClass[],
): LocalVariableDeclarationClass | ExpressionClass[] | null => {
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

    return null;
};

export const isForInit = (
    target: any,
): target is LocalVariableDeclarationClass | ExpressionClass[] => {
    return isLocalVariableDeclarationClass(target) || isExpressionClassArray(target);
};

export const isForInitArray = (
    target: any,
): target is (LocalVariableDeclarationClass | ExpressionClass[])[] => {
    return Array.isArray(target) && target.every((t) => isForInit(t));
};

export const forUpdateConvert = (
    target: ForUpdateTypeClass,
    errorClass: ErrorTypeClass[],
): ExpressionClass[] => {
    const expressionClassList: ExpressionClass[] = [];

    const valueTypeClass = toTypeClass(target.getValue(), isExpressionListType, errorClass);
    if (valueTypeClass) {
        expressionClassList.push(...expressionListConvert(valueTypeClass, errorClass));
    }

    return expressionClassList;
};

export class WhenControlClass extends CommonClass {
    private value: WhenValueClass = new WhenValueClass();
    private block: NormalStatementClass[] = [];

    setValue(value: WhenValueClass): void {
        this.value.copy(value);
    }

    resetBlock(): void {
        this.block = [];
    }

    setBlock(block: NormalStatementClass[]): void {
        this.block.push(...block);
    }

    getValue(): WhenValueClass {
        return this.value;
    }

    getBlock(): NormalStatementClass[] {
        return this.block;
    }

    copy(commonClass: WhenControlClass): void {
        this.setValue(commonClass.getValue());
        this.resetBlock();
        this.setBlock(commonClass.getBlock());
    }
}

export const isWhenControlClass = (target: any): target is WhenControlClass => {
    return isCommonClass(target, WhenControlClass);
};

export const isWhenControlClassArray = (target: any): target is WhenControlClass[] => {
    return Array.isArray(target) && target.every((t) => isWhenControlClass(t));
};

export const whenControlConvert = (
    target: WhenControlTypeClass,
    errorClass: ErrorTypeClass[],
): WhenControlClass => {
    const whenControl = new WhenControlClass();

    const blockTypeClass = toTypeClass(target.getBlock(), isNormalBlockType, errorClass);
    if (blockTypeClass) {
        whenControl.setBlock(normalBlockConvert(blockTypeClass, errorClass));
    }

    const valueTypeClass = toTypeClass(target.getValue(), isWhenValueType, errorClass);
    if (valueTypeClass) {
        whenControl.setValue(whenValueConvert(valueTypeClass, errorClass));
    }

    return whenControl;
};
