import { ElementValuePairsContext } from '@apexdevtools/apex-parser';

import { PairType, PairVisitor } from '.';

export type ElementValuePairsType = {
    type: 'elementValuePairs';
    pair: PairType[];
};

export const makeElementValuePairsType = (ctx: ElementValuePairsContext): ElementValuePairsType => {
    const pairs = ctx.elementValuePair_list().map((pairCtx) => {
        const pair = new PairVisitor().visit(pairCtx);
        return pair;
    });
    return {
        type: 'elementValuePairs',
        pair: pairs,
    };
};
