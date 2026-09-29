import { SetCreatorRestContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type SetCreatorRestType = {
    type: 'setCreatorRest';
    rest: ExpressionType[];
};

export const makeSetCreatorRestType = (ctx: SetCreatorRestContext): SetCreatorRestType => {
    if (!ctx.expression_list() || ctx.expression_list().length === 0) {
        throw new Error('値が異常です。SetCreatorRestContext: ' + ctx.getText());
    }

    const initialValue = ctx.expression_list().map((expressionCtx) => {
        const value = new ExpressionVisitor().visit(expressionCtx);
        return value;
    });

    return {
        type: 'setCreatorRest',
        rest: initialValue,
    };
};

