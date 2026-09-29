import { DotExpressionContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { ExpressionType, ExpressionVisitor } from '.';
import { CallType, CallVisitor } from '../callVisitor';

export type DotExpressionType = {
    type: 'dotExpression';
    expression: {
        left: ExpressionType;
        operator: '.' | '?.';
        right: IdType | CallType;
    };
};

export const makeDotExpressionType = (ctx: DotExpressionContext): DotExpressionType => {
    const expression = new ExpressionVisitor().visit(ctx.expression());

    let operator: '.' | '?.' | undefined = undefined;
    if (ctx.DOT()) {
        operator = '.';
    }

    if (ctx.QUESTIONDOT()) {
        operator = '?.';
    }

    let right: IdType | CallType | undefined = undefined;

    if (ctx.anyId()) {
        right = new IdVisitor().visit(ctx.anyId());
    }

    if (ctx.dotMethodCall()) {
        right = new CallVisitor().visit(ctx.dotMethodCall());
    }

    if (!operator || !right) {
        throw new Error('値が異常です。DotExpressionContext: ' + ctx.getText());
    }

    return {
        type: 'dotExpression',
        expression: {
            left: expression,
            operator: operator,
            right: right,
        },
    };
};
