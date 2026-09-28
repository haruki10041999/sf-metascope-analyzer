import { ModifierContext } from '@apexdevtools/apex-parser';

import { ModifierType as modifierType, ModifierVisitor } from '.';

type ModifierField =
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

export type ModifierType = {
    type: 'modifier';
    modifier: {
        type: ModifierField;
        annotation?: modifierType;
    };
};

export const makeModifierType = (ctx: ModifierContext): ModifierType => {
    let type: 'NONE' | ModifierField = 'NONE';

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

    if (type === 'NONE') {
        throw new Error('値が異常です。ModifierContext: ' + ctx.getText());
    }

    const modifierField: ModifierType = {
        type: 'modifier',
        modifier: {
            type: type,
        },
    };

    if (ctx.annotation()) {
        modifierField.modifier.annotation = new ModifierVisitor().visit(ctx.annotation());
    }

    return modifierField;
};

