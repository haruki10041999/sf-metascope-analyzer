import { MapCreatorRestPairContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type MapCreatorPairType = {
    type: 'mapCreatorPair';
    pair: {
        name: ExpressionType;
        value: ExpressionType;
    };
};

export const makeMapCreatorPairType = (ctx: MapCreatorRestPairContext): MapCreatorPairType => {
    const name = new ExpressionVisitor().visit(ctx.expression(0));
    const value = new ExpressionVisitor().visit(ctx.expression(1));
    return {
        type: 'mapCreatorPair',
        pair: {
            name: name,
            value: value,
        },
    };
};
