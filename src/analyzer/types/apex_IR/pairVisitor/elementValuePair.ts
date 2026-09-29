import { ElementValuePairContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { ValueType, ValueVisitor } from '../valueVisitor';

export type ElementValuePairType = {
    type: 'elementValuePair';
    name: IdType;
    value?: ValueType;
};

export const makeElementValuePairType = (ctx: ElementValuePairContext): ElementValuePairType => {
    if (!ctx.id()) {
        throw new Error('値が異常です。ElementValuePairContext: ' + ctx.getText());
    }

    const name = new IdVisitor().visit(ctx.id());
    const elementValuePairType: ElementValuePairType = {
        type: 'elementValuePair',
        name: name,
    };

    if (ctx.ASSIGN() && ctx.elementValue()) {
        elementValuePairType.value = new ValueVisitor().visit(ctx.elementValue());
    }
    return elementValuePairType;
};
