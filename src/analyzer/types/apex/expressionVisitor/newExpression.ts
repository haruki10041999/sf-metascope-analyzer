import { NewExpressionContext } from '@apexdevtools/apex-parser';

import { CreatorType, makeCreatorType } from '../creator';

export type NewExpressionType = {
    type: 'newExpression';
    creator: Omit<CreatorType, 'type'>;
};

export const makeNewExpressionType = (ctx: NewExpressionContext): NewExpressionType => {
    const { type, ...creator } = makeCreatorType(ctx.creator());

    return {
        type: 'newExpression',
        creator: creator,
    };
};
