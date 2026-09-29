import { ArrayCreatorRestContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';
import { VariableType, VariableVisitor } from '../variableVisitor';

export type ArrayCreatorRestType = {
    type: 'arrayCreatorRest';
    rest: {
        initialValue?: VariableType;
        maxElementSize: ExpressionType | 'auto';
    };
};

export const makeArrayCreatorRestType = (ctx: ArrayCreatorRestContext): ArrayCreatorRestType => {
    if (!ctx) {
        throw new Error('値が異常です。ArrayCreatorRestContext: ' + ctx);
    }

    let maxElementSize: ExpressionType | 'auto' = 'auto';
    if (ctx.expression()) {
        maxElementSize = new ExpressionVisitor().visit(ctx.expression());
    }

    const arrayCreatorRestType: ArrayCreatorRestType = {
        type: 'arrayCreatorRest',
        rest: {
            maxElementSize: maxElementSize,
        },
    };

    if (ctx.arrayInitializer()) {
        const initialValue = new VariableVisitor().visit(ctx.arrayInitializer());
        arrayCreatorRestType.rest.initialValue = initialValue;
    }

    return arrayCreatorRestType;
};

