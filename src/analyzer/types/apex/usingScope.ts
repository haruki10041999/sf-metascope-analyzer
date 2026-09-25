import { UsingScopeContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from './idVisitor';

export type UsingScopeType = {
    type: 'usingScope';
    scope: Omit<IdType, 'type'>;
};

export const makeUsingScopeType = (ctx: UsingScopeContext): UsingScopeType => {
    const { type, ...scope } = new IdVisitor().visit(ctx.soqlId());

    return {
        type: 'usingScope',
        scope: scope,
    };
};
