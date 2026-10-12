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
import { ExpressionClass, expressionConvert } from './expression';
import { expressionListConvert } from './list';
import { NormalStatementClass } from './statement';
import { normalBlockConvert } from './block';
import { WhenValueClass, whenValueConvert } from './value';
import { LocalVariableDeclarationClass, localVariableDeclarationConvert } from './declaration';

export class EnhancedForControlClass extends CommonClass {
    private value: string | null = null;
    private valueType: TypeRef | null = null;
    private fromVariant: Expression | null = null;

    setValue(value: string | null): void {
        this.value = value;
    }

    setValueType(valueType: TypeRef | null): void {
        this.valueType = valueType;
    }

    setFromVariant(fromVariant: Expression | null): void {
        this.fromVariant = fromVariant;
    }

    getValue(): string | null {
        return this.value;
    }

    getValueType(): TypeRef | null {
        return this.valueType;
    }

    getFromVariant(): Expression | null {
        return this.fromVariant;
    }

    copy(commonClass: EnhancedForControlClass): void {
        this.setValue(commonClass.getValue());
        this.setValueType(commonClass.getValueType());
        this.setFromVariant(commonClass.getFromVariant());
    }
}

export const isEnhancedForControlClass = (
    target: CommonClass,
): target is EnhancedForControlClass => {
    return isCommonClass(target, EnhancedForControlClass);
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

export class ForControlClass extends CommonClass {
    private value: EnhancedForControlClass | Expression | null = null;
    private init: LocalVariableDeclaration | Expression[] | null = null;
    private update: Expression[] = [];

    setValue(value: EnhancedForControlClass | Expression | null): void {
        this.value = value;
    }

    setInit(init: LocalVariableDeclaration | Expression[] | null): void {
        this.init = init;
    }

    resetUpdate(): void {
        this.update = [];
    }

    setupdate(update: Expression[]): void {
        this.update.push(...update);
    }

    getValue(): string | null {
        return this.value;
    }

    getInit(): LocalVariableDeclaration | Expression[] | null {
        return this.init;
    }

    getUpdate(): Expression[] {
        return this.update;
    }

    copy(commonClass: ForControlClass): void {
        this.setValue(commonClass.getValue());
        this.setInit(commonClass.getInit());
        this.resetUpdate();
        this.setupdate(commonClass.getUpdate());
    }
}

export const isForControlClass = (target: CommonClass): target is ForControlClass => {
    return isCommonClass(target, ForControlClass);
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

export const isWhenControlClass = (target: CommonClass): target is WhenControlClass => {
    return isCommonClass(target, WhenControlClass);
};

export const whenControlConvert = (
    target: WhenControlTypeClass,
    errorClass: ErrorTypeClass[],
): WhenControlClass => {
    const whenControl = new WhenControlClass();

    const block: NormalStatementClass[] = [];
    const blockTypeClass = toTypeClass(target.getBlock(), isNormalBlockType, errorClass);
    if (blockTypeClass) {
        block.push(...normalBlockConvert(blockTypeClass, errorClass));
    }
    whenControl.setBlock(block);

    const valueTypeClass = toTypeClass(target.getValue(), isWhenValueType, errorClass);
    if (valueTypeClass) {
        whenControl.setValue(whenValueConvert(valueTypeClass, errorClass));
    }

    return whenControl;
};
