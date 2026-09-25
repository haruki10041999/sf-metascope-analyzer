import { MapCreatorRestPairContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type MapCreatorPairType = {
    type: 'mapCreatorPair';
    name: Omit<ExpressionType, 'type'>;
    value: Omit<ExpressionType, 'type'>;
};

export const makeMapCreatorPairType = (ctx: MapCreatorRestPairContext): MapCreatorPairType => {
    const name = new ExpressionVisitor().visit(ctx.expression(0));
    const value = new ExpressionVisitor().visit(ctx.expression(1));
    return {
        type: 'mapCreatorPair',
        name: name,
        value: value,
    };
};
