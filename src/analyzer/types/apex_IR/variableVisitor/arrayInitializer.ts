import { ArrayInitializerContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type ArrayInitializerType = {
    type: 'arrayInitializer';
    variable: ExpressionType[];
};

export const makeArrayInitializerType = (ctx: ArrayInitializerContext): ArrayInitializerType => {
    if (!ctx.expression_list() || ctx.expression_list().length === 0) {
        throw new Error('値が異常です。ArrayInitializerContext: ' + ctx.getText());
    }

    return {
        type: 'arrayInitializer',
        variable: ctx.expression_list().map((expressionCtx) => {
            const value = new ExpressionVisitor().visit(expressionCtx);
            return value;
        }),
    };
};

