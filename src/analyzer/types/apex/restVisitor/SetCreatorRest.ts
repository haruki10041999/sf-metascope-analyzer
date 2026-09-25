import { SetCreatorRestContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type SetCreatorRestType = {
    type: 'setCreatorRest';
    initialValue: Omit<ExpressionType, 'type'>[];
};

export const makeSetCreatorRestType = (ctx: SetCreatorRestContext): SetCreatorRestType => {
    const initialValue = ctx.expression_list().map((expressionCtx) => {
        const { type, ...value } = new ExpressionVisitor().visit(expressionCtx);
        return value;
    });

    return {
        type: 'setCreatorRest',
        initialValue: initialValue,
    };
};
