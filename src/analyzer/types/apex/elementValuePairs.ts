import { ElementValuePairsContext } from '@apexdevtools/apex-parser';

import { PairType, PairVisitor } from './pairVisitor';

export type ElementValuePairsType = {
    type: 'elementValuePairs';
    pairs: Omit<PairType, 'type'>[];
};

export const makeElementValuePairsType = (ctx: ElementValuePairsContext): ElementValuePairsType => {
    const pairs = ctx.elementValuePair_list().map((pairCtx) => {
        const { type, ...pair } = new PairVisitor().visit(pairCtx);
        return pair;
    });
    return {
        type: 'elementValuePairs',
        pairs: pairs,
    };
};
