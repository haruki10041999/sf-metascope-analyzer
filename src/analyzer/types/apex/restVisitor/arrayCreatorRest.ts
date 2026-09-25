import { ArrayCreatorRestContext } from '@apexdevtools/apex-parser';

import { ExpressionType, ExpressionVisitor } from '../expressionVisitor';

import { ArrayInitializerType, makeArrayInitializerType } from '../arrayInitializer';

export type ArrayCreatorRestType = {
    type: 'arrayCreatorRest';
    initialValue: Omit<ArrayInitializerType, 'type'>;
    maxElementSize?: Omit<ExpressionType, 'type'>;
};

export const makeArrayCreatorRestType = (ctx: ArrayCreatorRestContext): ArrayCreatorRestType => {
    const { type: _, ...initialValue } = makeArrayInitializerType(ctx.arrayInitializer());

    const arrayCreatorRestType: ArrayCreatorRestType = {
        type: 'arrayCreatorRest',
        initialValue: initialValue,
    };

    if (ctx.arrayInitializer()) {
        const { type, ...maxElementSize } = new ExpressionVisitor().visit(ctx.expression());
        arrayCreatorRestType.maxElementSize = maxElementSize;
    }

    return arrayCreatorRestType;
};
