import { ArrayInitializerContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

export type ArrayInitializerType = {
    type: 'arrayInitializer';
    valiable: ExpressionType[];
};

export const makeArrayInitializerType = (ctx: ArrayInitializerContext): ArrayInitializerType => {
    return {
        type: 'arrayInitializer',
        valiable: ctx.expression_list().map((expressionCtx) => {
            const value = new ExpressionVisitor().visit(expressionCtx);
            return value;
        }),
    };
};

