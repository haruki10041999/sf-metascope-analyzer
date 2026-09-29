import { UsingScopeContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';

export type UsingScopeType = {
    type: 'usingScope';
    clause: IdType;
};

export const makeUsingScopeType = (ctx: UsingScopeContext): UsingScopeType => {
    if (!ctx.soqlId()) {
        throw new Error('値が異常です。UsingScopeContext: ' + ctx.getText());
    }

    const scope = new IdVisitor().visit(ctx.soqlId());

    return {
        type: 'usingScope',
        clause: scope,
    };
};

