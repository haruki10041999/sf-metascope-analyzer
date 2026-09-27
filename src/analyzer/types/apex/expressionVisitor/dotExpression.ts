import { DotExpressionContext } from '@apexdevtools/apex-parser';

import { CallType, CallVisitor } from '../callVisitor';

export type DotExpressionType = {
    type: 'dotExpression';
    dotMethodCall: Omit<CallType, 'type'>;
};

export const makeDotExpressionType = (ctx: DotExpressionContext): DotExpressionType => {
    const { type, ...dotMethodCall } = new CallVisitor().visit(ctx.dotMethodCall());

    return {
        type: 'dotExpression',
        dotMethodCall: dotMethodCall,
    };
};
