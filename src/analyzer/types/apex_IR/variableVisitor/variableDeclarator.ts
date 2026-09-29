import { VariableDeclaratorContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type VariableDeclaratorType = {
    type: 'variableDeclarator';
    variable: {
        name: IdType;
        value?: ExpressionType;
    };
};

export const makeVariableDeclaratorType = (
    ctx: VariableDeclaratorContext,
): VariableDeclaratorType => {
    if (!ctx.id()) {
        throw new Error('値が異常です。VariableDeclaratorContext: ' + ctx.getText());
    }

    const name = new IdVisitor().visit(ctx.id());

    const variableDeclaratorType: VariableDeclaratorType = {
        type: 'variableDeclarator',
        variable: {
            name: name,
        },
    };

    if (ctx.ASSIGN() && ctx.expression()) {
        const value = new ExpressionVisitor().visit(ctx.expression());
        variableDeclaratorType.variable.value = value;
    }

    return variableDeclaratorType;
};
