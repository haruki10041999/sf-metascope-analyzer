import { ModifierContext } from '@apexdevtools/apex-parser';

import { AnnotationTypeClass, ModifierTypeClass, ModifierVisitor, isAnnotationType } from '.';

import { CommonTypeClass, ErrorTypeClass, isErrorType } from '../commonVisitor';

type NormalModifierValueType =
    | 'GLOBAL'
    | 'PUBLIC'
    | 'PROTECTED'
    | 'PRIVATE'
    | 'TRANSIENT'
    | 'STATIC'
    | 'ABSTRACT'
    | 'FINAL'
    | 'WEBSERVICE'
    | 'OVERRIDE'
    | 'VIRTUAL'
    | 'TESTMETHOD'
    | 'WITH_SHARING'
    | 'WITHOUT_SHARING'
    | 'INHERITED'
    | AnnotationTypeClass;

export class NormalModifierTypeClass extends ModifierTypeClass<NormalModifierValueType> {
    private constructor(
        value: NormalModifierValueType | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('modifier', value, errorClasses);
    }

    static create(ctx: ModifierContext): NormalModifierTypeClass {
        if (
            !ctx.GLOBAL() &&
            !ctx.PUBLIC() &&
            !ctx.PROTECTED() &&
            !ctx.PRIVATE() &&
            !ctx.TRANSIENT() &&
            !ctx.STATIC() &&
            !ctx.ABSTRACT() &&
            !ctx.FINAL() &&
            !ctx.WEBSERVICE() &&
            !ctx.OVERRIDE() &&
            !ctx.VIRTUAL() &&
            !ctx.TESTMETHOD() &&
            !ctx.WITH() &&
            !ctx.WITHOUT() &&
            !ctx.INHERITED() &&
            !ctx.annotation()
        ) {
            throw new Error('値が異常です。ModifierContext: ' + ctx.getText());
        }

        let value: NormalModifierValueType | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        if (ctx.GLOBAL()) {
            value = 'GLOBAL';
        }
        if (ctx.PUBLIC()) {
            value = 'PUBLIC';
        }
        if (ctx.PROTECTED()) {
            value = 'PROTECTED';
        }
        if (ctx.PRIVATE()) {
            value = 'PRIVATE';
        }
        if (ctx.TRANSIENT()) {
            value = 'TRANSIENT';
        }
        if (ctx.STATIC()) {
            value = 'STATIC';
        }
        if (ctx.ABSTRACT()) {
            value = 'ABSTRACT';
        }
        if (ctx.FINAL()) {
            value = 'FINAL';
        }
        if (ctx.WEBSERVICE()) {
            value = 'WEBSERVICE';
        }
        if (ctx.OVERRIDE()) {
            value = 'OVERRIDE';
        }
        if (ctx.VIRTUAL()) {
            value = 'VIRTUAL';
        }
        if (ctx.TESTMETHOD()) {
            value = 'TESTMETHOD';
        }
        if (ctx.WITH() && ctx.SHARING()) {
            value = 'WITH_SHARING';
        }
        if (ctx.WITHOUT() && ctx.SHARING()) {
            value = 'WITHOUT_SHARING';
        }
        if (ctx.INHERITED()) {
            value = 'INHERITED';
        }
        if (ctx.annotation()) {
            const modifierTypeClass = new ModifierVisitor().visit(ctx.annotation());
            if (isAnnotationType(modifierTypeClass)) {
                value = modifierTypeClass;
            } else if (isErrorType(modifierTypeClass)) {
                errorClasses['value'] = modifierTypeClass;
            }
        }

        return new NormalModifierTypeClass(value, errorClasses);
    }
}

export const isNormalModifierType = (
    target: CommonTypeClass,
): target is NormalModifierTypeClass => {
    return target instanceof NormalModifierTypeClass;
};

