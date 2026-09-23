import { ModifierContext } from '@apexdevtools/apex-parser';

import { AnnotationField, makeAnnotationField } from './annotation';

type ModifierType =
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
    | 'INHERITED';

export type ModifierField = {
    type: 'NONE' | ModifierType;
    annotaition?: AnnotationField;
};

export const makeModifierField = (ctx: ModifierContext): ModifierField => {
    let type: 'NONE' | ModifierType = 'NONE';

    if (ctx.GLOBAL()) {
        type = 'GLOBAL';
    }
    if (ctx.PUBLIC()) {
        type = 'PUBLIC';
    }
    if (ctx.PROTECTED()) {
        type = 'PROTECTED';
    }
    if (ctx.PRIVATE()) {
        type = 'PRIVATE';
    }
    if (ctx.TRANSIENT()) {
        type = 'TRANSIENT';
    }
    if (ctx.STATIC()) {
        type = 'STATIC';
    }
    if (ctx.ABSTRACT()) {
        type = 'ABSTRACT';
    }
    if (ctx.FINAL()) {
        type = 'FINAL';
    }
    if (ctx.WEBSERVICE()) {
        type = 'WEBSERVICE';
    }
    if (ctx.OVERRIDE()) {
        type = 'OVERRIDE';
    }
    if (ctx.VIRTUAL()) {
        type = 'VIRTUAL';
    }
    if (ctx.TESTMETHOD()) {
        type = 'TESTMETHOD';
    }

    if (ctx.WITH() && ctx.SHARING()) {
        type = 'WITH_SHARING';
    }

    if (ctx.WITHOUT() && ctx.SHARING()) {
        type = 'WITHOUT_SHARING';
    }

    if (ctx.INHERITED()) {
        type = 'INHERITED';
    }

    const modifierField: ModifierField = {
        type: type,
    };

    if (ctx.annotation()) {
        modifierField.annotaition = makeAnnotationField(ctx.annotation());
    }

    return modifierField;
};
