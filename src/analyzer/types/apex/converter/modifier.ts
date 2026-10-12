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
import {
    ElementValuePairClass,
    elementValuePairsConvert,
    isElementValuePairClassArray,
} from './pair';
import { isNormalLiteralClass, NormalLiteralClass } from './literal';

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

export class NormalModifierElementClass extends ModifierElementClass<'normal', string> {
    constructor(modifier: string) {
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
    AnnotationClass
> {
    constructor(modifier: AnnotationClass) {
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

export const isNormalModifierClass = (target: any): target is NormalModifierClass => {
    return isCommonClass(target, NormalModifierClass);
};

export const isNormalModifierClassArray = (target: any): target is NormalModifierClass[] => {
    return Array.isArray(target) && target.every((t) => isNormalModifierClass(t));
};

export const normalModifierConvert = (
    target: NormalModifierTypeClass,
    errorClass: ErrorTypeClass[],
): NormalModifierClass => {
    const normalModifier = new NormalModifierClass();

    const value = target.getValue();
    if (typeof value === 'string') {
        normalModifier.setValue(new NormalModifierElementClass(value));
    } else {
        const valueTypeClass = toTypeClass(value, isAnnotationType, errorClass);
        if (valueTypeClass) {
            normalModifier.setValue(
                new AnnotationModifierElementClass(annotationConvert(valueTypeClass, errorClass)),
            );
        }
    }

    return normalModifier;
};

export class AnnotationClass extends CommonClass {
    private value: string | null = null;
    private param: NormalLiteralClass | ElementValuePairClass[] | null = null;

    setValue(value: string | null) {
        this.value = value;
    }

    setParam(param: NormalLiteralClass | ElementValuePairClass[] | null): void {
        if (isNormalLiteralClass(this.param) && isNormalLiteralClass(param)) {
            this.param.copy(param);
        } else if (
            isElementValuePairClassArray(param) &&
            isElementValuePairClassArray(this.param)
        ) {
            this.param.push(...param);
        } else {
            this.param = param;
        }
    }

    getValue(): string | null {
        return this.value;
    }

    getParam(): NormalLiteralClass | ElementValuePairClass[] | null {
        return this.param;
    }

    copy(commonClass: AnnotationClass): void {
        this.setValue(commonClass.getValue());
        this.setParam(commonClass.getParam());
    }
}

export const isAnnotationClass = (target: any): target is AnnotationClass => {
    return isCommonClass(target, AnnotationClass);
};

export const isAnnotationClassArray = (target: any): target is AnnotationClass[] => {
    return Array.isArray(target) && target.every((t) => isAnnotationClass(t));
};

export const isAnotationParam = (
    target: any,
): target is NormalLiteralClass | ElementValuePairClass[] => {
    return isNormalLiteralClass(target) || isElementValuePairClassArray(target);
};

export const annotationConvert = (
    target: AnnotationTypeClass,
    errorClass: ErrorTypeClass[],
): AnnotationClass => {
    const annotation = new AnnotationClass();

    const valueTypeClass = toTypeClass(target.getValue(), isNormalIdType, errorClass);
    if (valueTypeClass) {
        annotation.setValue(normalIdConvert(valueTypeClass));
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
                annotation.setParam(elementValueConvert(paramTypeClass, errorClass));
            }
            if (isElementValuePairsType(paramTypeClass)) {
                annotation.setParam(elementValuePairsConvert(paramTypeClass, errorClass));
            }
        }
    }

    return annotation;
};
