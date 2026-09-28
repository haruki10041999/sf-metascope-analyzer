import { ArrayCreatorRestContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';
import { VariableType, VariableVisitor } from '../variableVisitor';

export type ArrayCreatorRestType = {
    type: 'arrayCreatorRest';
    rest: {
        initialValue: VariableType;
        maxElementSize?: ExpressionType;
    };
};

export const makeArrayCreatorRestType = (ctx: ArrayCreatorRestContext): ArrayCreatorRestType => {
    const initialValue = new VariableVisitor().visit(ctx.arrayInitializer());

    const arrayCreatorRestType: ArrayCreatorRestType = {
        type: 'arrayCreatorRest',
        rest: {
            initialValue: initialValue,
        },
    };

    if (ctx.arrayInitializer()) {
        const maxElementSize = new ExpressionVisitor().visit(ctx.expression());
        arrayCreatorRestType.rest.maxElementSize = maxElementSize;
    }

    return arrayCreatorRestType;
};

