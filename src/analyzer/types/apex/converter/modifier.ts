import {
    ErrorTypeClass,
    NormalModifierTypeClass,
    AnnotationTypeClass,
    isNormalModifierType,
    isAnnotationType,
    isNormalIdType,
    ElementValueTypeClass,
    ElementValuePairsTypeClass,
    isElementValueType,
    isElementValuePairsType,
} from '../../apex_IR';

import { toTypeClass, CommonClass, isCommonClass } from './commons';
import { normalIdConvert } from './id';
import { elementValueConvert } from './value';
import { ElementValuePairClass, elementValuePairsConvert } from './pair';
import { NormalLiteralClass } from './literal';

export abstract class ModifierElementClass<TType, TModifier> extends CommonClass {
    private type: TType;
    private modifier: TModifier;

    constructor(type: TType, modifier: TModifier) {
        super();
        this.type = type;
        this.modifier = modifier;
    }

    getType(): TType {
        return this.type;
    }

    getModifier(): TModifier {
        return this.modifier;
    }
}

export const isModifierElementClass = (
    target: CommonClass,
): target is ModifierElementClass<unknown, unknown> => {
    return isCommonClass(target, ModifierElementClass);
};

export class NormalModifierElementClass extends ModifierElementClass<'normal', string | null> {
    constructor(modifier: string | null) {
        super('normal', modifier);
    }
}

export const isNormalModifierElementClass = (
    target: CommonClass,
): target is NormalModifierElementClass => {
    return isCommonClass(target, NormalModifierElementClass);
};

export class AnnotationModifierElementClass extends ModifierElementClass<
    'annotation',
    AnnotationClass | null
> {
    constructor(modifier: AnnotationClass | null) {
        super('annotation', modifier);
    }
}

export const isAnnotationModifierElementClass = (
    target: CommonClass,
): target is AnnotationModifierElementClass => {
    return isCommonClass(target, AnnotationModifierElementClass);
};

export class NormalModifierClass extends CommonClass {
    private value: NormalModifierElementClass | AnnotationModifierElementClass | null = null;

    setValue(value: NormalModifierElementClass | AnnotationModifierElementClass | null): void {
        this.value = value;
    }

    getValue(): NormalModifierElementClass | AnnotationModifierElementClass | null {
        return this.value;
    }

    copy(commonClass: NormalModifierClass): void {
        this.setValue(commonClass.getValue());
    }
}

export const isNormalModifierClass = (target: CommonClass): target is NormalModifierClass => {
    return isCommonClass(target, NormalModifierClass);
};

export const normalModifierConvert = (
    target: NormalModifierTypeClass,
    errorClass: ErrorTypeClass[],
): NormalModifier | null => {
    const value = target.getValue();
    let modifier: NormalModifier | null = null;

    if (typeof value === 'string') {
        modifier = {
            type: 'modifier',
            value: value,
        };
    } else {
        const typeClass = toTypeClass(value, isAnnotationType, errorClass);
        if (typeClass) {
            const annotation = annotationConvert(typeClass, errorClass);
            if (annotation) {
                return {
                    type: 'annotation',
                    value: annotation,
                };
            }
        }
    }

    return modifier;
};

export class AnnotationClass extends CommonClass {
    private value: string | null = null;
    private param: NormalLiteral | ElementValuePair[] | null = null;

    setValue(value: string | null) {
        this.value = value;
    }

    setParam(param: NormalLiteral | ElementValuePair[] | null): void {
        this.param = param;
    }

    getValue(): string | null {
        return this.value;
    }

    getParam(): NormalLiteral | ElementValuePair[] | null {
        return this.param;
    }

    copy(commonClass: AnnotationClass): void {
        this.setValue(commonClass.getValue());
        this.setParam(commonClass.getParam());
    }
}

export const isAnnotationClass = (target: CommonClass): target is AnnotationClass => {
    return target instanceof AnnotationClass;
};

export const annotationConvert = (
    target: AnnotationTypeClass,
    errorClass: ErrorTypeClass[],
): Annotation | null => {
    const annotation: Annotation = {};

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        annotation.value = normalIdConvert(valueTypeClass);
    }

    const paramValue = target.getParam();
    if (paramValue) {
        const paramTypeClass = toTypeClass(
            paramValue,
            (target): target is ElementValueTypeClass | ElementValuePairsTypeClass =>
                isElementValueType(target) || isElementValuePairsType(target),
            errorClass,
        );
        if (paramTypeClass) {
            if (isElementValueType(paramTypeClass)) {
                const elementValue = elementValueConvert(paramTypeClass, errorClass);
                if (elementValue) {
                    annotation.param = elementValue;
                }
            }
            if (isElementValuePairsType(paramTypeClass)) {
                const elementValuePairs = elementValuePairsConvert(paramTypeClass, errorClass);
                if (elementValuePairs) {
                    annotation.param = elementValuePairs;
                }
            }
        }
    }

    return annotation;
};
