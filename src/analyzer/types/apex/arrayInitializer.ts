import { ArrayInitializerContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from './expressionVisitor';

export type ArrayInitializerType = {
    type: 'arrayInitializer';
    values: Omit<ExpressionType, 'type'>;
};

export const makeArrayInitializerType = (ctx: ArrayInitializerContext): ArrayInitializerType => {
    return {
        type: 'arrayInitializer',
        values: ctx.expression_list().map((expressionCtx) => {
            const { type, ...value } = new ExpressionVisitor().visit(expressionCtx);
            return value;
        }),
    };
};
