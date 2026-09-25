import { VariableDeclaratorContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from './idVisitor';
import { ExpressionType, ExpressionVisitor } from './expressionVisitor';

export type VariableDeclaratorType = {
    type: 'variableDeclarator';
    variant: Omit<IdType, 'type'>;
    value?: Omit<ExpressionType, 'type'>;
};

export const makeVariableDeclaratorType = (
    ctx: VariableDeclaratorContext,
): VariableDeclaratorType => {
    const { type, ...variant } = new IdVisitor().visit(ctx.id());

    const variableDeclaratorType: VariableDeclaratorType = {
        type: 'variableDeclarator',
        variant: variant,
    };

    if (ctx.ASSIGN() && ctx.expression()) {
        const { type, ...value } = new ExpressionVisitor().visit(ctx.expression());
        variableDeclaratorType.value = value;
    }

    return variableDeclaratorType;
};
