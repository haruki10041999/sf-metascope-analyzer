import { ModifierContext } from '@apexdevtools/apex-parser';

import { AnnotationTypeClass, ModifierTypeClass, ModifierVisitor, isAnnotationType } from '.';

import { CommonTypeClass, ErrorTypeClass, isErrorType, isValidClass } from '../commonVisitor';

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
    private constructor(value: NormalModifierValueType | ErrorTypeClass) {
        super('modifier', value);
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

        let value: NormalModifierValueType | ErrorTypeClass;
        if (ctx.GLOBAL()) {
            value = 'GLOBAL';
        } else if (ctx.PUBLIC()) {
            value = 'PUBLIC';
        } else if (ctx.PROTECTED()) {
            value = 'PROTECTED';
        } else if (ctx.PRIVATE()) {
            value = 'PRIVATE';
        } else if (ctx.TRANSIENT()) {
            value = 'TRANSIENT';
        } else if (ctx.STATIC()) {
            value = 'STATIC';
        } else if (ctx.ABSTRACT()) {
            value = 'ABSTRACT';
        } else if (ctx.FINAL()) {
            value = 'FINAL';
        } else if (ctx.WEBSERVICE()) {
            value = 'WEBSERVICE';
        } else if (ctx.OVERRIDE()) {
            value = 'OVERRIDE';
        } else if (ctx.VIRTUAL()) {
            value = 'VIRTUAL';
        } else if (ctx.TESTMETHOD()) {
            value = 'TESTMETHOD';
        } else if (ctx.WITH() && ctx.SHARING()) {
            value = 'WITH_SHARING';
        } else if (ctx.WITHOUT() && ctx.SHARING()) {
            value = 'WITHOUT_SHARING';
        } else if (ctx.INHERITED()) {
            value = 'INHERITED';
        } else {
            value = isValidClass(
                new ModifierVisitor().visit(ctx.annotation()),
                isAnnotationType,
                'annotation',
            );
        }

        return new NormalModifierTypeClass(value);
    }
}

export const isNormalModifierType = (
    target: CommonTypeClass,
): target is NormalModifierTypeClass => {
    return target instanceof NormalModifierTypeClass;
};
