import { DotExpressionContext } from '@apexdevtools/apex-parser';

import { CallType, CallVisitor } from '../callVisitor';

export type DotExpressionType = {
    type: 'dotExpression';
    expression: CallType;
};

export const makeDotExpressionType = (ctx: DotExpressionContext): DotExpressionType => {
    const expression = new CallVisitor().visit(ctx.dotMethodCall());

    return {
        type: 'dotExpression',
        expression: expression,
    };
};

